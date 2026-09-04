#!/usr/bin/env node

import { chmod, readFile } from "node:fs/promises"
import { build } from "esbuild"

const entry = new URL("src/cli.ts", import.meta.url)
const source = await readFile(entry, "utf8")

await build({
  absWorkingDir: import.meta.dirname,
  entryPoints: ["src/cli.ts"],
  outfile: "ledger.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22.16",
  banner: source.startsWith("#!") ? undefined : { js: "#!/usr/bin/env -S node --no-warnings" },
  legalComments: "none",
  sourcemap: false,
  minify: false,
  packages: "bundle"
})

await chmod("ledger.mjs", 0o755)
