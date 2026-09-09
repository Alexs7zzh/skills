# C++ cues

Read for C++ work. These cues identify mechanisms to investigate, not defects inferred from syntax. Read unreal.md as well for Unreal Engine work.

## C++ mechanisms

- Sequence-validated copies need a proof for payload access as well as ordering around invalidation and recheck. Fences or a later successful sequence check do not by themselves legalize a race on non-atomic payload. Walk the exact protocol against the [C++ memory model](https://eel.is/c++draft/intro.races), including the happens-before edges it requires. Passing stress tests on one architecture do not prove portability.
- A moved value read by another argument of the same call can depend on argument evaluation order. Inspect the language version and the actual read and move; `std::move` and Unreal's `MoveTemp` do not themselves sequence the arguments.
- For casts that bypass a static guarantee, such as `const_cast`, unchecked downcasts, or `reinterpret_cast` on live objects, establish the replacement type, lifetime, alignment, or mutability precondition at reachable inputs. The cast's spelling alone does not prove a defect.
