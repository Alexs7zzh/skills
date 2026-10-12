"""Check normal-runtime packet isolation and its existing behavior test."""

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
SKILL = ROOT.parents[1]
SPEC = importlib.util.spec_from_file_location("levels_setup", ROOT / "setup.py")
setup = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(setup)


class NormalPacketTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="normal-packet-check-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)

    def stage(self):
        result = subprocess.run(
            [sys.executable, "-B", str(ROOT / "setup.py"), "N1", "normal packet",
             "--skill-dir", str(SKILL), "--guidance-version", "test-snapshot"],
            cwd=self.root, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return Path(result.stdout.strip()).parent

    def test_packet_is_self_locating_and_excludes_coordinator_inputs(self):
        packet = self.stage()
        self.assertTrue((packet / "prompt.md").read_text().startswith(f"Work in {packet}. Read trial.md"))
        expected = {"prompt.md", "request.md", "trial.md", "manifest.json", "baseline/cart.py"}
        expected.update("candidate-skill/" + path.name for path in SKILL.glob("*.md"))
        expected.add("candidate-skill/scripts/check_review.py")
        expected.update(path.relative_to(ROOT / "cases/N1").as_posix()
                        for path in (ROOT / "cases/N1").rglob("*") if path.is_file())
        actual = {path.relative_to(packet).as_posix() for path in packet.rglob("*") if path.is_file()}
        self.assertEqual(actual, expected)
        manifest = json.loads((packet / "manifest.json").read_text())
        self.assertEqual(manifest["fixture_manifest_sha256"], setup.digest(ROOT / "fixture-manifest.json"))
        self.assertEqual(manifest["sha256"], {name: setup.digest(packet / name)
                                              for name in expected - {"manifest.json"}})
        self.assertEqual(manifest["writable_source"], ["work/cart.py"])

    def test_existing_behavior_check_distinguishes_correction_and_preserves_user_edit(self):
        packet = self.stage()
        manifest = json.loads((packet / "manifest.json").read_text())
        source = packet / "work/cart.py"
        before = source.read_text()
        self.assertEqual((packet / "baseline/cart.py").read_text(),
                         before.replace('CART_TITLE = "My basket"', 'CART_TITLE = "Cart"'))
        command = [sys.executable, "-B", "-m", "unittest", "-v", "test_cart.py"]
        baseline = subprocess.run(command, cwd=packet / "work", capture_output=True, text=True)
        self.assertEqual(baseline.returncode, 1, baseline.stdout + baseline.stderr)
        self.assertIn("225 != 535", baseline.stderr)
        source.write_text(before.replace("sum(line.unit_cents for line in lines)",
                                         "sum(line.unit_cents * line.quantity for line in lines)"))
        corrected = subprocess.run(command, cwd=packet / "work", capture_output=True, text=True)
        self.assertEqual(corrected.returncode, 0, corrected.stdout + corrected.stderr)
        self.assertIn("Ran 3 tests", corrected.stderr)
        self.assertIn('CART_TITLE = "My basket"', source.read_text())
        for name, digest in manifest["sha256"].items():
            if name != "work/cart.py":
                self.assertEqual(setup.digest(packet / name), digest, name)
        self.assertEqual({path.relative_to(packet).as_posix() for path in packet.rglob("*") if path.is_file()},
                         set(manifest["sha256"]) | {"manifest.json"})

    def test_frozen_files_match_manifest(self):
        setup.check_frozen_inputs()

    def test_frozen_manifest_accepts_windows_relative_paths(self):
        with patch.object(setup, "ROOT", WindowsRelativePath(ROOT)):
            setup.check_frozen_inputs()

    def test_fixture_drift_is_rejected_before_staging(self):
        for change in ("source", "extra", "missing"):
            with self.subTest(change=change):
                altered = self.root / change
                shutil.copytree(ROOT / "cases", altered / "cases")
                shutil.copyfile(ROOT / "fixture-manifest.json", altered / "fixture-manifest.json")
                if change == "source":
                    (altered / "cases/N1/work/cart.py").write_text("# changed\n")
                elif change == "extra":
                    (altered / "cases/N1/oracle.txt").write_text("DO NOT EXPOSE\n")
                else:
                    (altered / "cases/N1/contract.md").unlink()
                destination = self.root / ("packet-" + change)
                with patch.object(setup, "ROOT", altered):
                    with self.assertRaisesRegex(ValueError, "frozen fixture"):
                        setup.stage("N1", destination, SKILL, "test-snapshot")
                self.assertFalse(destination.exists())

    def test_existing_packet_is_not_overwritten(self):
        packet = self.stage()
        manifest = (packet / "manifest.json").read_bytes()
        with self.assertRaisesRegex(ValueError, "already exists"):
            setup.stage("N1", packet, SKILL, "test-snapshot")
        self.assertEqual((packet / "manifest.json").read_bytes(), manifest)


if __name__ == "__main__":
    unittest.main()
