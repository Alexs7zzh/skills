# Verifier-stage comparison

Coordinator-only eval. Compare ordinary verification, an explicit challenge to
supplied conclusions, and a source-first pass with assessments withheld. These
four executable Python slices isolate verifier judgment and individual-question
accounting. They do not measure discovery during the earlier investigation,
delegation, or the complete review workflow.

`cases/` and `oracle.json` preserve the frozen fixtures. `prompts/` retains the
matched experiment prompts, with only case order parameterized. Never give this
directory, its oracle, or other trial results to workload agents. Give each run
only its staged packet. The helper copies source, contracts, selected questions,
applicable candidate guidance, and the appropriate assessment inputs; it launches
no models or services and includes no model-specific configuration.

## Stage and reveal

Use one frozen coding-skill snapshot for every condition. Identify it explicitly;
`packet.json` records that label and the copied files' hashes. The snapshot must
have the review guidance and checker. Top-level guidance and the checker are
copied, while skill evals and their oracles are excluded.

```sh
python3 -B skills/coding/evals/review/verifier/setup.py stage /tmp/verifier-blind \
  --style blind --skill-dir /path/to/frozen/coding \
  --guidance-version pre-question-change
```

Use `ordinary` or `challenge` for the other styles. `--case-order D C B A` changes
the presentation order without changing any case. Use fresh sessions for each
condition and repetition. Keep model settings fixed within a comparison and
retain the actual settings in the results. Supply `phase1-prompt.md` and use only
read tools inside the packet. The scoped prompt overrides full-review orchestration
and record formatting so those stages do not confound this comparison.

Blind packets contain no assessments. After the first model turn returns, retain
its answer and transcript **outside** the packet, then reveal:

```sh
python3 -B skills/coding/evals/review/verifier/setup.py reveal /tmp/verifier-blind \
  --first-pass /tmp/verifier-results/first-pass.txt
```

Reveal requires a nonempty retained answer and unchanged input hashes and file
inventory. It then adds the exact canonical assessments, `phase2-prompt.md`, and
a receipt containing the first answer's digest. Continue the same session with
that prompt. The helper does not establish runtime completion or session identity;
the coordinator must confirm those from returned execution results. It refuses
to overwrite a packet or reveal twice. Keep transcripts and model output outside
all packets.

## Score and retain evidence

The expected outcomes are in [oracle.json](oracle.json). Score source truth,
supplied findings, additional findings, and missing question ids separately.
Assessments are evidence claims, so a supported assessment may report a real code
defect. A missing answer is a coverage omission, not automatically a code defect.

- A should retain the genuine rounding finding; D should retain a clean outcome.
  These controls expose forced disagreement.
- B should remove the false sign-loss finding by tracing the ledger consumer.
- C should discover the temperature omitted from grouping and separately name the
  absent C-Q3. Input preservation, the subject of C-Q3, is clean. C-Q2's ordering
  discussion depends on the same grouping defect; do not demand a second bug or
  penalize preserved ordering within the groups that are actually produced.

Score the blind first answer before reading its assessment comparison. A catch
after reveal does not establish independent discovery. Save the decisive source
argument or contradiction, unsupported extra findings, raw outputs, elapsed time,
guidance label and file hashes, fixture digest, model settings, case order, and
which guidance was actually read. Preserve the chronological reads and reveal
receipt; final claims of independence do not prove exposure order.

The initial 2026-10-12 comparison uses the same **pre-question-change guidance**
for all styles. Its results must retain that version distinction; they are not
validation of the later question-level checker changes. Repeated runs remain a
small consistency check. If every style passes, report no observed difference on
this set, not equivalence or broad superiority.

## Check the helper

```sh
python3 -I -B skills/coding/evals/review/verifier/test_setup.py
```

This checks the frozen hashes, identical workload bytes, excluded oracles, absent
blind assessments, reveal ordering, and refusal of modified inputs. It runs no
models. The repository skill validator also applies to changes here.
