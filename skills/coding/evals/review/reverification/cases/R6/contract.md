# Chunk planning

`chunk_ranges` receives a nonnegative integer total and a positive integer width.
It returns consecutive, nonoverlapping half-open ranges covering exactly the
indices from zero through total minus one. Every range has positive length at
most width, and no range extends beyond total. Zero total returns no ranges.
Callers validate the input bounds. Planning creates one pair per output range;
it does not enumerate the individual indices or retain state.
