#!/usr/bin/env python3
"""Validate the compact review records; no third-party packages are required."""

import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
import sys


CONTEXT_FIELDS = ("request", "inputs", "target", "baseline")
COMMON_FIELDS = ("phase", "actor", *CONTEXT_FIELDS, "checks")


class InvalidRecord(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise InvalidRecord(message)


def selection_rules():
    """Read IDs and unconditional rows from their single home in the skill."""
    path = Path(__file__).resolve().parents[1] / "good-code.md"
    contents = path.read_text(encoding="utf-8")
    heading = "## Selection table\n"
    require(heading in contents, "good-code.md is missing 'Selection table'")
    section = contents.split(heading, 1)[1].split("\n## ", 1)[0]
    rows = re.findall(r"^\| ([a-z][a-z0-9_-]*) \| ([^|]+) \|", section, re.MULTILINE)
    require(rows, "good-code.md has no selection rows")
    ids = [row[0] for row in rows]
    require(len(ids) == len(set(ids)), "good-code.md has duplicate selection IDs")
    return ids, {key for key, condition in rows if condition.strip() == "Always"}


def fields(value, expected, location):
    require(isinstance(value, dict), location + " must be an object")
    missing = set(expected) - value.keys()
    extra = value.keys() - set(expected)
    require(not missing, location + " is missing fields: " + ", ".join(sorted(missing)))
    require(not extra, location + " has unknown fields: " + ", ".join(sorted(extra)))


def text(value, location, allow_empty=False):
    require(isinstance(value, str), location + " must be a string")
    require(allow_empty or bool(value.strip()), location + " must not be empty")


def actor(value, location):
    text(value, location)
    require(value == value.strip(), location + " must not have surrounding whitespace")


def token(value, allowed, location):
    require(isinstance(value, str) and value in allowed,
            location + " must be one of: " + ", ".join(allowed))


def strings(value, location, allow_empty=True):
    require(isinstance(value, list), location + " must be an array")
    require(allow_empty or bool(value), location + " must not be empty")
    for index, item in enumerate(value):
        text(item, "%s[%d]" % (location, index))
    require(len(value) == len(set(value)), location + " contains duplicate entries")


def rows(value, location, expected_ids=None):
    require(isinstance(value, list), location + " must be an array")
    result = {}
    for index, row in enumerate(value):
        where = "%s[%d]" % (location, index)
        require(isinstance(row, dict), where + " must be an object")
        text(row.get("id"), where + ".id")
        require(row["id"] not in result, location + " has duplicate ID: " + row["id"])
        result[row["id"]] = row
    if expected_ids is not None:
        missing = set(expected_ids) - result.keys()
        extra = result.keys() - set(expected_ids)
        require(not missing, location + " is missing IDs: " + ", ".join(sorted(missing)))
        require(not extra, location + " has unknown IDs: " + ", ".join(sorted(extra)))
    return result


def next_operation(row, location, pending):
    text(row["next"], location + ".next", allow_empty=not pending)
    require(pending or row["next"] == "", location + ".next must be empty for a closed result")


def validate(record, ids, always):
    require(isinstance(record, dict), "record must be an object")
    phase = record.get("phase")
    token(phase, ("assessment", "selection", "verification"), "phase")
    extra = () if phase == "selection" else ("questions", "findings")
    if phase == "assessment":
        extra += ("answers",)
    if phase == "verification":
        extra += ("assessment_sha256", "selection_sha256")
    fields(record, COMMON_FIELDS + extra, phase)
    for key in ("request", "target", "baseline"):
        text(record[key], key)
    actor(record["actor"], "actor")
    strings(record["inputs"], "inputs", allow_empty=False)
    checks = rows(record["checks"], "checks", ids)
    for key, row in checks.items():
        where = "checks." + key
        if phase == "verification":
            fields(row, ("id", "applies", "verdict", "reason", "next"), where)
            token(row["applies"], ("yes", "no", "unknown"), where + ".applies")
            require(key not in always or row["applies"] == "yes", where + " always applies")
            token(row["verdict"], ("supported", "needs-work", "blocked"), where + ".verdict")
            require(row["applies"] != "unknown" or row["verdict"] == "blocked", where + ": unknown applicability requires blocked")
            text(row["reason"], where + ".reason")
            next_operation(row, where, row["verdict"] != "supported")
            continue
        fields(row, ("id", "applies", "basis"), where)
        token(row["applies"], ("yes", "no", "unknown"), where + ".applies")
        text(row["basis"], where + ".basis")
        require(key not in always or row["applies"] == "yes", where + " always applies")
    if phase == "selection":
        return
    questions = rows(record["questions"], "questions")
    if phase == "assessment":
        selected = {key for key, row in checks.items() if row["applies"] != "no"}
        for key, row in questions.items():
            where = "questions." + key
            fields(row, ("id", "question", "inputs", "checks"), where)
            text(row["question"], where + ".question")
            strings(row["inputs"], where + ".inputs", allow_empty=False)
            strings(row["checks"], where + ".checks", allow_empty=False)
            require(not set(row["inputs"]) - set(record["inputs"]), where + " references unknown inputs")
            require(not set(row["checks"]) - checks.keys(), where + " references unknown checks")
        linked_inputs = {value for row in questions.values() for value in row["inputs"]}
        linked_checks = {value for row in questions.values() for value in row["checks"]}
        require(not set(record["inputs"]) - linked_inputs, "questions leave requested inputs unaccounted for: " + ", ".join(sorted(set(record["inputs"]) - linked_inputs)))
        require(not selected - linked_checks, "questions leave selected checks unaccounted for: " + ", ".join(sorted(selected - linked_checks)))
        answers = rows(record["answers"], "answers", questions)
    else:
        answers = {}
        for key, row in questions.items():
            where = "questions." + key
            fields(row, ("id", "verdict", "reason", "next"), where)
            token(row["verdict"], ("supported", "needs-work", "blocked"), where + ".verdict")
            text(row["reason"], where + ".reason")
            next_operation(row, where, row["verdict"] != "supported")
    for key, row in answers.items():
        where = "answers." + key
        fields(row, ("id", "actor", "result", "answer", "evidence", "next", "findings"), where)
        actor(row["actor"], where + ".actor")
        token(row["result"], ("clear", "findings", "blocked"), where + ".result")
        text(row["answer"], where + ".answer")
        text(row["evidence"], where + ".evidence")
        strings(row["findings"], where + ".findings")
        result = row["result"]
        unknown = any(checks[check]["applies"] == "unknown" for check in questions[key]["checks"])
        require(not unknown or result == "blocked", where + ": unknown applicability requires blocked")
        require(result != "findings" or bool(row["findings"]), where + ": findings result needs finding IDs")
        require(result != "clear" or not row["findings"], where + ": clear cannot reference findings")
        next_operation(row, where, result == "blocked")
    findings = rows(record["findings"], "findings")
    for key, row in findings.items():
        where = "findings." + key
        if phase == "assessment":
            detail_fields = ("claim", "scenario", "obligation", "consequence", "evidence", "countercheck")
            if row.get("kind") == "improvement":
                detail_fields += ("tradeoff",)
            fields(row, ("id", "kind") + detail_fields, where)
            token(row["kind"], ("defect", "improvement"), where + ".kind")
            for field in detail_fields:
                text(row[field], where + "." + field)
        else:
            fields(row, ("id", "verdict", "reason", "impact", "next"), where)
            token(row["verdict"], ("supported", "refuted", "unresolved"), where + ".verdict")
            text(row["reason"], where + ".reason")
            text(row["impact"], where + ".impact")
            next_operation(row, where, row["verdict"] == "unresolved")
    if phase == "assessment":
        linked = {finding for row in answers.values() for finding in row["findings"]}
        require(not linked - findings.keys(), "answers reference unknown findings: " + ", ".join(sorted(linked - findings.keys())))
        require(not findings.keys() - linked, "findings are unreferenced: " + ", ".join(sorted(findings.keys() - linked)))
    else:
        for key in ("assessment_sha256", "selection_sha256"):
            require(isinstance(record[key], str) and re.fullmatch(r"[0-9a-f]{64}", record[key]), key + " must be a lowercase SHA-256 digest")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, "JSON has a duplicate field: " + key)
        result[key] = value
    return result


def invalid_constant(value):
    raise InvalidRecord("JSON has a nonstandard constant: " + value)


def load(path, ids, always):
    try:
        raw = Path(path).read_bytes()
        record = json.loads(raw.decode("utf-8"), object_pairs_hook=unique_object, parse_constant=invalid_constant)
        validate(record, ids, always)
    except (OSError, UnicodeError, ValueError) as error:
        raise InvalidRecord("%s: %s" % (path, error)) from error
    return record, hashlib.sha256(raw).hexdigest()


def pair(assessment, selection):
    require(assessment["phase"] == "assessment", "--assessment must name an assessment record")
    require(selection["phase"] == "selection", "--selection must name a selection record")
    require(assessment["actor"] != selection["actor"], "self-verification: selection actor must differ from assessment actor")
    for row in assessment["answers"]:
        require(row["actor"] != selection["actor"], "self-verification: selection actor must differ from answer actor for question " + row["id"])
    for key in CONTEXT_FIELDS:
        require(assessment[key] == selection[key], "selection %s does not match assessment" % key)


def verify_links(verification, assessment, selection, assessment_hash, selection_hash):
    pair(assessment, selection)
    require(verification["actor"] == selection["actor"], "verification actor must match selection actor")
    for key in CONTEXT_FIELDS:
        require(verification[key] == assessment[key], "verification %s does not match assessment" % key)
    for key, digest in (("assessment_sha256", assessment_hash), ("selection_sha256", selection_hash)):
        require(verification[key] == digest, key + " does not match the actual record bytes; obtain verification for the current records")
    assessment_checks = {row["id"]: row for row in assessment["checks"]}
    for row in verification["checks"]:
        if row["applies"] != "unknown" and row["applies"] != assessment_checks[row["id"]]["applies"]:
            require(row["verdict"] == "needs-work", "checks.%s: applicability differs from assessment; mismatch requires needs-work" % row["id"])
    rows(verification["findings"], "verification.findings", [row["id"] for row in assessment["findings"]])
    rows(verification["questions"], "verification.questions", [row["id"] for row in assessment["questions"]])


def complete(verification, assessment):
    for row in assessment["checks"]:
        require(row["applies"] != "unknown", "incomplete: assessment check %s has unknown applicability" % row["id"])
    for row in assessment["answers"]:
        require(row["result"] != "blocked", "incomplete: assessment question %s is blocked" % row["id"])
    for kind in ("checks", "questions", "findings"):
        for row in verification[kind]:
            require(row["verdict"] == "supported", "incomplete: verification %s %s is %s" % (kind, row["id"], row["verdict"]))


def template(phase, ids, always, assessment=None, selection=None, assessment_hash=None, selection_hash=None):
    result = {"phase": phase, "actor": "", "request": "", "inputs": [], "target": "", "baseline": "", "checks": []}
    if phase == "verification":
        pair(assessment, selection)
        result.update({key: assessment[key] for key in CONTEXT_FIELDS})
        result.update(actor=selection["actor"], assessment_sha256=assessment_hash, selection_sha256=selection_hash)
        selected = {row["id"]: row["applies"] for row in selection["checks"]}
    for key in ids:
        row = {"id": key}
        if phase == "verification":
            applies = selected[key]
            row.update(applies=applies, verdict="blocked" if applies == "unknown" else "needs-work", reason="", next="")
        else:
            row.update(applies="yes" if key in always else "unknown", basis="")
        result["checks"].append(row)
    if phase == "assessment":
        result["questions"] = []
        result["answers"] = []
        result["findings"] = []
    elif phase == "verification":
        result["questions"] = [{"id": row["id"], "verdict": "needs-work", "reason": "", "next": ""} for row in assessment["questions"]]
        result["findings"] = [{"id": row["id"], "verdict": "unresolved", "reason": "", "impact": "", "next": ""} for row in assessment["findings"]]
    return result


def verdict_dependencies(assessment):
    """Include the recorded basis of a verdict, not only its own row or ID."""
    checks = {row["id"]: row for row in assessment["checks"]}
    answers = {row["id"]: row for row in assessment["answers"]}
    findings = {row["id"]: row for row in assessment["findings"]}
    questions = {}
    for row in assessment["questions"]:
        answer = answers[row["id"]]
        questions[row["id"]] = {
            "question": row,
            "answer": answer,
            "checks": {key: checks[key] for key in row["checks"]},
            "findings": {key: findings[key] for key in answer["findings"]},
        }
    return {
        "questions": questions,
        "checks": {key: {"check": row, "questions": {qid: basis for qid, basis in questions.items() if key in basis["question"]["checks"]}}
                   for key, row in checks.items()},
        "findings": {key: {"finding": row, "questions": {qid: basis for qid, basis in questions.items() if key in basis["answer"]["findings"]}}
                     for key, row in findings.items()},
    }


def retain_verdicts(result, assessment, prior, prior_assessment):
    require(assessment["actor"] == prior_assessment["actor"], "assessment actor changed; create a fresh verification template without --prior")
    for key in CONTEXT_FIELDS:
        require(assessment[key] == prior_assessment[key], "assessment %s changed; create a fresh verification template without --prior" % key)
    previous = verdict_dependencies(prior_assessment)
    current = verdict_dependencies(assessment)
    removed_questions = previous["questions"].keys() - current["questions"].keys()
    require(not removed_questions, "assessment removed prior question IDs: %s; retain each question and answer with the fact that disproved its premise" % ", ".join(sorted(removed_questions)))
    for kind in ("checks", "questions", "findings"):
        prior_rows = {row["id"]: row for row in prior[kind]}
        result[kind] = [copy.deepcopy(prior_rows[row["id"]])
                        if previous[kind].get(row["id"]) == current[kind][row["id"]] else row
                        for row in result[kind]]


HELP = """Commands (templates go to stdout; fill empty fields before checking):
  python3 check_review.py template assessment > /tmp/assessment.json
  python3 check_review.py template selection > /tmp/selection.json
  python3 check_review.py check /tmp/assessment.json
  python3 check_review.py check /tmp/selection.json
  python3 check_review.py template verification --assessment /tmp/assessment.json --selection /tmp/selection.json > /tmp/verification.json
  python3 check_review.py template verification --assessment /tmp/revised-assessment.json --selection /tmp/selection.json --prior /tmp/verification.json --prior-assessment /tmp/assessment.json > /tmp/revised-verification.json
  python3 check_review.py check /tmp/verification.json --assessment /tmp/assessment.json --selection /tmp/selection.json
  python3 check_review.py complete /tmp/verification.json --assessment /tmp/assessment.json --selection /tmp/selection.json

Fields:
  Common: phase is assessment, selection or verification. actor declares the
  session/agent identity; assessment.actor identifies the assembler. Actor
  strings must be nonempty and have no surrounding whitespace.
  request, target and baseline are nonempty strings;
  inputs is a nonempty array of unique requested-object strings. Use a version
  or snapshot identity for target/baseline; use 'none: <reason>' if no baseline
  applies. Context fields must match exactly across records, including order.
  Every check ID from good-code.md appears once in checks, with no extra IDs.

  Selection and assessment checks: id, applies (yes/no/unknown), basis
  (nonempty string). Category rows record applicability, not answers.
  Always rows must say yes. A selection unknown may later be resolved with a
  supported verification reason; selections need not agree mechanically.

  Assessment questions: inventory the assigned questions before investigation.
  Each row has id, question (nonempty strings), inputs (nonempty array of exact
  requested-input strings), checks (nonempty array of check IDs).
  IDs and references are unique within their array. Every requested input and
  every yes/unknown check must be linked. References to absent inputs/checks fail.
  If investigation excludes a linked check, retain the assigned question with
  an answer explaining the disproved premise; its ID still requires a verdict.
  A question may span inputs and checks, but separately answerable behavior
  paths need separate question IDs. Keep the inventory when assembling answers;
  a single category answer cannot silently drop another assigned question.
  For example:
  {"id":"Q1","question":"Can queued cancellation deliver a result?",
   "inputs":["cancel.py change"],"checks":["outcome","async","evidence"]}

  Assessment answers: exactly one row per inventoried question ID, with
  id, actor, result (clear/findings/blocked), answer, evidence (nonempty strings),
  next (string), findings (array of unique finding IDs). Store an answer once;
  its question links it to all relevant checks. Several answers may cite the
  same evidence artifact, naming the portion that settles each question.
  actor declares the investigator who supplied that answer. Preserve it when
  assembling worker returns; it may equal assessment.actor when the assembler
  investigated the question. It is declared provenance, not proof of identity.
  clear has no finding links; findings requires links. A question linked to an
  unknown check requires blocked. blocked requires a nonempty next operation;
  closed results require next="". Record the exact unanswered claim and evidence
  limit in a blocked answer, rather than omitting the answer row.
  Top-level findings is an array, possibly empty; each finding is linked by a
  question answer and has id, kind (defect/improvement), claim, scenario, obligation,
  consequence, evidence and countercheck, all nonempty strings.
  For an improvement, obligation names an evidenced concrete maintenance task
  or current benefit; a generic principle or invented violated contract is not
  enough. Improvements also require a nonempty tradeoff string, separate from
  countercheck, which records attempted refutation. Defects omit tradeoff.
  For example:
  {"id":"F1","kind":"defect","claim":"The expired entry remains reusable",
   "scenario":"Read after its deadline","obligation":"Expiry contract at cache.py:12",
   "consequence":"A caller receives an expired value","evidence":"cache.py:40-48",
   "countercheck":"Checked eviction at cache.py:70; it runs only on writes"}

  Verification checks: id, applies (yes/no/unknown), verdict
  (supported/needs-work/blocked), reason, next. applies records final factual
  applicability; the template seeds it from the independent selection, not the
  assessment. Answering a question elsewhere is not a basis for exclusion.
  A classification change from the independent selection must name a newly
  established fact in reason. The checker cannot prove that fact. A supported
  check requires known final applies matching assessment.applies. A known
  mismatch requires needs-work; unknown applicability requires blocked.
  Verification questions: id, verdict (supported/needs-work/blocked), reason,
  next. Every assessment question appears exactly once, independently of its
  category verdicts; a supported category does not close its questions.
  Verification findings: id, verdict (supported/refuted/unresolved),
  reason, impact, next. reason/impact are nonempty strings. next must name an
  operation for needs-work/blocked/unresolved, and must be empty otherwise.
  Every assessment finding appears once. assessment_sha256 and selection_sha256
  are lowercase SHA-256 hashes of the exact file bytes, populated by template.
  Verification requires both source records. Selection/verification actors must
  match each other and differ from the assessment actor and every answer actor.

Updating verification:
  --prior and --prior-assessment are required together and apply only to
  template verification. The prior record must be a valid verification of the
  exact prior assessment bytes and the same independent selection bytes.
  Review context and assembler/verifier identities must remain the same; use a
  fresh template for changed identities or context. The current assessment
  still must match the selection's context and satisfy actor separation.
  Preserve every prior question ID, including questions whose premise was
  disproved; retain the question and answer with that fact. New questions may
  be added, and refuted findings may be removed.

  The update binds the new assessment digest and compares unchanged field values
  and dependencies, so harmless JSON formatting does not reopen verdicts.
  A question depends on its definition, full answer (including actor/evidence),
  linked check records and linked finding records. A check or finding also
  depends on the full set of those question dependencies linked to it. Changing
  an answer actor, a linked record, or adding/removing a link can therefore reopen
  other verdicts even when their own IDs and text are unchanged.

  Unchanged rows retain their exact prior verdict, reason and next operation,
  including pending work. Changed/new rows use the ordinary template defaults:
  checks/questions need work (unknown checks stay blocked); findings remain
  unresolved. Removed finding IDs disappear. Fill the reseeded fields after the deciding
  inspection, then validate the record. The script makes no new inspection claim
  and does not promote a pending verdict to supported.

  Unknown fields and duplicate JSON object keys are rejected. check accepts
  structurally valid partial work. complete also requires known applicability,
  no blocked assessment answers and supported verdicts for every verification
  check, question and finding.

Limits: this checks shape, references, recorded identities, byte binding and
completion accounting for inventoried questions. Source review must establish
whether the inventory omitted a required question or combined distinct paths.
It cannot prove source inspection, engineering truth,
the actual identity of an actor or independence of contexts. Renaming an actor
does not create independence. Dependency comparison sees recorded fields, not
changes behind an unversioned evidence path or unrecorded links. The supported
update command reseeds changed dependencies, but without a separate immutable
authority store the checker cannot detect someone manually rewriting hashes and
inventing verdicts. It does not use the joint ledger.
"""


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, epilog=HELP, formatter_class=argparse.RawDescriptionHelpFormatter)
    subparsers = parser.add_subparsers(dest="command", required=True)
    for command in ("template", "check", "complete"):
        subparser = subparsers.add_parser(command)
        if command == "template":
            subparser.add_argument("phase", choices=("assessment", "selection", "verification"))
        else:
            subparser.add_argument("record", help="JSON record path")
        subparser.add_argument("--assessment", help="assessment JSON read by the verifier")
        subparser.add_argument("--selection", help="verifier's independent selection JSON")
        subparser.add_argument("--prior", help="prior verification JSON, for template verification updates only")
        subparser.add_argument("--prior-assessment", help="assessment JSON bound by --prior")
    args = parser.parse_args(argv)
    try:
        ids, always = selection_rules()
        if args.command == "template":
            phase = args.phase
        else:
            record, _ = load(args.record, ids, always)
            phase = record["phase"]
            require(args.command != "complete" or phase == "verification", "complete requires a verification record")
        if args.prior or args.prior_assessment:
            require(args.command == "template" and phase == "verification", "--prior and --prior-assessment apply only to template verification")
            require(args.prior and args.prior_assessment, "verification update requires both --prior and --prior-assessment")
        assessment = selection = assessment_hash = selection_hash = None
        if phase == "verification":
            require(args.assessment and args.selection, "verification requires --assessment and --selection paths")
            assessment, assessment_hash = load(args.assessment, ids, always)
            selection, selection_hash = load(args.selection, ids, always)
        else:
            require(not args.assessment and not args.selection, "--assessment and --selection apply only to verification")
        if args.command == "template":
            result = template(phase, ids, always, assessment, selection, assessment_hash, selection_hash)
            if args.prior:
                prior, _ = load(args.prior, ids, always)
                require(prior["phase"] == "verification", "--prior must name a verification record")
                prior_assessment, prior_assessment_hash = load(args.prior_assessment, ids, always)
                verify_links(prior, prior_assessment, selection, prior_assessment_hash, selection_hash)
                retain_verdicts(result, assessment, prior, prior_assessment)
            print(json.dumps(result, indent=2))
        else:
            if phase == "verification":
                verify_links(record, assessment, selection, assessment_hash, selection_hash)
            if args.command == "complete":
                complete(record, assessment)
            print("%s: %s" % ("Completion accounting passed" if args.command == "complete" else "Valid " + phase + " record", args.record))
        return 0
    except (InvalidRecord, OSError) as error:
        print("error: " + str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
