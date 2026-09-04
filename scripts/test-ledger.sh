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
[ -x "$T/bin/ledger.sh" ] && cmp -s "$T/bin/ledger.sh" "$L" && cmp -s "$T/bin/ledger.sql" "${L%/*}/ledger.sql" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: helper or schema not pinned under $T/bin"; }
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
bad "Composition starts after every factual row converges" A add label=Composition step=2 cluster=none claim="premature composition" decision="no change"
has "ledger: 1 rows await your mark" B handoff
has "send it yourself" B handoff
has "awaiting your mark (A)" A status
bad "bug_converges_only_with_trigger_impact_cost_and_slots" A agree 4
ok B set 4 trigger="every health poll" impact="dead server passes" origin_class=self-consistency fix_shape="return the probed value" sites_walked="Bar.cpp:7" rulings_checked="none" test_seam="none: no seam reaches the GameLift callback" cost="one lambda body; no interface change"
has "next: factual rows converged" A agree 4
has "unconverged: 0" M status
has "fix-review the converged proposals now" B status
bad "no countersignature" A converge
bad "Composition rows present from seats: none" B sign
# compositions: one current row per seat, submitted blind and then cross-marked
bad "composition_names_rows_and_a_decision" A add label=Composition step=2 claim="rows 1 and 4 together"
bad "composition_names_rows_and_a_decision" A add label=Composition step=2 cluster="1,4" claim="rows 1 and 4 together"
bad "a Composition cluster is" A add label=Composition step=2 cluster="1,999" claim="bad reference" decision="no change"
ok A add label=Composition step=2 cluster="1,4" claim="rows 1 and 4 together mean the health poll masks the GC stall" decision="fix 1 before 4"
has "before reading the existing composition" A handoff
has "peer Composition rows are withheld" B status
not "health poll masks" B status
bad "peer Composition rows are withheld" B show 8
bad "query is disabled" B query "SELECT claim FROM ledger"
bad "log is disabled" B log
ok B add label=Composition step=2 cluster="1,4" claim="same set, same order" decision="fix 1 before 4"
ok B agree 8
ok A agree 9
# fix review: recorded by the countersigner as soon as a row converges; an edit needs a new review
bad "unreviewed proposals: #1 #4" B sign
has "unreviewed proposals: #1 #4" M status
bad "only the countersigner" A review 1
has "ready: row #1 is converged and fix-reviewed at its current revision. If the user has started the fix round" B review 1 note="walked the guard and the non-empty path"
has "ready for a fixer (converged and fix-reviewed): #1" M status
has "unreviewed proposals: #4" M status
bad "unreviewed proposals: #4" B sign
has "fix review recorded by B" B review 4
has "ready for a fixer (converged and fix-reviewed): #1 #4" M status
has "| #1 | Bug | finding | yes |" M render
bad "only the scribe converges" B converge
# both notes are mandatory; each records passes, retrospective, and vote
bad "A-notes.md is required" B sign note="no blockers in #1 and #4"
printf "passes:\n" > "$T/A-notes.md"; printf "passes: 2 sweeps\n" > "$T/B-notes.md"
bad "non-empty passes:" B sign note="no blockers in #1 and #4"
printf "passes: 1 sweep\nretrospective:\n" > "$T/A-notes.md"; printf "retrospective: found the callback seam\n" >> "$T/B-notes.md"
bad "non-empty retrospective:" B sign note="no blockers in #1 and #4"
printf "retrospective: found the ownership seam\nvote:\n" >> "$T/A-notes.md"; printf "vote: ship the reviewed rows\n" >> "$T/B-notes.md"
bad "non-empty vote:" B sign note="no blockers in #1 and #4"
sed -i.bak 's/^vote:$/vote: ship the reviewed rows/' "$T/A-notes.md"
has "signed: $T/joint.md by seat B" B sign note="no blockers in #1 and #4"
has "signature: signed by B" M status
has "next: unconverged 0 and signed: ledger.sh converge" A status
# an edit after signing voids the signature and the row's review
ok A set 4 fix_shape="return the probed value; condition: keep the poll interval"
has "signature: none" M status
has "unreviewed proposals: #4" M status
bad "converge at 0" A converge
ok B agree 4
bad "Composition rows present from seats: none" B sign
ok B review 4
# the factual edit made both prior compositions stale; refresh each independently, then cross-mark them
has "compositions from: none" M status
bad "Composition rows present from seats: none" B sign
ok A set 8 claim="updated joint effect after row 4 changed"
has "peer Composition rows are withheld" B status
ok B set 9 claim="updated same set and order"
ok B agree 8
ok A agree 9
ok B sign note="conditions folded in"
# moving the same bytes across the A/B boundary changes the signed hash
printf "passes: 1 sweep\nretrospective: found the ownership seam\nvote: ship the reviewed rows\n" > "$T/A-notes.md"; printf "x\npasses: 2 sweeps\nretrospective: found the callback seam\nvote: ship the reviewed rows\n" > "$T/B-notes.md"
bad "seat notes changed since signing" A converge
RAW "DELETE FROM signatures"
ok B sign note="re-signed over the amended notes"
# a note edit while converge is rendering is caught before the report is published
printf '%s\n' '#!/bin/bash' 'case "$*" in *"wal_checkpoint(TRUNCATE)"*) : > "$LEDGER_DIR/converge-paused"; while [ ! -f "$LEDGER_DIR/converge-release" ]; do sleep 0.01; done;; esac' 'exec sqlite3 "$@"' > "$T/sqlite-pause"
chmod +x "$T/sqlite-pause"
env LEDGER_DIR=$T LEDGER_ME=A SQLITE="$T/sqlite-pause" "$L" converge > "$T/converge-race.log" 2>&1 & converge_pid=$!
i=0; while [ ! -f "$T/converge-paused" ] && [ "$i" -lt 500 ]; do sleep 0.01; i=$((i+1)); done
[ -f "$T/converge-paused" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: converge wrapper never paused"; }
printf "changed during render\n" >> "$T/A-notes.md"
: > "$T/converge-release"
wait "$converge_pid"; converge_rc=$?
if [ "$converge_rc" -ne 0 ] && grep -q "notes changed while rendering" "$T/converge-race.log"; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: converge accepted a concurrent notes edit -> $(cat "$T/converge-race.log")"; fi
RAW "DELETE FROM signatures"
ok B sign note="re-signed after the converge race"
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
# converge holds the public writer lock through report replacement, so a helper edit cannot land in its final window
mkdir -p "$T/path-bin"
printf '%s\n' '#!/bin/bash' 'case "$1" in */.joint-report.*) : > "$LEDGER_DIR/mv-paused"; while [ ! -f "$LEDGER_DIR/mv-release" ]; do sleep 0.01; done;; esac' 'exec /bin/mv "$@"' > "$T/path-bin/mv"
chmod +x "$T/path-bin/mv"
env LEDGER_DIR=$T LEDGER_ME=A PATH="$T/path-bin:$PATH" "$L" converge > "$T/converge-lock.log" 2>&1 & converge_pid=$!
i=0; while [ ! -f "$T/mv-paused" ] && [ "$i" -lt 500 ]; do sleep 0.01; i=$((i+1)); done
[ -f "$T/mv-paused" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: converge never reached its report replacement window"; }
B set 8 claim="lock-serialized composition edit" > "$T/set-lock.log" 2>&1 & set_pid=$!
sleep 0.1
if kill -0 "$set_pid" 2>/dev/null; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: public edit did not wait for converge's writer lock -> $(cat "$T/set-lock.log")"; fi
: > "$T/mv-release"
wait "$converge_pid"; converge_rc=$?
wait "$set_pid"; set_rc=$?
if [ "$converge_rc" -eq 0 ] && grep -q "converged: $T/joint.md" "$T/converge-lock.log"; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: locked converge failed -> $(cat "$T/converge-lock.log")"; fi
if [ "$set_rc" -eq 0 ] && grep -q "row 8: set by B" "$T/set-lock.log"; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: waiting edit did not land after converge -> $(cat "$T/set-lock.log")"; fi
has "signature: none" M status
ok A agree 8
ok B sign note="re-signed after public writer serialization"
# the line bound is a gate and a failed render does not replace the existing report
cp "$T/joint.md" "$T/joint-before-bound.md"
i=0; while [ "$i" -lt 310 ]; do printf "detail %s\n" "$i" >> "$T/A-notes.md"; i=$((i+1)); done
RAW "DELETE FROM signatures"
ok B sign note="oversized report probe"
bad "over the 300-line bound" A converge
cmp -s "$T/joint.md" "$T/joint-before-bound.md" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: oversized converge replaced the joint report"; }
# closing a row as fixed needs its changeset, and the other seat's mark like any edit; closing never counts as a cycle
cyc=$(B add label=Bug step=2 claim="cycle-then-fix row" | sed -n 's/^added row \([0-9]*\).*/\1/p')
ok A set "$cyc" claim=e1
ok B set "$cyc" claim=e2
ok A set "$cyc" claim=e3
ok B set "$cyc" claim=e4
bad "two cycles spent" A set "$cyc" claim=e5
ok A set "$cyc" status=fixed changeset="pending: closed by the non-owner after two cycles"
ok B agree "$cyc"
bad "fixed_needs_changeset" A set 1 status=fixed
has "unconverged: 1" A set 1 status=fixed changeset="pending: guarded early-out"
ok B agree 1
has "#1 \\[Bug\\] Foo.cpp:12" M render
has "## Fixed" M render
has "(pending: guarded early-out)" M render

# dups: no cycles, no chains
rowid() { sed -n 's/^added row \([0-9]*\).*/\1/p'; }
da=$(A add label=Nit step=2 claim="dup chain a" | rowid)
db=$(A add label=Nit step=2 claim="dup chain b" | rowid)
ok B dup "$da" "$db"
bad "a dup points at one live row" A dup "$db" "$da"
dc=$(B add label=Nit step=2 claim="dup chain c" | rowid)
bad "a dup points at one live row" A dup "$dc" "$da"
ok A dup "$dc" "$db"
# accepted: Nit only, with a reason; it remains legal after two edit cycles
sn=$(B add label=Nit step=2 claim="style nit" | rowid)
bad "accepted_is_for_nits_with_a_reason" A set "$sn" status=accepted
ok A set "$sn" status=accepted decision="matches the file's existing style"
bad "accepted_is_for_nits_with_a_reason" B set 1 status=accepted decision=x
hard=$(B add label=Hardening step=2 claim="hardening must be fixed" | rowid)
bad "accepted_is_for_nits_with_a_reason" A set "$hard" status=accepted decision="leave it"
tele=$(B add label=telemetry-quality step=2 claim="telemetry gap" | rowid)
bad "accepted_is_for_nits_with_a_reason" A set "$tele" status=accepted decision="leave it"
ac=$(B add label=Nit step=2 claim="accept after cycles" | rowid)
ok A set "$ac" claim=a1
ok B set "$ac" claim=a2
ok A set "$ac" claim=a3
ok B set "$ac" claim=a4
bad "two cycles spent" A set "$ac" claim=a5
ok A set "$ac" status=accepted decision="deliberately unchanged"
ok A agree "$da"
ok B agree "$db"
ok B agree "$dc"
ok B agree "$sn"
ok A agree "$hard"
ok A agree "$tele"
ok B agree "$ac"
has "\[Nit\].*accepted" M render
# a needs-ruling proposal can be fix-reviewed but cannot be dispatched before its owner decides
nr=$(A add label=Bug step=2 status=needs-ruling cluster=MES-V0 claim="owner must choose the compatibility trade" trigger=t impact=i origin_class=design-absence fix_shape=f sites_walked=s rulings_checked=r test_seam="new: ruling test" cost=c | rowid)
ok B agree "$nr"
not "ready: row #$nr" B review "$nr" note="walked both owner options"
has "0" M query "SELECT count(*) FROM ready WHERE id=$nr"
# coverage is token-based: a decoy cluster is not covered by a longer name, an annotated token is
S2=$(mktemp -d /tmp/ledger-cov.XXXXXX)
( export LEDGER_DIR=$S2; LEDGER_ME=A "$L" init --single --route review --clusters "foo foobar MES-VT bar" >/dev/null && LEDGER_ME=A "$L" add label=Nit step=2 cluster="foobar, MES-VT(5/6), foo;bar, foo(note)extra" claim=x >/dev/null && LEDGER_ME=A "$L" status ) | grep -q "uncovered clusters: foo bar$" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: exact comma-token coverage"; }
rm -rf "$S2"

# a contested Bug still needs its investigated trigger, impact, proposal slots, cost, and decision before agreement
C=$(mktemp -d /tmp/ledger-contested.XXXXXX)
CA() { LEDGER_DIR=$C LEDGER_ME=A "$L" "$@"; }
CB() { LEDGER_DIR=$C LEDGER_ME=B "$L" "$@"; }
CM() { LEDGER_DIR=$C LEDGER_ME=master "$L" "$@"; }
ok CM init --scribe A --joint "$C/joint.md" --route diagnose
ok CA init --cold
ok CB init --cold
bad "contested_proposal_needs_its_axis_in_decision" CA add label=Bug step=2 claim="uncertain bug" status=contested probe="run the shipped seam"
ok CA add label=Bug step=2 claim="uncertain bug" status=contested probe="run the shipped seam" decision="if the probe is red, fix it"
ok CA import
ok CB import
bad "bug_converges_only_with_trigger_impact_cost_and_slots" CB agree 1
ok CA set 1 trigger=t impact=i decision="if the probe is red, fix it" origin_class=attention-miss fix_shape=f sites_walked=s rulings_checked=r test_seam="new: probe" cost=c
ok CB agree 1
has "unconverged: 0" CM status
rm -rf "$C"

# composition refreshes cannot forge freshness while facts are open or retain references to withdrawn facts
F=$(mktemp -d /tmp/ledger-composition-refresh.XXXXXX)
FA() { LEDGER_DIR=$F LEDGER_ME=A "$L" "$@"; }
FB() { LEDGER_DIR=$F LEDGER_ME=B "$L" "$@"; }
FM() { LEDGER_DIR=$F LEDGER_ME=master "$L" "$@"; }
ok FM init --scribe A --joint "$F/joint.md" --route diagnose
ok FA init --cold
ok FB init --cold
ok FA add label=Nit step=2 claim="live fact"
ok FA import
ok FB import
ok FB agree 1
ok FA add label=Composition step=2 cluster=1 claim="A composition" decision="no change"
ok FB add label=Composition step=2 cluster=1 claim="B composition" decision="no change"
ok FB agree 2
ok FA agree 3
ok FA set 1 claim="edited fact"
bad "Composition resumes after every factual row converges" FB set 3 site="forged freshness"
ok FB agree 1
ok FB reject 1 verdict_step=2 verdict="fact no longer applies"
ok FA agree 1
bad "a Composition cluster is" FA set 2 claim="stale reference refresh"
bad "a Composition cluster is" FB set 3 claim="stale reference refresh"
ok FA set 2 cluster=none claim="A recomposition after withdrawal"
ok FB set 3 cluster=none claim="B recomposition after withdrawal"
ok FB agree 2
ok FA agree 3
rm -rf "$F"

# two-family coverage cannot be supplied by Composition ids and blocks both sign and converge
V=$(mktemp -d /tmp/ledger-two-coverage.XXXXXX)
VA() { LEDGER_DIR=$V LEDGER_ME=A "$L" "$@"; }
VB() { LEDGER_DIR=$V LEDGER_ME=B "$L" "$@"; }
VM() { LEDGER_DIR=$V LEDGER_ME=master "$L" "$@"; }
ok VM init --scribe A --joint "$V/joint.md" --route diagnose --clusters "1 c1 c2"
ok VA init --cold
ok VB init --cold
ok VA add label=Nit step=2 cluster=c1 claim="covers only c1"
ok VA import
ok VB import
ok VB agree 1
ok VA add label=Composition step=2 cluster=1 claim="one factual row composes alone" decision="no change"
ok VB add label=Composition step=2 cluster=1 claim="same independent conclusion" decision="no change"
ok VB agree 2
ok VA agree 3
printf "passes: 1 sweep\nretrospective: none\nvote: converge\n" > "$V/A-notes.md"; printf "passes: 1 sweep\nretrospective: none\nvote: converge\n" > "$V/B-notes.md"
has "uncovered clusters: 1 c2" VM status
bad "uncovered clusters: 1 c2" VB sign
bad "uncovered clusters: 1 c2" VA converge
bad "sign refused" env LEDGER_DIR=$V LEDGER_ME=master sqlite3 "$V/ledger.db" "PRAGMA foreign_keys=ON; INSERT INTO signatures(seat,ts,notes_hash) VALUES('B','now','x');"
rm -rf "$V"

# review convergence requires both notes, passes, and the review-only report sections
R=$(mktemp -d /tmp/ledger-review-notes.XXXXXX)
RA() { LEDGER_DIR=$R LEDGER_ME=A "$L" "$@"; }
RB() { LEDGER_DIR=$R LEDGER_ME=B "$L" "$@"; }
RM() { LEDGER_DIR=$R LEDGER_ME=master "$L" "$@"; }
ok RM init --scribe A --joint "$R/joint.md" --route review
ok RA init --cold
ok RB init --cold
ok RA import
ok RB import
ok RA add label=Composition step=2 cluster=none claim="nothing composes" decision="no change"
ok RB add label=Composition step=2 cluster=none claim="nothing composes" decision="no change"
ok RB agree 1
ok RA agree 2
ok RB reject 2 verdict_step=2 verdict="replace this composition"
ok RA agree 2
bad "current Composition rows present from seats: A" RB sign
ok RB set 2 status=finding verdict= verdict_step= decision="no change"
ok RA agree 2
printf "passes: 1 sweep\nretrospective: goal seam\nvote: converge\n" > "$R/A-notes.md"; printf "passes: 1 sweep\nretrospective: domain seam\nvote: converge\n" > "$R/B-notes.md"
bad "Goal closure" RB sign
printf "\n## Goal closure\n\nGoal matches.\n" >> "$R/A-notes.md"
bad "Domain scenarios" RB sign
printf "\n## Domain scenarios\n\nCanonical path checked.\n" >> "$R/A-notes.md"
ok RB sign
has "converged:" RA converge
rm -rf "$R"

# later invocations of a mutable source helper dispatch through the run's pinned script and schema
P=$(mktemp -d /tmp/ledger-pin.XXXXXX)
mkdir -p "$P/source" "$P/run"
cp "$L" "${L%/*}/ledger.sql" "$P/source/"
PL="$P/source/ledger.sh"
has "pinned helper" env LEDGER_DIR=$P/run LEDGER_ME=master "$PL" init --scribe A --joint "$P/run/joint.md" --route diagnose
sed -i.bak 's/SCHEMA_VERSION=5/SCHEMA_VERSION=999/' "$PL"
has "rows: 0 total" env LEDGER_DIR=$P/run LEDGER_ME=master "$PL" status
cmp -s "$P/run/bin/ledger.sql" "${L%/*}/ledger.sql" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: pinned schema changed"; }
rm -rf "$P"

# migration rebuilds an older shared schema, and refuses to strand an unimported older cold ledger
G=$(mktemp -d /tmp/ledger-migrate.XXXXXX)
has "pinned helper" env LEDGER_DIR=$G LEDGER_ME=master "$L" init --scribe A --joint "$G/joint.md" --route diagnose
sqlite3 "$G/ledger.db" "PRAGMA ignore_check_constraints=ON; INSERT INTO ledger(owner,last_editor,label,claim,step,status,decision) VALUES('A','A','Hardening','accepted under schema 4',2,'accepted','leave it'),('A','A','Nit','empty accepted reason under schema 4',2,'accepted',''),('A','A','Nit','valid accepted nit under schema 4',2,'accepted','leave it'); UPDATE ledger SET agree_b=1;"
sqlite3 "$G/ledger.db" "PRAGMA user_version=4;"
has "migrated $G/ledger.db to schema 5" env LEDGER_DIR=$G LEDGER_ME=master "$L" migrate --scribe A --joint "$G/joint.md" --route diagnose
has "rows: 3 total" env LEDGER_DIR=$G LEDGER_ME=master "$L" status
has "2" env LEDGER_DIR=$G LEDGER_ME=master "$L" query "SELECT count(*) FROM ledger WHERE status='finding'"
has "1" env LEDGER_DIR=$G LEDGER_ME=master "$L" query "SELECT count(*) FROM ledger WHERE status='accepted' AND agree_b=1"
has "2" env LEDGER_DIR=$G LEDGER_ME=master "$L" query "SELECT count(*) FROM unconverged"
rm -rf "$G"
G=$(mktemp -d /tmp/ledger-migrate-cold.XXXXXX)
has "pinned helper" env LEDGER_DIR=$G LEDGER_ME=master "$L" init --scribe A --joint "$G/joint.md" --route diagnose
ok env LEDGER_DIR=$G LEDGER_ME=A "$L" init --cold
sqlite3 "$G/ledger.db" "PRAGMA user_version=4;"
sqlite3 "$G/cold-A.db" "PRAGMA user_version=4;"
bad "unimported cold-A.db is schema 4" env LEDGER_DIR=$G LEDGER_ME=master "$L" migrate --scribe A --joint "$G/joint.md" --route diagnose
rm -rf "$G"

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
bad "single-seat ledger is seat A" env LEDGER_DIR=$S LEDGER_ME=B "$L" init --single --route diagnose
bad "LEDGER_ME must be" env -u LEDGER_ME LEDGER_DIR=$S "$L" init --single --route diagnose
ok SA init --single --route diagnose --clusters "C1 C2"
has "single seat A" SA status
bad "single-seat ledger is seat A" env LEDGER_DIR=$S LEDGER_ME=B "$L" status
bad "single-seat ledger is seat A" env LEDGER_DIR=$S LEDGER_ME=B "$L" add label=Nit step=2 claim="wrong seat"
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

# reopened by the fresh review: whitespace cluster fields, contested proposals in the render, dup after two cycles,
# the verdict step in the two-cycle rule, raw mark clears, re-init over a pinned helper
R=$(mktemp -d /tmp/ledger-reopen.XXXXXX)
RA() { LEDGER_DIR=$R LEDGER_ME=A "$L" "$@"; }; RB() { LEDGER_DIR=$R LEDGER_ME=B "$L" "$@"; }; RM() { LEDGER_DIR=$R LEDGER_ME=master "$L" "$@"; }
bad "contains a comma or parenthesis" RM init --scribe A --joint "$R/j.md" --route diagnose --clusters "C1,C2"
ok RM init --scribe A --joint "$R/j.md" --route diagnose --clusters "C1 C2 C3"
ok RA init --cold; ok RB init --cold
ok RA add label=Bug step=4 cluster="C1 C2" site=x:1 claim=b1 evidence_path=e trigger=T-IMPORTANT impact=I-IMPORTANT origin_class=attention-miss fix_shape=F-IMPORTANT sites_walked=s rulings_checked=r test_seam="none: n" cost=c
ok RA add label=Nit step=4 evidence_path=e cluster="C3" claim=n1
ok RB add label=Nit step=2 cluster="	C3" claim=n2
ok RA import; ok RB import
has "uncovered clusters: none" RM status
ok RB contest 1 probe=p decision=axis
ok RA agree 1
has "Trigger: T-IMPORTANT" RM render
has "Proposal: origin attention-miss; shape: F-IMPORTANT" RM render
# dup is a verdict, allowed after two cycles; a step-2 rejection of a step-4 row is not
ok RB set 3 claim=e1; ok RA set 3 claim=e2; ok RB set 3 claim=e3; ok RA set 3 claim=e4
ok RB dup 3 2
ok RB set 2 claim=f1; ok RA set 2 claim=f2; ok RB set 2 claim=f3; ok RA set 2 claim=f4
bad "two cycles spent" RB reject 2 verdict_step=2 verdict=v
ok RB reject 2 verdict_step=4 verdict="probe log shows it"
# marks are withdrawn only by an edit
ok RA agree 2
bad "withdrawn only by a content edit" sqlite3 "$R/ledger.db" "UPDATE ledger SET agree_a = 0 WHERE id = 2"
has "1" RA query "SELECT agree_a FROM ledger WHERE id = 2"
# re-running init over a pinned helper neither copies onto itself nor fails
rm -f "$R/ledger.db" "$R/ledger.db-wal" "$R/ledger.db-shm"
not "identical" RM init --scribe A --joint "$R/j.md" --route diagnose --clusters "C1"
rm -rf "$R"

echo "ledger tests: $pass passed, $fail failed (dir $T)"
[ $fail -eq 0 ] && rm -rf "$T"
[ $fail -eq 0 ]
