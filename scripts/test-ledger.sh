#!/bin/bash
# Exercise ledger.sh against its schema: every abort path, roles, coverage, handoff/sign/converge, the two-writer race.
set -u
L=$(cd "$(dirname "$0")/.." && pwd)/skills/coding/ledger.sh
T=$(mktemp -d /tmp/ledger-test.XXXXXX); export LEDGER_DIR=$T
unset LEDGER_PEER LEDGER_MASTER
pass=0; fail=0
ok()  { local out; out=$("$@" 2>&1); if [ $? -eq 0 ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL (expected ok): $* -> $out"; fi; }
bad() { local want=$1 out; shift; out=$("$@" 2>&1); if [ $? -ne 0 ] && printf '%s' "$out" | grep -q -- "$want"; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL (expected abort '$want'): $* -> $out"; fi; }
has() { local want=$1 out; shift; out=$("$@" 2>&1); if printf '%s' "$out" | grep -q -- "$want"; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL (expected output '$want'): $* -> $out"; fi; }
not() { local want=$1 out; shift; out=$("$@" 2>&1); if printf '%s' "$out" | grep -q -- "$want"; then fail=$((fail+1)); echo "FAIL (unexpected output '$want'): $* -> $out"; else pass=$((pass+1)); fi; }
A() { LEDGER_ME=A "$L" "$@"; }
B() { LEDGER_ME=B "$L" "$@"; }
M() { LEDGER_ME=master "$L" "$@"; }
RAW() { sqlite3 "$T/ledger.db" "$1"; }

# init: roles, joint path, route, partition are ledger facts
bad "LEDGER_ME must be" env -u LEDGER_ME "$L" init --cold
bad "needs --scribe" M init --joint "$T/joint.md" --route diagnose
bad "needs --joint" M init --scribe A --route diagnose
bad "needs --route" M init --scribe A --joint "$T/joint.md"
has "pinned helper: $T/bin/ledger.sh" M init --scribe A --joint "$T/joint.md" --route diagnose --clusters "MES-V0 MES-V5 MES-W7 MES-WC"
[ -x "$T/bin/ledger.sh" ] && cmp -s "$T/bin/ledger.sh" "$L" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: helper not pinned under $T/bin"; }
bad "exists" M init --scribe A --joint "$T/joint.md" --route diagnose
has "rows: 0 total" M status
has "scribe: A" M status
has "uncovered clusters: MES-V0 MES-V5 MES-W7 MES-WC" M status
ok A init --cold
ok B init --cold
bad "no ledger at" env LEDGER_DIR=/nonexistent LEDGER_ME=master "$L" status

# cold pass, seat A
ok A add label=Bug step=2 cluster="MES-V0, MES-V5(5/6)" site=Foo.cpp:12 claim="GC scan walks every entry"
bad "label= is required" A add step=2 claim=x
bad "not settable" A add label=Nit step=2 claim=x agree_a=1
bad "must be an integer" A add label=Nit step=two claim=x
bad "label_known" A add label=Typo step=2 claim=x
ok A set 1 step=3
bad "cannot agree a row you last edited" A agree 1
printf "It's a claim with 'quotes'\nand two lines; and a ; semicolon\n" > "$T/claim.txt"
ok A add label=Nit step=2 cluster=MES-WC claim=@"$T/claim.txt"
has "quotes" A query "SELECT claim FROM ledger WHERE id=2"
has "phase: cold (2 rows" A status
has "partition to disposition" A status
bad "no file" A add label=Nit step=2 claim=@"$T/missing.txt"
bad "cross-examination verdict" A dup 2 1
has "next: keep adding rows" A add label=Nit step=2 claim="cold hint check"
ok A reject 3 verdict_step=2 verdict="own withdrawal in cold"

# cold pass, seat B
ok B add label=Bug step=4 cluster=MES-V0 site=Bar.cpp:7 claim="health check returns literal true" evidence_path=probes/3.log status=verified
bad "verified_needs_step4_and_evidence" B add label=Bug step=3 claim=x status=verified
bad "contested_needs_probe" B add label=Nit step=2 claim=x status=contested
ok B add label=Hardening step=2 cluster=MES-W7 claim="two-cycle test row"
ok B add label=Bug step=2 claim="reject-at-step4 test row"
bad "handoff is for the shared ledger" B handoff

# import: tells the peer, names the next step
has "report ready: seat A imported 3 rows" A import
bad "already imported" A import
has "seat A (scribe)" A status
has "imports: A=3 rows" A status
has "your peer's rows are already in" B import
has "seat B (countersigner)" B status
has "A=3 rows, B=3 rows" M status
has "A-1" A query "SELECT cold_id FROM ledger WHERE id=1"
[ ! -w "$T/cold-A.db" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: cold-A.db still writable"; }
# ids: 1 A Bug (MES-V0,MES-V5), 2 A Nit (MES-WC), 3 A withdrawn, 4 B Bug verified (MES-V0), 5 B Hardening (MES-W7), 6 B Bug
has "uncovered clusters: none" M status

# cross-examination: Bug needs trigger, impact, and slots before it can converge
bad "bug_converges_only_with_trigger_impact_cost_and_slots" B agree 1
bad "test_seam_starts_with_exists_new_or_none" A set 1 test_seam="TaskScan spec"
ok A set 1 trigger="every GC on a loaded server" impact="15 s hang" origin_class=attention-miss fix_shape="compile the check out" sites_walked="AsyncLoading2.cpp:2761" rulings_checked="none recorded" test_seam="exists: AsyncLoading2.cpp:13544 WITH_DEV_AUTOMATION_TESTS block"
bad "bug_converges_only_with_trigger_impact_cost_and_slots" B agree 1
ok A set 1 cost="one guarded early-out in NotifyUnreachableObjects; no interface change"
has "unconverged:" B agree 1
bad "cannot agree a row you last edited" A agree 1
ok B set 1 claim="GC scan walks every entry per pass"
has "0" B query "SELECT agree_b FROM ledger WHERE id=1"
bad "cannot agree a row you last edited" B agree 1
ok A agree 1

# bypass attempts
bad "content edits go through ledger.sh set" RAW "UPDATE ledger SET claim='x' WHERE id=2"
bad "never deleted" RAW "DELETE FROM ledger WHERE id=2"
bad "owner never changes" RAW "UPDATE ledger SET owner='B', rev=rev+1, agree_a=0, agree_b=0 WHERE id=2"
bad "a new row is owned" RAW "INSERT INTO ledger (owner,last_editor,label,claim,step,agree_b) VALUES ('A','A','Nit','x',2,1)"
bad "cannot agree" RAW "UPDATE ledger SET agree_b=1, rev=rev+1 WHERE id=2"

# two cycles then probe (row 2: owner A); a contested row still needs the other's mark
ok B set 2 claim=c1
ok A set 2 claim=c2
ok B set 2 claim=c3
ok A set 2 claim=c4
bad "two cycles spent" B set 2 claim=c5
bad "two cycles spent" B reject 2 verdict_step=2 verdict="still no"
ok B contest 2 probe="run the sweep with 10k entries"
has "contested" A query "SELECT status FROM ledger WHERE id=2"
has "#2 \\[Nit\\] contested" A status
ok A agree 2
not "#2 \\[Nit\\] contested" A status
# a step-4 rejection is allowed as the third edit (row 5: owner B)
ok A set 5 claim=d1
ok B set 5 claim=d2
ok A set 5 claim=d3
ok B set 5 claim=d4
ok A reject 5 verdict_step=4 verdict="probe log shows it cannot fire"
bad "withdrawn_needs_verdict_and_step" A reject 6 verdict_step=2 verdict=
bad "usage: reject" A reject 6
ok A reject 6 verdict_step=2 verdict="the build catches it"
ok B agree 6
ok B agree 5
ok B agree 3

# dup and probes
ok A add label=Nit step=2 claim="restates row 4"
ok B dup 7 4
ok A agree 7
has "yours" A claim-probe 2
has "taken by A" B claim-probe 2
bad "dup_needs_target" RAW "UPDATE ledger SET status='dup', dup_of=NULL, rev=rev+1, agree_a=0, agree_b=0 WHERE id=7"

# show
has "claim: GC scan walks every entry per pass" A show 1
has "events:" A show 1
bad "no row" A show 999

# handoff, sign, converge: refusals first
bad "scribe does not sign" A sign
bad "sign at 0" B sign
bad "converge at 0" A converge
# a raw signature while rows are unconverged is refused by the schema itself
bad "sign refused" RAW "INSERT INTO signatures (seat, ts) VALUES ('B', 'now')"
has "ledger: 1 rows await your mark" B handoff
has "send it yourself" B handoff
has "awaiting your mark (A)" A status
bad "bug_converges_only_with_trigger_impact_cost_and_slots" A agree 4
ok B set 4 trigger="every health poll" impact="dead server passes" origin_class=self-consistency fix_shape="return the probed value" sites_walked="Bar.cpp:7" rulings_checked="none" test_seam="none: no seam reaches the GameLift callback" cost="one lambda body; no interface change"
has "next: unconverged 0. Compose" A agree 4
has "unconverged: 0" M status
bad "no countersignature" A converge
bad "Composition rows present from seats: none" B sign
# compositions: one per seat, cross-marked like any row
bad "composition_names_the_rows_it_composes" A add label=Composition step=2 claim="rows 1 and 4 together"
ok A add label=Composition step=2 cluster="1,4" claim="rows 1 and 4 together mean the health poll masks the GC stall" decision="fix 1 before 4"
ok B add label=Composition step=2 cluster="1,4" claim="same set, same order" decision="fix 1 before 4"
ok B agree 8
ok A agree 9
# fix review: recorded by the non-editor at the current revision; an edit needs a new review
bad "unreviewed proposals: #1 #4" B sign
has "unreviewed proposals: #1 #4" M status
bad "review is recorded by the seat that did not last edit" B review 1
has "fix review recorded by A" A review 1 note="walked the guard and the non-empty path"
bad "unreviewed proposals: #4" B sign
has "fix review recorded by A" A review 4
has "ready for a fixer (converged and fix-reviewed): #1 #4" M status
has "| #1 | Bug | finding | yes |" M render
bad "only the scribe converges" B converge
has "signed: $T/joint.md by seat B" B sign note="no blockers in #1 and #4"
has "signature: signed by B" M status
has "next: unconverged 0 and signed: ledger.sh converge" A status
# an edit after signing voids the signature and the row's review
ok A set 4 fix_shape="return the probed value; condition: keep the poll interval"
has "signature: none" M status
has "unreviewed proposals: #4" M status
bad "converge at 0" A converge
ok B agree 4
bad "unreviewed proposals: #4" B sign
ok B review 4
printf "passes: 1 sweep\n" > "$T/A-notes.md"; printf "passes: 2 sweeps\n" > "$T/B-notes.md"
ok B sign note="conditions folded in"
# notes changed after signing: converge refuses until re-signed
printf "passes: 1 sweep, amended\n" > "$T/A-notes.md"
bad "seat notes changed since signing" A converge
RAW "DELETE FROM signatures"
ok B sign note="re-signed over the amended notes"
has "converged: $T/joint.md" A converge
has "## Composition" cat "$T/joint.md"
has "#8 composes 1,4" cat "$T/joint.md"
has "| MES-V5 | #1 fixed\|| MES-V5 | #1" cat "$T/joint.md"
has "# Joint report: diagnose" cat "$T/joint.md"
has "## Coverage" cat "$T/joint.md"
has "| MES-W7 | #5 withdrawn |" cat "$T/joint.md"
has "## Seat A notes" cat "$T/joint.md"
has "## Seat B notes" cat "$T/joint.md"
has "Countersignature by B" cat "$T/joint.md"
has "#7 dup of #4" cat "$T/joint.md"
has "Probe: run the sweep" cat "$T/joint.md"
has "sign" M log
has "converge" M log
has "import" M log
bad "readonly" M query "UPDATE ledger SET claim='z' WHERE id=1"
has "## Fix table" M render --route review
has "## Fix table" M render --route diagnose
# closing a row as fixed needs its changeset, and the other seat's mark like any edit
bad "fixed_needs_changeset" A set 1 status=fixed
has "unconverged: 1" A set 1 status=fixed changeset="pending: guarded early-out"
ok B agree 1
has "#1 \\[Bug\\] Foo.cpp:12" M render
has "## Fixed" M render
has "(pending: guarded early-out)" M render

# dups: no cycles, no chains
ok A add label=Nit step=2 claim="dup chain a"
ok A add label=Nit step=2 claim="dup chain b"
ok B dup 10 11
bad "a dup points at one live row" A dup 11 10
ok B add label=Nit step=2 claim="dup chain c"
bad "a dup points at one live row" A dup 12 10
ok A dup 12 11
# accepted: nits and hardening only, with a reason
ok B add label=Nit step=2 claim="style nit"
bad "accepted_is_for_nits_and_hardening_with_a_reason" A set 13 status=accepted
ok A set 13 status=accepted decision="matches the file's existing style"
bad "accepted_is_for_nits_and_hardening_with_a_reason" B set 1 status=accepted decision=x
ok A agree 10
ok B agree 11
ok B agree 12
ok B agree 13
# coverage is token-based: a decoy cluster is not covered by a longer name, an annotated token is
S2=$(mktemp -d /tmp/ledger-cov.XXXXXX)
( export LEDGER_DIR=$S2; LEDGER_ME=A "$L" init --single --route review --clusters "foo foobar MES-VT" >/dev/null && LEDGER_ME=A "$L" add label=Nit step=2 cluster="foobar, MES-VT(5/6)" claim=x >/dev/null && LEDGER_ME=A "$L" status ) | grep -q "uncovered clusters: foo$" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: token coverage"; }
rm -rf "$S2"

# two-writer race: 150 adds per seat into the shared ledger, concurrently; then concurrent marks
before=$(M query "SELECT count(*) FROM ledger" | tail -1)
( for i in $(seq 1 150); do A add label=Nit step=2 claim="race A $i" >/dev/null || echo "A add $i failed"; done ) &
( for i in $(seq 1 150); do B add label=Nit step=2 claim="race B $i" >/dev/null || echo "B add $i failed"; done ) &
wait
after=$(M query "SELECT count(*) FROM ledger" | tail -1)
if [ $((after - before)) -eq 300 ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: race landed $((after - before)) of 300"; fi
( for id in $(M query "SELECT id FROM ledger WHERE owner='B' AND claim LIKE 'race%'" | tail -n +3); do A agree "$id" >/dev/null || echo "A agree $id failed"; done ) &
( for id in $(M query "SELECT id FROM ledger WHERE owner='A' AND claim LIKE 'race%'" | tail -n +3); do B agree "$id" >/dev/null || echo "B agree $id failed"; done ) &
wait
has "unconverged: 0" M status
has "signature: none" M status

# single seat: a plain run writes the same rows; report refuses until slots and coverage are in
S=$(mktemp -d /tmp/ledger-single.XXXXXX)
SA() { LEDGER_DIR=$S LEDGER_ME=A "$L" "$@"; }
bad "needs --route" SA init --single
bad "LEDGER_ME must be" env -u LEDGER_ME LEDGER_DIR=$S "$L" init --single --route diagnose
ok SA init --single --route diagnose --clusters "C1 C2"
has "single seat A" SA status
ok SA add label=Bug step=3 cluster=C1 site=X.cpp:1 claim="single bug"
bad "#1: missing trigger, impact, origin_class, fix_shape, sites_walked, rulings_checked, test_seam, cost" SA report
bad "uncovered clusters: C2" SA report
bad "single-seat ledger" SA handoff
bad "single-seat ledger" SA import
bad "single-seat ledger" SA sign
ok SA set 1 trigger=t impact=i origin_class=attention-miss fix_shape=f sites_walked=s rulings_checked=r test_seam="none: no seam" cost=c
ok SA add label=Nit step=2 cluster=C2 claim="covers C2"
has "next: ledger.sh report" SA status
has "rendered $S/report.md" SA report
has "Single seat, no countersignature" cat "$S/report.md"
not "unconverged" cat "$S/report.md"
has "| C2 | #2 finding |" cat "$S/report.md"
not "## Convergence" cat "$S/report.md"
bad "report is for a single-seat ledger" A report
rm -rf "$S"

echo "ledger tests: $pass passed, $fail failed (dir $T)"
[ $fail -eq 0 ] && rm -rf "$T"
[ $fail -eq 0 ]
