#!/usr/bin/env python3
"""Deterministic steps of the backend-primitives sweep.

usage:
  sweep.py inventory    ROOT [--run RUN] [--kinds K,K] [--paths GLOB,GLOB] [--extra FILE]
  sweep.py api          RUN [--effect DIR]
  sweep.py boundary     RUN [--tsgo-json FILE]
  sweep.py shard        RUN [--answers N]
  sweep.py packet       RUN SHARD
  sweep.py check        RUN [--stage answers|audit|verdicts|merges] [--part A01|J01]
  sweep.py map          RUN [--rulings FILE] [--sites-per-judge N]
  sweep.py audit        RUN [--sample N] (0 = all eligible negatives)
  sweep.py facts        RUN [--sites S,S]
  sweep.py correct      RUN --file FILE
  sweep.py reconcile    RUN
  sweep.py judge-packet RUN GROUP
  sweep.py merge-packet RUN
  sweep.py rule         RUN --decision accept|reject|defer --verdicts V,V --reason TEXT
                        [--rulings FILE] [--scope GLOB]

Every command reads catalog.json in the skill directory and writes only inside
RUN, except `rule`, which writes the rulings file. The rulings file defaults to
backend-primitives.rulings.json at the target's root. A failing command prints
one line per failure and exits 1. Each command's last line names the next
step. Only the Python 3.9+ standard library.
"""
import argparse
import copy
import datetime
import fnmatch
import hashlib
import json
import os
import re
import shutil
import shlex
import subprocess
import sys
import tempfile
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
SCRIPT = Path(__file__).resolve()
RULINGS_NAME = "backend-primitives.rulings.json"
ANSWER_TOKENS = ("yes", "no", "unknown", "n/a")
LANES = ("defect", "primitive", "adopt")
FINDINGS = ("defect", "improvement", "fine", "refuted", "unresolved")
REMEDIES = ("primitive", "effect", "local", "none")
LAYERS = ("schema", "error", "config", "primitive", "service", "entry", "test")
EVIDENCE = re.compile(r"^(?P<path>[^:\s][^:]*):(?P<start>\d+)(?:-(?P<end>\d+))?$")
COMMENT = re.compile(r"^\s*(//|\*|/\*)")


def die(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def load_json(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        die(f"{path} does not exist")
    except json.JSONDecodeError as e:
        die(f"{path} is not valid JSON: {e}")


def load_jsonl(path, failures):
    rows = []
    for n, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if line.strip():
            try:
                row = json.loads(line)
                if not isinstance(row, dict):
                    failures.append(f"{Path(path).name}:{n}: expected a JSON object")
                else:
                    rows.append((n, row))
            except json.JSONDecodeError as e:
                failures.append(f"{Path(path).name}:{n}: not valid JSON: {e}")
    return rows


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def catalog():
    return load_json(SKILL / "catalog.json")


def questions_of(cat, kind):
    return {q["id"]: q for q in cat["kinds"][kind]["questions"]}


def run_meta(run):
    return load_json(Path(run) / "run.json")


def sites_of(run):
    path = Path(run) / "sites.jsonl"
    if not path.exists():
        die(f"{path} does not exist; run inventory first")
    failures = []
    sites = {row["id"]: row for _, row in load_jsonl(path, failures)}
    if failures:
        die("; ".join(failures))
    return sites


def cmd(*parts):
    return shlex.join(["python3", str(SCRIPT), *map(str, parts)])


def pack(units, budget, split=True):
    """Pack (cost, items) units in order into bins of about budget cost.

    With split, a unit over budget is split by item; without it, a unit
    stays whole and an oversized unit fills a bin alone."""
    if budget <= 0:
        die("budget must be positive")
    bins, current, cost = [], [], 0
    for unit_cost, items in units:
        if current and cost + unit_cost > budget:
            bins.append(current)
            current, cost = [], 0
        if not split:
            current.extend(items)
            cost += unit_cost
            continue
        per_item = unit_cost / max(1, len(items))
        for item in items:
            if current and cost + per_item > budget:
                bins.append(current)
                current, cost = [], 0
            current.append(item)
            cost += per_item
    if current:
        bins.append(current)
    return bins


def site_line(sid, s, derived=None):
    also = f" (also lines {', '.join(map(str, s['also']))})" if s.get("also") else ""
    given = ", ".join(q + "=" + a["a"] for q, a in (derived or {}).items())
    done = f" (positive hints to confirm or correct: {given})" if given else ""
    return f"- {sid} `{s['path']}:{s['line']}`{also} `{s['snippet']}`{done}"


def header(meta):
    return f"Snapshot root (read this): `{meta['root']}`; live repository: `{meta.get('source_root', meta['root'])}` at {meta['vcs']} {meta['revision'] or meta['digest']} ({meta['state']})."


# ---------------------------------------------------------------- setup

def source_files(root, cat, globs):
    exclude = set(cat["exclude_dirs"])
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in exclude and not d.startswith("."))
        for name in sorted(filenames):
            if name.endswith(".d.ts") or not name.endswith(tuple(cat["extensions"])):
                continue
            rel = os.path.relpath(os.path.join(dirpath, name), root).replace(os.sep, "/")
            if not globs or any(fnmatch.fnmatch(rel, g) for g in globs):
                yield rel


def revision(root, digest):
    try:
        out = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"], capture_output=True, text=True, timeout=10)
        if out.returncode == 0:
            dirty = subprocess.run(["git", "-C", str(root), "status", "--porcelain", "--", "."],
                                   capture_output=True, text=True, timeout=10)
            return {"vcs": "git", "revision": out.stdout.strip(),
                    "state": "dirty" if dirty.stdout.strip() else "clean", "digest": digest}
    except (OSError, subprocess.SubprocessError):
        pass
    return {"vcs": "none", "revision": None, "state": "unversioned", "digest": digest}


def default_run_dir(root, label):
    base = Path(os.environ.get("TMPDIR") or tempfile.gettempdir()) / "backend-primitives"
    candidate, n = base / f"{root.name}-{label}", 2
    while candidate.exists():
        candidate, n = base / f"{root.name}-{label}-{n}", n + 1
    return candidate


def cmd_inventory(args):
    cat = catalog()
    root = Path(args.root).resolve()
    if not root.is_dir():
        die(f"{root} is not a directory")
    kinds = args.kinds.split(",") if args.kinds else list(cat["kinds"])
    if "entry-point" in kinds and "client-contract" not in kinds:
        kinds.append("client-contract")
    for k in kinds:
        if k not in cat["kinds"]:
            die(f"unknown kind {k}; kinds are {', '.join(cat['kinds'])}")
    globs = args.paths.split(",") if args.paths else []
    live_root = root
    run = Path(args.run).resolve() if args.run else default_run_dir(root, datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
    if run.resolve().is_relative_to(root):
        die("run directory must be outside the target repository")
    if run.exists() and any(run.iterdir()):
        die(f"{run} is not empty; choose a new run directory")
    root = snapshot_sources(live_root, run)
    test_path = re.compile(cat["test_path"])
    compiled = {k: [re.compile(p) for p in cat["kinds"][k]["patterns"]] for k in kinds}
    hasher = hashlib.sha256()
    found = []
    for rel in source_files(root, cat, globs):
        text = (root / rel).read_text(encoding="utf-8", errors="replace")
        hasher.update(rel.encode() + text.encode())
        is_test = bool(test_path.search("/" + rel))
        for k in kinds:
            if cat["kinds"][k].get("scope") == "run" and any(s["kind"] == k for s in found):
                continue
            if (cat["kinds"][k]["scan"] == "tests") != is_test:
                continue
            for n, line in enumerate(text.splitlines(), 1):
                if not COMMENT.match(line) and any(p.search(line) for p in compiled[k]):
                    found.append({"kind": k, "path": rel, "line": n, "snippet": line.strip()[:160], "source": "scan"})
                    if cat["kinds"][k].get("scope") == "run":
                        break
    if args.extra:
        for n, line in enumerate(Path(args.extra).read_text(encoding="utf-8").splitlines(), 1):
            parts = line.split()
            if not parts:
                continue
            m = EVIDENCE.match(parts[1]) if len(parts) > 1 else None
            if not m or parts[0] not in cat["kinds"] or not (root / m["path"]).is_file():
                die(f"{args.extra}:{n}: expected '<kind> <path>:<line>' naming a file under the root")
            lines = (root / m["path"]).read_text(encoding="utf-8", errors="replace").splitlines()
            ln = int(m["start"])
            found.append({"kind": parts[0], "path": m["path"], "line": ln, "source": "extra",
                          "snippet": lines[ln - 1].strip()[:160] if 0 < ln <= len(lines) else ""})
    meta = {"root": str(root), "source_root": str(live_root), "kinds": kinds, "paths": globs, "catalog": cat["written_against"],
            "created": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            **revision(live_root, hasher.hexdigest()[:16])}
    seen, sites = set(), []
    for s in sorted(found, key=lambda s: (list(cat["kinds"]).index(s["kind"]), s["path"], s["line"])):
        key = (s["kind"], s["path"], s["line"])
        if key in seen:
            continue
        seen.add(key)
        # One construct often matches on several nearby lines (a page loop's
        # token reads and writes); the kind's window folds them into one site.
        window = cat["kinds"][s["kind"]].get("merge_window", 0)
        prev = sites[-1] if sites else None
        if (window and prev and prev["kind"] == s["kind"] and prev["path"] == s["path"]
                and s["line"] - prev["lines"][-1] <= window and s["source"] == "scan" == prev["source"]):
            prev["lines"].append(s["line"])
            continue
        s["id"], s["lines"] = f"S{len(sites) + 1:04d}", [s["line"]]
        sites.append(s)
    run.mkdir(parents=True, exist_ok=True)
    with (run / "sites.jsonl").open("w", encoding="utf-8") as f:
        for s in sites:
            row = {"id": s["id"], **{k: s[k] for k in ("kind", "path", "line", "snippet", "source")}}
            if len(s["lines"]) > 1:
                row["also"] = s["lines"][1:]
            f.write(json.dumps(row) + "\n")
    meta.update(format=3, inputs=input_manifest(root), bundle=bundle_digest())
    write_json(run / "run.json", meta)
    (run / "discovery.md").write_text(discovery_text(meta), encoding="utf-8")
    print(f"run directory: {run}")
    print("Discovery is limited to catalog patterns; see discovery.md for blind spots and exclusions.")
    print(f"{len(sites)} sites at {meta['vcs']} {meta['revision'] or meta['digest']} ({meta['state']})")
    for k in kinds:
        print(f"  {k}: {sum(1 for s in sites if s['kind'] == k)}")
    print("next: report that there is nothing to sweep" if not sites else f"next: {cmd('api', run)}")


def export_names(dts_text):
    names = set(re.findall(r"export\s+declare\s+(?:const|function|class|abstract\s+class|namespace|enum|let)\s+([A-Za-z_$][\w$]*)", dts_text))
    names |= set(re.findall(r"export\s+(?:type|interface)\s+([A-Za-z_$][\w$]*)", dts_text))
    for block in re.findall(r"export\s*\{([^}]*)\}", dts_text):
        names |= {part.strip().split(" as ")[-1].strip() for part in block.split(",") if part.strip()}
    return names


def cmd_api(args):
    cat = catalog()
    run = Path(args.run)
    effect = Path(args.effect) if args.effect else Path(run_meta(run)["root"]) / "node_modules" / "effect"
    if not (effect / "package.json").exists():
        write_json(run / "api.json", {"installed": None, "missing": {}})
        print(f"effect is not installed at {effect}; concept APIs are unverified")
    else:
        package = load_json(effect / "package.json")
        version = package.get("version")
        cache, missing = {}, {}
        for cid, concept in cat["concepts"].items():
            for api in concept["apis"]:
                module, _, name = api.rpartition(".")
                if module not in cache:
                    dts = declaration_path(effect, package, module)
                    cache[module] = export_names(dts.read_text(encoding="utf-8")) if dts and dts.exists() else None
                if cache[module] is None or name not in cache[module]:
                    missing.setdefault(cid, []).append(api)
        write_json(run / "api.json", {"installed": version, "package": str(effect.resolve()), "catalog": cat["written_against"], "missing": missing})
        print(f"effect {version} installed; catalog written against {cat['written_against']}")
        for cid, apis in missing.items():
            print(f"  unavailable concept {cid}: {', '.join(apis)}")
        if not missing:
            print("  every concept API resolves")
    print(f"next: {cmd('boundary', run)}")


def cmd_boundary(args):
    cat = catalog()
    run = Path(args.run)
    root = Path(run_meta(run)["root"])
    if args.tsgo_json:
        data = load_json(args.tsgo_json)
    else:
        tool, project = root / "node_modules" / ".bin" / "effect-tsgo", root / "tsconfig.json"
        if not tool.exists() or not project.exists():
            write_json(run / "boundary.json", {"measured": False, "reason": "installed tooling or tsconfig missing"})
            (run / "boundary.md").write_text("# Boundary comparison\n\nUnmeasured: installed @effect/tsgo or tsconfig.json missing. This is not zero violations.\n")
            print(f"@effect/tsgo or tsconfig.json is not in {root}; unmeasured")
            print(f"next: {cmd('shard', run)}")
            return
        config = {"name": "@effect/language-service", "diagnosticSeverity": {r: "warning" for r in cat["tsgo_rules"]}}
        out = subprocess.run([str(tool), "diagnostics", "--project", str(project), "--format", "json",
                              "--lspconfig", json.dumps(config)], capture_output=True, text=True, cwd=root, timeout=600)
        try:
            data = json.loads(out.stdout)
        except json.JSONDecodeError:
            die(f"effect-tsgo returned no JSON (exit {out.returncode}): {out.stderr.strip()[:300]}")
    counts, locations = {}, []
    kinds_by_rule = {"processEnv": "config-read", "globalDate": "time-read", "globalConsole": "log-site",
                     "globalFetch": "external-call", "globalTimers": "time-read", "globalRandom": None,
                     "nodeBuiltinImport": "import", "preferSchemaOverJson": "decode-boundary",
                     "extendsNativeError": "error-definition", "newPromise": None, "cryptoRandomUUID": None}
    sites = sites_of(run)
    for d in data.get("diagnostics", []):
        if d.get("name") not in cat["tsgo_rules"]:
            continue
        # Resolve both sides: tsgo may report a path through a symlink the root resolved.
        file = Path(d["file"])
        live = Path(run_meta(run).get("source_root", root))
        base = live if file.is_absolute() and file.resolve().is_relative_to(live) else root
        rel = os.path.relpath(file.resolve(), base.resolve()).replace(os.sep, "/") if file.is_absolute() else str(file)
        area = "/".join(rel.split("/")[:2]) if "/" in rel else rel
        counts.setdefault(d["name"], {}).setdefault(area, 0)
        counts[d["name"]][area] += 1
        line = d.get("line")
        kind = kinds_by_rule.get(d["name"])
        matched = [sid for sid, site in sites.items() if site["path"] == rel and site["kind"] == kind
                   and line in [site["line"], *site.get("also", [])]]
        locations.append({"rule": d["name"], "path": rel, "line": line, "kind": kind, "inventory": matched})
    write_json(run / "boundary.json", {"measured": True, "counts": counts, "locations": locations})
    lines = ["# Unwrapped boundary uses", "", "Counts from @effect/tsgo's Effect-native rules, per directory.", "",
             "| rule | total | largest areas |", "| --- | --- | --- |"]
    for rule, areas in sorted(counts.items(), key=lambda kv: -sum(kv[1].values())):
        top = ", ".join(f"{a} {n}" for a, n in sorted(areas.items(), key=lambda kv: -kv[1])[:4])
        lines.append(f"| {rule} | {sum(areas.values())} | {top} |")
    unmatched = [x for x in locations if not x["inventory"]]
    lines += ["", "Diagnostic and inventory rules have different denominators; matching totals do not prove completeness.",
              f"Diagnostics without an exact same-kind inventory location: {len(unmatched)}/{len(locations)}.",
              "Review boundary.json locations against discovery.md; a missing line is uncomparable, not proof of a missed call."]
    lines += [f"- {x['rule']} {x['path']}:{x['line'] if x['line'] is not None else '?'}" for x in unmatched]
    (run / "boundary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[4:]))
    print(f"next: {cmd('shard', run)}")


# Pattern matches are hints, never answers or proof of absence.
SPECIFIER = re.compile(r"""(?:from\s+|require\(\s*)['"]([^'"]+)['"]""")
ENV_KEY = re.compile(r"""(?:process\.env|Bun\.env|import\.meta\.env|Deno\.env)(?:\.(\w+)|\[\s*['"](\w+)['"]\s*\])""")
TYPE_LITERAL = re.compile(r"\bas\s+(\{[^{}]*\})")


def fields_of(literal):
    return frozenset(re.findall(r"(\w+)\??\s*:", literal))


def derive_answers(cat, root, sites):
    """Positive hints only. Workers confirm them or replace them with evidence."""
    indexes = {"same-import": {}, "same-env-key": {}, "same-shape": {}}
    lines = {}
    for rel in source_files(root, cat, []):
        if re.search(cat["test_path"], "/" + rel):
            continue
        lines[rel] = (root / rel).read_text(encoding="utf-8", errors="replace").splitlines()
        for n, text in enumerate(lines[rel], 1):
            if COMMENT.match(text):
                continue
            keys = {"same-import": SPECIFIER.findall(text),
                    "same-env-key": [g for match in ENV_KEY.findall(text) for g in match if g],
                    "same-shape": [fields_of(v) for v in TYPE_LITERAL.findall(text)]}
            for method, values in keys.items():
                for key in set(values):
                    if key:
                        indexes[method].setdefault(key, []).append((rel, n))
    hints = {}
    for sid, site in sites.items():
        ls = lines.get(site["path"], [])
        text = ls[site["line"] - 1] if 0 < site["line"] <= len(ls) else ""
        for q in cat["kinds"][site["kind"]]["questions"]:
            method = q.get("derive")
            key = None
            if method == "same-import" and SPECIFIER.search(text):
                key = SPECIFIER.search(text).group(1)
            elif method == "same-env-key" and ENV_KEY.search(text):
                key = next(g for g in ENV_KEY.search(text).groups() if g)
            elif method == "same-shape" and TYPE_LITERAL.search(text):
                key = fields_of(TYPE_LITERAL.search(text).group(1))
            hits = [(p, n) for p, n in indexes.get(method, {}).get(key, [])
                    if (p, n) != (site["path"], site["line"])
                    and (method != "same-import" or p != site["path"])]
            if hits:
                hints.setdefault(sid, {})[q["id"]] = {"a": "yes", "ev": f"{hits[0][0]}:{hits[0][1]}",
                    "note": "pattern match; confirm its meaning at the citation", "derived": True}
    return hints

def derived_of(run):
    path = Path(run) / "derived.json"
    return load_json(path) if path.exists() else {}


def cmd_shard(args):
    cat = catalog()
    run = Path(args.run)
    sites = sites_of(run)
    shard_dir = run / "shards"
    if shard_dir.exists() and any(shard_dir.iterdir()):
        die(f"{shard_dir} already holds shards")
    # The bound is answers, not sites: a kind with many questions gets fewer
    # sites per answerer, and small kinds share one. A file's sites of one
    # kind stay together when they fit.
    units = []
    for kind in cat["kinds"]:
        files = {}
        for sid in sorted(sid for sid, x in sites.items() if x["kind"] == kind):
            files.setdefault(sites[sid]["path"], []).append(sid)
        nq = len(cat["kinds"][kind]["questions"])
        units += [(nq * len(ids), ids) for _, ids in sorted(files.items())]
    shards = pack(units, args.answers)
    (run / "answers").mkdir(exist_ok=True)
    derived = derive_answers(cat, Path(run_meta(run)["root"]), sites)
    write_json(run / "derived.json", derived)
    print(f"{sum(map(len, derived.values()))} positive hints found by search at {len(derived)} sites")
    for n, ids in enumerate(shards, 1):
        kinds = [k for k in cat["kinds"] if any(sites[i]["kind"] == k for i in ids)]
        write_json(shard_dir / f"A{n:02d}.json", {"id": f"A{n:02d}", "kinds": kinds, "sites": ids})
        print(f"  A{n:02d} {len(ids)} sites: {', '.join(kinds)}")
    print(f"{len(shards)} answer shards of at most {args.answers} answers each")
    print(f"next: one answerer per shard, each briefed with {cmd('packet', run, '<shard>')}")


def question_lines(q):
    cond = ""
    if q.get("only_if"):
        cond = " Applies when " + " and ".join(f"{k} is {v}" for k, v in q["only_if"].items())
        cond += ". A known-false prerequisite means n/a; an unknown prerequisite means unknown, with missing."
    if q.get("allow_na"):
        cond += " n/a is also allowed when " + q["allow_na"] + "; give a note establishing it."
    if q.get("search"):
        cond += " Search the repository; a no needs `searched`."
    return [f"- **{q['id']}** {q['text']}{cond}", f"  - yes: {q['yes']}", f"  - no: {q['no']}"]

def cmd_packet(args):
    cat = catalog()
    run = Path(args.run).resolve()
    shard = load_json(run / "shards" / f"{args.shard}.json")
    sites = sites_of(run)
    derived = derived_of(run)
    out = [f"# Answer shard {shard['id']}", "", header(run_meta(run)),
           f"Write answers to `{run / 'answers' / (shard['id'] + '.jsonl')}`, one JSON object per site.",
           f"Follow `{SKILL / 'answer.md'}`. Answer every question, including positive hints; confirm them or correct them at their citations.", ""]
    for kind_id in shard["kinds"]:
        kind = cat["kinds"][kind_id]
        out += [f"## Kind {kind_id}: {kind['title']}", "", f"Read: {kind['read']}", "", "### Questions", ""]
        for q in kind["questions"]:
            out.extend(question_lines(q))
        out += ["", "### Sites", ""] + [site_line(i, sites[i], derived.get(i)) for i in shard["sites"] if sites[i]["kind"] == kind_id] + [""]
    out.append(f"When done, run `{cmd('check', run, '--stage', 'answers', '--part', shard['id'])}` and fix every failure it reports.")
    print("\n".join(out))


# ---------------------------------------------------------------- answers

def condition_met(only_if, answers):
    """True, False, or None when a referenced answer is unknown or missing."""
    result = True
    for qid, want in only_if.items():
        got = answers.get(qid, {}).get("a")
        if got in ("unknown", None):
            result = None
        elif got != want:
            return False
    return result


def check_evidence(root, ev, where, failures):
    for item in ev if isinstance(ev, list) else [ev]:
        m = EVIDENCE.match(str(item))
        if not m:
            failures.append(f"{where}: evidence '{item}' is not path:line or path:start-end")
            continue
        path = Path(root) / m["path"]
        allowed = path.resolve().is_relative_to(Path(root).resolve())
        if not allowed:
            allowed = any(path.resolve().is_relative_to(deps.resolve()) for deps in dependency_roots(Path(root)))
        if not allowed or not path.is_file():
            failures.append(f"{where}: evidence file {m['path']} does not exist under the root")
            continue
        count = len(path.read_text(encoding="utf-8", errors="replace").splitlines())
        first, last = int(m["start"]), int(m["end"] or m["start"])
        if first < 1 or last > count or last < first:
            failures.append(f"{where}: evidence {item} is outside {m['path']} (1-{count})")


def check_answer_set(root, qs, answers, where, failures):
    if not isinstance(answers, dict) or any(not isinstance(a, dict) for a in answers.values()):
        failures.append(f"{where}: answers must map question ids to answer objects")
        return
    for qid in answers:
        if qid not in qs:
            failures.append(f"{where}: unknown question {qid}")
    for qid, q in qs.items():
        ans = answers.get(qid)
        applicability = condition_met(q.get("only_if", {}), answers)
        if applicability is None and (ans is None or ans.get("a") != "unknown"):
            failures.append(f"{where} {qid}: unknown prerequisite requires unknown with missing")
        if applicability is False:
            if ans is None or ans.get("a") != "n/a":
                failures.append(f"{where} {qid}: its condition is not met, so the answer is n/a")
            continue
        if ans is None:
            failures.append(f"{where} {qid}: missing answer")
            continue
        a = ans.get("a")
        if a not in ANSWER_TOKENS:
            failures.append(f"{where} {qid}: answer '{a}' is not one of {', '.join(ANSWER_TOKENS)}")
        elif a == "n/a" and (not q.get("allow_na") or not ans.get("note")):
            failures.append(f"{where} {qid}: n/a requires a known-false prerequisite or an explicit catalog exception with note")
        elif a == "yes" and not ans.get("ev"):
            failures.append(f"{where} {qid}: yes needs ev")
        elif a == "no" and not (ans.get("ev") or ans.get("note")):
            failures.append(f"{where} {qid}: no needs ev or a note naming what was inspected")
        elif a == "no" and q.get("search") and not ans.get("searched"):
            failures.append(f"{where} {qid}: no on a search question needs searched: the strings or patterns you searched for")
        elif a == "unknown" and not ans.get("missing"):
            failures.append(f"{where} {qid}: unknown needs missing, the fact that would settle it")
        if ans.get("ev"):
            check_evidence(root, ans["ev"], f"{where} {qid}", failures)


def check_hint_answers(sid, answers, hints, failures):
    for qid, hint in hints.items():
        answer = answers.get(qid, {})
        if answer.get("a") in ("no", "n/a") and not answer.get("hint_refutation"):
            failures.append(f"{sid} {qid}: contradicts hint {hint['ev']}; requires hint_refutation explaining why it does not count")


def check_answers(run, cat, sites, meta, failures, only_shard=None):
    shards = {p.stem: load_json(p) for p in sorted((Path(run) / "shards").glob("*.json"))
              if only_shard is None or p.stem == only_shard}
    if not shards:
        failures.append(f"no shard {only_shard}" if only_shard else "no shards; run shard first")
    files = {p.stem: p for p in sorted((Path(run) / "answers").glob("*.jsonl"))}
    for sid, shard in shards.items():
        if sid not in files:
            failures.append(f"answers/{sid}.jsonl does not exist")
            continue
        rows = {}
        for n, row in load_jsonl(files[sid], failures):
            where = f"{files[sid].name}:{n}"
            if row.get("added"):
                if row.get("kind") not in shard["kinds"]:
                    failures.append(f"{where}: an added site's kind must be one of this shard's: {', '.join(shard['kinds'])}")
                    continue
                check_evidence(meta["root"], f"{row.get('path')}:{row.get('line')}", where, failures)
                check_answer_set(meta["root"], questions_of(cat, row["kind"]), row.get("answers", {}), where, failures)
                continue
            site = row.get("site")
            if site not in shard["sites"]:
                failures.append(f"{where}: site {site} is not in shard {sid}")
                continue
            if site in rows:
                failures.append(f"{where}: site {site} answered twice")
            rows[site] = row
            status = row.get("status", "site")
            if status == "not-a-site":
                if not row.get("note"):
                    failures.append(f"{where}: not-a-site needs a note")
            elif row.get("same_as"):
                other = row["same_as"]
                if other not in shard["sites"] or other == site or sites[other]["kind"] != sites[site]["kind"]:
                    failures.append(f"{where}: same_as {other} must be another site of the same kind in this shard")
            elif status == "site":
                check_answer_set(meta["root"], questions_of(cat, sites[site]["kind"]), row.get("answers", {}), where, failures)
            else:
                failures.append(f"{where}: status '{status}' is not site or not-a-site")
        for site in shard["sites"]:
            if site not in rows:
                failures.append(f"{files[sid].name}: site {site} has no row")
        for site, row in rows.items():
            answer = rows.get(row.get("same_as"), row)
            if row.get("status") != "not-a-site":
                check_hint_answers(site, answer.get("answers", {}), derived_of(run).get(site, {}), failures)
            target = rows.get(row.get("same_as"), {})
            if row.get("same_as") and (target.get("same_as") or target.get("status") == "not-a-site"):
                failures.append(f"{files[sid].name}: {site} same_as {row['same_as']}, which has no answers of its own")
    if only_shard is None:
        if not failures:
            effective, all_sites = merged_answers(run, sites)
            for site, row in effective.items():
                if row["status"] == "site":
                    check_answer_set(meta["root"], questions_of(cat, all_sites[site]["kind"]), row["answers"], site, failures)
                    check_hint_answers(site, row["answers"], derived_of(run).get(site, {}), failures)
        failures += [f"answers/{stem}.jsonl matches no shard" for stem in files if stem not in shards]


def merged_answers(run, sites):
    """site id -> {'status', 'answers'}, and every site including added ones."""
    failures, merged, all_sites = [], {}, dict(sites)
    for path in sorted((Path(run) / "answers").glob("*.jsonl")):
        for n, row in load_jsonl(path, failures):
            if row.get("added"):
                sid = f"{path.stem}-N{n}"
                all_sites[sid] = {"id": sid, "kind": row["kind"], "path": row["path"], "line": row["line"],
                                  "snippet": row.get("snippet", ""), "source": "answerer"}
                merged[sid] = {"status": "site", "answers": row.get("answers", {})}
            else:
                merged[row["site"]] = {"status": row.get("status", "site"), "answers": row.get("answers", {}),
                                       "same_as": row.get("same_as"), "note": row.get("note")}
    corrections = load_json(Path(run) / "corrections.json") if (Path(run) / "corrections.json").exists() else {}
    for sid, answers in corrections.items():
        if sid in merged:
            merged[sid]["answers"] = copy.deepcopy(answers)
    for m in merged.values():
        if m.get("same_as"):
            m["answers"] = copy.deepcopy(merged.get(m["same_as"], {}).get("answers", {}))
    for sid, answers in corrections.items():
        if sid in merged:
            merged[sid].update(status="site", answers=copy.deepcopy(answers), same_as=None)
    if failures:
        die("; ".join(failures))
    return merged, all_sites


# ---------------------------------------------------------------- map

def evaluate(rule, answers):
    """'matched', 'unresolved' or None."""
    state = "matched"
    for qid, want in rule["when"].items():
        got = answers.get(qid, {}).get("a")
        if got in ("unknown", None):
            state = "unresolved"
        elif got != want:
            return None
    return state


def rulings_path(run, given):
    return Path(given) if given else Path(run_meta(run).get("source_root", run_meta(run)["root"])) / RULINGS_NAME


def ruling_effect(rulings, rule_id, site_path, identity=None):
    """A matching decision is context for a judge, never proof of implementation."""
    hit = None
    for row in rulings:
        if row.get("rule") != rule_id:
            continue
        scoped = row.get("policy") is True and fnmatch.fnmatch(site_path, row.get("scope", ""))
        exact = identity is not None and identity in row.get("identities", [])
        if scoped or exact:
            hit = row
    return (hit.get("decision"), hit) if hit else (None, None)

def coverage(cat, merged, all_sites):
    rows = []
    for c in cat["coverage"]:
        kind = next(k for k, v in cat["kinds"].items() if any(q["id"] == c["question"] for q in v["questions"]))
        has = lacks = unknown = 0
        for sid, m in merged.items():
            if m["status"] != "site" or all_sites[sid]["kind"] != kind:
                continue
            a = m["answers"]
            eligible = condition_met(c.get("among", {}), a)
            if eligible is False:
                continue
            if eligible is None:
                unknown += 1
                continue
            got = a.get(c["question"], {}).get("a")
            if got == c["has"]:
                has += 1
            elif got in ("unknown", None):
                unknown += 1
            elif got in ("yes", "no"):
                lacks += 1
        rows.append({"label": c["label"], "has": has, "of": has + lacks, "unknown": unknown})
    return rows


def cmd_map(args):
    require_answers(args.run)
    failures = []
    check_audit(args.run, failures)
    if audit_refutations(args.run):
        failures.append("audit refutations remain; run reconcile --stage audit before map")
    if failures:
        die("; ".join(failures))
    cat, run = catalog(), Path(args.run)
    meta = run_meta(run)
    merged, all_sites = merged_answers(run, sites_of(run))
    api = load_json(run / "api.json") if (run / "api.json").exists() else {"installed": None, "missing": {}}
    rpath = rulings_path(run, args.rulings)
    rulings = load_json(rpath).get("rulings", []) if rpath.exists() else []
    by_rule = {r["id"]: r for r in cat["rules"]}
    matches, held = {}, []
    for sid, row in sorted(merged.items()):
        if row["status"] != "site":
            continue
        site = all_sites[sid]
        for rule in cat["rules"]:
            state = evaluate(rule, row["answers"]) if rule["kind"] == site["kind"] else None
            if state is None:
                continue
            identity = site_identity(meta, site, row["answers"], rule)
            decision, previous = ruling_effect(rulings, rule["id"], site["path"], identity)
            item = {"site": sid, "state": state, "identity": identity}
            if decision in ("reject", "defer") and not args.include_held:
                held.append({"rule": rule["id"], "site": sid, "identity": identity, "path": site["path"],
                             "line": site["line"], "decision": decision, "reason": previous["reason"],
                             "finding": previous.get("finding"), "state": state})
                continue
            if previous:
                item["user"] = f"{decision}: {previous['reason']} (not implementation evidence)"
            matches.setdefault(rule["id"], []).append(item)
    # Split large kinds by unique sites, keeping all rules for a site's chunk together.
    out, groups = [], []
    for kind in cat["kinds"]:
        ids = sorted(sid for sid, site in all_sites.items() if site["kind"] == kind)
        for start in range(0, len(ids), args.sites_per_judge):
            chunk = set(ids[start:start + args.sites_per_judge])
            group = []
            for rule in sorted((r for r in cat["rules"] if r["kind"] == kind), key=lambda r: (LANES.index(r["lane"]), r["id"])):
                rows = [x for x in matches.get(rule["id"], []) if x["site"] in chunk]
                if not rows:
                    continue
                cid = f"C{len(out)+1:03d}"
                out.append({"id": cid, "rule": rule["id"], "kind": kind, "lane": rule["lane"],
                            "concept": rule["concept"], "unavailable": api["missing"].get(rule["concept"], []), "sites": rows})
                group.append(cid)
            if group:
                groups.append(group)
    save_reusable(run)
    archive_outputs(run)
    (run / "verdicts").mkdir(exist_ok=True)
    for n, group in enumerate(groups, 1):
        write_json(run / "judges" / f"J{n:02d}.json", {"id": f"J{n:02d}", "clusters": group})
    cov = coverage(cat, merged, all_sites)
    audit = load_json(run / "audit.json")
    write_json(run / "clusters.json", {"clusters": out, "effect": api.get("installed"), "coverage": cov,
               "facts_digest": effective_digest(run), "rulings": str(rpath), "held": held,
               "audit": {"eligible": audit["eligible"], "checked": len(audit["selected"])}})
    restore_verdicts(run)
    lines = ["# Coverage of inventoried sites", "", "Discovery limits: see discovery.md. Unknown eligibility is included in unknown.", "",
             "| guarantee | has / known applicable | unknown |", "| --- | --- | --- |"]
    lines += [f"| {r['label']} | {r['has']}/{r['of']} | {r['unknown']} |" for r in cov if r["of"] or r["unknown"]]
    lines += ["", f"Eligible negatives and hint contradictions audited: {len(audit['selected'])}/{audit['eligible']}. "
              "Other negatives, exclusions and discovery blind spots are not audited by this sample."]
    (run / "coverage.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    print(f"{len(out)} clusters in {len(groups)} judge groups; {len(held)} rejected or deferred candidates held out")
    if not out:
        (run / "merges.jsonl").write_text("")
        print_verdicts(run)
    print("next: report coverage and discovery limits; no rule matched" if not out else
          f"next: judges use {cmd('judge-packet', run, '<group>')}; schedule within available agent capacity")

def cmd_judge_packet(args):
    cat = catalog()
    run = Path(args.run).resolve()
    merged, all_sites = merged_answers(run, sites_of(run))
    data = require_mapping(run)
    group = load_json(run / "judges" / f"{args.group}.json")
    by_id = {c["id"]: c for c in data["clusters"]}
    rules = {r["id"]: r for r in cat["rules"]}
    out = [f"# Judge group {group['id']}", "", header(run_meta(run)),
           f"Installed effect: {data.get('effect') or 'not installed, so API names are unverified'}. "
           f"Catalog API names are from {cat['written_against']}.",
           f"Write verdicts to `{run / 'verdicts' / (group['id'] + '.jsonl')}`. Follow `{SKILL / 'judge.md'}`.",
           f"Complete facts and correction digests: `{cmd('facts', run)}`.", ""]
    out.append("Carried findings are in carried.jsonl; do not rewrite them. Use explicit site lists for pending subsets.")
    for cid in group["clusters"]:
        c = by_id[cid]
        pending = group.get("pending", {}).get(cid, [x["site"] for x in c["sites"]])
        if not pending:
            continue
        rule, concept, qs = rules[c["rule"]], cat["concepts"][c["concept"]], questions_of(cat, c["kind"])
        out += [f"## {cid} {c['rule']} ({c['lane']}, {c['kind']})", "",
                f"- Mechanism: {rule['mechanism']}",
                f"- Counter-condition: {rule['counter']}",
                "- Facts: " + "; ".join(f"{q} {v} ({qs[q]['text']})" for q, v in rule["when"].items()),
                f"- Concept: {concept['title']} ({concept['type']}). {concept['note']}"]
        if concept["apis"]:
            out.append(f"- APIs: {', '.join(concept['apis'])}")
        if c["unavailable"]:
            out.append(f"- Unavailable in the installed version: {', '.join(c['unavailable'])}")
        out += ["", "Sites:", ""]
        for s in c["sites"]:
            if s["site"] not in pending:
                continue
            facts = []
            for q in rule["when"]:
                ans = merged[s["site"]]["answers"].get(q, {})
                detail = ans.get("ev") or ans.get("note") or ans.get("missing") or ""
                facts.append(f"{q}={ans.get('a')}" + (f" [{detail}]" if detail else ""))
            flags = (" UNRESOLVED" if s["state"] == "unresolved" else "") + (f" USER: {s['user']}" if s.get("user") else "")
            out.append(f"{site_line(s['site'], all_sites[s['site']])}{flags}: {'; '.join(facts)}")
        out.append("")
    out.append(f"When done, run `{cmd('check', run, '--stage', 'verdicts', '--part', group['id'])}` and fix every failure it reports.")
    print("\n".join(out))


# ---------------------------------------------------------------- verdicts

def load_verdicts(run, failures):
    d = Path(run) / "verdicts"
    rows = [(f"{p.name}:{n}", p.stem, row) for p in sorted(d.glob("*.jsonl"))
            for n, row in load_jsonl(p, failures)]
    carried = Path(run) / "carried.jsonl"
    if carried.exists():
        rows += [(f"carried.jsonl:{n}", row.get("id", "").split("-")[0], row)
                 for n, row in load_jsonl(carried, failures)]
    return rows


def check_verdicts(run, failures, only_group=None):
    cat = catalog()
    data = require_mapping(run)
    root = run_meta(run)["root"]
    rules = {r["id"]: r for r in cat["rules"]}
    clusters = {c["id"]: c for c in data["clusters"]}
    effective, sites = merged_answers(run, sites_of(run))
    groups = {p.stem: load_json(p)["clusters"] for p in sorted((Path(run) / "judges").glob("*.json"))}
    rows = load_verdicts(run, failures)
    if only_group and only_group not in groups:
        failures.append(f"unknown judge group {only_group}")
        return
    seen, covered = set(), {}
    for where, stem, row in rows:
        if only_group and stem != only_group:
            continue
        vid, cid = row.get("id"), row.get("cluster")
        finding, remedy = row.get("finding"), row.get("remedy")
        if not isinstance(vid, str) or not re.fullmatch(re.escape(stem) + (r"-R\d+" if where.startswith("carried.jsonl:") else r"-\d+"), vid) or vid in seen:
            failures.append(f"{where}: id must be unique {stem}-<number>")
        seen.add(vid)
        if stem not in groups or cid not in groups[stem]:
            failures.append(f"{where}: cluster must belong to this judge group")
            continue
        c = clusters[cid]
        if finding not in FINDINGS or remedy not in REMEDIES or not isinstance(row.get("decision"), bool):
            failures.append(f"{where}: requires finding, remedy and boolean decision (legacy verdict tokens are unsupported)")
            continue
        slots = ["evidence"]
        if finding == "defect":
            slots += ["consequence"]
        if finding in ("defect", "improvement"):
            slots += ["proposal", "layer"]
            if remedy == "none":
                failures.append(f"{where}: a supported change needs a remedy")
        if finding == "fine":
            slots += ["counter"]
        if finding == "refuted":
            slots += ["fact", "corrections"]
        if finding == "unresolved":
            slots += ["limit"]
        if finding in ("fine", "refuted", "unresolved") and (remedy != "none" or row["decision"]):
            failures.append(f"{where}: {finding} requires remedy none and decision false")
        if row["decision"]:
            slots += ["question", "recommendation"]
        if remedy == "primitive":
            slots += ["signature", "enforcement"]
        for slot in slots:
            if not row.get(slot):
                failures.append(f"{where}: {finding}/{remedy} needs {slot}")
        if row.get("layer") and row["layer"] not in LAYERS:
            failures.append(f"{where}: invalid layer")
        if row.get("evidence"):
            check_evidence(root, row["evidence"], where, failures)
        cluster_ids = [x["site"] for x in c["sites"]]
        listed = cluster_ids if row.get("sites") == "all" else row.get("sites")
        if not isinstance(listed, list) or not listed or len(listed) != len(set(listed)):
            failures.append(f"{where}: sites must be all or a nonempty unique list")
            continue
        dependencies = row.get("depends_on", [])
        if not isinstance(dependencies, list) or any(not isinstance(x, str) or x not in effective for x in dependencies):
            failures.append(f"{where}: depends_on must list existing site ids")
        for sid in listed:
            if sid not in cluster_ids:
                failures.append(f"{where}: site {sid} is not in cluster")
            covered.setdefault((cid, sid), []).append(vid)
        inspected = row.get("inspected")
        if not isinstance(inspected, list) or not inspected or any(not isinstance(x, str) for x in inspected) or len(inspected) != len(set(inspected)) or not set(inspected) <= set(listed):
            failures.append(f"{where}: inspected must list unique reviewed sites from this row")
        elif finding in ("defect", "refuted", "unresolved") and set(inspected) != set(listed):
            failures.append(f"{where}: {finding} requires inspecting every listed site")
        elif len(inspected) < min(5, len(listed)) or (len(inspected) < len(listed) and not row.get("limit")):
            failures.append(f"{where}: inspect at least five sites (or all); a sample requires limit")
        if finding != "refuted" and finding != "unresolved" and any(x["state"] == "unresolved" for x in c["sites"] if x["site"] in listed):
            failures.append(f"{where}: unresolved facts require unresolved or refuted with corrections; correct and remap before a supported finding")
        if remedy == "primitive" and (len(listed) < 3 or len({sites[x]['path'] for x in listed if x in sites}) < 2):
            if not row.get("boundary") or not row.get("enforcement"):
                failures.append(f"{where}: small primitive needs boundary and enforcement; convenience helpers need 3 sites in 2 files")
        if remedy == "effect":
            proposed = row.get("apis")
            api = load_json(Path(run) / "api.json") if (Path(run) / "api.json").exists() else {}
            effect = Path(api["package"]) if api.get("package") else None
            if not data.get("effect") or not effect or not (effect / "package.json").exists():
                failures.append(f"{where}: Effect remedy requires an installed package; use conditional adoption or unresolved")
            elif not isinstance(proposed, list) or not proposed or any(not isinstance(a, str) or "." not in a for a in proposed):
                failures.append(f"{where}: Effect remedy needs apis naming the actual Module.symbol values proposed")
            else:
                package = load_json(effect / "package.json")
                if package.get("version") != data["effect"]:
                    failures.append(f"{where}: installed Effect version changed; rerun api and map")
                for name in proposed:
                    module, _, symbol = name.rpartition(".")
                    declaration = declaration_path(effect, package, module)
                    if not declaration or not declaration.is_file() or symbol not in export_names(declaration.read_text(encoding="utf-8")):
                        failures.append(f"{where}: proposed API {name} is unavailable in installed Effect")
        if finding == "refuted":
            if row.get("fact") not in rules[c["rule"]]["when"]:
                failures.append(f"{where}: refuted fact must decide the rule")
            corrections = row.get("corrections", [])
            if not isinstance(corrections, list) or any(not isinstance(x, dict) for x in corrections):
                failures.append(f"{where}: corrections must be a list")
                continue
            if {x.get("site") for x in corrections} != set(listed) or len(corrections) != len(listed):
                failures.append(f"{where}: one correction required per refuted site")
            for update in corrections:
                sid = update.get("site")
                if sid not in effective:
                    continue
                if update.get("before") != digest(effective[sid]) or not update.get("reason"):
                    failures.append(f"{where}: correction requires current before digest and reason")
                check_answer_set(root, questions_of(cat, sites[sid]["kind"]), update.get("answers", {}), where, failures)
                fact = row.get("fact")
                if update.get("answers", {}).get(fact) == effective[sid]["answers"].get(fact):
                    failures.append(f"{where}: refuted fact must change")
        if row.get("covered_by"):
            failures.append(f"{where}: keep the original finding; merge duplicate remedies in merges.jsonl instead of covered_by")
    for cid, c in clusters.items():
        if only_group and cid not in groups[only_group]:
            continue
        for site in c["sites"]:
            if len(covered.get((cid, site["site"]), [])) != 1:
                failures.append(f"{cid}: site {site['site']} needs exactly one finding")

def verdict_line(row, clusters, rules, all_sites, extra=""):
    c = clusters[row["cluster"]]
    listed = [s["site"] for s in c["sites"]] if row["sites"] == "all" else row["sites"]
    files = sorted({all_sites[s]["path"] for s in listed})
    details = [row.get(k) for k in ("consequence", "proposal", "counter", "limit") if row.get(k)]
    if row.get("decision"):
        details += ["DECISION: " + row["question"], "recommend: " + row["recommendation"]]
    return (f"{row['id']} {row['finding']}/{row['remedy']} {c['rule']} [{row.get('layer', '-')}] "
            f"{len(listed)} sites in {', '.join(files)}{extra}: " + "; ".join(details))

def load_merges(run, failures):
    path = Path(run) / "merges.jsonl"
    return load_jsonl(path, failures) if path.exists() else None


def cmd_merge_packet(args):
    cat = catalog()
    run = Path(args.run).resolve()
    rules = {r["id"]: r for r in cat["rules"]}
    clusters = {c["id"]: c for c in load_json(run / "clusters.json")["clusters"]}
    _, all_sites = merged_answers(run, sites_of(run))
    rows = [row for _, _, row in load_verdicts(run, []) if row["finding"] in ("defect", "improvement")]
    require_mapping(run)
    out = ["# Merge duplicate changes", header(run_meta(run)), "", f"Write merges to `{run / 'merges.jsonl'}`. Follow `{SKILL / 'merge.md'}`.", "",
           "## Change rows", ""]
    out += [f"- {verdict_line(r, clusters, rules, all_sites)}" for r in sorted(rows, key=lambda r: r["id"])]
    out += ["", f"When done, run `{cmd('check', run, '--stage', 'merges')}` and fix every failure it reports."]
    print("\n".join(out))


def check_merges(run, failures):
    merges = load_merges(run, failures)
    if merges is None:
        failures.append("merges.jsonl does not exist; write an empty file when nothing merges")
        return
    rows = {row.get("id"): (stem, row) for _, stem, row in load_verdicts(run, [])}
    merged = {}
    for n, item in merges:
        a, b = rows.get(item.get("row")), rows.get(item.get("into"))
        if a is None or b is None:
            failures.append(f"merge:{n}: row and into must both be finding ids")
            continue
        if a[1]["finding"] not in ("defect", "improvement") or b[1]["finding"] not in ("defect", "improvement"):
            failures.append(f"merge:{n}: only supported changes merge")
        if item["row"] == item["into"]:
            failures.append(f"merge:{n}: a row cannot merge into itself")
        if not item.get("reason") or item["row"] in merged:
            failures.append(f"merge:{n}: reason required; a row may merge once")
        merged[item["row"]] = item["into"]
    for row, into in merged.items():
        if into in merged:
            failures.append(f"merge: {row} points to a row that is itself merged")
    if any(row["finding"] == "refuted" for _, row in rows.values()):
        failures.append("refuted facts remain; run reconcile, audit and map before reporting")

def print_verdicts(run):
    data = require_mapping(run)
    clusters = {c["id"]: c for c in data["clusters"]}
    _, sites = merged_answers(run, sites_of(run))
    rows = {r["id"]: r for _, _, r in load_verdicts(run, [])}
    merges = {m["row"]: m["into"] for _, m in load_merges(run, []) or []}
    groups = {}
    for vid, row in rows.items():
        groups.setdefault(merges.get(vid, vid), []).append(row)
    report = []
    for owner, members in groups.items():
        # Preserve every source finding, consequence and decision; only presentation is folded.
        priority = min((FINDINGS.index(m["finding"]) for m in members))
        report.append({"id": owner, "finding": FINDINGS[priority], "decision": any(m["decision"] for m in members),
                       "members": members})
    report.sort(key=lambda r: (FINDINGS.index(r["finding"]), not r["decision"], r["id"]))
    write_json(Path(run) / "report.json", {"groups": report, "held": data.get("held", []), "audit": data["audit"], "facts_digest": data["facts_digest"]})
    rules = {r["id"]: r for r in catalog()["rules"]}
    print(f"Held by user ruling: {len(data.get('held', []))}; details remain in report.json, separate from coverage.")
    for group in report:
        print(f"{group['id']} {group['finding']}" + ("; needs decision" if group["decision"] else ""))
        for row in group["members"]:
            print("  " + verdict_line(row, clusters, rules, sites))

def cmd_check(args):
    cat, run, failures = catalog(), Path(args.run), []
    if args.stage == "answers":
        check_answers(run, cat, sites_of(run), run_meta(run), failures, args.part)
    elif args.stage == "audit":
        check_audit(run, failures)
    elif args.stage == "verdicts":
        check_verdicts(run, failures, args.part)
    else:
        check_verdicts(run, failures)
        check_merges(run, failures)
    if failures:
        die("\n".join(failures))
    print(f"{args.stage}{' ' + args.part if args.part else ''}: pass")
    if args.part:
        return
    if args.stage == "answers":
        print(f"next: {cmd('audit', run)}")
    elif args.stage == "audit":
        print(f"next: {cmd('reconcile', run, '--stage', 'audit')}" if audit_refutations(run) else f"next: {cmd('map', run)}")
    elif args.stage == "verdicts":
        rows = [r for _, _, r in load_verdicts(run, [])]
        print(f"next: {cmd('reconcile', run)}" if any(r["finding"] == "refuted" for r in rows) else
              f"next: consolidator uses {cmd('merge-packet', run)}")
    else:
        print_verdicts(run)
        print("next: reply using report.json, coverage.md and discovery.md; ask for rulings")

def cmd_rule(args):
    run = Path(args.run)
    failures = []
    check_verdicts(run, failures)
    check_merges(run, failures)
    if failures:
        die("; ".join(failures))
    rows = {row["id"]: row for _, _, row in load_verdicts(run, [])}
    clusters = {c["id"]: c for c in require_mapping(run)["clusters"]}
    meta = run_meta(run)
    path = rulings_path(run, args.rulings)
    live_root = Path(meta.get("source_root", meta["root"]))
    if path.resolve().is_relative_to(live_root) and path.resolve() != live_root / RULINGS_NAME:
        die("a custom rulings file must be outside the pinned repository; use the default file at the repository root")
    store = load_json(path) if path.exists() else {"format": 2, "rulings": []}
    ids = list(dict.fromkeys(args.verdicts.split(",")))
    merges = [m for _, m in load_merges(run, []) or []]
    ids += [m["row"] for m in merges if m["into"] in ids and m["row"] not in ids]
    entries = []
    for vid in ids:
        if vid not in rows:
            die(f"unknown finding {vid}")
        row = rows[vid]
        c = clusters[row["cluster"]]
        listed = [x["site"] for x in c["sites"]] if row["sites"] == "all" else row["sites"]
        entry = {"rule": c["rule"], "verdict": vid, "finding": row["finding"], "remedy": row["remedy"],
                 "decision": args.decision, "reason": args.reason, "date": datetime.date.today().isoformat(),
                 "revision": meta["revision"] or meta["digest"], "proposal": row.get("proposal"),
                 "identities": [x["identity"] for x in c["sites"] if x["site"] in listed]}
        if args.scope:
            entry.update(policy=True, scope=args.scope)
        entries.append(entry)
    store["rulings"].extend(entries)
    write_json(path, store)
    print(f"{len(entries)} rulings written to {path}; decisions remain visible on later matches")

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def bundle_digest():
    paths = [SKILL / "catalog.json", *SKILL.glob("*.md"), *SKILL.glob("scripts/*.py")]
    return digest({str(p.relative_to(SKILL)): file_digest(p) for p in sorted(paths)})


def input_manifest(root):
    """Pin source, deployment/config and lockfiles, including untracked inputs."""
    excluded = set(catalog()["exclude_dirs"]) | {"__pycache__", ".venv", ".pytest_cache", ".claude", ".codex", ".idea", ".vscode"}
    result = {}
    for directory, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs if d not in excluded)
        for name in sorted(files):
            path = Path(directory) / name
            rel = str(path.relative_to(root))
            if rel == RULINGS_NAME or name == ".DS_Store" or name.endswith((".swp", ".swo", "~")):
                continue
            if path.is_file():
                result[rel] = file_digest(path)
    return result


def dependency_roots(root):
    excluded = set(catalog()["exclude_dirs"]) | {".claude", ".codex", ".idea", ".vscode"}
    for directory, dirs, _ in os.walk(root):
        if "node_modules" in dirs:
            yield Path(directory) / "node_modules"
        dirs[:] = [d for d in dirs if d not in excluded and d != "node_modules"]


def snapshot_sources(root, run):
    """Freeze review evidence once; live editor or source changes cannot invalidate it."""
    before = input_manifest(root)
    target = run / "source"
    target.mkdir(parents=True)
    for rel in before:
        dest = target / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / rel, dest)
    if input_manifest(target) != before or input_manifest(root) != before:
        die("source changed while taking the snapshot; choose a new run directory and retry inventory")
    # Installed dependencies remain live and are explicitly outside source guarantees.
    for deps in dependency_roots(root):
        link = target / deps.relative_to(root)
        link.parent.mkdir(parents=True, exist_ok=True)
        link.symlink_to(deps.resolve(), target_is_directory=True)
    return target


def ensure_inputs(run):
    meta = run_meta(run)
    if meta.get("format") != 3:
        die("legacy run format; start a new inventory (existing rulings remain on disk)")
    if meta["bundle"] != bundle_digest():
        die("skill/catalog changed since inventory; start a new run")
    current = input_manifest(Path(meta["root"]))
    if current != meta["inputs"]:
        changed = sorted(k for k in set(current) | set(meta["inputs"]) if current.get(k) != meta["inputs"].get(k))
        die("snapshot inputs changed; restore the snapshot or start a new inventory: " + ", ".join(changed[:10]))


def discovery_text(meta):
    return ("# Discovery scope\n\n"
            "Counts cover catalog pattern matches, not every backend operation.\n"
            f"Kinds: {', '.join(meta['kinds'])}. Paths: {', '.join(meta['paths']) or 'all scanned source'}.\n"
            "Blind spots: aliases, dynamic/computed calls, unsupported SDK/framework names, multiline syntax, "
            "multiple operations on one line, constructs folded by a kind's merge window. Comments/strings may match.\n"
            "Only catalog source extensions are scanned. Declaration files, generated/dependency directories, "
            "hidden directories and non-source deployment files are not site inventories. Tests use test-only kinds.\n"
            "Agents may cite deployment and dependency evidence. Source and configuration inputs are snapshotted; dependency "
            "files outside that manifest are not frozen. Recheck library evidence before final judgment.\n"
            "Compare boundary.md diagnostic locations with sites.jsonl. Different tool rules have different "
            "denominators; matching counts do not establish completeness. Missing tooling means unmeasured.\n")


def declaration_path(effect, package, module):
    def types(value):
        if isinstance(value, str):
            return value if value.endswith((".d.ts", ".d.mts", ".d.cts")) else None
        if isinstance(value, dict):
            if "types" in value:
                found = types(value["types"])
                if found:
                    return found
            for nested in value.values():
                found = types(nested)
                if found:
                    return found
        return None
    exports = package.get("exports", {})
    if isinstance(exports, dict):
        key = "./" + module
        target = types(exports.get(key))
        if key in exports and not target:
            return None
        if not target:
            for key, value in exports.items():
                if "*" in key:
                    before, after = key.split("*", 1)
                    spec = "./" + module
                    if spec.startswith(before) and spec.endswith(after):
                        match = spec[len(before):len(spec) - len(after) if after else None]
                        template = types(value)
                        if template:
                            target = template.replace("*", match)
                            break
        if target:
            return effect / target
    if "exports" in package:
        return None
    # Older packages and fixture packages may have no exports map.
    for path in (effect / "dist" / f"{module}.d.ts", effect / "dist/dts" / f"{module}.d.ts"):
        if path.exists():
            return path
    return None


def effective_digest(run):
    merged, sites = merged_answers(run, sites_of(run))
    return digest({"answers": merged, "sites": sites})


def require_answers(run):
    failures = []
    check_answers(run, catalog(), sites_of(run), run_meta(run), failures)
    if failures:
        die("; ".join(failures))


def require_mapping(run):
    data = load_json(Path(run) / "clusters.json")
    if data.get("facts_digest") != effective_digest(run):
        die("answers changed since map; rerun audit and map before judging or reporting")
    return data


def archive_outputs(run):
    run = Path(run)
    names = ("judges", "verdicts", "carried.jsonl", "merges.jsonl", "report.json", "clusters.json", "coverage.md")
    existing = [run / name for name in names if (run / name).exists()]
    if existing:
        archive = run / "history" / str(len(list((run / "history").glob("*"))) + 1)
        archive.mkdir(parents=True)
        for path in existing:
            shutil.move(str(path), str(archive / path.name))


def verdict_context(cluster):
    cat = catalog()
    rule = next(r for r in cat["rules"] if r["id"] == cluster["rule"])
    return digest({"rule": rule, "concept": cat["concepts"][rule["concept"]]})


def save_reusable(run):
    """Only checked rows may survive remapping; affected dependencies reopen the row."""
    path = Path(run) / "clusters.json"
    if not path.exists():
        return
    data = load_json(path)
    if data["facts_digest"] != effective_digest(run):
        return
    effective, _ = merged_answers(run, sites_of(run))
    clusters = {c["id"]: c for c in data["clusters"]}
    rows = load_verdicts(run, [])
    entries = load_json(Path(run) / "reusable.json") if (Path(run) / "reusable.json").exists() else []
    # A completed group can survive even if another judge has not returned yet.
    for group in sorted({stem for _, stem, _ in rows}):
        failures = []
        check_verdicts(run, failures, group)
        if failures:
            continue
        for _, stem, row in rows:
            if stem != group or row["finding"] == "refuted":
                continue
            c = clusters[row["cluster"]]
            listed = [x["site"] for x in c["sites"]] if row["sites"] == "all" else row["sites"]
            deps = set(listed) | set(row.get("depends_on", []))
            entries.append({"row": {**row, "sites": listed}, "rule": c["rule"], "context": verdict_context(c),
                            "facts": {sid: digest(effective[sid]) for sid in sorted(deps)},
                            "user": {x["site"]: x.get("user") for x in c["sites"] if x["site"] in listed},
                            "effect": data.get("effect")})
    latest = {(e["rule"], tuple(e["row"]["sites"])): e for e in entries}
    write_json(Path(run) / "reusable.json", list(latest.values()))


def restore_verdicts(run):
    run = Path(run)
    entries = load_json(run / "reusable.json") if (run / "reusable.json").exists() else []
    data = load_json(run / "clusters.json")
    effective, _ = merged_answers(run, sites_of(run))
    groups = {p.stem: load_json(p) for p in sorted((run / "judges").glob("*.json"))}
    owners = {cid: gid for gid, g in groups.items() for cid in g["clusters"]}
    carried, covered = [], set()
    for entry in entries:
        row = entry["row"]
        if any(sid not in effective or digest(effective[sid]) != value for sid, value in entry["facts"].items()):
            continue
        if row["remedy"] == "effect" and entry["effect"] != data.get("effect"):
            continue
        for c in data["clusters"]:
            ids = {x["site"] for x in c["sites"]}
            if c["rule"] != entry["rule"] or not set(row["sites"]) <= ids or entry["context"] != verdict_context(c):
                continue
            user = {x["site"]: x.get("user") for x in c["sites"] if x["site"] in row["sites"]}
            keys = {(c["id"], sid) for sid in row["sites"]}
            if user != entry["user"] or keys & covered:
                continue
            carried.append({**row, "id": f"{owners[c['id']]}-R{len(carried)+1}", "cluster": c["id"]})
            covered.update(keys)
            break
    (run / "carried.jsonl").write_text("".join(json.dumps(r) + "\n" for r in carried))
    for gid, group in groups.items():
        group["pending"] = {c["id"]: [x["site"] for x in c["sites"] if (c["id"], x["site"]) not in covered]
                            for c in data["clusters"] if c["id"] in group["clusters"]}
        write_json(run / "judges" / (gid + ".json"), group)
        pending = {sid for ids in group["pending"].values() for sid in ids}
        print(f"{gid}: {len(pending)} sites need judgment")
    print(f"Carried {len(carried)} checked verdicts; affected rows require judgment.")


def hint_conflicts(run):
    effective, _ = merged_answers(run, sites_of(run))
    result = {}
    for sid, hints in derived_of(run).items():
        row = effective.get(sid, {})
        for qid, hint in hints.items():
            if row.get("status") == "not-a-site" or row.get("answers", {}).get(qid, {}).get("a") in ("no", "n/a"):
                result[sid + ":" + qid] = hint
    return result


def audit_candidates(run):
    merged, sites = merged_answers(run, sites_of(run))
    conflicts = hint_conflicts(run)
    candidates = {}
    for key, hint in conflicts.items():
        sid, qid = key.split(":")
        candidates[key] = {"id": key, "site": sid, "question": qid, "rules": [], "hint": hint, "mandatory": True}
    for sid, row in sorted(merged.items()):
        if row["status"] != "site":
            continue
        for rule in catalog()["rules"]:
            if rule["kind"] != sites[sid]["kind"] or rule["lane"] != "defect" or evaluate(rule, row["answers"]) is not None:
                continue
            for qid, want in rule["when"].items():
                if want == "yes" and row["answers"].get(qid, {}).get("a") == "no":
                    key = sid + ":" + qid
                    candidates.setdefault(key, {"id": key, "site": sid, "question": qid, "rules": [], "mandatory": False})["rules"].append(rule["id"])
    for row in candidates.values():
        row["fingerprint"] = digest({"candidate": row, "facts": merged[row["site"]]})
    return list(candidates.values())


def cmd_audit(args):
    require_answers(args.run)
    run = Path(args.run)
    if audit_refutations(run):
        die("unapplied audit refutations; use reconcile --stage audit before regenerating the audit")
    candidates = audit_candidates(run)
    mandatory = [r for r in candidates if r["mandatory"]]
    optional = sorted((r for r in candidates if not r["mandatory"]), key=lambda row: digest(row["id"]))
    selected = mandatory + (optional if args.all else optional[:args.sample])
    cache = load_json(run / "audit-cache.json") if (run / "audit-cache.json").exists() else {}
    reused = [cache[r["id"]] for r in selected if cache.get(r["id"], {}).get("fingerprint") == r["fingerprint"]]
    reused_ids = {r["id"] for r in reused}
    write_json(run / "audit.json", {"facts_digest": effective_digest(run), "eligible": len(candidates),
                                    "selected": selected, "mandatory": len(mandatory), "sample": args.sample,
                                    "reused": sorted(reused_ids)})
    (run / "audit-answers.jsonl").write_text("".join(json.dumps(r) + "\n" for r in reused))
    merged, sites = merged_answers(run, sites_of(run))
    out = ["# Audit hint contradictions and defect-excluding negatives", header(run_meta(run)),
           f"Follow `{SKILL / 'audit.md'}`. Append pending results to `{run.resolve() / 'audit-answers.jsonl'}`.",
           f"Selected {len(selected)}/{len(candidates)} eligible answers, including every hint contradiction ({len(mandatory)}). "
           f"Reused {len(reused)} confirmations; {len(candidates)-len(selected)} optional negatives remain unaudited.",
           f"Complete answer sets and correction digests: `{cmd('facts', run)}`."]
    for item in selected:
        if item["id"] in reused_ids:
            continue
        q = questions_of(catalog(), sites[item["site"]]["kind"])[item["question"]]
        out += [site_line(item["site"], sites[item["site"]]), *question_lines(q),
                "Audit id: " + item["id"] + "; fingerprint: " + item["fingerprint"],
                "Current site and answer: " + json.dumps(merged[item["site"]]),
                "Hint to resolve: " + json.dumps(item.get("hint"))]
    out.append(f"When done: {cmd('check', run, '--stage', 'audit')}")
    (run / "audit-packet.md").write_text("\n\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out))


def validate_correction(run, update, effective, sites, where, failures):
    if not isinstance(update, dict):
        failures.append(f"{where}: correction must be an object")
        return
    sid = update.get("site")
    if sid not in effective:
        failures.append(f"{where}: correction needs an existing site")
        return
    if not update.get("reason") or update.get("before") != digest(effective[sid]):
        failures.append(f"{where}: correction needs reason and current before digest")
    answers = update.get("answers", {})
    check_answer_set(run_meta(run)["root"], questions_of(catalog(), sites[sid]["kind"]), answers, where, failures)
    check_hint_answers(sid, answers, derived_of(run).get(sid, {}), failures)
    if answers == effective[sid]["answers"]:
        failures.append(f"{where}: correction must change answers")


def check_audit(run, failures):
    run = Path(run)
    if not (run / "audit.json").exists():
        failures.append("run audit before map, even when no negatives are eligible")
        return
    data = load_json(run / "audit.json")
    if data["facts_digest"] != effective_digest(run):
        failures.append("audit is stale; rerun audit after answer changes")
        return
    path = run / "audit-answers.jsonl"
    if not path.exists():
        failures.append("audit-answers.jsonl is missing")
        return
    effective, sites = merged_answers(run, sites_of(run))
    expected = {r["id"]: r for r in data["selected"]}
    seen, confirmed = set(), {}
    for n, row in load_jsonl(path, failures):
        aid = row.get("id")
        if aid not in expected or aid in seen:
            failures.append(f"audit:{n}: unknown or duplicate id {aid}")
            continue
        seen.add(aid)
        if row.get("fingerprint") != expected[aid]["fingerprint"]:
            failures.append(f"audit:{n}: fingerprint must match the packet")
        if row.get("result") not in ("confirmed", "refuted") or not row.get("evidence") or not row.get("searched"):
            failures.append(f"audit:{n}: requires confirmed or refuted, evidence and searched")
        if row.get("evidence"):
            check_evidence(run_meta(run)["root"], row["evidence"], f"audit:{n}", failures)
        if row.get("result") == "refuted":
            update = row.get("correction")
            validate_correction(run, update, effective, sites, f"audit:{n}", failures)
            if isinstance(update, dict) and update.get("site") != expected[aid]["site"]:
                failures.append(f"audit:{n}: correction must target this audited site")
            if isinstance(update, dict) and effective[expected[aid]["site"]]["status"] != "not-a-site":
                qid = expected[aid]["question"]
                if update.get("answers", {}).get(qid) == effective[expected[aid]["site"]]["answers"].get(qid):
                    failures.append(f"audit:{n}: the audited answer must change")
        elif row.get("result") == "confirmed":
            confirmed[aid] = row
    for aid in sorted(set(expected) - seen):
        failures.append(f"audit: missing {aid}")
    if not failures:
        cache = load_json(run / "audit-cache.json") if (run / "audit-cache.json").exists() else {}
        for aid in seen - set(confirmed):
            cache.pop(aid, None)
        write_json(run / "audit-cache.json", {**cache, **confirmed})


def audit_refutations(run):
    path = Path(run) / "audit-answers.jsonl"
    return [row["correction"] for _, row in load_jsonl(path, []) if row.get("result") == "refuted"] if path.exists() else []


def cmd_correct(args):
    """Apply complete per-site answer sets, then invalidate all dependent outputs."""
    run = Path(args.run)
    failures = []
    merged, sites = merged_answers(run, sites_of(run))
    updates = {}
    for n, row in load_jsonl(args.file, failures):
        sid = row.get("site")
        if sid not in sites or sid in updates:
            failures.append(f"correction:{n}: unknown or repeated site {sid}")
            continue
        if not row.get("reason") or row.get("before") != digest(merged[sid]):
            failures.append(f"correction:{n}: reason and current before digest required; see facts command")
        answers = row.get("answers", {})
        check_answer_set(run_meta(run)["root"], questions_of(catalog(), sites[sid]["kind"]), answers, sid, failures)
        check_hint_answers(sid, answers, derived_of(run).get(sid, {}), failures)
        if answers == merged[sid]["answers"]:
            failures.append(f"correction:{n}: answers did not change")
        updates[sid] = answers
    if failures:
        die("; ".join(failures))
    if not updates:
        die("no corrections supplied")
    old = load_json(run / "corrections.json") if (run / "corrections.json").exists() else {}
    # Save exact correction evidence before replacing the effective facts.
    history = run / "correction-history"
    history.mkdir(exist_ok=True)
    if len(list(history.glob("*.jsonl"))) >= args.max_rounds:
        die("correction round limit reached; report this run as incomplete. Increase --max-rounds only for an agreed continuation")
    shutil.copyfile(args.file, history / f"{len(list(history.iterdir())) + 1}.jsonl")
    save_reusable(run)
    write_json(run / "corrections.json", {**old, **updates})
    archive_outputs(run)
    for name in ("audit.json", "audit-answers.jsonl", "audit-packet.md"):
        if (run / name).exists():
            (run / name).unlink()
    print("Corrections applied; checked verdicts saved for reuse. Rebuild audit selection and mapping.")
    print(f"next: {cmd('check', run, '--stage', 'answers')}")


def cmd_facts(args):
    merged, sites = merged_answers(args.run, sites_of(args.run))
    for sid, row in sorted(merged.items()):
        if not args.sites or sid in args.sites.split(","):
            print(json.dumps({"site": sid, "before": digest(row), "kind": sites[sid]["kind"], **row}))


def site_identity(meta, site, answers, rule):
    """A ruling follows the same operation and deciding facts, not the whole checkout."""
    lines = (Path(meta["root"]) / site["path"]).read_text(encoding="utf-8").splitlines()
    anchor = lines[site["line"] - 1].strip()
    copies = [n for n, line in enumerate(lines, 1) if line.strip() == anchor]
    # Repeated identical lines are ambiguous: changing their file reopens them.
    duplicate = file_digest(Path(meta["root"]) / site["path"]) if len(copies) > 1 else None
    qs = questions_of(catalog(), site["kind"])
    deciding = set(rule["when"])
    pending = list(deciding)
    while pending:
        for qid in qs[pending.pop()].get("only_if", {}):
            if qid not in deciding:
                deciding.add(qid); pending.append(qid)
    values = {q: {k: answers.get(q, {}).get(k) for k in ("a", "missing")} for q in sorted(deciding)}
    semantics = {"rule": rule, "questions": [qs[q] for q in sorted(deciding)]}
    if catalog()["kinds"][site["kind"]].get("scope") == "run":
        anchor, duplicate = "shared contract assessment", None
        location = {"paths": meta["paths"], "kind": site["kind"]}
    else:
        location = {"path": site["path"], "anchor": anchor, "duplicate_file": duplicate,
                    "duplicate_line": site["line"] if duplicate else None}
    return digest({"location": location, "facts": values, "semantics": semantics})



def cmd_reconcile(args):
    failures = []
    if args.stage == "audit":
        check_audit(args.run, failures)
        corrections = audit_refutations(args.run)
    else:
        check_verdicts(args.run, failures)
        corrections = [update for _, _, row in load_verdicts(args.run, []) if row["finding"] == "refuted"
                       for update in row["corrections"]]
    if failures:
        die("; ".join(failures))
    updates = {}
    for update in corrections:
        sid = update["site"]
        if sid in updates and updates[sid]["answers"] != update["answers"]:
            die(f"conflicting corrections for {sid}; resolve the cited evidence before reconcile")
        updates[sid] = update
    path = Path(args.run) / "pending-corrections.jsonl"
    path.write_text("".join(json.dumps(r) + "\n" for r in updates.values()), encoding="utf-8")
    args.file = str(path)
    cmd_correct(args)


# ---------------------------------------------------------------- main

def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    parser = sub.add_parser("inventory"); parser.add_argument("root"); parser.add_argument("--run")
    parser.add_argument("--kinds"); parser.add_argument("--paths"); parser.add_argument("--extra")
    parser = sub.add_parser("api"); parser.add_argument("run"); parser.add_argument("--effect")
    parser = sub.add_parser("boundary"); parser.add_argument("run"); parser.add_argument("--tsgo-json")
    parser = sub.add_parser("shard"); parser.add_argument("run"); parser.add_argument("--answers", type=int, default=400)
    parser = sub.add_parser("packet"); parser.add_argument("run"); parser.add_argument("shard")
    parser = sub.add_parser("check"); parser.add_argument("run")
    parser.add_argument("--stage", choices=("answers", "audit", "verdicts", "merges"), default="answers")
    parser.add_argument("--part")
    parser = sub.add_parser("audit"); parser.add_argument("run"); parser.add_argument("--sample", type=int, default=30, help="optional negatives to audit, in addition to every hint contradiction")
    parser.add_argument("--all", action="store_true", help="audit every eligible answer")
    parser = sub.add_parser("correct"); parser.add_argument("run"); parser.add_argument("--file", required=True); parser.add_argument("--max-rounds", type=int, default=3)
    parser = sub.add_parser("facts"); parser.add_argument("run"); parser.add_argument("--sites")
    parser = sub.add_parser("reconcile"); parser.add_argument("run")
    parser.add_argument("--stage", choices=("audit", "verdicts"), default="verdicts")
    parser.add_argument("--max-rounds", type=int, default=3)
    parser = sub.add_parser("map"); parser.add_argument("run"); parser.add_argument("--rulings")
    parser.add_argument("--sites-per-judge", type=int, default=80)
    parser.add_argument("--include-held", action="store_true", help="revisit rejected or deferred candidates for this run")
    parser = sub.add_parser("judge-packet"); parser.add_argument("run"); parser.add_argument("group")
    parser = sub.add_parser("merge-packet"); parser.add_argument("run")
    parser = sub.add_parser("rule"); parser.add_argument("run"); parser.add_argument("--rulings")
    parser.add_argument("--decision", choices=("accept", "reject", "defer"), required=True)
    parser.add_argument("--verdicts", required=True); parser.add_argument("--reason", required=True)
    parser.add_argument("--scope", help="explicit broad policy glob; otherwise bind to exact source/facts")
    args = p.parse_args()
    if args.cmd != "inventory":
        ensure_inputs(args.run)
    for attr in ("answers", "sites_per_judge", "max_rounds"):
        if hasattr(args, attr) and getattr(args, attr) <= 0:
            die(f"{attr} must be positive")
    if hasattr(args, "sample") and args.sample < 0:
        die("sample must be nonnegative")
    globals()["cmd_" + args.cmd.replace("-", "_")](args)

if __name__ == "__main__":
    main()
