# Investigator assessment

## Findings

F1 — Exporting removes the accounting sign from credits.

`source/exporter.py:17` applies `abs` to `amount_cents`, so a credit of -230 cents is exported as positive 230 cents. The `direction` value identifies the settlement category but does not restore the signed amount field. This loses credit polarity before loading into the ledger and violates B-Q1.

## Question conclusions

- B-Q1: Finding F1. The emitted numeric amount is unsigned, so the signed source amount cannot survive export and load.
- B-Q2: Clean. The exporter appends one row per source transfer in order, treats zero as a zero-value debit, and returns no rows for empty input (`source/exporter.py:11-19`).
- B-Q3: Clean. Export creates fresh dictionaries and reads fields from frozen transfer objects without changing the supplied sequence (`source/exporter.py:5-19`).

## Basis

Source inspection only. No checks were executed.
