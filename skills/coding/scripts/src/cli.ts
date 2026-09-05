// Argument parsing and file checks. Builds protocol commands, stores them, prints the result.
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"

import {
  COVERAGE_KINDS,
  HOW_FAR,
  LABELS,
  ROUTES,
  EXIT_KINDS,
  initialState,
  isSeat,
  rowById,
  transition,
  type Actor,
  type Command,
  type CoverageKind,
  type Declared,
  type Dependency,
  type Facts,
  type Label,
  type Moment,
  type Notification,
  type Seat,
  type State,
} from "./protocol.ts"
import { isActor, renderReport, renderStatus, renderTimeline, summary, type Notes } from "./report.ts"
import { StoreError, create, mutate, read, type Mutation } from "./store.ts"

export class InputError extends Error {}

const HELP = `ledger: the run's database. Set LEDGER_DIR=<run directory> and LEDGER_ME=<A|B|master>.

Rows carry a rev; every command on an existing row names the rev you read (rev=N).
Evidence and validation paths name retained files; validation content is fingerprinted.
Candidate dependency references are shelf-id@revision, separated by commas.

init --single | --joint | --cold [--route review|diagnose|write] [--how-far fix|report-only|check-in] [--deep]
     [--names "A=<agent> B=<agent> master=<agent>"] [--hunks a,b] [--symptoms a,b] [--clusters a,b] [--scenarios a,b]
run escalate [hunks=..] [symptoms=..] [clusters=..] [scenarios=..]     a quick or plain run becomes deep
run set how_far=<fix|report-only|check-in> reason=<the user's instruction>     continue this run
coverage add kind=<hunk|symptom|cluster|scenario> target=<name> [state=covered|gap] [note=..]
coverage set <C-id> rev=N state=<covered|gap> [note=..]
issue add label=<Bug|Restructure|Hardening|Nit|telemetry-quality> certainty=<1-5> claim=.. site=..
          [trigger= cause= scope= frequency= impact= rank=<1-5> detector= clusters= parents=]
          [state=verified evidence=<log> | state=assumed assumption=.. reason=.. | state=accepted reason=..]
issue set <I-id> rev=N <field>=..  [label=.. label_reason=..]       edit; clears marks here and downstream
issue verify <I-id> rev=N certainty=<3|4|5> evidence=<record>
issue assume <I-id> rev=N certainty=<1-5> assumption=.. reason=<why the uncertainty remains>
issue agree <I-id> rev=N                                              the other reviewer's mark
issue contest <I-id> rev=N probe=<what settles it>                    name the discriminating check
issue probe <I-id> rev=N verdict=<verified|disproved> certainty=<3|4|5> evidence=<record>
issue disprove <I-id> rev=N certainty=<3-5> evidence=<record>
issue duplicate <I-id> rev=N of=<I-id>
issue accept <I-id> rev=N reason=..                                   Nit only
issue take <I-id> rev=N | issue release <I-id> rev=N
issue exit <I-id> rev=N kind=<comment|ruling|todo> reference=..      how an unfixed issue leaves the run
issue drop <I-id> rev=N reason=..                                     master, on the user's word
question add [issues=<I-ids>] [fix=<P-id>] question=.. options="(a) .., (b) .." recommendation=<an option> effect=.. cost=..
question answer <Q-id> rev=N answer=..                                master, the user's words
proposed-fix add (issues=<I-ids> | goal=<feature goal>) shape=.. cost=..
          [origin=<mechanism or requirement> sites= rulings= test=<validation plan> guardrail= coordination=]
proposed-fix set <P-id> rev=N <field>=..
proposed-fix mark <P-id> rev=N | proposed-fix reject <P-id> rev=N reason=..   optional discussion, no writing gate
proposed-fix drop <P-id> rev=N reason=<the user's instruction>        retains candidate/evidence, invalidates dependents
shelved-fix add fixes=<P-ids> artifact=<saved candidate> baseline=<exact base> validation=<record> [dependencies=<S-id@rev,...>]
shelved-fix set <S-id> rev=N validation=<refreshed record> [artifact= baseline= dependencies=]
shelved-fix request-review <S-id> rev=N reason=..                     author: conditions resolved without changing candidate inputs or invalidating evidence
shelved-fix review <S-id> rev=N [conditions=..]                       clean, or conditions for the author
checkout take purpose=.. | checkout baseline build=<log> test=<log> | checkout release [reason=..]
check-in approve shelves=<S-ids> approval=<the user's words> [executor=<A|B|master>]     master
check-in record <K-id> rev=N changeset=.. [departures=..] | check-in drop <K-id> rev=N reason=..
import                                                                cold pass into the shared database
handoff                                                               two-reviewer run, when ready work is empty
status | report | timeline [A|B|master|<row-id>]      the run's record: who did and waited on what, or the argument on one row
`

// ---------------------------------------------------------------------------
// Environment and arguments

function runDirectory(): string {
  return resolve(process.env.LEDGER_DIR ?? ".")
}

function me(): Actor {
  const value = process.env.LEDGER_ME ?? ""
  if (value === "A" || value === "B" || value === "master") return value
  throw new InputError(`LEDGER_ME must be A, B, or master (got '${value || "unset"}')`)
}

function seatMe(): Seat {
  const actor = me()
  if (!isSeat(actor)) throw new InputError("LEDGER_ME must be A or B for this command")
  return actor
}

function now(): string {
  return new Date().toISOString()
}

type Fields = Map<string, string>

interface Parsed {
  readonly positional: string[]
  readonly fields: Fields
  readonly flags: Fields
}

function parse(tokens: readonly string[]): Parsed {
  const positional: string[] = []
  const fields: Fields = new Map()
  const flags: Fields = new Map()
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!
    if (token.startsWith("--")) {
      const equals = token.indexOf("=")
      if (equals > 0) flags.set(token.slice(2, equals), token.slice(equals + 1))
      else if (index + 1 < tokens.length && !tokens[index + 1]!.startsWith("--")) { flags.set(token.slice(2), tokens[index + 1]!); index += 1 }
      else flags.set(token.slice(2), "true")
      continue
    }
    const equals = token.indexOf("=")
    if (equals < 1) { positional.push(token); continue }
    const key = token.slice(0, equals)
    if (fields.has(key)) throw new InputError(`${key} was given twice`)
    fields.set(key, token.slice(equals + 1))
  }
  return { positional, fields, flags }
}

function required(fields: Fields, key: string): string {
  const value = fields.get(key)?.trim() ?? ""
  if (!value) throw new InputError(`missing ${key}=...`)
  return value
}

function optional(fields: Fields, key: string, fallback = ""): string {
  return fields.get(key)?.trim() ?? fallback
}

function only(fields: Fields, allowed: readonly string[]): void {
  for (const key of fields.keys()) if (!allowed.includes(key)) throw new InputError(`unknown field ${key}=; allowed: ${allowed.join(", ")}`)
}

function integer(fields: Fields, key: string): number {
  const raw = required(fields, key)
  if (!/^\d+$/.test(raw)) throw new InputError(`${key} must be an integer`)
  return Number(raw)
}

function rev(fields: Fields): number {
  return integer(fields, "rev")
}

function ids(fields: Fields, key: string, prefix: string, requiredList = true): string[] {
  const raw = optional(fields, key)
  const values = raw.split(/[\s,]+/).filter(Boolean)
  if (requiredList && values.length === 0) throw new InputError(`missing ${key}=<${prefix}-ids>`)
  for (const value of values) if (!value.startsWith(`${prefix}-`)) throw new InputError(`${value} is not a ${prefix} row id`)
  return values
}

function oneId(parsed: Parsed, prefix: string): string {
  if (parsed.positional.length !== 1) throw new InputError(`name exactly one ${prefix} row id`)
  const id = parsed.positional[0]!
  if (!id.startsWith(`${prefix}-`)) throw new InputError(`${id} is not a ${prefix} row id`)
  return id
}

function choice<T extends string>(value: string, allowed: readonly T[], what: string): T {
  if (!allowed.includes(value as T)) throw new InputError(`${what} must be one of ${allowed.join(", ")}`)
  return value as T
}

function tokens(raw: string): string[] {
  return raw.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean)
}

/** The compact "(a) .., (b) .." form, or a comma list. */
function options(raw: string): string[] {
  const starts = [...raw.matchAll(/(?:^|\s)\(([a-z])\)\s*/gi)]
  if (starts.length < 2) return raw.split(",").map((value) => value.trim()).filter(Boolean)
  return starts.map((start, index) => raw.slice(start.index + start[0].length, starts[index + 1]?.index ?? raw.length).trim().replace(/,\s*$/, ""))
}

/** A log the run keeps: a file in the run directory, stored by its relative path. */
function log(value: string, what: string): string {
  const directory = runDirectory()
  const absolute = isAbsolute(value) ? value : resolve(directory, value)
  if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new InputError(`${what} log does not exist: ${value}`)
  const inside = relative(directory, absolute)
  return inside.startsWith("..") ? absolute : inside
}

function declared(fields: Fields): Declared[] {
  return COVERAGE_KINDS.flatMap((coverage) => tokens(optional(fields, `${coverage}s`)).map((target) => ({ coverage, target })))
}

function facts(fields: Fields, prior?: Facts): Facts {
  const rank = fields.has("rank") ? integer(fields, "rank") : prior?.rank ?? null
  if (rank !== null && (rank < 1 || rank > 5)) throw new InputError("rank is 1 (highest user impact) to 5 (lowest)")
  return {
    claim: optional(fields, "claim", prior?.claim ?? ""),
    site: optional(fields, "site", prior?.site ?? ""),
    trigger: optional(fields, "trigger", prior?.trigger ?? ""),
    cause: optional(fields, "cause", prior?.cause ?? ""),
    scope: optional(fields, "scope", prior?.scope ?? ""),
    frequency: optional(fields, "frequency", prior?.frequency ?? ""),
    impact: optional(fields, "impact", prior?.impact ?? ""),
    rank,
    detector: optional(fields, "detector", prior?.detector ?? ""),
  }
}

const FACT_KEYS = ["claim", "site", "trigger", "cause", "scope", "frequency", "impact", "rank", "detector"]
const SHAPE_KEYS = ["goal", "origin", "shape", "sites", "rulings", "test", "cost", "guardrail", "coordination"]

function dependencies(fields: Fields): Dependency[] {
  return tokens(optional(fields, "dependencies")).map((value) => {
    const match = /^(S-[AB]-\d+)@(\d+)$/.exec(value)
    if (!match || Number(match[2]) < 1) throw new InputError("dependencies name explicit candidate revisions: S-A-1@2,S-B-1@1")
    return { id: match[1]!, rev: Number(match[2]) }
  })
}

function validation(fields: Fields): { validation: string; validationDigest: string } {
  const path = log(required(fields, "validation"), "validation")
  const contents = readFileSync(resolve(runDirectory(), path))
  if (!contents.toString("utf8").trim()) throw new InputError("the validation record must not be empty")
  const validationDigest = createHash("sha256").update(contents).digest("hex")
  const retained = join("validation", `${validationDigest}.txt`)
  mkdirSync(join(runDirectory(), "validation"), { recursive: true })
  writeFileSync(join(runDirectory(), retained), contents)
  return { validation: retained, validationDigest }
}

// ---------------------------------------------------------------------------
// Databases and notes

function sharedPath(): string {
  return join(runDirectory(), "ledger.db")
}

function coldPath(seat: Seat): string {
  return join(runDirectory(), `cold-${seat}.db`)
}

/** A reviewer works in its cold database until its import lands in the shared one. */
function activePath(actor: Actor): string {
  const shared = sharedPath()
  if (!existsSync(shared)) throw new InputError(`no ledger at ${shared}; run init first`)
  if (!isSeat(actor) || !existsSync(coldPath(actor))) return shared
  return read(shared).state.imported[actor] ? shared : coldPath(actor)
}

/**
 * The run's record in time order. After import, the shared database carries the
 * run; each cold pass's events join it here so a row's history starts where the
 * row was born. A cold moment's situations stay in its own database.
 */
function record(actor: Actor): Moment[] {
  const path = activePath(actor)
  const snapshot = read(path)
  if (path !== sharedPath() || snapshot.state.mode !== "joint") return [...snapshot.events]
  const merged: Moment[] = [...snapshot.events]
  for (const seat of ["A", "B"] as const) {
    if (existsSync(coldPath(seat))) merged.push(...read(coldPath(seat)).events.map((event) => ({ ...event, situations: {} })))
  }
  return merged.sort((left, right) => left.at.localeCompare(right.at))
}

function notesPath(seat: Seat): string {
  return join(runDirectory(), `${seat}-notes.md`)
}

function readNotes(state: State): Notes {
  const notes: Notes = {}
  for (const seat of ["A", "B"] as const) {
    if (existsSync(notesPath(seat))) notes[seat] = readFileSync(notesPath(seat), "utf8")
  }
  return notes
}

/** The slots the report needs from a reviewer's notes. */
function checkNotes(state: State, seat: Seat): void {
  const path = notesPath(seat)
  if (!existsSync(path)) throw new InputError(`write ${path} first: a passes: line, a retrospective: line${state.route === "review" ? ", Goal closure, Domain scenarios" : ""}`)
  const notes = readFileSync(path, "utf8")
  const missing: string[] = []
  if (!/^passes:\s*\S/im.test(notes)) missing.push("a 'passes: N sweeps, N lenses, N probes, N diff reviews' line")
  if (/^passes:.*\b0\b/im.test(notes) && !/^skipped:\s*\S/im.test(notes)) missing.push("a 'skipped:' line naming each pass with a zero count and why")
  if (!/^retrospective:\s*\S/im.test(notes)) missing.push("a 'retrospective:' line")
  if (state.route === "review" && state.deep) {
    if (!/^#+\s*Goal closure/im.test(notes)) missing.push("a 'Goal closure' section")
    if (!/^#+\s*Domain scenarios/im.test(notes)) missing.push("a 'Domain scenarios' section")
  }
  if (missing.length > 0) throw new InputError(`${path} needs ${missing.join("; ")}`)
}

// ---------------------------------------------------------------------------
// Messages

function deliver(notifications: readonly Notification[], names: Readonly<Record<Actor, string>>): void {
  const configured = (process.env.LEDGER_NOTIFY ?? "herdr agent prompt").trim()
  for (const notification of notifications) {
    const to = names[notification.to] || notification.to
    if (configured && configured !== "print") {
      const [command, ...prefix] = configured.split(/\s+/)
      const child = spawnSync(command!, [...prefix, to, notification.message], { encoding: "utf8", timeout: 10_000 })
      if (!child.error && child.status === 0) continue
    }
    console.log(`message for ${to}: ${notification.message}`)
  }
}

function report(result: Mutation, actor: Actor, line: string): void {
  deliver(result.notifications, result.state.names)
  console.log(line)
  console.log(summary(result.state, actor))
}

// ---------------------------------------------------------------------------
// Commands

function init(parsed: Parsed): void {
  const flags = parsed.flags
  const actor = me()
  const directory = runDirectory()
  const at = now()
  const modes = ["single", "joint", "cold"].filter((mode) => flags.has(mode))
  if (modes.length !== 1) throw new InputError("init needs exactly one of --single, --joint, --cold")
  if (modes[0] === "cold") {
    const seat = seatMe()
    const shared = read(sharedPath()).state
    if (shared.mode !== "joint") throw new InputError("--cold belongs to a two-reviewer run")
    if (existsSync(coldPath(seat))) throw new InputError(`${coldPath(seat)} already exists`)
    const state = initialState({ mode: "cold", seat, route: shared.route, howFar: shared.howFar, names: shared.names, declared: shared.declared })
    create(coldPath(seat), state, { at, actor: seat, command: "init", row: "run", note: `cold pass of ${seat} begins` })
    console.log(`cold database for ${seat}: ${coldPath(seat)}`)
    console.log(summary(state, seat))
    return
  }
  if (existsSync(sharedPath())) throw new InputError(`${sharedPath()} already exists; a run directory holds one run`)
  const mode = modes[0] as "single" | "joint"
  if (mode === "single" && actor !== "A") throw new InputError("a single run is seat A: LEDGER_ME=A")
  if (mode === "joint" && actor !== "master") throw new InputError("the master creates a two-reviewer run: LEDGER_ME=master")
  const names: Record<Actor, string> = { A: "A", B: "B", master: "master" }
  for (const assignment of tokens(optional(flags, "names"))) {
    const [key, ...rest] = assignment.split("=")
    if (!(key === "A" || key === "B" || key === "master") || rest.length === 0) throw new InputError("--names takes A=<agent> B=<agent> master=<agent>")
    names[key] = rest.join("=")
  }
  if (mode === "joint" && (names.A === "A" || names.B === "B")) throw new InputError("--names must name both reviewer agents so the script can message them")
  const state = initialState({
    mode,
    deep: flags.get("deep") === "true",
    route: choice(optional(flags, "route", "review"), ROUTES, "--route"),
    howFar: choice(optional(flags, "how-far", "fix"), HOW_FAR, "--how-far"),
    names,
    declared: declared(flags),
  })
  pin(directory)
  create(sharedPath(), state, { at, actor, command: "init", row: "run", note: `${mode} ${state.route} run, ${state.howFar}` })
  console.log(`${mode} ${state.deep ? "deep " : ""}${state.route} run (${state.howFar}): ${sharedPath()}`)
  console.log(`pinned script: ${join(directory, "bin", "ledger.ts")}`)
  console.log(summary(state, actor))
}

/** Copy this script into the run so a skill update cannot change a live run's rules. */
function pin(directory: string): void {
  const source = dirname(import.meta.dirname)
  const bin = join(directory, "bin")
  mkdirSync(join(bin, "src"), { recursive: true })
  cpSync(join(source, "ledger.ts"), join(bin, "ledger.ts"))
  cpSync(join(source, "src"), join(bin, "src"), { recursive: true, filter: (file) => statSync(file).isDirectory() || file.endsWith(".ts") })
}

function issueCommand(verb: string, parsed: Parsed, state: State): Command {
  const actor = me()
  const at = now()
  const fields = parsed.fields
  if (verb === "add") {
    only(fields, ["label", "certainty", ...FACT_KEYS, "clusters", "parents", "state", "evidence", "assumption", "reason"])
    const issueState = choice(optional(fields, "state", "new"), ["new", "verified", "assumed", "accepted"] as const, "state")
    return {
      type: "issue.add", actor, at, label: choice(required(fields, "label"), LABELS, "label") as Label, certainty: integer(fields, "certainty"),
      facts: facts(fields), parents: ids(fields, "parents", "I", false), clusters: tokens(optional(fields, "clusters")), state: issueState,
      evidence: issueState === "verified" ? log(required(fields, "evidence"), "evidence") : "", assumption: optional(fields, "assumption"), reason: optional(fields, "reason"),
    }
  }
  if (verb === "drop") {
    const id = oneId(parsed, "I")
    only(fields, ["rev", "reason"])
    return { type: "issue.exit", actor, at, id, rev: rev(fields), exit: "drop", reference: required(fields, "reason") }
  }
  const id = oneId(parsed, "I")
  const base = { actor, at, id, rev: rev(fields) }
  switch (verb) {
    case "set": {
      only(fields, ["rev", ...FACT_KEYS, "label", "label_reason", "certainty", "clusters", "parents"])
      const issue = rowById(state, id)
      const prior = issue?.kind === "Issue" ? issue.facts : undefined
      const changed: Partial<Facts> = {}
      const next = facts(fields, prior)
      for (const key of FACT_KEYS as (keyof Facts)[]) if (fields.has(key)) (changed as Record<string, unknown>)[key] = next[key]
      return {
        type: "issue.set", ...base, facts: changed, labelReason: optional(fields, "label_reason"),
        ...(fields.has("label") ? { label: choice(required(fields, "label"), LABELS, "label") as Label } : {}),
        ...(fields.has("certainty") ? { certainty: integer(fields, "certainty") } : {}),
        ...(fields.has("parents") ? { parents: ids(fields, "parents", "I", false) } : {}),
        ...(fields.has("clusters") ? { clusters: tokens(optional(fields, "clusters")) } : {}),
      }
    }
    case "verify": only(fields, ["rev", "certainty", "evidence"]); return { type: "issue.verify", ...base, certainty: integer(fields, "certainty"), evidence: log(required(fields, "evidence"), "evidence") }
    case "assume": only(fields, ["rev", "certainty", "assumption", "reason"]); return { type: "issue.assume", ...base, certainty: integer(fields, "certainty"), assumption: required(fields, "assumption"), reason: required(fields, "reason") }
    case "agree": only(fields, ["rev"]); return { type: "issue.agree", ...base }
    case "contest": only(fields, ["rev", "probe"]); return { type: "issue.contest", ...base, probe: required(fields, "probe") }
    case "probe": only(fields, ["rev", "verdict", "certainty", "evidence"]); return { type: "issue.probe", ...base, verdict: choice(required(fields, "verdict"), ["verified", "disproved"] as const, "verdict"), certainty: integer(fields, "certainty"), evidence: log(required(fields, "evidence"), "evidence") }
    case "disprove": only(fields, ["rev", "certainty", "evidence"]); return { type: "issue.disprove", ...base, certainty: integer(fields, "certainty"), evidence: log(required(fields, "evidence"), "evidence") }
    case "duplicate": only(fields, ["rev", "of"]); return { type: "issue.duplicate", ...base, of: required(fields, "of") }
    case "accept": only(fields, ["rev", "reason"]); return { type: "issue.accept", ...base, reason: required(fields, "reason") }
    case "take": only(fields, ["rev"]); return { type: "issue.take", ...base }
    case "release": only(fields, ["rev"]); return { type: "issue.release", ...base }
    case "exit": only(fields, ["rev", "kind", "reference"]); return { type: "issue.exit", ...base, exit: choice(required(fields, "kind"), EXIT_KINDS.filter((kind) => kind !== "drop"), "kind"), reference: required(fields, "reference") }
    default: throw new InputError(`unknown issue command '${verb}'`)
  }
}

function build(noun: string, verb: string, parsed: Parsed, state: State): Command {
  const actor = me()
  const at = now()
  const fields = parsed.fields
  if (noun === "handoff") {
    // The rules first (ready work, checkout), then the notes the report needs.
    const command: Command = { type: "handoff", actor, at }
    const dry = transition(state, command)
    if (!dry.ok) throw new InputError(dry.error)
    if (isSeat(actor)) checkNotes(state, actor)
    return command
  }
  switch (`${noun} ${verb}`) {
    case "run set":
      only(fields, ["how_far", "reason"])
      return { type: "run.set", actor, at, howFar: choice(required(fields, "how_far"), HOW_FAR, "how_far"), reason: required(fields, "reason") }
    case "run escalate":
      only(fields, COVERAGE_KINDS.map((kind) => `${kind}s`))
      return { type: "run.escalate", actor, at, declared: declared(fields) }
    case "coverage add":
      only(fields, ["kind", "target", "state", "note"])
      return { type: "coverage.add", actor, at, coverage: choice(required(fields, "kind"), COVERAGE_KINDS, "kind") as CoverageKind, target: required(fields, "target"), state: choice(optional(fields, "state", "open"), ["open", "covered", "gap"] as const, "state"), note: optional(fields, "note") }
    case "coverage set":
      only(fields, ["rev", "state", "note"])
      return { type: "coverage.set", actor, at, id: oneId(parsed, "C"), rev: rev(fields), state: choice(required(fields, "state"), ["covered", "gap"] as const, "state"), note: optional(fields, "note") }
    case "question add":
      only(fields, ["issues", "fix", "question", "options", "recommendation", "effect", "cost"])
      return { type: "question.add", actor, at, issues: ids(fields, "issues", "I", false), fix: optional(fields, "fix"), question: required(fields, "question"), options: options(required(fields, "options")), recommendation: required(fields, "recommendation"), effect: required(fields, "effect"), cost: required(fields, "cost") }
    case "question answer":
      only(fields, ["rev", "answer"])
      return { type: "question.answer", actor, at, id: oneId(parsed, "Q"), rev: rev(fields), answer: required(fields, "answer") }
    case "proposed-fix add":
      only(fields, ["issues", ...SHAPE_KEYS])
      return {
        type: "proposed-fix.add", actor, at, issues: ids(fields, "issues", "I", false), goal: optional(fields, "goal"),
        origin: optional(fields, "origin"), shape: optional(fields, "shape"), sites: optional(fields, "sites"), rulings: optional(fields, "rulings"),
        test: optional(fields, "test"), cost: optional(fields, "cost"), guardrail: optional(fields, "guardrail"), coordination: optional(fields, "coordination"),
      }
    case "proposed-fix set": {
      only(fields, ["rev", ...SHAPE_KEYS])
      const command: Command = { type: "proposed-fix.set", actor, at, id: oneId(parsed, "P"), rev: rev(fields) }
      const changes: Record<string, string | boolean> = {}
      for (const key of SHAPE_KEYS) if (fields.has(key)) changes[key] = optional(fields, key)
      return { ...command, ...changes } as Command
    }
    case "proposed-fix mark":
      only(fields, ["rev"])
      return { type: "proposed-fix.mark", actor, at, id: oneId(parsed, "P"), rev: rev(fields) }
    case "proposed-fix reject":
      only(fields, ["rev", "reason"])
      return { type: "proposed-fix.reject", actor, at, id: oneId(parsed, "P"), rev: rev(fields), reason: required(fields, "reason") }
    case "proposed-fix drop":
      only(fields, ["rev", "reason"])
      return { type: "proposed-fix.drop", actor, at, id: oneId(parsed, "P"), rev: rev(fields), reason: required(fields, "reason") }
    case "shelved-fix add":
      only(fields, ["fixes", "artifact", "baseline", "dependencies", "validation"])
      return { type: "shelved-fix.add", actor, at, fixes: ids(fields, "fixes", "P"), artifact: required(fields, "artifact"), baseline: required(fields, "baseline"), dependencies: dependencies(fields), ...validation(fields) }
    case "shelved-fix set": {
      only(fields, ["rev", "artifact", "baseline", "dependencies", "validation"])
      return {
        type: "shelved-fix.set", actor, at, id: oneId(parsed, "S"), rev: rev(fields), ...validation(fields),
        ...(fields.has("artifact") ? { artifact: required(fields, "artifact") } : {}),
        ...(fields.has("baseline") ? { baseline: required(fields, "baseline") } : {}),
        ...(fields.has("dependencies") ? { dependencies: dependencies(fields) } : {}),
      }
    }
    case "shelved-fix request-review":
      only(fields, ["rev", "reason"])
      return { type: "shelved-fix.request-review", actor, at, id: oneId(parsed, "S"), rev: rev(fields), reason: required(fields, "reason") }
    case "shelved-fix review":
      only(fields, ["rev", "conditions"])
      return { type: "shelved-fix.review", actor, at, id: oneId(parsed, "S"), rev: rev(fields), conditions: optional(fields, "conditions") }
    case "checkout take":
      only(fields, ["purpose"])
      return { type: "checkout.take", actor, at, purpose: required(fields, "purpose") }
    case "checkout baseline":
      only(fields, ["build", "test"])
      return { type: "checkout.baseline", actor, at, build: log(required(fields, "build"), "build"), test: log(required(fields, "test"), "test") }
    case "checkout release":
      only(fields, ["reason"])
      return { type: "checkout.release", actor, at, reason: optional(fields, "reason") }
    case "check-in approve":
      only(fields, ["shelves", "approval", "executor"])
      return { type: "check-in.approve", actor, at, shelves: ids(fields, "shelves", "S"), approval: required(fields, "approval"), executor: choice(optional(fields, "executor", "master"), ["A", "B", "master"] as const, "executor") }
    case "check-in record":
      only(fields, ["rev", "changeset", "departures"])
      return { type: "check-in.record", actor, at, id: oneId(parsed, "K"), rev: rev(fields), changeset: required(fields, "changeset"), departures: optional(fields, "departures", "none") }
    case "check-in drop":
      only(fields, ["rev", "reason"])
      return { type: "check-in.drop", actor, at, id: oneId(parsed, "K"), rev: rev(fields), reason: required(fields, "reason") }
    default:
      if (noun === "issue") return issueCommand(verb, parsed, state)
      throw new InputError(`unknown command '${noun} ${verb}'.\n${HELP}`)
  }
}

function importCold(): void {
  const seat = seatMe()
  const cold = coldPath(seat)
  if (!existsSync(cold)) throw new InputError(`no cold database at ${cold}; run init --cold first`)
  const snapshot = read(cold)
  if (snapshot.state.mode !== "cold") throw new InputError(`${cold} is not a cold database`)
  const rows = snapshot.state.rows.filter((row) => row.kind === "Coverage" || row.kind === "Issue")
  const result = mutate(sharedPath(), () => ({ type: "cold.import", actor: seat, at: now(), rows }))
  report(result, seat, `imported ${rows.length} rows from ${seat}'s cold pass`)
}

function printReport(): void {
  const actor = me()
  const snapshot = read(activePath(actor))
  const state = snapshot.state
  if (state.mode === "cold") throw new InputError("import the cold pass first; the report comes from the shared database")
  if (state.mode === "joint" && actor !== "master") throw new InputError("the master prints a two-reviewer run's report")
  if (state.mode === "single" && actor !== "A") throw new InputError("seat A prints a single run's report")
  if (state.deep || state.route === "diagnose") {
    for (const seat of state.mode === "single" ? ["A"] as const : ["A", "B"] as const) {
      if (state.mode === "single" || state.handedOff[seat]) checkNotes(state, seat)
    }
  }
  const text = renderReport(state, record(actor), readNotes(state))
  const destination = join(runDirectory(), "report.md")
  writeFileSync(destination, text)
  console.log(text)
  console.log(`report written: ${destination}`)
  console.log(summary(state, actor))
}

export function main(argv: readonly string[]): number {
  try {
    const [noun = "", ...rest] = argv
    if (noun === "" || noun === "--help" || noun === "-h" || noun === "help") { console.log(HELP); return 0 }
    const parsed = parse(rest)
    const nouns = ["init", "status", "report", "timeline", "import", "handoff", "run", "coverage", "issue", "question", "proposed-fix", "shelved-fix", "checkout", "check-in"]
    if (!nouns.includes(noun)) throw new InputError(`unknown command '${noun}'.\n${HELP}`)
    if (noun === "init") { init(parsed); return 0 }
    const actor = me()
    if (noun === "status") { console.log(renderStatus(read(activePath(actor)).state, actor)); return 0 }
    if (noun === "report") { printReport(); return 0 }
    if (noun === "timeline") {
      const chosen = parsed.positional[0]
      if (parsed.positional.length > 1) throw new InputError("timeline takes one of A, B, master, or a row id")
      const events = record(actor)
      if (chosen !== undefined && !isActor(chosen) && !events.some((event) => event.row === chosen)) throw new InputError(`no events on ${chosen}; timeline takes A, B, master, or a row id`)
      console.log(renderTimeline(events, chosen))
      return 0
    }
    if (noun === "import") { importCold(); return 0 }
    const verb = noun === "handoff" ? "" : parsed.positional.shift() ?? ""
    const path = activePath(actor)
    const result = mutate(path, (state) => build(noun, verb, parsed, state))
    const last = result.events.at(-1)
    report(result, actor, last ? `${last.row}: ${last.note}` : "recorded")
    return 0
  } catch (error) {
    if (error instanceof InputError || error instanceof StoreError) {
      console.error(`ledger: ${error.message}`)
      return 1
    }
    throw error
  }
}
