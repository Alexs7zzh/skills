// Thin local adapter: parse explicit commands, retain files, transact, print facts.
import { createHash } from "node:crypto"
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { initialState, taskById, type Command, type RecordRef, type State, type ScopeMode } from "./protocol.ts"
import { create, mutate, read } from "./store.ts"
import { renderReport, renderStatus, renderTimeline } from "./report.ts"
import { coordinate } from "./coordinator.ts"

const HELP = `ledger: explicit tasks and immutable evidence. LEDGER_DIR=<run> LEDGER_ME=<actor>
Local init defaults to actor master. Runtime coordination is optional and master-controlled.

init goal=<text> source=<user instruction> [scope=report-only|fix|check-in]
     [names='{"master":"master-pane","A":"reviewer-a","B":"reviewer-b"}']
status | report | timeline [actor-or-id] | show <task-or-record-id> [rev=N]

task add ID title=... outcome=... next=... [owner=actor|none] [permission=read|write|check-in]
task set ID rev=N [title=... outcome=... next=... note=... permission=...]
     [inputs=record@1,...] [requires=task@1,...] [review=record@1|none]
     [wait=user|external|none waitReason=...] [reason=... resolution=ruling@N]
     Resolving a user wait (none/external) requires master + a current kind=ruling record saved by master.
     Its exact resolution reference joins task inputs and bumps material version automatically.
     Other material changes require reason=. External waits remain owner-clearable.
task claim ID rev=N [owner=actor] | task release ID rev=N note=... next=...
task start ID rev=N
task finish ID rev=N result=record@N
     OR file=<assessment/result> [verdict=clean|conditions conditions=... dispatch=ID]
     File finish retains evidence and finishes atomically; review subject/inputs come from task.
task cancel ID rev=N reason=... | task reopen ID rev=N reason=... [next=...]
     add also accepts inputs/requires/review/wait/note. requires pins material version, not rev.

record save ID rev=N kind=... title=... file=<path> OR content=<small text>
     [inputs=record@1,... authors=A,B subject=record@1 verdict=clean|conditions conditions=... dispatch=ID]
     rev=0 creates; append uses expected latest rev. Files are retained content-addressed.
checkout take rev=N purpose=... | checkout release rev=N reason=...
checkout recover rev=N stopped=<evidence> preserved=<evidence>   master only
dispatch reserve ID task=ID taskRev=N inspectAfter=<ISO timestamp>
dispatch update ID rev=N state=reserved|running|finished|stopped observation=...
     [worker='{"name":"actual-child","pane":"identity","session":null}' inspectAfter=...]
scope set rev=N mode=report-only|fix|check-in source=...
scope authorize ID rev=N scopeRev=N executor=actor inputs=record@1,... source=...

coordinate status | once | watch [interval=2000]
coordinate pause|resume reason=... | bind seat=actor reason=... | retry seat=actor checked=...
Only coordinator invokes Herdr. Mutations never send peer messages or execute project work.
Records describe findings/candidates; labels do not generate tasks. Report is always available.
Ordinary argument/stale-revision errors: inspect and correct; not a mechanism emergency.
`

const SPECS: Record<string, string> = {
  "task.add": "id title! outcome! next! owner permission inputs requires review wait waitReason note",
  "task.set": "id rev! title outcome next note permission inputs requires review wait waitReason reason resolution",
  "task.claim": "id rev! owner", "task.release": "id rev! note! next!",
  "task.start": "id rev!", "task.finish": "id rev! result file verdict conditions dispatch",
  "task.cancel": "id rev! reason!", "task.reopen": "id rev! reason! next",
  "record.save": "id rev! kind! title! file content inputs authors subject verdict conditions dispatch",
  "checkout.take": "rev! purpose!", "checkout.release": "rev! reason!",
  "checkout.recover": "rev! stopped! preserved!",
  "dispatch.reserve": "id task! taskRev! inspectAfter!",
  "dispatch.update": "id rev! state! observation! worker inspectAfter",
  "scope.set": "rev! mode! source!", "scope.authorize": "id rev! scopeRev! executor! inputs! source!",
}
function fields(args: readonly string[], spec: string): Record<string, string> {
  const result: Record<string, string> = Object.create(null) as Record<string, string>
  const keys = spec.split(" "), allowed = keys.map((key) => key.replace("!", ""))
  for (const arg of args) {
    const i = arg.indexOf("="), key = arg.slice(0, i)
    if (i < 1 || !allowed.includes(key) || Object.hasOwn(result, key)) throw new Error(`invalid or duplicate option: ${arg}`)
    result[key] = arg.slice(i + 1)
  }
  for (const key of keys.filter((key) => key.endsWith("!")).map((key) => key.slice(0, -1))) if (!result[key]?.trim()) throw new Error(`requires ${key}=`)
  return result
}
function integer(value: string, label: string): number {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error(`${label} must be a nonnegative integer`)
  return Number(value)
}
function reference(value: string): RecordRef {
  const match = /^(.+)@(\d+)$/.exec(value)
  if (!match || Number(match[2]) < 1) throw new Error(`expected id@positive-revision, got ${value}`)
  return { id: match[1]!, rev: integer(match[2]!, "revision") }
}
function refs(value: string): RecordRef[] { return value === "" || value === "none" ? [] : value.split(",").map(reference) }
function retained(directory: string, source: string): { content: string; path: string } {
  const path = resolve(source)
  if (!statSync(path).isFile()) throw new Error("file= must name a regular file")
  const bytes = readFileSync(path), digest = createHash("sha256").update(bytes).digest("hex")
  const relative = join("artifacts", digest)
  const destination = join(directory, relative)
  mkdirSync(dirname(destination), { recursive: true })
  if (existsSync(destination)) {
    if (!readFileSync(destination).equals(bytes)) throw new Error(`retained artifact corrupt: ${destination}`)
  } else {
    try { writeFileSync(destination, bytes, { flag: "wx" }) }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || !readFileSync(destination).equals(bytes)) throw error
    }
  }
  return { path: relative, content: JSON.stringify({ path: relative, sha256: digest, bytes: bytes.length, source: path }) }
}
function command(type: string, values: Record<string, string>, actor: string, directory: string): Command {
  const output: Record<string, unknown> = { type, actor, at: new Date().toISOString() }
  for (const [key, value] of Object.entries(values)) {
    if (["file", "subject", "verdict", "conditions", "dispatch", "waitReason"].includes(key)) continue
    if (["rev", "taskRev", "scopeRev"].includes(key)) output[key] = integer(value, key)
    else if (key === "inputs") output[key] = refs(value)
    else if (key === "requires") output[key] = refs(value).map(({ id, rev }) => ({ id, version: rev }))
    else if (key === "result" || key === "resolution") output[key] = reference(value)
    else if (key === "review") output[key] = value === "none" ? null : { subject: reference(value) }
    else if (key === "wait") output[key] = value === "none" ? null : { kind: value, reason: values.waitReason ?? "" }
    else if (key === "owner") {
      if (type === "task.claim" && value === "none") throw new Error("claim requires an actor; use task release to unassign")
      output[key] = value === "none" ? null : value
    }
    else if (key === "authors") output[key] = value ? value.split(",") : []
    else if (key === "worker") {
      const worker = JSON.parse(value) as Record<string, unknown>
      if (!worker || typeof worker.name !== "string" || typeof worker.pane !== "string" || !(worker.session === null || typeof worker.session === "string")) throw new Error("worker needs name, pane, session")
      output[key] = worker
    } else output[key] = value
  }
  if (values.waitReason && !values.wait) throw new Error("waitReason requires wait=")
  if (type === "record.save") {
    if (Boolean(values.file) === Boolean(values.content)) throw new Error("supply exactly one of file= or content=")
    if (values.file) Object.assign(output, retained(directory, values.file))
    if (values.subject) {
      if (!values.verdict) throw new Error("subject requires verdict=")
      output.assessment = { subject: reference(values.subject), verdict: values.verdict, conditions: values.conditions ?? "", ...(values.dispatch ? { dispatch: values.dispatch } : {}) }
    } else if (values.verdict || values.conditions || values.dispatch) throw new Error("assessment fields require subject=")
  }
  return output as unknown as Command
}
function finishCommands(state: State, values: Record<string, string>, actor: string, directory: string): readonly Command[] {
  if (Boolean(values.result) === Boolean(values.file)) throw new Error("finish requires exactly one of result= or file=")
  if (values.result) {
    if (values.verdict || values.conditions || values.dispatch) throw new Error("assessment fields accompany file=; result= uses the saved record")
    return [command("task.finish", values, actor, directory)]
  }
  const task = taskById(state, values.id!)
  if (!task) throw new Error(`missing task ${values.id}`)
  const id = `${task.id}-result-${state.revision + 1}`
  const data = { id, rev: "0", kind: task.review ? "assessment" : "result", title: task.outcome, file: values.file!, inputs: task.inputs.map((ref) => `${ref.id}@${ref.rev}`).join(",") }
  const assessment = task.review ? { subject: `${task.review.subject.id}@${task.review.subject.rev}`, verdict: values.verdict ?? "", conditions: values.conditions ?? "", ...(values.dispatch ? { dispatch: values.dispatch } : {}) } : {}
  if (!task.review && (values.verdict || values.conditions || values.dispatch)) throw new Error("assessment fields require a review task")
  return [command("record.save", { ...data, ...assessment }, actor, directory), command("task.finish", { id: task.id, rev: values.rev!, result: `${id}@1` }, actor, directory)]
}
export async function main(args: readonly string[]): Promise<number> {
  try {
    if (!args.length || args[0] === "--help" || args[0] === "help") { console.log(HELP); return 0 }
    const rawDirectory = process.env.LEDGER_DIR
    if (!rawDirectory) throw new Error("set LEDGER_DIR to the retained run directory")
    const directory = resolve(rawDirectory), path = join(directory, "ledger.db"), actor = process.env.LEDGER_ME ?? "master"
    const [group, verb, ...rest] = args
    if (group === "init") {
      if (actor !== "master") throw new Error("master initializes the shared record")
      const options = fields(args.slice(1), "goal! source! scope names")
      if (existsSync(path)) throw new Error("ledger already exists; resume it")
      const names: unknown = options.names ? JSON.parse(options.names) : { master: "master" }
      if (!names || Array.isArray(names) || typeof names !== "object" || Object.values(names).some((name) => typeof name !== "string")) throw new Error("names= must map actor ids to runtime names")
      const state = initialState({ goal: options.goal!, source: options.source!, scope: (options.scope ?? "fix") as ScopeMode, names: names as Record<string, string> })
      mkdirSync(directory, { recursive: true })
      const source = dirname(dirname(fileURLToPath(import.meta.url)))
      const bin = join(directory, "bin")
      if (existsSync(bin)) throw new Error("bin already exists without a ledger; inspect the interrupted setup")
      cpSync(source, bin, { recursive: true, filter: (entry) => !["node_modules", "test"].includes(entry.slice(entry.lastIndexOf("/") + 1)) })
      create(path, state)
      console.log(`Initialized schema ${state.schema}: ${directory}\nPinned helper: ${join(bin, "ledger.ts")}\n${renderStatus(state, actor)}`)
      return 0
    }
    if (group === "coordinate") return await coordinate(directory, args.slice(1))
    const snapshot = read(path)
    if (!Object.hasOwn(snapshot.state.names, actor)) throw new Error(`unknown actor ${actor}`)
    if (["status", "report", "timeline", "show"].includes(group!)) {
      if (group === "status" || group === "report") {
        if (args.length !== 1) throw new Error(`${group} accepts no options`)
        console.log(group === "status" ? renderStatus(snapshot.state, actor) : renderReport(snapshot.state)); return 0
      }
      if (group === "timeline") {
        if (args.length > 2) throw new Error("timeline accepts one actor or id")
        console.log(renderTimeline(snapshot.events, verb)); return 0
      }
      if (!verb) throw new Error("show requires an id")
      const options = fields(rest, "rev")
      const task = taskById(snapshot.state, verb)
      const record = snapshot.state.records.filter((item) => item.id === verb && (!options.rev || item.rev === integer(options.rev, "rev"))).at(-1)
      if (options.rev ? !record : !task && !record) throw new Error(`no ${options.rev ? "record revision" : "task or record"} ${verb}${options.rev ? "@" + options.rev : ""}`)
      console.log(JSON.stringify(options.rev ? record : task ?? record, null, 2)); return 0
    }
    const type = `${group}.${verb}`, spec = SPECS[type]
    if (!spec) throw new Error(`unknown command ${type}; see --help`)
    const positional = spec.startsWith("id "), id = positional ? rest[0] : undefined
    if (positional && (!id || id.includes("="))) throw new Error("command requires a positional id")
    const values = fields(positional ? rest.slice(1) : rest, spec.replace(/^id /, ""))
    if (id) values.id = id
    const result = mutate(path, (state) => type === "task.finish" ? finishCommands(state, values, actor, directory) : command(type, values, actor, directory))
    console.log(`Saved ${type}${id ? ` ${id}` : ""}; ledger revision ${result.state.revision}\n${renderStatus(result.state, actor)}`)
    return 0
  } catch (error) { console.error(`ledger: ${error instanceof Error ? error.message : String(error)}`); return 1 }
}
