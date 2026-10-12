# Code review

Read for an explicit request to review code, a diff, branch, changeset, PR or uncommitted changes. Apply at every level. Checking your implementation or diagnosing a symptom does not by itself select this procedure. The word "review" in quoted text or a filename is not a request.

The main agent selects and assigns work, handles returned gaps and reports the result. Investigators answer the selected questions. A fresh verifier checks selection and answers. Do not launch separate scope, coverage or report-writing agents for this procedure.

## 1. Select and assign

Establish the original request, requested inputs, target, comparison baseline and applicable human rulings. Use the requested revision, not unrelated pending changes. For a range, distinguish intermediate behavior from defects surviving in the requested final target. Identify mutable inputs with a snapshot or content digest; a path alone does not identify the version reviewed.

Evaluate every row in good-code.md's selection table. Record `yes` when its condition holds, `no` when inspection excludes it on the affected paths, or `unknown` when a named fact is missing. Selected rows are those marked `yes` or `unknown`. Unknown is work, not an exclusion. Name the actual symbols, transitions or contracts behind each selection.

Before investigating, inventory concrete questions with stable IDs, linked to their requested inputs and selected check IDs. Separately answerable behavior paths need separate question IDs; one question may cover several checks. Account for every requested input and selected check. The main agent may investigate or delegate these questions; question count does not require an investigator count. Give shared interactions an explicit owner under integration.

A worker inherits the original goal, authority, target, baseline, rulings and selected level. It reads the applicable coding guidance. When agents write probes or records, assign separate output paths; another agent's evidence is an input, not a file to replace. A worker assignment is an investigation stage, not a new top-level review that launches its own verifier.

Use available agent slots in waves when needed; a concurrency limit does not reduce the assigned scope. Keep shared builds and runtime checks serialized as the project requires. More than one investigator may examine a path when they answer different selected questions; do not require a fixed number per changeset.

## 2. Investigate and self-check

Answer every inventoried question against the actual source or returned execution evidence. Preserve question IDs when assembling worker returns; do not collapse distinct questions into one category answer. If investigation excludes a linked check, retain the question and answer with the fact that disproved its premise. Add questions and update selections when another relevant writer, consumer, dependency or failure reason appears. Follow the complete affected path when rows interact, such as state replacement during an asynchronous callback. Do not close an interaction from separate local answers.

Classify each proposed finding from its established basis:

| Established basis | Disposition |
|---|---|
| A supported scenario violates a current goal or contract through a named path and consequence | Record a defect. |
| No violation is established, but a concrete maintenance task or current user benefit justifies a change | Record an improvement with that task or benefit, its supporting evidence and its tradeoff. |
| The proposed consequence depends on an unestablished requirement or an unseen consumer | Keep it out of the findings; calling it an improvement does not supply the missing basis. Investigate a required unanswered question, or retain its exact limit when the deciding check is unavailable. |

Before submitting a finding, inspect the guard, reset, fallback or contract most likely to refute it. Record the countercheck and its actual result. A missing document does not prove absent authorization, and a missing test does not prove a defect.

Before writing an answer or finding, select every evidence basis that actually exists. Apply these responses, including to excluded rows:

| Evidence available now | What the record may say |
|---|---|
| Source has been read | Cite its locations and the argument. Do not describe a search, test or other command as run merely because the source predicts its output. |
| A search, test or other check has returned | Cite the returned result for these inputs and its limit. |
| A deciding check has not returned | Run or await it before recording its result. If unavailable, record the prerequisite and the unanswered claim. |

Before saving, self-check each execution claim against its returned evidence under SKILL.md, Preserve work and evidence.

Write a supported answer for clean questions too. A file list or "checked" does not establish an answer. Reuse applicable evidence. Run a bounded available operation when its result can change a finding, impact, recommendation or unanswered requirement. Finding enough other issues is not a reason to leave that operation undone.

Combine the investigators' answers into the assessment record, retaining the responsible paths and evidence. Preserve unresolved questions as blocked only when a named prerequisite, authority limit or explicit user budget prevents the deciding check. Do not replace available investigation with a suggestion that someone could do it later.

## 3. Obtain fresh verification

Start a verifier who did not investigate or author the assessment. First give it only the original request, the exact `request`, `inputs`, `target` and `baseline` fields used for the review, applicable rulings, source access and skill guidance. Preserve the input strings and their order. Withhold the assessment, the investigator's selections and question inventory, and candidate findings or their locations. Tell it to perform the verifier's first pass: inspect the target and return its own selection record, and in its message each defect or contradiction it noticed while selecting, with its path and the check it belongs to, without investigating beyond selection. This assignment does not recursively launch another verifier.

After that record returns and is checked, send the assessment to the same verifier. The verifier compares selections, checks the question inventory against the requested paths, then checks the source and evidence for every answer, proposed finding and consequential exclusion. It checks clean results as well as positive findings. It matches each first-pass observation to a finding or answer in the assessment, returns an unmatched one as an omission with its path, or withdraws it with the source that refutes it. Record final applicability for each check ID. Changing the independent selection requires a newly established fact about its condition, named in the reason. Answering a question under another ID does not make its condition false; keep both selected and reuse the evidence. A candidate disproved by a guard is removed, not preserved as a lower-severity defect.

For each check ID and each question ID, return `supported`, `needs-work` or `blocked`, with the evidence or the concrete missing operation. A category verdict settles applicability; it does not substitute for its question verdicts. For each finding ID, return `supported`, `refuted` or `unresolved`, with the deciding source argument and impact. The verifier assesses engineering facts; the proposal judge in proposal.md cannot substitute because it does not inspect source.

If the verifier cannot resume, give a replacement its own identity and repeat the blind selection before sending the assessment. Do not reuse the first verifier's identity or selection as the replacement's work. If the user forbids subagents or the runtime cannot provide this exchange, finish independent work and report verification as unavailable. Do not treat a self-check as the missing stage. A request requiring multiple models still follows joint.md's model choices and prerequisite rules.

In joint review, each investigator's independent selection and source assessment can supply this procedure's first pass and substantive checking for the other. Retain the original independent selections before exchanging conclusions. Keep their assessments separate for peer verification; each investigator verifies the other's answers. An assessment combining both investigators' answers, or lacking an independent first pass, needs a fresh child for this check. Children never replace the two investigators' required assent under joint.md. Use the existing joint record for coordination; do not create a second ledger.

## 4. Apply every matching response

The main agent reads the returned results and applies these rules. A verified finding does not close other selected questions.

| Established result | Required response |
|---|---|
| A finding and its impact are supported | Include it with its scenario, consequence and evidence; keep improvements distinct from defects. |
| A selected question has a supported `clear` answer | Close that question without inventing an issue or test. |
| A claim is refuted | Remove or correct it and revise the affected assessment. |
| Selection, evidence or an answer needs work and its deciding operation is available | Assign that operation, consume its result and send the revised and prior assessment with the prior verification to the verifier. The verifier runs the checker's prior-record template command and reassesses the reseeded rows. |
| A required operation is unavailable | State its exact prerequisite and the conclusion it limits. Report partial coverage, not a completed review of that obligation. |
| A finding or evidence basis changes, including a claim added while drafting the report | Use the same revision procedure and get verdicts tied to the revised assessment. The verifier checks that carried evidence still applies; unchanged text alone does not prove that. |
| The request, inputs, target or baseline changes | Obtain an independent selection for the new context before sending its assessment. Start a new verification template; prior evidence needs a new applicability judgment. |
| All selected answers and proposed findings are supported for the current target | Report completion and the actual verification limits. No minimum finding count or repeated clean pass is required. |

Do not resolve a source dispute by voting or shopping for another verifier. Supply the deciding evidence to the existing verifier; retain an unresolved disagreement when evidence cannot settle it. Before publishing, compare each finding, comparison and execution claim in the report with the verified assessment. Preserve which cases ran against which inputs: a target-only result must not become a baseline-and-target result. Remove unsupported claims or apply the changed-basis response above. Keep routine records out of that report; give material coverage gaps, findings and checks actually made.

## Records and checks

Keep JSON records outside the reviewed source: the main agent's assessment, the verifier's independent selection, and its verification. Preserve prior assessments and verifications when revising; write new versions to separate paths. Workers may return answers in messages; the main agent preserves their evidence and answering actor when assembling the assessment. Category rows hold selection decisions; the question inventory holds assignments, and answers are stored once by question ID. A small review may use one question linked to several checks. Separate answers may cite the same evidence artifact, naming what settles each question.

When records are shared files, return their paths, validation results and required next operations; do not repeat the JSON bodies in messages.

Use [scripts/check_review.py](./scripts/check_review.py) to create templates and validate records. Its `--help` owns the commands and fields. Validate the assessment before handing it off, the independent selection before sending the assessment, and the verification before reporting. Use its completion check before claiming the review complete. A valid partial record is not a completion pass.

The checker enforces shape, identities, references and completion accounting for inventoried questions. It catches missing answers and verdicts; source review must still establish whether the inventory omitted a required question or combined distinct paths. It cannot prove that an agent read a file, that contexts were independent or that an argument is true. Actual returned messages and source evidence establish those facts. A fresh verifier uses its own identity; renaming the investigator does not create independence.
