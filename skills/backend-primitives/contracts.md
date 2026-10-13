# Endpoint and client contracts

Use these criteria when proposing the endpoint runner, authorization boundary, client failure contract or exception migration. They extend existing entry and adapter owners; they do not require rewriting pure functions.

## Endpoint owner

One endpoint definition declares input and output schemas, an explicit authentication mode (including intentional public access), protected action and resource, and expected failure mapping. Authentication constructs trusted identity. Authorization checks that identity against the actual resource and action and denies missing identity or policy failures. Trace the refusal before the protected operation. Multiple auth implementations are a reuse question; absent validation is not evidence that public access was intended.

Name the registration or import rule that makes future endpoints use this owner. Keep process-scoped clients separate from request-scoped identity. Reuse the project's validators. Inspect secret-token comparison paths and propose supported constant-time verification where required; equality syntax alone does not establish an exploitable attack.

## Client owner

Separate validated application failures from client-observed transport, timeout, cancellation and unexpected-response failures. A handler cannot send its envelope before invocation or after termination. Model platform details only when the caller can observe them; a generic gateway or network failure does not prove a Lambda-specific cause.

Use distinct discriminants, runtime validation and sanitized public fields. Keep diagnostic causes private. An ambiguous mutation outcome needs stable operation identity and reconciliation, not an automatic retry. For Unreal or other non-TypeScript clients, name the shared wire schema, generated protocol and compatibility check; TypeScript type sharing alone does not cross that boundary. If client code is unavailable, retain unknown and identify the missing contract.

## Exception migration

Expected failures use tagged Effect errors. Fallible foreign code runs lazily inside Effect.try or Effect.tryPromise at its adapter. Effect-native clients keep their existing error channel. Callback and event APIs need explicit lifetime, cancellation and error integration. The entry runner distinguishes expected failures, defects and interruption.

A staged migration names the protected directory and its exceptions. Propose a scoped `no-restricted-syntax` selector for `ThrowStatement`, typed `@typescript-eslint/no-floating-promises` with `ignoreVoid: false`, import restrictions outside adapters, and a symbol-aware rule for runtime execution outside entries. The void operator does not handle rejection; name the supervised background-work owner instead. See the [ESLint selector rule](https://eslint.org/docs/latest/rules/no-restricted-syntax) and [promise rule options](https://typescript-eslint.io/rules/no-floating-promises/) when preparing the proposal; installed versions decide the configuration. Existing framework and release throw contracts remain in the exception scope until their consumers migrate. A lint pass cannot prove arbitrary JavaScript never throws, and an empty Effect error channel does not exclude defects or interruption.

Put a compile-time exhaustive mapping check at the public error boundary. Test the primitive with a new unmapped error, a foreign rejection, an unexpected defect and interruption. These checks govern the shared owners, not a repeated exception wrapper requirement for every function.
