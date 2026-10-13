# Answer the questions

You state what the code does at the pinned revision. You do not decide what it should do, and you do not recommend anything.

## What to read

Read what the kind's Read line names, starting at the site. A question marked "Search the repository" asks about other files: search the whole repository for the string that identifies the thing, such as a module specifier, a table name, a key or a field name, not only the name used at this site. Stop for a site when every question has an answer. Do not read past the entry point that starts the work.

Library defaults count as code. When a question turns on one, such as a client's retry count, read the installed package under `node_modules` and cite it there. If the package is not installed, answer `unknown`.

Deployment configuration counts too: templates, schedules, queue and concurrency settings. Cite it when it is in the repository. Documentation outside the repository cannot be cited; the answer is `unknown` and `missing` names the document.

## Answer tokens

Each applicable question gets one token:

- `yes`: the question's yes criterion holds. `ev` is required: `path:line` or `path:start-end`, relative to the repository root, pointing at the code that establishes it.
- `no`: the no criterion holds. Give `ev` for the place inspected, or a `note` naming what was inspected and found absent. On a search question, also give `searched`: the strings or patterns you searched for.
- `unknown`: the repository cannot settle it. `missing` is required: the fact that would settle it and where it lives.
- `n/a`: the question's condition is not met. The packet states each condition. On a question whose condition is met, `n/a` needs a `note` saying why the question cannot apply.

An absence you did not look for is `unknown`, not `no`.

## Row format

Write one JSON object per line to the file the packet names. Every site in the packet gets exactly one row.

```json
{"site": "S0012", "answers": {"XC1": {"a": "yes", "ev": "src/orders/create.ts:40", "note": "creates an order"}, "XC2": {"a": "no", "note": "request body at src/orders/create.ts:34-39 has no key field"}, "XC3": {"a": "n/a"}}}
{"site": "S0020", "answers": {"IM2": {"a": "no", "note": "no other importer", "searched": "'node:fs/promises' and \"from 'fs\" across the repository"}}}
{"site": "S0013", "status": "not-a-site", "note": "the match is a string inside a permission check"}
{"site": "S0014", "same_as": "S0012"}
```

- `not-a-site`: the scan matched something that is not this kind. Examples: a comment, a string, a type, or an unrelated method with the same name.
- `same_as`: another site of the same kind in this packet has the same answers for the same reason, such as two calls on one path through one helper. Point at a site that has its own answers.
- `added`: a site of one of this packet's kinds that you met while reading and the scan missed. Write `{"added": true, "kind": "<kind>", "path": "...", "line": N, "snippet": "...", "answers": {...}}`. Do not search for extra sites beyond what you read.

You are done when the check command at the end of the packet passes.
