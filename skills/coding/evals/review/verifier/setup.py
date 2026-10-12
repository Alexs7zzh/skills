#!/usr/bin/env python3
"""Stage the frozen verifier comparison or reveal its withheld assessments."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent
CASES = tuple("ABCD")
STYLES = ("ordinary", "challenge", "blind")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def check_frozen_inputs():
    manifest_path = ROOT / "fixture-manifest.json"
    manifest = read_json(manifest_path)
    actual = {path.relative_to(ROOT).as_posix() for directory in ("cases", "prompts")
              for path in (ROOT / directory).rglob("*") if path.is_file()}
    actual.add("oracle.json")
    if actual != set(manifest):
        raise ValueError("frozen fixture file inventory changed")
    for name, expected in manifest.items():
        if digest(ROOT / name) != expected:
            raise ValueError(f"frozen fixture changed: {name}")
    return digest(manifest_path)


def prompt(name, case_order):
    text = (ROOT / "prompts" / f"{name}.md").read_text(encoding="utf-8")
    return text.replace("{case_order}", ", ".join(case_order))


def copy_file(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)


def copy_assessments(destination, case_order):
    for case in case_order:
        copy_file(ROOT / "cases" / case / "assessment.md",
                  destination / "assessments" / f"{case}.md")


def stage(destination, style, skill_dir, guidance_version, case_order):
    if destination.exists():
        raise ValueError(f"destination already exists; choose a new directory: {destination}")
    if not guidance_version.strip():
        raise ValueError("guidance-version must identify the supplied skill snapshot")
    if len(case_order) != len(CASES) or set(case_order) != set(CASES):
        raise ValueError("case-order must contain A, B, C and D exactly once")
    for name in ("SKILL.md", "good-code.md", "good-change.md", "review.md",
                 "scripts/check_review.py"):
        if not (skill_dir / name).is_file():
            raise ValueError(f"candidate guidance is missing {name}")
    fixture_digest = check_frozen_inputs()

    destination.mkdir(parents=True)
    for case in case_order:
        source = ROOT / "cases" / case
        for name in ("contract.md", "questions.json"):
            copy_file(source / name, destination / "cases" / case / name)
        shutil.copytree(source / "source", destination / "cases" / case / "source")
    for path in sorted(skill_dir.glob("*.md")):
        copy_file(path, destination / "candidate-skill" / path.name)
    copy_file(skill_dir / "scripts/check_review.py",
              destination / "candidate-skill/scripts/check_review.py")
    if style != "blind":
        copy_assessments(destination, case_order)
    (destination / "phase1-prompt.md").write_text(
        prompt(style, case_order), encoding="utf-8")
    hashes = {path.relative_to(destination).as_posix(): digest(path)
              for path in sorted(destination.rglob("*")) if path.is_file()}
    write_json(destination / "packet.json", {
        "style": style,
        "case_order": list(case_order),
        "guidance_version": guidance_version,
        "fixture_sha256": fixture_digest,
        "sha256": hashes,
    })
    return destination / "phase1-prompt.md"


def reveal(destination, first_pass):
    packet = read_json(destination / "packet.json")
    if packet["style"] != "blind":
        raise ValueError("only a blind packet has withheld assessments")
    if any((destination / name).exists()
           for name in ("assessments", "phase2-prompt.md", "reveal.json")):
        raise ValueError("the packet already contains a reveal artifact")
    response = first_pass.read_bytes()
    if not response.strip():
        raise ValueError("first-pass must contain the returned first-turn answer")
    if check_frozen_inputs() != packet["fixture_sha256"]:
        raise ValueError("the fixture version changed after staging")
    expected_files = set(packet["sha256"]) | {"packet.json"}
    actual_files = {path.relative_to(destination).as_posix()
                    for path in destination.rglob("*") if path.is_file()}
    if actual_files != expected_files:
        raise ValueError("packet file inventory changed; retain run outputs outside the packet")
    for name, expected in packet["sha256"].items():
        if digest(destination / name) != expected:
            raise ValueError(f"packet input changed: {name}")

    copy_assessments(destination, packet["case_order"])
    (destination / "phase2-prompt.md").write_text(
        prompt("blind-continue", packet["case_order"]), encoding="utf-8")
    revealed = [destination / "phase2-prompt.md"] + [
        destination / "assessments" / f"{case}.md" for case in packet["case_order"]]
    write_json(destination / "reveal.json", {
        "first_pass_sha256": hashlib.sha256(response).hexdigest(),
        "sha256": {path.relative_to(destination).as_posix(): digest(path) for path in revealed},
    })
    return destination / "phase2-prompt.md"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser("stage", help="create a new isolated workload packet")
    create.add_argument("destination", type=Path, help="new directory; never overwritten")
    create.add_argument("--style", choices=STYLES, required=True)
    create.add_argument("--skill-dir", type=Path, required=True,
                        help="same frozen candidate coding skill for every condition")
    create.add_argument("--guidance-version", required=True,
                        help="label for the supplied snapshot, retained beside its file hashes")
    create.add_argument("--case-order", nargs=4, choices=CASES, default=CASES,
                        help="each case exactly once, in the requested presentation order")
    expose = commands.add_parser("reveal", help="supply assessments after the blind first turn")
    expose.add_argument("destination", type=Path)
    expose.add_argument("--first-pass", type=Path, required=True,
                        help="retained returned answer outside the packet; must be nonempty")
    args = parser.parse_args()
    try:
        if args.command == "stage":
            result = stage(args.destination.resolve(), args.style, args.skill_dir.resolve(),
                           args.guidance_version, args.case_order)
        else:
            result = reveal(args.destination.resolve(), args.first_pass.resolve())
    except (ValueError, OSError, KeyError) as error:
        parser.exit(1, f"verifier setup: {error}\n")
    print(result)


if __name__ == "__main__":
    main()
