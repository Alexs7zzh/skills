# Invoice quote contract

`source/discounts.py::quote` computes an invoice quote for a finite sequence of invoice lines. Its callers supply integer, nonnegative unit prices and shipping, positive integer quantities, and an integer discount rate from 0 through 10,000 basis points. Input validation is outside this review.

The subtotal includes all line prices times quantities. The discount is the floor, in cents, of the eligible subtotal multiplied by the basis-point rate and divided by 10,000. Rounding occurs once for the invoice. Ineligible line value and shipping receive no discount. The total is subtotal minus discount plus shipping. Empty line sequences are valid. The input sequence and its lines must remain unchanged.
