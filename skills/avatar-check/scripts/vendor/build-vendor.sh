#!/bin/bash
# Rebuild codecs.mjs, the .wasm files, and LICENSES.md from pinned npm packages.
# Needs node, npm, and network access. Run from any directory.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"
npm init -y >/dev/null
npm install --silent @jsquash/webp@1.5.0 @jsquash/png@3.1.1 @jsquash/jpeg@1.6.0 @jsquash/resize@2.1.1 @jsquash/oxipng@2.3.0 gltf-validator@2.0.0-dev.3.10 esbuild@0.28.2
cp "$HERE/entry.mjs" .
npx esbuild entry.mjs --bundle --platform=node --format=esm --target=node18 --outfile="$HERE/codecs.mjs" --log-level=warning \
  "--banner:js=import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);"
for p in png/codec/pkg/squoosh_png_bg.wasm jpeg/codec/enc/mozjpeg_enc.wasm jpeg/codec/dec/mozjpeg_dec.wasm \
         webp/codec/enc/webp_enc.wasm webp/codec/dec/webp_dec.wasm resize/lib/resize/pkg/squoosh_resize_bg.wasm oxipng/codec/pkg/squoosh_oxipng_bg.wasm; do
  cp "node_modules/@jsquash/$p" "$HERE/"
done
{
  echo "# Third-party licenses"; echo; echo "Bundled into codecs.mjs and the .wasm files beside it."
  for p in webp png jpeg resize oxipng; do
    echo; echo "## @jsquash/$p $(node -p "require('./node_modules/@jsquash/$p/package.json').version")"; echo
    cat "node_modules/@jsquash/$p/LICENSE"
    for c in $(find "node_modules/@jsquash/$p" -name 'LICENSE.codec.md'); do
      echo; echo "### $(dirname "${c#node_modules/}")"; echo; cat "$c"
    done
  done
  echo; echo "## gltf-validator $(node -p "require('./node_modules/gltf-validator/package.json').version")"; echo
  cat node_modules/gltf-validator/LICENSE
} > "$HERE/LICENSES.md"
echo "vendor rebuilt in $HERE"
