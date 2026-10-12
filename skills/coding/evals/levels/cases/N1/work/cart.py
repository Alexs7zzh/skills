from dataclasses import dataclass
from typing import Sequence


CART_TITLE = "My basket"


@dataclass(frozen=True)
class Line:
    unit_cents: int
    quantity: int


def total_cents(lines: Sequence[Line], shipping_cents: int) -> int:
    return sum(line.unit_cents for line in lines) + shipping_cents
