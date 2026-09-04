-- The deep-run ledger. Loaded by `ledger.sh init`; the protocol in deep.md, as constraints.
-- Every protocol fact lives here: rows and marks, the seats' roles, the partition, the imports, the fix reviews,
-- the compositions, and the countersignature. Only syntax shared by sqlite3 3.31+ (no RETURNING, no JSON operators).
PRAGMA user_version = 5;

CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);          -- scribe, joint_path, route, mode
CREATE TABLE clusters (name TEXT PRIMARY KEY);                          -- the partition the master froze
CREATE TABLE imports (seat TEXT PRIMARY KEY, ts TEXT NOT NULL, rows INTEGER NOT NULL);
CREATE TABLE signatures (                                               -- the countersignature; any edit deletes it
  seat       TEXT PRIMARY KEY CONSTRAINT signer_is_seat CHECK (seat IN ('A','B')),
  ts         TEXT NOT NULL,
  note       TEXT,
  notes_hash TEXT                                                       -- sha256 over the seat notes files at signing
);

CREATE TABLE ledger (
  id              INTEGER PRIMARY KEY,
  cold_id         TEXT,                          -- '<seat>-<id>' in the cold ledger it came from
  owner           TEXT NOT NULL CONSTRAINT owner_is_seat CHECK (owner IN ('A','B')),
  last_editor     TEXT NOT NULL CONSTRAINT editor_is_seat CHECK (last_editor IN ('A','B')),
  rev             INTEGER NOT NULL DEFAULT 0,
  label           TEXT NOT NULL CONSTRAINT label_known
                  CHECK (label IN ('Bug','Restructure','Hardening','Nit','telemetry-quality','Composition')),
  cluster         TEXT,                          -- the clusters this row dispositions, comma separated; for a Composition, the row ids it composes
  site            TEXT,                          -- file:line
  claim           TEXT NOT NULL CONSTRAINT claim_nonempty CHECK (length(claim) > 0),
  trigger         TEXT,                          -- how the condition arises: cause, scope, rough frequency
  impact          TEXT,                          -- user impact
  decision        TEXT,                          -- the trade with recommendation; the axis of a contested fix shape; the reason a nit is accepted
  step            INTEGER NOT NULL CONSTRAINT step_range CHECK (step BETWEEN 1 AND 5),
  evidence_path   TEXT,
  status          TEXT NOT NULL DEFAULT 'finding' CONSTRAINT status_known
                  CHECK (status IN ('finding','verified','assumed','needs-ruling','contested','withdrawn','dup','fixed','accepted')),
  probe           TEXT,                          -- the probe that settles a contested row
  probe_owner     TEXT CONSTRAINT probe_owner_known CHECK (probe_owner IN ('A','B','master')),
  dup_of          INTEGER REFERENCES ledger(id),
  verdict         TEXT,                          -- why a row was withdrawn
  verdict_step    INTEGER CONSTRAINT verdict_step_range CHECK (verdict_step BETWEEN 2 AND 5),
  origin_class    TEXT CONSTRAINT origin_known
                  CHECK (origin_class IN ('attention-miss','self-consistency','design-absence')),
  fix_shape       TEXT,
  sites_walked    TEXT,
  rulings_checked TEXT,                          -- rulings, feature docs, and tests asserting today's behavior
  test_seam       TEXT,                          -- 'exists: <path>' | 'new: <what must be built>' | 'none: <the architecture finding>'
  cost            TEXT,                          -- from the code it touches: sites, risk, interface churn; never a guessed line count
  changeset       TEXT,                          -- the changeset that fixed it; 'pending: <summary>' until checked in
  reviewed_by     TEXT CONSTRAINT reviewer_is_seat CHECK (reviewed_by IN ('A','B')),
  reviewed_rev    INTEGER,                       -- the revision the fix review covered; a later edit needs a new review
  agree_a         INTEGER NOT NULL DEFAULT 0 CONSTRAINT agree_a_bool CHECK (agree_a IN (0,1)),
  agree_b         INTEGER NOT NULL DEFAULT 0 CONSTRAINT agree_b_bool CHECK (agree_b IN (0,1)),
  CONSTRAINT review_fields_are_a_pair CHECK ((reviewed_by IS NULL) = (reviewed_rev IS NULL)),
  CONSTRAINT verified_needs_step4_and_evidence CHECK (status <> 'verified' OR (step >= 4 AND evidence_path IS NOT NULL)),
  CONSTRAINT contested_needs_probe CHECK (status <> 'contested' OR length(trim(coalesce(probe, ''))) > 0),
  CONSTRAINT contested_proposal_needs_its_axis_in_decision CHECK (status <> 'contested' OR label NOT IN ('Bug','Restructure') OR length(trim(coalesce(decision, ''))) > 0),
  CONSTRAINT dup_needs_target CHECK (status <> 'dup' OR dup_of IS NOT NULL),
  CONSTRAINT fixed_needs_changeset CHECK (status <> 'fixed' OR changeset IS NOT NULL),
  CONSTRAINT accepted_is_for_nits_with_a_reason CHECK (status <> 'accepted' OR (label = 'Nit' AND length(trim(coalesce(decision, ''))) > 0)),
  CONSTRAINT withdrawn_needs_verdict_and_step CHECK (status <> 'withdrawn' OR (verdict IS NOT NULL AND verdict_step IS NOT NULL)),
  CONSTRAINT test_seam_starts_with_exists_new_or_none CHECK (test_seam IS NULL OR test_seam LIKE 'exists:%' OR test_seam LIKE 'new:%' OR test_seam LIKE 'none:%'),
  CONSTRAINT composition_names_rows_and_a_decision CHECK (label <> 'Composition' OR (length(trim(coalesce(cluster, ''))) > 0 AND length(trim(coalesce(decision, ''))) > 0)),
  CONSTRAINT bug_converges_only_with_trigger_impact_cost_and_slots CHECK (NOT (
      label IN ('Bug','Restructure')
      AND status IN ('finding','verified','assumed','needs-ruling','contested')
      AND ((last_editor = 'A' AND agree_b = 1) OR (last_editor = 'B' AND agree_a = 1))
      AND (length(trim(coalesce(trigger, ''))) = 0 OR length(trim(coalesce(impact, ''))) = 0 OR origin_class IS NULL
           OR length(trim(coalesce(fix_shape, ''))) = 0 OR length(trim(coalesce(sites_walked, ''))) = 0
           OR length(trim(coalesce(rulings_checked, ''))) = 0 OR length(trim(coalesce(test_seam, ''))) = 0
           OR length(trim(coalesce(cost, ''))) = 0)))
);

CREATE TABLE events (
  ts     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  who    TEXT NOT NULL,
  row_id INTEGER,
  kind   TEXT NOT NULL CHECK (kind IN ('add','edit','agree','probe','import','handoff','review','sign','converge')),
  detail TEXT
);

-- A new row is signed by its owner, at revision 0, unmarked. A new row also voids any countersignature.
CREATE TRIGGER add_is_signed BEFORE INSERT ON ledger
WHEN NEW.last_editor <> NEW.owner OR NEW.agree_a <> 0 OR NEW.agree_b <> 0 OR NEW.rev <> 0 OR NEW.reviewed_by IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'a new row is owned and last edited by you, rev 0, unmarked, unreviewed: use ledger.sh add'); END;

CREATE TRIGGER log_add AFTER INSERT ON ledger
BEGIN
  INSERT INTO events(who,row_id,kind,detail) VALUES (NEW.owner, NEW.id, 'add', NEW.label || ': ' || substr(NEW.claim,1,80));
  DELETE FROM signatures;
END;

CREATE TRIGGER owner_is_immutable BEFORE UPDATE OF owner ON ledger WHEN NEW.owner <> OLD.owner
BEGIN SELECT RAISE(ABORT, 'owner never changes'); END;

CREATE TRIGGER id_is_immutable BEFORE UPDATE OF id ON ledger WHEN NEW.id <> OLD.id
BEGIN SELECT RAISE(ABORT, 'id never changes'); END;

CREATE TRIGGER composition_label_is_immutable BEFORE UPDATE OF label ON ledger
WHEN (OLD.label = 'Composition') <> (NEW.label = 'Composition')
BEGIN SELECT RAISE(ABORT, 'a Composition is added as its own row and never converted to or from another label'); END;

-- A content edit advances rev, is signed by a seat, and clears both marks in the same statement.
CREATE TRIGGER content_edit_is_signed BEFORE UPDATE OF
  cold_id, label, cluster, site, claim, trigger, impact, decision, step, evidence_path, status, probe,
  dup_of, verdict, verdict_step, origin_class, fix_shape, sites_walked, rulings_checked, test_seam, cost, changeset ON ledger
WHEN NEW.rev <= OLD.rev OR NEW.agree_a <> 0 OR NEW.agree_b <> 0
BEGIN SELECT RAISE(ABORT, 'content edits go through ledger.sh set: rev advances, both marks clear, last_editor is you'); END;

-- Two cross-edits below step 4 end the argument: the next edit contests with a probe or lands step-4 evidence.
CREATE TRIGGER two_cycles_then_probe BEFORE UPDATE OF
  label, cluster, site, claim, trigger, impact, decision, step, evidence_path, status, probe,
  dup_of, verdict, verdict_step, origin_class, fix_shape, sites_walked, rulings_checked, test_seam, cost, changeset ON ledger
WHEN NEW.rev > OLD.rev
 AND NEW.last_editor <> NEW.owner
 AND NEW.status NOT IN ('contested','fixed','accepted','dup')
 AND (CASE WHEN NEW.status = 'withdrawn' THEN coalesce(NEW.verdict_step, NEW.step) ELSE NEW.step END) < 4
 AND (SELECT count(*) FROM events WHERE row_id = NEW.id AND kind = 'edit' AND who <> NEW.owner) >= 2
BEGIN SELECT RAISE(ABORT, 'two cycles spent on this row: contest it with a probe (ledger.sh contest) or land step-4 evidence'); END;

-- A dup points at a live row, never at itself, never at another dup, and a row others point at cannot become a dup.
CREATE TRIGGER dup_has_one_live_target BEFORE UPDATE OF status, dup_of ON ledger
WHEN NEW.status = 'dup' AND (
     NEW.dup_of = NEW.id
  OR (SELECT status FROM ledger WHERE id = NEW.dup_of) = 'dup'
  OR EXISTS (SELECT 1 FROM ledger WHERE dup_of = NEW.id AND status = 'dup' AND id <> NEW.id))
BEGIN SELECT RAISE(ABORT, 'a dup points at one live row: not itself, not another dup, and not while rows point at it; dup the newer row onto the surviving one'); END;

-- Composition starts only after the factual rows converge. `none` is the explicit nothing-composes row;
-- otherwise the comma tokens are live factual row ids. The helper withholds the peer's rows until both seats submit.
CREATE TRIGGER composition_waits_for_facts BEFORE INSERT ON ledger
WHEN NEW.label = 'Composition' AND EXISTS (SELECT 1 FROM unconverged WHERE label <> 'Composition')
BEGIN SELECT RAISE(ABORT, 'Composition starts after every factual row converges'); END;

CREATE TRIGGER composition_update_waits_for_facts BEFORE UPDATE ON ledger
WHEN NEW.rev > OLD.rev AND NEW.label = 'Composition' AND NEW.status NOT IN ('withdrawn','dup')
 AND EXISTS (SELECT 1 FROM unconverged WHERE label <> 'Composition')
BEGIN SELECT RAISE(ABORT, 'Composition resumes after every factual row converges'); END;

CREATE TRIGGER composition_references_live_facts AFTER INSERT ON ledger
WHEN NEW.label = 'Composition' AND lower(trim(NEW.cluster)) <> 'none'
BEGIN
  SELECT CASE WHEN EXISTS (
    WITH RECURSIVE parts(token, rest) AS (
      SELECT trim(substr(trim(NEW.cluster) || ',', 1, instr(trim(NEW.cluster) || ',', ',') - 1)),
             substr(trim(NEW.cluster) || ',', instr(trim(NEW.cluster) || ',', ',') + 1)
      UNION ALL
      SELECT trim(substr(rest, 1, instr(rest, ',') - 1)), substr(rest, instr(rest, ',') + 1)
      FROM parts WHERE rest <> ''
    )
    SELECT 1 FROM parts p LEFT JOIN ledger l ON l.id = CAST(p.token AS INTEGER)
    WHERE p.token = '' OR p.token GLOB '*[^0-9]*' OR CAST(p.token AS INTEGER) < 1
       OR l.id IS NULL OR l.label = 'Composition' OR l.status IN ('withdrawn','dup')
  ) THEN RAISE(ABORT, 'a Composition cluster is `none` or a comma list of live factual row ids') END;
END;

CREATE TRIGGER composition_update_references_live_facts AFTER UPDATE ON ledger
WHEN NEW.label = 'Composition' AND NEW.status NOT IN ('withdrawn','dup') AND lower(trim(NEW.cluster)) <> 'none'
BEGIN
  SELECT CASE WHEN EXISTS (
    WITH RECURSIVE parts(token, rest) AS (
      SELECT trim(substr(trim(NEW.cluster) || ',', 1, instr(trim(NEW.cluster) || ',', ',') - 1)),
             substr(trim(NEW.cluster) || ',', instr(trim(NEW.cluster) || ',', ',') + 1)
      UNION ALL
      SELECT trim(substr(rest, 1, instr(rest, ',') - 1)), substr(rest, instr(rest, ',') + 1)
      FROM parts WHERE rest <> ''
    )
    SELECT 1 FROM parts p LEFT JOIN ledger l ON l.id = CAST(p.token AS INTEGER)
    WHERE p.token = '' OR p.token GLOB '*[^0-9]*' OR CAST(p.token AS INTEGER) < 1
       OR l.id IS NULL OR l.label = 'Composition' OR l.status IN ('withdrawn','dup')
  ) THEN RAISE(ABORT, 'a Composition cluster is `none` or a comma list of live factual row ids') END;
END;

-- A content edit is logged and voids any countersignature: the signer stood by a ledger that no longer exists.
CREATE TRIGGER log_content_edit AFTER UPDATE OF
  cold_id, label, cluster, site, claim, trigger, impact, decision, step, evidence_path, status, probe,
  dup_of, verdict, verdict_step, origin_class, fix_shape, sites_walked, rulings_checked, test_seam, cost, changeset ON ledger
WHEN NEW.rev > OLD.rev
BEGIN
  INSERT INTO events(who,row_id,kind,detail) VALUES (NEW.last_editor, NEW.id, 'edit', 'rev ' || NEW.rev || ' status=' || NEW.status || ' step=' || NEW.step);
  DELETE FROM signatures;
END;

-- A mark is its own statement, and never the last editor's.
CREATE TRIGGER agree_is_the_others BEFORE UPDATE OF agree_a, agree_b ON ledger
WHEN (NEW.agree_a = 1 AND OLD.agree_a = 0 AND (OLD.last_editor = 'A' OR NEW.rev <> OLD.rev))
  OR (NEW.agree_b = 1 AND OLD.agree_b = 0 AND (OLD.last_editor = 'B' OR NEW.rev <> OLD.rev))
BEGIN SELECT RAISE(ABORT, 'you cannot agree a row you last edited; agree is its own statement (ledger.sh agree <id>)'); END;

CREATE TRIGGER marks_clear_only_with_an_edit BEFORE UPDATE OF agree_a, agree_b ON ledger
WHEN NEW.rev = OLD.rev AND ((NEW.agree_a = 0 AND OLD.agree_a = 1) OR (NEW.agree_b = 0 AND OLD.agree_b = 1))
BEGIN SELECT RAISE(ABORT, 'a mark is withdrawn only by a content edit (ledger.sh set), which advances the revision'); END;

CREATE TRIGGER log_agree AFTER UPDATE OF agree_a, agree_b ON ledger
WHEN (NEW.agree_a = 1 AND OLD.agree_a = 0) OR (NEW.agree_b = 1 AND OLD.agree_b = 0)
BEGIN INSERT INTO events(who,row_id,kind) VALUES (CASE WHEN NEW.agree_a > OLD.agree_a THEN 'A' ELSE 'B' END, NEW.id, 'agree'); END;

-- The designated countersigner reviews every proposal, at a converged current revision. The countersigner may
-- have written conditions into that revision; the review is independent from the final whole-ledger signature.
CREATE TRIGGER review_is_countersigners BEFORE UPDATE OF reviewed_by, reviewed_rev ON ledger
WHEN NEW.reviewed_by IS NOT NULL AND (
     NEW.reviewed_by = (SELECT value FROM meta WHERE key = 'scribe')
  OR NEW.reviewed_rev <> OLD.rev OR NEW.rev <> OLD.rev
  OR NOT ((OLD.last_editor = 'A' AND OLD.agree_b = 1) OR (OLD.last_editor = 'B' AND OLD.agree_a = 1)))
BEGIN SELECT RAISE(ABORT, 'a fix review is recorded by the countersigner after the row converges, at its current revision (ledger.sh review <id>)'); END;

CREATE TRIGGER log_review AFTER UPDATE OF reviewed_by ON ledger
WHEN NEW.reviewed_by IS NOT NULL
BEGIN INSERT INTO events(who,row_id,kind,detail) VALUES (NEW.reviewed_by, NEW.id, 'review', 'rev ' || NEW.reviewed_rev); END;

CREATE TRIGGER log_probe_claim AFTER UPDATE OF probe_owner ON ledger
WHEN NEW.probe_owner IS NOT NULL AND OLD.probe_owner IS NULL
BEGIN INSERT INTO events(who,row_id,kind) VALUES (NEW.probe_owner, NEW.id, 'probe'); END;

CREATE TRIGGER no_delete BEFORE DELETE ON ledger
BEGIN SELECT RAISE(ABORT, 'rows are withdrawn (ledger.sh reject) or accepted, never deleted'); END;

-- One convergence rule for every row, contested included: the mark of the peer who did not last edit it.
CREATE VIEW unconverged AS
  SELECT id, owner, last_editor, label, status, step, agree_a, agree_b FROM ledger
  WHERE NOT ((last_editor = 'A' AND agree_b = 1) OR (last_editor = 'B' AND agree_a = 1));

-- Exact comma-token coverage. A terminal numeric fraction such as `(5/6)` annotates a token; semicolons,
-- newlines, substrings, and non-terminal parentheses are not separators or annotations.
CREATE VIEW factual_cluster_tokens AS
WITH RECURSIVE split(id, token, rest) AS (
  SELECT id, '', replace(replace(replace(coalesce(cluster, ''), ' ', ','), char(9), ','), char(10), ',') || ',' FROM ledger WHERE label <> 'Composition'
  UNION ALL
  SELECT id, trim(substr(rest, 1, instr(rest, ',') - 1)), substr(rest, instr(rest, ',') + 1)
  FROM split WHERE rest <> ''
), shaped(id, token, suffix) AS (
  SELECT id, token,
         CASE WHEN token LIKE '%)' AND instr(token, '(') > 1
              THEN substr(token, instr(token, '(') + 1, length(token) - instr(token, '(') - 1) ELSE '' END
  FROM split WHERE token <> ''
)
SELECT id,
       CASE WHEN suffix <> '' AND suffix NOT GLOB '*[^0-9/]*' AND instr(suffix, '/') > 1
                  AND instr(substr(suffix, instr(suffix, '/') + 1), '/') = 0
                  AND substr(suffix, -1) GLOB '[0-9]'
            THEN trim(substr(token, 1, instr(token, '(') - 1)) ELSE token END AS cluster
FROM shaped;

CREATE VIEW uncovered_clusters AS
  SELECT c.name FROM clusters c
  WHERE NOT EXISTS (SELECT 1 FROM factual_cluster_tokens t WHERE t.cluster = c.name);

-- A composition is current only when its latest content event follows the latest factual content event.
-- A later fact therefore reopens composition without a generation counter.
CREATE VIEW current_compositions AS
  SELECT l.* FROM ledger l
  WHERE l.label = 'Composition' AND l.status NOT IN ('withdrawn','dup')
    AND coalesce((SELECT max(e.rowid) FROM events e WHERE e.row_id = l.id AND e.kind IN ('add','edit')), 0)
        > coalesce((SELECT max(e.rowid) FROM events e JOIN ledger f ON f.id = e.row_id
                    WHERE f.label <> 'Composition' AND e.kind IN ('add','edit')), 0);

-- Open proposals: the rows a fix round can dispatch once each is converged and fix-reviewed at its revision.
CREATE VIEW proposals AS
  SELECT id, label, status, rev, reviewed_by, reviewed_rev,
         ((last_editor = 'A' AND agree_b = 1) OR (last_editor = 'B' AND agree_a = 1)) AS converged,
         (reviewed_by IS NOT NULL
          AND reviewed_by = (SELECT CASE value WHEN 'A' THEN 'B' ELSE 'A' END FROM meta WHERE key = 'scribe')
          AND reviewed_rev = rev) AS reviewed
  FROM ledger WHERE label IN ('Bug','Restructure') AND status IN ('finding','verified','assumed','needs-ruling');

CREATE VIEW ready AS SELECT id FROM proposals WHERE converged AND reviewed AND status <> 'needs-ruling';

-- The countersignature is a single statement against the whole ledger: no unconverged row, no unreviewed proposal,
-- complete coverage, and in a two-family run a current Composition row from each seat. A stale check cannot
-- produce a signature.
CREATE TRIGGER sign_requires_a_converged_reviewed_composed_ledger BEFORE INSERT ON signatures
WHEN (SELECT count(*) FROM unconverged) > 0
  OR EXISTS (SELECT 1 FROM proposals WHERE NOT reviewed)
  OR EXISTS (SELECT 1 FROM uncovered_clusters)
  OR ((SELECT value FROM meta WHERE key = 'mode') = 'two-family'
      AND (SELECT count(DISTINCT owner) FROM current_compositions) < 2)
BEGIN SELECT RAISE(ABORT, 'sign refused: the ledger has unconverged rows, an uncovered cluster, an unreviewed proposal, or a seat without a current Composition row (ledger.sh status names them)'); END;
