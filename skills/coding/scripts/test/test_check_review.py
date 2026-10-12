"""Focused review handoff and completion regressions (standard library only)."""

import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


sys.dont_write_bytecode = True
SCRIPT = Path(__file__).resolve().parents[1] / "check_review.py"
SPEC = importlib.util.spec_from_file_location("check_review", SCRIPT)
review = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(review)


class ReviewCheckerTests(unittest.TestCase):
    def setUp(self):
        self.ids, self.always = review.selection_rules()
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.assessment = review.template("assessment", self.ids, self.always)
        self.assessment.update(actor="investigator-session", request="Review the obsolete comment removal",
                               inputs=["cache.py comment removal"], target="commit:222", baseline="commit:111")
        for row in self.assessment["checks"]:
            selected = row["id"] in self.always
            row.update(applies="yes" if selected else "no",
                       basis="The diff removes an obsolete comment; executable code is unchanged.")
        self.assessment["questions"] = [{"id": "Q1", "question": "Does removing the obsolete comment preserve the expiry contract?",
                                         "inputs": list(self.assessment["inputs"]), "checks": ["outcome", "evidence"]}]
        self.assessment["answers"] = [{"id": "Q1", "actor": "investigator-session", "result": "clear",
                                      "answer": "The removed comment contradicts the current expiry contract; executable code is unchanged.",
                                      "evidence": "cache.py:12-14 and diff commit:111..commit:222", "next": "", "findings": []}]
        self.selection = {key: copy.deepcopy(self.assessment[key]) for key in review.COMMON_FIELDS}
        self.selection.update(phase="selection", actor="verifier-session")
        self.selection["checks"] = [{key: row[key] for key in ("id", "applies", "basis")} for row in self.assessment["checks"]]

    def write(self, name, record):
        path = self.root / name
        path.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
        return path

    def run_cli(self, *args, success=True):
        result = subprocess.run([sys.executable, "-B", str(SCRIPT), *map(str, args)],
                                text=True, capture_output=True, cwd=self.root)
        self.assertEqual(result.returncode, 0 if success else 1, result.stdout + result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        return result

    def packet(self):
        assessment_path = self.write("assessment.json", self.assessment)
        selection_path = self.write("selection.json", self.selection)
        result = self.run_cli("template", "verification", "--assessment", assessment_path, "--selection", selection_path)
        verification = json.loads(result.stdout)
        for row in verification["checks"]:
            applies = self.check_row(row["id"])["applies"]
            row.update(applies=applies, verdict="blocked" if applies == "unknown" else "supported",
                       reason="The source diff contains only the obsolete comment removal.",
                       next="Obtain the missing applicability evidence." if applies == "unknown" else "")
        for row in verification["findings"]:
            row.update(verdict="supported", reason="The deciding path omits the required expiry check.",
                       impact="Expired values reach callers.", next="")
        for row in verification["questions"]:
            row.update(verdict="supported", reason="The source diff supports the answer to this question.", next="")
        verification_path = self.write("verification.json", verification)
        return verification, verification_path, ["--assessment", assessment_path, "--selection", selection_path]

    def check_row(self, check_id, record=None):
        return next(row for row in (record or self.assessment)["checks"] if row["id"] == check_id)

    def answer_row(self, question_id="Q1", record=None):
        return next(row for row in (record or self.assessment)["answers"] if row["id"] == question_id)

    def select_check(self, check_id, applies="yes"):
        self.check_row(check_id)["applies"] = applies
        self.assessment["questions"][0]["checks"].append(check_id)

    def async_review(self):
        self.assessment.update(request="Review cancellation and replacement across deferred callbacks",
                               inputs=["cancel.py change", "replace.py change"])
        selected = ("outcome", "async", "boundary", "evidence", "integration")
        for row in self.assessment["checks"]:
            row.update(applies="yes" if row["id"] in selected else "no",
                       basis="The changed cancellation and replacement paths share the callback delivery contract.")
        self.assessment["questions"] = [
            {"id": "queued", "question": "Can cancellation while queued still deliver a result?",
             "inputs": ["cancel.py change"], "checks": list(selected)},
            {"id": "dispatched", "question": "Can cancellation after dispatch still deliver a result?",
             "inputs": ["cancel.py change"], "checks": list(selected)},
            {"id": "replacement", "question": "Can an old callback overwrite the replacement result?",
             "inputs": ["cancel.py change", "replace.py change"], "checks": list(selected)}]
        self.assessment["answers"] = [
            {"id": key, "actor": "investigator-session", "result": "clear", "answer": answer,
             "evidence": "probe/results.json#" + key, "next": "", "findings": []}
            for key, answer in (("queued", "The queue removes the cancelled item before dispatch."),
                                ("dispatched", "Delivery checks the operation's cancelled state."),
                                ("replacement", "Delivery compares the callback's generation with the current operation."))]
        for key in review.CONTEXT_FIELDS:
            self.selection[key] = copy.deepcopy(self.assessment[key])
        self.selection["checks"] = copy.deepcopy(self.assessment["checks"])

    def add_finding(self):
        self.select_check("boundary")
        self.answer_row().update(result="findings", findings=["F1"])
        self.assessment["findings"] = [{"id": "F1", "kind": "defect", "claim": "An expired value remains reusable",
                                        "scenario": "Read after the expiry deadline", "obligation": "Expiry contract at cache.py:12",
                                        "consequence": "The caller receives an expired value", "evidence": "cache.py:40-48",
                                        "countercheck": "Eviction at cache.py:70 only runs on writes"}]

    def assert_invalid(self, record, message):
        with self.assertRaisesRegex(review.InvalidRecord, message):
            review.validate(record, self.ids, self.always)

    def revision_packet(self):
        self.add_finding()
        self.check_row("state").update(applies="yes", basis="Reset clears retained cache state.")
        self.assessment["questions"].append({"id": "Q2", "question": "Does reset clear retained cache state?",
                                             "inputs": list(self.assessment["inputs"]), "checks": ["outcome", "state", "evidence"]})
        self.assessment["answers"].append({"id": "Q2", "actor": "reset-investigator", "result": "clear",
                                           "answer": "Reset clears the stored value.", "evidence": "cache.py:70-72 clears storage.",
                                           "next": "", "findings": []})
        verification, _, _ = self.packet()
        self.write("prior-assessment.json", self.assessment)
        self.write("prior-verification.json", verification)
        return verification

    def revision(self, success=True):
        self.write("assessment.json", self.assessment)
        return self.run_cli("template", "verification", "--assessment", self.root / "assessment.json",
                            "--selection", self.root / "selection.json", "--prior", self.root / "prior-verification.json",
                            "--prior-assessment", self.root / "prior-assessment.json", success=success)

    def assert_reseeded(self, updated, prior, question_ids=(), check_ids=(), finding_ids=()):
        for kind, changed in (("questions", question_ids), ("checks", check_ids), ("findings", finding_ids)):
            old = {row["id"]: row for row in prior[kind]}
            for row in updated[kind]:
                with self.subTest(kind=kind, id=row["id"]):
                    if row["id"] in changed:
                        self.assertEqual(row["verdict"], "unresolved" if kind == "findings" else "needs-work")
                        self.assertEqual(row["reason"], "")
                        self.assertEqual(row["next"], "")
                        if kind == "findings":
                            self.assertEqual(row["impact"], "")
                    else:
                        self.assertEqual(row, old[row["id"]])

    def test_inventory_matches_review_selection_table(self):
        self.assertEqual(self.ids, ["outcome", "state", "async", "boundary", "failure", "compatibility", "cost", "design", "evidence", "integration"])
        self.assertEqual(self.always, {"outcome", "evidence"})

    def test_answer_actor_is_required_nonempty_and_trimmed(self):
        record = copy.deepcopy(self.assessment)
        del record["answers"][0]["actor"]
        self.assert_invalid(record, "missing fields: actor")
        for value in (None, True, "", "   ", " worker", "worker "):
            with self.subTest(value=value):
                record = copy.deepcopy(self.assessment)
                record["answers"][0]["actor"] = value
                self.assert_invalid(record, "answers.Q1.actor must")

    def test_assembler_preserves_worker_provenance_and_workers_cannot_verify(self):
        self.assessment["actor"] = "assembler-session"
        self.answer_row()["actor"] = "worker-session"
        _, path, dependencies = self.packet()
        self.run_cli("complete", path, *dependencies)
        self.assertEqual(self.answer_row()["actor"], "worker-session")
        self.selection["actor"] = "worker-session"
        self.write("selection.json", self.selection)
        self.assertIn("self-verification: selection actor must differ from answer actor for question Q1",
                      self.run_cli("template", "verification", *dependencies, success=False).stderr)
        self.assertIn("self-verification", self.run_cli("check", path, *dependencies, success=False).stderr)

    def test_verifier_must_differ_from_every_answer_actor(self):
        self.revision_packet()
        self.answer_row("Q2")["actor"] = self.selection["actor"]
        self.assertIn("answer actor for question Q2", self.revision(success=False).stderr)

    def test_separate_peer_assessments_allow_cross_verification_but_merged_answers_need_another_verifier(self):
        original = copy.deepcopy(self.assessment)
        peer_records = []
        for investigator, verifier in (("peer-A", "peer-B"), ("peer-B", "peer-A")):
            with self.subTest(investigator=investigator, verifier=verifier):
                self.assessment = copy.deepcopy(original)
                self.assessment["actor"] = investigator
                self.assessment["questions"][0]["id"] = investigator + "-Q1"
                self.assessment["answers"][0].update(id=investigator + "-Q1", actor=investigator)
                self.selection["actor"] = verifier
                _, path, dependencies = self.packet()
                self.run_cli("complete", path, *dependencies)
                peer_records.append(copy.deepcopy(self.assessment))

        self.assessment = copy.deepcopy(original)
        self.assessment["actor"] = "assembler-session"
        for kind in ("questions", "answers"):
            self.assessment[kind] = [row for record in peer_records for row in record[kind]]
        assessment_path = self.write("assessment.json", self.assessment)
        for verifier in ("peer-A", "peer-B"):
            with self.subTest(merged_verifier=verifier):
                self.selection["actor"] = verifier
                selection_path = self.write("selection.json", self.selection)
                result = self.run_cli("template", "verification", "--assessment", assessment_path,
                                      "--selection", selection_path, success=False)
                self.assertIn("answer actor for question " + verifier + "-Q1", result.stderr)
        self.selection["actor"] = "noncontributing-verifier"
        _, path, dependencies = self.packet()
        self.run_cli("complete", path, *dependencies)

    def test_revision_preserves_unchanged_rows_despite_json_formatting(self):
        prior = self.revision_packet()
        self.write("assessment.json", self.assessment)
        assessment_path = self.root / "assessment.json"
        assessment_path.write_text(json.dumps(self.assessment, sort_keys=True, separators=(",", ":")))
        result = self.run_cli("template", "verification", "--assessment", assessment_path,
                              "--selection", self.root / "selection.json", "--prior", self.root / "prior-verification.json",
                              "--prior-assessment", self.root / "prior-assessment.json")
        updated = json.loads(result.stdout)
        self.assert_reseeded(updated, prior)
        self.assertNotEqual(updated["assessment_sha256"], prior["assessment_sha256"])
        self.assertEqual(updated["selection_sha256"], prior["selection_sha256"])
        path = self.write("revised-verification.json", updated)
        self.run_cli("complete", path, "--assessment", assessment_path, "--selection", self.root / "selection.json")

    def test_revision_retains_pending_verdicts_without_promoting_them(self):
        prior = self.revision_packet()
        self.check_row("boundary", prior).update(verdict="needs-work", reason="Inspect the second caller.", next="Read the second caller.")
        prior["questions"][0].update(verdict="blocked", reason="The provider source is unavailable.", next="Obtain the provider source.")
        prior["findings"][0].update(verdict="unresolved", reason="The provider obligation is not settled.", next="Obtain the provider contract.")
        self.write("prior-verification.json", prior)
        updated = json.loads(self.revision().stdout)
        self.assert_reseeded(updated, prior)

    def test_revision_changed_answer_evidence_or_actor_reopens_only_linked_work(self):
        prior = self.revision_packet()
        original = copy.deepcopy(self.assessment)
        for field in ("answer", "evidence", "actor"):
            with self.subTest(field=field):
                self.assessment = copy.deepcopy(original)
                self.answer_row()[field] = "Changed " + field
                updated = json.loads(self.revision().stdout)
                self.assert_reseeded(updated, prior, question_ids=("Q1",),
                                     check_ids=("outcome", "boundary", "evidence"), finding_ids=("F1",))

    def test_revision_changed_question_reopens_its_finding_and_categories(self):
        prior = self.revision_packet()
        self.assessment["questions"][0]["question"] = "Does expiry prevent reuse by every existing caller?"
        updated = json.loads(self.revision().stdout)
        self.assert_reseeded(updated, prior, question_ids=("Q1",),
                             check_ids=("outcome", "boundary", "evidence"), finding_ids=("F1",))

    def test_revision_changed_linked_finding_or_check_reopens_question(self):
        prior = self.revision_packet()
        original = copy.deepcopy(self.assessment)
        for kind in ("findings", "checks"):
            with self.subTest(kind=kind):
                self.assessment = copy.deepcopy(original)
                if kind == "findings":
                    self.assessment["findings"][0]["consequence"] = "A second caller also receives the expired value."
                else:
                    self.check_row("boundary")["basis"] = "Both callers consume the provider expiry contract."
                updated = json.loads(self.revision().stdout)
                self.assert_reseeded(updated, prior, question_ids=("Q1",),
                                     check_ids=("outcome", "boundary", "evidence"), finding_ids=("F1",))

    def test_revision_changed_check_link_reopens_both_sides_of_the_link(self):
        prior = self.revision_packet()
        self.assessment["questions"][0]["checks"].append("state")
        updated = json.loads(self.revision().stdout)
        self.assert_reseeded(updated, prior, question_ids=("Q1",),
                             check_ids=("outcome", "state", "boundary", "evidence"), finding_ids=("F1",))

    def test_revision_added_question_reopens_linked_category_but_retains_existing_answers(self):
        prior = self.revision_packet()
        self.assessment["questions"].append(dict(self.assessment["questions"][1], id="Q3", question="Does repeated reset stay empty?"))
        self.assessment["answers"].append(dict(self.answer_row("Q2"), id="Q3", answer="Repeated reset leaves storage empty."))
        updated = json.loads(self.revision().stdout)
        self.assert_reseeded(updated, prior, question_ids=("Q3",), check_ids=("outcome", "state", "evidence"))

    def test_revision_rejects_removed_question_even_when_other_questions_cover_its_categories_and_finding(self):
        self.revision_packet()
        self.assessment["questions"].append(dict(self.assessment["questions"][0], id="Q3", question="Does the second caller also receive expired values?"))
        self.assessment["answers"].append(dict(self.answer_row(), id="Q3"))
        prior, _, _ = self.packet()
        self.write("prior-assessment.json", self.assessment)
        self.write("prior-verification.json", prior)
        self.assessment["questions"].pop()
        self.assessment["answers"].pop()
        self.assertIn("assessment removed prior question IDs: Q3", self.revision(success=False).stderr)

    def test_revision_rejects_replacing_an_assigned_question_id(self):
        self.revision_packet()
        self.assessment["questions"][0]["id"] = "Q3"
        self.answer_row()["id"] = "Q3"
        self.assertIn("assessment removed prior question IDs: Q1", self.revision(success=False).stderr)

    def test_revision_added_and_removed_findings_reopen_linked_questions(self):
        prior = self.revision_packet()
        original = copy.deepcopy(self.assessment)
        self.assessment["findings"].append(dict(self.assessment["findings"][0], id="F2", claim="Another provider path violates expiry."))
        self.answer_row()["findings"].append("F2")
        updated = json.loads(self.revision().stdout)
        self.assert_reseeded(updated, prior, question_ids=("Q1",),
                             check_ids=("outcome", "boundary", "evidence"), finding_ids=("F1", "F2"))
        self.assessment = original
        self.assessment["findings"] = []
        self.answer_row().update(result="clear", findings=[], answer="The provider enforces expiry before this call.")
        updated = json.loads(self.revision().stdout)
        self.assertEqual(updated["findings"], [])
        self.assert_reseeded(updated, prior, question_ids=("Q1",), check_ids=("outcome", "boundary", "evidence"))

    def test_revision_reseeds_unknown_checks_from_independent_selection(self):
        self.select_check("async")
        self.check_row("async", self.selection).update(applies="unknown", basis="Provider delivery semantics were initially unavailable.")
        prior = self.revision_packet()
        self.assertEqual(self.check_row("async", prior)["applies"], "yes")
        self.answer_row()["evidence"] = "A corrected source citation establishes callback delivery."
        updated = json.loads(self.revision().stdout)
        row = self.check_row("async", updated)
        self.assertEqual((row["applies"], row["verdict"], row["reason"], row["next"]), ("unknown", "blocked", "", ""))
        self.assertEqual(updated["findings"][0]["verdict"], "unresolved")

    def test_revision_rejects_stale_prior_assessment_or_selection_bytes(self):
        self.revision_packet()
        for name, digest_field in (("prior-assessment.json", "assessment_sha256"), ("selection.json", "selection_sha256")):
            with self.subTest(file=name):
                path = self.root / name
                original = path.read_bytes()
                path.write_bytes(original + b"\n")
                self.assertIn(digest_field + " does not match the actual record bytes", self.revision(success=False).stderr)
                path.write_bytes(original)

    def test_revision_rejects_invalid_prior_record_shape_identity_and_links(self):
        prior = self.revision_packet()
        cases = []
        changed = copy.deepcopy(prior)
        del changed["questions"][0]["reason"]
        cases.append((changed, "missing fields: reason"))
        changed = copy.deepcopy(prior)
        changed["questions"].pop()
        cases.append((changed, "verification.questions is missing IDs: Q2"))
        changed = copy.deepcopy(prior)
        changed["actor"] = "another-verifier"
        cases.append((changed, "verification actor must match selection actor"))
        changed = copy.deepcopy(prior)
        changed["assessment_sha256"] = "0" * 64
        cases.append((changed, "assessment_sha256 does not match"))
        cases.append((self.selection, "--prior must name a verification record"))
        for changed, message in cases:
            with self.subTest(message=message):
                self.write("prior-verification.json", changed)
                self.assertIn(message, self.revision(success=False).stderr)
        self.write("prior-verification.json", prior)
        self.write("prior-assessment.json", self.selection)
        self.assertIn("--assessment must name an assessment record", self.revision(success=False).stderr)

    def test_revision_rejects_changed_context_or_assembler_or_verifier(self):
        self.revision_packet()
        original_assessment = copy.deepcopy(self.assessment)
        original_selection = copy.deepcopy(self.selection)
        for field in ("request", "inputs", "target", "baseline", "actor"):
            with self.subTest(field=field):
                self.assessment = copy.deepcopy(original_assessment)
                value = ["changed requested input"] if field == "inputs" else "changed " + field
                self.assessment[field] = value
                if field == "inputs":
                    for row in self.assessment["questions"]:
                        row["inputs"] = value
                result = self.revision(success=False)
                self.assertIn("assessment actor changed" if field == "actor" else "selection " + field + " does not match assessment", result.stderr)
        self.assessment = original_assessment
        self.selection["actor"] = "replacement-verifier"
        self.write("selection.json", self.selection)
        self.assertIn("verification actor must match selection actor", self.revision(success=False).stderr)
        self.selection = original_selection

    def test_prior_options_are_paired_and_only_valid_for_verification_templates(self):
        _, path, dependencies = self.packet()
        for option in ("--prior", "--prior-assessment"):
            self.assertIn("requires both --prior and --prior-assessment",
                          self.run_cli("template", "verification", *dependencies, option, path, success=False).stderr)
        for command in ("check", "complete"):
            self.assertIn("apply only to template verification",
                          self.run_cli(command, path, *dependencies, "--prior", path, "--prior-assessment", self.root / "assessment.json", success=False).stderr)
        for phase in ("assessment", "selection"):
            self.assertIn("apply only to template verification",
                          self.run_cli("template", phase, "--prior", path, "--prior-assessment", self.root / "assessment.json", success=False).stderr)

    def test_complete_clean_review_has_no_finding_quota(self):
        self.assertEqual(len(self.assessment["questions"]), 1)
        self.assertEqual(self.assessment["questions"][0]["checks"], ["outcome", "evidence"])
        _, path, dependencies = self.packet()
        self.assertIn("Completion accounting passed", self.run_cli("complete", path, *dependencies).stdout)

    def test_shared_artifact_can_answer_distinct_questions(self):
        self.async_review()
        verification, path, dependencies = self.packet()
        self.assertEqual({row["id"] for row in verification["questions"]}, {"queued", "dispatched", "replacement"})
        self.run_cli("complete", path, *dependencies)

    def test_one_async_answer_cannot_omit_other_assigned_questions(self):
        self.async_review()
        for omitted in ("queued", "dispatched", "replacement"):
            with self.subTest(omitted=omitted):
                record = copy.deepcopy(self.assessment)
                record["answers"] = [row for row in record["answers"] if row["id"] != omitted]
                path = self.write("assessment.json", record)
                self.assertIn("answers is missing IDs: " + omitted,
                              self.run_cli("check", path, success=False).stderr)
        self.assessment["answers"] = [self.answer_row("queued")]
        self.assert_invalid(self.assessment, "answers is missing IDs: dispatched, replacement")

    def test_question_verification_cannot_omit_or_add_ids(self):
        self.async_review()
        original, path, dependencies = self.packet()
        for omitted in ("queued", "dispatched", "replacement"):
            with self.subTest(omitted=omitted):
                record = copy.deepcopy(original)
                record["questions"] = [row for row in record["questions"] if row["id"] != omitted]
                self.write(path.name, record)
                for command in ("check", "complete"):
                    self.assertIn("verification.questions is missing IDs: " + omitted,
                                  self.run_cli(command, path, *dependencies, success=False).stderr)
        original["questions"].append(dict(original["questions"][0], id="invented"))
        self.write(path.name, original)
        self.assertIn("verification.questions has unknown IDs: invented",
                      self.run_cli("check", path, *dependencies, success=False).stderr)

    def test_supported_categories_cannot_close_pending_question_verdicts(self):
        self.async_review()
        original, path, dependencies = self.packet()
        for verdict in ("needs-work", "blocked"):
            with self.subTest(verdict=verdict):
                record = copy.deepcopy(original)
                record["questions"][1].update(verdict=verdict, reason="The returned probe only exercised queued cancellation.",
                                              next="Deliver a callback after dispatched cancellation and inspect the result.")
                self.write(path.name, record)
                self.run_cli("check", path, *dependencies)
                self.assertIn("questions dispatched is " + verdict,
                              self.run_cli("complete", path, *dependencies, success=False).stderr)

    def test_blocked_question_is_valid_partial_work_despite_supported_other_answers(self):
        self.async_review()
        self.answer_row("dispatched").update(result="blocked", answer="Cancellation after dispatch is unanswered.",
                                              evidence="probe/results.json only covers queued cancellation and replacement.",
                                              next="Restore the unavailable dispatch hook and run the after-dispatch case.")
        _, path, dependencies = self.packet()
        self.run_cli("check", path, *dependencies)
        self.assertIn("assessment question dispatched is blocked",
                      self.run_cli("complete", path, *dependencies, success=False).stderr)

    def test_question_and_answer_ids_are_unique(self):
        verification, _, _ = self.packet()
        for original, kind in ((self.assessment, "questions"), (self.assessment, "answers"), (verification, "questions")):
            with self.subTest(phase=original["phase"], kind=kind):
                record = copy.deepcopy(original)
                record[kind].append(copy.deepcopy(record[kind][0]))
                self.assert_invalid(record, kind + " has duplicate ID: Q1")
        self.assessment["answers"].append(dict(self.answer_row(), id="invented"))
        self.assert_invalid(self.assessment, "answers has unknown IDs: invented")

    def test_question_links_are_nonempty_unique_and_resolve(self):
        cases = [("inputs", [], "inputs must not be empty"),
                 ("inputs", ["absent input"], "references unknown inputs"),
                 ("inputs", self.assessment["inputs"] * 2, "inputs contains duplicate entries"),
                 ("checks", [], "checks must not be empty"),
                 ("checks", ["invented"], "references unknown checks"),
                 ("checks", ["outcome", "outcome"], "checks contains duplicate entries")]
        for field, value, message in cases:
            with self.subTest(field=field, value=value):
                record = copy.deepcopy(self.assessment)
                record["questions"][0][field] = value
                self.assert_invalid(record, message)

    def test_question_inventory_accounts_for_inputs_and_selected_checks(self):
        record = copy.deepcopy(self.assessment)
        record["inputs"].append("second requested change")
        self.assert_invalid(record, "requested inputs unaccounted for: second requested change")
        for applies in ("yes", "unknown"):
            with self.subTest(applies=applies):
                record = copy.deepcopy(self.assessment)
                self.check_row("async", record)["applies"] = applies
                self.assert_invalid(record, "selected checks unaccounted for: async")

    def test_question_inventory_and_answer_fields_are_required(self):
        for kind, field in (("questions", "question"), ("questions", "checks"),
                            ("answers", "answer"), ("answers", "evidence")):
            with self.subTest(kind=kind, field=field):
                record = copy.deepcopy(self.assessment)
                del record[kind][0][field]
                self.assert_invalid(record, "missing fields: " + field)
        self.assessment["questions"][0]["question"] = ""
        self.assert_invalid(self.assessment, "question must not be empty")

    def test_supported_finding_and_selection_disagreement_can_complete(self):
        self.add_finding()
        verification, path, dependencies = self.packet()
        self.check_row("boundary", verification)["reason"] = "The initial exclusion was wrong: cache.py:40 omits the expiry check."
        self.write(path.name, verification)
        self.run_cli("complete", path, *dependencies)

    def test_initial_unknown_may_resolve_after_source_evidence(self):
        self.check_row("async", self.selection).update(applies="unknown", basis="Need to check whether expiry uses callbacks.")
        verification, path, dependencies = self.packet()
        self.check_row("async", verification)["reason"] = "cache.py:1-80 and the diff contain no callback or delivery changes; exclusion supported."
        self.write(path.name, verification)
        self.run_cli("complete", path, *dependencies)

    def test_verification_template_seeds_independent_selection(self):
        self.check_row("boundary", self.selection).update(applies="yes", basis="The path consumes the provider contract.")
        self.check_row("async", self.selection).update(applies="unknown", basis="Provider delivery semantics are unavailable.")
        assessment_path = self.write("assessment.json", self.assessment)
        selection_path = self.write("selection.json", self.selection)
        result = self.run_cli("template", "verification", "--assessment", assessment_path, "--selection", selection_path)
        verification = json.loads(result.stdout)
        self.assertEqual(self.check_row("boundary", verification)["applies"], "yes")
        self.assertEqual(self.check_row("async", verification)["applies"], "unknown")
        self.assertEqual(self.check_row("async", verification)["verdict"], "blocked")
        self.assertEqual(self.check_row("boundary")["applies"], "no")
        self.assertEqual(self.check_row("async")["applies"], "no")

    def test_answered_elsewhere_cannot_support_an_incorrect_exclusion(self):
        for key in ("boundary", "integration"):
            self.check_row(key, self.selection).update(applies="yes", basis="Cancellation crosses Export and Jobs ownership.")
        verification, path, dependencies = self.packet()
        for key in ("boundary", "integration"):
            self.check_row(key, verification).update(applies="yes", reason="The condition applies, but the answer is covered under async.")
        self.write(path.name, verification)
        for command in ("check", "complete"):
            self.assertIn("mismatch requires needs-work", self.run_cli(command, path, *dependencies, success=False).stderr)
        for key in ("boundary", "integration"):
            self.check_row(key, verification).update(verdict="blocked", next="Correct the assessment applicability.")
        self.write(path.name, verification)
        self.assertIn("mismatch requires needs-work", self.run_cli("check", path, *dependencies, success=False).stderr)
        for key in ("boundary", "integration"):
            self.check_row(key, verification)["verdict"] = "needs-work"
        self.write(path.name, verification)
        self.run_cli("check", path, *dependencies)
        self.assertIn("boundary is needs-work", self.run_cli("complete", path, *dependencies, success=False).stderr)
        for key in ("boundary", "integration"):
            self.select_check(key)
        self.write("assessment.json", self.assessment)
        self.assertIn("assessment_sha256 does not match", self.run_cli("complete", path, *dependencies, success=False).stderr)
        _, path, dependencies = self.packet()
        self.run_cli("complete", path, *dependencies)

    def test_final_exclusion_cannot_support_an_applicable_assessment(self):
        self.select_check("boundary")
        verification, path, dependencies = self.packet()
        self.check_row("boundary", verification)["applies"] = "no"
        self.write(path.name, verification)
        self.assertIn("mismatch requires needs-work", self.run_cli("check", path, *dependencies, success=False).stderr)

    def test_unknown_final_applicability_remains_blocked(self):
        verification, path, dependencies = self.packet()
        row = self.check_row("async", verification)
        row["applies"] = "unknown"
        for verdict in ("supported", "needs-work"):
            row.update(verdict=verdict, next="Obtain the provider delivery contract." if verdict == "needs-work" else "")
            self.write(path.name, verification)
            self.assertIn("unknown applicability requires blocked", self.run_cli("complete", path, *dependencies, success=False).stderr)
        row.update(verdict="blocked", next="Obtain the provider delivery contract.")
        self.write(path.name, verification)
        self.run_cli("check", path, *dependencies)
        self.assertIn("async is blocked", self.run_cli("complete", path, *dependencies, success=False).stderr)

    def test_new_fact_can_reverse_initial_yes_selection(self):
        self.check_row("async", self.selection).update(applies="yes", basis="The selected provider was believed to register a callback.")
        verification, path, dependencies = self.packet()
        self.check_row("async", verification).update(applies="no", reason="The resolved provider at cache.py:40 returns a stored value directly; this path uses no callbacks, queues, timers or threads.")
        self.write(path.name, verification)
        self.run_cli("complete", path, *dependencies)

    def test_assigned_question_survives_exclusion_of_its_category(self):
        self.check_row("async", self.selection).update(applies="yes", basis="Expiry was believed to use a callback.")
        self.assessment["questions"].append({"id": "expiry_delivery", "question": "Can deferred expiry deliver stale values?",
                                             "inputs": list(self.assessment["inputs"]), "checks": ["async"]})
        self.assessment["answers"].append({"id": "expiry_delivery", "actor": "investigator-session", "result": "clear",
                                           "answer": "This path returns the stored value synchronously, so the deferred-delivery premise is false.",
                                           "evidence": "cache.py:40 returns directly; no callback is registered.", "next": "", "findings": []})
        verification, path, dependencies = self.packet()
        self.check_row("async", verification)["reason"] = "The resolved provider at cache.py:40 returns directly and registers no callbacks."
        self.write(path.name, verification)
        self.run_cli("complete", path, *dependencies)
        verification["questions"] = [row for row in verification["questions"] if row["id"] != "expiry_delivery"]
        self.write(path.name, verification)
        self.assertIn("verification.questions is missing IDs: expiry_delivery",
                      self.run_cli("complete", path, *dependencies, success=False).stderr)

    def test_verification_applicability_is_mandatory_and_closed(self):
        original, _, _ = self.packet()
        record = copy.deepcopy(original)
        del self.check_row("boundary", record)["applies"]
        self.assert_invalid(record, "missing fields: applies")
        for invalid in ("elsewhere", "YES", "", None, True):
            record = copy.deepcopy(original)
            self.check_row("boundary", record)["applies"] = invalid
            self.assert_invalid(record, "applies must be one of: yes, no, unknown")

    def test_every_check_required_once_in_each_phase(self):
        verification, _, _ = self.packet()
        for original in (self.assessment, self.selection, verification):
            with self.subTest(phase=original["phase"], error="missing"):
                record = copy.deepcopy(original)
                record["checks"].pop()
                self.assert_invalid(record, "missing IDs: integration")
            with self.subTest(phase=original["phase"], error="duplicate"):
                record = copy.deepcopy(original)
                record["checks"].append(copy.deepcopy(record["checks"][0]))
                self.assert_invalid(record, "duplicate ID: outcome")
            with self.subTest(phase=original["phase"], error="unknown"):
                record = copy.deepcopy(original)
                record["checks"].append(dict(record["checks"][-1], id="invented"))
                self.assert_invalid(record, "unknown IDs: invented")

    def test_always_checks_cannot_be_excluded(self):
        verification, _, _ = self.packet()
        for record in (self.assessment, self.selection, verification):
            for key in self.always:
                changed = copy.deepcopy(record)
                self.check_row(key, changed)["applies"] = "no"
                self.assert_invalid(changed, "always applies")

    def test_selected_but_unanswered_question_cannot_pass_handoff(self):
        self.answer_row()["answer"] = ""
        path = self.write("assessment.json", self.assessment)
        self.assertIn("answers.Q1.answer must not be empty", self.run_cli("check", path, success=False).stderr)

    def test_unknown_and_blocked_are_valid_partial_work_only(self):
        self.select_check("async", "unknown")
        self.answer_row().update(result="blocked", next="Obtain the unavailable provider callback contract.")
        _, path, dependencies = self.packet()
        self.run_cli("check", path, *dependencies)
        self.assertIn("assessment check async has unknown applicability", self.run_cli("complete", path, *dependencies, success=False).stderr)

    def test_blocked_row_can_retain_established_finding(self):
        self.add_finding()
        self.answer_row().update(result="blocked", next="Obtain the inaccessible second caller to settle its impact.")
        review.validate(self.assessment, self.ids, self.always)
        _, path, dependencies = self.packet()
        self.run_cli("check", path, *dependencies)
        self.run_cli("complete", path, *dependencies, success=False)

    def test_result_tokens_and_unknown_applicability_require_their_evidence(self):
        self.select_check("state")
        cases = [("unknown", "clear", "unknown applicability requires blocked"),
                 ("yes", "excluded", "result must be one of"),
                 ("yes", "findings", "needs finding IDs")]
        for applies, result, message in cases:
            with self.subTest(applies=applies, result=result):
                record = copy.deepcopy(self.assessment)
                self.check_row("state", record)["applies"] = applies
                self.answer_row(record=record)["result"] = result
                self.assert_invalid(record, message)

    def test_finding_links_and_ids_are_complete_and_unique(self):
        self.add_finding()
        cases = []
        record = copy.deepcopy(self.assessment)
        self.answer_row(record=record)["findings"] = ["F2"]
        cases.append((record, "unknown findings: F2"))
        record = copy.deepcopy(self.assessment)
        record["findings"].append(dict(record["findings"][0], id="F2"))
        cases.append((record, "unreferenced: F2"))
        record = copy.deepcopy(self.assessment)
        record["findings"].append(copy.deepcopy(record["findings"][0]))
        cases.append((record, "duplicate ID: F1"))
        record = copy.deepcopy(self.assessment)
        self.answer_row(record=record)["findings"] = ["F1", "F1"]
        cases.append((record, "duplicate entries"))
        record = copy.deepcopy(self.assessment)
        self.answer_row(record=record)["result"] = "clear"
        cases.append((record, "cannot reference findings"))
        for record, message in cases:
            with self.subTest(message=message):
                self.assert_invalid(record, message)

    def test_improvement_requires_separate_nonempty_tradeoff(self):
        self.add_finding()
        finding = self.assessment["findings"][0]
        finding.update(kind="improvement", claim="Share expiry calculation across both cache callers",
                       scenario="Maintaining the expiry policy in either caller",
                       obligation="Update the same expiry rule consistently in the two current callers",
                       consequence="A policy change requires one calculation edit instead of two",
                       evidence="cache.py:40 and cache.py:70 calculate the same expiry rule",
                       countercheck="Both current callers use the same policy; neither has a distinct expiry obligation")
        self.assert_invalid(self.assessment, "missing fields: tradeoff")
        for tradeoff in ("", "   ", None):
            finding["tradeoff"] = tradeoff
            self.assert_invalid(self.assessment, "tradeoff must")
        finding["tradeoff"] = "Both callers must follow the shared helper when reading the expiry calculation"
        _, path, dependencies = self.packet()
        self.run_cli("complete", path, *dependencies)
        del finding["countercheck"]
        self.assert_invalid(self.assessment, "missing fields: countercheck")

    def test_defect_omits_improvement_only_tradeoff(self):
        self.add_finding()
        review.validate(self.assessment, self.ids, self.always)
        self.assessment["findings"][0]["tradeoff"] = "Unrequested defect field"
        self.assert_invalid(self.assessment, "unknown fields: tradeoff")

    def test_finding_verification_cannot_omit_or_add_ids(self):
        self.add_finding()
        original, path, dependencies = self.packet()
        for finding_rows, message in (([], "missing IDs: F1"),
                                      ([*original["findings"], dict(original["findings"][0], id="F2")], "unknown IDs: F2")):
            record = copy.deepcopy(original)
            record["findings"] = finding_rows
            self.write(path.name, record)
            self.assertIn(message, self.run_cli("check", path, *dependencies, success=False).stderr)

    def test_refuted_and_unresolved_findings_prevent_completion(self):
        self.add_finding()
        original, path, dependencies = self.packet()
        for verdict in ("refuted", "unresolved"):
            with self.subTest(verdict=verdict):
                record = copy.deepcopy(original)
                record["findings"][0].update(verdict=verdict, next="Obtain the provider contract." if verdict == "unresolved" else "")
                self.write(path.name, record)
                self.run_cli("check", path, *dependencies)
                self.assertIn("F1 is " + verdict, self.run_cli("complete", path, *dependencies, success=False).stderr)

    def test_needs_work_and_blocked_verdicts_prevent_completion(self):
        original, path, dependencies = self.packet()
        for verdict in ("needs-work", "blocked"):
            record = copy.deepcopy(original)
            self.check_row("state", record).update(verdict=verdict, next="Inspect the reset implementation in the missing source snapshot.")
            self.write(path.name, record)
            self.run_cli("check", path, *dependencies)
            self.assertIn("state is " + verdict, self.run_cli("complete", path, *dependencies, success=False).stderr)

    def test_next_operation_required_for_pending_and_empty_for_closed(self):
        self.answer_row().update(result="blocked")
        self.assert_invalid(self.assessment, "next must not be empty")
        self.answer_row().update(result="clear", next="Inspect reset.")
        self.assert_invalid(self.assessment, "next must be empty for a closed result")
        self.answer_row()["next"] = ""
        self.add_finding()
        verification, _, _ = self.packet()
        for kind, verdict in (("checks", "needs-work"), ("checks", "blocked"),
                              ("questions", "needs-work"), ("questions", "blocked"), ("findings", "unresolved")):
            record = copy.deepcopy(verification)
            record[kind][0]["verdict"] = verdict
            self.assert_invalid(record, "next must not be empty")

    def test_hashes_bind_actual_bytes_including_whitespace(self):
        _, path, dependencies = self.packet()
        for name in ("assessment.json", "selection.json"):
            with self.subTest(file=name):
                source = self.root / name
                original = source.read_bytes()
                source.write_bytes(original + b"\n")
                result = self.run_cli("check", path, *dependencies, success=False)
                self.assertIn(name.split(".")[0] + "_sha256 does not match", result.stderr)
                source.write_bytes(original)

    def test_self_verification_and_changed_verifier_are_rejected(self):
        verification, path, dependencies = self.packet()
        verification["actor"] = self.assessment["actor"]
        self.write(path.name, verification)
        self.assertIn("actor must match selection actor", self.run_cli("complete", path, *dependencies, success=False).stderr)
        self.selection["actor"] = self.assessment["actor"]
        self.write("selection.json", self.selection)
        self.assertIn("self-verification", self.run_cli("template", "verification", *dependencies, success=False).stderr)

    def test_scope_context_must_match_exactly(self):
        verification, _, dependencies = self.packet()
        for field in review.CONTEXT_FIELDS:
            for phase in ("selection", "verification"):
                with self.subTest(field=field, phase=phase):
                    record = copy.deepcopy(self.selection if phase == "selection" else verification)
                    record[field] = ["other input"] if field == "inputs" else "other scope"
                    if phase == "selection":
                        self.write("selection.json", record)
                        result = self.run_cli("template", "verification", *dependencies, success=False)
                        self.write("selection.json", self.selection)
                    else:
                        path = self.write("verification.json", record)
                        result = self.run_cli("check", path, *dependencies, success=False)
                    self.assertIn(phase + " " + field + " does not match", result.stderr)

    def test_verification_requires_source_records_and_completion_requires_verification(self):
        _, path, _ = self.packet()
        self.assertIn("requires --assessment and --selection", self.run_cli("check", path, success=False).stderr)
        assessment = self.write("assessment.json", self.assessment)
        self.assertIn("complete requires a verification", self.run_cli("complete", assessment, success=False).stderr)

    def test_templates_are_incomplete_and_help_documents_handoff(self):
        for phase in ("assessment", "selection"):
            result = self.run_cli("template", phase)
            path = self.write(phase + ".json", json.loads(result.stdout))
            self.assertIn("must not be empty", self.run_cli("check", path, success=False).stderr)
        help_text = self.run_cli("--help").stdout
        for phrase in ("template verification", "exact file bytes", "countercheck", "engineering truth", "complete",
                       "final factual", "newly", "established fact", "elsewhere is not a basis for exclusion",
                       "concrete maintenance task", "current benefit", "tradeoff string", "Defects omit tradeoff"):
            self.assertIn(phrase, help_text)

    def test_malformed_records_fail_with_actionable_errors(self):
        invalid = [("not json", "Expecting value"), ("[]", "must be an object"),
                   ('{"phase":"selection","phase":"assessment"}', "duplicate field"),
                   ('{"number":NaN}', "nonstandard constant")]
        path = self.root / "invalid.json"
        for content, message in invalid:
            path.write_text(content, encoding="utf-8")
            self.assertIn(message, self.run_cli("check", path, success=False).stderr)
        path.write_bytes(b"\xff")
        self.assertIn("utf-8", self.run_cli("check", path, success=False).stderr)
        self.assertIn("missing.json", self.run_cli("check", self.root / "missing.json", success=False).stderr)

    def test_field_types_missing_fields_and_unknown_fields_are_rejected(self):
        for key, value, message in (("inputs", [], "must not be empty"),
                                    ("inputs", ["same", "same"], "duplicate entries"),
                                    ("inputs", "file.py", "must be an array"),
                                    ("actor", " investigator-session", "surrounding whitespace"),
                                    ("request", None, "must be a string")):
            record = copy.deepcopy(self.assessment)
            record[key] = value
            self.assert_invalid(record, message)
        record = copy.deepcopy(self.assessment)
        record["summary"] = "Unsupported extension"
        self.assert_invalid(record, "unknown fields: summary")
        del self.answer_row()["evidence"]
        self.assert_invalid(self.assessment, "missing fields: evidence")


if __name__ == "__main__":
    unittest.main()
