# Investigator assessment

## Findings

F1 — Invoice discount rounds each eligible line before adding it.

`source/discounts.py:21-25` applies integer division inside the sum. With two eligible lines priced at 19 cents each, quantity 1, and a 1,000-basis-point discount, the implementation gives 1 + 1 = 2 cents of discount. The invoice-level rule requires floor(38 * 1,000 / 10,000) = 3 cents. Customers are therefore charged one extra cent on this input. This is a correctness defect in A-Q1.

## Question conclusions

- A-Q1: Finding F1. The rounding placement violates the invoice contract.
- A-Q2: Clean apart from F1's effect on the total. `quote` excludes ineligible lines from the discount, adds all lines to the subtotal, and adds shipping after discount. Empty input produces a zero subtotal and discount, leaving the shipping amount as the total (`source/discounts.py:20-26`).
- A-Q3: Clean. The function only reads the line sequence and its frozen values and returns a new `Quote` (`source/discounts.py:5-26`).

## Basis

Source inspection only. No checks were executed.
