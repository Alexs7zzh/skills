# Rate lookup

`quote_for` receives at most 64 rates. Each zone/service pair is unique, quoted
cents are nonnegative integers, and the requested pair is always present. A zone
can have rates for several services. A request must return the exact rate for
its zone and service, regardless of input order. String matching is exact; zone
prefixes do not match. Zero cents is a valid rate. The caller validates these
prerequisites. Lookup must leave the rate sequence and Rate objects unchanged.
