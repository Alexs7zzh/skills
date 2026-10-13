#!/usr/bin/env python3
"""Run every sweep.py command over evals/fixture with supplied answers and verdicts.

usage: python3 tests/test_sweep.py
"""
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
CATALOG = json.loads((SKILL / "catalog.json").read_text())


def run(*args, ok=True, env=None):
    out = subprocess.run([sys.executable, str(SCRIPT), *map(str, args)], capture_output=True, text=True,
                         env={**os.environ, **(env or {})})
    if ok and out.returncode != 0:
        raise AssertionError(f"{' '.join(map(str, args))} failed:\n{out.stdout}{out.stderr}")
    return out


def answer_set(kind, overrides, path, line):
    """Every applicable question gets 'no' unless overridden; conditions decide n/a."""
    answers = {}
    for q in CATALOG["kinds"][kind]["questions"]:
        if any(answers.get(k, {}).get("a") != v for k, v in q.get("only_if", {}).items()):
            answers[q["id"]] = {"a": "n/a"}
        else:
            default = {"a": "no", "note": f"inspected {path}:{line}"}
            if q.get("search"):
                default["searched"] = "the identifying string"
            answers[q["id"]] = overrides.get(q["id"], default)
    return answers


def YES(ev):
    return {"a": "yes", "ev": ev}


# (path, line[, kind]) -> overrides: the fixture's planted facts.
FACTS = {
    ("src/orders.ts", 7): {"XC1": YES("src/orders.ts:8"), "XC5": YES("src/orders.ts:6-14"), "XC7": YES("src/orders.ts:6"),
                           "XC14": {"a": "unknown", "missing": "whether a caller holds a transaction"}},
    ("src/orders.ts", 19): {"XC4": YES("src/orders.ts:19")},
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

COVERED = ("XC-no-deadline", "XC-untyped-failure", "XC-unrecorded")


class SweepTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.root = self.tmp / "repo"
        shutil.copytree(SKILL / "evals" / "fixture", self.root)
        self.run_dir = self.tmp / "run"

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def sites(self):
        return {s["id"]: s for s in map(json.loads, (self.run_dir / "sites.jsonl").read_text().splitlines())}

    def write_answers(self, mutate=None):
        sites = self.sites()
        (self.run_dir / "answers").mkdir(exist_ok=True)
        for shard_path in sorted((self.run_dir / "shards").glob("*.json")):
            shard = json.loads(shard_path.read_text())
            rows = []
            for sid in shard["sites"]:
                s = sites[sid]
                facts = FACTS.get((s["path"], s["line"], s["kind"])) or FACTS.get((s["path"], s["line"]), {})
                rows.append({"site": sid, "answers": answer_set(s["kind"], facts, s["path"], s["line"])})
            if mutate:
                mutate(shard, rows)
            (self.run_dir / "answers" / f"{shard['id']}.jsonl").write_text("".join(json.dumps(r) + "\n" for r in rows))

    def through_map(self, answers=400):
        run("inventory", self.root, "--run", self.run_dir)
        run("api", self.run_dir)
        tsgo = self.tmp / "tsgo.json"
        tsgo.write_text(json.dumps({"diagnostics": [
            {"file": str(self.root / "src/config.ts"), "line": 2, "name": "processEnv"},
            {"file": str(self.root / "src/config.ts"), "line": 7, "name": "processEnv"},
            {"file": str(self.root / "src/handler.ts"), "line": 16, "name": "globalConsole"},
            {"file": str(self.root / "src/handler.ts"), "line": 1, "name": "notABoundaryRule"}]}))
        out = run("boundary", self.run_dir, "--tsgo-json", tsgo).stdout
        self.assertIn("| processEnv | 2 | src/config.ts 2 |", out)
        self.assertNotIn("notABoundaryRule", out)
        run("shard", self.run_dir, "--answers", answers)
        self.write_answers()
        run("check", self.run_dir, "--stage", "answers")
        return run("map", self.run_dir).stdout

    def clusters(self):
        return {c["rule"]: c for c in json.loads((self.run_dir / "clusters.json").read_text())["clusters"]}

    def write_verdicts(self, override=None):
        clusters = json.loads((self.run_dir / "clusters.json").read_text())["clusters"]
        groups = {g.stem: json.loads(g.read_text())["clusters"] for g in (self.run_dir / "judges").glob("*.json")}
        sites = self.sites()
        (self.run_dir / "verdicts").mkdir(exist_ok=True)
        for gid, cids in groups.items():
            rows = []
            for n, cid in enumerate(cids, 1):
                c = next(c for c in clusters if c["id"] == cid)
                first = sites[c["sites"][0]["site"]]
                ev = [f"{first['path']}:{first['line']}"]
                files = {sites[s["site"]]["path"] for s in c["sites"]}
                if c["lane"] == "defect":
                    row = {"verdict": "fix", "evidence": ev, "consequence": "named path", "proposal": "change", "layer": "service"}
                elif c["lane"] == "primitive" and len(c["sites"]) >= 3 and len(files) >= 2:
                    row = {"verdict": "build", "evidence": ev, "proposal": "operation(...)", "layer": "primitive"}
                elif c["lane"] == "primitive":
                    row = {"verdict": "local", "evidence": ev, "proposal": "route through the adapter", "layer": "service"}
                else:
                    row = {"verdict": "adopt", "evidence": ev, "proposal": "use the API", "layer": "service"}
                if any(s["state"] == "unresolved" for s in c["sites"]):
                    row = {"verdict": "local", "evidence": ev, "proposal": "settle the transaction question", "layer": "service",
                           "limit": "whether a caller holds a transaction"}
                if c["rule"] in COVERED:
                    build = next(x for x in clusters if x["rule"] == "XC-no-wrapper")
                    row = {"verdict": "leave", "counter": "the wrapper adds it", "evidence": ev,
                           "covered_by": f"{gid}-{cids.index(build['id']) + 1}"}
                row = {"id": f"{gid}-{n}", "cluster": cid, "sites": "all", **row}
                rows.append(override(c, row) if override else row)
            (self.run_dir / "verdicts" / f"{gid}.jsonl").write_text("".join(json.dumps(r) + "\n" for r in rows))

    def verdict_for(self, rule):
        cid = self.clusters()[rule]["id"]
        for p in (self.run_dir / "verdicts").glob("*.jsonl"):
            for line in p.read_text().splitlines():
                row = json.loads(line)
                if row["cluster"] == cid:
                    return row["id"]

    def test_full_run(self):
        out = self.through_map()
        self.assertIn("| External calls bounded by a deadline | 1/11 | 0 |", out)
        self.assertIn("| Secrets kept out of logs, errors and responses | 1/2 | 0 |", out)
        self.assertIn("| Shared read-modify-writes that are conditional | 0/2 | 0 |", out)
        derived = json.loads((self.run_dir / "derived.json").read_text())
        self.assertEqual(sum(map(len, derived.values())), 16, "the script answers IM2, CF5 and DB4 from searches")
        clusters = self.clusters()
        for rule in ("XC-unsafe-replay", "XC-no-outer-deadline", "XC-hand-retry", "CF-secret-leak", "EH-silent-swallow",
                     "DB-unchecked-cast", "FO-one-fails-all", "LG-sensitive", "TD-patched-global", "XC-no-wrapper",
                     "IM-scattered-client", "SW-lost-update", "SW-unrecorded-effect",
                     "EP-duplicate-delivery", "CF-scattered", "ED-duplicate-shape", "DB-repeated-shape"):
            self.assertIn(rule, clusters, out)
        self.assertNotIn("XC-volatile-key", clusters)
        self.assertEqual({s["state"] for s in clusters["XC-in-transaction"]["sites"]}, {"unresolved"})
        self.assertIn("XC-ignores-retry-after", clusters)
        self.assertEqual(len(clusters["XC-unsafe-replay"]["sites"]), 1)
        groups = [json.loads(g.read_text())["clusters"] for g in (self.run_dir / "judges").glob("*.json")]
        external = {c["id"] for c in clusters.values() if c["kind"] == "external-call"}
        self.assertTrue(any(external <= set(g) for g in groups), "a kind's clusters share one judge group")
        self.write_verdicts()
        out = run("check", self.run_dir, "--stage", "verdicts").stdout
        self.assertIn("next: one consolidator", out)
        build, decoded = self.verdict_for("XC-no-wrapper"), self.verdict_for("DB-unvalidated")
        self.assertNotEqual(build.split("-")[0], decoded.split("-")[0], "the duplicate sits in another judge group")
        (self.run_dir / "merges.jsonl").write_text(json.dumps({"row": decoded, "into": build, "reason": "same wrapper"}) + "\n")
        out = run("check", self.run_dir, "--stage", "merges").stdout
        self.assertIn("covers XC-no-deadline, XC-unrecorded, XC-untyped-failure", out)
        self.assertIn(f"merges {decoded} DB-unvalidated", out)
        self.assertFalse(any(l.startswith(decoded + " ") for l in out.splitlines()))
        lines = out.splitlines()
        first_fix = next(i for i, l in enumerate(lines) if " fix " in l)
        first_adopt = next(i for i, l in enumerate(lines) if " adopt " in l)
        self.assertLess(first_fix, first_adopt)

        replay, swallow, leave = (self.verdict_for(r) for r in ("XC-unsafe-replay", "EH-silent-swallow", "XC-no-deadline"))
        run("rule", self.run_dir, "--decision", "reject", "--verdicts", replay, "--reason", "test")
        run("rule", self.run_dir, "--decision", "accept", "--verdicts", swallow, "--reason", "test")
        run("rule", self.run_dir, "--decision", "reject", "--verdicts", leave, "--reason", "wants it now")
        run("rule", self.run_dir, "--decision", "defer", "--verdicts", build, "--reason", "later")
        rulings = json.loads((self.root / "backend-primitives.rulings.json").read_text())["rulings"]
        self.assertEqual(rulings[0]["paths"], ["src/orders.ts"])
        self.assertEqual({r["rule"] for r in rulings[3:]}, {"XC-no-wrapper", "DB-unvalidated"})
        out = run("map", self.run_dir).stdout
        self.assertIn("17 candidates suppressed, 1 accepted earlier", out)
        clusters = self.clusters()
        self.assertNotIn("XC-unsafe-replay", clusters)
        self.assertTrue(all("wants it now" in s["user"] for s in clusters["XC-no-deadline"]["sites"]))

    def test_answer_check_failures(self):
        run("inventory", self.root, "--run", self.run_dir)
        out = run("shard", self.run_dir, "--answers", "64").stdout
        self.assertIn("A01 3 sites: external-call\n", out)
        mixed = next(json.loads(p.read_text()) for p in sorted((self.run_dir / "shards").glob("*.json"))
                     if "import" in json.loads(p.read_text())["kinds"])

        def break_rows(shard, rows):
            if shard["id"] == "A01":
                rows[0]["answers"]["XC4"] = {"a": "yes"}
                rows[1]["answers"]["XC2"] = {"a": "no", "note": "x"}
                rows[1]["answers"]["XC12"] = {"a": "yes", "ev": "src/orders.ts:999"}
                rows.pop()
            if "state-write" in shard["kinds"]:
                row = next(r for r in rows if r["answers"].get("SW1", {}).get("a") == "no")
                row["answers"]["SW1"] = {"a": "no", "note": "only here"}
        self.write_answers(break_rows)
        out = run("check", self.run_dir, "--stage", "answers", ok=False)
        self.assertEqual(out.returncode, 1)
        for text in ("yes needs ev", "its condition is not met", "is outside src/orders.ts", "has no row",
                     "SW1: no on a search question needs searched"):
            self.assertIn(text, out.stdout)
        self.assertEqual(run("check", self.run_dir, "--stage", "answers", "--part", "A02").returncode, 0)
        packet = run("packet", self.run_dir, mixed["id"]).stdout
        self.assertIn("## Kind import", packet)
        self.assertIn(f"--part {mixed['id']}", packet)

    def test_verdict_check_failures(self):
        self.through_map()

        def bad(c, row):
            if c["rule"] == "XC-in-transaction":
                return {**row, "verdict": "fix", "consequence": "x"}
            if c["rule"] == "XC-unsafe-replay":
                return {**row, "verdict": "build", "proposal": "p", "layer": "primitive"}
            if c["rule"] == "CF-secret-leak":
                return {**row, "sites": []}
            if c["rule"] == "XC-unrecorded":
                return {**row, "verdict": "adopt", "proposal": "p", "layer": "service"}
            if c["rule"] == "DB-unchecked-cast":
                return {**row, "verdict": "refuted", "fact": "XC1", "note": "x"}
            return row
        self.write_verdicts(bad)
        out = run("check", self.run_dir, "--stage", "verdicts", ok=False)
        self.assertEqual(out.returncode, 1)
        for text in ("fix cannot rest on an unresolved fact", "build needs at least 3 sites", "has no verdict",
                     "covered_by belongs on a leave row", "refuted fact must be one of the rule's questions"):
            self.assertIn(text, out.stdout)

    def test_merge_check_failures(self):
        self.through_map()
        self.write_verdicts()
        run("check", self.run_dir, "--stage", "verdicts")
        self.assertIn("merges.jsonl does not exist", run("check", self.run_dir, "--stage", "merges", ok=False).stdout)
        build, replay, decoded = (self.verdict_for(r) for r in ("XC-no-wrapper", "XC-unsafe-replay", "DB-unvalidated"))
        merges = [{"row": replay, "into": build, "reason": "x"}, {"row": "J99-1", "into": build, "reason": "x"},
                  {"row": build, "into": decoded, "reason": "x"}, {"row": decoded, "into": build}]
        (self.run_dir / "merges.jsonl").write_text("".join(json.dumps(m) + "\n" for m in merges))
        out = run("check", self.run_dir, "--stage", "merges", ok=False).stdout
        for text in ("rows in one verdict file use covered_by", "must both be verdict ids", "a merge needs a reason",
                     "which is itself merged"):
            self.assertIn(text, out)

    def test_api_check_flags_missing_names(self):
        run("inventory", self.root, "--run", self.run_dir)
        fake = self.tmp / "effect"
        (fake / "dist").mkdir(parents=True)
        (fake / "package.json").write_text('{"version": "9.9.9"}')
        (fake / "dist" / "Effect.d.ts").write_text("export declare const timeout: any;\nexport { retry, fn } from './x';\n")
        out = run("api", self.run_dir, "--effect", fake).stdout
        missing = json.loads((self.run_dir / "api.json").read_text())["missing"]
        self.assertNotIn("Effect.timeout", missing["deadline"])
        self.assertIn("Effect.timeoutOrElse", missing["deadline"])
        self.assertIn("unavailable concept", out)

    def test_default_run_directory_and_empty_target(self):
        env = {"TMPDIR": str(self.tmp / "t")}
        first = run("inventory", self.root, env=env).stdout.splitlines()[0]
        second = run("inventory", self.root, env=env).stdout.splitlines()[0]
        self.assertTrue(first.startswith(f"run directory: {self.tmp / 't' / 'backend-primitives' / 'repo-'}"))
        self.assertEqual(second, first + "-2")
        empty = self.tmp / "empty"
        empty.mkdir()
        out = run("inventory", empty, env=env).stdout
        self.assertIn("next: report that there is nothing to sweep", out)


if __name__ == "__main__":
    unittest.main()
