# Parcel manifest contract

`source/manifests.py::build_manifests` plans dispatch manifests from a finite sequence of parcels. Each parcel has a unique string id, a destination, and one of the validated temperature bands `ambient`, `chilled`, or `frozen`. Different temperature bands can occur at the same destination.

Each manifest must contain parcels with exactly one destination and one temperature band, and its labels must match every parcel it contains. There is one manifest for each distinct destination/temperature combination. Manifest order follows the first occurrence of each combination; parcel ids within a manifest retain their input order. Every input parcel must appear exactly once. Empty input yields no manifests. Planning must leave the input sequence and parcel objects unchanged.
