#!/usr/bin/env python3
"""Stage one re-verification case; launch nothing."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent
CASES = ("R6", "R7", "R8")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def check_frozen_inputs():
    manifest_path = ROOT / "fixture-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    actual = {path.relative_to(ROOT).as_posix() for path in (ROOT / "cases").rglob("*") if path.is_file()}
    actual.add("records.py")
    if actual != set(manifest):
        raise ValueError("frozen fixture file inventory changed")
    for name, expected in manifest.items():
        if digest(ROOT / name) != expected:
            raise ValueError(f"frozen fixture changed: {name}")
    return digest(manifest_path)


def write_json(path, value, indent=2):
    path.write_text(json.dumps(value, indent=indent) + "\n", encoding="utf-8")


def stage_records(case, destination, verifier_actor):
    definitions = module("reverification_records", ROOT / "records.py")
    checker = module("candidate_review_checker",
                     destination / "candidate-skill/scripts/check_review.py")
    if not hasattr(checker, "retain_verdicts"):
        raise ValueError("candidate checker does not support prior-verdict updates")
    ids, always = checker.selection_rules()
    source = next((destination / "source").glob("*.py"))
    target = source.relative_to(destination).as_posix() + " @ sha256:" + digest(source)
    prior, current = definitions.assessments(case, ids, target)
    selection = {"phase": "selection", "actor": verifier_actor,
                 **{key: prior[key] for key in checker.CONTEXT_FIELDS},
                 "checks": prior["checks"]}
    fixtures = destination / "fixtures"
    fixtures.mkdir()
    for name, record, indent in (("prior-assessment.json", prior, 2),
                                 ("current-assessment.json", current, 4 if case == "R8" else 2),
                                 ("selection.json", selection, 2)):
        checker.validate(record, ids, always)
        write_json(fixtures / name, record, indent)
    prior_hash = digest(fixtures / "prior-assessment.json")
    selection_hash = digest(fixtures / "selection.json")
    verification = checker.template("verification", ids, always, prior, selection,
                                    prior_hash, selection_hash)
    by_question = {row["id"]: row for row in prior["answers"]}
    by_finding = {row["id"]: row for row in prior["findings"]}
    by_check = {row["id"]: row for row in prior["checks"]}
    for row in verification["checks"]:
        row.update(verdict="supported", next="",
                   reason="Synthetic prior fixture: " + by_check[row["id"]]["basis"])
    for row in verification["questions"]:
        row.update(verdict="supported", next="",
                   reason="Synthetic prior fixture accepted this source argument: " + by_question[row["id"]]["evidence"])
    for row in verification["findings"]:
        finding = by_finding[row["id"]]
        row.update(verdict="supported", next="", impact=finding["consequence"],
                   reason="Synthetic prior fixture: " + finding["evidence"])
    checker.validate(verification, ids, always)
    checker.verify_links(verification, prior, selection, prior_hash, selection_hash)
    checker.complete(verification, prior)
    checker.pair(current, selection)
    write_json(fixtures / "prior-verification.json", verification)
    (fixtures / "README.md").write_text(
        "# Synthetic prior-stage fixtures\n\n"
        "These four JSON records were constructed by the eval coordinator. They are\n"
        "inputs for a bounded continuation simulation, not outputs of a previous\n"
        "live reviewer or evidence of historical context independence. Their source\n"
        "arguments are claims for you to assess, not returned runtime observations.\n\n"
        f"Your assigned verifier identity for this simulation is `{verifier_actor}`.\n"
        "The selection and prior verification use that role to exercise same-reader\n"
        "record reuse. Assessment and answer actors name synthetic contributors;\n"
        "preserve those declared origins. Do not claim that those contributors ran\n"
        "during this session or that the fixture selection was your live blind pass.\n",
        encoding="utf-8")


def stage(case, destination, skill_dir, guidance_version, verifier_actor):
    if destination.exists():
        raise ValueError(f"destination already exists: {destination}")
    if not guidance_version.strip():
        raise ValueError("guidance-version must identify the frozen candidate snapshot")
    if not verifier_actor.strip():
        raise ValueError("re-verification requires --verifier-actor for the assigned run")
    for name in ("SKILL.md", "good-code.md", "good-change.md", "review.md",
                 "scripts/check_review.py"):
        if not (skill_dir / name).is_file():
            raise ValueError(f"candidate skill is missing {name}")

    fixture_hash = check_frozen_inputs()
    destination.mkdir(parents=True)
    shutil.copytree(ROOT / "cases" / case, destination, dirs_exist_ok=True)
    candidate = destination / "candidate-skill"
    candidate.mkdir()
    for path in sorted(skill_dir.glob("*.md")):
        shutil.copyfile(path, candidate / path.name)
    (candidate / "scripts").mkdir()
    shutil.copyfile(skill_dir / "scripts/check_review.py", candidate / "scripts/check_review.py")
    (destination / "scratch").mkdir()
    stage_records(case, destination, verifier_actor)
    (destination / "records").mkdir()
    request = (
        f"You are the assigned verifier `{verifier_actor}` for this bounded\n"
        "continuation stage. Read fixtures/README.md before interpreting the\n"
        "synthetic prior-stage records. The source and review context are fixed;\n"
        "the current assessment is fixtures/current-assessment.json.\n\n"
        "Update verification for the current assessment and fixtures/selection.json,\n"
        "using fixtures/prior-verification.json and fixtures/prior-assessment.json\n"
        "as the prior records. Write records/verification.json, check affected\n"
        "conclusions against source, and retain prior work where it still applies.\n"
        "Finish the current verification. Report the record path and actual\n"
        "validation/completion results with the simulation's evidence limit.\n")
    scope = (
        "This assignment is a verifier continuation, not a new top-level review.\n"
        "Do not launch another reviewer or change the supplied source, fixture\n"
        "records, declared actors, context or candidate skill. Write verification\n"
        "records under records/ and temporary output under scratch/. Source\n"
        "proof suffices; execute only the candidate checker and local file\n"
        "operations needed for this stage. Pass -B to Python commands, including\n"
        "with -I, to avoid bytecode writes.\n")
    (destination / "request.md").write_text(request, encoding="utf-8")
    trial = (ROOT.parents[1] / "scoped-trial.md").read_text(encoding="utf-8")
    (destination / "trial.md").write_text(trial.format(scope=scope), encoding="utf-8")
    (destination / "prompt.md").write_text(
        f"Work in {destination}. Read trial.md, then carry out request.md using the supplied candidate coding skill.\n",
        encoding="utf-8")
    hashes = {path.relative_to(destination).as_posix(): digest(path)
              for path in sorted(destination.rglob("*")) if path.is_file()}
    write_json(destination / "manifest.json", {
        "case": case, "guidance_version": guidance_version,
        "fixture_manifest_sha256": fixture_hash,
        "writable_source": [],
        "sha256": hashes,
    })
    return destination / "prompt.md"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case", choices=CASES)
    parser.add_argument("destination", type=Path, help="new workload directory; never overwritten")
    parser.add_argument("--skill-dir", type=Path, required=True,
                        help="frozen candidate coding skill, shared across evaluated models")
    parser.add_argument("--guidance-version", required=True)
    parser.add_argument("--verifier-actor", required=True,
                        help="assigned verifier role for this synthetic continuation; required for R6-R8")
    args = parser.parse_args()
    try:
        result = stage(args.case, args.destination.resolve(), args.skill_dir.resolve(),
                       args.guidance_version, args.verifier_actor)
    except (ValueError, OSError) as error:
        parser.exit(1, f"reverification setup: {error}\n")
    print(result)


if __name__ == "__main__":
    main()
