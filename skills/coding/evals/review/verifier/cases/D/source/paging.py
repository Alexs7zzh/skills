from bisect import bisect_right
from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class Entry:
    key: int
    label: str


@dataclass(frozen=True)
class Page:
    entries: tuple[Entry, ...]
    has_more: bool


def page_after(entries: Sequence[Entry], cursor: int | None, limit: int) -> Page:
    offset = 0 if cursor is None else bisect_right([entry.key for entry in entries], cursor)
    stop = offset + limit
    return Page(tuple(entries[offset:stop]), stop < len(entries))
