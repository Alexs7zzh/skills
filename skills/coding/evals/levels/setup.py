#!/usr/bin/env python3
"""Stage a normal coding case for level checks; launch nothing."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent
CASES = ("N1",)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_frozen_inputs():
    manifest_path = ROOT / "fixture-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    actual = {path.relative_to(ROOT).as_posix() for path in (ROOT / "cases").rglob("*") if path.is_file()}
    if actual != set(manifest):
        raise ValueError("frozen fixture file inventory changed")
    for name, expected in manifest.items():
        if digest(ROOT / name) != expected:
            raise ValueError(f"frozen fixture changed: {name}")
    return digest(manifest_path)


def write_json(path, value, indent=2):
    path.write_text(json.dumps(value, indent=indent) + "\n", encoding="utf-8")


def stage(case, destination, skill_dir, guidance_version):
    if destination.exists():
        raise ValueError(f"destination already exists: {destination}")
    if not guidance_version.strip():
        raise ValueError("guidance-version must identify the frozen candidate snapshot")
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
    (destination / "baseline").mkdir()
    source = (destination / "work/cart.py").read_text(encoding="utf-8")
    (destination / "baseline/cart.py").write_text(
        source.replace('CART_TITLE = "My basket"', 'CART_TITLE = "Cart"'), encoding="utf-8")
    request = (
        "Fix the cart total in work/cart.py: quantities greater than one are\n"
        "currently charged as one. Preserve my existing CART_TITLE change from\n"
        "Cart to My basket and the rest of the unrelated work. The contract is\n"
        "in contract.md. The existing targeted behavior check is\n"
        "`python3 -B -m unittest -v test_cart.py` from work/.\n")
    scope = (
        "Only work/cart.py may be changed for the requested correction. Preserve\n"
        "the existing test, baseline, contract and candidate skill. Any temporary\n"
        "output belongs in scratch/. Pass -B to Python commands to avoid bytecode\n"
        "writes. No external prerequisite is needed.\n")
    (destination / "request.md").write_text(request, encoding="utf-8")
    trial = (ROOT.parent / "scoped-trial.md").read_text(encoding="utf-8")
    (destination / "trial.md").write_text(trial.format(scope=scope), encoding="utf-8")
    (destination / "prompt.md").write_text(
        f"Work in {destination}. Read trial.md, then carry out request.md using the supplied candidate coding skill.\n",
        encoding="utf-8")
    hashes = {path.relative_to(destination).as_posix(): digest(path)
              for path in sorted(destination.rglob("*")) if path.is_file()}
    write_json(destination / "manifest.json", {
        "case": case, "guidance_version": guidance_version,
        "fixture_manifest_sha256": fixture_hash,
        "writable_source": ["work/cart.py"],
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
    args = parser.parse_args()
    try:
        result = stage(args.case, args.destination.resolve(), args.skill_dir.resolve(),
                       args.guidance_version)
    except (ValueError, OSError) as error:
        parser.exit(1, f"levels setup: {error}\n")
    print(result)


if __name__ == "__main__":
    main()
