# Planning draft checks

Development evidence for the first draft, not runtime instructions or a claim of live-project validation. Recheck affected cases when behavior changes.

## Behavioral cases

A fresh agent read the skill and relevant methods, received these fixtures without expected answers, and produced responses without external writes. The author assessed the responses against the criteria below.

| Case | Required distinction | Observed result |
|---|---|---|
| Thorough interview about downloadable course purchases; gifts and refund access undecided | Ask independent product choices; defer recipient account choice until gifts are chosen; keep facts and recommendations distinct | Passed. Asked gifts and refund access, deferred recipient accounts, and left the interview open for answers. |
| Brief for offline exports; SQLite was an agent suggestion; quota unmeasured; user requests no more questions | Synthesize directly, retain offline ruling, do not promote storage suggestion to human approval | Passed. SQLite remained provisional, quota remained unknown, and no interview restarted. |
| Local issue draft: upstream ID investigation, duplicate policy, import, independent empty-state copy | Express real dependencies; shared files and release membership must not create blockers | Passed. Investigation blocked policy, policy blocked import, and copy remained independent. Nothing was written externally. |
| Update existing graph after validated image preparation; footer copy incorrectly blocked by shared milestone | Retain satisfied real dependency, remove false dependency, show ready work without replanning | Passed. Image component and footer copy became ready; the real preparation dependency remained recorded. |

The initial evaluator saw the skill body alongside its description, so its invocation judgments were not counted as a blinded trigger test. A separate fresh agent received only the description and nine prompts. It invoked for grilling a feature, translating discussion to issues, revising dependencies, and the paraphrase "figure out what belongs in the first release." It skipped implementation plus PR, stack-trace explanation, interview coaching, creating a teaching skill, and code review using the coding skill. All nine matched the expected boundary.

## Structural checks

- `scripts/check-skills.sh`: passed for four skills.
- Local Markdown links: all resolve.
- No machine paths or development-reference dependencies in the planning skill.
- `git diff --check`: passed for tracked changes.
- Local sync: `planning` links in both `.agents/skills` and `.claude/skills` resolve to the source folder.

## Limits

The scenario checks test instruction following, not actual GitHub publication, local tracker writes, or multi-turn interviewing with the user. Those remain to be exercised during real use. The earlier backlog migration used reference instructions and does not validate this new skill. No claim of measured model improvement or end-to-end feature delivery is made.

## Domain and map refinement; ShowMe copy

- Failing case: this was an authorized refinement from reference analysis, not a reported production failure. Existing interview instructions did not explicitly test behavior-changing term ambiguity; map instructions did not sharply separate blocked questions from unformulated scope. The author read the skill before changing it.
- Failure class and siblings: apparent agreement can hide different state transitions; uncertain work can be mistaken for excluded work or prematurely specified. Fresh-context fixtures covered payment versus delivery confirmation, deletion versus shared-link revocation, and duplicate policy versus undefined recovery cases. All elicited the intended distinction. A simple settled button-copy brief did not trigger a glossary or interview.
- Owning layer and change: GOAL.md records selective domain definitions; interview.md adds scenario-based clarification and preservation in existing intent documents; map.md distinguishes defined questions, unspecified in-scope work, and exclusions. Rules were added to the owning steps and the prior vague scope sentence was replaced.
- Additional check finding: the first fresh evaluator noted map.md's unconditional tracker-read instruction for a supplied-context chat draft. Replaced it with explicit conditions for existing maps, identifier lookup and persistence. A second fresh evaluator passed the original map draft, an independent button-label draft, and an existing GitHub issue update: chat drafts needed no setup; the issue update required reading configured context and current relationships before mutation.
- ShowMe: copied SKILL.md byte-for-byte as requested, retaining its original description and examples; added GOAL.md and agents/openai.yaml. Fresh-context examples produced a branching flowchart that preserves the invalid-input stop and a focused call-tree diff for adding validation. Visual prompts were selected; weather and skill-creation prompts were skipped. Those invocation judgments were not a blinded description-only test.
- Structural checks: validator passed for five skills; links resolve; both local skill directories link planning and show-me to the source folders; ShowMe comparison with the reference passes. Reference files are unchanged.
- Limits: these are fixture-based checks. Full human interview, external tracker mutation, HTML artifact generation and browser opening were not exercised. The copied ShowMe file retains its original macOS-style open example; no broader portability adaptation was requested.

## Project context maintenance

- Failing case: the user asked how a bare issue ID resolves and how to avoid duplicating planning rules in project instructions. Inspection found overlapping generic rules in O-Me-IO's AGENTS.md and tracking runbook; planning had only a general instruction to follow project configuration. This was a design gap, not an observed wrong-repository lookup. The planning skill was read during the discussion.
- Failure class: project identity and instruction discovery can be lost when shared workflow rules move into skills. Siblings checked were Plastic with an existing Linear context, a context-only interview, and a direct brief without tracking.
- Owning layer and change: project.md supplies configuration and lookup behavior; the description and route table expose setup. O-Me-IO's AGENTS.md independently points all task consumers to its existing context path, so coding does not depend on planning invocation.
- Rule disposition: replaced the vague configuration rule, added the conditional method, removed duplicate generic project prose, and preserved project-specific destinations and policies. The user's existing docs/goals.md edits were left intact.
- Checks: four fresh-context cases passed: GitHub issue implementation routing, Plastic/Linear context reuse without asking again, interview without setup, and direct brief without setup. Configuration triggered planning while implementation and interview coaching did not in evaluator judgments. Actual read-only lookup of issue 24 in the configured repository succeeded. Layout validator passed for four skills, relative document links resolved, and whitespace checks passed in both repositories. No tracker mutations, feature implementation, or PR publication were exercised.
