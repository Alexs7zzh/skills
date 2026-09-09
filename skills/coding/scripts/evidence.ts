#!/usr/bin/env -S node --no-warnings
import { main } from "./src/evidence.ts"

process.exitCode = await main(process.argv.slice(2))
