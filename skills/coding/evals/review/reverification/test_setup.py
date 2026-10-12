"""Check the staged R6–R8 oracle and packet handoff without launching a model."""

import importlib.util
import json
from pathlib import Path, PureWindowsPath
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


class WindowsRelativePath(type(Path())):
    """Use real local files with Windows-style relative paths for the probe."""

    def relative_to(self, *args, **kwargs):
        return PureWindowsPath(*super().relative_to(*args, **kwargs).parts)


ROOT = Path(__file__).resolve().parent
SKILL = ROOT.parents[2]
SPEC = importlib.util.spec_from_file_location("reverification_setup", ROOT / "setup.py")
setup = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(setup)

# Independent expected IDs from evals/review.md, not from the checker or records.py.
REOPENED = {
    "R6": {"checks": {"outcome", "boundary", "evidence"},
           "questions": {"Q-bounds"}, "findings": set()},
    "R7": {"checks": {"outcome", "boundary", "evidence"},
           "questions": {"Q-service", "Q-zone", "Q-zero"}, "findings": {"F1"}},
    "R8": {"checks": set(), "questions": set(), "findings": set()},
}


class ReverificationPacketTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="reverification-packet-check-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)

    def stage(self, case):
        result = subprocess.run(
            [sys.executable, "-B", str(ROOT / "setup.py"), case, f"packet {case}",
             "--skill-dir", str(SKILL), "--guidance-version", "test-snapshot",
             "--verifier-actor", "test-verifier"],
            cwd=self.root, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return Path(result.stdout.strip()).parent

    def checker(self, packet, *args):
        return subprocess.run(
            [sys.executable, "-B", str(packet / "candidate-skill/scripts/check_review.py"),
             *map(str, args)], cwd=self.root, capture_output=True, text=True)

    def test_staged_reopened_rows_match_oracle(self):
        for case, expected in REOPENED.items():
            with self.subTest(case=case):
                packet = self.stage(case)
                fixtures = packet / "fixtures"
                current = fixtures / "current-assessment.json"
                selection = fixtures / "selection.json"
                result = self.checker(
                    packet, "template", "verification", "--assessment", current,
                    "--selection", selection, "--prior", fixtures / "prior-verification.json",
                    "--prior-assessment", fixtures / "prior-assessment.json")
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                record = json.loads(result.stdout)
                prior = json.loads((fixtures / "prior-verification.json").read_text())
                actual = {kind: {row["id"] for row in record[kind]
                                 if row["verdict"] != "supported"} for kind in expected}
                self.assertEqual(actual, expected)
                for kind in expected:
                    prior_rows = {row["id"]: row for row in prior[kind]}
                    for row in record[kind]:
                        if row["id"] in expected[kind]:
                            self.assertEqual(row["verdict"], "unresolved" if kind == "findings" else "needs-work")
                            self.assertEqual(row["reason"], "")
                            self.assertEqual(row["next"], "")
                            if kind == "findings":
                                self.assertEqual(row["impact"], "")
                        else:
                            self.assertEqual(row, prior_rows[row["id"]])
                self.assertEqual(record["assessment_sha256"], setup.digest(current))
                output = packet / "records/verification.json"
                output.write_text(result.stdout, encoding="utf-8")
                completion = self.checker(packet, "complete", output, "--assessment", current,
                                          "--selection", selection)
                self.assertEqual(completion.returncode, 0 if case == "R8" else 1,
                                 completion.stdout + completion.stderr)

    def test_packets_are_self_locating_and_exclude_coordinator_inputs(self):
        for case in setup.CASES:
            with self.subTest(case=case):
                packet = self.stage(case)
                prompt = (packet / "prompt.md").read_text()
                self.assertTrue(prompt.startswith(f"Work in {packet}. Read trial.md"))
                expected = {"prompt.md", "request.md", "trial.md", "manifest.json"}
                expected.update("candidate-skill/" + path.name for path in SKILL.glob("*.md"))
                expected.add("candidate-skill/scripts/check_review.py")
                expected.update(path.relative_to(ROOT / "cases" / case).as_posix()
                                for path in (ROOT / "cases" / case).rglob("*") if path.is_file())
                expected.update("fixtures/" + name for name in (
                    "prior-assessment.json", "current-assessment.json", "selection.json",
                    "prior-verification.json", "README.md"))
                actual = {path.relative_to(packet).as_posix() for path in packet.rglob("*") if path.is_file()}
                self.assertEqual(actual, expected)
                manifest = json.loads((packet / "manifest.json").read_text())
                self.assertEqual(manifest["fixture_manifest_sha256"], setup.digest(ROOT / "fixture-manifest.json"))
                self.assertEqual(manifest["sha256"], {name: setup.digest(packet / name)
                                                      for name in expected - {"manifest.json"}})
                self.assertEqual(manifest["writable_source"], [])

    def test_frozen_files_match_manifest(self):
        setup.check_frozen_inputs()

    def test_frozen_manifest_accepts_windows_relative_paths(self):
        with patch.object(setup, "ROOT", WindowsRelativePath(ROOT)):
            setup.check_frozen_inputs()

    def test_fixture_drift_is_rejected_before_staging(self):
        for change in ("record", "source", "extra", "missing"):
            with self.subTest(change=change):
                altered = self.root / change
                shutil.copytree(ROOT / "cases", altered / "cases")
                for name in ("records.py", "fixture-manifest.json"):
                    shutil.copyfile(ROOT / name, altered / name)
                if change == "record":
                    (altered / "records.py").write_text("raise RuntimeError('must not import drifted definitions')\n")
                elif change == "source":
                    (altered / "cases/R6/source/chunks.py").write_text("# changed\n")
                elif change == "extra":
                    (altered / "cases/R6/oracle.txt").write_text("DO NOT EXPOSE\n")
                else:
                    (altered / "cases/R6/contract.md").unlink()
                destination = self.root / ("packet-" + change)
                with patch.object(setup, "ROOT", altered):
                    with self.assertRaisesRegex(ValueError, "frozen fixture"):
                        setup.stage("R6", destination, SKILL, "test-snapshot", "test-verifier")
                self.assertFalse(destination.exists())

    def test_existing_packet_is_not_overwritten(self):
        packet = self.stage("R6")
        manifest = (packet / "manifest.json").read_bytes()
        with self.assertRaisesRegex(ValueError, "already exists"):
            setup.stage("R6", packet, SKILL, "test-snapshot", "test-verifier")
        self.assertEqual((packet / "manifest.json").read_bytes(), manifest)


if __name__ == "__main__":
    unittest.main()
