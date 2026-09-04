---
name: skill-authoring
description: "Use when creating, editing, reviewing, testing, debugging, or maintaining an agent skill, including when it does not fire, fires on the wrong request, or does not follow its intended workflow."
---

# Skill authoring

A skill is a folder: `<name>/SKILL.md` plus `agents/openai.yaml`. Its description decides when it fires. Its body directs the work. Scripts enforce deterministic constraints. Resources hold conditional detail.

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
- **Steps end on checkable criteria.** "One command, already run once, that goes red on this bug" is checkable. "Understanding reached" invites quitting early.
- **Object sweeps beat activity instructions.** "Inventory every constant with physical meaning" executes. "Think carefully about constants" does not.
- **Required output slots beat process advice.** A section the result must contain gets produced every run. A bullet asking for the same behavior fires about half the time. If a behavior matters, make the output prove it happened.
- **Cues name the mechanism, not the category.** "A release store orders prior accesses only, so the writer needs a fence between invalidate and data stores" fires. "Check the memory ordering" does not.
- **Run the no-op test on every sentence.** Does it change behavior versus what the model does by default? Personas ("you are a senior engineer"), exhortations ("be thorough"), and facts the environment already answers all fail. Delete the sentence, not words from it.
- **One home per meaning.** Duplicated meaning drifts and doubles maintenance. A deliberately repeated term is fine; a repeated rule is not.
- **The environment is a source of truth.** Config files, --help output, and directory layout answer their own questions. Cache only what a lookup cannot find: the unwritten convention, the reason, the gotcha.
- **Reuse one strong term.** Pick a word the model already knows (probe, ledger, seam, red) and repeat it wherever the concept appears. A new coinage costs definition tokens; a weak word ("thorough") is a no-op.

## Scripts and resources

- Put deterministic constraints in code when code can enforce them. Use schemas, parsers, validators, templates, or tests before asking prose to remember the constraint.
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
5. Replace before appending. Find the existing rule that should have caught the case. Strengthen, move, or delete it before adding another rule. Keep one home per meaning.
6. Complete the maintenance checks in the Review checklist.

### Required maintenance result

Every maintenance response contains:

```markdown
## Maintenance result

- Failing case: prompt, relevant output, expected behavior, and whether the skill loaded
- Failure class: general mechanism and sibling cases inspected
- Owning layer and change: trigger, routing, instructions, executable helper, or environment
- Rule disposition: replaced, moved, added, or unchanged
- Checks: original case, unseen sibling, near negative, and known-good workflow, with the result of each
```

If the skill has an eval suite, add stable regression cases and expected outcomes there. Otherwise keep them in the current maintenance result. Do not create incident history in the skill body.

Not every miss earns an instruction. If no stable failure class survives sibling testing, leave the skill unchanged.

## Review checklist

- Read the description alone.
- Check that the folder name, frontmatter, invocation controls, manifest, links, and default prompt agree.
- Trace each conditional link from the sentence that causes the agent to read it. Remove orphaned resources and unconditional context that most runs skip.
- Classify each body line as a step with a criterion, a cue with a mechanism, a required output slot, or a fact the agent cannot look up. Delete lines that fail all four.
- Search for duplicated and conflicting rules. Decide which single location owns each meaning.
- For a new skill or general review, test clear positives, paraphrased positives, near negatives, and ambiguous uses of the word "skill".
- For maintenance, test the original case, an unseen sibling, a near negative, and a known-good workflow. The sibling proves the fix generalized. The negative catches overreach.
- Run behavioral checks in a fresh context. An agent that saw the intended design can hide a missing trigger or instruction.
- Run the nearest realistic workflow for the behavior that changed.

## Style

The agent mirrors the style it reads. Early-context writing sets how it works and how it talks. Write the way you want it to behave: short, plain, direct.

- Short everyday words. "Use", not "utilize". "Help", not "facilitate".
- Cut every word that does no work. "In order to" is "to". "It is important to note that" is nothing.
- Talk to the agent as "you", in commands, present tense. "Will" only for things that genuinely happen later.
- Condition before instruction: "If the build fails, read the log." The reader skips what does not apply.
- Say who does what. "The compiler checks", not "is checked".
- State facts plainly. "Is", not "serves as", "stands as", "boasts".
- Periods and commas. Sparing dashes. Short sentences land points; an occasional longer one carries a fact with its condition.
- Cut puffery and AI vocabulary: crucial, delve, robust, comprehensive, seamless, leverage, landscape, testament, showcase, underscore. Plain words instead.
- Use the natural number of items, not three because three sounds complete.
- Write the real symbol, file, flag, or command name. Not a synonym, not a description of it.
- Specific over sterile. Not "misconfiguration can cause issues" but "a wrong rate here ships silence".

## Before shipping

- Run the repository's skill validator.
- Complete the relevant items in the Review checklist. Fix every failure before shipping.
- Report the validator command and result, behavioral cases and results, and any skipped check with its reason.
