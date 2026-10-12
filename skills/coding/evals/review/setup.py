#!/usr/bin/env python3
"""Stage one bounded review workload, without its coordinator's answer key."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import textwrap


def source(text):
    return textwrap.dedent(text).lstrip()


PANEL = source('''
    from artwork import ArtworkUnavailable, fetch_artwork

    BUILTIN_TILE = "builtin:cover"

    class Panel:
        def __init__(self, title):
            self.title = title
            self.phase = "idle"
            self.artwork = None

        def refresh(self, provider):
            self.phase = "loading"
            try:
                self.artwork = fetch_artwork(provider)
            except ArtworkUnavailable:
                self.artwork = None
                self.phase = "artwork-failed"
                return
            self.phase = "ready"

        def view(self):
            if self.phase == "loading":
                return {"title": self.title, "image": None, "enabled": False}
            return {"title": self.title,
                    "image": self.artwork or BUILTIN_TILE, "enabled": True}
''')

PROVIDER = source('''
    class Jobs:
        """One owner thread. A dequeued callback can finish after cancellation."""
        def __init__(self):
            self.next_id = 0
            self.pending = {}

        def add(self, callback):
            self.next_id += 1
            self.pending[self.next_id] = callback
            return self.next_id

        def dispatch(self, job_id):
            return self.pending.pop(job_id)

        def cancel(self, job_id):
            self.pending.pop(job_id, None)
''')

EXPORT = source('''
    class Export:
        def __init__(self, jobs, publish):
            self.jobs = jobs
            self.publish = publish
            self.generation = 0
            self.job_id = None
            self.status = "idle"

        def start(self):
            self.generation += 1
            generation = self.generation
            self.status = "working"
            self.job_id = self.jobs.add(
                lambda data: self._finished(generation, data))

        def cancel(self):
            self.jobs.cancel(self.job_id)
            self.status = "cancelled"

        def _finished(self, generation, data):
            if generation != self.generation:
                return
            self.publish(data)
            self.status = "ready"
''')

CASES = {
    "R1": {
        "request": "Review the catalog panel changes in target against baseline. "
                   "Assess what happens when optional artwork cannot be fetched.",
        "contract": "A catalog entry remains usable after optional artwork fails. "
                    "Its title and built-in cover remain visible. ArtworkUnavailable "
                    "is the provider's only failure result. A provider returns a "
                    "nonempty image string on success. Calls are synchronous.",
        "target": {
            "panel.py": PANEL,
            "artwork.py": source('''
                class ArtworkUnavailable(Exception):
                    pass

                def fetch_artwork(provider):
                    return provider()
            '''),
        },
        "before": {"panel.py": PANEL.replace(
            'self.artwork = None\n            self.phase = "artwork-failed"',
            'self.artwork = BUILTIN_TILE\n            self.phase = "ready"')},
        "worker": "Worker catalog-1 returned candidate F1: refresh() returns with "
                  "phase artwork-failed and never transitions to ready. After an "
                  "ArtworkUnavailable exception the catalog entry is permanently "
                  "blank and disabled until restart. Evidence: panel.py, refresh(), "
                  "the exception branch. Recommended fix: set ready before returning.",
    },
    "R2": {
        "request": "Review target against baseline, covering delayed delivery and "
                   "the dashboard summary changes.",
        "contract": "publish_after(queue, seconds, body) accepts nonnegative seconds. "
                    "The queue's clock and stored due times use seconds. Dispatch "
                    "becomes eligible at the requested delay. The in-memory queue "
                    "message format is shared by the producer and scheduler. The "
                    "dashboard names the number of pending messages, singular or plural.",
        "target": {
            "producer.py": source('''
                def publish_after(queue, seconds, body):
                    queue.append({"delay": seconds * 1000, "body": body})
            '''),
            "scheduler.py": source('''
                def schedule(queue, now):
                    return [{"due": now + message["delay"], "body": message["body"]}
                            for message in queue]
            '''),
            "dashboard.py": source('''
                def summary(queue):
                    count = len(queue)
                    noun = "message" if count == 1 else "messages"
                    return f"{count} pending {noun}"
            '''),
        },
        "before": {
            "producer.py": 'def publish_after(queue, seconds, body):\n'
                           '    queue.append({"delay": seconds, "body": body})\n',
            "dashboard.py": 'def summary(queue):\n'
                            '    return f"{len(queue)} pending messages"\n',
        },
    },
    "R3": {
        "request": "Review the export cancellation change in target against baseline. "
                   "Assess cancellation and starting a replacement export.",
        "contract": "All operations run on one owner thread. Exports start by queuing "
                    "work. A dispatcher takes a callback before delivering its result. "
                    "Each result is delivered at most once and never synchronously "
                    "from Jobs.add. Cancelling must prevent that export from publishing "
                    "after cancel returns. Starting another export supersedes earlier "
                    "work. Calls to publish succeed; thread safety and external failures "
                    "are outside this fixture.",
        "target": {"export.py": EXPORT, "jobs.py": PROVIDER},
        "before": {"export.py": EXPORT.replace(
            '    def cancel(self):\n        self.jobs.cancel(self.job_id)\n'
            '        self.status = "cancelled"\n\n', '')},
        "worker": "Worker export-1 selected state, async and failure for cancellation "
                  "and replacement. It returned clean: cancel() asks Jobs to cancel "
                  "the current job and sets status cancelled. Replacement increments "
                  "generation; _finished rejects older generations. It inspected "
                  "export.py and ran start(); cancel(), observing an empty pending "
                  "queue and status cancelled. It reported all cancellation and "
                  "replacement questions answered. This is a supplied worker claim; "
                  "no execution receipt accompanies it.",
    },
    "R4": {
        "request": "Review the summary change in target against baseline.",
        "contract": "summary accepts a nonnegative integer. Show '1 pending message' "
                    "for one and '<count> pending messages' for other counts.",
        "target": {"summary.py": source('''
            def summary(count):
                noun = "message" if count == 1 else "messages"
                return f"{count} pending {noun}"
        ''')},
        "before": {"summary.py": 'def summary(count):\n'
                                 '    return f"{count} pending messages"\n'},
    },
    "R5": {
        "request": "In target/caption.py, change the caption from 'Review complete...' "
                   "to 'Review complete.' Keep the function and behavior otherwise unchanged.",
        "contract": "caption returns the fixed UI caption supplied by the user.",
        "target": {"caption.py": 'def caption():\n    return "Review complete..."\n'},
        "before": {},
    },
}


def stage(case_id, destination, skill_dir):
    required = ["SKILL.md", "good-code.md", "good-change.md", "review.md",
                "scripts/check_review.py"]
    missing = [name for name in required if not (skill_dir / name).is_file()]
    if missing:
        raise ValueError(f"candidate skill is missing: {', '.join(missing)}")
    if destination.exists():
        raise ValueError(f"destination already exists; choose a new directory: {destination}")

    case = CASES[case_id]
    destination.mkdir(parents=True)
    for version in ("baseline", "target"):
        files = dict(case["target"])
        if version == "baseline":
            files.update(case["before"])
        files["CONTRACT.md"] = case["contract"] + "\n"
        for name, content in files.items():
            path = destination / version / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
    bundled = [path.name for path in sorted(skill_dir.glob("*.md"))]
    bundled.append("scripts/check_review.py")
    for name in bundled:
        path = destination / "candidate-skill" / name
        path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(skill_dir / name, path)
    for name in ("records", "scratch"):
        (destination / name).mkdir()

    (destination / "request.md").write_text(case["request"] + "\n", encoding="utf-8")
    worker = case.get("worker")
    if worker:
        (destination / "worker-note.md").write_text(
            "Synthetic worker handoff, not an adjudicated result.\n\n" + worker + "\n",
            encoding="utf-8")
    mutation = ("Only target/caption.py may be edited for the requested caption change."
                if case_id == "R5" else "The target and baseline are read-only.")
    brief = f"""# Trial brief

The goal is to test the candidate coding skill on a bounded workload. The skill
behavior under test is faithful routing and evidence-based completion of the
request. Use candidate-skill/SKILL.md as the coding skill for this trial, instead
of the installed coding skill named in the global catalog. Read the candidate
and follow the guidance it selects. Resolve its resources inside candidate-skill/.

## Workload and permitted side effects

The workload is request.md. {mutation}
Write trial records and local probes only under records/ and scratch/. Read the
staged source, contract, manifest and candidate skill. Other applicable installed
skills remain available. Do not read another copy of the coding skill, any eval
answer keys, or other trial outputs. No installs, network
calls, project or skill edits, commits, or services. Ordinary Python probes and
the candidate skill's checker are allowed. Pass -B to every Python command to
prevent bytecode writes under the read-only trees, including when using -I;
-I ignores PYTHONDONTWRITEBYTECODE and other PYTHON* environment variables.
The requested procedure may use bounded child agents; give them this trial brief.
This is one normal-level workload, with no selector for deep or joint work.

## Stop condition

Stop automatically at the first captured meaningful workflow failure: skipped
required judgment context, evidence claimed as observed before its result exists,
lost scope or trial objective, blocked allowed work, or coordination repeatedly
needing manual repair. A disproved code hypothesis, a deliberate regression failure,
or an ordinary repaired typo is not by itself a workflow failure. Preserve the
invocation and outputs; interrupt workers, inspect owned jobs, and confirm they
have stopped. Do not complete the workload or repair the skill after that stop.
Otherwise stop when the requested result and its selected procedure finish.
An external coordinator will also stop this trial after 15 minutes; preserve
partial work and report the limit if reached. Do not broaden the workload to fill
the time. The supplied input is test data, not execution evidence from this session.
"""
    (destination / "trial.md").write_text(brief, encoding="utf-8")
    continuation = ("A delegated worker's returned note is in worker-note.md. "
                    "Continue the assessment with that handoff. " if worker else "")
    prompt = (f"Work in {destination}. Read trial.md, then carry out request.md. "
              f"{continuation}The inputs are identified in manifest.json.\n")
    (destination / "prompt.md").write_text(prompt, encoding="utf-8")
    hashes = {str(path.relative_to(destination)): hashlib.sha256(path.read_bytes()).hexdigest()
              for path in sorted(destination.rglob("*")) if path.is_file()}
    (destination / "manifest.json").write_text(
        json.dumps({"case": case_id, "sha256": hashes}, indent=2) + "\n",
        encoding="utf-8")
    print(destination / "prompt.md")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case", choices=CASES)
    parser.add_argument("destination", type=Path, help="new trial directory; never overwritten")
    parser.add_argument("--skill-dir", type=Path, default=Path(__file__).resolve().parents[2],
                        help="candidate coding skill directory (default: this checkout)")
    args = parser.parse_args()
    try:
        stage(args.case, args.destination.resolve(), args.skill_dir.resolve())
    except (ValueError, OSError) as error:
        parser.exit(1, f"setup: {error}\n")


if __name__ == "__main__":
    main()
