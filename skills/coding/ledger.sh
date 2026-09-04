#!/bin/bash
# ledger.sh: the deep-run ledger, a SQLite file whose schema (ledger.sql, beside this file) carries the
# protocol in deep.md. Every protocol fact lives in the ledger; every notification is sent from here.
# Env: LEDGER_DIR=<run directory>  LEDGER_ME=A|B|fixer|master
#      Agent names come from `init --names` (meta); LEDGER_PEER/LEDGER_MASTER/LEDGER_FIXER/LEDGER_SCRIBE/LEDGER_COUNTERSIGNER override them.
#      LEDGER_NOTIFY=<command prefix taking "<name> <message>">, default "herdr agent prompt"
set -u

HERE=$(cd "$(dirname "$0")" && pwd)
SCHEMA="$HERE/ledger.sql"
DIR="${LEDGER_DIR:-.}"
ME="${LEDGER_ME:-}"
PEER_NAME="${LEDGER_PEER:-}"
MASTER_NAME="${LEDGER_MASTER:-}"
FIXER_NAME="${LEDGER_FIXER:-}"
COUNTERSIGNER_NAME="${LEDGER_COUNTERSIGNER:-}"
SCRIBE_NAME="${LEDGER_SCRIBE:-}"
NOTIFY="${LEDGER_NOTIFY:-herdr agent prompt}"
SHARED="$DIR/ledger.db"
SQLITE="${SQLITE:-sqlite3}"
# A run pins its helper: init copies this script and its schema into <run dir>/bin, and every later call runs that copy.
if [ "${1:-}" != migrate ] && [ -x "$DIR/bin/ledger.sh" ] && [ "$(cd "$DIR/bin" 2>/dev/null && pwd -P)" != "$(cd "$HERE" && pwd -P)" ]; then exec "$DIR/bin/ledger.sh" "$@"; fi
SCHEMA_VERSION=8
INT_COLS=" step verdict_step dup_of "
ADD_COLS=" label cluster site claim trigger impact decision ruling step evidence_path status probe origin_class fix_shape sites_walked rulings_checked test_seam cost "
SET_COLS="$ADD_COLS verdict verdict_step dup_of "
LAND_COLS=" shelve red_run green_run "

usage() {
cat <<'USAGE'
ledger.sh: the deep-run ledger; the protocol is in deep.md. Table `ledger` (one row per claim), plus
`clusters` (the partition), `imports`, `signatures`, `events`, `meta` (scribe, joint_path, route).
Env: LEDGER_DIR=<run directory>  LEDGER_ME=A|B (peer seat), fixer, or master. Agent names are in the ledger from init.
A fixable row's stage: converged -> fixable -> landed (awaiting review) -> ready -> fixed. `status` names each.

Master:
  init --scribe A|B --joint <path> --route review|diagnose --names "A=<agent> B=<agent> fixer=<agent> master=<agent>"
       [--clusters "<id> <id> ..."]
                            create the shared ledger with the roles, the agent names notifications go to, the joint
                            report path, and the partition; pins this helper and its schema under <dir>/bin
Single seat (a plain review or diagnosis; first `export LEDGER_ME=A`):
  init --single --route review|diagnose [--joint <path>] [--clusters "..."]   one seat, no marks, no peers
  report [--out <path>]     refuses while a Bug or Restructure row lacks a slot or a cluster is uncovered; else renders
  status                    imports, counts, unconverged rows, uncovered clusters, signature
  migrate --scribe A|B --joint <path> --route review|diagnose [--clusters "..."]   rebuild a schema-v1..4 ledger under this schema
Peers:
  init --cold               create your cold ledger; every command below targets it until you import
  add k=v ...               new row you own; needs label= step= claim=; v may be @file for long text
  set <id> k=v ...          edit a row: advances rev, clears both marks, signs you as last editor
  agree <id>                mark a row you did not last edit; the row converges on that mark
  reject <id> verdict_step=N verdict=...   withdraw a row with the disproving evidence and its step
  contest <id> probe=... [decision=...]   carry a row as contested with the probe that settles it; a Bug or
                            Restructure also states the axis of the disagreement in decision=
  dup <id> <of>             close a row as a restatement of row <of> (a cross-examination verdict)
  claim-probe <id>          take the probe write-up for a row; the first claimant wins
  review <id> rev=N fix_rev=M [note=...]
                            the seat that did not write the row: review its landing as a diff; rev and fix_rev are
                            the values you read (show), so a row that moved is refused; conditions go in with set first
  import                    move your cold rows into the shared ledger and tell your peer (report ready:)
  handoff                   end a pass: tell your peer what awaits them (ledger: ...)
  sign [note=...]           countersigner: refused until every row is converged, every Bug and Restructure ready
                            (ruled, landed, reviewed at that landing), coverage is complete, and each seat has a
                            current Composition row; hashes both seat-notes files, then tells scribe and master (signed:).
                            Only a Bug, Restructure or Composition edit voids it
  converge                  scribe, at unconverged 0 and signed: renders the joint report, tells the master (converged:)
  status                    your role, your queue, the unconverged count, the next step
Fixer (LEDGER_ME=fixer; seat A in a single-seat ledger):
  land <id> rev=N shelve=<shelve id or patch path> green_run=<log> [red_run=<log>]
                            record a landing on a fixable row at the revision you read: red_run is the seam's test
                            failing on the pre-fix tree (required unless test_seam is none:), green_run the build and
                            owning tests passing with the fix; both are existing non-empty files, absolute or under
                            LEDGER_DIR; advances fix_rev and tells the row's reviewer (review:)
  flag <id> note=<fact>     a fact about a row from the tree (the test passes before the fix, the seam does not
                            exist, the build fails): logged on the row, sent to the scribe (flag:); the row is not
                            fixable until a seat edits it
Master:
  go <id> [<id> ...]        the user's go: approves ready rows at their landing, after the signature; rows sharing a
                            shelve are approved together
  close <id> changeset=<id> after the check-in: a row approved at this landing, or a Nit, becomes fixed; no revision,
                            no mark, the signature stands
Anyone:
  show <id>                 one row in full, with its events
  render                    the joint report as markdown on stdout, from the shared ledger
  log [id]                  the events, oldest first
  query "<select>"          read-only SQL

Columns for add and set: label(Bug|Restructure|Hardening|Nit|telemetry-quality|Composition) cluster site claim
  trigger impact decision step(1-5) evidence_path
  status(finding|verified|assumed|needs-ruling|contested|withdrawn|dup|accepted|carried)
  probe origin_class(attention-miss|self-consistency|design-absence) fix_shape sites_walked
  rulings_checked test_seam cost
  set only: ruling verdict verdict_step dup_of. status=accepted is Nit-only and needs decision=; status=carried
  needs ruling=ruled:... and names its exit (todo path, doc line) in decision=. An empty value (k=) clears the
  column. fixed is reached only through close.
ruling= is `ruled: <the owner's answer>` or `default: <option>`; a needs-ruling row is fixable once it has one.
  The master receives the question (ruling:) and records the answer through the scribe.
A Composition row composes other rows: cluster= is a comma list of live factual ids (or `none`), claim= what
  holds when they are all true, decision= the fix order or changed severity. Each seat writes a current row
  after factual convergence and before reading the peer's; a later factual edit makes prior compositions stale.
A Bug or Restructure converges only with trigger, impact, origin_class, fix_shape, sites_walked,
  rulings_checked, test_seam and cost filled. test_seam starts with `exists: <path>`, `new: <what must
  be built>`, or `none: <the architecture finding>`. cost comes from the code the fix touches.
What the schema refuses is printed as the reason; read it, it is the protocol.
USAGE
}

die() { printf 'ledger: %s\n' "$*" >&2; exit 1; }
LOCK="$DIR/.ledger-write-lock"
LOCK_HELD=0
release_lock() {
  [ "$LOCK_HELD" = 1 ] || return 0
  rm -f "$LOCK/pid"
  rmdir "$LOCK" 2>/dev/null || true
  LOCK_HELD=0
}
acquire_lock() { # serialize every public mutation; converge holds this through report replacement and notification
  local tries=0
  [ -d "$DIR" ] || die "ledger directory $DIR does not exist"
  while ! mkdir "$LOCK" 2>/dev/null; do
    tries=$((tries + 1))
    [ "$tries" -lt 5000 ] || die "timed out waiting for $LOCK; if no ledger helper is running, remove the stale lock directory"
    sleep 0.01
  done
  printf '%s\n' "$$" > "$LOCK/pid" || { rmdir "$LOCK" 2>/dev/null; die "cannot record the ledger lock owner"; }
  LOCK_HELD=1
  trap release_lock EXIT
  trap 'exit 130' HUP INT TERM
}
seat() {
  case "$ME" in A|B) ;; *) die "LEDGER_ME must be A or B for '$1' (got '${ME:-unset}')";; esac
  is_single && [ "$ME" != A ] && die "a single-seat ledger is seat A: export LEDGER_ME=A"
  return 0
}
fixer_or_seat() { # land and flag: the fixer in a two-family run; seat A in a single-seat ledger
  case "$ME" in A|B|fixer|master) ;; *) die "LEDGER_ME must be fixer, A, B or master for '$1' (got '${ME:-unset}')";; esac
  if is_single; then [ "$ME" = A ] || die "a single-seat ledger is seat A: export LEDGER_ME=A"
  else [ "$ME" = fixer ] || die "in a two-family run only the fixer edits the tree: '$1' is for LEDGER_ME=fixer"; fi
  return 0
}
master_or_seat() { # go and close: the master in a two-family run; seat A in a single-seat ledger
  case "$ME" in A|B|fixer|master) ;; *) die "LEDGER_ME must be master (or A in a single-seat ledger) for '$1' (got '${ME:-unset}')";; esac
  if is_single; then [ "$ME" = A ] || die "a single-seat ledger is seat A: export LEDGER_ME=A"
  else [ "$ME" = master ] || die "'$1' records the user's decision: LEDGER_ME=master"; fi
  return 0
}
log_path() { # log_path <given> -> absolute path of an existing non-empty file, absolute or under LEDGER_DIR
  local f=$1; case "$f" in /*) ;; *) f="$DIR/$f";; esac
  [ -s "$f" ] || die "$1 is not an existing non-empty file (absolute, or relative to $DIR)"
  printf '%s' "$f"
}
other() { if [ "$ME" = A ]; then echo B; else echo A; fi; }
mark_col() { if [ "$1" = A ]; then echo agree_a; else echo agree_b; fi; }
is_int() { case "$1" in ''|*[!0-9]*) return 1;; *) return 0;; esac; }
sqlstr() { local q="'" v=$1; v=${v//$q/$q$q}; printf "'%s'" "$v"; }

run() { # run "$db" "$sql": one sqlite3 invocation; schema aborts and CHECK names are printed as the reason
  local db=$1 sql=$2 out rc
  out=$("$SQLITE" -bail -batch -cmd ".timeout 5000" "$db" "PRAGMA foreign_keys=ON; $sql" 2>&1)
  rc=$?
  if [ $rc -ne 0 ]; then
    printf '%s\n' "$out" | sed -e 's/^Error in [0-9a-z]* command line argument: //' -e 's/^Runtime error: //' -e 's/^Parse error: //' -e 's/^Error: //' -e 's/^near line [0-9]*: //' -e 's/ ([0-9][0-9]*)$//' >&2
    exit $rc
  fi
  printf '%s\n' "$out"
}

check_version() {
  local v; v=$("$SQLITE" -batch -cmd ".timeout 5000" "$1" "PRAGMA user_version;" 2>/dev/null)
  [ "$v" = "$SCHEMA_VERSION" ] || die "$1 has schema version '${v:-none}', this ledger.sh speaks $SCHEMA_VERSION; ledger.sh migrate rebuilds versions 1 to 7"
}

db_for_me() { # the cold ledger until this seat has imported, then the shared ledger
  local cold="$DIR/cold-$ME.db" imported=0
  if [ -f "$cold" ]; then
    if [ -f "$SHARED" ]; then
      imported=$("$SQLITE" -batch -cmd ".timeout 5000" "$SHARED" "SELECT count(*) FROM imports WHERE seat='$ME';" 2>/dev/null || echo 0)
    fi
    if [ "$imported" = "0" ]; then echo "$cold"; return; fi
  fi
  [ -f "$SHARED" ] || die "no ledger at $SHARED and no cold ledger for seat $ME: peers run 'ledger.sh init --cold', the master runs 'ledger.sh init'"
  echo "$SHARED"
}

meta() { run "$SHARED" "SELECT value FROM meta WHERE key = '$1';"; }
is_single() { [ -f "$SHARED" ] && [ "$(meta mode 2>/dev/null)" = single ]; }
two_family_only() { is_single && die "single-seat ledger: there is no peer; ledger.sh report renders when every slot and cluster is in"; return 0; }
scribe_seat() { [ -f "$SHARED" ] && meta scribe || echo ""; }
my_role() { local s; s=$(scribe_seat); if [ -z "$s" ]; then echo "peer"; elif [ "$s" = "$ME" ]; then echo "scribe"; else echo "countersigner"; fi; }

NAMES_SQL=""
names_sql() { # names_sql "A=x B=y fixer=z master=m" -> NAMES_SQL inserts into meta; all four roles, or none
  local tok k v seen=" "; NAMES_SQL=""
  for tok in $1; do
    case "$tok" in *=?*) ;; *) die "--names entries are role=agent, got '$tok'";; esac
    k=${tok%%=*}; v=${tok#*=}
    case "$k" in A|B|fixer|master) ;; *) die "--names role '$k' is not A, B, fixer or master";; esac
    seen="$seen$k "
    NAMES_SQL="$NAMES_SQL INSERT INTO meta VALUES ('name_$k', $(sqlstr "$v"));"
  done
  if [ -n "$NAMES_SQL" ]; then for k in A B fixer master; do case "$seen" in *" $k "*) ;; *) die "--names needs all four roles; missing $k";; esac; done; fi
}
seat_name() { [ -f "$SHARED" ] && run "$SHARED" "SELECT coalesce((SELECT value FROM meta WHERE key = 'name_$1'), '');" 2>/dev/null || echo ""; }
notify() { # notify <role: peer|master|scribe|countersigner|fixer> <message>: the name from the ledger, env overriding; else print what to send
  local role=$1 msg=$2 name="" scribe; scribe=$(scribe_seat)
  case "$role" in
    peer) name=${PEER_NAME:-$(seat_name "$(other)")};;
    master) name=${MASTER_NAME:-$(seat_name master)};;
    fixer) name=${FIXER_NAME:-$(seat_name fixer)};;
    scribe) if [ "$ME" = A ] || [ "$ME" = B ]; then name=${PEER_NAME:-$(seat_name "$scribe")}; else name=${SCRIBE_NAME:-$(seat_name "$scribe")}; fi;;
    countersigner) local cs; if [ "$scribe" = A ]; then cs=B; else cs=A; fi
      if [ "$ME" = A ] || [ "$ME" = B ]; then name=${PEER_NAME:-$(seat_name "$cs")}; else name=${COUNTERSIGNER_NAME:-$(seat_name "$cs")}; fi;;
    A|B) name=$(seat_name "$role");;
  esac
  if [ -n "$name" ]; then
    if $NOTIFY "$name" "$msg" >/dev/null 2>&1; then echo "sent to $role ($name): $msg"; return; fi
    echo "delivery to $role ($name) failed; send it yourself:" >&2
  else
    echo "no agent name for $role (init --names, or LEDGER_PEER/LEDGER_MASTER/LEDGER_FIXER); send it yourself:"
  fi
  echo "  $msg"
}

parse_kv() { # parse_kv "$allowed" k=v ... -> COLS, VALS, SETS, NAMES
  local allowed=$1 arg k v lit; shift
  COLS=""; VALS=""; SETS=""; NAMES=" "
  for arg in "$@"; do
    case "$arg" in *=*) ;; *) die "expected key=value, got '$arg'";; esac
    k=${arg%%=*}; v=${arg#*=}
    case "$allowed" in *" $k "*) ;; *) die "column '$k' is not settable here; ledger.sh --help lists the columns";; esac
    case "$v" in @*) [ -f "${v#@}" ] || die "no file ${v#@}"; v=$(cat "${v#@}");; esac
    if [ -z "$v" ]; then lit=NULL
    elif case "$INT_COLS" in *" $k "*) true;; *) false;; esac; then
      is_int "$v" || die "$k must be an integer, got '$v'"; lit=$v
    else lit=$(sqlstr "$v"); fi
    case "$NAMES" in *" $k "*) die "column '$k' given twice";; esac
    NAMES="$NAMES$k "; COLS="$COLS${COLS:+, }$k"; VALS="$VALS${VALS:+, }$lit"; SETS="$SETS${SETS:+, }$k = $lit"
  done
}
require_col() { case "$NAMES" in *" $1 "*) ;; *) die "$1= is required";; esac; }

# ---- state lines -------------------------------------------------------------------------------------------

unconverged_count() { run "$1" "SELECT count(*) FROM unconverged;"; }
signature_line() { run "$SHARED" "SELECT coalesce((SELECT 'signed by ' || seat || ' at ' || ts FROM signatures LIMIT 1), 'none');"; }
imports_line() { run "$1" "SELECT coalesce(group_concat(seat || '=' || rows || ' rows', ', '), 'none') FROM imports;"; }
uncovered_line() { # clusters with no row naming them
  run "$SHARED" "SELECT coalesce(group_concat(name, ' '), 'none') FROM uncovered_clusters;"
}
ready_line() { run "$SHARED" "SELECT coalesce(group_concat('#' || id, ' '), 'none') FROM ready;"; }
not_ready_line() { run "$SHARED" "SELECT coalesce(group_concat('#' || id, ' '), 'none') FROM proposals WHERE gating AND id NOT IN (SELECT id FROM ready);"; }
fixable_line() { run "$SHARED" "SELECT coalesce(group_concat('#' || id, ' '), 'none') FROM fixable;"; }
reviewable_line() { run "$SHARED" "SELECT coalesce(group_concat('#' || id, ' '), 'none') FROM reviewable;"; }
awaiting_ruling_line() { run "$SHARED" "SELECT coalesce(group_concat('#' || id, ' '), 'none') FROM awaiting_ruling;"; }
ids_of() { run "$SHARED" "SELECT coalesce(group_concat(id, ' '), '') FROM $1;"; }
newly() { # newly "<before ids>" "<after ids>" -> ids in after and not in before, as '#n #m'
  local before=" $1 " out="" id; for id in $2; do case "$before" in *" $id "*) ;; *) out="$out${out:+ }#$id";; esac; done; echo "$out"
}
announce_stage_changes() { # announce_stage_changes <fixable before> <ruling before>: tell the fixer and the master what just opened
  [ -f "$SHARED" ] || return 0; is_single && return 0
  local f r; f=$(newly "$1" "$(ids_of "fixable WHERE id IN (SELECT id FROM proposals WHERE gating)")"); r=$(newly "$2" "$(ids_of awaiting_ruling)")
  [ -z "$f" ] || notify fixer "fix: rows $f are fixable. ledger.sh show <id> gives the row and its rev; then ledger.sh land <id> rev=<that rev> ..."
  [ -z "$r" ] || notify master "ruling: rows $r need the owner. ledger.sh show <id> has the question; the answer returns through the scribe as ruling=ruled:..."
}
factual_unconverged_count() { run "$1" "SELECT count(*) FROM unconverged WHERE label <> 'Composition';"; }
composed_seats() { run "$SHARED" "SELECT coalesce(group_concat(DISTINCT owner), 'none') FROM current_compositions;"; }
my_composition_count() { run "$SHARED" "SELECT count(*) FROM current_compositions WHERE owner = '$1';"; }
composition_blind() { # after facts converge, do not reveal the peer's composition until this seat has submitted its own
  [ "$ME" = A ] || [ "$ME" = B ] || return 1
  ! is_single || return 1
  [ "$(factual_unconverged_count "$SHARED")" = 0 ] || return 1
  [ "$(not_ready_line)" = none ] || return 1
  [ "$(my_composition_count "$ME")" = 0 ]
}
notes_hash() { # hash file identity and each digest, so bytes cannot move between A and B without changing the result
  local base=${1:-$DIR} a b
  a=$(shasum -a 256 "$base/A-notes.md" 2>/dev/null | awk '{print $1}') || return 1
  b=$(shasum -a 256 "$base/B-notes.md" 2>/dev/null | awk '{print $1}') || return 1
  printf 'A:%s\nB:%s\n' "$a" "$b" | shasum -a 256 | cut -c1-64
}
validate_notes() { # validate the files that will actually be appended to the signed report
  local base=${1:-$DIR} s
  for s in A B; do
    [ -s "$base/$s-notes.md" ] || { echo "ledger: $s-notes.md is required and must be non-empty before signing" >&2; return 1; }
    grep -Eiq '^[[:space:]]*passes:[[:space:]]*[^[:space:]]' "$base/$s-notes.md" || { echo "ledger: $s-notes.md needs a non-empty passes: line" >&2; return 1; }
    grep -Eiq '^[[:space:]]*retrospective:[[:space:]]*[^[:space:]]' "$base/$s-notes.md" || { echo "ledger: $s-notes.md needs a non-empty retrospective: line" >&2; return 1; }
    grep -Eiq '^[[:space:]]*vote:[[:space:]]*[^[:space:]]' "$base/$s-notes.md" || { echo "ledger: $s-notes.md needs a non-empty vote: line" >&2; return 1; }
  done
  if [ "$(meta route)" = review ]; then
    grep -Eiq '^[[:space:]]*#{1,6}[[:space:]]+goal closure[[:space:]]*$' "$base/A-notes.md" "$base/B-notes.md" || { echo "ledger: a deep review needs a Goal closure section in the signed seat notes" >&2; return 1; }
    grep -Eiq '^[[:space:]]*#{1,6}[[:space:]]+domain scenarios[[:space:]]*$' "$base/A-notes.md" "$base/B-notes.md" || { echo "ledger: a deep review needs a Domain scenarios section in the signed seat notes" >&2; return 1; }
  fi
}

incomplete_rows() { # Bug/Restructure rows still missing a slot, one line each
  run "$1" "SELECT '  #' || id || ': missing ' || trim(
      CASE WHEN length(trim(coalesce(trigger, ''))) = 0 THEN 'trigger, ' ELSE '' END || CASE WHEN length(trim(coalesce(impact, ''))) = 0 THEN 'impact, ' ELSE '' END
      || CASE WHEN origin_class IS NULL THEN 'origin_class, ' ELSE '' END || CASE WHEN length(trim(coalesce(fix_shape, ''))) = 0 THEN 'fix_shape, ' ELSE '' END
      || CASE WHEN length(trim(coalesce(sites_walked, ''))) = 0 THEN 'sites_walked, ' ELSE '' END || CASE WHEN length(trim(coalesce(rulings_checked, ''))) = 0 THEN 'rulings_checked, ' ELSE '' END
      || CASE WHEN length(trim(coalesce(test_seam, ''))) = 0 THEN 'test_seam, ' ELSE '' END || CASE WHEN length(trim(coalesce(cost, ''))) = 0 THEN 'cost, ' ELSE '' END, ', ')
    FROM ledger WHERE label IN ('Bug','Restructure') AND status IN ('finding','verified','assumed','needs-ruling','contested')
      AND (length(trim(coalesce(trigger, ''))) = 0 OR length(trim(coalesce(impact, ''))) = 0 OR origin_class IS NULL
           OR length(trim(coalesce(fix_shape, ''))) = 0 OR length(trim(coalesce(sites_walked, ''))) = 0
           OR length(trim(coalesce(rulings_checked, ''))) = 0 OR length(trim(coalesce(test_seam, ''))) = 0 OR length(trim(coalesce(cost, ''))) = 0)
    ORDER BY id;"
}

next_step() { # what a peer does next, from the ledger's state; printed after every mutating command
  local db=$1 u factual_u mine peers role sig
  [ "$db" = "$SHARED" ] || { echo "next: keep adding rows; ledger.sh import when your report is done"; return; }
  if is_single; then
    local inc; inc=$(incomplete_rows "$db"); local unc; unc=$(uncovered_line)
    if [ -n "$inc" ]; then echo "slots still empty:"; echo "$inc"; fi
    echo "uncovered clusters: $unc"
    if [ -z "$inc" ] && [ "$unc" = none ]; then echo "next: ledger.sh report"; else echo "next: fill the slots and disposition every cluster, then ledger.sh report"; fi
    return
  fi
  u=$(unconverged_count "$db"); factual_u=$(factual_unconverged_count "$db"); role=$(my_role); sig=$(signature_line)
  mine=$(run "$db" "SELECT count(*) FROM ledger WHERE last_editor <> '$ME' AND $(mark_col "$ME") = 0;")
  peers=$(run "$db" "SELECT count(*) FROM ledger WHERE last_editor = '$ME' AND $(mark_col "$(other)") = 0;")
  local mycomp; mycomp=$(my_composition_count "$ME")
  local notready reviewable fixable rulings myrev; notready=$(not_ready_line); reviewable=$(reviewable_line); fixable=$(fixable_line); rulings=$(awaiting_ruling_line)
  myrev=$(run "$db" "SELECT coalesce(group_concat('#' || r.id || ' (rev ' || l.rev || ', fix_rev ' || l.fix_rev || ')', ' '), 'none') FROM reviewable r JOIN ledger l ON l.id = r.id WHERE l.owner <> '$ME';")
  echo "unconverged: $u | awaiting your mark: $mine | awaiting your peer's mark: $peers | fixable: $fixable | awaiting review: $reviewable | awaiting ruling: $rulings | ready: $(ready_line) | signature: $sig"
  if [ "$myrev" != none ]; then echo "next: fix-review the landed rows you did not write, each as a diff from its shelve: conditions via ledger.sh set, then ledger.sh review <id> rev= fix_rev=: $myrev"
  elif [ "$factual_u" = 0 ] && [ "$notready" = none ] && [ "$mycomp" = 0 ]; then echo "next: the set is finished (facts converged, every Bug and Restructure ready). Before reading your peer's composition, add or refresh yours (label=Composition cluster=<comma row ids, or none> claim=<joint effect, or nothing composes> decision=<check-in order or changed severity, or no change>), then ledger.sh handoff"
  elif [ "$mine" != "0" ]; then echo "next: work your queue (ledger.sh status), then ledger.sh handoff"
  elif [ "$u" != "0" ]; then echo "next: ledger.sh handoff, so your peer marks what awaits them"
  elif [ "$rulings" != none ]; then echo "next: rows $rulings await a ruling; the owner of each sets ruling='default: <option>' so the fixer proceeds, or the master brings the user's answer"
  elif [ "$fixable" != none ] || [ "$reviewable" != none ]; then echo "next: the fixer lands $fixable; the countersigner reviews $reviewable; nothing to mark until then"
  elif [ "$role" = countersigner ] && [ "$notready" != none ]; then echo "next: proposals not ready: $notready (ledger.sh status names the stage)"
  elif [ "$role" = countersigner ] && [ "$sig" = none ]; then echo "next: every proposal is ready: ledger.sh sign"
  elif [ "$role" = scribe ] && [ "$sig" != none ]; then echo "next: unconverged 0 and signed: ledger.sh converge"
  elif [ "$role" = scribe ]; then echo "next: unconverged 0, unsigned: ledger.sh handoff tells the countersigner what remains"
  else echo "next: unconverged 0 and signed; the scribe converges"; fi
}

# ---- commands -----------------------------------------------------------------------------------------------

cmd_init() {
  local cold=0 single=0 scribe="" joint="" route="" clusters="" names=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --cold) cold=1; shift;;
      --single) single=1; shift;;
      --scribe) scribe=${2:-}; shift 2;;
      --joint) joint=${2:-}; shift 2;;
      --route) route=${2:-}; shift 2;;
      --clusters) clusters=${2:-}; shift 2;;
      --names) names=${2:-}; shift 2;;
      *) die "unknown init option $1";;
    esac
  done
  [ -d "$DIR" ] || die "LEDGER_DIR $DIR does not exist"
  [ -f "$SCHEMA" ] || die "schema $SCHEMA missing"
  local c; for c in $clusters; do case "$c" in *,*|*\(*|*\)*) die "cluster name '$c' contains a comma or parenthesis; names are single tokens";; esac; done
  local db
  if [ $cold = 1 ]; then
    seat "init --cold"; db="$DIR/cold-$ME.db"
  elif [ $single = 1 ]; then
    seat "init --single"; [ "$ME" = A ] || die "a single-seat ledger is seat A: export LEDGER_ME=A"; db="$SHARED"; scribe="A"; [ -n "$joint" ] || joint="$DIR/report.md"
    case "$route" in review|diagnose) ;; *) die "init --single needs --route review|diagnose";; esac
  else
    db="$SHARED"
    case "$scribe" in A|B) ;; *) die "init needs --scribe A|B";; esac
    [ -n "$joint" ] || die "init needs --joint <joint report path>"
    case "$route" in review|diagnose) ;; *) die "init needs --route review|diagnose";; esac
    names_sql "$names" || exit 1
    [ -n "$NAMES_SQL" ] || die "init needs --names \"A=<agent> B=<agent> fixer=<agent> master=<agent>\", the agents notifications go to"
  fi
  [ -e "$db" ] && die "$db exists; a run directory is created fresh (deep.md, Run directory)"
  "$SQLITE" -bail -batch "$db" "PRAGMA journal_mode=WAL;" >/dev/null || die "cannot create $db"
  "$SQLITE" -bail -batch "$db" < "$SCHEMA" || die "schema load failed"
  if [ $cold = 0 ]; then
    local mode; if [ $single = 1 ]; then mode=single; else mode=two-family; fi
    local sql="INSERT INTO meta VALUES ('scribe', '$scribe'), ('joint_path', $(sqlstr "$joint")), ('route', '$route'), ('mode', '$mode'); ${NAMES_SQL:-}"
    local c; for c in $clusters; do sql="$sql INSERT INTO clusters VALUES ($(sqlstr "$c"));"; done
    run "$db" "$sql" >/dev/null || exit 1
    if [ "$(cd "$HERE" && pwd -P)" != "$(cd "$DIR/bin" 2>/dev/null && pwd -P)" ]; then mkdir -p "$DIR/bin" && cp "$HERE/ledger.sh" "$HERE/ledger.sql" "$DIR/bin/" && chmod +x "$DIR/bin/ledger.sh" || die "cannot pin the helper under $DIR/bin"; fi
    if [ $single = 1 ]; then echo "created $db: single seat A, route $route, report $joint, clusters: ${clusters:-none declared}. Add rows, then ledger.sh report."
    else echo "created $db: scribe $scribe, route $route, joint report $joint, clusters: ${clusters:-none declared}"; fi
    echo "pinned helper: $DIR/bin/ledger.sh (every command in this run uses it)"
  else
    echo "created $db"
  fi
}

cmd_add() {
  seat add
  local db; db=$(db_for_me) || exit 1; check_version "$db"
  local arg is_comp=0
  for arg in "$@"; do [ "$arg" = label=Composition ] && is_comp=1; done
  [ $is_comp = 0 ] || [ "$db" = "$SHARED" ] || die "Composition is written in the shared ledger after the factual rows converge"
  parse_kv "$ADD_COLS" "$@"
  require_col label; require_col step; require_col claim
  local f0="" r0=""; if [ "$db" = "$SHARED" ]; then f0=$(ids_of "fixable WHERE id IN (SELECT id FROM proposals WHERE gating)"); r0=$(ids_of awaiting_ruling); fi
  local id; id=$(run "$db" "INSERT INTO ledger (owner, last_editor, $COLS) VALUES ('$ME', '$ME', $VALS); SELECT last_insert_rowid();") || exit 1
  echo "added row $id"
  [ "$db" = "$SHARED" ] && announce_stage_changes "$f0" "$r0"
  next_step "$db"
}

do_set() { # do_set <id> k=v ...  (shared by set, reject, contest, dup)
  local id=$1; shift
  is_int "$id" || die "row id must be an integer, got '$id'"
  local db; db=$(db_for_me) || exit 1; check_version "$db"
  parse_kv "$SET_COLS" "$@"
  [ -n "$SETS" ] || die "nothing to set"
  local f0="" r0=""; if [ "$db" = "$SHARED" ]; then f0=$(ids_of "fixable WHERE id IN (SELECT id FROM proposals WHERE gating)"); r0=$(ids_of awaiting_ruling); fi
  local n; n=$(run "$db" "UPDATE ledger SET $SETS, rev = rev + 1, last_editor = '$ME', agree_a = 0, agree_b = 0 WHERE id = $id; SELECT changes();") || exit 1
  [ "$n" = "1" ] || die "no row $id"
  echo "row $id: set by $ME (rev advanced, both marks cleared, any signature voided)"
  [ "$db" = "$SHARED" ] && announce_stage_changes "$f0" "$r0"
  next_step "$db"
}

cmd_set() { seat set; [ $# -ge 2 ] || die "usage: set <id> k=v ..."; do_set "$@"; }
cmd_reject() { seat reject; [ $# -ge 3 ] || die "usage: reject <id> verdict_step=N verdict=<why>"; local id=$1; shift; do_set "$id" status=withdrawn "$@"; }
cmd_contest() { seat contest; [ $# -ge 2 ] || die "usage: contest <id> probe=<the probe that settles it>"; local id=$1; shift; do_set "$id" status=contested "$@"; }
cmd_dup() {
  seat dup; [ $# -eq 2 ] || die "usage: dup <id> <of>"
  is_int "$2" || die "dup target must be a row id"
  local db; db=$(db_for_me) || exit 1
  [ "$db" = "$SHARED" ] || die "dup is a cross-examination verdict on a peer's row; before import, name every cluster a row dispositions in its cluster field (ledger.sh set <id> cluster=...) instead of adding a row per cluster"
  do_set "$1" status=dup dup_of="$2"
}

cmd_agree() {
  seat agree; [ $# -eq 1 ] || die "usage: agree <id>"
  is_int "$1" || die "row id must be an integer"
  local db; db=$(db_for_me) || exit 1; check_version "$db"
  local f0="" r0=""; if [ "$db" = "$SHARED" ]; then f0=$(ids_of "fixable WHERE id IN (SELECT id FROM proposals WHERE gating)"); r0=$(ids_of awaiting_ruling); fi
  local n; n=$(run "$db" "UPDATE ledger SET $(mark_col "$ME") = 1 WHERE id = $1; SELECT changes();") || exit 1
  [ "$n" = "1" ] || die "no row $1"
  echo "row $1: marked by $ME"
  [ "$db" = "$SHARED" ] && announce_stage_changes "$f0" "$r0"
  next_step "$db"
}

cmd_review() {
  seat review; two_family_only; [ $# -ge 3 ] || die "usage: review <id> rev=N fix_rev=M [note=<what the fix review checked>]"
  local id=$1; shift; is_int "$id" || die "row id must be an integer"
  local note="" rv="" fr=""; for a in "$@"; do case "$a" in note=*) note=${a#note=};; rev=*) rv=${a#rev=};; fix_rev=*) fr=${a#fix_rev=};; *) die "usage: review <id> rev=N fix_rev=M [note=...]";; esac; done
  is_int "$rv" && is_int "$fr" || die "review needs rev= and fix_rev=, the values you read with ledger.sh show $id"
  local db; db=$(db_for_me) || exit 1; check_version "$db"; [ "$db" = "$SHARED" ] || die "review is for the shared ledger"
  [ "$(run "$db" "SELECT count(*) FROM ledger WHERE id = $id AND owner = '$ME';")" = 0 ] || die "row $id is yours; the other seat reviews it"
  local n; n=$(run "$db" "UPDATE ledger SET reviewed_by = '$ME', reviewed_rev = rev, reviewed_fix_rev = fix_rev WHERE id = $id AND rev = $rv AND fix_rev = $fr AND label IN ('Bug','Restructure','Hardening','telemetry-quality'); SELECT changes();") || exit 1
  [ "$n" = "1" ] || die "row $id is not at rev $rv, fix_rev $fr (now $(run "$db" "SELECT 'rev ' || rev || ', fix_rev ' || fix_rev FROM ledger WHERE id = $id;")): read it again (ledger.sh show $id) before reviewing"
  [ -n "$note" ] && run "$db" "UPDATE events SET detail = coalesce(detail, '') || ': ' || $(sqlstr "$note") WHERE rowid = (SELECT max(rowid) FROM events WHERE row_id = $id AND kind = 'review');" >/dev/null
  echo "row $id: fix review recorded by $ME at revision $(run "$db" "SELECT rev || ', landing ' || fix_rev FROM ledger WHERE id = $id;"); ready: $(ready_line)"
  next_step "$db"
}

cmd_land() {
  fixer_or_seat land; [ $# -ge 3 ] || die "usage: land <id> rev=N shelve=<shelve id or patch path> green_run=<log> [red_run=<log>]"
  local id=$1; shift; is_int "$id" || die "row id must be an integer"
  [ -f "$SHARED" ] || die "no ledger at $SHARED"; check_version "$SHARED"
  local rv="" rest=() a; for a in "$@"; do case "$a" in rev=*) rv=${a#rev=};; *) rest+=("$a");; esac; done
  is_int "$rv" || die "land needs rev=, the row revision you built against (ledger.sh show $id)"
  parse_kv "$LAND_COLS" "${rest[@]}"
  require_col shelve; require_col green_run
  local sets="" k v; for a in "${rest[@]}"; do k=${a%%=*}; v=${a#*=}
    case "$k" in red_run|green_run) [ -z "$v" ] || v=$(log_path "$v") || exit 1;; esac
    [ -n "$v" ] && sets="$sets${sets:+, }$k = $(sqlstr "$v")"; done
  local n; n=$(run "$SHARED" "UPDATE ledger SET $sets, fix_rev = fix_rev + 1, landed_rev = rev, landed_by = '$ME' WHERE id = $id AND rev = $rv; SELECT changes();") || exit 1
  [ "$n" = "1" ] || die "row $id is not at rev $rv (now rev $(run "$SHARED" "SELECT rev FROM ledger WHERE id = $id;")): read it again and build against the current text"
  local fr; fr=$(run "$SHARED" "SELECT fix_rev FROM ledger WHERE id = $id;")
  echo "row $id: landed (rev $rv, fix_rev $fr)"
  is_single || notify "$(run "$SHARED" "SELECT CASE owner WHEN 'A' THEN 'B' ELSE 'A' END FROM ledger WHERE id = $id;")" "review: row #$id landed (rev $rv, fix_rev $fr): $(run "$SHARED" "SELECT 'shelve ' || shelve || ', red ' || coalesce(red_run, 'none (no seam)') || ', green ' || green_run FROM ledger WHERE id = $id;"). ledger.sh review $id rev=$rv fix_rev=$fr, conditions via set first."
  return 0
}

cmd_go() {
  master_or_seat go; [ $# -ge 1 ] || die "usage: go <id> [<id> ...]"
  [ -f "$SHARED" ] || die "no ledger at $SHARED"; check_version "$SHARED"
  local id ids="" ; for id in "$@"; do is_int "$id" || die "row ids are integers"; ids="$ids${ids:+,}$id"; done
  # rows sharing a shelve with a named row are approved together, or not at all
  local missing; missing=$(run "$SHARED" "SELECT coalesce(group_concat('#' || id, ' '), '') FROM ledger WHERE shelve IN (SELECT shelve FROM ledger WHERE id IN ($ids)) AND id NOT IN ($ids) AND status <> 'fixed';")
  [ -z "$missing" ] || die "rows $missing share a shelve with the named rows; name them too, or none"
  run "$SHARED" "BEGIN; INSERT INTO approvals (row_id, fix_rev, shelve, ts, by) SELECT id, fix_rev, shelve, strftime('%Y-%m-%dT%H:%M:%SZ','now'), '$ME' FROM ledger WHERE id IN ($ids); INSERT INTO events (who, kind, detail) VALUES ('$ME', 'go', 'rows $ids'); COMMIT;" >/dev/null || exit 1
  echo "approved at their landing: $(run "$SHARED" "SELECT group_concat('#' || row_id || ' (' || shelve || ')', ' ') FROM approvals WHERE row_id IN ($ids);")"
}

cmd_flag() {
  fixer_or_seat flag; [ $# -eq 2 ] || die "usage: flag <id> note=<fact from the tree>"
  local id=$1; shift; is_int "$id" || die "row id must be an integer"
  [ -f "$SHARED" ] || die "no ledger at $SHARED"; check_version "$SHARED"
  case "$1" in note=?*) ;; *) die "usage: flag <id> note=<fact from the tree>";; esac
  local note=${1#note=}; case "$note" in @*) note=$(cat "${note#@}");; esac
  local n; n=$(run "$SHARED" "SELECT count(*) FROM ledger WHERE id = $id;"); [ "$n" = "1" ] || die "no row $id"
  run "$SHARED" "INSERT INTO events (who, row_id, kind, detail) VALUES ('$ME', $id, 'flag', $(sqlstr "$note"));" >/dev/null || exit 1
  echo "row $id: flagged"
  is_single || notify scribe "flag: row #$id: $note"
}

cmd_close() {
  master_or_seat close; [ $# -eq 2 ] || die "usage: close <id> changeset=<id>"
  local id=$1; shift; is_int "$id" || die "row id must be an integer"
  [ -f "$SHARED" ] || die "no ledger at $SHARED"; check_version "$SHARED"
  case "$1" in changeset=?*) ;; *) die "usage: close <id> changeset=<id>";; esac
  local cs=${1#changeset=}
  local n; n=$(run "$SHARED" "UPDATE ledger SET status = 'fixed', changeset = $(sqlstr "$cs") WHERE id = $id AND status <> 'fixed'; SELECT changes();") || exit 1
  [ "$n" = "1" ] || die "no open row $id"
  echo "row $id: fixed in $cs (no revision, no mark; the signature stands)"
  local open; open=$(run "$SHARED" "SELECT count(*) FROM proposals;")
  echo "open proposals: $open"
  return 0
}

cmd_claim_probe() {
  seat claim-probe; [ $# -eq 1 ] || die "usage: claim-probe <id>"
  is_int "$1" || die "row id must be an integer"
  local db; db=$(db_for_me) || exit 1; check_version "$db"
  local out; out=$(run "$db" "UPDATE ledger SET probe_owner = '$ME' WHERE id = $1 AND probe_owner IS NULL; SELECT changes(); SELECT coalesce(probe_owner,'nobody') FROM ledger WHERE id = $1;") || exit 1
  set -- $out
  [ -n "${2:-}" ] || die "no row $1"
  if [ "$1" = "1" ]; then echo "yours"; else echo "taken by $2"; fi
}

cmd_import() {
  seat import; two_family_only
  local cold="$DIR/cold-$ME.db"
  [ -f "$cold" ] || die "no cold ledger $cold"
  [ -f "$SHARED" ] || die "no shared ledger $SHARED; the master creates it with ledger.sh init"
  check_version "$cold"; check_version "$SHARED"
  local already; already=$(run "$SHARED" "SELECT count(*) FROM imports WHERE seat = '$ME';") || exit 1
  [ "$already" = "0" ] || die "seat $ME already imported"
  run "$cold" "PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode=DELETE;" >/dev/null || exit 1
  local cols="label, cluster, site, claim, trigger, impact, decision, ruling, step, evidence_path, status, probe, verdict, verdict_step, origin_class, fix_shape, sites_walked, rulings_checked, test_seam, cost"
  local r0; r0=$(ids_of awaiting_ruling)
  local n; n=$(run "$SHARED" "ATTACH $(sqlstr "$cold") AS cold; BEGIN; INSERT INTO ledger (cold_id, owner, last_editor, rev, agree_a, agree_b, $cols) SELECT '$ME-' || id, owner, owner, 0, 0, 0, $cols FROM cold.ledger ORDER BY id; INSERT INTO imports (seat, ts, rows) VALUES ('$ME', strftime('%Y-%m-%dT%H:%M:%SZ','now'), (SELECT count(*) FROM cold.ledger)); INSERT INTO events (who, kind, detail) VALUES ('$ME', 'import', (SELECT count(*) FROM cold.ledger) || ' rows'); COMMIT; SELECT rows FROM imports WHERE seat = '$ME';") || exit 1
  chmod a-w "$cold"
  local peer_in; peer_in=$(run "$SHARED" "SELECT count(*) FROM imports WHERE seat = '$(other)';")
  echo "imported $n rows from seat $ME into $SHARED; cold ids are kept in cold_id."
  local await; await=$(run "$SHARED" "SELECT count(*) FROM ledger WHERE last_editor <> '$(other)' AND $(mark_col "$(other)") = 0;")
  notify peer "report ready: seat $ME imported $n rows into the shared ledger; $await rows await your mark. Run ledger.sh status and cross-examine."
  if [ "$peer_in" != "0" ]; then echo "your peer's rows are already in: continue straight into cross-examination"; fi
  announce_stage_changes "" "$r0"
  next_step "$SHARED"
}

cmd_handoff() {
  seat handoff; two_family_only
  local db; db=$(db_for_me) || exit 1; check_version "$db"
  [ "$db" = "$SHARED" ] || die "handoff is for the shared ledger; import first"
  local u factual_u mine peers role sig
  u=$(unconverged_count "$db"); factual_u=$(factual_unconverged_count "$db"); role=$(my_role); sig=$(signature_line)
  mine=$(run "$db" "SELECT count(*) FROM ledger WHERE last_editor <> '$ME' AND $(mark_col "$ME") = 0;")
  peers=$(run "$db" "SELECT count(*) FROM ledger WHERE last_editor = '$ME' AND $(mark_col "$(other)") = 0;")
  run "$db" "INSERT INTO events (who, kind, detail) VALUES ('$ME', 'handoff', 'unconverged $u, awaiting peer $peers, awaiting me $mine');" >/dev/null
  local msg="ledger: $peers rows await your mark, $mine await mine, unconverged $u."
  if [ "$factual_u" = "0" ] && [ "$(not_ready_line)" = none ]; then
    local comp peercomp; comp=$(composed_seats); peercomp=$(my_composition_count "$(other)")
    if [ "$role" = countersigner ] && [ "$sig" != none ]; then msg="$msg Signed: ledger.sh converge."
    elif [ "$peercomp" = 0 ]; then msg="$msg The set is finished: before reading the existing composition, add or refresh your own Composition row, then handoff."
    elif [ "$u" = 0 ] && [ "$role" = scribe ] && [ "$sig" = none ]; then msg="$msg Unconverged 0, ready and composed: ledger.sh sign."
    else msg="$msg Run ledger.sh status."; fi
  else msg="$msg Run ledger.sh status."; fi
  notify peer "$msg"
  next_step "$db"
}

cmd_sign() {
  seat sign; two_family_only
  [ -f "$SHARED" ] || die "no shared ledger"; check_version "$SHARED"
  [ "$(my_role)" != scribe ] || die "the scribe does not sign; the countersigner does"
  local n; n=$(run "$SHARED" "SELECT count(*) FROM imports;"); [ "$n" = "2" ] || die "both seats must have imported (imports: $n)"
  local u; u=$(unconverged_count "$SHARED"); [ "$u" = "0" ] || die "unconverged: $u; sign at 0"
  local unc; unc=$(uncovered_line); [ "$unc" = none ] || die "uncovered clusters: $unc; every cluster needs a factual row before signing"
  local notready; notready=$(not_ready_line); [ "$notready" = none ] || die "proposals not ready: $notready (fixable: $(fixable_line); awaiting review: $(reviewable_line); awaiting ruling: $(awaiting_ruling_line)); sign when every Bug and Restructure is landed and reviewed at that landing"
  local comp; comp=$(composed_seats); case "$comp" in *A*B*|*B*A*) ;; *) die "current Composition rows present from seats: $comp; each seat writes one before signing";; esac
  local note=""; for a in "$@"; do case "$a" in note=*) note=${a#note=}; case "$note" in @*) note=$(cat "${note#@}");; esac;; *) die "usage: sign [note=<fix review summary>]";; esac; done
  local joint; joint=$(meta joint_path)
  local h; h=$(notes_hash) || die "cannot hash A-notes.md and B-notes.md"
  validate_notes || exit 1
  run "$SHARED" "INSERT INTO signatures (seat, ts, note, notes_hash) VALUES ('$ME', strftime('%Y-%m-%dT%H:%M:%SZ','now'), $( [ -n "$note" ] && sqlstr "$note" || echo NULL ), '$h'); INSERT INTO events (who, kind, detail) VALUES ('$ME', 'sign', $( [ -n "$note" ] && sqlstr "$note" || echo NULL ));" >/dev/null || exit 1
  echo "signed by $ME"
  local msg="signed: $joint by seat $ME.${note:+ Fix review: $note} Scribe: ledger.sh converge."
  notify scribe "$msg"
  notify master "$msg"
}

render_to() { # render_to <path> [notes dir]: the render plus the available seat notes
  local out=$1 note_dir=${2:-$DIR}
  cmd_render > "$out" || exit 1
  local s
  for s in A B; do
    if [ -f "$note_dir/$s-notes.md" ]; then printf '\n## Seat %s notes\n\n' "$s" >> "$out"; cat "$note_dir/$s-notes.md" >> "$out"; fi
  done
}

cmd_converge() {
  seat converge; two_family_only
  [ -f "$SHARED" ] || die "no shared ledger"; check_version "$SHARED"
  [ "$(my_role)" = scribe ] || die "only the scribe converges (scribe: $(scribe_seat))"
  local u; u=$(unconverged_count "$SHARED"); [ "$u" = "0" ] || die "unconverged: $u; converge at 0"
  local unc; unc=$(uncovered_line); [ "$unc" = none ] || die "uncovered clusters: $unc; every cluster needs a row before the report"
  local sig; sig=$(signature_line); [ "$sig" != none ] || die "no countersignature; the countersigner runs ledger.sh sign first"
  local joint; joint=$(meta joint_path); [ -n "$joint" ] || die "no joint report path in meta"
  local stage; stage=$(mktemp -d "$DIR/.converge-notes.XXXXXX") || die "cannot stage the signed notes"
  cp "$DIR/A-notes.md" "$DIR/B-notes.md" "$stage/" 2>/dev/null || { rmdir "$stage" 2>/dev/null; die "A-notes.md and B-notes.md are required before convergence"; }
  local h; h=$(notes_hash "$stage") || { rm -f "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "cannot hash the staged seat notes"; }
  validate_notes "$stage" || { rm -f "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; exit 1; }
  local signed_h; signed_h=$(run "$SHARED" "SELECT coalesce(notes_hash, '') FROM signatures LIMIT 1;")
  [ "$h" = "$signed_h" ] || { rm -f "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "the seat notes changed since signing; the countersigner re-signs"; }
  local joint_dir tmp; joint_dir=$(dirname "$joint"); [ -d "$joint_dir" ] || { rm -f "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "joint report directory $joint_dir does not exist"; }
  tmp=$(mktemp "$joint_dir/.joint-report.XXXXXX") || { rm -f "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "cannot stage the joint report"; }
  (render_to "$tmp" "$stage") || { rm -f "$tmp" "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; exit 1; }
  local lines; lines=$(awk 'END { print NR }' "$tmp")
  local bound_note=""; [ "$lines" -le 300 ] || bound_note=" WARNING: over the 300-line bound; move detail into files referenced by path before the next converge"
  # Recheck after rendering. A concurrent content edit deletes the signature; a concurrent note edit changes its hash.
  u=$(unconverged_count "$SHARED"); [ "$u" = 0 ] || { rm -f "$tmp" "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "ledger changed while rendering (unconverged: $u); re-converge and re-sign"; }
  sig=$(signature_line); [ "$sig" != none ] || { rm -f "$tmp" "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "ledger changed while rendering and voided the countersignature"; }
  unc=$(uncovered_line); [ "$unc" = none ] || { rm -f "$tmp" "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "coverage changed while rendering: $unc"; }
  local live_h; live_h=$(notes_hash) || { rm -f "$tmp" "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "cannot re-hash the seat notes"; }
  [ "$live_h" = "$signed_h" ] || { rm -f "$tmp" "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "the seat notes changed while rendering; the countersigner re-signs"; }
  mv "$tmp" "$joint" || { rm -f "$tmp" "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"; die "cannot replace $joint"; }
  rm -f "$stage/A-notes.md" "$stage/B-notes.md"; rmdir "$stage"
  run "$SHARED" "INSERT INTO events (who, kind, detail) VALUES ('$ME', 'converge', '$lines lines');" >/dev/null
  echo "rendered $joint ($lines lines, $sig)$bound_note"
  notify master "converged: $joint. unconverged 0, $sig, $lines lines, ready for check-in: $(ready_line), awaiting ruling: $(awaiting_ruling_line).$bound_note Gate it."
}

cmd_report() {
  seat report
  local out=""
  while [ $# -gt 0 ]; do case "$1" in --out) out=${2:-}; shift 2;; *) die "unknown report option $1";; esac; done
  [ -f "$SHARED" ] || die "no ledger at $SHARED"; check_version "$SHARED"
  is_single || die "report is for a single-seat ledger; a two-family run converges"
  local inc; inc=$(incomplete_rows "$SHARED"); local unc; unc=$(uncovered_line)
  if [ -n "$inc" ] || [ "$unc" != none ]; then
    [ -n "$inc" ] && { echo "Bug or Restructure rows with empty slots:" >&2; echo "$inc" >&2; }
    [ "$unc" != none ] && echo "uncovered clusters: $unc" >&2
    die "report refused; fill the slots from the code and disposition every cluster, or withdraw and contest what you cannot close"
  fi
  [ -n "$out" ] || out=$(meta joint_path)
  render_to "$out"
  local lines; lines=$(wc -l < "$out" | tr -d ' ')
  echo "rendered $out ($lines lines)"
}

row_line="'  #' || id || ' [' || label || '] ' || status || ', step ' || step || ', rev ' || rev || ', last edit ' || last_editor || ': ' || substr(replace(claim, char(10), ' '), 1, 90)"

cmd_status() {
  if [ "$ME" = A ] || [ "$ME" = B ]; then
    local db; db=$(db_for_me) || exit 1; check_version "$db"
    if [ "$db" != "$SHARED" ]; then
      local n; n=$(run "$db" "SELECT count(*) FROM ledger;") || exit 1
      echo "seat $ME, phase: cold ($n rows in $db, not yet imported). When your report is done: ledger.sh import"
      [ -f "$SHARED" ] && echo "partition to disposition: $(run "$SHARED" "SELECT coalesce(group_concat(name, ' '), 'none declared') FROM clusters;")"
      return
    fi
    if is_single; then
      [ "$ME" = A ] || die "a single-seat ledger is seat A: export LEDGER_ME=A"
      echo "single seat $ME ($SHARED); route $(meta route); report $(meta joint_path); rows: $(run "$db" "SELECT count(*) FROM ledger;")"
      next_step "$db"; return
    fi
    local peer mycol; peer=$(other); mycol=$(mark_col "$ME")
    echo "seat $ME ($(my_role)), phase: shared ($SHARED); imports: $(imports_line "$db"); route $(meta route); joint report $(meta joint_path)"
    echo "awaiting your mark ($ME), Bug and Restructure first:"
    if composition_blind; then
      run "$db" "SELECT $row_line FROM ledger WHERE label <> 'Composition' AND last_editor <> '$ME' AND $mycol = 0 ORDER BY CASE label WHEN 'Bug' THEN 0 WHEN 'Restructure' THEN 1 ELSE 2 END, id;"
      echo "peer Composition rows are withheld until you submit your own"
    else
      run "$db" "SELECT $row_line FROM ledger WHERE last_editor <> '$ME' AND $mycol = 0 ORDER BY CASE label WHEN 'Bug' THEN 0 WHEN 'Restructure' THEN 1 ELSE 2 END, id;"
    fi
    echo "uncovered clusters: $(uncovered_line) | compositions from: $(composed_seats)"
    next_step "$db"
  elif [ "$ME" = fixer ]; then
    [ -f "$SHARED" ] || die "no ledger at $SHARED"
    check_version "$SHARED"
    echo "fixer ($SHARED); route $(meta route)"
    echo "fixable (write the seam's test, run it red, apply the fix, build and test green, shelve, ledger.sh land):"
    run "$SHARED" "SELECT $row_line FROM ledger WHERE id IN (SELECT id FROM fixable) ORDER BY id;"
    echo "awaiting review: $(reviewable_line) | ready for check-in: $(ready_line) | awaiting ruling: $(awaiting_ruling_line) | open proposals: $(run "$SHARED" "SELECT count(*) FROM proposals;")"
  else
    [ -f "$SHARED" ] || die "no ledger at $SHARED"
    check_version "$SHARED"
    echo "scribe: $(scribe_seat) | route: $(meta route) | joint report: $(meta joint_path) | agents: $(run "$SHARED" "SELECT coalesce(group_concat(substr(key, 6) || '=' || value, ' '), 'none') FROM meta WHERE key LIKE 'name_%';")"
    echo "imports: $(imports_line "$SHARED")"
    echo "rows: $(run "$SHARED" "SELECT count(*) || ' total, ' || coalesce(sum(status='verified'),0) || ' verified, ' || coalesce(sum(status='assumed'),0) || ' assumed, ' || coalesce(sum(status='finding'),0) || ' finding, ' || coalesce(sum(status='needs-ruling'),0) || ' needs-ruling, ' || coalesce(sum(status='contested'),0) || ' contested, ' || coalesce(sum(status='withdrawn'),0) || ' withdrawn, ' || coalesce(sum(status='dup'),0) || ' dup, ' || coalesce(sum(status='carried'),0) || ' carried, ' || coalesce(sum(status='fixed'),0) || ' fixed' FROM ledger;")"
    echo "uncovered clusters: $(uncovered_line)"
    echo "signature: $(signature_line) | compositions from: $(composed_seats)"
    echo "fixable: $(fixable_line) | flagged: $(run "$SHARED" "SELECT coalesce(group_concat('#' || id, ' '), 'none') FROM proposals WHERE flagged;") | awaiting review: $(reviewable_line) | awaiting ruling: $(awaiting_ruling_line) | ready for check-in: $(ready_line) | approved: $(run "$SHARED" "SELECT coalesce(group_concat('#' || a.row_id, ' '), 'none') FROM approvals a JOIN ledger l ON l.id = a.row_id AND l.fix_rev = a.fix_rev WHERE l.status <> 'fixed';")"
    echo "unconverged: $(unconverged_count "$SHARED")"
    run "$SHARED" "SELECT $row_line FROM ledger WHERE id IN (SELECT id FROM unconverged) ORDER BY id;"
  fi
}

cmd_show() {
  [ $# -eq 1 ] || die "usage: show <id>"; is_int "$1" || die "row id must be an integer"
  local db
  if [ "$ME" = A ] || [ "$ME" = B ]; then db=$(db_for_me) || exit 1; else db="$SHARED"; fi
  [ -f "$db" ] || die "no ledger at $db"
  local n; n=$(run "$db" "SELECT count(*) FROM ledger WHERE id = $1;"); [ "$n" = "1" ] || die "no row $1"
  if [ "$db" = "$SHARED" ] && composition_blind && [ "$(run "$db" "SELECT count(*) FROM ledger WHERE id = $1 AND label = 'Composition' AND owner <> '$ME';")" = 1 ]; then
    die "peer Composition rows are withheld until you submit your own"
  fi
  local cols="id cold_id owner last_editor rev label cluster site claim trigger impact decision ruling step evidence_path status probe probe_owner dup_of verdict verdict_step origin_class fix_shape sites_walked rulings_checked test_seam cost fix_rev landed_rev landed_by shelve red_run green_run changeset reviewed_by reviewed_rev reviewed_fix_rev agree_a agree_b" c sql=""
  for c in $cols; do sql="$sql${sql:+ || }CASE WHEN $c IS NULL THEN '' ELSE '$c: ' || $c || char(10) END"; done
  run "$db" "SELECT $sql FROM ledger WHERE id = $1;"
  echo "events:"
  run "$db" "SELECT '  ' || ts || ' ' || who || ' ' || kind || ' ' || coalesce(detail, '') FROM events WHERE row_id = $1 ORDER BY rowid;"
}

cmd_render() {
  local route=""
  while [ $# -gt 0 ]; do case "$1" in --route) route=${2:-}; shift 2;; *) die "unknown render option $1";; esac; done
  [ -f "$SHARED" ] || die "no ledger at $SHARED"
  check_version "$SHARED"
  composition_blind && die "peer Composition rows are withheld until you submit your own"
  [ -n "$route" ] || route=$(meta route)
  case "$route" in review|diagnose) ;; *) die "render needs a route: init --route, or render --route review|diagnose";; esac
  run "$SHARED" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null
  local e="coalesce(nullif(trim(%s),''), '(empty)')"
  local title="'### #' || id || ' [' || label || '] ' || coalesce(site, '') || ' — ' || substr(replace(claim, char(10), ' '), 1, 160)"
  echo "# Joint report: $route"
  echo
  local sig_text; if is_single; then sig_text="Single seat, no countersignature"; else sig_text="Countersignature: $(signature_line)"; fi
  local tail_counts; if is_single; then tail_counts="''"; else tail_counts="' | unconverged ' || (SELECT count(*) FROM unconverged) || ' | ready ' || (SELECT count(*) FROM ready)"; fi
  echo "Rendered from \`ledger.db\`; every number below lives in the row cited. Rows: $(run "$SHARED" "SELECT count(*) || ' total | verified ' || coalesce(sum(status='verified'),0) || ' | assumed ' || coalesce(sum(status='assumed'),0) || ' | finding ' || coalesce(sum(status='finding'),0) || ' | needs-ruling ' || coalesce(sum(status='needs-ruling'),0) || ' | contested ' || coalesce(sum(status='contested'),0) || ' | withdrawn ' || coalesce(sum(status='withdrawn'),0) || ' | dup ' || coalesce(sum(status='dup'),0) || ' | accepted ' || coalesce(sum(status='accepted'),0) || ' | carried ' || coalesce(sum(status='carried'),0) || ' | fixed ' || coalesce(sum(status='fixed'),0) || $tail_counts FROM ledger;"). Imports: $(run "$SHARED" "SELECT coalesce(group_concat(seat || '=' || rows, ', '), 'none') FROM imports;"). $sig_text."
  echo; echo "## Coverage"; echo
  if [ "$(run "$SHARED" "SELECT count(*) FROM clusters;")" != "0" ]; then
    echo "| Cluster | Rows |"; echo "|---|---|"
    run "$SHARED" "SELECT '| ' || c.name || ' | ' || coalesce((SELECT group_concat('#' || l.id || ' ' || l.status, ', ') FROM ledger l JOIN factual_cluster_tokens t ON t.id = l.id WHERE t.cluster = c.name), '(uncovered)') || ' |' FROM clusters c ORDER BY c.name;"
  else
    echo "| Cluster field | Rows |"; echo "|---|---|"
    run "$SHARED" "SELECT '| ' || coalesce(cluster, '(none)') || ' | ' || group_concat('#' || id || ' ' || status, ', ') || ' |' FROM ledger GROUP BY cluster ORDER BY cluster;"
  fi
  echo; echo "## Findings"; echo
  run "$SHARED" "SELECT $title || char(10)
    || '- Status: ' || status || ', certainty step ' || step || ', evidence: ' || $(printf "$e" evidence_path) || char(10)
    || '- Clusters: ' || $(printf "$e" cluster) || char(10)
    || '- Trigger: ' || $(printf "$e" trigger) || char(10)
    || '- User impact: ' || $(printf "$e" impact) || char(10)
    || '- Proposal: origin ' || $(printf "$e" origin_class) || '; shape: ' || $(printf "$e" fix_shape) || char(10)
    || '- Sites walked: ' || $(printf "$e" sites_walked) || char(10)
    || '- Rulings, docs and tests checked: ' || $(printf "$e" rulings_checked) || char(10)
    || '- Regression test and seam: ' || $(printf "$e" test_seam) || char(10)
    || '- Cost: ' || $(printf "$e" cost) || char(10)
    || '- Decision: ' || $(printf "$e" decision) || char(10)
    || CASE WHEN status = 'needs-ruling' THEN '- Ruling: ' || coalesce(ruling, '(awaiting the owner; no default stated)') || char(10) ELSE '' END
    || CASE WHEN shelve IS NULL THEN '' ELSE '- Landed: ' || shelve || ' (fix_rev ' || fix_rev || '); red: ' || coalesce(red_run, 'none (no seam)') || '; green: ' || green_run || char(10) END
    FROM ledger WHERE label IN ('Bug','Restructure') AND status IN ('finding','verified','assumed','needs-ruling')
    ORDER BY CASE label WHEN 'Bug' THEN 0 ELSE 1 END, id;"
  echo "## Composition"; echo
  run "$SHARED" "SELECT '- #' || id || ' composes ' || cluster || ' (' || status || ', step ' || step || ', by ' || owner || '): ' || replace(claim, char(10), ' ') || char(10) || '  Decision: ' || $(printf "$e" decision) FROM current_compositions ORDER BY id;"
  echo; echo "## Hardening, nits, and telemetry quality"; echo
  run "$SHARED" "SELECT '- #' || id || ' [' || label || '] ' || coalesce(site || ' — ', '') || substr(replace(claim, char(10), ' '), 1, 200) || ' (' || status || ', step ' || step || '; ' || $(printf "$e" decision) || ')' FROM ledger WHERE label NOT IN ('Bug','Restructure','Composition') AND status IN ('finding','verified','assumed','needs-ruling','accepted') ORDER BY id;"
  echo; echo "## Contested, carried with probes"; echo
  run "$SHARED" "SELECT '- #' || id || ' [' || label || '] ' || coalesce(site || ' — ', '') || substr(replace(claim, char(10), ' '), 1, 200) || char(10) || '  Probe: ' || $(printf "$e" probe) || ' (owner: ' || coalesce(probe_owner, 'unclaimed') || '). Axis: ' || $(printf "$e" decision) || CASE WHEN label IN ('Bug','Restructure') THEN char(10) || '  Trigger: ' || $(printf "$e" trigger) || char(10) || '  User impact: ' || $(printf "$e" impact) || char(10) || '  Proposal: origin ' || $(printf "$e" origin_class) || '; shape: ' || $(printf "$e" fix_shape) ELSE '' END FROM ledger WHERE status = 'contested' ORDER BY id;"
  echo; echo "## Dispositions"; echo
  run "$SHARED" "SELECT '- #' || id || ' withdrawn (step ' || coalesce(verdict_step, '?') || ' by ' || last_editor || '): ' || substr(replace(coalesce(verdict,''), char(10), ' '), 1, 200) || ' — ' || substr(replace(claim, char(10), ' '), 1, 100) FROM ledger WHERE status = 'withdrawn' ORDER BY id;"
  run "$SHARED" "SELECT '- #' || id || ' dup of #' || dup_of || ' — ' || substr(replace(claim, char(10), ' '), 1, 100) FROM ledger WHERE status = 'dup' ORDER BY id;"
  run "$SHARED" "SELECT '- #' || id || ' [' || label || '] carried out of the round: ' || substr(replace(coalesce(decision,''), char(10), ' '), 1, 200) || ' — ' || substr(replace(claim, char(10), ' '), 1, 100) FROM ledger WHERE status = 'carried' ORDER BY id;"
  echo; echo "## Rulings queue"; echo
  run "$SHARED" "SELECT coalesce((SELECT group_concat('- #' || id || ' [' || label || '] ' || substr(replace(claim, char(10), ' '), 1, 120) || char(10) || '  Question: ' || $(printf "$e" decision) || char(10) || '  Proceeding under: ' || coalesce(ruling, 'nothing; the fixer waits'), char(10)) FROM ledger WHERE status = 'needs-ruling'), 'No ruling pending.');"
  echo; echo "## Fixed"; echo
  run "$SHARED" "SELECT '- #' || id || ' [' || label || '] ' || coalesce(site || ' — ', '') || substr(replace(claim, char(10), ' '), 1, 120) || ' (' || changeset || ')' FROM ledger WHERE status = 'fixed' ORDER BY id;"
  echo; echo "## Fix table"; echo; echo "Check-in starts on the user's go, from the ready rows and nothing else."; echo; echo "| Row | Label | Status | Stage | Shelve | Shape | Seam | Decision |"; echo "|---|---|---|---|---|---|---|---|"
  run "$SHARED" "SELECT '| #' || l.id || ' | ' || l.label || ' | ' || l.status || ' | ' || CASE WHEN l.status = 'fixed' THEN 'done' WHEN l.status = 'contested' THEN 'gated on probe' WHEN EXISTS (SELECT 1 FROM approvals a WHERE a.row_id = l.id AND a.fix_rev = l.fix_rev) THEN 'approved' WHEN l.id IN (SELECT id FROM ready) THEN 'ready' WHEN l.id IN (SELECT id FROM reviewable) THEN 'awaiting review' WHEN l.id IN (SELECT id FROM fixable) THEN 'fixable' WHEN l.id IN (SELECT id FROM proposals WHERE flagged) THEN 'flagged' WHEN l.id IN (SELECT id FROM awaiting_ruling) THEN 'awaiting ruling' ELSE 'open' END || ' | ' || coalesce(l.shelve, '') || ' | ' || substr(replace($(printf "$e" l.fix_shape), char(10), ' '), 1, 80) || ' | ' || substr(replace($(printf "$e" l.test_seam), char(10), ' '), 1, 60) || ' | ' || substr(replace($(printf "$e" l.decision), char(10), ' '), 1, 120) || ' |' FROM ledger l WHERE l.label IN ('Bug','Restructure','Hardening','telemetry-quality') AND l.status IN ('finding','verified','assumed','needs-ruling','contested','fixed') ORDER BY CASE l.status WHEN 'fixed' THEN 1 ELSE 0 END, CASE l.label WHEN 'Bug' THEN 0 WHEN 'Restructure' THEN 1 ELSE 2 END, l.id;"
  is_single && return 0
  echo; echo "## Convergence"; echo
  run "$SHARED" "SELECT 'agreed ' || coalesce(sum(status NOT IN ('contested','withdrawn','dup')),0) || ' | contested ' || coalesce(sum(status='contested'),0) || ' | withdrawn ' || coalesce(sum(status='withdrawn'),0) || ' | dup ' || coalesce(sum(status='dup'),0) || ' | fixed ' || coalesce(sum(status='fixed'),0) || ' | unconverged ' || (SELECT count(*) FROM unconverged) FROM ledger;"
  local note; note=$(run "$SHARED" "SELECT coalesce((SELECT 'Countersignature by ' || seat || ' at ' || ts || coalesce('. Fix review: ' || note, '') FROM signatures LIMIT 1), 'No countersignature yet.');")
  echo; echo "$note"
}

cmd_log() {
  local db where=""
  if [ "$ME" = A ] || [ "$ME" = B ]; then db=$(db_for_me) || exit 1; else db="$SHARED"; fi
  [ -f "$db" ] || die "no ledger at $db"
  [ "$db" != "$SHARED" ] || ! composition_blind || die "peer Composition rows are withheld until you submit your own; log is disabled during the blind composition step"
  if [ $# -ge 1 ]; then is_int "$1" || die "row id must be an integer"; where="WHERE row_id = $1"; fi
  run "$db" "SELECT ts || ' ' || who || ' ' || kind || coalesce(' #' || row_id, '') || ' ' || coalesce(detail, '') FROM events $where ORDER BY rowid;"
}

cmd_query() {
  [ $# -eq 1 ] || die "usage: query \"<select>\""
  local db
  if [ "$ME" = A ] || [ "$ME" = B ]; then db=$(db_for_me) || exit 1; else db="$SHARED"; fi
  [ -f "$db" ] || die "no ledger at $db"
  [ "$db" != "$SHARED" ] || ! composition_blind || die "peer Composition rows are withheld until you submit your own; query is disabled during the blind composition step"
  [ -f "$db-shm" ] || [ ! -w "$db" ] || "$SQLITE" -batch -cmd ".timeout 5000" "$db" "SELECT 1;" >/dev/null 2>&1   # a WAL database opens read-only only with its -shm present
  "$SQLITE" -readonly -batch -cmd ".timeout 5000" -header -column "$db" "$1"
}

cmd_migrate() { # rebuild a schema-v1..4 shared ledger under the current schema; roles and partition come from the flags
  local scribe="" joint="" route="" clusters="" names=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --scribe) scribe=${2:-}; shift 2;; --joint) joint=${2:-}; shift 2;; --route) route=${2:-}; shift 2;; --clusters) clusters=${2:-}; shift 2;; --names) names=${2:-}; shift 2;;
      *) die "unknown migrate option $1";;
    esac
  done
  names_sql "$names" || exit 1
  case "$scribe" in A|B) ;; *) die "migrate needs --scribe A|B";; esac
  [ -n "$joint" ] || die "migrate needs --joint <joint report path>"
  case "$route" in review|diagnose) ;; *) die "migrate needs --route review|diagnose";; esac
  [ -f "$SHARED" ] || die "no ledger at $SHARED"
  local v; v=$("$SQLITE" -batch -cmd ".timeout 5000" "$SHARED" "PRAGMA user_version;")
  case "$v" in 1|2|3|4|5|6|7) ;; *) die "$SHARED is schema version '$v'; migrate handles versions 1 to 7";; esac
  local cold seat_name cold_v imported
  for seat_name in A B; do
    cold="$DIR/cold-$seat_name.db"
    [ -f "$cold" ] || continue
    imported=$("$SQLITE" -batch -cmd ".timeout 5000" "$SHARED" "SELECT count(*) FROM imports WHERE seat='$seat_name';" 2>/dev/null || echo 0)
    cold_v=$("$SQLITE" -batch -cmd ".timeout 5000" "$cold" "PRAGMA user_version;" 2>/dev/null)
    if [ "$imported" = 0 ] && [ "$cold_v" != "$SCHEMA_VERSION" ]; then
      die "unimported cold-$seat_name.db is schema ${cold_v:-unknown}; finish that live run with its pinned helper or start a fresh run before migrating the shared ledger"
    fi
  done
  local new="$SHARED.v$SCHEMA_VERSION" old="$DIR/ledger.v$v.db"
  rm -f "$new"
  "$SQLITE" -bail -batch "$new" "PRAGMA journal_mode=WAL;" >/dev/null && "$SQLITE" -bail -batch "$new" < "$SCHEMA" || die "schema load failed"
  local have; have=" $("$SQLITE" -batch "$SHARED" "SELECT group_concat(name, ' ') FROM pragma_table_info('ledger');") "
  pick() { case "$have" in *" $1 "*) echo "$1";; *) echo "${2:-NULL}";; esac; }   # source column, or a default
  local cost_expr; cost_expr=$(pick cost "CASE WHEN label IN ('Bug','Restructure') THEN 'unstated: migrated from schema $v; state it from the code before the fix round' ELSE NULL END")
  local changeset_expr; changeset_expr=$(pick changeset)
  local ruling_expr shelve_expr red_expr green_expr; ruling_expr=$(pick ruling); shelve_expr=$(pick shelve); red_expr=$(pick red_run); green_expr=$(pick green_run)
  local fix_rev_expr landed_rev_expr landed_by_expr; fix_rev_expr=$(pick fix_rev 0); landed_rev_expr=$(pick landed_rev); landed_by_expr=$(pick landed_by)
  local triggers; triggers=$("$SQLITE" -batch "$new" "SELECT sql || ';' FROM sqlite_master WHERE type = 'trigger' ORDER BY name;")
  local drops; drops=$("$SQLITE" -batch "$new" "SELECT 'DROP TRIGGER ' || name || ';' FROM sqlite_master WHERE type = 'trigger' ORDER BY name;")
  local sql="ATTACH $(sqlstr "$SHARED") AS old; BEGIN; $drops
    INSERT INTO ledger (id, cold_id, owner, last_editor, rev, label, cluster, site, claim, trigger, impact, decision, ruling, step, evidence_path, status, probe, probe_owner, dup_of, verdict, verdict_step, origin_class, fix_shape, sites_walked, rulings_checked, test_seam, cost, changeset, fix_rev, landed_rev, landed_by, shelve, red_run, green_run, agree_a, agree_b)
      SELECT id, cold_id, owner, last_editor, rev, label,
        CASE WHEN label = 'Composition' THEN coalesce(nullif(trim(cluster), ''), 'none') ELSE cluster END,
        site, claim, trigger, impact,
        CASE WHEN label = 'Composition' AND length(trim(coalesce(decision, ''))) = 0 THEN 'migration invalidated this composition; recompute it from the converged facts'
             WHEN status = 'contested' AND label IN ('Bug','Restructure') AND length(trim(coalesce(decision, ''))) = 0 THEN 'unstated: migrated; state the probe outcome axis before convergence'
             ELSE decision END,
        CASE WHEN $ruling_expr IS NULL OR $ruling_expr LIKE 'ruled:%' OR $ruling_expr LIKE 'default:%' THEN $ruling_expr ELSE 'ruled: ' || $ruling_expr END,
        step, evidence_path,
        CASE WHEN label = 'Composition' THEN 'withdrawn'
             WHEN status = 'accepted' AND (label <> 'Nit' OR length(trim(coalesce(decision, ''))) = 0) THEN 'finding'
             WHEN status = 'fixed' AND (coalesce($changeset_expr, '') LIKE 'pending:%' OR $changeset_expr IS NULL) THEN 'finding'
             ELSE status END,
        CASE WHEN status = 'contested' AND length(trim(coalesce(probe, ''))) = 0 THEN 'unstated: migrated; name the settling probe' ELSE probe END,
        probe_owner, dup_of,
        CASE WHEN label = 'Composition' THEN 'schema migration invalidated prior composition; each seat recomputes it after factual convergence' ELSE verdict END,
        CASE WHEN label = 'Composition' THEN coalesce(verdict_step, 2) ELSE verdict_step END,
        origin_class, fix_shape, sites_walked, rulings_checked,
        CASE WHEN test_seam IS NULL OR test_seam LIKE 'exists:%' OR test_seam LIKE 'new:%' OR test_seam LIKE 'none:%' THEN test_seam ELSE 'new: ' || test_seam END,
        $cost_expr,
        CASE WHEN status = 'fixed' AND coalesce($changeset_expr, '') LIKE 'pending:%' THEN NULL ELSE $changeset_expr END,
        $fix_rev_expr,
        CASE WHEN status = 'fixed' AND label <> 'Nit' AND coalesce($changeset_expr, '') NOT LIKE 'pending:%' AND $changeset_expr IS NOT NULL THEN rev ELSE $landed_rev_expr END,
        CASE WHEN status = 'fixed' AND label <> 'Nit' AND coalesce($changeset_expr, '') NOT LIKE 'pending:%' AND $changeset_expr IS NOT NULL THEN coalesce($landed_by_expr, 'migrated') ELSE $landed_by_expr END,
        CASE WHEN status = 'fixed' AND label <> 'Nit' AND coalesce($changeset_expr, '') NOT LIKE 'pending:%' AND $changeset_expr IS NOT NULL THEN coalesce($shelve_expr, 'migrated: ' || $changeset_expr) ELSE $shelve_expr END,
        CASE WHEN status = 'fixed' AND label <> 'Nit' AND coalesce($changeset_expr, '') NOT LIKE 'pending:%' AND $changeset_expr IS NOT NULL AND coalesce(test_seam, '') NOT LIKE 'none:%' THEN coalesce($red_expr, 'migrated: not recorded') ELSE $red_expr END,
        CASE WHEN status = 'fixed' AND label <> 'Nit' AND coalesce($changeset_expr, '') NOT LIKE 'pending:%' AND $changeset_expr IS NOT NULL THEN coalesce($green_expr, 'migrated: not recorded') ELSE $green_expr END,
        CASE WHEN label = 'Composition'
          OR (status = 'accepted' AND (label <> 'Nit' OR length(trim(coalesce(decision, ''))) = 0))
          OR ((status IN ('finding','verified','assumed','needs-ruling','contested') OR (status = 'fixed' AND (coalesce($changeset_expr, '') LIKE 'pending:%' OR $changeset_expr IS NULL)))
          AND label IN ('Bug','Restructure')
          AND (length(trim(coalesce(trigger, ''))) = 0 OR length(trim(coalesce(impact, ''))) = 0 OR origin_class IS NULL
            OR length(trim(coalesce(fix_shape, ''))) = 0 OR length(trim(coalesce(sites_walked, ''))) = 0
            OR length(trim(coalesce(rulings_checked, ''))) = 0 OR length(trim(coalesce(test_seam, ''))) = 0
            OR length(trim(coalesce($cost_expr, ''))) = 0)) THEN 0 ELSE agree_a END,
        CASE WHEN label = 'Composition'
          OR (status = 'accepted' AND (label <> 'Nit' OR length(trim(coalesce(decision, ''))) = 0))
          OR ((status IN ('finding','verified','assumed','needs-ruling','contested') OR (status = 'fixed' AND (coalesce($changeset_expr, '') LIKE 'pending:%' OR $changeset_expr IS NULL)))
          AND label IN ('Bug','Restructure')
          AND (length(trim(coalesce(trigger, ''))) = 0 OR length(trim(coalesce(impact, ''))) = 0 OR origin_class IS NULL
            OR length(trim(coalesce(fix_shape, ''))) = 0 OR length(trim(coalesce(sites_walked, ''))) = 0
            OR length(trim(coalesce(rulings_checked, ''))) = 0 OR length(trim(coalesce(test_seam, ''))) = 0
            OR length(trim(coalesce($cost_expr, ''))) = 0)) THEN 0 ELSE agree_b END
        FROM old.ledger ORDER BY id;
    INSERT INTO meta (key, value) SELECT 'mode', 'two-family' WHERE NOT EXISTS (SELECT 1 FROM meta WHERE key = 'mode');
    INSERT INTO imports SELECT * FROM old.imports;
    INSERT INTO events (ts, who, row_id, kind, detail) SELECT ts, who, row_id, kind, detail FROM old.events ORDER BY rowid;
    INSERT INTO meta VALUES ('scribe', '$scribe'), ('joint_path', $(sqlstr "$joint")), ('route', '$route'); ${NAMES_SQL:-}"
  local c; for c in $clusters; do sql="$sql INSERT INTO clusters VALUES ($(sqlstr "$c"));"; done
  sql="$sql COMMIT; $triggers"
  run "$new" "$sql" >/dev/null || { rm -f "$new"; exit 1; }
  local n; n=$(run "$new" "SELECT (SELECT count(*) FROM ledger) || ' rows, ' || (SELECT count(*) FROM unconverged) || ' unconverged, ' || (SELECT count(*) FROM sqlite_master WHERE type='trigger') || ' triggers';")
  run "$new" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null
  mv "$SHARED" "$old"; rm -f "$SHARED-wal" "$SHARED-shm"; mv "$new" "$SHARED"; rm -f "$new-wal" "$new-shm"
  run "$SHARED" "SELECT 1;" >/dev/null
  mkdir -p "$DIR/bin" && cp "$HERE/ledger.sh" "$HERE/ledger.sql" "$DIR/bin/" && chmod +x "$DIR/bin/ledger.sh"
  echo "migrated $SHARED to schema $SCHEMA_VERSION ($n); the old file is $old; helper pinned under $DIR/bin. Unprefixed seams became 'new:', invalid accepted rows reopened, prior compositions were withdrawn for recomposition, incomplete Bug and Restructure rows were unmarked, fixed rows with a real changeset carry a placeholder landing, fixed rows with a pending changeset reopened as finding, and no proposal counts as landed or fix-reviewed until ledger.sh land and review record it."
}

cmd=${1:-}; [ $# -gt 0 ] && shift
case "$cmd" in
  migrate|add|set|reject|contest|dup|agree|claim-probe|review|land|flag|go|close|import|handoff|sign|converge|report) acquire_lock;;
esac
case "$cmd" in
  init) cmd_init "$@";;
  migrate) cmd_migrate "$@";;
  add) cmd_add "$@";;
  set) cmd_set "$@";;
  agree) cmd_agree "$@";;
  reject) cmd_reject "$@";;
  contest) cmd_contest "$@";;
  dup) cmd_dup "$@";;
  claim-probe) cmd_claim_probe "$@";;
  review) cmd_review "$@";;
  land) cmd_land "$@";;
  flag) cmd_flag "$@";;
  go) cmd_go "$@";;
  close) cmd_close "$@";;
  import) cmd_import "$@";;
  handoff) cmd_handoff "$@";;
  sign) cmd_sign "$@";;
  converge) cmd_converge "$@";;
  status) cmd_status "$@";;
  report) cmd_report "$@";;
  show) cmd_show "$@";;
  render) cmd_render "$@";;
  log) cmd_log "$@";;
  query) cmd_query "$@";;
  ''|-h|--help|help) usage;;
  *) die "unknown command '$cmd'; ledger.sh --help";;
esac
