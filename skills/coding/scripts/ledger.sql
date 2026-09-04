-- Object ledger for scripts/ledger.ts. The root-level ledger.sh and ledger.sql are the
-- retained schema-v8 implementation and are intentionally independent of this schema.
PRAGMA application_id = 1129075283;
PRAGMA user_version = 1;
PRAGMA foreign_keys = ON;

CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE partition (
  kind TEXT NOT NULL CHECK (kind IN ('hunk','symptom','cluster','scenario')),
  name TEXT NOT NULL,
  PRIMARY KEY (kind, name)
) WITHOUT ROWID;

CREATE TABLE imports (
  seat TEXT PRIMARY KEY CHECK (seat IN ('A','B')),
  ts   TEXT NOT NULL,
  objects INTEGER NOT NULL CHECK (objects >= 0)
) WITHOUT ROWID;

CREATE TABLE coverage (
  id          TEXT PRIMARY KEY,
  owner       TEXT NOT NULL CHECK (owner IN ('A','B')),
  current_rev INTEGER NOT NULL DEFAULT 0 CHECK (current_rev >= 0),
  state       TEXT NOT NULL CHECK (state IN ('open','accounted','gap'))
);

CREATE TABLE claims (
  id          TEXT PRIMARY KEY,
  owner       TEXT NOT NULL CHECK (owner IN ('A','B')),
  current_rev INTEGER NOT NULL DEFAULT 0 CHECK (current_rev >= 0),
  state       TEXT NOT NULL CHECK (state IN ('candidate','verifying','verified','assumed','contested','disproved','dup','accepted')),
  dup_of      TEXT REFERENCES claims(id)
);

CREATE TABLE coverage_revisions (
  coverage_id TEXT NOT NULL REFERENCES coverage(id),
  rev         INTEGER NOT NULL CHECK (rev >= 0),
  editor      TEXT NOT NULL CHECK (editor IN ('A','B')),
  kind        TEXT NOT NULL CHECK (kind IN ('hunk','symptom','cluster','scenario')),
  target      TEXT NOT NULL CHECK (length(trim(target)) > 0),
  description TEXT,
  claim_id    TEXT,
  claim_rev   INTEGER,
  evidence_path TEXT,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (coverage_id, rev),
  FOREIGN KEY (claim_id) REFERENCES claims(id),
  CHECK ((claim_id IS NULL) = (claim_rev IS NULL))
);

CREATE TABLE claim_revisions (
  claim_id      TEXT NOT NULL REFERENCES claims(id),
  rev           INTEGER NOT NULL CHECK (rev >= 0),
  editor        TEXT NOT NULL CHECK (editor IN ('A','B')),
  label         TEXT NOT NULL CHECK (label IN ('Bug','Restructure','Hardening','Nit','telemetry-quality')),
  proposition   TEXT NOT NULL CHECK (length(trim(proposition)) > 0),
  clusters      TEXT,
  site          TEXT,
  trigger       TEXT,
  cause         TEXT,
  impact        TEXT,
  scope         TEXT,
  frequency     TEXT,
  certainty     INTEGER NOT NULL CHECK (certainty BETWEEN 1 AND 5),
  evidence_path TEXT,
  probe         TEXT,
  assumption    TEXT,
  disposition   TEXT,
  release_gating INTEGER NOT NULL CHECK (release_gating IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (claim_id, rev)
);

CREATE TABLE claim_parents (
  claim_id   TEXT NOT NULL,
  claim_rev  INTEGER NOT NULL,
  parent_id  TEXT NOT NULL,
  parent_rev INTEGER NOT NULL,
  PRIMARY KEY (claim_id, claim_rev, parent_id),
  FOREIGN KEY (claim_id, claim_rev) REFERENCES claim_revisions(claim_id, rev),
  FOREIGN KEY (parent_id, parent_rev) REFERENCES claim_revisions(claim_id, rev),
  CHECK (claim_id <> parent_id)
) WITHOUT ROWID;

CREATE TABLE claim_marks (
  claim_id  TEXT NOT NULL,
  claim_rev INTEGER NOT NULL,
  seat      TEXT NOT NULL CHECK (seat IN ('A','B')),
  verdict   TEXT NOT NULL CHECK (verdict IN ('agree','contest','disprove','dup')),
  probe     TEXT,
  evidence_path TEXT,
  target_id TEXT REFERENCES claims(id),
  note      TEXT,
  ts        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (claim_id, claim_rev, seat),
  FOREIGN KEY (claim_id, claim_rev) REFERENCES claim_revisions(claim_id, rev),
  CHECK (verdict <> 'contest' OR length(trim(coalesce(probe,''))) > 0),
  CHECK (verdict <> 'disprove' OR length(trim(coalesce(evidence_path,''))) > 0),
  CHECK (verdict <> 'dup' OR target_id IS NOT NULL)
) WITHOUT ROWID;

CREATE TABLE decisions (
  id          TEXT PRIMARY KEY,
  owner       TEXT NOT NULL CHECK (owner IN ('A','B','master')),
  current_rev INTEGER NOT NULL DEFAULT 0 CHECK (current_rev >= 0),
  state       TEXT NOT NULL CHECK (state IN ('agent-decidable','needs-ruling','needs-external-evidence','decided'))
);

CREATE TABLE decision_revisions (
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  rev         INTEGER NOT NULL CHECK (rev >= 0),
  editor      TEXT NOT NULL CHECK (editor IN ('A','B','master')),
  question    TEXT NOT NULL CHECK (length(trim(question)) > 0),
  options     TEXT,
  recommendation TEXT,
  answer      TEXT,
  external_task TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (decision_id, rev)
);

CREATE TABLE decision_claims (
  decision_id TEXT NOT NULL,
  decision_rev INTEGER NOT NULL,
  claim_id    TEXT NOT NULL,
  claim_rev   INTEGER NOT NULL,
  PRIMARY KEY (decision_id, decision_rev, claim_id),
  FOREIGN KEY (decision_id, decision_rev) REFERENCES decision_revisions(decision_id, rev),
  FOREIGN KEY (claim_id, claim_rev) REFERENCES claim_revisions(claim_id, rev)
) WITHOUT ROWID;

CREATE TABLE remedies (
  id          TEXT PRIMARY KEY,
  owner       TEXT NOT NULL CHECK (owner IN ('A','B')),
  current_rev INTEGER NOT NULL DEFAULT 0 CHECK (current_rev >= 0),
  state       TEXT NOT NULL CHECK (state IN ('draft','reviewed','fixable','rejected'))
);

CREATE TABLE remedy_revisions (
  remedy_id    TEXT NOT NULL REFERENCES remedies(id),
  rev          INTEGER NOT NULL CHECK (rev >= 0),
  editor       TEXT NOT NULL CHECK (editor IN ('A','B')),
  origin_class TEXT CHECK (origin_class IN ('attention-miss','self-consistency','design-absence')),
  fix_shape    TEXT,
  sites_walked TEXT,
  rulings_checked TEXT,
  test_seam    TEXT,
  cost         TEXT,
  risk         TEXT,
  constraints  TEXT,
  group_stable INTEGER NOT NULL DEFAULT 0 CHECK (group_stable IN (0,1)),
  selected     INTEGER NOT NULL DEFAULT 1 CHECK (selected IN (0,1)),
  review_mode  TEXT NOT NULL DEFAULT 'prior' CHECK (review_mode IN ('prior','landing')),
  interface_change INTEGER CHECK (interface_change IN (0,1)),
  ownership_change INTEGER CHECK (ownership_change IN (0,1)),
  risk_surface INTEGER CHECK (risk_surface IN (0,1)),
  owner_ruling INTEGER CHECK (owner_ruling IN (0,1)),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (remedy_id, rev),
  CHECK (test_seam IS NULL OR test_seam LIKE 'exists:%' OR test_seam LIKE 'new:%' OR test_seam LIKE 'none:%')
);

CREATE TABLE remedy_claims (
  remedy_id  TEXT NOT NULL,
  remedy_rev INTEGER NOT NULL,
  claim_id   TEXT NOT NULL,
  claim_rev  INTEGER NOT NULL,
  PRIMARY KEY (remedy_id, remedy_rev, claim_id),
  FOREIGN KEY (remedy_id, remedy_rev) REFERENCES remedy_revisions(remedy_id, rev),
  FOREIGN KEY (claim_id, claim_rev) REFERENCES claim_revisions(claim_id, rev)
) WITHOUT ROWID;

CREATE TABLE object_marks (
  kind      TEXT NOT NULL CHECK (kind IN ('decision','remedy','landing','delivery')),
  object_id TEXT NOT NULL,
  object_rev INTEGER NOT NULL CHECK (object_rev >= 0),
  seat      TEXT NOT NULL CHECK (seat IN ('A','B')),
  verdict   TEXT NOT NULL CHECK (verdict IN ('agree','contest','reject')),
  note      TEXT,
  ts        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (kind, object_id, object_rev, seat)
) WITHOUT ROWID;

CREATE TABLE landings (
  id          TEXT PRIMARY KEY,
  owner       TEXT NOT NULL CHECK (owner IN ('A','fixer')),
  current_rev INTEGER NOT NULL DEFAULT 0 CHECK (current_rev >= 0),
  state       TEXT NOT NULL CHECK (state IN ('implementing','landed','red-green-proved','fix-reviewed'))
);

CREATE TABLE landing_revisions (
  landing_id  TEXT NOT NULL REFERENCES landings(id),
  rev         INTEGER NOT NULL CHECK (rev >= 0),
  editor      TEXT NOT NULL CHECK (editor IN ('A','fixer')),
  remedy_id   TEXT NOT NULL,
  remedy_rev  INTEGER NOT NULL,
  artifact    TEXT,
  artifact_hash TEXT,
  red_run     TEXT,
  red_hash    TEXT,
  green_run   TEXT,
  green_hash  TEXT,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (landing_id, rev),
  FOREIGN KEY (remedy_id, remedy_rev) REFERENCES remedy_revisions(remedy_id, rev),
  CHECK ((artifact IS NULL) = (artifact_hash IS NULL)),
  CHECK ((red_run IS NULL) = (red_hash IS NULL)),
  CHECK ((green_run IS NULL) = (green_hash IS NULL))
);

CREATE TABLE deliveries (
  id          TEXT PRIMARY KEY,
  owner       TEXT NOT NULL CHECK (owner = 'master'),
  current_rev INTEGER NOT NULL DEFAULT 0 CHECK (current_rev >= 0),
  state       TEXT NOT NULL CHECK (state IN ('awaiting-approval','approved','checked-in','dropped'))
);

CREATE TABLE delivery_revisions (
  delivery_id TEXT NOT NULL REFERENCES deliveries(id),
  rev         INTEGER NOT NULL CHECK (rev >= 0),
  editor      TEXT NOT NULL CHECK (editor = 'master'),
  landing_id  TEXT NOT NULL,
  landing_rev INTEGER NOT NULL,
  changeset   TEXT,
  reason      TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (delivery_id, rev),
  FOREIGN KEY (landing_id, landing_rev) REFERENCES landing_revisions(landing_id, rev)
);

CREATE TABLE events (
  seq       INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  who       TEXT NOT NULL CHECK (who IN ('A','B','fixer','master')),
  kind      TEXT NOT NULL,
  object_id TEXT,
  object_rev INTEGER,
  detail    TEXT
);

CREATE TABLE signatures (
  seat        TEXT PRIMARY KEY CHECK (seat IN ('A','B')),
  ts          TEXT NOT NULL,
  state_hash  TEXT NOT NULL,
  notes_a_hash TEXT NOT NULL,
  notes_b_hash TEXT NOT NULL,
  note        TEXT
) WITHOUT ROWID;

CREATE TABLE snapshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT NOT NULL CHECK (kind IN ('snapshot','certificate')),
  policy      TEXT NOT NULL CHECK (policy IN ('report','prepare','land','check-in')),
  created_by  TEXT NOT NULL CHECK (created_by IN ('A','B','master')),
  ts          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  state_hash  TEXT NOT NULL,
  output_path TEXT,
  open_count  INTEGER NOT NULL CHECK (open_count >= 0)
);

CREATE TRIGGER claim_marks_immutable_update BEFORE UPDATE ON claim_marks BEGIN SELECT RAISE(ABORT,'Claim marks are immutable; revise the Claim'); END;
CREATE TRIGGER claim_marks_immutable_delete BEFORE DELETE ON claim_marks BEGIN SELECT RAISE(ABORT,'Claim marks are immutable; revise the Claim'); END;
CREATE TRIGGER object_marks_immutable_update BEFORE UPDATE ON object_marks BEGIN SELECT RAISE(ABORT,'object marks are immutable; revise the object'); END;
CREATE TRIGGER object_marks_immutable_delete BEFORE DELETE ON object_marks BEGIN SELECT RAISE(ABORT,'object marks are immutable; revise the object'); END;

CREATE VIEW current_coverage AS
SELECT c.id,c.owner,c.current_rev,c.state,r.editor,r.kind,r.target,r.description,
       r.claim_id,r.claim_rev,r.evidence_path,r.note,r.created_at
FROM coverage c JOIN coverage_revisions r ON r.coverage_id=c.id AND r.rev=c.current_rev;

CREATE VIEW current_claims AS
SELECT c.id,c.owner,c.current_rev,c.state,c.dup_of,r.editor,r.label,r.proposition,
       r.clusters,r.site,r.trigger,r.cause,r.impact,r.scope,r.frequency,r.certainty,
       r.evidence_path,r.probe,r.assumption,r.disposition,r.release_gating,r.created_at
FROM claims c JOIN claim_revisions r ON r.claim_id=c.id AND r.rev=c.current_rev;

CREATE VIEW current_decisions AS
SELECT d.id,d.owner,d.current_rev,d.state,r.editor,r.question,r.options,
       r.recommendation,r.answer,r.external_task,r.created_at
FROM decisions d JOIN decision_revisions r ON r.decision_id=d.id AND r.rev=d.current_rev;

CREATE VIEW current_remedies AS
SELECT x.id,x.owner,x.current_rev,x.state,r.editor,r.origin_class,r.fix_shape,
       r.sites_walked,r.rulings_checked,r.test_seam,r.cost,r.risk,r.constraints,
       r.group_stable,r.selected,r.review_mode,r.interface_change,r.ownership_change,
       r.risk_surface,r.owner_ruling,r.created_at
FROM remedies x JOIN remedy_revisions r ON r.remedy_id=x.id AND r.rev=x.current_rev;

CREATE VIEW current_landings AS
SELECT l.id,l.owner,l.current_rev,l.state,r.editor,r.remedy_id,r.remedy_rev,
       r.artifact,r.artifact_hash,r.red_run,r.red_hash,r.green_run,r.green_hash,
       r.note,r.created_at
FROM landings l JOIN landing_revisions r ON r.landing_id=l.id AND r.rev=l.current_rev;

CREATE VIEW current_deliveries AS
SELECT d.id,d.owner,d.current_rev,d.state,r.editor,r.landing_id,r.landing_rev,
       r.changeset,r.reason,r.created_at
FROM deliveries d JOIN delivery_revisions r ON r.delivery_id=d.id AND r.rev=d.current_rev;

-- Revision contents are append-only. Heads and states advance, but evidence already
-- reviewed cannot be silently rewritten beneath a mark or snapshot.
CREATE TRIGGER coverage_revision_immutable_update BEFORE UPDATE ON coverage_revisions BEGIN SELECT RAISE(ABORT,'coverage revisions are immutable'); END;
CREATE TRIGGER coverage_revision_immutable_delete BEFORE DELETE ON coverage_revisions BEGIN SELECT RAISE(ABORT,'coverage revisions are never deleted'); END;
CREATE TRIGGER claim_revision_immutable_update BEFORE UPDATE ON claim_revisions BEGIN SELECT RAISE(ABORT,'claim revisions are immutable'); END;
CREATE TRIGGER claim_revision_immutable_delete BEFORE DELETE ON claim_revisions BEGIN SELECT RAISE(ABORT,'claim revisions are never deleted'); END;
CREATE TRIGGER decision_revision_immutable_update BEFORE UPDATE ON decision_revisions BEGIN SELECT RAISE(ABORT,'decision revisions are immutable'); END;
CREATE TRIGGER decision_revision_immutable_delete BEFORE DELETE ON decision_revisions BEGIN SELECT RAISE(ABORT,'decision revisions are never deleted'); END;
CREATE TRIGGER remedy_revision_immutable_update BEFORE UPDATE ON remedy_revisions BEGIN SELECT RAISE(ABORT,'remedy revisions are immutable'); END;
CREATE TRIGGER remedy_revision_immutable_delete BEFORE DELETE ON remedy_revisions BEGIN SELECT RAISE(ABORT,'remedy revisions are never deleted'); END;
CREATE TRIGGER landing_revision_immutable_update BEFORE UPDATE ON landing_revisions BEGIN SELECT RAISE(ABORT,'landing revisions are immutable'); END;
CREATE TRIGGER landing_revision_immutable_delete BEFORE DELETE ON landing_revisions BEGIN SELECT RAISE(ABORT,'landing revisions are never deleted'); END;
CREATE TRIGGER delivery_revision_immutable_update BEFORE UPDATE ON delivery_revisions BEGIN SELECT RAISE(ABORT,'delivery revisions are immutable'); END;
CREATE TRIGGER delivery_revision_immutable_delete BEFORE DELETE ON delivery_revisions BEGIN SELECT RAISE(ABORT,'delivery revisions are never deleted'); END;

CREATE TRIGGER coverage_never_deleted BEFORE DELETE ON coverage BEGIN SELECT RAISE(ABORT,'Coverage objects are never deleted'); END;
CREATE TRIGGER claims_never_deleted BEFORE DELETE ON claims BEGIN SELECT RAISE(ABORT,'Claims are never deleted'); END;
CREATE TRIGGER decisions_never_deleted BEFORE DELETE ON decisions BEGIN SELECT RAISE(ABORT,'Decisions are never deleted'); END;
CREATE TRIGGER remedies_never_deleted BEFORE DELETE ON remedies BEGIN SELECT RAISE(ABORT,'Remedies are never deleted'); END;
CREATE TRIGGER landings_never_deleted BEFORE DELETE ON landings BEGIN SELECT RAISE(ABORT,'Landings are never deleted'); END;
CREATE TRIGGER deliveries_never_deleted BEFORE DELETE ON deliveries BEGIN SELECT RAISE(ABORT,'Deliveries are never deleted'); END;

CREATE TRIGGER coverage_owner_immutable BEFORE UPDATE OF owner ON coverage WHEN NEW.owner<>OLD.owner BEGIN SELECT RAISE(ABORT,'Coverage owner is immutable'); END;
CREATE TRIGGER claim_owner_immutable BEFORE UPDATE OF owner ON claims WHEN NEW.owner<>OLD.owner BEGIN SELECT RAISE(ABORT,'Claim owner is immutable'); END;
CREATE TRIGGER decision_owner_immutable BEFORE UPDATE OF owner ON decisions WHEN NEW.owner<>OLD.owner BEGIN SELECT RAISE(ABORT,'Decision owner is immutable'); END;
CREATE TRIGGER remedy_owner_immutable BEFORE UPDATE OF owner ON remedies WHEN NEW.owner<>OLD.owner BEGIN SELECT RAISE(ABORT,'Remedy owner is immutable'); END;
CREATE TRIGGER landing_owner_immutable BEFORE UPDATE OF owner ON landings WHEN NEW.owner<>OLD.owner BEGIN SELECT RAISE(ABORT,'Landing owner is immutable'); END;
CREATE TRIGGER delivery_owner_immutable BEFORE UPDATE OF owner ON deliveries WHEN NEW.owner<>OLD.owner BEGIN SELECT RAISE(ABORT,'Delivery owner is immutable'); END;
CREATE TRIGGER coverage_id_immutable BEFORE UPDATE OF id ON coverage WHEN NEW.id<>OLD.id BEGIN SELECT RAISE(ABORT,'Coverage id is immutable'); END;
CREATE TRIGGER claim_id_immutable BEFORE UPDATE OF id ON claims WHEN NEW.id<>OLD.id BEGIN SELECT RAISE(ABORT,'Claim id is immutable'); END;
CREATE TRIGGER decision_id_immutable BEFORE UPDATE OF id ON decisions WHEN NEW.id<>OLD.id BEGIN SELECT RAISE(ABORT,'Decision id is immutable'); END;
CREATE TRIGGER remedy_id_immutable BEFORE UPDATE OF id ON remedies WHEN NEW.id<>OLD.id BEGIN SELECT RAISE(ABORT,'Remedy id is immutable'); END;
CREATE TRIGGER landing_id_immutable BEFORE UPDATE OF id ON landings WHEN NEW.id<>OLD.id BEGIN SELECT RAISE(ABORT,'Landing id is immutable'); END;
CREATE TRIGGER delivery_id_immutable BEFORE UPDATE OF id ON deliveries WHEN NEW.id<>OLD.id BEGIN SELECT RAISE(ABORT,'Delivery id is immutable'); END;

CREATE TRIGGER coverage_head_advances_to_revision BEFORE UPDATE OF current_rev ON coverage
WHEN NEW.current_rev<>OLD.current_rev AND (NEW.current_rev<>OLD.current_rev+1 OR NOT EXISTS (SELECT 1 FROM coverage_revisions WHERE coverage_id=OLD.id AND rev=NEW.current_rev))
BEGIN SELECT RAISE(ABORT,'Coverage head advances by one existing revision'); END;
CREATE TRIGGER claim_head_advances_to_revision BEFORE UPDATE OF current_rev ON claims
WHEN NEW.current_rev<>OLD.current_rev AND (NEW.current_rev<>OLD.current_rev+1 OR NOT EXISTS (SELECT 1 FROM claim_revisions WHERE claim_id=OLD.id AND rev=NEW.current_rev))
BEGIN SELECT RAISE(ABORT,'Claim head advances by one existing revision'); END;
CREATE TRIGGER decision_head_advances_to_revision BEFORE UPDATE OF current_rev ON decisions
WHEN NEW.current_rev<>OLD.current_rev AND (NEW.current_rev<>OLD.current_rev+1 OR NOT EXISTS (SELECT 1 FROM decision_revisions WHERE decision_id=OLD.id AND rev=NEW.current_rev))
BEGIN SELECT RAISE(ABORT,'Decision head advances by one existing revision'); END;
CREATE TRIGGER remedy_head_advances_to_revision BEFORE UPDATE OF current_rev ON remedies
WHEN NEW.current_rev<>OLD.current_rev AND (NEW.current_rev<>OLD.current_rev+1 OR NOT EXISTS (SELECT 1 FROM remedy_revisions WHERE remedy_id=OLD.id AND rev=NEW.current_rev))
BEGIN SELECT RAISE(ABORT,'Remedy head advances by one existing revision'); END;
CREATE TRIGGER landing_head_advances_to_revision BEFORE UPDATE OF current_rev ON landings
WHEN NEW.current_rev<>OLD.current_rev AND (NEW.current_rev<>OLD.current_rev+1 OR NOT EXISTS (SELECT 1 FROM landing_revisions WHERE landing_id=OLD.id AND rev=NEW.current_rev))
BEGIN SELECT RAISE(ABORT,'Landing head advances by one existing revision'); END;
CREATE TRIGGER delivery_head_advances_to_revision BEFORE UPDATE OF current_rev ON deliveries
WHEN NEW.current_rev<>OLD.current_rev AND (NEW.current_rev<>OLD.current_rev+1 OR NOT EXISTS (SELECT 1 FROM delivery_revisions WHERE delivery_id=OLD.id AND rev=NEW.current_rev))
BEGIN SELECT RAISE(ABORT,'Delivery head advances by one existing revision'); END;

CREATE TRIGGER claim_terminal_content_after_insert AFTER INSERT ON claim_revisions
WHEN NEW.rev=(SELECT current_rev FROM claims WHERE id=NEW.claim_id) AND (
  ((SELECT state FROM claims WHERE id=NEW.claim_id)='verified' AND (NEW.certainty<4 OR length(trim(coalesce(NEW.evidence_path,'')))=0))
  OR ((SELECT state FROM claims WHERE id=NEW.claim_id)='assumed' AND length(trim(coalesce(NEW.assumption,'')))=0)
  OR ((SELECT state FROM claims WHERE id=NEW.claim_id)='accepted' AND (NEW.label<>'Nit' OR length(trim(coalesce(NEW.disposition,'')))=0))
  OR ((SELECT state FROM claims WHERE id=NEW.claim_id) IN ('verified','assumed') AND NEW.label IN ('Bug','Restructure')
      AND (length(trim(coalesce(NEW.trigger,'')))=0 OR length(trim(coalesce(NEW.impact,'')))=0)))
BEGIN SELECT RAISE(ABORT,'terminal Claim content does not satisfy its evidence, assumption, trigger, or impact gate'); END;

CREATE TRIGGER claim_terminal_content_on_head BEFORE UPDATE OF current_rev, state ON claims
WHEN EXISTS (SELECT 1 FROM claim_revisions r WHERE r.claim_id=OLD.id AND r.rev=NEW.current_rev AND (
  (NEW.state='verified' AND (r.certainty<4 OR length(trim(coalesce(r.evidence_path,'')))=0))
  OR (NEW.state='assumed' AND length(trim(coalesce(r.assumption,'')))=0)
  OR (NEW.state='accepted' AND (r.label<>'Nit' OR length(trim(coalesce(r.disposition,'')))=0))
  OR (NEW.state IN ('verified','assumed') AND r.label IN ('Bug','Restructure')
      AND (length(trim(coalesce(r.trigger,'')))=0 OR length(trim(coalesce(r.impact,'')))=0))))
BEGIN SELECT RAISE(ABORT,'terminal Claim content does not satisfy its evidence, assumption, trigger, or impact gate'); END;

CREATE TRIGGER coverage_claim_revision_exists AFTER INSERT ON coverage_revisions
WHEN NEW.claim_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM claim_revisions WHERE claim_id=NEW.claim_id AND rev=NEW.claim_rev)
BEGIN SELECT RAISE(ABORT,'Coverage must reference an existing Claim revision'); END;

CREATE TRIGGER claim_mark_matches_current_content BEFORE INSERT ON claim_marks
WHEN NEW.claim_rev<>(SELECT current_rev FROM claims WHERE id=NEW.claim_id)
  OR ((SELECT value FROM meta WHERE key='mode')<>'single' AND NEW.seat=(SELECT editor FROM claim_revisions WHERE claim_id=NEW.claim_id AND rev=NEW.claim_rev))
BEGIN SELECT RAISE(ABORT,'a Claim mark is by the other seat on the current revision'); END;

CREATE TRIGGER object_mark_matches_current_content BEFORE INSERT ON object_marks
WHEN (NEW.kind='decision' AND (NOT EXISTS (SELECT 1 FROM decisions WHERE id=NEW.object_id AND current_rev=NEW.object_rev)
                              OR ((SELECT value FROM meta WHERE key='mode')<>'single' AND NEW.seat=(SELECT editor FROM decision_revisions WHERE decision_id=NEW.object_id AND rev=NEW.object_rev))))
  OR (NEW.kind='remedy' AND (NOT EXISTS (SELECT 1 FROM remedies WHERE id=NEW.object_id AND current_rev=NEW.object_rev)
                            OR ((SELECT value FROM meta WHERE key='mode')<>'single' AND NEW.seat=(SELECT editor FROM remedy_revisions WHERE remedy_id=NEW.object_id AND rev=NEW.object_rev))))
  OR (NEW.kind='landing' AND (NOT EXISTS (SELECT 1 FROM landings WHERE id=NEW.object_id AND current_rev=NEW.object_rev)
                             OR ((SELECT value FROM meta WHERE key='mode')<>'single' AND NEW.seat=(SELECT editor FROM landing_revisions WHERE landing_id=NEW.object_id AND rev=NEW.object_rev))))
  OR (NEW.kind='delivery' AND (NOT EXISTS (SELECT 1 FROM deliveries WHERE id=NEW.object_id AND current_rev=NEW.object_rev)
                              OR ((SELECT value FROM meta WHERE key='mode')<>'single' AND NEW.seat=(SELECT editor FROM delivery_revisions WHERE delivery_id=NEW.object_id AND rev=NEW.object_rev))))
BEGIN SELECT RAISE(ABORT,'an object mark is by the other seat on a current object revision'); END;

CREATE TRIGGER coverage_state_changes_with_content BEFORE UPDATE OF state ON coverage
WHEN NEW.current_rev=OLD.current_rev AND NEW.state<>OLD.state
BEGIN SELECT RAISE(ABORT,'Coverage state changes with a new content revision'); END;

CREATE TRIGGER claim_mark_drives_state_only_transition BEFORE UPDATE OF state ON claims
WHEN NEW.current_rev=OLD.current_rev AND NEW.state<>OLD.state AND (
  (NEW.state='contested' AND NOT EXISTS (SELECT 1 FROM claim_marks WHERE claim_id=OLD.id AND claim_rev=OLD.current_rev AND verdict='contest'))
  OR (NEW.state='disproved' AND NOT EXISTS (SELECT 1 FROM claim_marks WHERE claim_id=OLD.id AND claim_rev=OLD.current_rev AND verdict='disprove'))
  OR (NEW.state='dup' AND NOT EXISTS (SELECT 1 FROM claim_marks WHERE claim_id=OLD.id AND claim_rev=OLD.current_rev AND verdict='dup' AND target_id=NEW.dup_of))
  OR NEW.state NOT IN ('contested','disproved','dup'))
BEGIN SELECT RAISE(ABORT,'Claim state changes through a new revision or its current peer mark'); END;

CREATE TRIGGER decision_state_changes_with_content BEFORE UPDATE OF state ON decisions
WHEN NEW.current_rev=OLD.current_rev AND NEW.state<>OLD.state
BEGIN SELECT RAISE(ABORT,'Decision state changes with a new content revision'); END;

CREATE TRIGGER remedy_review_drives_state BEFORE UPDATE OF state ON remedies
WHEN NEW.current_rev=OLD.current_rev AND NEW.state<>OLD.state AND NEW.state<>'fixable' AND (
  (NEW.state='reviewed' AND (SELECT value FROM meta WHERE key='mode')<>'single'
   AND NOT EXISTS (SELECT 1 FROM object_marks WHERE kind='remedy' AND object_id=OLD.id AND object_rev=OLD.current_rev AND verdict='agree'))
  OR (NEW.state='rejected' AND (SELECT value FROM meta WHERE key='mode')<>'single'
   AND NOT EXISTS (SELECT 1 FROM object_marks WHERE kind='remedy' AND object_id=OLD.id AND object_rev=OLD.current_rev AND verdict='reject'))
  OR (NEW.state='draft' AND (SELECT value FROM meta WHERE key='mode')<>'single'
   AND NOT EXISTS (SELECT 1 FROM object_marks WHERE kind='remedy' AND object_id=OLD.id AND object_rev=OLD.current_rev AND verdict='contest'))
  OR NEW.state NOT IN ('draft','reviewed','rejected','fixable'))
BEGIN SELECT RAISE(ABORT,'Remedy state changes through a new revision or its current review'); END;

CREATE TRIGGER landing_state_transition_is_proof_or_review BEFORE UPDATE OF state ON landings
WHEN NEW.current_rev=OLD.current_rev AND NEW.state<>OLD.state AND NEW.state<>'fix-reviewed'
BEGIN SELECT RAISE(ABORT,'Landing proof content changes with a new revision'); END;

CREATE TRIGGER remedy_becomes_fixable_only_when_ready BEFORE UPDATE OF state ON remedies
WHEN NEW.state='fixable' AND OLD.state<>'fixable' AND (
  EXISTS (SELECT 1 FROM current_remedies r WHERE r.id=OLD.id AND (
    r.origin_class IS NULL OR length(trim(coalesce(r.fix_shape,'')))=0 OR length(trim(coalesce(r.sites_walked,'')))=0
    OR length(trim(coalesce(r.rulings_checked,'')))=0 OR length(trim(coalesce(r.test_seam,'')))=0
    OR length(trim(coalesce(r.cost,'')))=0 OR length(trim(coalesce(r.risk,'')))=0 OR r.group_stable=0))
  OR EXISTS (SELECT 1 FROM remedy_claims rc JOIN claims c ON c.id=rc.claim_id
             WHERE rc.remedy_id=OLD.id AND rc.remedy_rev=OLD.current_rev
             AND (rc.claim_rev<>c.current_rev OR c.state NOT IN ('verified','assumed')))
  OR ((SELECT value FROM meta WHERE key='mode')='joint'
      AND (SELECT review_mode FROM remedy_revisions WHERE remedy_id=OLD.id AND rev=OLD.current_rev)='prior'
      AND NOT EXISTS (SELECT 1 FROM object_marks WHERE kind='remedy' AND object_id=OLD.id AND object_rev=OLD.current_rev AND verdict='agree'))
  OR EXISTS (SELECT 1 FROM remedy_revisions r WHERE r.remedy_id=OLD.id AND r.rev=OLD.current_rev AND r.review_mode='landing'
      AND (r.origin_class<>'attention-miss' OR coalesce(r.interface_change,1)<>0 OR coalesce(r.ownership_change,1)<>0
           OR coalesce(r.risk_surface,1)<>0 OR coalesce(r.owner_ruling,1)<>0)))
BEGIN SELECT RAISE(ABORT,'a Remedy becomes fixable only with complete slots, stable Claims, and its required review'); END;

CREATE TRIGGER landing_becomes_proved_only_with_artifact_and_runs BEFORE UPDATE OF state ON landings
WHEN NEW.state='red-green-proved' AND OLD.state<>'red-green-proved' AND EXISTS (
  SELECT 1 FROM current_landings l JOIN remedy_revisions r ON r.remedy_id=l.remedy_id AND r.rev=l.remedy_rev
  WHERE l.id=OLD.id AND (l.artifact IS NULL OR l.green_run IS NULL OR (l.red_run IS NULL AND r.test_seam NOT LIKE 'none:%')))
BEGIN SELECT RAISE(ABORT,'a proved Landing needs an artifact, green run, and red run unless the seam is none:'); END;

CREATE TRIGGER landing_proved_content_after_insert AFTER INSERT ON landing_revisions
WHEN NEW.rev=(SELECT current_rev FROM landings WHERE id=NEW.landing_id)
 AND (SELECT state FROM landings WHERE id=NEW.landing_id)='red-green-proved'
 AND (NEW.artifact IS NULL OR NEW.green_run IS NULL OR (NEW.red_run IS NULL
      AND (SELECT test_seam FROM remedy_revisions WHERE remedy_id=NEW.remedy_id AND rev=NEW.remedy_rev) NOT LIKE 'none:%'))
BEGIN SELECT RAISE(ABORT,'a proved Landing needs an artifact, green run, and red run unless the seam is none:'); END;

CREATE TRIGGER landing_becomes_reviewed_only_on_current_mark BEFORE UPDATE OF state ON landings
WHEN NEW.state='fix-reviewed' AND OLD.state<>'fix-reviewed'
 AND (OLD.state<>'red-green-proved' OR ((SELECT value FROM meta WHERE key='mode')<>'single'
      AND NOT EXISTS (SELECT 1 FROM object_marks WHERE kind='landing' AND object_id=OLD.id AND object_rev=OLD.current_rev AND verdict='agree')))
BEGIN SELECT RAISE(ABORT,'a Landing becomes fix-reviewed only after an independent current agreeing review'); END;

CREATE TRIGGER delivery_approval_order BEFORE UPDATE OF state ON deliveries
WHEN (NEW.state='approved' AND OLD.state<>'awaiting-approval')
  OR (NEW.state='checked-in' AND OLD.state<>'approved')
  OR (OLD.state IN ('checked-in','dropped') AND NEW.state<>OLD.state)
BEGIN SELECT RAISE(ABORT,'Delivery transitions are awaiting-approval to approved to checked-in, or to dropped'); END;

CREATE TRIGGER claim_no_self_dup BEFORE UPDATE OF dup_of ON claims
WHEN NEW.dup_of = NEW.id BEGIN SELECT RAISE(ABORT,'a claim cannot duplicate itself'); END;

CREATE TRIGGER decided_has_answer BEFORE UPDATE OF state ON decisions
WHEN NEW.state='decided' AND length(trim(coalesce((SELECT answer FROM decision_revisions WHERE decision_id=NEW.id AND rev=NEW.current_rev),'')))=0
BEGIN SELECT RAISE(ABORT,'a decided Decision needs an answer'); END;

CREATE TRIGGER delivery_checked_in_has_changeset BEFORE UPDATE OF state ON deliveries
WHEN NEW.state='checked-in' AND length(trim(coalesce((SELECT changeset FROM delivery_revisions WHERE delivery_id=NEW.id AND rev=NEW.current_rev),'')))=0
BEGIN SELECT RAISE(ABORT,'a checked-in Delivery needs a changeset'); END;
