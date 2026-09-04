import { CliError } from "effect/unstable/cli"

export class InputError extends CliError.UserError {
  constructor(message: string) {
    super({ cause: new Error(message), userMessage: message })
  }
}

export type Fields = ReadonlyMap<string, string>

export interface ParsedFields {
  readonly positional: readonly string[]
  readonly fields: Fields
}

export function parseFields(tokens: readonly string[]): ParsedFields {
  const positional: Array<string> = []
  const fields = new Map<string, string>()
  for (const token of tokens) {
    const separator = token.indexOf("=")
    if (separator < 1) {
      positional.push(token)
      continue
    }
    const key = token.slice(0, separator).trim()
    const value = token.slice(separator + 1)
    if (!key) throw new InputError(`invalid field '${token}'`)
    if (fields.has(key)) throw new InputError(`field '${key}' was provided twice`)
    fields.set(key, value)
  }
  return { positional, fields }
}

export function allowOnly(fields: Fields, allowed: readonly string[]): void {
  const accepted = new Set(allowed)
  for (const key of fields.keys()) {
    if (!accepted.has(key)) {
      throw new InputError(`unknown field '${key}'; allowed: ${allowed.join(", ")}`)
    }
  }
}

export function required(fields: Fields, key: string): string {
  const value = fields.get(key)?.trim() ?? ""
  if (!value) throw new InputError(`missing ${key}=...`)
  return value
}

export function optional(fields: Fields, key: string, fallback = ""): string {
  return fields.get(key)?.trim() ?? fallback
}

export function requiredRevision(fields: Fields): number {
  const raw = required(fields, "rev")
  if (!/^\d+$/.test(raw)) throw new InputError(`rev must be a non-negative integer (got '${raw}')`)
  return Number(raw)
}

export function integerInRange(fields: Fields, key: string, minimum: number, maximum: number): number {
  const raw = required(fields, key)
  if (!/^\d+$/.test(raw)) throw new InputError(`${key} must be an integer from ${minimum} to ${maximum}`)
  const value = Number(raw)
  if (value < minimum || value > maximum) {
    throw new InputError(`${key} must be an integer from ${minimum} to ${maximum}`)
  }
  return value
}

export function booleanField(fields: Fields, key: string, fallback = false): boolean {
  const raw = fields.get(key)
  if (raw === undefined) return fallback
  if (raw === "yes" || raw === "true") return true
  if (raw === "no" || raw === "false") return false
  throw new InputError(`${key} must be yes or no`)
}

export function listField(fields: Fields, key: string, requiredValue = true): readonly string[] {
  const raw = fields.get(key)?.trim() ?? ""
  if (!raw) {
    if (requiredValue) throw new InputError(`missing ${key}=...`)
    return []
  }
  const values = raw.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean)
  if (requiredValue && values.length === 0) throw new InputError(`${key} must not be empty`)
  return values
}

/** Parse the compact `(a) ... (b) ...` form used by the skill. */
export function optionList(raw: string): readonly string[] {
  const starts = [...raw.matchAll(/(?:^|\s)(\([a-z]\))\s*/gi)]
  if (starts.length < 2) return raw.split(",").map((value) => value.trim()).filter(Boolean)
  const values: Array<string> = []
  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index]!
    const end = starts[index + 1]?.index ?? raw.length
    const offset = (start.index ?? 0) + start[0].length
    values.push(raw.slice(offset, end).trim())
  }
  return values
}

export function assertOnePositional(parsed: ParsedFields, noun: string): string {
  if (parsed.positional.length !== 1) {
    throw new InputError(`${noun} needs exactly one row id`)
  }
  return parsed.positional[0]!
}

export function assertNoPositionals(parsed: ParsedFields, noun: string): void {
  if (parsed.positional.length > 0) {
    throw new InputError(`${noun} does not accept positional arguments: ${parsed.positional.join(" ")}`)
  }
}
