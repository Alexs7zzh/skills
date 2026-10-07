# Lens ledger

One row per lens per run. Scoring, the only definition:

- Confirmed: the complete-lens variant produced a finding the planted mechanism or the user's judgment supports, and the reduced variant (lens removed at every stage) did not. If no reduced variant ran, write "no A/B" in that column; the row records detection, not lens credit.
- Invented: a finding under the lens on a known-good control, in a planted area, that the evidence refutes.
- Missed: the lens was present and the planted mechanism in its sections was not found.

Prune a lens after 3 runs with no confirmed row, or after 2 invented rows.

| Date | Lens | Run (fixture or subsystem, skill revision, model) | Finding | Result | Reduced variant | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-10-07 | time-origin | permission-adapter, restructure WIP on 96f21af, Opus | Cache replaces service expiry with drain time + 30 s | detected | also found, tagged authority | Lens removed at design and compare only; extraction kept it. No lens credit. |
| 2026-10-07 | required-capability | permission-adapter, same run | Adapter Subscribe empty body; outbox never registered | detected | also found, tagged external-contract | Same protocol limit. No lens credit. |
| 2026-10-07 | required-capability | permission-adapter-good, same run | Wrapper forwards; not a finding | correct negative | correct negative | |
| 2026-10-07 | time-origin | permission-adapter-good, same run | Gate applies no margin for policy's 1 s clock skew | not scored | also found, tagged authority | Outside planted areas; policy supports it. |
| 2026-10-07 | lifetime | permission-adapter and control, same run | No row under this slug in four compares | missed (attribution) | n/a | Interrupt absorbed the cases; lenses since sharpened. |
| 2026-10-07 | time-origin | cache-ttl-review, same run | TTL stamped at drain time | detected | no A/B | Extraction K2; design I2; three comparers. |
| 2026-10-07 | required-capability | cache-ttl-review, same run | Metering decorator lacks Invalidate; default no-op | detected | no A/B | Extraction K1; design I1; three comparers. |
| 2026-10-07 | time-origin, required-capability | upload-lease, same run | Origin replaced; session tag not forwarded | detected | no A/B | Extraction only; harmless siblings excluded. |
