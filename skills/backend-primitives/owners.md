# Establish shared protections

Read the packet's source snapshot, dependency roots and inventory. Write the shared evidence before answer shards start. The coordinator imports external evidence and adds discovered operation sites; you supply the files those commands consume.

## Sweep owners and their callers

Find the existing entry runners, external-operation wrappers, database adapters, configuration owners and deployment registrations used by inventoried sites. For each owner, trace its callers and record which inventoried sites use it, bypass it or have an unknown connection. Order the work by the number of sites served. A name or import does not establish a guarantee: trace the method, options and call path that provide it.

For exported helpers containing an external operation, search their importers and callers. Where the operation is absent from inventory and within its requested paths and kinds, submit an `add-sites` JSONL row with `kind`, `path`, `line` and `reason`. Include the enclosing business operation and contributing entry, crossing or cleanup site even when the transport inside its adapter is already inventoried. Its identity, dedupe token and caller retries may differ from the transport's. Resolve aliases you encounter; list unresolved dynamic calls among the discovery limits. Return additions before finishing owner membership, so the coordinator can provide their site ids.

Read installed clients for retry, timeout and error defaults using the packet's `rg --no-ignore` command. Separate library behavior, provider defaults and deployed overrides. For a missing platform contract, return one request naming the primary document, missing claim and affected sites. After the coordinator imports it, cite `@evidence/<id>.md:<line>`. If it remains unavailable, put that claim in `unknowns` once with its affected sites.

For credential verification, inspect the actual verifier and comparison as well as the surrounding policy. A generic authorization claim cannot establish safe verification of a client-supplied static secret.

## Contributing boundaries

For each owner, trace the entry that supplies its budget or request context, asynchronous crossings that carry cancellation or failures, and cleanup that must fit its lifetime. Record the guarantee supplied by each boundary and its inventoried sites. Include those sites even when they have another kind. Add missing sites before sharding when they are within the requested paths and kinds.

Use `outside-scope` when an explicit inventory restriction excludes a needed boundary; cite it and retain the coverage limit. Use `unknown` with the missing fact when its connection cannot be established. Use `not-applicable` only with the inspected source showing why this boundary contributes nothing. Mixed included and excluded paths get separate rows.

## Record

Write `protections.json` with three lists. Empty lists are valid when the sweep finds no shared owner or fact.

```json
{
  "owners": [{
    "id": "O-http", "name": "request wrapper",
    "evidence": ["src/http.ts:5-20"],
    "sites": [{"site": "S0012", "relation": "uses", "evidence": ["src/orders.ts:40"], "reason": "calls request with its default retry policy"}],
    "coverage": [
      {"boundary":"entry","status":"included","sites":["S0001"],"guarantee":"request deadline","evidence":["src/handler.ts:10-20"],"reason":"entry supplies the remaining budget"},
      {"boundary":"crossing","status":"not-applicable","sites":[],"guarantee":"caller cancellation","evidence":["src/handler.ts:10-20"],"reason":"entry directly awaits the same runtime operation"},
      {"boundary":"cleanup","status":"unknown","sites":[],"guarantee":"cleanup before return","evidence":["src/http.ts:5-20"],"reason":"client cleanup is delegated","missing":"installed client cleanup contract"}
    ]
  }],
  "facts": [{
    "id": "F-retry", "owner": "O-http", "question": "XC5",
    "basis": "project", "conditions": "request with retries not disabled",
    "exceptions": "retry:false overrides the default",
    "answer": {"a": "yes", "ev": "src/http.ts:12-18"}
  }],
  "unknowns": [{"id": "U-delivery", "missing": "provider async delivery contract; deployed retry override absent", "sites": ["S0019"]}]
}
```

- Owner membership uses `uses`, `bypasses` or `unknown`; each needs its own citation and reason.
- Every owner accounts for `entry`, `crossing` and `cleanup` in `coverage`. Each row needs `status`, `sites`, `guarantee`, `evidence` and `reason`; `unknown` also needs `missing`. Included and known unknown sites join focused selection. Membership alone does not let a contributing boundary inherit a shared fact.
- Each fact answers one catalog question with a sourced `yes` or `no`. Use the question's required evidence fields. `basis` is `project`, `library`, `deployment`, `provider-default` or `client`.
- Every fact names applicability `conditions` and `exceptions` (or explicit none). Library and provider facts also need `version`: the installed package version or dated provider contract.
- A provider default applies only after the site's invocation mode and relevant deployment overrides are established. A library fact applies only to the cited installed version and options.
- `unknowns` groups missing claims; it does not supply a default answer.

Run the packet's protections check. It validates references and record shape; the pilot judge must still inspect whether the shared claims and their application are true. When changing a shared fact later, rerun this check and have affected sites refresh their bindings. The script rejects their old fact digests.
