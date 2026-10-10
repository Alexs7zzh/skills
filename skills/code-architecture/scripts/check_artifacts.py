#!/usr/bin/env python3
"""Check a code-architecture artifact against its required slots.

usage:
  check_artifacts.py model     MODEL.md    [--lenses LENSES.md]
  check_artifacts.py design    DESIGN.md   --model MODEL.md [--lenses LENSES.md] [--group]
  check_artifacts.py compare   COMPARE.md  --design DESIGN.md [--all]
  check_artifacts.py synthesis SYNTH.md    [--model MODEL.md] [--verified]
  check_artifacts.py verify    VERIFY.md

Prints one line per failure and exits 1 when any failure is found. The slot
names it checks are the ones extract.md, design.md and compare.md require.
Only Python 3 standard library.
"""
import re
import sys
from pathlib import Path

ID = re.compile(r"\b([A-Z]{1,3}[0-9]+[a-z]?)\b")
EVIDENCE = re.compile(r"\[(S|P|M|U)\]")
ENFORCEMENT = ("type", "gate", "check", "convention", "none", "n/a")
LEVELS = ("unrepresentable by type", "refused at one gate", "runtime check")
DISPOSITIONS = ("finding", "conditional finding", "justified tradeoff", "not a finding", "evidence gap")
CONSEQUENCE = ("user-visible", "ruling", "leak", "diagnostic", "none")
VERDICTS = ("passes", "correction", "defect")
STEP_VERDICTS = ("confirmed", "refuted", "unverifiable")
ENCODING_SLOTS = ("Invariant", "Owner", "Member", "Performs", "Refuses", "Replaces", "Removes", "Level", "Premises")
DIVERGENCE_SLOTS = ("Divergence", "Bug class permitted", "Instance", "Consequence", "Disposition", "Confidence and limits")
HANDOFF_SLOTS = ("1. Outcome and cause", "2. Remedy", "3. Patch boundary", "4. Verification", "5. Readiness", "6. Lens")
LEDGER_COLUMNS = ("date", "lens", "run", "finding", "result", "reduced variant", "note")

failures = []


def fail(path, line, msg):
    failures.append(f"{path}:{line}: {msg}")


def read(path):
    return Path(path).read_text(encoding="utf-8").splitlines()


def sections(lines, level="## "):
    """Yield (title, start_line_index, body_lines) for each heading at the level."""
    out = []
    cur = None
    for i, line in enumerate(lines):
        if line.startswith(level) and not line.startswith(level + "#"):
            if cur:
                out.append(cur)
            cur = [line[len(level):].strip(), i, []]
        elif cur:
            cur[2].append((i, line))
    if cur:
        out.append(cur)
    return [(t, s, b) for t, s, b in out]


def find_section(secs, *keywords):
    for title, start, body in secs:
        low = title.lower()
        if all(k in low for k in keywords):
            return title, start, body
    return None


def table_rows(body):
    """Return (header_cells, [(line_no, cells)]) for the first table in body; header may be None."""
    header = None
    rows = []
    for i, line in body:
        s = line.strip()
        if not s.startswith("|"):
            if rows or header:
                break
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", c) for c in cells if c):
            continue
        if header is None:
            header = cells
        else:
            rows.append((i, cells))
    return header, rows


def split_tables(body):
    """Return [(header_cells, [(line_no, cells)])] for every table in body."""
    tables = []
    header, rows = None, []
    for i, line in body:
        s = line.strip()
        if s.startswith("|"):
            cells = [c.strip() for c in s.strip("|").split("|")]
            if all(re.fullmatch(r":?-{3,}:?", c) for c in cells if c):
                continue
            if header is None:
                header = cells
            else:
                rows.append((i, cells))
        elif header is not None:
            tables.append((header, rows))
            header, rows = None, []
    if header is not None:
        tables.append((header, rows))
    return tables


def all_table_rows(body):
    rows = []
    for i, line in body:
        s = line.strip()
        if s.startswith("|"):
            cells = [c.strip() for c in s.strip("|").split("|")]
            if all(re.fullmatch(r":?-{3,}:?", c) for c in cells if c):
                continue
            rows.append((i, cells))
    return rows


def row_id(cells):
    if not cells:
        return None
    first = cells[0].strip("*` ")
    return first if re.fullmatch(r"[A-Z]{1,3}[0-9]+[a-z]?", first) else None


def lens_slugs(lenses_path):
    if not lenses_path:
        return None
    slugs = set()
    for line in read(lenses_path):
        m = re.match(r"^### ([a-z][a-z-]*):", line)
        if m:
            slugs.add(m.group(1))
    return slugs


def model_ids(model_path):
    ids = set()
    for line in read(model_path):
        s = line.strip()
        if s.startswith("|"):
            cells = [c.strip() for c in s.strip("|").split("|")]
            rid = row_id(cells)
            if rid:
                ids.add(rid)
    return ids


def design_ids(design_path):
    enc, prem = set(), set()
    for line in read(design_path):
        m = re.match(r"^### ([EV][0-9]+)\b", line)
        if m:
            enc.add(m.group(1))
        s = line.strip()
        if s.startswith("|"):
            rid = row_id([c.strip() for c in s.strip("|").split("|")])
            if rid and rid.startswith("P"):
                prem.add(rid)
    return enc, prem


def slugs_in(text, slugs):
    return {t for t in re.findall(r"[a-z][a-z-]+", text) if t in slugs}


# ---------------------------------------------------------------- model

def check_model(path, lenses):
    lines = read(path)
    secs = sections(lines)
    slugs = lens_slugs(lenses)
    ori = find_section(secs, "orientation")
    if not ori:
        fail(path, 1, "missing '## Orientation'")
    else:
        subs = [t.lower() for t, _, _ in sections([l for _, l in ori[2]], "### ")]
        for kw in ("target", "local changes", "boundary", "excluded", "lenses", "ordinary path", "evidence legend", "checks performed"):
            if not any(kw in t for t in subs):
                fail(path, ori[1] + 1, f"orientation lacks a '### ...{kw}...' subsection")
    titles = {
        1: "external contracts", 2: "identities", 3: "states and transitions", 4: "action gates", 5: "lifetimes",
        6: "interrupting events", 7: "failure taxonomy", 8: "concurrent handoffs", 9: "time and constants", 10: "wrappers",
    }
    ids = set()
    for n, kw in titles.items():
        sec = next(((t, s, b) for t, s, b in secs if re.match(rf"^{n}\.\s", t)), None)
        if not sec:
            fail(path, 1, f"missing section '## {n}. ...' ({kw})")
            continue
        title, start, body = sec
        if kw.split()[0] not in title.lower():
            fail(path, start + 1, f"section {n} is titled '{title}', expected '{kw}'")
        if n == 4:
            # matrix shape; enforcer named per cell. Rows may still carry ids that K rows cite.
            for header, rows in split_tables(body):
                for i, cells in rows:
                    rid = row_id(cells)
                    if rid:
                        ids.add(rid)
            continue
        tables = split_tables(body)
        if not tables:
            text = " ".join(l for _, l in body).strip()
            if not text:
                fail(path, start + 1, f"section {n} is empty: one line stating what was inspected, or rows")
            continue
        if not any(any("enforce" in c.lower() for c in hdr) for hdr, _ in tables):
            fail(path, start + 1, f"section {n} has no table with an Enforcement column")
        for header, rows in tables:
            low = [c.lower() for c in header]
            enf_idx = next((k for k, c in enumerate(low) if "enforce" in c), None)
            if enf_idx is None:
                continue  # a supporting table; rows need no ids
            if not any("source" in c for c in low):
                fail(path, rows[0][0] if rows else start + 1, f"section {n} table has no Sources column")
            for i, cells in rows:
                rid = row_id(cells)
                if not rid:
                    fail(path, i + 1, "row has no id in its first cell (letters then number, e.g. S3)")
                    continue
                if rid in ids:
                    fail(path, i + 1, f"duplicate row id {rid}")
                ids.add(rid)
                if not EVIDENCE.search(" ".join(cells)):
                    fail(path, i + 1, f"{rid}: no evidence tag [S], [P], [M] or [U]")
                if enf_idx < len(cells):
                    enf = cells[enf_idx].lower().strip("*` ")
                    if not enf.startswith(ENFORCEMENT):
                        fail(path, i + 1, f"{rid}: Enforcement must start with one of {ENFORCEMENT}")
    for title, start, body in secs:
        if title.lower().startswith("orientation") or re.match(r"^11\.", title):
            for header, rows in split_tables(body):
                for i, cells in rows:
                    rid = row_id(cells)
                    if rid:
                        ids.add(rid)
    full = "\n".join(lines).lower()
    if not any(i.startswith("PR") for i in ids) and "pr: none, because" not in full:
        fail(path, 1, "no PR rows: section 1 needs one row per provider routine the subsystem calls directly, or the line 'PR: none, because <inspected>'")
    couple = find_section(secs, "collapses")
    if not couple:
        fail(path, 1, "missing '## Collapses and overlaps'")
    else:
        rows = all_table_rows(couple[2])
        k_rows = [(i, c) for i, c in rows if row_id(c) and row_id(c).startswith("K")]
        ctext = " ".join(l for _, l in couple[2]).lower()
        if not k_rows and "none, because" not in ctext:
            fail(path, couple[1] + 1, "collapses section has no K rows and no 'none, because <reason>' line")
        for i, cells in k_rows:
            rid = row_id(cells)
            text = " ".join(cells[1:])
            cited = {x for x in ID.findall(text) if x != rid and not re.fullmatch(r"K[0-9]+", x)}
            missing = {x for x in cited if x not in ids}
            if not cited:
                fail(path, i + 1, f"{rid}: cites no model rows")
            elif missing:
                fail(path, i + 1, f"{rid}: cites rows not in the model: {sorted(missing)}")
            if slugs is not None and not slugs_in(text, slugs):
                fail(path, i + 1, f"{rid}: names no lens slug")
            # a PR row cited by a state or gate row shows provider writes were considered
    if not any(i.startswith("K") for i in {row_id(c) for _, c in all_table_rows(couple[2])} if i) if couple else False:
        pass
    return ids


# ---------------------------------------------------------------- design

def check_design(path, model, lenses, group=False):
    lines = read(path)
    secs = sections(lines)
    slugs = lens_slugs(lenses)
    mids = model_ids(model) if model else None
    inv = find_section(secs, "invariant")
    inv_ids = set()
    if not inv:
        fail(path, 1, "missing '## Invariants'")
    else:
        for i, cells in all_table_rows(inv[2]):
            rid = row_id(cells)
            if not rid:
                continue
            if not rid.startswith("I"):
                fail(path, i + 1, f"invariant row id {rid} should be I<n>")
            inv_ids.add(rid)
            text = " ".join(cells[1:])
            cited = {x for x in ID.findall(text) if not re.fullmatch(r"[IEP][0-9]+", x)}
            if not cited:
                fail(path, i + 1, f"{rid}: cites no model rows")
            elif mids is not None:
                missing = {x for x in cited if x not in mids}
                if missing:
                    fail(path, i + 1, f"{rid}: cites rows not in the model: {sorted(missing)}")
            if slugs is not None and not slugs_in(text, slugs):
                fail(path, i + 1, f"{rid}: names no lens slug")
    enc = find_section(secs, "encoding")
    cited_premises = set()
    if not enc:
        fail(path, 1, "missing '## Encoding'")
    else:
        body_lines = [l for _, l in enc[2]]
        offset = enc[1] + 1
        encs = sections(body_lines, "### ")
        if not encs and "none, because" not in "\n".join(body_lines).lower():
            fail(path, enc[1] + 1, "no '### E<n>' encodings and no 'none, because <reason>' line")
        for title, start, body in encs:
            m = re.match(r"^([EV][0-9]+)\b", title)
            eid = m.group(1) if m else title
            if not m:
                fail(path, offset + start + 1, f"encoding heading '{title}' should start with E<n>")
            text = "\n".join(l for _, l in body)
            for slot in ENCODING_SLOTS:
                if not re.search(rf"^\s*(?:[-*]\s*)?\*\*{re.escape(slot)}[.:]?\*\*", text, re.M):
                    fail(path, offset + start + 1, f"{eid}: missing slot **{slot}:**")
            lev = re.search(r"\*\*Level[.:]?\*\*(.*)", text)
            if lev and not any(l in lev.group(1).lower() for l in LEVELS):
                fail(path, offset + start + 1, f"{eid}: Level must name one of {LEVELS}")
            if lev and "runtime check" in lev.group(1).lower() and len(lev.group(1).split()) < 8:
                fail(path, offset + start + 1, f"{eid}: a runtime check needs the reason the stronger level is unavailable")
            prem = re.search(r"\*\*Premises[.:]?\*\*(.*)", text)
            if prem:
                found = set(re.findall(r"\bP[0-9]+\b", prem.group(1)))
                if not found and "none" not in prem.group(1).lower():
                    fail(path, offset + start + 1, f"{eid}: Premises must list P<n> ids or 'none'")
                cited_premises |= found
            invs = re.search(r"\*\*Invariant[.:]?\*\*(.*)", text)
            if invs:
                for x in re.findall(r"\bI[0-9]+\b", invs.group(1)):
                    if inv_ids and x not in inv_ids:
                        fail(path, offset + start + 1, f"{eid}: invariant {x} is not in the Invariants table")
    prem_sec = find_section(secs, "premise")
    defined = set()
    if not prem_sec:
        fail(path, 1, "missing '## Premises and runtime checks'")
    else:
        for i, cells in all_table_rows(prem_sec[2]):
            rid = row_id(cells)
            if rid and rid.startswith("P"):
                defined.add(rid)
        for p in sorted(cited_premises - defined):
            fail(path, prem_sec[1] + 1, f"premise {p} is cited by an encoding but not defined")
    if group:
        return
    if mids is not None:
        k_ids = {x for x in mids if x.startswith("K")}
        text = "\n".join(lines)
        for k in sorted(k_ids):
            if not re.search(rf"\b{k}\b", text):
                fail(path, 1, f"model collapse row {k} is neither encoded nor listed as not encoded")
    for name, title in (("structure", "Structure"), ("constraints honored", "Constraints honored"), ("conflicts resolved", "Conflicts resolved"), ("lenses used", "Lenses used")):
        if not find_section(secs, name):
            fail(path, 1, f"missing '## {title}'")


# ---------------------------------------------------------------- compare

def check_compare(path, design, all_required):
    lines = read(path)
    secs = sections(lines)
    enc_ids, _ = design_ids(design) if design else (set(), set())
    dc = find_section(secs, "design check")
    seen = set()
    if not dc:
        fail(path, 1, "missing '## Design check'")
    else:
        for i, cells in all_table_rows(dc[2]):
            rid = row_id(cells)
            if not rid:
                continue
            seen.add(rid)
            if enc_ids and rid not in enc_ids:
                fail(path, i + 1, f"design check names {rid}, not an encoding in the design")
            joined = " ".join(cells[1:]).lower()
            if not any(v in joined for v in VERDICTS):
                fail(path, i + 1, f"{rid}: verdict must be passes, correction or defect")
            if len(cells) < 3 or not cells[2].strip():
                fail(path, i + 1, f"{rid}: name what the encoding was tested against (model rows or provider reference)")
        if enc_ids and all_required:
            for e in sorted(enc_ids - seen):
                fail(path, dc[1] + 1, f"encoding {e} has no design-check line")
    div = find_section(secs, "divergence")
    if not div:
        fail(path, 1, "missing '## Divergences'")
    else:
        body_lines = [l for _, l in div[2]]
        offset = div[1] + 1
        entries = sections(body_lines, "### ")
        if not entries:
            fail(path, div[1] + 1, "no '### <encoding or invariant>' entries under Divergences")
        for title, start, body in entries:
            text = "\n".join(l for _, l in body)
            head = (title + " " + text[:300]).lower()
            if "matches" in head or "not checkable" in head:
                if "not checkable" in head and "fact" not in head and "missing" not in head and "unread" not in head:
                    fail(path, offset + start + 1, f"'{title}': not checkable must name the missing fact")
                continue
            for slot in DIVERGENCE_SLOTS:
                if not re.search(rf"^\s*(?:[-*]\s*)?\*\*{re.escape(slot)}[.:]?\*\*", text, re.M):
                    fail(path, offset + start + 1, f"'{title}': missing slot **{slot}:**")
            cons = re.search(r"\*\*Consequence[.:]?\*\*(.*)", text)
            if cons and not any(cons.group(1).lower().lstrip(" *").startswith(c) for c in CONSEQUENCE):
                fail(path, offset + start + 1, f"'{title}': Consequence must start with one of {CONSEQUENCE}")
            disp = re.search(r"\*\*Disposition[.:]?\*\*(.*)", text)
            if disp and not any(d in disp.group(1).lower() for d in DISPOSITIONS):
                fail(path, offset + start + 1, f"'{title}': Disposition must be one of {DISPOSITIONS}")


# ---------------------------------------------------------------- synthesis

def check_synthesis(path, design, verified, model=None):
    lines = read(path)
    secs = sections(lines)
    cov = find_section(secs, "request coverage")
    if not cov:
        fail(path, 1, "missing '## Request coverage'")
    elif model:
        o_ids = {x for x in model_ids(model) if re.fullmatch(r"O[0-9]+[a-z]?", x)}
        text = "\n".join(l for _, l in cov[2])
        for o in sorted(o_ids):
            if not re.search(rf"\b{o}\b", text):
                fail(path, cov[1] + 1, f"Request coverage has no row for {o}")
    summ = find_section(secs, "summary")
    if not summ:
        fail(path, 1, "missing '## Summary'")
    else:
        words = sum(len(l.split()) for _, l in summ[2])
        if words > 500:
            fail(path, summ[1] + 1, f"Summary is {words} words; the limit is 500")
    hand = find_section(secs, "handoff")
    if not hand:
        fail(path, 1, "missing '## Handoffs'")
    else:
        body_lines = [l for _, l in hand[2]]
        offset = hand[1] + 1
        hs = sections(body_lines, "### ")
        if not hs and not "\n".join(body_lines).strip().lower().startswith("none, because"):
            fail(path, hand[1] + 1, "no '### H<n>.' handoffs and no 'None, because <reason>' line")
        for title, start, body in hs:
            if not re.match(r"^H[0-9]+\b", title):
                fail(path, offset + start + 1, f"handoff heading '{title}' should start with H<n>")
            text = "\n".join(l for _, l in body)
            words = len(text.split())
            if words > 600:
                fail(path, offset + start + 1, f"'{title}' is {words} words; a handoff is at most 600")
            for slot in HANDOFF_SLOTS:
                num, name = slot.split(". ", 1)
                if not re.search(rf"(?m)^\s*(?:\*\*)?{num}\.\s*\**\s*{re.escape(name)}", text):
                    fail(path, offset + start + 1, f"'{title}': missing slot **{slot}.**")
            if verified and not re.search(r"\*\*Verified[.:]?\*\*", text):
                fail(path, offset + start + 1, f"'{title}': missing **Verified:** line after the verify stage")
    for name, title in (("decisions", "Decisions"), ("defaults taken", "Defaults taken"), ("lower rows", "Lower rows"), ("request coverage", "Request coverage"), ("ledger", "Ledger")):
        if not find_section(secs, name):
            fail(path, 1, f"missing '## {title}'")
    led = find_section(secs, "ledger")
    if led:
        header, rows = table_rows(led[2])
        if not header:
            fail(path, led[1] + 1, "Ledger has no table")
        else:
            low = [c.lower() for c in header]
            for col in LEDGER_COLUMNS:
                if not any(col in c for c in low):
                    fail(path, led[1] + 1, f"Ledger table lacks column '{col}'")
    low = find_section(secs, "lower rows")
    if low:
        header, rows = table_rows(low[2])
        text = " ".join(l for _, l in low[2]).strip().lower()
        if header is None and not text.startswith("none, because"):
            fail(path, low[1] + 1, "Lower rows is a table (disposition, lens, promoting fact per row) or 'None, because <reason>'")
    for name in ("decisions", "defaults taken"):
        sec = find_section(secs, name)
        if sec:
            text = " ".join(l for _, l in sec[2]).strip()
            if not text:
                fail(path, sec[1] + 1, f"'{name}' is empty: list entries or write 'None, because <reason>'")


# ---------------------------------------------------------------- verify

def check_verify(path):
    lines = read(path)
    secs = sections(lines)
    steps = find_section(secs, "steps")
    if not steps:
        fail(path, 1, "missing '## Steps'")
    else:
        header, rows = table_rows(steps[2])
        if not rows:
            fail(path, steps[1] + 1, "Steps table has no rows")
        for i, cells in rows:
            joined = " ".join(cells).lower()
            if not any(v in joined for v in STEP_VERDICTS):
                fail(path, i + 1, "step row needs Confirmed, Refuted or Unverifiable")
            if not any(part in joined for part in ("outcome", "remedy", "verification")):
                fail(path, i + 1, "step row names its part: Outcome, Remedy or Verification")
            if "confirmed" in joined and not re.search(r"[a-z][\w./-]*:\d+", joined):
                fail(path, i + 1, "a Confirmed step cites file:line or alias:line")
    verdict = find_section(secs, "verdict")
    if not verdict:
        fail(path, 1, "missing '## Verdict'")
    else:
        text = "\n".join(l for _, l in verdict[2])
        for part in ("Outcome", "Remedy", "Verification"):
            m = re.search(rf"(?im)^\s*(?:[-*]\s*)?\**{part}\**\s*:\**\s*(\w+)", text)
            if not m:
                fail(path, verdict[1] + 1, f"Verdict needs a '{part}:' line")
            elif m.group(1).lower() not in STEP_VERDICTS:
                fail(path, verdict[1] + 1, f"Verdict {part} must be Confirmed, Refuted or Unverifiable")


# ---------------------------------------------------------------- main

def main(argv):
    if len(argv) < 2 or argv[0] not in ("model", "design", "compare", "synthesis", "verify"):
        print(__doc__)
        return 2
    kind, path = argv[0], argv[1]
    opts = {}
    flags = set()
    it = iter(argv[2:])
    for a in it:
        if a in ("--focused", "--verified", "--group", "--all"):
            flags.add(a)
        elif a.startswith("--"):
            opts[a] = next(it, None)
    if kind == "model":
        check_model(path, opts.get("--lenses"))
    elif kind == "design":
        if "--model" not in opts:
            print("design needs --model MODEL.md")
            return 2
        check_design(path, opts["--model"], opts.get("--lenses"), "--group" in flags)
    elif kind == "compare":
        check_compare(path, opts.get("--design"), "--all" in flags)
    elif kind == "synthesis":
        check_synthesis(path, opts.get("--design"), "--verified" in flags, opts.get("--model"))
    elif kind == "verify":
        check_verify(path)
    for f in failures:
        print(f)
    if failures:
        print(f"{len(failures)} failure(s) in {path}")
        return 1
    print(f"ok: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
