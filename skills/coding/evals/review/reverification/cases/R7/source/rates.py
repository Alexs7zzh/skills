from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class Rate:
    zone: str
    service: str
    cents: int


def quote_for(rates: Sequence[Rate], zone: str, service: str) -> int:
    return next(rate.cents for rate in rates if rate.zone == zone)
