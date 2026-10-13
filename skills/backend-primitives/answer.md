# Answer the questions

You state what the code does in the run's source snapshot. You do not decide what it should do, and you do not recommend anything.

## What to read

Read what the kind's Read line names, starting at the site. A question marked "Search the repository" asks about other files: search the whole repository for the string that identifies the thing, such as a module specifier, a table name, a key or a field name, not only the name used at this site. Stop for a site when every question has an answer. Do not read past the entry point that starts the work.

Library defaults count as code. When a question turns on one, such as a client's retry count, read the installed package under `node_modules` and cite it there. If the package is not installed, answer `unknown`. Apply the same evidence rule to runtime-native API defaults: use the installed runtime source or a checked-in runtime contract. An explicit call option is source evidence; familiarity with a default is not.

Deployment configuration counts too: templates, schedules, queue and concurrency settings. Cite it when it is in the repository. Documentation outside the repository cannot be cited; the answer is `unknown` and `missing` names the document.

## Answer tokens

Every question gets one token, including explicit `n/a` for known-false prerequisites:

- `yes`: the question's yes criterion holds. `ev` is required: `path:line` or `path:start-end`, relative to the repository root, pointing at the code that establishes it.
- `no`: the no criterion holds. Give `ev` for the place inspected, or a `note` naming what was inspected and found absent. On a search question, also give `searched`: the strings or patterns you searched for.
- `unknown`: the repository cannot settle it. `missing` is required: the fact that would settle it and where it lives.
- `n/a`: a prerequisite is known false. When a prerequisite is unknown, answer `unknown` and name what would settle applicability. Only a question with an explicit catalog exception also permits `n/a`, with a note establishing that exception.

An absence you did not look for is `unknown`, not `no`. Positive search hints are fallible evidence: answer those questions explicitly after checking their citations. For `no` or `n/a` against a hint, add `hint_refutation` explaining why its cited match does not establish the fact. Every such contradiction receives an audit. The script never overwrites your answer.

## Row format

Write one JSON object per line to the file the packet names. Every site in the packet gets exactly one row.

```json
{"site": "S0012", "answers": {"XC1": {"a": "yes", "ev": "src/orders/create.ts:40", "note": "creates an order"}, "XC2": {"a": "no", "note": "request body at src/orders/create.ts:34-39 has no key field"}, "XC3": {"a": "n/a"}}}
{"site": "S0020", "answers": {"IM2": {"a": "no", "note": "no other importer", "searched": "'node:fs/promises' and \"from 'fs\" across the repository"}}}
{"site": "S0013", "status": "not-a-site", "note": "the match is a string inside a permission check"}
{"site": "S0014", "same_as": "S0012"}
```

- `not-a-site`: the scan matched something that is not this kind. Examples: a comment, a string, a type, or an unrelated method with the same name.
- `same_as`: another site of the same kind in this packet has the same answers for the same reason, such as two calls on one path through one helper. Point at a site with its own complete, confirmed answers. A script hint is not an answer.
- `added`: a site of one of this packet's kinds that you met while reading and the scan missed. Write `{"added": true, "kind": "<kind>", "path": "...", "line": N, "snippet": "...", "answers": {...}}`. Do not search for extra sites beyond what you read.

You are done when the check command at the end of the packet passes.
