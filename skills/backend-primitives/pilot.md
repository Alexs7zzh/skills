# Repair the pilot before expansion

Read when the pilot reports corrected sites. Use the correction history and checked judgments to distinguish three repair scopes:

- `site`: the correction depends on this operation, such as its SQL verb or a local override. Cite why it does not change a shared claim.
- `shared-fact`: correct or add the reusable fact in `protections.json`, including its conditions and exceptions. Name affected callers and refresh existing bindings whose fact digest changed.
- `binding`: correct the owner membership or contributing-boundary coverage that attached callers to the wrong path. Keep HTTP, scheduled and mixed callers distinct.

For each shared-fact or binding repair, inspect an affected sibling outside the corrected pilot sites. Record its citation and result. When no sibling exists, record the search that establishes that limit. This is evidence work for the existing owner reviewer and coordinator, not another reviewer role.

Recheck protections, affected answers, audits and judgments. Run `pilot --assess` to obtain the current digests in `pilot-repairs-template.json`. Fill a separate repair file, then pass it with `--repairs` when recording `focus` or `expand`. A `repair` decision can be recorded while that work is pending. A clean pilot needs no repair file.

```json
{
  "corrections_digest": "<from template>",
  "protections_digest": "<from template>",
  "repairs": [{
    "sites": ["S0012"],
    "scope": "shared-fact",
    "reason": "The invocation policy applies to every caller of this scheduled entry.",
    "evidence": ["template.yaml:10-18"],
    "owners": ["O-job"],
    "facts": ["F-delivery"],
    "affected": ["S0012", "S0019"],
    "sibling": {"site":"S0019","evidence":["src/job.ts:20-30"],"result":"This caller uses the same scheduled entry with no override."}
  }]
}
```

Every corrected pilot site needs an account; group sites repaired by the same claim. `site` repairs omit `owners`, `facts` and `sibling`. A `binding` repair names owners and may omit facts when no shared answer changed. A sibling with `site: null` needs `searched` as well as evidence and result. The helper checks identities, coverage and current evidence digests; the source still decides whether the repair and sibling conclusion are true.
