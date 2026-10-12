# Seat allocation

`reserve` receives nonnegative integer capacity and requested seats. It grants
as many requested seats as capacity allows, leaves the remainder available, and
returns those two counts. Zero capacity and zero requested seats are valid.
Callers validate the input bounds. This function calculates the allocation only;
it owns no persistent state, reservation handle, or concurrent capacity update.
