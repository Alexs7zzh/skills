#!/usr/bin/env python3
"""Deterministic steps of the backend-primitives sweep.

usage:
  sweep.py inventory    ROOT [--run RUN] [--kinds K,K] [--paths GLOB,GLOB] [--extra FILE]
  sweep.py api          RUN [--effect DIR]
  sweep.py boundary     RUN [--tsgo-json FILE]
  sweep.py shard        RUN [--answers N]
  sweep.py packet       RUN SHARD
  sweep.py check        RUN [--stage answers|verdicts|merges] [--part A01|J01]
  sweep.py map          RUN [--rulings FILE] [--clusters-per-judge N]
  sweep.py judge-packet RUN GROUP
  sweep.py merge-packet RUN
  sweep.py rule         RUN --decision accept|reject|defer --verdicts V,V --reason TEXT
                        [--rulings FILE] [--scope GLOB]

Every command reads catalog.json in the skill directory and writes only inside
RUN, except `rule`, which writes the rulings file. The rulings file defaults to
backend-primitives.rulings.json at the target's root. A failing command prints
one line per failure and exits 1. Each command's last line names the next
step. Only the Python 3 standard library.
"""
import argparse
import copy
import datetime
import fnmatch
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
SCRIPT = Path(__file__).resolve()
RULINGS_NAME = "backend-primitives.rulings.json"
ANSWER_TOKENS = ("yes", "no", "unknown", "n/a")
LANES = ("defect", "primitive", "adopt")
VERDICTS = ("refuted", "fix", "decide", "leave", "build", "adopt", "local")
CHANGE_VERDICTS = ("fix", "decide", "build", "adopt", "local")
LAYERS = ("schema", "error", "config", "primitive", "service", "entry", "test")
VERDICT_SLOTS = {
    "refuted": ("fact", "evidence", "note"),
    "fix": ("evidence", "consequence", "proposal", "layer"),
    "decide": ("question", "recommendation", "consequence"),
    "leave": ("counter", "evidence"),
    "build": ("evidence", "proposal", "layer"),
    "adopt": ("evidence", "proposal", "layer"),
    "local": ("evidence", "proposal", "layer"),
}
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
                rows.append((n, json.loads(line)))
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
    return " ".join(["python3", str(SCRIPT), *map(str, parts)])


def pack(units, budget, split=True):
    """Pack (cost, items) units in order into bins of about budget cost.

    With split, a unit over budget is split by item; without it, a unit
    stays whole and an oversized unit fills a bin alone."""
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
    done = f" (answered by the script: {given})" if given else ""
    return f"- {sid} `{s['path']}:{s['line']}`{also} `{s['snippet']}`{done}"


def header(meta):
    return f"Repository root: `{meta['root']}` at {meta['vcs']} {meta['revision'] or meta['digest']} ({meta['state']})."


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
    while (candidate / "sites.jsonl").exists():
        candidate, n = base / f"{root.name}-{label}-{n}", n + 1
    return candidate


def cmd_inventory(args):
    cat = catalog()
    root = Path(args.root).resolve()
    if not root.is_dir():
        die(f"{root} is not a directory")
    kinds = args.kinds.split(",") if args.kinds else list(cat["kinds"])
    for k in kinds:
        if k not in cat["kinds"]:
            die(f"unknown kind {k}; kinds are {', '.join(cat['kinds'])}")
    globs = args.paths.split(",") if args.paths else []
    test_path = re.compile(cat["test_path"])
    compiled = {k: [re.compile(p) for p in cat["kinds"][k]["patterns"]] for k in kinds}
    hasher = hashlib.sha256()
    found = []
    for rel in source_files(root, cat, globs):
        text = (root / rel).read_text(encoding="utf-8", errors="replace")
        hasher.update(rel.encode() + text.encode())
        is_test = bool(test_path.search("/" + rel))
        for k in kinds:
            if (cat["kinds"][k]["scan"] == "tests") != is_test:
                continue
            for n, line in enumerate(text.splitlines(), 1):
                if not COMMENT.match(line) and any(p.search(line) for p in compiled[k]):
                    found.append({"kind": k, "path": rel, "line": n, "snippet": line.strip()[:160], "source": "scan"})
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
    meta = {"root": str(root), "kinds": kinds, "paths": globs, "catalog": cat["written_against"],
            "created": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            **revision(root, hasher.hexdigest()[:16])}
    run = Path(args.run) if args.run else default_run_dir(root, (meta["revision"] or meta["digest"])[:8])
    if (run / "sites.jsonl").exists():
        die(f"{run} already holds an inventory; omit --run to get a new run directory")
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
    write_json(run / "run.json", meta)
    print(f"run directory: {run}")
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
        version = load_json(effect / "package.json").get("version")
        cache, missing = {}, {}
        for cid, concept in cat["concepts"].items():
            for api in concept["apis"]:
                module, _, name = api.rpartition(".")
                if module not in cache:
                    dts = effect / "dist" / f"{module}.d.ts"
                    cache[module] = export_names(dts.read_text(encoding="utf-8")) if dts.exists() else None
                if cache[module] is None or name not in cache[module]:
                    missing.setdefault(cid, []).append(api)
        write_json(run / "api.json", {"installed": version, "catalog": cat["written_against"], "missing": missing})
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
            print(f"@effect/tsgo or tsconfig.json is not in {root}; no boundary counts")
            print(f"next: {cmd('shard', run)}")
            return
        config = {"name": "@effect/language-service", "diagnosticSeverity": {r: "warning" for r in cat["tsgo_rules"]}}
        out = subprocess.run([str(tool), "diagnostics", "--project", str(project), "--format", "json",
                              "--lspconfig", json.dumps(config)], capture_output=True, text=True, cwd=root, timeout=600)
        try:
            data = json.loads(out.stdout)
        except json.JSONDecodeError:
            die(f"effect-tsgo returned no JSON (exit {out.returncode}): {out.stderr.strip()[:300]}")
    counts = {}
    for d in data.get("diagnostics", []):
        if d.get("name") not in cat["tsgo_rules"]:
            continue
        # Resolve both sides: tsgo may report a path through a symlink the root resolved.
        rel = os.path.relpath(Path(d["file"]).resolve(), root.resolve()).replace(os.sep, "/") if os.path.isabs(d["file"]) else d["file"]
        area = "/".join(rel.split("/")[:2]) if "/" in rel else rel
        counts.setdefault(d["name"], {}).setdefault(area, 0)
        counts[d["name"]][area] += 1
    write_json(run / "boundary.json", counts)
    lines = ["# Unwrapped boundary uses", "", "Counts from @effect/tsgo's Effect-native rules, per directory.", "",
             "| rule | total | largest areas |", "| --- | --- | --- |"]
    for rule, areas in sorted(counts.items(), key=lambda kv: -sum(kv[1].values())):
        top = ", ".join(f"{a} {n}" for a, n in sorted(areas.items(), key=lambda kv: -kv[1])[:4])
        lines.append(f"| {rule} | {sum(areas.values())} | {top} |")
    (run / "boundary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[4:]))
    print(f"next: {cmd('shard', run)}")


# Questions a search can settle exactly are answered here, not by agents.
# A site whose line lacks the identifying string (a named type instead of a
# literal, an indirect env read) keeps the question for its answerer.
SPECIFIER = re.compile(r"""(?:from\s+|require\(\s*)['"]([^'"]+)['"]""")
ENV_KEY = re.compile(r"""(?:process\.env|Bun\.env|import\.meta\.env|Deno\.env)(?:\.(\w+)|\[\s*['"](\w+)['"]\s*\])""")
TYPE_LITERAL = re.compile(r"\bas\s+(\{[^{}]*\})")


def fields_of(literal):
    return frozenset(re.findall(r"(\w+)\??\s*:", literal))


def derive_answers(cat, root, sites):
    test_path = re.compile(cat["test_path"])
    lines = {rel: (root / rel).read_text(encoding="utf-8", errors="replace").splitlines()
             for rel in source_files(root, cat, []) if not test_path.search("/" + rel)}

    def others(path, line, match):
        return [f"{p}:{n}" for p, ls in lines.items() for n, text in enumerate(ls, 1)
                if (p, n) != (path, line) and not COMMENT.match(text) and match(text)]

    derived = {}
    for sid, s in sites.items():
        file_lines = lines.get(s["path"], [])
        text = file_lines[s["line"] - 1] if s["line"] <= len(file_lines) else ""
        for q in cat["kinds"][s["kind"]]["questions"]:
            method, hits, searched = q.get("derive"), None, None
            if method == "same-import" and SPECIFIER.search(text):
                spec = SPECIFIER.search(text).group(1)
                searched = f"imports of '{spec}' in every source file"
                hits = [h for h in others(s["path"], s["line"], lambda t: spec in SPECIFIER.findall(t))
                        if h.split(":")[0] != s["path"]]
            elif method == "same-env-key" and ENV_KEY.search(text):
                key = next(g for g in ENV_KEY.search(text).groups() if g)
                searched = f"reads of {key} in every source file"
                hits = others(s["path"], s["line"], lambda t: key in [g for m in ENV_KEY.findall(t) for g in m if g])
            elif method == "same-shape" and TYPE_LITERAL.search(text):
                shape = fields_of(TYPE_LITERAL.search(text).group(1))
                searched = f"casts to a type literal with the fields {', '.join(sorted(shape))} in every source file"
                hits = others(s["path"], s["line"], lambda t: any(fields_of(l) == shape for l in TYPE_LITERAL.findall(t)))
            if hits is None:
                continue
            answer = ({"a": "yes", "ev": hits[0], "note": f"{len(hits)} other place{'' if len(hits) == 1 else 's'}"}
                      if hits else {"a": "no", "note": "none found", "searched": searched})
            derived.setdefault(sid, {})[q["id"]] = {**answer, "derived": True}
    return derived


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
    derived = derive_answers(cat, Path(run_meta(run)["root"]), sites)
    write_json(run / "derived.json", derived)
    print(f"{sum(map(len, derived.values()))} answers derived by search at {len(derived)} sites")
    for n, ids in enumerate(shards, 1):
        kinds = [k for k in cat["kinds"] if any(sites[i]["kind"] == k for i in ids)]
        write_json(shard_dir / f"A{n:02d}.json", {"id": f"A{n:02d}", "kinds": kinds, "sites": ids})
        print(f"  A{n:02d} {len(ids)} sites: {', '.join(kinds)}")
    print(f"{len(shards)} answer shards of at most {args.answers} answers each")
    print(f"next: one answerer per shard, each briefed with {cmd('packet', run, '<shard>')}")


def question_lines(q):
    cond = ""
    if q.get("only_if"):
        cond = " Answer only if " + " and ".join(f"{k} is {v}" for k, v in q["only_if"].items()) + "; otherwise n/a."
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
           f"Follow `{SKILL / 'answer.md'}`. Leave out the answers a site line says the script gave.", ""]
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
        if not path.is_file():
            failures.append(f"{where}: evidence file {m['path']} does not exist under the root")
            continue
        count = len(path.read_text(encoding="utf-8", errors="replace").splitlines())
        first, last = int(m["start"]), int(m["end"] or m["start"])
        if first < 1 or last > count or last < first:
            failures.append(f"{where}: evidence {item} is outside {m['path']} (1-{count})")


def check_answer_set(root, qs, answers, where, failures, derived=None):
    answers = {**answers, **(derived or {})}
    for qid in answers:
        if qid not in qs:
            failures.append(f"{where}: unknown question {qid}")
    for qid, q in qs.items():
        ans = answers.get(qid)
        if condition_met(q.get("only_if", {}), answers) is False:
            if ans is not None and ans.get("a") != "n/a":
                failures.append(f"{where} {qid}: its condition is not met, so the answer is n/a")
            continue
        if ans is None:
            failures.append(f"{where} {qid}: missing answer")
            continue
        a = ans.get("a")
        if a not in ANSWER_TOKENS:
            failures.append(f"{where} {qid}: answer '{a}' is not one of {', '.join(ANSWER_TOKENS)}")
        elif a == "n/a" and not ans.get("note"):
            failures.append(f"{where} {qid}: n/a on an applicable question needs a note saying why")
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


def check_answers(run, cat, sites, meta, failures, only_shard=None):
    shards = {p.stem: load_json(p) for p in sorted((Path(run) / "shards").glob("*.json"))
              if only_shard is None or p.stem == only_shard}
    if not shards:
        failures.append(f"no shard {only_shard}" if only_shard else "no shards; run shard first")
    files = {p.stem: p for p in sorted((Path(run) / "answers").glob("*.jsonl"))}
    derived = derived_of(run)
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
                check_answer_set(meta["root"], questions_of(cat, sites[site]["kind"]), row.get("answers", {}), where, failures,
                                 derived.get(site))
            else:
                failures.append(f"{where}: status '{status}' is not site or not-a-site")
        for site in shard["sites"]:
            if site not in rows:
                failures.append(f"{files[sid].name}: site {site} has no row")
        for site, row in rows.items():
            target = rows.get(row.get("same_as"), {})
            if row.get("same_as") and (target.get("same_as") or target.get("status") == "not-a-site"):
                failures.append(f"{files[sid].name}: {site} same_as {row['same_as']}, which has no answers of its own")
    if only_shard is None:
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
                                       "same_as": row.get("same_as")}
    for m in merged.values():
        if m.get("same_as"):
            m["answers"] = copy.deepcopy(merged.get(m["same_as"], {}).get("answers", {}))
    for sid, answers in derived_of(run).items():
        if sid in merged:
            merged[sid]["answers"].update(answers)
    if failures:
        die("; ".join(failures))
    return merged, all_sites


# ---------------------------------------------------------------- map

def evaluate(rule, answers):
    """'matched', 'unresolved' or None."""
    state = "matched"
    for qid, want in rule["when"].items():
        got = answers.get(qid, {}).get("a")
        if got == "unknown":
            state = "unresolved"
        elif got != want:
            return None
    return state


def rulings_path(run, given):
    return Path(given) if given else Path(run_meta(run)["root"]) / RULINGS_NAME


def ruling_effect(rulings, rule_id, site_path):
    """None, or suppress, accepted or requeue, from the last matching ruling."""
    hit = None
    for r in rulings:
        if r["rule"] == rule_id and (site_path in r.get("paths", []) or (r.get("scope") and fnmatch.fnmatch(site_path, r["scope"]))):
            hit = r
    if hit is None:
        return None, None
    if hit["decision"] == "defer":
        return "suppress", hit
    if hit["verdict_token"] in CHANGE_VERDICTS:
        return ("accepted" if hit["decision"] == "accept" else "suppress"), hit
    return ("suppress" if hit["decision"] == "accept" else "requeue"), hit


def coverage(cat, merged, all_sites):
    rows = []
    for c in cat["coverage"]:
        kind = next(k for k, v in cat["kinds"].items() if any(q["id"] == c["question"] for q in v["questions"]))
        has = lacks = unknown = 0
        for sid, m in merged.items():
            if m["status"] != "site" or all_sites[sid]["kind"] != kind:
                continue
            a = m["answers"]
            if any(a.get(q, {}).get("a") != v for q, v in c.get("among", {}).items()):
                continue
            got = a.get(c["question"], {}).get("a")
            if got == c["has"]:
                has += 1
            elif got == "unknown":
                unknown += 1
            elif got in ("yes", "no"):
                lacks += 1
        rows.append({"label": c["label"], "has": has, "of": has + lacks, "unknown": unknown})
    return rows


def cmd_map(args):
    cat = catalog()
    run = Path(args.run)
    merged, all_sites = merged_answers(run, sites_of(run))
    api = load_json(run / "api.json") if (run / "api.json").exists() else {"installed": None, "missing": {}}
    rpath = rulings_path(run, args.rulings)
    rulings = load_json(rpath).get("rulings", []) if rpath.exists() else []
    rules = {r["id"]: r for r in cat["rules"]}
    clusters, suppressed, accepted = {}, {}, {}
    for sid, m in sorted(merged.items()):
        if m["status"] != "site":
            continue
        site = all_sites[sid]
        for rule in cat["rules"]:
            state = evaluate(rule, m["answers"]) if rule["kind"] == site["kind"] else None
            if not state:
                continue
            effect, hit = ruling_effect(rulings, rule["id"], site["path"])
            if effect == "suppress":
                suppressed.setdefault(rule["id"], []).append(sid)
            elif effect == "accepted":
                accepted.setdefault(rule["id"], []).append(sid)
            else:
                entry = {"site": sid, "state": state}
                if effect == "requeue":
                    entry["user"] = f"the user rejected an earlier leave: {hit['reason']}"
                clusters.setdefault(rule["id"], []).append(entry)
    order = sorted(clusters, key=lambda rid: (list(cat["kinds"]).index(rules[rid]["kind"]), LANES.index(rules[rid]["lane"]), rid))
    out = [{"id": f"C{n:02d}", "rule": rid, "lane": rules[rid]["lane"], "kind": rules[rid]["kind"],
            "concept": rules[rid]["concept"], "unavailable": api["missing"].get(rules[rid]["concept"], []),
            "sites": clusters[rid]} for n, rid in enumerate(order, 1)]
    # A kind's clusters stay in one group, so one judge sees every cluster at
    # a site and can let one change cover the others. Small kinds share.
    units = [(len(ids), ids) for ids in ([c["id"] for c in out if c["kind"] == k] for k in cat["kinds"]) if ids]
    groups = pack(units, args.clusters_per_judge, split=False)
    for old in (run / "judges").glob("*.json") if (run / "judges").exists() else []:
        old.unlink()
    for n, g in enumerate(groups, 1):
        write_json(run / "judges" / f"J{n:02d}.json", {"id": f"J{n:02d}", "clusters": g})
    cov = coverage(cat, merged, all_sites)
    write_json(run / "clusters.json", {"clusters": out, "suppressed": suppressed, "accepted": accepted,
                                       "rulings": str(rpath) if rpath.exists() else None,
                                       "effect": api.get("installed"), "coverage": cov})
    lines = ["# Guarantee coverage", "", "| guarantee | sites that have it | unknown |", "| --- | --- | --- |"]
    lines += [f"| {r['label']} | {r['has']}/{r['of']} | {r['unknown']} |" for r in cov if r["of"] or r["unknown"]]
    (run / "coverage.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[2:]))
    print(f"{len(out)} clusters in {len(groups)} judge groups; rulings {rpath if rpath.exists() else 'none'}; "
          f"{sum(map(len, suppressed.values()))} candidates suppressed, {sum(map(len, accepted.values()))} accepted earlier")
    for c in out:
        unresolved = sum(1 for s in c["sites"] if s["state"] == "unresolved")
        print(f"  {c['id']} {c['lane']:9} {c['rule']}: {len(c['sites'])} sites" + (f", {unresolved} unresolved" if unresolved else "")
              + (f", concept unavailable: {', '.join(c['unavailable'])}" if c["unavailable"] else ""))
    print("next: report that no rule matched" if not out else
          f"next: one judge per group in {run / 'judges'}, each briefed with {cmd('judge-packet', run, '<group>')}")


def cmd_judge_packet(args):
    cat = catalog()
    run = Path(args.run).resolve()
    merged, all_sites = merged_answers(run, sites_of(run))
    data = load_json(run / "clusters.json")
    group = load_json(run / "judges" / f"{args.group}.json")
    by_id = {c["id"]: c for c in data["clusters"]}
    rules = {r["id"]: r for r in cat["rules"]}
    out = [f"# Judge group {group['id']}", "", header(run_meta(run)),
           f"Installed effect: {data.get('effect') or 'not installed, so API names are unverified'}. "
           f"Catalog API names are from {cat['written_against']}.",
           f"Write verdicts to `{run / 'verdicts' / (group['id'] + '.jsonl')}`. Follow `{SKILL / 'judge.md'}`.", ""]
    for cid in group["clusters"]:
        c = by_id[cid]
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
    return [(f"{p.name}:{n}", p.stem, row) for p in (sorted(d.glob("*.jsonl")) if d.exists() else [])
            for n, row in load_jsonl(p, failures)]


def check_verdicts(run, failures, only_group=None):
    cat = catalog()
    rules = {r["id"]: r for r in cat["rules"]}
    data = load_json(Path(run) / "clusters.json")
    root = run_meta(run)["root"]
    clusters = {c["id"]: c for c in data["clusters"]}
    _, all_sites = merged_answers(run, sites_of(run))
    groups = {p.stem: load_json(p)["clusters"] for p in sorted((Path(run) / "judges").glob("*.json"))}
    rows = load_verdicts(run, failures)
    by_id = {row.get("id"): (stem, row) for _, stem, row in rows}
    if only_group is not None:
        rows = [r for r in rows if r[1] == only_group]
        if not rows:
            failures.append(f"verdicts/{only_group}.jsonl has no rows")
    seen, covered = set(), {}
    for where, stem, row in rows:
        vid, cid, verdict = row.get("id"), row.get("cluster"), row.get("verdict")
        if not vid or vid in seen:
            failures.append(f"{where}: verdict id '{vid}' is missing or repeated")
        seen.add(vid)
        if cid not in clusters:
            failures.append(f"{where}: unknown cluster {cid}")
            continue
        if stem in groups and cid not in groups[stem]:
            failures.append(f"{where}: cluster {cid} belongs to another judge group")
        if verdict not in VERDICTS:
            failures.append(f"{where}: verdict '{verdict}' is not one of {', '.join(VERDICTS)}")
            continue
        failures += [f"{where}: {verdict} needs {slot}" for slot in VERDICT_SLOTS[verdict] if not row.get(slot)]
        when = rules[clusters[cid]["rule"]]["when"]
        if verdict == "refuted" and row.get("fact") not in when:
            failures.append(f"{where}: refuted fact must be one of the rule's questions: {', '.join(when)}")
        if row.get("layer") and row["layer"] not in LAYERS:
            failures.append(f"{where}: layer '{row['layer']}' is not one of {', '.join(LAYERS)}")
        if row.get("evidence"):
            check_evidence(root, row["evidence"], where, failures)
        if row.get("covered_by"):
            target = by_id.get(row["covered_by"])
            if verdict != "leave":
                failures.append(f"{where}: covered_by belongs on a leave row")
            elif target is None or target[0] != stem:
                failures.append(f"{where}: covered_by {row['covered_by']} must name a row in the same verdict file")
            elif target[1].get("verdict") not in ("fix", "build", "adopt", "local"):
                failures.append(f"{where}: covered_by must name a fix, build, adopt or local row")
        cluster_sites = [s["site"] for s in clusters[cid]["sites"]]
        listed = cluster_sites if row.get("sites") == "all" else row.get("sites") or []
        if not listed:
            failures.append(f"{where}: sites must be 'all' or a list of the cluster's site ids")
        for s in listed:
            if s not in cluster_sites:
                failures.append(f"{where}: site {s} is not in cluster {cid}")
            covered.setdefault((cid, s), []).append(vid)
        if verdict == "build" and (len(listed) < 3 or len({all_sites[s]["path"] for s in listed if s in all_sites}) < 2):
            failures.append(f"{where}: build needs at least 3 sites in at least 2 files; use local otherwise")
        states = {s["site"]: s["state"] for s in clusters[cid]["sites"]}
        if verdict != "refuted" and any(states.get(s) == "unresolved" for s in listed):
            limit = str(row.get("limit", ""))
            if not limit:
                failures.append(f"{where}: rows covering unresolved sites need limit: the fact still missing, or 'settled at path:line'")
            elif verdict == "fix" and not limit.startswith("settled at "):
                failures.append(f"{where}: fix cannot rest on an unresolved fact; settle it at the source or use another verdict")
            elif limit.startswith("settled at "):
                check_evidence(root, limit[len("settled at "):].strip(), where, failures)
        if verdict == "adopt" and clusters[cid]["unavailable"]:
            failures.append(f"{where}: adopt names a concept whose APIs are unavailable: {', '.join(clusters[cid]['unavailable'])}")
    for cid, c in clusters.items():
        if only_group is not None and cid not in groups.get(only_group, []):
            continue
        for s in c["sites"]:
            ids = covered.get((cid, s["site"]), [])
            if not ids:
                failures.append(f"{cid}: site {s['site']} has no verdict")
            elif len(ids) > 1:
                failures.append(f"{cid}: site {s['site']} has verdicts {', '.join(ids)}; give each site one")


def verdict_line(r, clusters, rules, all_sites, extra=""):
    c = clusters[r["cluster"]]
    listed = [s["site"] for s in c["sites"]] if r["sites"] == "all" else r["sites"]
    files = sorted({all_sites[s]["path"] for s in listed})
    where = ", ".join(files[:3]) + (f" +{len(files) - 3}" if len(files) > 3 else "")
    text = r.get("proposal") or r.get("recommendation") or r.get("counter") or f"{r['fact']}: {r['note']}"
    return (f"{r['id']} {r['verdict']} {rules[c['rule']]['id']} [{r.get('layer', '-')}] "
            f"{len(listed)} site{'' if len(listed) == 1 else 's'} in {where}{extra}: {text}")


def load_merges(run, failures):
    path = Path(run) / "merges.jsonl"
    return load_jsonl(path, failures) if path.exists() else None


def cmd_merge_packet(args):
    cat = catalog()
    run = Path(args.run).resolve()
    rules = {r["id"]: r for r in cat["rules"]}
    clusters = {c["id"]: c for c in load_json(run / "clusters.json")["clusters"]}
    _, all_sites = merged_answers(run, sites_of(run))
    rows = [row for _, _, row in load_verdicts(run, []) if row["verdict"] in CHANGE_VERDICTS]
    out = ["# Merge duplicate changes", "", f"Write merges to `{run / 'merges.jsonl'}`. Follow `{SKILL / 'merge.md'}`.", "",
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
    for n, m in merges:
        where = f"merges.jsonl:{n}"
        a, b = rows.get(m.get("row")), rows.get(m.get("into"))
        if a is None or b is None:
            failures.append(f"{where}: row and into must both be verdict ids")
            continue
        if a[1]["verdict"] not in CHANGE_VERDICTS or b[1]["verdict"] not in CHANGE_VERDICTS:
            failures.append(f"{where}: only {', '.join(CHANGE_VERDICTS)} rows merge")
        if a[0] == b[0]:
            failures.append(f"{where}: rows in one verdict file use covered_by, not a merge")
        if not m.get("reason"):
            failures.append(f"{where}: a merge needs a reason")
        if m["row"] in merged:
            failures.append(f"{where}: {m['row']} is merged twice")
        merged[m["row"]] = m["into"]
    for row, into in merged.items():
        if into in merged:
            failures.append(f"merges.jsonl: {row} merges into {into}, which is itself merged; point at the final row")


def print_verdicts(run):
    """One line per verdict, in the order the reply uses."""
    cat = catalog()
    rules = {r["id"]: r for r in cat["rules"]}
    clusters = {c["id"]: c for c in load_json(Path(run) / "clusters.json")["clusters"]}
    _, all_sites = merged_answers(run, sites_of(run))
    rows = [row for _, _, row in load_verdicts(run, [])]
    merges = {m["row"]: m["into"] for _, m in load_merges(run, []) or []}
    covers, absorbs = {}, {}
    for r in rows:
        if r.get("covered_by"):
            # A row covered by a merged row is covered by the row that absorbed it.
            r["covered_by"] = merges.get(r["covered_by"], r["covered_by"])
            covers.setdefault(r["covered_by"], []).append(clusters[r["cluster"]]["rule"])
        if r["id"] in merges:
            absorbs.setdefault(merges[r["id"]], []).append(f"{r['id']} {clusters[r['cluster']]['rule']}")
    order = {v: i for i, v in enumerate(("fix", "decide", "build", "adopt", "local", "leave", "refuted"))}
    rows.sort(key=lambda r: (order[r["verdict"]], LAYERS.index(r["layer"]) if r.get("layer") in LAYERS else len(LAYERS), r["id"]))
    for r in rows:
        if r["id"] in merges:
            continue
        extra = f"; covers {', '.join(covers[r['id']])}" if r["id"] in covers else ""
        extra += f"; merges {', '.join(absorbs[r['id']])}" if r["id"] in absorbs else ""
        extra += f"; covered by {r['covered_by']}" if r.get("covered_by") else ""
        print(verdict_line(r, clusters, rules, all_sites, extra))


def cmd_check(args):
    cat = catalog()
    run = Path(args.run)
    failures = []
    if args.stage == "answers":
        check_answers(run, cat, sites_of(run), run_meta(run), failures, args.part)
    elif args.stage == "verdicts":
        check_verdicts(run, failures, args.part)
    else:
        check_verdicts(run, failures)
        check_merges(run, failures)
    for f in failures:
        print(f)
    if failures:
        sys.exit(1)
    print(f"{args.stage}{' ' + args.part if args.part else ''}: pass")
    if args.part:
        return
    if args.stage == "answers":
        print(f"next: {cmd('map', run)}")
    elif args.stage == "verdicts":
        print(f"next: one consolidator briefed with {cmd('merge-packet', run)}")
    else:
        print_verdicts(run)
        print("next: reply to the user from these verdicts and ask for rulings by verdict id")


# ---------------------------------------------------------------- rulings

def cmd_rule(args):
    run = Path(args.run)
    rows = {row.get("id"): row for _, _, row in load_verdicts(run, [])}
    clusters = {c["id"]: c for c in load_json(run / "clusters.json")["clusters"]}
    _, all_sites = merged_answers(run, sites_of(run))
    meta = run_meta(run)
    path = rulings_path(run, args.rulings)
    store = load_json(path) if path.exists() else {"rulings": []}
    ids = args.verdicts.split(",")
    # A ruling on a row also rules the duplicates merged into it.
    merges = [m for _, m in load_merges(run, []) or []]
    ids += [m["row"] for m in merges if m["into"] in ids and m["row"] not in ids]
    for vid in ids:
        row = rows.get(vid)
        if row is None:
            die(f"no verdict {vid} in {run / 'verdicts'}")
        c = clusters[row["cluster"]]
        listed = [s["site"] for s in c["sites"]] if row["sites"] == "all" else row["sites"]
        entry = {"rule": c["rule"], "verdict": vid, "verdict_token": row["verdict"], "decision": args.decision,
                 "reason": args.reason, "date": datetime.date.today().isoformat(), "revision": meta["revision"] or meta["digest"]}
        if args.scope:
            entry["scope"] = args.scope
        else:
            entry["paths"] = sorted({all_sites[s]["path"] for s in listed})
        store["rulings"].append(entry)
    write_json(path, store)
    print(f"{len(ids)} rulings written to {path}")


# ---------------------------------------------------------------- main

def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("inventory"); s.add_argument("root"); s.add_argument("--run")
    s.add_argument("--kinds"); s.add_argument("--paths"); s.add_argument("--extra")
    s = sub.add_parser("api"); s.add_argument("run"); s.add_argument("--effect")
    s = sub.add_parser("boundary"); s.add_argument("run"); s.add_argument("--tsgo-json")
    s = sub.add_parser("shard"); s.add_argument("run"); s.add_argument("--answers", type=int, default=400)
    s = sub.add_parser("packet"); s.add_argument("run"); s.add_argument("shard")
    s = sub.add_parser("check"); s.add_argument("run")
    s.add_argument("--stage", choices=("answers", "verdicts", "merges"), default="answers")
    s.add_argument("--part", help="check one answer shard (A01) or one judge group (J01) only")
    s = sub.add_parser("map"); s.add_argument("run"); s.add_argument("--rulings")
    s.add_argument("--clusters-per-judge", type=int, default=12)
    s = sub.add_parser("judge-packet"); s.add_argument("run"); s.add_argument("group")
    s = sub.add_parser("merge-packet"); s.add_argument("run")
    s = sub.add_parser("rule"); s.add_argument("run"); s.add_argument("--rulings")
    s.add_argument("--decision", choices=("accept", "reject", "defer"), required=True)
    s.add_argument("--verdicts", required=True); s.add_argument("--reason", required=True)
    s.add_argument("--scope", help="a path glob; by default the ruling covers the verdict's site paths")
    args = p.parse_args()
    {"inventory": cmd_inventory, "api": cmd_api, "boundary": cmd_boundary, "shard": cmd_shard, "packet": cmd_packet,
     "check": cmd_check, "map": cmd_map, "judge-packet": cmd_judge_packet, "merge-packet": cmd_merge_packet,
     "rule": cmd_rule}[args.cmd](args)


if __name__ == "__main__":
    main()
