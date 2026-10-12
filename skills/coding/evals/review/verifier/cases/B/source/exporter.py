from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class Transfer:
    transfer_id: str
    amount_cents: int


def export_transfers(transfers: Sequence[Transfer]) -> list[dict[str, str | int]]:
    rows = []
    for transfer in transfers:
        rows.append({
            "id": transfer.transfer_id,
            "direction": "credit" if transfer.amount_cents < 0 else "debit",
            "amount_cents": abs(transfer.amount_cents),
        })
    return rows
