from collections.abc import Mapping, Sequence


DIRECTION_SIGN = {"debit": 1, "credit": -1}


def load_postings(rows: Sequence[Mapping[str, str | int]]) -> list[tuple[str, int]]:
    return [
        (str(row["id"]), DIRECTION_SIGN[str(row["direction"])] * int(row["amount_cents"]))
        for row in rows
    ]
