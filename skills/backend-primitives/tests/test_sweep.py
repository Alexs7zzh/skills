#!/usr/bin/env python3
"""Deterministic regression and CLI workflow tests; supplied rows are not model evals."""
import copy
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
        run("check", self.run_dir, "--stage", "merges")
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
        self.assertEqual(len(qids), len(set(qids)))
        ids = [r["id"] for r in CATALOG["rules"]]
        self.assertEqual(len(ids), len(set(ids)))
        for c in CATALOG["coverage"]:
            self.assertIn(c["question"], qids)
            self.assertTrue(set(c.get("among", {})) <= set(qids))


if __name__ == "__main__":
    unittest.main()
