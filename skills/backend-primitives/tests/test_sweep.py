#!/usr/bin/env python3
"""Deterministic regression and CLI workflow tests; supplied rows are not model evals."""
import copy
import argparse
import contextlib
import io
from unittest import mock
import importlib.util
import itertools
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
SCRIPT = SKILL / "scripts" / "sweep.py"
spec = importlib.util.spec_from_file_location("sweep", SCRIPT)
sweep = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sweep)
CATALOG = sweep.catalog()


def run(*args, ok=True):
    out = subprocess.run([sys.executable, str(SCRIPT), *map(str, args)], capture_output=True, text=True)
    if ok and out.returncode:
        raise AssertionError(f"{args} failed:\n{out.stdout}{out.stderr}")
    return out


def answer_set(kind, overrides=None, path="src/orders.ts", line=7):
    answers = {}
    for q in CATALOG["kinds"][kind]["questions"]:
        applies = sweep.condition_met(q.get("only_if", {}), answers)
        default = {"a": "no", "note": f"inspected {path}:{line}", "hint_refutation": "synthetic fixture: inspected hinted shape, identity differs"}
        if q.get("search"):
            default["searched"] = "fixture identifying string"
        if applies is False:
            default = {"a": "n/a"}
        elif applies is None:
            default = {"a": "unknown", "missing": "prerequisite is unknown"}
        answers[q["id"]] = (overrides or {}).get(q["id"], default)
    return answers


def jsonl(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(r) + "\n" for r in rows))


def YES(ev):
    return {"a": "yes", "ev": ev}


# (path, line[, kind]) -> overrides: the fixture's planted facts.
FACTS = {
    ("src/orders.ts", 7): {"XC1": YES("src/orders.ts:8"), "XC5": YES("src/orders.ts:6-14"), "XC7": YES("src/orders.ts:6"),
                           "XC14": {"a": "unknown", "missing": "whether a caller holds a transaction"}},
    ("src/orders.ts", 19): {"XC4": {"a": "unknown", "missing": "caller timer not present"}},
    ("src/handler.ts", 25, "external-call"): {"XC1": YES("src/handler.ts:25")},
    ("src/ledger.ts", 7): {"XC1": YES("src/ledger.ts:7")},
    ("src/inventory.ts", 10, "external-call"): {"XC1": YES("src/inventory.ts:10")},
    ("src/restock.ts", 9, "external-call"): {"XC1": YES("src/restock.ts:9")},
    ("src/ledger.ts", 6, "external-call"): {"XC1": YES("src/ledger.ts:6")},
    ("src/handler.ts", 7): {"EP1": YES("src/handler.ts:8")},
    ("src/restock.ts", 6): {"EP6": YES("template.yaml:19-20")},
    ("src/config.ts", 2): {"CF1": YES("src/config.ts:2"), "CF6": YES("src/config.ts:3")},
    ("src/ledger.ts", 9): {"CF1": YES("src/ledger.ts:9")},
    ("src/errors.ts", 1): {"ED5": YES("src/errors.ts:10")},
    ("src/errors.ts", 10): {"ED5": YES("src/errors.ts:1")},
    ("src/handler.ts", 17): {"EH1": YES("src/handler.ts:19")},
    ("src/handler.ts", 10): {"DB1": YES("src/handler.ts:10"), "DB3": YES("src/handler.ts:10")},
    ("src/list.ts", 6): {"DB1": YES("src/list.ts:5"), "DB3": YES("src/list.ts:6")},
    ("src/orders.ts", 12): {"DB1": YES("src/orders.ts:7"), "DB3": YES("src/orders.ts:12")},
    ("src/orders.ts", 20): {"DB1": YES("src/orders.ts:19"), "DB3": YES("src/orders.ts:20")},
    ("src/orderStatus.ts", 6): {"DB1": YES("src/orderStatus.ts:4"), "DB3": YES("src/orderStatus.ts:6")},
    ("src/inventory.ts", 10, "state-write"): {"SW1": YES("src/restock.ts:9"), "SW2": YES("src/inventory.ts:7-8")},
    ("src/restock.ts", 9, "state-write"): {"SW1": YES("src/inventory.ts:10"), "SW2": YES("src/restock.ts:7-8")},
    ("src/ledger.ts", 6, "state-write"): {"SW5": YES("src/ledger.ts:7")},
    ("src/handler.ts", 25, "fan-out"): {"FO2": YES("src/handler.ts:24"), "FO3": YES("src/handler.ts:25"), "FO4": YES("src/handler.ts:25")},
    ("src/orders.ts", 3): {"TM1": YES("src/orders.ts:13")},
    ("src/config.ts", 3): {"LG3": YES("src/config.ts:3")},
    ("test/orders.test.ts", 5): {"TD2": YES("test/orders.test.ts:5")},
}

class SweepTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.root = self.tmp / "repo"
        shutil.copytree(SKILL / "evals" / "fixture", self.root)
        self.run_dir = self.tmp / "run"

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def sites(self):
        return sweep.sites_of(self.run_dir)

    def prepare(self, kinds=None):
        args = ["inventory", self.root, "--run", self.run_dir]
        if kinds:
            args += ["--kinds", kinds]
        run(*args)
        run("api", self.run_dir)
        run("shard", self.run_dir)
        self.assertTrue((self.run_dir / "answers").is_dir())
        for p in sorted((self.run_dir / "shards").glob("*.json")):
            rows = []
            for sid in json.loads(p.read_text())["sites"]:
                s = self.sites()[sid]
                facts = FACTS.get((s["path"], s["line"], s["kind"]), FACTS.get((s["path"], s["line"]), {}))
                rows.append({"site": sid, "answers": answer_set(s["kind"], facts, s["path"], s["line"])})
            jsonl(self.run_dir / "answers" / (p.stem + ".jsonl"), rows)
        run("check", self.run_dir, "--stage", "answers")

    def audit(self, sample=0):
        run("audit", self.run_dir, *(["--all"] if sample == 0 else ["--sample", sample]))
        rows = []
        for item in json.loads((self.run_dir / "audit.json").read_text())["selected"]:
            site = self.sites()[item["site"]]
            rows.append({"id": item["id"], "fingerprint": item["fingerprint"], "result": "confirmed", "evidence": [f"{site['path']}:{site['line']}"], "searched": "synthetic test confirmation"})
        jsonl(self.run_dir / "audit-answers.jsonl", rows)
        run("check", self.run_dir, "--stage", "audit")

    def mapped(self, budget=80):
        self.prepare()
        self.audit()
        return run("map", self.run_dir, "--sites-per-judge", budget).stdout

    def clusters(self):
        return {c["id"]: c for c in json.loads((self.run_dir / "clusters.json").read_text())["clusters"]}

    def verdicts(self):
        rows = []
        clusters = self.clusters()
        for p in sorted((self.run_dir / "judges").glob("*.json")):
            group = []
            for n, cid in enumerate(json.loads(p.read_text())["clusters"], 1):
                c = clusters[cid]
                ids = [s["site"] for s in c["sites"]]
                s = self.sites()[ids[0]]
                finding = "unresolved" if any(x["state"] == "unresolved" for x in c["sites"]) else "defect" if c["lane"] == "defect" else "improvement"
                row = {"id": f"{p.stem}-{n}", "cluster": cid, "sites": "all", "inspected": ids,
                       "finding": finding, "remedy": "none" if finding == "unresolved" else "local", "decision": False,
                       "evidence": [f"{s['path']}:{s['line']}"], "proposal": "fixture change", "layer": "service",
                       "consequence": "fixture failing path", "limit": "fixture missing evidence"}
                if finding in ("defect", "improvement"):
                    row.update(behavior={"kind": "preserve", "before": "fixture caller result", "after": "fixture caller result"},
                               risk="fixture adapter could lose caller failure mapping",
                               validation=["fixture caller retains success and failure mapping"],
                               action="pursue", recommendation="fixture shared guarantee warrants the migration")
                group.append(row)
            jsonl(self.run_dir / "verdicts" / (p.stem + ".jsonl"), group)
            rows.extend(group)
        return rows

    def save_verdicts(self, rows):
        groups = {}
        for row in rows:
            groups.setdefault(row["id"].split("-")[0], []).append(row)
        for gid, group in groups.items():
            jsonl(self.run_dir / "verdicts" / (gid + ".jsonl"), group)

    def correction(self, sid, answers):
        effective, _ = sweep.merged_answers(self.run_dir, self.sites())
        return {"site": sid, "before": sweep.digest(effective[sid]), "reason": "fixture correction", "answers": answers}

    def test_full_run_and_merge_priority(self):
        out = self.mapped()
        self.assertIn("| External calls bounded by a deadline | 0/10 | 1 |", out)
        self.assertIn("unaudited", (self.run_dir / "audit-packet.md").read_text())
        run("packet", self.run_dir, "A01")
        run("judge-packet", self.run_dir, "J01")
        self.assertTrue((self.run_dir / "verdicts").is_dir())
        rows = self.verdicts()
        defect = next(r for r in rows if r["finding"] == "defect")
        target = next(r for r in rows if r["finding"] == "improvement" and r["id"].split("-")[0] != defect["id"].split("-")[0])
        defect.update(decision=True, question="fixture choice?", recommendation="fixture option")
        self.save_verdicts(rows)
        run("check", self.run_dir, "--stage", "verdicts")
        run("merge-packet", self.run_dir)
        jsonl(self.run_dir / "merges.jsonl", [{"row": defect["id"], "into": target["id"], "reason": "fixture shared owner"}])
        checked = run("check", self.run_dir, "--stage", "merges")
        self.assertIn("continue authorized implementation", checked.stdout)
        self.assertNotIn("ask for rulings", checked.stdout)
        report = json.loads((self.run_dir / "report.json").read_text())
        group = next(g for g in report["groups"] if g["id"] == target["id"])
        self.assertEqual(group["finding"], "defect")
        self.assertTrue(group["decision"])
        self.assertIn(defect, group["members"])
        run("rule", self.run_dir, "--decision", "accept", "--verdicts", target["id"], "--reason", "fixture")
        stored = json.loads((self.root / sweep.RULINGS_NAME).read_text())["rulings"]
        self.assertEqual(len(stored), 2)
        run("map", self.run_dir)
        self.assertTrue(any("not implementation evidence" in s.get("user", "") for c in self.clusters().values() for s in c["sites"]))

    def test_change_obligations_survive_merge_and_partial_close(self):
        self.mapped(); rows = self.verdicts()
        changed = next(r for r in rows if r["finding"] == "improvement")
        held = next(r for r in rows if r["finding"] == "defect")
        changed.update(behavior={"kind": "change", "before": "caller waits without a finite budget", "after": "caller receives a timeout"},
                       risk="timeout after a committed write can provoke duplicate retry",
                       validation=["response loss preserves operation identity and recovery"],
                       action="pursue", recommendation="bound waiting while retaining recovery")
        held.update(action="hold", next_step="implementer checks old caller mapping; resume when both wire versions pass")
        self.save_verdicts(rows)
        run("check", self.run_dir, "--stage", "verdicts")
        packet = run("merge-packet", self.run_dir).stdout
        for value in (changed["risk"], changed["validation"][0], held["next_step"]):
            self.assertIn(value, packet)
        jsonl(self.run_dir / "merges.jsonl", [{"row": held["id"], "into": changed["id"], "reason": "fixture overlapping implementation; caller prerequisite still applies"}])
        run("check", self.run_dir, "--stage", "merges")
        report = json.loads((self.run_dir / "report.json").read_text())
        group = next(g for g in report["groups"] if g["id"] == changed["id"])
        self.assertIn(held, group["members"])
        self.assertIn(changed, group["members"])
        self.assertEqual(group["merges"][0]["reason"], "fixture overlapping implementation; caller prerequisite still applies")
        run("close", self.run_dir, "--reason", "fixture bounded finish")
        report = json.loads((self.run_dir / "report.json").read_text())
        members = [m for g in report["groups"] for m in g["members"]]
        self.assertTrue(any(m.get("next_step") == held["next_step"] for m in members))
        self.assertIn(changed["risk"], (self.run_dir / "report.md").read_text())

    def test_supported_changes_require_actionable_assessment(self):
        self.mapped(); rows = self.verdicts()
        row = next(r for r in rows if r["finding"] == "improvement")
        context = sweep.verdict_inputs(self.run_dir)
        for key in ("behavior", "risk", "validation", "action", "recommendation"):
            broken = copy.deepcopy(row); del broken[key]
            failures = []
            sweep.check_verdicts(self.run_dir, failures, complete=False,
                                 rows_override=[("fixture", row["id"].split("-")[0], broken)], context=context)
            self.assertTrue(any(key in f for f in failures), (key, failures))
        for patch, expected in (({"action": "hold"}, "next_step"),
                                ({"action": "defer"}, "action"),
                                ({"behavior": {"kind": "safe", "before": "a", "after": "b"}}, "behavior.kind"),
                                ({"behavior": {"kind": "preserve", "before": " ", "after": "b"}}, "before"),
                                ({"validation": [""]}, "validation"),
                                ({"risk": []}, "risk"), ({"recommendation": " "}, "recommendation")):
            failures = []
            sweep.check_change(dict(row, **patch), "fixture", failures)
            self.assertTrue(any(expected in f for f in failures), failures)
        for action in ("pursue", "hold", "drop"):
            failures = []
            sweep.check_change(dict(row, action=action, next_step="implementer verifies caller compatibility"), "fixture", failures)
            self.assertEqual(failures, [])

    def test_unknown_prerequisite_and_na(self):
        answers = answer_set("entry-point", {"EP6": {"a": "unknown", "missing": "deployment config"}})
        self.assertEqual(answers["EP7"]["a"], "unknown")
        rule = next(r for r in CATALOG["rules"] if r["id"] == "EP-duplicate-delivery")
        self.assertEqual(sweep.evaluate(rule, answers), "unresolved")
        answers["EP7"] = {"a": "n/a", "note": "cannot tell"}
        failures = []
        sweep.check_answer_set(self.root, sweep.questions_of(CATALOG, "entry-point"), answers, "test", failures)
        self.assertTrue(any("unknown prerequisite" in f for f in failures))
        answers = answer_set("entry-point", {"EP1": {"a": "n/a", "note": "cannot tell"}})
        failures = []
        sweep.check_answer_set(self.root, sweep.questions_of(CATALOG, "entry-point"), answers, "test", failures)
        self.assertTrue(any("known-false" in f for f in failures))

    def test_truth_tables(self):
        tokens = ("yes", "no", "unknown", "n/a", None)
        for x, y in itertools.product(tokens, repeat=2):
            a = {"X": {"a": x}, "Y": {"a": y}}
            expected = None if any(z in ("no", "n/a") for z in (x, y)) else "unresolved" if any(z in ("unknown", None) for z in (x, y)) else "matched"
            self.assertEqual(sweep.evaluate({"when": {"X": "yes", "Y": "yes"}}, a), expected)
            self.assertEqual(sweep.condition_met({"X": "yes", "Y": "yes"}, a), {None: False, "unresolved": None, "matched": True}[expected])

    def test_unknown_eligibility_coverage(self):
        cat = {"kinds": {"k": {"questions": [{"id": "X"}, {"id": "Y"}]}}, "coverage": [{"label": "g", "question": "Y", "has": "yes", "among": {"X": "yes"}}]}
        rows = {"s": {"status": "site", "answers": {"X": {"a": "unknown"}, "Y": {"a": "unknown"}}}}
        self.assertEqual(sweep.coverage(cat, rows, {"s": {"kind": "k"}}), [{"label": "g", "has": 0, "of": 0, "unknown": 1}])

    def test_hints_and_alias_corrections(self):
        self.prepare("import")
        hints = json.loads((self.run_dir / "derived.json").read_text())
        self.assertTrue(hints)
        self.assertTrue(all(a["a"] == "yes" for h in hints.values() for a in h.values()))
        # A worker's explicit no is never overwritten by the positive hint.
        merged, _ = sweep.merged_answers(self.run_dir, self.sites())
        sid, hint = next(iter(hints.items()))
        self.assertEqual(merged[sid]["answers"][next(iter(hint))]["a"], "no")
        p = next((self.run_dir / "answers").glob("*.jsonl"))
        rows = [json.loads(l) for l in p.read_text().splitlines()]
        anchor, alias = rows[:2]
        alias_sid = alias["site"]
        alias.clear(); alias.update(site=alias_sid, same_as=anchor["site"])
        jsonl(p, rows)
        run("check", self.run_dir)
        answers = answer_set("import", {"IM2": YES("src/handler.ts:4")})
        update = self.correction(anchor["site"], answers)
        jsonl(self.tmp / "correction.jsonl", [update]); run("correct", self.run_dir, "--file", self.tmp / "correction.jsonl")
        merged, _ = sweep.merged_answers(self.run_dir, self.sites())
        self.assertEqual(merged[alias["site"]]["answers"]["IM2"]["a"], "yes")
        update = self.correction(alias["site"], answer_set("import"))
        jsonl(self.tmp / "correction.jsonl", [update]); run("correct", self.run_dir, "--file", self.tmp / "correction.jsonl")
        merged, _ = sweep.merged_answers(self.run_dir, self.sites())
        self.assertEqual(merged[alias["site"]]["answers"]["IM2"]["a"], "no")
        run("check", self.run_dir)

    def test_named_shape_miss_is_not_no(self):
        (self.root / "src/a.ts").write_text("const a = payload as { uniqueFixtureField: string };\n")
        (self.root / "src/b.ts").write_text("type Named = { uniqueFixtureField: string };\nconst b = payload as Named;\n")
        sites = {"s": {"kind": "decode-boundary", "path": "src/a.ts", "line": 1}}
        self.assertNotIn("DB4", sweep.derive_answers(CATALOG, self.root, sites).get("s", {}))

    def test_source_and_bundle_integrity(self):
        self.prepare()
        for rel in ("src/orders.ts", "template.yaml", "package-lock.json", "nested/backend-primitives.rulings.json"):
            p = self.root / rel; p.parent.mkdir(exist_ok=True)
            old = p.read_bytes() if p.exists() else None
            p.write_text("changed\n")
            run("check", self.run_dir)
            if old is None: p.unlink()
            else: p.write_bytes(old)
        run("check", self.run_dir)
        snapshot = self.run_dir / "source/src/orders.ts"
        old = snapshot.read_text(); snapshot.write_text("changed snapshot")
        self.assertIn("snapshot inputs changed", run("check", self.run_dir, ok=False).stderr)
        snapshot.write_text(old)
        meta = json.loads((self.run_dir / "run.json").read_text()); meta["bundle"] = "old"
        sweep.write_json(self.run_dir / "run.json", meta)
        self.assertIn("skill/catalog changed", run("check", self.run_dir, ok=False).stderr)

    def test_site_rulings(self):
        self.prepare()
        s = next(iter(self.sites().values())); meta = sweep.run_meta(self.run_dir)
        rule = next(r for r in CATALOG["rules"] if r["kind"] == s["kind"])
        identity = sweep.site_identity(meta, s, {}, rule)
        row = {"rule": "rule", "decision": "reject", "paths": [s["path"]]}
        self.assertEqual(sweep.ruling_effect([row], "rule", s["path"], identity), (None, None))
        row["identities"] = [identity]
        self.assertEqual(sweep.ruling_effect([row], "rule", s["path"], identity)[0], "reject")
        self.assertNotEqual(identity, sweep.site_identity(meta, {**s, "line": s["line"] + 1}, {}, rule))
        changed = copy.deepcopy(meta); changed["inputs"]["template.yaml"] = "new"
        self.assertEqual(identity, sweep.site_identity(changed, s, {}, rule))

    def test_audit_gate_sampling_and_staleness(self):
        self.prepare()
        self.assertIn("run audit", run("map", self.run_dir, ok=False).stderr)
        self.audit(2)
        first = json.loads((self.run_dir / "audit.json").read_text())
        self.audit(2)
        self.assertEqual(first["selected"], json.loads((self.run_dir / "audit.json").read_text())["selected"])
        self.assertEqual(len(first["selected"]), first["mandatory"] + min(2, first["eligible"] - first["mandatory"]))
        for row in first["selected"]:
            if row["mandatory"]: continue
            self.assertTrue(all(next(r for r in CATALOG["rules"] if r["id"] == rid)["lane"] == "defect" for rid in row["rules"]))
        p = next((self.run_dir / "answers").glob("*.jsonl")); rows = [json.loads(l) for l in p.read_text().splitlines()]
        next(iter(rows[0]["answers"].values()))["note"] = "changed observation"
        jsonl(p, rows)
        self.assertIn("audit is stale", run("map", self.run_dir, ok=False).stderr)

    def test_refutation_reopens_coverage(self):
        self.mapped(); rows = self.verdicts(); clusters = self.clusters()
        row = next(r for r in rows if clusters[r["cluster"]]["rule"] == "XC-unsafe-replay")
        sid = clusters[row["cluster"]]["sites"][0]["site"]
        effective, _ = sweep.merged_answers(self.run_dir, self.sites())
        answers = answer_set("external-call", {**effective[sid]["answers"], "XC1": {"a": "no", "note": "fixture correction"}, "XC2": {"a": "n/a"}, "XC3": {"a": "n/a"}})
        # Recalculate every conditional after the changed prerequisite.
        overrides = {k:v for k,v in answers.items() if v["a"] != "n/a" and sweep.condition_met(sweep.questions_of(CATALOG, "external-call")[k].get("only_if", {}), answers) is not False}
        answers = answer_set("external-call", overrides)
        row.update(finding="refuted", remedy="none", decision=False, fact="XC1", corrections=[self.correction(sid, answers)])
        self.save_verdicts(rows)
        run("check", self.run_dir, "--stage", "verdicts")
        jsonl(self.run_dir / "merges.jsonl", [])
        self.assertIn("refut", run("check", self.run_dir, "--stage", "merges", ok=False).stderr)
        run("reconcile", self.run_dir)
        self.assertFalse((self.run_dir / "coverage.md").exists())
        self.assertFalse((self.run_dir / "audit.json").exists())
        run("check", self.run_dir)
        self.audit(); run("map", self.run_dir)
        self.assertNotIn("XC-unsafe-replay", {c["rule"] for c in self.clusters().values()})

    def test_judge_site_budget_and_required_inspection(self):
        self.mapped(3)
        clusters = self.clusters(); owners = {}
        for p in (self.run_dir / "judges").glob("*.json"):
            ids = {s["site"] for cid in json.loads(p.read_text())["clusters"] for s in clusters[cid]["sites"]}
            self.assertLessEqual(len(ids), 3)
            for sid in ids:
                self.assertNotIn(sid, owners); owners[sid] = p.stem
        rows = self.verdicts(); del rows[0]["inspected"]; self.save_verdicts(rows)
        self.assertIn("inspected", run("check", self.run_dir, "--stage", "verdicts", ok=False).stderr)

    def test_single_site_boundary_exception(self):
        self.mapped(1); rows = self.verdicts()
        row = next(r for r in rows if r["finding"] == "improvement")
        row.update(remedy="primitive", signature="run(input)", enforcement="registration rule")
        self.save_verdicts(rows)
        self.assertIn("small primitive", run("check", self.run_dir, "--stage", "verdicts", ok=False).stderr)
        row["boundary"] = "entry runner"; self.save_verdicts(rows)
        run("check", self.run_dir, "--stage", "verdicts")

    def test_cache_capacity_and_freshness(self):
        answers = answer_set("module-state", {"MS1": YES("src/orders.ts:1"), "MS2": YES("src/orders.ts:1"), "MS5": YES("src/orders.ts:1")})
        rules = {r["id"]: r for r in CATALOG["rules"]}
        self.assertEqual(sweep.evaluate(rules["MS-stale-source"], answers), "matched")
        self.assertIsNone(sweep.evaluate(rules["MS-unbounded-cache"], answers))
        self.assertIn("AbortSignal", sweep.questions_of(CATALOG, "external-call")["XC4"]["yes"])

    def test_v3_declarations(self):
        effect = self.tmp / "effect"; decl = effect / "dist/dts/Effect.d.ts"
        decl.parent.mkdir(parents=True); decl.write_text("export declare const tryPromise: unknown;\n")
        pkg = {"exports": {"./Effect": {"types": "./dist/dts/Effect.d.ts"}}}
        self.assertEqual(sweep.declaration_path(effect, pkg, "Effect"), decl)
        self.assertIn("tryPromise", sweep.export_names(decl.read_text()))
        self.assertEqual(sweep.declaration_path(effect, {}, "Effect"), decl)
        self.assertIsNone(sweep.declaration_path(effect, {"exports": {".": "./index.js"}}, "Effect"))
        self.assertIsNone(sweep.declaration_path(effect, {"exports": {"./Effect": None, "./*": {"types": "./dist/dts/*.d.ts"}}}, "Effect"))

    def test_bad_input_and_no_sites(self):
        badrun = self.root / "run"
        self.assertNotEqual(run("inventory", self.root, "--run", badrun, ok=False).returncode, 0)
        self.assertFalse(badrun.exists())
        self.prepare()
        self.assertIn("must be positive", run("shard", self.run_dir, "--answers", 0, ok=False).stderr)
        p = next((self.run_dir / "answers").glob("*.jsonl")); p.write_text("[]\n")
        out = run("check", self.run_dir, ok=False)
        self.assertIn("expected a JSON object", out.stderr); self.assertNotIn("Traceback", out.stderr)
        empty = self.tmp / "empty"; empty.mkdir()
        self.assertIn("nothing to sweep", run("inventory", empty, "--run", self.tmp / "empty-run").stdout)

    def test_audit_regeneration_preserves_confirmations(self):
        self.prepare(); self.audit(2)
        run("audit", self.run_dir, "--sample", 2)
        self.assertTrue((self.run_dir / "audit-answers.jsonl").exists())
        run("check", self.run_dir, "--stage", "audit")
        self.assertTrue(json.loads((self.run_dir / "audit.json").read_text())["reused"])

    def test_explicit_inapplicable_and_unused_response(self):
        answers = answer_set("entry-point")
        del answers["EP11"]
        failures = []
        sweep.check_answer_set(self.root, sweep.questions_of(CATALOG, "entry-point"), answers, "test", failures)
        self.assertTrue(any("EP11" in f for f in failures))
        answers = answer_set("external-call", {"XC13": {"a": "n/a", "note": "response unused"}})
        failures = []
        sweep.check_answer_set(self.root, sweep.questions_of(CATALOG, "external-call"), answers, "test", failures)
        self.assertFalse(failures, failures)
        answers = answer_set("entry-point", {"EP5": {"a": "n/a", "note": "constant health response consumes no input"}, "EP3": {"a": "n/a", "note": "constant response starts no expected fallible operation"}})
        failures = []
        sweep.check_answer_set(self.root, sweep.questions_of(CATALOG, "entry-point"), answers, "test", failures)
        self.assertFalse(failures, failures)

    def test_boundary_comparison_and_unmeasured(self):
        self.prepare()
        run("boundary", self.run_dir)
        self.assertFalse(json.loads((self.run_dir / "boundary.json").read_text())["measured"])
        diagnostics = self.tmp / "diagnostics.json"
        sweep.write_json(diagnostics, {"diagnostics": [
            {"file": str(self.root / "src/config.ts"), "line": 2, "name": "processEnv"},
            {"file": "src/config.ts", "line": 999, "name": "processEnv"},
            {"file": "src/handler.ts", "name": "newPromise"}]})
        run("boundary", self.run_dir, "--tsgo-json", diagnostics)
        data = json.loads((self.run_dir / "boundary.json").read_text())
        self.assertTrue(data["measured"])
        self.assertTrue(data["locations"][0]["inventory"])
        self.assertFalse(data["locations"][1]["inventory"])
        self.assertIsNone(data["locations"][2]["kind"])
        self.assertIn("different denominators", (self.run_dir / "boundary.md").read_text())

    def test_effect_proposal_checks_used_api_not_all_alternatives(self):
        effect = self.root / "node_modules/effect"
        (effect / "dist/dts").mkdir(parents=True)
        sweep.write_json(effect / "package.json", {"version": "3.0.0", "exports": {"./Effect": {"types": "./dist/dts/Effect.d.ts"}}})
        (effect / "dist/dts/Effect.d.ts").write_text("export declare const timeout: unknown;\n")
        self.mapped(); rows = self.verdicts()
        row = next(r for r in rows if r["finding"] == "improvement")
        row.update(remedy="effect", apis=["Effect.timeout"])
        self.save_verdicts(rows)
        run("check", self.run_dir, "--stage", "verdicts")
        row["apis"] = ["Effect.missing"]
        self.save_verdicts(rows)
        self.assertIn("proposed API Effect.missing", run("check", self.run_dir, "--stage", "verdicts", ok=False).stderr)

    def test_same_group_merge_keeps_defect(self):
        self.mapped(); rows = self.verdicts()
        defect = next(r for r in rows if r["finding"] == "defect")
        target = next(r for r in rows if r["finding"] == "improvement" and r["id"].split("-")[0] == defect["id"].split("-")[0])
        defect["covered_by"] = target["id"]; self.save_verdicts(rows)
        self.assertIn("keep the original finding", run("check", self.run_dir, "--stage", "verdicts", ok=False).stderr)
        del defect["covered_by"]; self.save_verdicts(rows)
        jsonl(self.run_dir / "merges.jsonl", [{"row": defect["id"], "into": target["id"], "reason": "fixture shared owner"}])
        run("check", self.run_dir, "--stage", "merges")
        group = next(g for g in json.loads((self.run_dir / "report.json").read_text())["groups"] if g["id"] == target["id"])
        self.assertEqual(group["finding"], "defect")

    def test_known_inapplicable_coverage_is_excluded(self):
        cat = {"kinds": {"k": {"questions": [{"id": "X"}]}}, "coverage": [{"label": "g", "question": "X", "has": "yes"}]}
        rows = {"s": {"status": "site", "answers": {"X": {"a": "n/a"}}}}
        self.assertEqual(sweep.coverage(cat, rows, {"s": {"kind": "k"}}), [{"label": "g", "has": 0, "of": 0, "unknown": 0}])

    def test_continuation_reuses_only_unchanged_verdicts(self):
        self.mapped(); rows = self.verdicts()
        run("check", self.run_dir, "--stage", "verdicts")
        run("map", self.run_dir)
        carried = [json.loads(x) for x in (self.run_dir / "carried.jsonl").read_text().splitlines()]
        self.assertEqual(len(carried), len(rows))
        run("check", self.run_dir, "--stage", "verdicts")
        effective, _ = sweep.merged_answers(self.run_dir, self.sites())
        sid = next(sid for sid, site in self.sites().items() if site["kind"] == "external-call")
        answers = copy.deepcopy(effective[sid]["answers"])
        answers["XC4"] = YES("src/orders.ts:7")
        jsonl(self.tmp / "update.jsonl", [self.correction(sid, answers)])
        run("correct", self.run_dir, "--file", self.tmp / "update.jsonl")
        self.audit(); run("map", self.run_dir)
        carried = [json.loads(x) for x in (self.run_dir / "carried.jsonl").read_text().splitlines()]
        self.assertTrue(carried)
        self.assertTrue(all(sid not in r["sites"] for r in carried))
        self.assertLess(len(carried), len(rows))

    def test_hint_audit_refutation_and_singleton_contract(self):
        self.prepare()
        self.assertEqual(sum(s["kind"] == "client-contract" for s in self.sites().values()), 1)
        run("audit", self.run_dir, "--sample", 0)
        selected = json.loads((self.run_dir / "audit.json").read_text())["selected"]
        self.assertTrue(selected)
        self.assertTrue(all(i["mandatory"] for i in selected))
        item = next(i for i in selected if self.sites()[i["site"]]["kind"] == "import")
        sid = item["site"]
        effective, _ = sweep.merged_answers(self.run_dir, self.sites())
        answers = copy.deepcopy(effective[sid]["answers"])
        answers[item["question"]] = YES(item["hint"]["ev"])
        rows = [{"id": i["id"], "fingerprint": i["fingerprint"], "result": "confirmed",
                 "evidence": [i["hint"]["ev"]], "searched": "synthetic fixture"} for i in selected]
        row = next(r for r in rows if r["id"] == item["id"])
        row.update(result="refuted", correction=self.correction(sid, answers))
        jsonl(self.run_dir / "audit-answers.jsonl", rows)
        run("check", self.run_dir, "--stage", "audit")
        self.assertIn("refutations remain", run("map", self.run_dir, ok=False).stderr)
        run("reconcile", self.run_dir, "--stage", "audit")
        run("check", self.run_dir)
        effective, _ = sweep.merged_answers(self.run_dir, self.sites())
        self.assertEqual(effective[sid]["answers"][item["question"]]["a"], "yes")

    def test_rejected_ruling_survives_unrelated_new_run(self):
        self.mapped(); rows = self.verdicts()
        jsonl(self.run_dir / "merges.jsonl", [])
        run("check", self.run_dir, "--stage", "merges")
        target = next(r for r in rows if r["finding"] == "defect")
        run("rule", self.run_dir, "--decision", "reject", "--verdicts", target["id"], "--reason", "fixture decision")
        (self.root / "unrelated.txt").write_text("unrelated live edit")
        self.run_dir = self.tmp / "second-run"
        self.prepare(); self.audit(); run("map", self.run_dir)
        data = json.loads((self.run_dir / "clusters.json").read_text())
        self.assertTrue(data["held"])
        self.assertTrue(all(x["decision"] == "reject" for x in data["held"]))
        run("map", self.run_dir, "--include-held")
        self.assertFalse(json.loads((self.run_dir / "clusters.json").read_text())["held"])

    def test_nested_workspace_dependencies_remain_citable(self):
        decl = self.root / "packages/api/node_modules/effect/Effect.d.ts"
        decl.parent.mkdir(parents=True); decl.write_text("export declare const tryPromise: unknown;\n")
        run("inventory", self.root, "--run", self.run_dir)
        snap = self.run_dir / "source"
        self.assertTrue((snap / decl.relative_to(self.root)).is_file())
        failures = []
        sweep.check_evidence(snap, str(decl) + ":1", "nested dependency", failures)
        self.assertFalse(failures, failures)

    def test_runtime_export_declarations_and_blocked_subpath(self):
        effect = self.root / "node_modules/effect"
        (effect / "dist").mkdir(parents=True)
        package = {"version": "4.0.3", "exports": {"./*": "./dist/*.js", "./Private": None}}
        sweep.write_json(effect / "package.json", package)
        (effect / "dist/Effect.d.ts").write_text("export declare const timeout: unknown;\n")
        (effect / "dist/Private.d.ts").write_text("export declare const hidden: unknown;\n")
        self.mapped(); rows = self.verdicts()
        api = json.loads((self.run_dir / "api.json").read_text())
        self.assertEqual(api["installed"], "4.0.3")
        row = next(r for r in rows if r["finding"] == "improvement")
        row.update(remedy="effect", apis=["Effect.timeout"])
        self.save_verdicts(rows)
        run("check", self.run_dir, "--stage", "verdicts")
        self.assertIsNone(sweep.declaration_path(effect, package, "Private"))
        (effect / "dist/Worker.d.mts").write_text("export {};\n")
        self.assertEqual(sweep.declaration_path(effect, {"exports": {"./Worker": "./dist/Worker.mjs"}}, "Worker").suffix, ".mts")

    def test_ignored_dependency_search_and_registered_evidence(self):
        self.root.joinpath(".gitignore").write_text("node_modules/\n")
        dep = self.root / "node_modules/client"
        dep.mkdir(parents=True); (dep / "index.js").write_text("const retryCount = 3;\n")
        self.prepare()
        packet = run("packet", self.run_dir, "A01").stdout
        self.assertIn("--no-ignore", packet)
        search = subprocess.run(["rg", "--no-ignore", "--follow", "retryCount", str(self.run_dir / "source/node_modules/client")], capture_output=True, text=True)
        self.assertEqual(search.returncode, 0)
        excerpt = self.tmp / "excerpt.md"; excerpt.write_text("A supplied test platform contract.\n")
        run("evidence", self.run_dir, "--file", excerpt, "--url", "https://example.com/contract", "--retrieved", "2026-10-14", "--id", "delivery")
        failures = []; root = sweep.run_meta(self.run_dir)["root"]
        sweep.check_evidence(root, "@evidence/delivery.md:1", "test", failures)
        self.assertEqual(failures, [])
        (self.run_dir / "evidence/delivery.md").write_text("changed\n")
        sweep.check_evidence(root, "@evidence/delivery.md:1", "test", failures)
        self.assertTrue(failures)

    def test_conditional_answers_and_concrete_source_evidence(self):
        self.prepare(kinds="external-call,error-handling,entry-point")
        sid, site = next((sid, site) for sid, site in self.sites().items() if site["kind"] == "external-call")
        answers = answer_set("external-call")
        for q in CATALOG["kinds"]["external-call"]["questions"]:
            if q.get("only_if"): answers.pop(q["id"])
        failures = []; expanded = sweep.validate_answers(self.run_dir, sid, site, answers, "test", failures)
        self.assertEqual(failures, [])
        self.assertEqual(expanded["XC2"]["a"], "n/a")
        answers["XC1"] = {"a": "unknown", "missing": "provider operation contract"}
        expanded = sweep.expand_answers(self.run_dir, sid, "external-call", answers)
        self.assertEqual(expanded["XC2"]["a"], "unknown")
        answers["XC1"] = YES("src/orders.ts:7")
        failures = []; sweep.validate_answers(self.run_dir, sid, site, answers, "test", failures)
        self.assertTrue(any("XC2: missing answer" in f for f in failures))
        q = next(q for k in CATALOG["kinds"].values() for q in k["questions"] if q["id"] == "EH3")
        failures = []; sweep.check_answer_set(sweep.run_meta(self.run_dir)["root"], {"EH3": q}, {"EH3": YES("src/handler.ts:17")}, "test", failures)
        self.assertIn("source_ev", " ".join(failures))

    def test_shared_facts_bindings_and_invalidation(self):
        self.prepare(kinds="external-call")
        sid, site = next(iter(self.sites().items())); ev = f"{site['path']}:{site['line']}"
        data = {"owners": [{"id": "O1", "name": "fixture owner", "evidence": [ev], "sites": [{"site": sid, "relation": "uses", "evidence": [ev], "reason": "fixture binding"}], "coverage": [{"boundary": b, "status": "not-applicable", "sites": [], "guarantee": "fixture scope", "evidence": [ev], "reason": "fixture has no contributing boundary"} for b in ("entry", "crossing", "cleanup")]}],
                "facts": [{"id": "F1", "owner": "O1", "question": "XC5", "basis": "project", "conditions": "default options", "exceptions": "retry disabled", "answer": YES(ev)}], "unknowns": []}
        sweep.write_json(self.run_dir / "protections.json", data)
        run("check", self.run_dir, "--stage", "protections")
        binding = {"shared": "F1", "fact_digest": sweep.shared_digest(data, data["facts"][0]), "binding": {"ev": ev, "note": "default options at call"}}
        answers = answer_set("external-call", {"XC5": binding})
        # XC5 becomes yes through the shared fact, so its newly applicable follow-ups are owed.
        expanded = sweep.expand_answers(self.run_dir, sid, "external-call", answers)
        for q in CATALOG["kinds"]["external-call"]["questions"]:
            if q.get("only_if") and sweep.condition_met(q["only_if"], expanded) is True:
                answers[q["id"]] = {"a": "no", "note": "fixture inspected"}
        failures = []; expanded = sweep.validate_answers(self.run_dir, sid, site, answers, "test", failures)
        self.assertEqual(failures, []); self.assertEqual(expanded["XC5"]["a"], "yes")
        data["facts"][0]["conditions"] = "new options"
        sweep.write_json(self.run_dir / "protections.json", data); run("check", self.run_dir, "--stage", "protections")
        failures = []; sweep.validate_answers(self.run_dir, sid, site, answers, "test", failures)
        self.assertIn("shared fact changed", " ".join(failures))
        answers["XC5"]["fact_digest"] = sweep.shared_digest(data, data["facts"][0])
        data["owners"][0]["sites"][0]["relation"] = "bypasses"
        sweep.write_json(self.run_dir / "protections.json", data); run("check", self.run_dir, "--stage", "protections")
        failures = []; sweep.validate_answers(self.run_dir, sid, site, answers, "test", failures)
        self.assertIn("not a verified user", " ".join(failures))

    def test_judge_and_correct_enforce_hint_refutation(self):
        self.prepare()
        sid = next(sid for sid, hint in sweep.derived_of(self.run_dir).items() if "IM2" in hint)
        for path in (self.run_dir / "answers").glob("*.jsonl"):
            answers = [r for _, r in sweep.load_jsonl(path, [])]
            for r in answers:
                if r["site"] == sid:
                    r["answers"]["IM2"] = YES(sweep.derived_of(self.run_dir)[sid]["IM2"]["ev"])
            jsonl(path, answers)
        self.audit(); run("map", self.run_dir); rows = self.verdicts()
        row = next(r for r in rows if sid in [x["site"] for x in self.clusters()[r["cluster"]]["sites"]])
        answers = answer_set("import")
        answers["IM2"].pop("hint_refutation", None)
        correction = self.correction(sid, answers)
        row.update(finding="refuted", remedy="none", decision=False, sites=[sid], inspected=[sid], fact="IM2", corrections=[correction])
        failures = []; sweep.check_verdicts(self.run_dir, failures, complete=False, rows_override=[("test", row["id"].split("-")[0], row)])
        self.assertIn("requires hint_refutation", " ".join(failures))
        file = self.tmp / "correction.jsonl"; jsonl(file, [correction])
        self.assertIn("requires hint_refutation", run("correct", self.run_dir, "--file", file, ok=False).stderr)

    def test_partial_close_revalidates_cache_and_keeps_pending(self):
        self.mapped(); self.verdicts(); run("check", self.run_dir, "--stage", "verdicts")
        sweep.save_reusable(self.run_dir)
        cache = json.loads((self.run_dir / "reusable.json").read_text())
        corrupted_id = cache[0]["row"]["id"]
        cache[0]["row"]["evidence"] = ["absent.ts:1"]
        sweep.write_json(self.run_dir / "reusable.json", cache)
        # Remove the source judgment; close must not trust the cached row's old check.
        for p in (self.run_dir / "verdicts").glob("*.jsonl"): p.unlink()
        run("close", self.run_dir)
        report = json.loads((self.run_dir / "report.json").read_text())
        self.assertEqual(report["status"], "partial")
        self.assertTrue(report["pending"])
        self.assertTrue(report["groups"])
        self.assertFalse(any("absent.ts:1" in m["evidence"] for g in report["groups"] for m in g["members"]))
        chosen = next(iter(self.clusters()))
        run("close", self.run_dir, "--clusters", chosen)
        report = json.loads((self.run_dir / "report.json").read_text())
        self.assertTrue(any(x["reason"] == "outside selected work" for x in report["pending"]))

    def test_round_cap_counts_passes_and_writes_report(self):
        self.mapped(); self.verdicts(); run("check", self.run_dir, "--stage", "verdicts")
        ids = [sid for sid, s in self.sites().items() if s["kind"] == "external-call"][:3]
        file = self.tmp / "correction.jsonl"
        for sid in ids[:2]:
            effective, _ = sweep.merged_answers(self.run_dir, self.sites())
            answers = copy.deepcopy(effective[sid]["answers"])
            answers["XC4"] = {"a": "unknown", "missing": "fixture caller deadline changed"}
            jsonl(file, [self.correction(sid, answers)])
            run("correct", self.run_dir, "--file", file, "--max-rounds", 1)
        self.assertEqual(json.loads((self.run_dir / "correction-rounds.json").read_text()), [1])
        report = json.loads((self.run_dir / "report.json").read_text()); self.assertTrue(report["pending"])
        self.audit(); run("map", self.run_dir)
        effective, _ = sweep.merged_answers(self.run_dir, self.sites())
        answers = copy.deepcopy(effective[ids[2]]["answers"]); answers["XC4"] = {"a": "unknown", "missing": "another caller"}
        jsonl(file, [self.correction(ids[2], answers)])
        out = run("correct", self.run_dir, "--file", file, "--max-rounds", 1, ok=False)
        self.assertIn("checked partial report written", out.stderr)
        report = json.loads((self.run_dir / "report.json").read_text())
        self.assertTrue(any(x["site"] == ids[2] for x in report["unanswered"]))
        # Reconcile also uses pending-corrections.jsonl as the correction input.
        out = run("correct", self.run_dir, "--file", self.run_dir / "pending-corrections.jsonl", "--max-rounds", 1, ok=False)
        self.assertIn("checked partial report written", out.stderr)
        self.assertNotIn("Traceback", out.stderr)

    def test_owner_discovery_pilot_and_focused_completion(self):
        run("inventory", self.root, "--run", self.run_dir, "--kinds", "external-call")
        extra = self.tmp / "extra.jsonl"
        jsonl(extra, [{"kind": "external-call", "path": "src/orders.ts", "line": 4, "reason": "fixture exported operation caller"}])
        old_count = len(self.sites()); run("add-sites", self.run_dir, "--file", extra)
        self.assertEqual(len(self.sites()), old_count + 1)
        run("owners", self.run_dir)
        sweep.write_json(self.run_dir / "protections.json", {"owners": [], "facts": [], "unknowns": []})
        run("check", self.run_dir, "--stage", "protections"); run("pilot", self.run_dir, "--size", 1)
        self.assertIn("assess the pilot", run("shard", self.run_dir, ok=False).stderr)
        p = next((self.run_dir / "shards").glob("*.json")); ids = json.loads(p.read_text())["sites"]
        jsonl(self.run_dir / "answers" / (p.stem + ".jsonl"), [{"site": sid, "answers": answer_set("external-call")} for sid in ids])
        run("check", self.run_dir, "--stage", "answers"); self.audit(); run("map", self.run_dir)
        self.verdicts(); run("check", self.run_dir, "--stage", "verdicts")
        run("pilot", self.run_dir, "--assess", "--decision", "focus", "--reason", "fixture checked")
        run("close", self.run_dir)
        report = json.loads((self.run_dir / "report.json").read_text())
        self.assertEqual(len(report["unanswered"]), old_count)
        run("shard", self.run_dir)
        assigned = [sid for p in (self.run_dir / "shards").glob("*.json") for sid in json.loads(p.read_text())["sites"]]
        self.assertEqual(len(assigned), len(set(assigned)))
        self.assertEqual(len(assigned), old_count + 1)

    def test_close_keeps_disputes_across_repeated_close(self):
        self.mapped(); rows = self.verdicts()
        row = next(r for r in rows if self.clusters()[r["cluster"]]["rule"] == "XC-no-deadline")
        sites = [s["site"] for s in self.clusters()[row["cluster"]]["sites"]]
        effective, _ = sweep.merged_answers(self.run_dir, self.sites())
        corrections = []
        for sid in sites:
            answers = copy.deepcopy(effective[sid]["answers"]); answers["XC4"] = YES("src/orders.ts:7")
            corrections.append(self.correction(sid, answers))
        row.update(finding="refuted", remedy="none", decision=False, fact="XC4", corrections=corrections)
        self.save_verdicts(rows); run("check", self.run_dir, "--stage", "verdicts")
        jsonl(self.run_dir / "pending-corrections.jsonl", [{**c, "reason": "same correction from another judge"} for c in corrections])
        for _ in range(2):
            run("close", self.run_dir)
            report = json.loads((self.run_dir / "report.json").read_text())
            self.assertTrue(set(sites) <= {s["site"] for s in report["unanswered"]})
            self.assertFalse(any(set(sites) & set(m["sites"]) for g in report["groups"] for m in g["members"]))
        pending = self.run_dir / "pending-corrections.jsonl"
        self.assertEqual(len(sweep.load_jsonl(pending, [])), len(sites))
        run("correct", self.run_dir, "--file", pending)
        run("close", self.run_dir)
        report = json.loads((self.run_dir / "report.json").read_text())
        self.assertFalse(set(sites) & {s["site"] for s in report["unanswered"]})

    def test_close_retains_valid_rows_from_incomplete_group(self):
        self.mapped(); rows = self.verdicts(); row = rows[0]
        for p in (self.run_dir / "verdicts").glob("*.jsonl"): p.unlink()
        self.save_verdicts([row])
        run("close", self.run_dir)
        report = json.loads((self.run_dir / "report.json").read_text())
        self.assertEqual(len(report["groups"]), 1)
        self.assertTrue(report["pending"])

    def test_initial_evidence_corrections_do_not_consume_judge_round(self):
        self.prepare(kinds="external-call")
        sid = next(iter(self.sites()))
        effective, _ = sweep.merged_answers(self.run_dir, self.sites())
        answers = copy.deepcopy(effective[sid]["answers"]); answers["XC4"] = YES("src/orders.ts:7")
        path = self.tmp / "correct.jsonl"; jsonl(path, [self.correction(sid, answers)])
        run("correct", self.run_dir, "--file", path, "--max-rounds", 1)
        self.assertEqual(json.loads((self.run_dir / "correction-rounds.json").read_text()), [])
        self.assertFalse((self.run_dir / "report.json").exists())

    def test_credential_unknown_reaches_judge_packet(self):
        self.prepare(kinds="entry-point")
        for p in (self.run_dir / "answers").glob("*.jsonl"):
            rows = [r for _, r in sweep.load_jsonl(p, [])]
            for row in rows:
                if self.sites()[row["site"]]["kind"] == "entry-point":
                    row["answers"] = answer_set("entry-point", {"EP10": {"a": "unknown", "missing": "authentication owner unavailable"}})
            jsonl(p, rows)
        run("check", self.run_dir, "--stage", "answers"); self.audit(); run("map", self.run_dir)
        self.assertTrue(any(c["rule"] == "EP-credential-comparison" for c in self.clusters().values()))
        for p in (self.run_dir / "judges").glob("*.json"):
            run("judge-packet", self.run_dir, p.stem)

    def test_catalog_references(self):
        qids = []
        for kind, spec in CATALOG["kinds"].items():
            available = set()
            for q in spec["questions"]:
                self.assertTrue(set(q.get("only_if", {})) <= available)
                available.add(q["id"]); qids.append(q["id"])
            for rule in (r for r in CATALOG["rules"] if r["kind"] == kind):
                self.assertTrue(set(rule["when"]) <= available)
                self.assertIn(rule["concept"], CATALOG["concepts"])
                self.assertTrue(rule["mechanism"])
                self.assertTrue(rule["counter"])
        self.assertEqual(len(qids), len(set(qids)))
        ids = [r["id"] for r in CATALOG["rules"]]
        self.assertEqual(len(ids), len(set(ids)))
        for c in CATALOG["coverage"]:
            self.assertIn(c["question"], qids)
            self.assertTrue(set(c.get("among", {})) <= set(qids))

    def fixture_owner(self, sid):
        site = self.sites()[sid]; ev = f"{site['path']}:{site['line']}"
        return {"owners": [{"id": "O1", "name": "fixture owner", "evidence": [ev],
                           "sites": [{"site": sid, "relation": "uses", "evidence": [ev], "reason": "fixture call"}],
                           "coverage": [{"boundary": b, "status": "not-applicable", "sites": [],
                                         "guarantee": "fixture lifetime", "evidence": [ev], "reason": "fixture has no such dependency"}
                                        for b in ("entry", "crossing", "cleanup")]}], "facts": [], "unknowns": []}

    def test_optional_audit_cohort_does_not_refill_after_corrections(self):
        self.prepare()
        candidates = sweep.audit_candidates(self.run_dir)
        args = argparse.Namespace(run=str(self.run_dir), sample=10, all=False)
        with contextlib.redirect_stdout(io.StringIO()): sweep.cmd_audit(args)
        first = sweep.load_json(self.run_dir / "audit-cohort.json")
        retired = set(first["optional"][:8])
        self.assertEqual(len(retired), 8)
        remaining = [r for r in candidates if r["id"] not in retired]
        args.sample = None
        with mock.patch.object(sweep, "audit_candidates", return_value=remaining), contextlib.redirect_stdout(io.StringIO()):
            sweep.cmd_audit(args)
            refreshed = sweep.load_json(self.run_dir / "audit.json")
            self.assertEqual(set(sweep.load_json(self.run_dir / "audit-cohort.json")["optional"]), set(first["optional"]))
            self.assertEqual(set(refreshed["optional_retired"]), retired)
            self.assertEqual({r["id"] for r in refreshed["selected"] if not r["mandatory"]}, set(first["optional"]) - retired)
            self.assertEqual({r["id"] for r in refreshed["selected"] if r["mandatory"]}, {r["id"] for r in candidates if r["mandatory"]})
            args.sample = 12; sweep.cmd_audit(args)
            expanded = sweep.load_json(self.run_dir / "audit-cohort.json")
            self.assertEqual(len(expanded["optional"]), 12)
            self.assertTrue(set(first["optional"]) <= set(expanded["optional"]))

    def test_optional_cohort_empty_slots_new_mandatory_and_new_batch(self):
        self.prepare()
        candidates = sweep.audit_candidates(self.run_dir)
        optional = [r for r in candidates if not r["mandatory"]]
        self.assertGreater(len(optional), 3)
        args = argparse.Namespace(run=str(self.run_dir), sample=3, all=False)
        with mock.patch.object(sweep, "audit_candidates", return_value=optional[:1]), contextlib.redirect_stdout(io.StringIO()):
            sweep.cmd_audit(args)
        args.sample = None
        new_mandatory = {**optional[2], "mandatory": True}
        with mock.patch.object(sweep, "audit_candidates", return_value=optional[:2] + [new_mandatory]), contextlib.redirect_stdout(io.StringIO()):
            sweep.cmd_audit(args)
            selected = sweep.load_json(self.run_dir / "audit.json")["selected"]
            self.assertEqual({r["id"] for r in selected}, {optional[0]["id"], new_mandatory["id"]})
        cohort = sweep.load_json(self.run_dir / "audit-cohort.json")
        cohort["sites"] = cohort["sites"][:-1]  # prior answered batch had one fewer site
        sweep.write_json(self.run_dir / "audit-cohort.json", cohort)
        args.sample = 3
        with contextlib.redirect_stdout(io.StringIO()): sweep.cmd_audit(args)
        self.assertEqual(len(sweep.load_json(self.run_dir / "audit-cohort.json")["optional"]), 3)
        args.all = True
        with contextlib.redirect_stdout(io.StringIO()): sweep.cmd_audit(args)
        self.assertEqual(sweep.load_json(self.run_dir / "audit.json")["eligible"], len(sweep.load_json(self.run_dir / "audit.json")["selected"]))

    def test_owner_focus_includes_boundaries_and_retains_exclusions(self):
        self.prepare()
        sid = next(s for s, row in self.sites().items() if row["kind"] == "external-call")
        entry = next(s for s, row in self.sites().items() if row["kind"] == "entry-point")
        data = self.fixture_owner(sid); coverage = data["owners"][0]["coverage"]
        coverage[0].update(status="included", sites=[entry])
        coverage[1].update(status="outside-scope", reason="explicit inventory restriction")
        coverage[2].update(status="unknown", missing="client cleanup evidence")
        sweep.write_json(self.run_dir / "protections.json", data)
        run("check", self.run_dir, "--stage", "protections")
        self.assertEqual(sweep.owner_sites(self.run_dir, "O1"), {sid, entry})
        run("pilot", self.run_dir, "--size", 1)
        self.assertEqual(sweep.load_json(self.run_dir / "pilot.json")["sites"], [entry])
        self.audit(); run("map", self.run_dir); self.verdicts()
        run("check", self.run_dir, "--stage", "verdicts")
        jsonl(self.run_dir / "merges.jsonl", []); run("check", self.run_dir, "--stage", "merges")
        report = sweep.load_json(self.run_dir / "report.json")
        self.assertEqual(report["status"], "partial")
        self.assertEqual({r["status"] for r in report["owner_coverage"]}, {"included", "outside-scope", "unknown"})
        coverage[0].update(status="included", sites=[])
        sweep.write_json(self.run_dir / "protections.json", data)
        self.assertNotEqual(run("check", self.run_dir, "--stage", "protections", ok=False).returncode, 0)

    def test_owner_coverage_change_requires_remap_without_invalidating_site_verdicts(self):
        self.mapped(); self.verdicts(); run("check", self.run_dir, "--stage", "verdicts")
        before = sweep.effective_digest(self.run_dir)
        data = self.fixture_owner(next(iter(self.sites())))
        data["owners"][0]["coverage"][2].update(status="unknown", missing="cleanup completion unknown")
        sweep.write_json(self.run_dir / "protections.json", data)
        previous_map = (self.run_dir / "clusters.json").read_text()
        self.assertIn("check --stage protections", run("map", self.run_dir, ok=False).stderr)
        self.assertEqual((self.run_dir / "clusters.json").read_text(), previous_map)
        run("check", self.run_dir, "--stage", "protections")
        self.assertEqual(sweep.effective_digest(self.run_dir), before)
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit): sweep.require_mapping(self.run_dir)
        run("map", self.run_dir)
        self.assertTrue((self.run_dir / "carried.jsonl").read_text().strip())
        run("check", self.run_dir, "--stage", "verdicts")
        jsonl(self.run_dir / "merges.jsonl", []); run("check", self.run_dir, "--stage", "merges")
        self.assertEqual(sweep.load_json(self.run_dir / "report.json")["status"], "partial")

    def test_pilot_repair_scopes_siblings_and_digests(self):
        self.prepare("external-call")
        sid, sibling = list(self.sites())[:2]
        data = self.fixture_owner(sid); ev = data["owners"][0]["evidence"]
        data["facts"] = [{"id": "F1", "owner": "O1", "question": "XC5", "basis": "project", "conditions": "scheduled caller", "exceptions": "HTTP caller", "answer": YES(ev[0])}]
        sweep.write_json(self.run_dir / "protections.json", data); run("check", self.run_dir, "--stage", "protections")
        context = {"corrections_digest": "fixture", "protections_digest": sweep.digest(data)}
        local = {"sites": [sid], "scope": "site", "reason": "local SQL verb", "evidence": ev, "affected": [sid]}
        sweep.check_pilot_repairs(self.run_dir, {**context, "repairs": [local]}, context, {sid})
        shared = {**local, "scope": "shared-fact", "owners": ["O1"], "facts": ["F1"], "affected": [sid, sibling],
                  "sibling": {"site": sibling, "result": "same scheduled caller", "evidence": ev}}
        sweep.check_pilot_repairs(self.run_dir, {**context, "repairs": [shared]}, context, {sid})
        sweep.check_pilot_repairs(self.run_dir, {**context, "repairs": [{**shared, "scope": "binding", "facts": []}]}, context, {sid})
        sweep.check_pilot_repairs(self.run_dir, {**context, "repairs": [{**shared, "sibling": {"site": None, "result": "no other affected caller", "searched": "all caller imports", "evidence": ev}}]}, context, {sid})
        invalid = [{**context, "repairs": []}, {**context, "protections_digest": "old", "repairs": [local]},
                   {**context, "repairs": [{**shared, "sibling": None}]},
                   {**context, "repairs": [{**shared, "sibling": {"site": sid, "result": "same", "evidence": ev}}]},
                   {**context, "repairs": [{**shared, "facts": ["missing"]}]}]
        for repair in invalid:
            with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                sweep.check_pilot_repairs(self.run_dir, repair, context, {sid})

    def test_corrected_pilot_blocks_expansion_until_current_repair(self):
        self.prepare("external-call")
        sid = next(iter(self.sites()))
        protections = {"owners": [], "facts": [], "unknowns": []}
        sweep.write_json(self.run_dir / "protections.json", protections); run("check", self.run_dir, "--stage", "protections")
        sweep.write_json(self.run_dir / "pilot.json", {"sites": [sid], "protections_digest": sweep.digest(protections)})
        effective, _ = sweep.merged_answers(self.run_dir, self.sites())
        answers = copy.deepcopy(effective[sid]["answers"]); answers["XC4"] = YES("src/orders.ts:7")
        file = self.tmp / "correction.jsonl"; jsonl(file, [self.correction(sid, answers)])
        run("correct", self.run_dir, "--file", file)
        self.audit(); run("map", self.run_dir); self.verdicts(); run("check", self.run_dir, "--stage", "verdicts")
        self.assertIn("require --repairs", run("pilot", self.run_dir, "--assess", "--decision", "focus", "--reason", "checked", ok=False).stderr)
        repairs = sweep.load_json(self.run_dir / "pilot-repairs-template.json")
        repairs["repairs"] = [{"sites": [sid], "scope": "site", "reason": "local finite timer", "affected": [sid], "evidence": ["src/orders.ts:7"]}]
        repair_file = self.tmp / "repairs.json"; sweep.write_json(repair_file, repairs)
        run("pilot", self.run_dir, "--assess", "--decision", "focus", "--reason", "checked", "--repairs", repair_file)
        run("shard", self.run_dir)
        saved = sweep.load_json(self.run_dir / "pilot-repairs.json"); saved["repairs"][0]["reason"] = "changed after decision"
        sweep.write_json(self.run_dir / "pilot-repairs.json", saved)
        self.assertIn("repair evidence changed", run("shard", self.run_dir, ok=False).stderr)


if __name__ == "__main__":
    unittest.main()
