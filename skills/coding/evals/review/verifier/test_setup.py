"""Exercise packet isolation and blind reveal without launching a model."""

import importlib.util
import json
from pathlib import Path, PureWindowsPath
import shutil
import tempfile
import unittest
from unittest.mock import patch


class WindowsRelativePath(type(Path())):
    """Use real local files with Windows-style relative paths for the probe."""

    def relative_to(self, *args, **kwargs):
        return PureWindowsPath(*super().relative_to(*args, **kwargs).parts)


ROOT = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("verifier_setup", ROOT / "setup.py")
setup = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(setup)


class PacketTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="verifier-packet-check-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.skill = self.root / "candidate"
        self.skill.mkdir()
        for name in ("SKILL.md", "good-code.md", "good-change.md", "review.md"):
            (self.skill / name).write_text(f"# {name}\n", encoding="utf-8")
        (self.skill / "scripts").mkdir()
        (self.skill / "scripts/check_review.py").write_text("# checker\n", encoding="utf-8")
        (self.skill / "evals").mkdir()
        (self.skill / "evals/oracle.txt").write_text("DO NOT EXPOSE", encoding="utf-8")

    def stage(self, style, order=setup.CASES):
        destination = self.root / style
        setup.stage(destination, style, self.skill, "test-snapshot", order)
        return destination

    def first_pass(self, contents="Retained first-turn answer.\n"):
        path = self.root / "first-pass.txt"
        path.write_text(contents, encoding="utf-8")
        return path

    def assert_payload(self, packet, assessments):
        expected = {"phase1-prompt.md", "packet.json"}
        expected.update(f"candidate-skill/{name}" for name in (
            "SKILL.md", "good-code.md", "good-change.md", "review.md", "scripts/check_review.py"))
        for case in setup.CASES:
            source = ROOT / "cases" / case
            for path in source.rglob("*"):
                if not path.is_file() or path.name == "assessment.md":
                    continue
                relative = f"cases/{case}/{path.relative_to(source).as_posix()}"
                expected.add(relative)
                self.assertEqual((packet / relative).read_bytes(), path.read_bytes())
            if assessments:
                relative = f"assessments/{case}.md"
                expected.add(relative)
                self.assertEqual((packet / relative).read_bytes(),
                                 (source / "assessment.md").read_bytes())
        if (packet / "reveal.json").exists():
            expected.update(("phase2-prompt.md", "reveal.json"))
        actual = {path.relative_to(packet).as_posix()
                  for path in packet.rglob("*") if path.is_file()}
        self.assertEqual(actual, expected)

    def test_frozen_files_match_manifest(self):
        setup.check_frozen_inputs()

    def test_frozen_manifest_accepts_windows_relative_paths(self):
        with patch.object(setup, "ROOT", WindowsRelativePath(ROOT)):
            setup.check_frozen_inputs()

    def test_payload_keys_accept_windows_relative_paths(self):
        packet = self.stage("ordinary")
        with patch(__name__ + ".ROOT", WindowsRelativePath(ROOT)):
            self.assert_payload(packet, assessments=True)

    def test_unlisted_fixture_files_are_refused_before_staging(self):
        altered = self.root / "altered-fixture"
        for directory in ("cases", "prompts"):
            shutil.copytree(ROOT / directory, altered / directory)
        for name in ("fixture-manifest.json", "oracle.json"):
            shutil.copyfile(ROOT / name, altered / name)
        (altered / "cases/A/source/extra.txt").write_text("DO NOT EXPOSE")
        with patch.object(setup, "ROOT", altered):
            with self.assertRaisesRegex(ValueError, "fixture file inventory"):
                self.stage("ordinary")
        self.assertFalse((self.root / "ordinary").exists())

    def test_styles_share_inputs_and_exclude_oracles(self):
        packets = {style: self.stage(style) for style in setup.STYLES}
        for style, packet in packets.items():
            self.assert_payload(packet, assessments=style != "blind")
            metadata = json.loads((packet / "packet.json").read_text())
            self.assertEqual(metadata["guidance_version"], "test-snapshot")
        ordinary = (packets["ordinary"] / "phase1-prompt.md").read_text()
        challenge = (packets["challenge"] / "phase1-prompt.md").read_text()
        self.assertTrue(challenge.startswith(ordinary))
        self.assertIn("actively try to disprove", challenge[len(ordinary):])

    def test_blind_reveal_preserves_inputs_and_supplies_exact_assessments(self):
        packet = self.stage("blind", ("D", "C", "B", "A"))
        self.assert_payload(packet, assessments=False)
        metadata_before = (packet / "packet.json").read_bytes()
        response = self.first_pass()
        setup.reveal(packet, response)
        self.assert_payload(packet, assessments=True)
        self.assertEqual((packet / "packet.json").read_bytes(), metadata_before)
        receipt = json.loads((packet / "reveal.json").read_text())
        self.assertEqual(receipt["first_pass_sha256"], setup.digest(response))
        self.assertIn("D, C, B, A", (packet / "phase2-prompt.md").read_text())
        with self.assertRaisesRegex(ValueError, "already contains"):
            setup.reveal(packet, response)

    def test_blind_requires_retained_nonempty_response(self):
        packet = self.stage("blind")
        with self.assertRaises(FileNotFoundError):
            setup.reveal(packet, self.root / "missing.txt")
        with self.assertRaisesRegex(ValueError, "returned first-turn"):
            setup.reveal(packet, self.first_pass(" \n"))
        self.assert_payload(packet, assessments=False)

    def test_reveal_refuses_changed_or_added_input(self):
        packet = self.stage("blind")
        response = self.first_pass()
        source = packet / "cases/A/source/discounts.py"
        original = source.read_bytes()
        source.write_bytes(original + b"\n# changed\n")
        with self.assertRaisesRegex(ValueError, "input changed"):
            setup.reveal(packet, response)
        self.assertFalse((packet / "assessments").exists())
        source.write_bytes(original)
        (source.parent / "extra.py").write_text("# extra\n")
        with self.assertRaisesRegex(ValueError, "inventory changed"):
            setup.reveal(packet, response)
        self.assertFalse((packet / "assessments").exists())

    def test_existing_packet_and_nonblind_reveal_are_refused(self):
        packet = self.stage("ordinary")
        before = (packet / "packet.json").read_bytes()
        with self.assertRaisesRegex(ValueError, "already exists"):
            setup.stage(packet, "ordinary", self.skill, "test-snapshot", setup.CASES)
        self.assertEqual((packet / "packet.json").read_bytes(), before)
        with self.assertRaisesRegex(ValueError, "only a blind"):
            setup.reveal(packet, self.first_pass())

    def test_version_and_complete_case_order_are_required(self):
        for version, order in (("", setup.CASES), ("test", ("A", "A", "C", "D"))):
            with self.assertRaises(ValueError):
                setup.stage(self.root / "invalid", "ordinary", self.skill, version, order)
        self.assertFalse((self.root / "invalid").exists())


if __name__ == "__main__":
    unittest.main()
