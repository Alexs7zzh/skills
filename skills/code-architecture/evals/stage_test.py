#!/usr/bin/env python3
"""Assemble the inputs for one stage of code-architecture from a finished run's directory (the cache).

usage: stage_test.py RUN_DIR STAGE OUT_DIR [--skill SKILL_DIR]

STAGE is one of: design, compare, revise, recompare, synthesize, verify, final.
OUT_DIR gets an `inputs/` folder of symlinks to the cached artifacts the stage reads,
an empty `scratch/` folder, and `BRIEF.md` listing the inputs, the expected outputs and
the checker command. Hand BRIEF.md's path to a fresh agent; it writes outputs into OUT_DIR.
Nothing in RUN_DIR is modified. Coordinator-only; trial agents do not read this file.
"""
import glob
import os
import sys
from pathlib import Path

STAGES = {
    "design": {
        "inputs": ["model.md", "goals.md"],
        "outputs": "design-<group>.md per section group, then design.md",
        "instruction": "design.md",
        "check": "python3 {skill}/scripts/check_artifacts.py design {out}/design.md --model {out}/inputs/model.md --lenses {skill}/lenses.md",
    },
    "compare": {
        "inputs": ["model.md", "model-appendix.md", "design.md", "goals.md"],
        "outputs": "compare-whole.md and compare-<group>.md",
        "instruction": "compare.md",
        "check": "python3 {skill}/scripts/check_artifacts.py compare {out}/compare-<file>.md --design {out}/inputs/design.md",
    },
    "revise": {
        "inputs": ["model.md", "design.md", "goals.md", "compare-*.md"],
        "outputs": "design-revised.md",
        "instruction": "design.md and the Revise once section of compare.md",
        "check": "python3 {skill}/scripts/check_artifacts.py design {out}/design-revised.md --model {out}/inputs/model.md --lenses {skill}/lenses.md",
    },
    "recompare": {
        "inputs": ["model.md", "model-appendix.md", "design-revised.md", "goals.md"],
        "outputs": "recompare-<group>.md",
        "instruction": "compare.md",
        "check": "python3 {skill}/scripts/check_artifacts.py compare {out}/recompare-<file>.md --design {out}/inputs/design-revised.md",
    },
    "synthesize": {
        "inputs": ["model.md", "model-appendix.md", "design.md", "design-revised.md", "goals.md", "compare-*.md", "recompare-*.md"],
        "outputs": "synthesis.md",
        "instruction": "the Synthesize once section of compare.md",
        "check": "python3 {skill}/scripts/check_artifacts.py synthesis {out}/synthesis.md --model {out}/inputs/model.md",
    },
    "verify": {
        "inputs": ["model.md", "model-appendix.md", "synthesis.md"],
        "outputs": "verify-H<n>.md",
        "instruction": "the Verify once section of compare.md",
        "check": "python3 {skill}/scripts/check_artifacts.py verify {out}/verify-H<n>.md",
    },
    "final": {
        "inputs": ["model.md", "synthesis.md", "verify-*.md"],
        "outputs": "synthesis.md with Verified lines",
        "instruction": "the Verify once section of compare.md, last paragraph",
        "check": "python3 {skill}/scripts/check_artifacts.py synthesis {out}/synthesis.md --model {out}/inputs/model.md --verified",
    },
}


def main(argv):
    if len(argv) < 3 or argv[1] not in STAGES:
        print(__doc__)
        return 2
    run, stage, out = Path(argv[0]).resolve(), argv[1], Path(argv[2]).resolve()
    skill = Path(argv[argv.index("--skill") + 1]).resolve() if "--skill" in argv else Path(__file__).resolve().parent.parent
    spec = STAGES[stage]
    (out / "inputs").mkdir(parents=True, exist_ok=True)
    (out / "scratch").mkdir(exist_ok=True)
    linked, missing = [], []
    for pattern in spec["inputs"]:
        matches = sorted(glob.glob(str(run / pattern)))
        if not matches:
            missing.append(pattern)
        for m in matches:
            dest = out / "inputs" / Path(m).name
            if not dest.exists():
                os.symlink(m, dest)
            linked.append(dest.name)
    brief = [
        f"# Stage test: {stage}",
        "",
        f"Skill: {skill}/SKILL.md. Read {spec['instruction']} there and run only the {stage} stage.",
        f"Inputs, read-only, in {out}/inputs/: " + ", ".join(linked) + ".",
        (f"Missing from the cache: {', '.join(missing)}." if missing else "Every input the stage reads is present."),
        f"Write {spec['outputs']} into {out}/. Scratch goes in {out}/scratch/ and is deleted before the stage ends. Write nothing anywhere else.",
        "Launch nothing but the checker: " + spec["check"].format(skill=skill, out=out),
        "Report: wall time per agent, the counts the stage table's checker reads, and any checker failure fixed.",
    ]
    (out / "BRIEF.md").write_text("\n".join(brief) + "\n")
    print(out / "BRIEF.md")
    for line in brief[2:]:
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
