---
name: skill-authoring
description: "Use when creating, editing, reviewing, testing, debugging, or maintaining an agent skill, including when it does not fire, fires on the wrong request, or does not follow its intended workflow."
---

# Skill authoring

A skill is a folder: `<name>/SKILL.md` plus `agents/openai.yaml`. Its description decides when it fires. Its body directs the work. Scripts enforce deterministic constraints. Resources hold conditional detail. `GOAL.md` beside them says why the skill exists and what it values; the rule that tests a value lives only in `SKILL.md`.

## Scope and atomicity

One skill owns one stable invocation decision and one coherent job.

- Keep work together when users ask for it as one capability and its parts share the same context.
- Split work when either part has its own trigger, can run on its own, or makes most runs load instructions they cannot use.
- Do not create a skill or add a branch for one incident. Name the class of behavior that should recur before encoding it.

## Invocation

Two modes.

- **Model-invoked.** Omit `disable-model-invocation` from `SKILL.md` and omit `policy.allow_implicit_invocation` from `agents/openai.yaml`. The model may fire the skill from its description. Use this when an agent should reach for the workflow on its own.
- **User-invoked.** Set `disable-model-invocation: true` in `SKILL.md` and `policy.allow_implicit_invocation: false` in `agents/openai.yaml`. Only a human explicitly naming the skill fires it. Use this for workflows run by hand. The description becomes a short human-facing summary instead of a trigger list.

Keep both files in the same mode. Claude Code reads the frontmatter control. Codex reads the policy control.

## The model-invoked description is a trigger

The agent sees it before loading the skill body. Its only job is the invocation decision.

- State when to use, never what the skill contains. The body carries the content.
- Skip common-sense restatement. "Review code for correctness and quality" defines review and adds nothing. "Use when the user asks to review code" triggers.
- Skip judgment clauses ("before merging significant work"). A trigger reacts to what the user said or the situation at hand, it does not do the skill's thinking.
- Reference no other skills. Skills stay modular. Soft cross-references go in the body, if anywhere.
- Trigger vocabulary earns its words: list the forms users actually type ("a diff, branch, changeset, PR"). Synonyms that rename one form collapse to one.

## The manifest

This workspace requires `agents/openai.yaml` beside `SKILL.md`:

```yaml
interface:
  display_name: "Short Name"
  short_description: "One line for pickers"
  default_prompt: "Use $<name> to <do the thing>."
```

For a user-invoked skill, add:

```yaml
policy:
  allow_implicit_invocation: false
```

## Creating a skill

1. Collect realistic positive prompts and near negatives that must not invoke the skill. Choose model or user invocation from those prompts.
2. Set the skill boundary. State the one job it owns and split independently invoked work.
3. Create `SKILL.md` and `agents/openai.yaml`. Keep the directory name, frontmatter `name`, manifest prompt, and user-facing name aligned.
4. Write the description from the invocation prompts. Do not summarize the body there.
5. Write the body from the required actions and outputs. Add scripts or resources only where they make execution more reliable or keep conditional detail out of the main file.

## The body

Write for execution. The agent runs the document; it does not study it.

- **One mode per section.** Use a section for steps toward a goal or facts for lookup. Keep a short fact beside a step only when the step needs it. Put long or conditional detail in a supporting file and link it where its condition becomes known. A link without its trigger is dead documentation.
- **Steps end on checkable criteria, at both ends.** "One command, already run once, that goes red on this bug" is checkable. "Understanding reached" invites quitting early. An open sweep ("ask why until", "every consumer") overshoots as readily as a vague bound stops early, so say what lies outside the step too.
- **Object sweeps beat activity instructions.** "Inventory every constant with physical meaning" executes. "Think carefully about constants" does not.
- **Required output slots beat process advice.** A section the result must contain gets produced every run. A bullet asking for the same behavior fires about half the time. If a behavior matters, make the output prove it happened. Give each slot the condition under which it applies, or an explicit "none, because" answer; a slot that does not fit the input still gets filled, so the agent invents content for it.
- **An output slot must be refutable.** A slot the agent can fill by restating the goal in the voice of a result fires nothing: "the owner refuses the write", "the texture budget is met". Give the slot fields a later reader can check against a source: which member holds the refusal and what it calls; the largest texture, its size and the limit. A slot that names roles passes every later check; the same slot with those fields gets its claims refuted where they are wrong.
- **Two readings of one sentence mean a judgment call.** Write a rule's strictest and loosest reasonable reading. When both are reasonable, one model takes each. Replace the sentence with a slot, a sweep over named things, or a closed set of tokens with one criterion per token. "Judge the encoding" lets one model pass everything and another flag every wrong word; a two-token result, defect or correction, each with its criterion, makes both agree.
- **A rule on "any" names its part.** A gate that fires on any member of a mixed set fires on the wrong member. "Any refuted step demotes the finding" demotes a confirmed finding over one of its proposed tests. Split the set and say which part decides.
- **Define the exception in the sentence it excepts.** "Launch nothing" in one paragraph and "run the checker" in another lets an agent treat its own helper script as allowed too. Write "launch nothing but this skill's check scripts".
- **A question that would block becomes a premise.** When a stage meets a choice its input does not settle, it proceeds on the recommended option as a numbered premise and lists the choice in its output, except a choice the user owns: a scope widening, a destructive action, an approval the project requires. Those stop. A mid-run question waits on a person who may be away, and the answer is usually the recommendation.
- **Output for a person is ordered and bounded.** Slots alone set what appears, so the agent fills each at full length in the order it worked. Put the answer first and bound the length by the size of the input.
- **Cues name the mechanism, not the category.** "A release store orders prior accesses only, so the writer needs a fence between invalidate and data stores" fires. "Check the memory ordering" does not.
- **Run the no-op test on every sentence.** Does it change behavior versus what every model the workspace evaluates with does by default? An example is judged with the rule it illustrates, not alone. Personas ("you are a senior engineer"), exhortations ("be thorough"), and facts the environment already answers all fail. Delete the sentence, not words from it.
- **One home per meaning.** Duplicated meaning drifts and doubles maintenance. A deliberately repeated term is fine; a repeated rule is not.
- **The environment is a source of truth.** Config files, --help output, and directory layout answer their own questions. Cache only what a lookup cannot find: the unwritten convention, the reason, the gotcha.
- **Reuse one strong term.** Pick a word the model already knows (probe, ledger, seam, red) and repeat it wherever the concept appears. A new coinage costs definition tokens; a weak word ("thorough") is a no-op. One term, one meaning, one part of speech. When a skill spans files, list its terms once in the main file and use no synonym for a listed term: if "check" is the script, "verify" is the stage and "confirm" is the verdict, they do not trade places.

## Scripts and resources

- Put deterministic constraints in code when code can enforce them. Use schemas, parsers, validators, templates, or tests before asking prose to remember the constraint.
- An artifact one agent writes and another reads gets ids on its rows, fixed headings, closed token sets and a checker script. Prose that describes the shape is read differently by each model; a script reads it one way. Ids let a later stage cite a row and the checker prove the citation resolves.
- Keep prose at the handoff. Say when to run a script, what input it takes, and what result closes the step. Let the script own its flags and exact mechanics.
- Keep scripts portable. Resolve paths from the skill directory, accept explicit inputs, fail with actionable messages, and avoid machine-specific state.
- Test scripts with the normal code workflow as well as the skill workflow. A passing unit test does not prove that an agent knows when to run the script.
- Load bundled resources only when their condition holds. Do not make the skill depend on development notes or external source material that will not ship with it.

## Maintaining and debugging a skill

Start from observed behavior, not a remembered solution.

1. Preserve the failing prompt, relevant output, expected behavior, and whether the skill loaded. Keep the smallest case that reproduces the miss.
2. Locate the failing layer before editing.

| Failure | Change here |
|---|---|
| The skill did not load, or loaded on the wrong request | Description vocabulary or invocation controls |
| The skill loaded but skipped conditional instructions | Routing, file boundary, or read trigger |
| The instructions were read but did not change behavior | Required output slot, object sweep, mechanism cue, or executable constraint |
| A helper produced the wrong result | Script, schema, validator, or its tests |
| The body copied facts the agent could inspect | Replace prose with a lookup of the source of truth |

3. Name the failure class and inspect sibling cases. The new wording should govern an unseen sibling, not merely repeat the noun, prompt, or output that exposed the problem. Keep an exact name only when that named interface is what the rule governs.
4. Fix the strongest layer that can own the behavior. Prefer an executable constraint, then a required output slot or object sweep, then a sharp mechanism cue. Use a cautionary sentence only when none of those fit.
5. Replace before appending. Find the existing rule that should have caught the case. Strengthen, move or delete it before adding another rule. Keep one home per meaning.
6. Complete the maintenance checks in the Review checklist.

### Required maintenance result

Every maintenance response contains:

```markdown
## Maintenance result

- Failing case: prompt, relevant output, expected behavior, and whether the skill loaded; or "none, because <the change is a rename, a move or a style pass>"
- Failure class: general mechanism and sibling cases inspected; or "none, because"
- Owning layer and change: the row of the table above, and what changed there
- Rule disposition: strengthened, moved, deleted, added, or unchanged
- Checks: original case, unseen sibling, near negative, and known-good workflow, with the result of each, or "not run, because"
```

A review run, with no failing case, contains instead a **Review result**: a table with one row per checklist item, with the finding and its file and line, or "none, because".

If the skill has an eval suite, add stable regression cases and expected outcomes there. Otherwise keep them in the current maintenance result. Do not create incident history in the skill body.

Not every miss earns an instruction. If no stable failure class survives sibling testing, leave the skill unchanged.

## Review checklist

- Read the description alone.
- Check that the folder name, frontmatter, invocation controls, manifest, links, and default prompt agree.
- Trace each conditional link from the sentence that causes the agent to read it. Remove orphaned resources and unconditional context that most runs skip.
- Classify each body line as a step with a criterion, a cue with a mechanism, a required output slot, or a fact the agent cannot look up. An example belongs to the line it illustrates. Delete lines that fail all four.
- Search for duplicated and conflicting rules, across `SKILL.md`, its resources and `GOAL.md`. Decide which single location owns each meaning.
- Find each rule that asks for a judgment (judge, decide, assess, material, significant, appropriate) and write its two readings. Replace the ones where both readings are reasonable.
- Check that every set of verdicts, dispositions or classes is closed, that each member has a criterion, and that no two members overlap on a realistic input.
- Find each rule that fires on "any" or "every" over a mixed set, and name the part that decides.
- Reread every example and sweep list against a realistic input from a different domain the skill serves. Replace each noun that input lacks; an example teaches the agent its own domain, and the agent carries those nouns into unrelated inputs.
- Trace each step's input to the step that produces it, and check the branch for when that step finds nothing: no match, no measurement, no issue. A step written for the success path alone makes the agent fabricate its input.
- For a new skill or general review, test clear positives, paraphrased positives, near negatives, and ambiguous uses of the word "skill".
- For a new skill, run the workflow on the smallest and the largest realistic input in a fresh context, on each model the workspace evaluates with. Check output length, slot fit and scope against the input, not against the development case.
- Have a fresh agent review the skill against this checklist with no knowledge of the design discussion. Its misreadings are the next reader's.
- For maintenance, test the original case, an unseen sibling, a near negative, and a known-good workflow, each in a fresh context. The sibling proves the fix generalized. The negative catches overreach. Test under each model the workspace evaluates with; a model that already behaves as the rule asks cannot show that the rule fires.
- Run the nearest realistic workflow for the behavior that changed.

## Style

The agent mirrors the style it reads. Early-context writing sets how it works and how it talks. Write the way you want it to behave: short, plain, direct.

- Short everyday words. "Use", not "utilize". "Help", not "facilitate".
- Cut every word that does no work. "In order to" is "to". "It is important to note that" is nothing.
- Talk to the agent as "you", in commands, present tense. "Will" only for things that genuinely happen later.
- Condition before instruction: "If the build fails, read the log." The reader skips what does not apply.
- Say who does what. "The compiler checks", not "is checked".
- State facts plainly. "Is", not "serves as", "stands as", "boasts".
- Periods and commas. Sparing dashes. One instruction per sentence. About 20 words for a step and 25 for a fact; an occasional longer sentence carries a fact with its condition.
- Noun strings of at most three words. "Form-changing design defect merged by mechanism" stacks four; "a defect that changed a form, merged by mechanism" reads once.
- Keep the article and the verb. "Run check before next stage" makes the reader supply what you dropped.
- One topic per paragraph, at most six sentences. A sequence is a numbered list.
- Cut puffery and AI vocabulary: crucial, delve, robust, comprehensive, seamless, leverage, landscape, testament, showcase, underscore. Plain words instead.
- Use the natural number of items, not three because three sounds complete.
- Write the real symbol, file, flag, or command name. Not a synonym, not a description of it.
- Specific over sterile, and specific to the mechanism rather than to the case the skill was developed on. Not "misconfiguration can cause issues" but "a wrong rate here ships silence".

## Before shipping

- Run the repository's skill validator.
- Complete the Review checklist: every item for a new skill; for maintenance, the items that name maintenance and the items that touch the changed lines. Fix every failure, or report the one you skip with its reason.
- Report the validator command and result, behavioral cases and results, and any skipped check with its reason.
