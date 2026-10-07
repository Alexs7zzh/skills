# Logging and diagnostic state

Read when the diagnostics lens is selected. Extraction supplies the evidence below as the model's Diagnostics section and its couple rows. Design encodes the diagnostics lens's code forms. Compare judges the section against the logging and outcome contracts. A list of log sites or severity names does not supply this evidence.

## Extraction evidence

Start with a coverage map from the subsystem's real flows: required setup, admission and validation decisions, execution and completion, recovery, and retained summaries where present. Name each outcome producer, each diagnostic carrier or recorder, and each sink, with inspected or excluded coverage. Include paths that emit no log or fail before the usual owner exists; a log-site search cannot find them. Follow required neighboring producers without turning a focused request into a repository audit.

Collect a diagnostic state table. For each important fact or related group, show:

- Origin and meaning: external observation, owned decision or invariant, or derived view. Name the authority, observation time and confidence. External data can be malformed at an owned boundary; an external failure can also expose a separate owned handling defect.
- Availability and lifetime: immediate-only input, retained state, derived on emission, or unavailable. Name the holder, purpose, the boundaries at which it is updated, reset, overwritten or torn down, and the time it represents. Trace the actual writer and reset path through callback admission, generation fences and wrappers; a reset function does not prove every qualifying completion reaches it. State whether delayed logging keeps the original observation and identity or reads current replacement state.
- Emission and companions: which event carries it, when, and with which other state, reason, stage and operation identity. Show whether the fields describe one coherent transition. For split events, identify the actual correlation and ordering evidence; timestamps or adjacent lines do not establish causality.
- Visibility and loss: severity, category, build and runtime gates, and destination. Trace filtering, sampling, truncation, aggregation or queue loss where they affect required evidence. Mark important facts held but never emitted, discarded at once, or visible only at an insufficient destination. Keep redaction explicit; do not copy secrets or demand private raw data in remote logs.

Put failure classification beside its governing policy, apart from the fact's origin and any provider label. Record responsibility, expected outcome, monitoring obligation and actual response. Keep unmapped cases and conflicting policy authority as limits rather than inferring severity from words such as Error or Fatal.

Trace each distinct decision predicate through reason construction, wrappers, serialization and the eventual diagnostic. Record which distinctions survive a many-to-one code, which consumers need them, and the precedence when several predicates hold. Required-setup failures include missing input, invalid shape and downstream construction failure; record the diagnostic owner for each.

For a relay or classifier, provide a policy-to-output table across material input signatures and admitted provider levels: branch precedence, overrides, fallback, sink thresholds, nearby normal chatter and unrelated genuine-error controls. Record which original fields survive translation; a mapped severity does not recover the native severity.

For failure episodes and summaries, record the emission owner, cardinality, suppression or aggregation key, and the reset after recovery. Distinguish duplicate rows, distinct failures, interim evidence and terminal outcomes. For each retained sample, record its selection rule and the interval it represents, apart from the episode start; a summary's sample keeps its own observation time and is replaced only by a more complete sample. Silence at a filtered sink does not prove success.

**Couple rows:** an important fact held but never emitted or visible only below the required destination; a cause distinction lost before the consumer that needs it; a delayed emission that reads replacement state; a suppression never reset after recovery; a retained sample that cannot adopt later complete evidence.

## Compare

Judge the coverage map, the diagnostic state table and the policy-to-output table against the logging and outcome contracts. Check required evidence at its destination, classification precedence across admitted provider levels, preserved causal distinctions, later episode enrichment, event identity and coherence, and recurrence after recovery. An excluded producer is a coverage limit, not a clean result. Separate an external incident from an owned classification, retention or handling defect. Missing native cause or original severity limits incident attribution; it does not erase a source-established policy violation. Recommend additional logging only for a consequential question the existing evidence cannot answer.
