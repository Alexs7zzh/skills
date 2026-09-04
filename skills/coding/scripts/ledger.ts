#!/usr/bin/env -S node --no-warnings
// The coding skill's run database. `ledger --help` lists the commands.
import { main } from "./src/cli.ts"

process.exitCode = main(process.argv.slice(2))
