# Goal

Why this skill exists and what it values. Read before discussing or changing it.

## Why

A feature idea arrives as a mechanism: a limit, a mode, a setting. Each was added to fix what the last one left over, and the mechanism outlives its reason. By the third step nobody has asked "what does the person actually need" for a while, and the proposal protects a stand-in for the thing the person cares about.

This skill does the product-manager pass on an idea: dig down to the outcome, test whether the idea delivers it, and propose a different shape when one serves the outcome better. It exists so the user can say "what if we did this" and get back a reasoned proposal, with the priorities that are theirs to decide kept apart from the facts an agent can check.

## Values

- **Outcomes are what a person notices.** A mechanism can be satisfied while the person is still worse off, so the test is run against experiences, not against the mechanism's own numbers.
- **Every stand-in is judged where it diverges.** The case where the control holds and the outcome fails is what decides whether the control stays. Agreement in the common case proves nothing.
- **Priorities are the user's.** Which experience is worse than which is a product call. The skill proposes an order and marks what it assumed, so the user spends attention on the ranking and not on reconstructing it.
- **Measure the real thing when the platform offers it.** A stand-in costs a divergence case every time; a direct measurement costs a lookup once.
- **A setting hands a user a decision they lack the data for.** Detection is cheaper for everyone than a knob.
- **Proposals are pasteable.** The user wants to act on the result, so it comes in the form the original used.
- **The skill recommends and does not build.** Shaping a feature and implementing it are different authorities.
- **Repeatable across models.** The steps are object sweeps and required output slots, so the same procedure yields the same shape of result on any capable model.

## Boundary

`feature-impact` takes an accepted feature and maps the other features it touches. This skill questions the feature's own shape. Run this one first when the shape is in doubt.

## Maintenance

Test in a fresh agent context with [the behavioral cases](evals/cases.md), on each model named there. Preserve the prompt, skill version, model and the observed miss. A miss is a required section absent, a stand-in accepted as an outcome, a divergence case not built for a control, a reshaped design when no row failed, or a priority decided for the user. Locate whether the step wording, the required slot or a definition failed before editing.
