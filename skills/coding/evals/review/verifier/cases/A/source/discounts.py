from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class Line:
    unit_cents: int
    quantity: int
    eligible: bool = True


@dataclass(frozen=True)
class Quote:
    subtotal_cents: int
    discount_cents: int
    total_cents: int


def quote(lines: Sequence[Line], discount_bps: int, shipping_cents: int) -> Quote:
    subtotal = sum(line.unit_cents * line.quantity for line in lines)
    discount = sum(
        line.unit_cents * line.quantity * discount_bps // 10_000
        for line in lines
        if line.eligible
    )
    return Quote(subtotal, discount, subtotal - discount + shipping_cents)
