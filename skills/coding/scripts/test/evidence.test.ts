import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import test from "node:test"
import { inspect } from "../src/evidence.ts"

const source = resolve("evidence.ts")
const root = () => mkdtempSync(join(tmpdir(), "coding-evidence-test-"))
const execute = (args: string[]) => spawnSync(process.execPath, ["--no-warnings", source, ...args], { encoding: "utf8" })
const node = (...args: string[]) => [process.execPath, ...args]

test("help is discoverable at the root and command without starting a capture", () => {
  for (const args of [[], ["--help"], ["help"], ["run", "--help"], ["inspect", "--help"]]) {
    const result = execute(args)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /run <new-directory>/)
  }
})

test("capture preserves literal argv, selected input bytes and raw output without inferring a test verdict", () => {
  const directory = root(), capture = join(directory, "capture"), input = join(directory, "input.txt")
  writeFileSync(input, "before")
  const script = 'process.stdout.write(Buffer.from([0, 255, 10])); process.stderr.write("FAIL: a check can print this and exit zero");'
  const result = execute(["run", capture, "--cwd", directory, "--input", "input.txt", "--", ...node("-e", script, "literal $() ; value")])
  assert.equal(result.status, 0, result.stderr)
  const observation = inspect(capture)
  assert.deepEqual(observation.start.argv, node("-e", script, "literal $() ; value"))
  assert.equal(observation.start.cwd, directory)
  assert.equal(observation.receipt!.termination, "exited")
  assert.equal(observation.receipt!.exitCode, 0)
  assert.deepEqual(readFileSync(join(capture, "stdout.log")), Buffer.from([0, 255, 10]))
  assert.match(readFileSync(join(capture, "stderr.log"), "utf8"), /^FAIL:/)
  assert.equal(readFileSync(join(capture, "input-0"), "utf8"), "before")
  writeFileSync(input, "after")
  assert.equal(inspect(capture).start.inputs[0]!.source, input, "later source edits do not rewrite the recorded input")
})

test("nonzero exits and launch failure retain actual outcomes, never expected output", () => {
  const directory = root(), red = join(directory, "red"), absent = join(directory, "absent")
  assert.equal(execute(["run", red, "--", ...node("-e", 'console.log("actual mismatch"); process.exit(7)')]).status, 7)
  assert.equal(inspect(red).receipt!.exitCode, 7)
  assert.equal(inspect(red).receipt!.termination, "exited")
  assert.equal(execute(["inspect", red]).status, 0, "inspect checks capture integrity, not workload success")
  assert.equal(execute(["run", absent, "--", join(directory, "not-an-executable")]).status, 1)
  assert.equal(inspect(absent).receipt!.termination, "launch-failed")
  assert.match(inspect(absent).receipt!.error!, /ENOENT/)
  assert.equal(readFileSync(join(absent, "stdout.log"), "utf8"), "")
})

test("a capture cannot overwrite an earlier observation or execute through invalid options", () => {
  const directory = root(), capture = join(directory, "capture"), touched = join(directory, "must-not-exist")
  assert.equal(execute(["run", capture, "--", ...node("-e", "")]).status, 0)
  const original = readFileSync(join(capture, "receipt.json"))
  const sideEffect = node("-e", 'require("fs").writeFileSync(process.argv[1], "bad")', touched)
  assert.equal(execute(["run", capture, "--", ...sideEffect]).status, 1)
  assert.deepEqual(readFileSync(join(capture, "receipt.json")), original)
  assert.equal(execute(["run", join(directory, "invalid"), "--unknown", "value", "--", ...sideEffect]).status, 1)
  assert.equal(execute(["run", join(directory, "invalid2"), "--cwd", directory, "--cwd", directory, "--", ...sideEffect]).status, 1)
  assert.equal(existsSync(touched), false)
})

test("inspection rejects changed retained output, invocation and input bytes", () => {
  for (const target of ["stdout.log", "stderr.log", "start.json", "input-0"]) {
    const directory = root(), capture = join(directory, "capture"), input = join(directory, "input")
    writeFileSync(input, "input")
    assert.equal(execute(["run", capture, "--input", input, "--", ...node("-e", 'console.log("returned")')]).status, 0)
    const file = join(capture, target)
    writeFileSync(file, target === "start.json" ? JSON.stringify({ ...inspect(capture).start, cwd: "/different" }) : "changed")
    assert.throws(() => inspect(capture), /capture bytes changed/)
    assert.equal(execute(["inspect", capture]).status, 1)
  }
})

test("running output stays partial and interruption cannot become completed success", { timeout: 10000 }, async (t) => {
  const directory = root(), capture = join(directory, "capture")
  const script = 'process.on("SIGTERM", () => { console.log("stopped after first case"); process.exit(0) }); console.log("case 1 actually returned"); setInterval(() => {}, 1000)'
  const child = spawn(process.execPath, ["--no-warnings", source, "run", capture, "--", ...node("-e", script)], { stdio: ["ignore", "pipe", "pipe"] })
  t.after(() => { if (child.exitCode === null) child.kill("SIGTERM") })
  let error = ""
  child.stderr.on("data", (bytes: Buffer) => { error += bytes.toString() })
  const done = new Promise<number | null>((finish) => child.on("close", finish))
  const deadline = Date.now() + 5000
  while (!existsSync(join(capture, "stdout.log")) || !readFileSync(join(capture, "stdout.log"), "utf8").includes("case 1 actually returned")) {
    assert.ok(Date.now() < deadline, `child did not return first case: ${error}`)
    await new Promise((resume) => setTimeout(resume, 10))
  }
  assert.equal(inspect(capture).receipt, null)
  assert.equal(execute(["inspect", capture]).status, 1)
  child.kill("SIGTERM")
  assert.equal(await done, 1, error)
  const result = inspect(capture)
  assert.equal(result.receipt!.termination, "interrupted")
  assert.equal(result.receipt!.interrupt, "SIGTERM")
  assert.equal(result.receipt!.exitCode, 0, "actual child exit zero is retained but cannot erase interruption")
  assert.match(readFileSync(join(capture, "stdout.log"), "utf8"), /case 1 actually returned\nstopped after first case/)
})
