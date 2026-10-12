# Transfer export contract

`source/exporter.py::export_transfers` produces the rows consumed by `source/ledger.py::load_postings`. Callers supply a finite sequence of transfers with unique string ids and signed integer cents. A positive source amount is a debit, a negative source amount is a credit, and zero is a zero-value debit. The interchange protocol carries a nonnegative magnitude in `amount_cents` and its accounting sign in `direction`.

The ledger must reconstruct the original signed cents and ids in source order. Empty sequences are valid. Exporting must not mutate the input sequence or transfers. Only rows produced by this exporter are in scope; untrusted or malformed interchange rows are outside this review.
