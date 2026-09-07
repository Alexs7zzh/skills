import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

const helper = process.env.COLD_READ_HELPER ?? join(import.meta.dirname, "..", "ledger.ts")

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "ledger-cold-start-"))
  const run = (seat: string, ...args: string[]) => {
    const pinned = join(directory, "bin", "ledger.ts")
    return spawnSync(process.execPath, ["--no-warnings", existsSync(pinned) ? pinned : helper, ...args], {
      encoding: "utf8", env: { ...process.env, LEDGER_DIR: directory, LEDGER_ME: seat, LEDGER_NOTIFY: "print" },
    })
  }
  const ok = (seat: string, ...args: string[]) => {
    const result = run(seat, ...args)
    assert.equal(result.status, 0, result.stderr)
    return result.stdout
  }
  return { run, ok }
}

test("ordinary reads cannot expose shared conclusions before cold initialization or import", () => {
  const f = fixture()
  f.ok("master", "init", "--joint", "--names", "A=first B=late master=lead")
  f.ok("A", "init", "--cold")
  f.ok("A", "issue", "add", "label=Bug", "certainty=2", "claim=PRIVATE_A_CONCLUSION", "site=fixture.ts:1")
  f.ok("A", "import")
  for (const command of ["status", "timeline"]) {
    const result = f.run("B", command)
    assert.equal(result.status, 1, `${command} must refuse shared reads before cold init`)
    assert.match(result.stderr, /init --cold/)
    assert.doesNotMatch(result.stdout + result.stderr, /PRIVATE_A_CONCLUSION/)
    assert.match(f.ok("master", command), /PRIVATE_A_CONCLUSION/, "the coordinator can still read shared work")
  }
  f.ok("B", "init", "--cold")
  f.ok("B", "issue", "add", "label=Bug", "certainty=2", "claim=PRIVATE_B_CONCLUSION", "site=fixture.ts:2")
  for (const command of ["status", "timeline"]) {
    const output = f.ok("B", command)
    assert.match(output, /PRIVATE_B_CONCLUSION/)
    assert.doesNotMatch(output, /PRIVATE_A_CONCLUSION/)
  }
  f.ok("B", "import")
  for (const command of ["status", "timeline"]) {
    const output = f.ok("B", command)
    assert.match(output, /PRIVATE_A_CONCLUSION/)
    assert.match(output, /PRIVATE_B_CONCLUSION/)
  }
})

test("single-run readers use the existing shared record without a cold pass", () => {
  const f = fixture()
  f.ok("A", "init", "--single")
  f.ok("A", "issue", "add", "label=Bug", "certainty=2", "claim=SINGLE_CLAIM", "site=fixture.ts:1")
  for (const seat of ["A", "B", "master"]) for (const command of ["status", "timeline"]) assert.match(f.ok(seat, command), /SINGLE_CLAIM/)
})
