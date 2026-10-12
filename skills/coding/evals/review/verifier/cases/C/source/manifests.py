from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class Parcel:
    parcel_id: str
    destination: str
    temperature: str


@dataclass(frozen=True)
class Manifest:
    destination: str
    temperature: str
    parcel_ids: tuple[str, ...]


def build_manifests(parcels: Sequence[Parcel]) -> list[Manifest]:
    groups: dict[str, list[Parcel]] = {}
    for parcel in parcels:
        groups.setdefault(parcel.destination, []).append(parcel)
    return [
        Manifest(group[0].destination, group[0].temperature,
                 tuple(parcel.parcel_id for parcel in group))
        for group in groups.values()
    ]
