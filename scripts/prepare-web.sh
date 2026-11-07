#!/bin/bash
set -euo pipefail
cd "${1:?repo path required}"
# JavaScript bindings and WASM must come from the same package release.
VERSION="$(node -e '
  const { version } = require(process.cwd() + "/packages/sherpa-onnx.rn/package.json");
  if (typeof version !== "string" || !/^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error("sherpa-onnx.rn must declare an exact package version");
  }
  process.stdout.write(version);
')"
CACHE="$PWD/.agent/cache/sherpa-wasm-$VERSION"
DEST="$PWD/apps/sherpa-voice/public/wasm"
mkdir -p "$CACHE" "$DEST"
for name in sherpa-onnx-wasm-combined.js sherpa-onnx-wasm-combined.wasm; do
  if [ ! -s "$CACHE/$name" ]; then
    curl --fail --location --proto '=https' --proto-redir '=https' --retry 2 --silent --show-error \
      "https://cdn.jsdelivr.net/npm/@siteed/sherpa-onnx.rn@$VERSION/wasm/$name" -o "$CACHE/$name.download"
    mv "$CACHE/$name.download" "$CACHE/$name"
  fi
  cp "$CACHE/$name" "$DEST/$name"
done
cp packages/sherpa-onnx.rn/wasm-src/*.js "$DEST/"
