#!/usr/bin/env bash
# Link the @deepseek-ai/* type packages (needed only by `tsc` for typechecking
# and .d.ts emission) from a local DSH install/checkout into node_modules.
#
# esbuild externalizes these (every @deepseek-ai import in src/ is type-only and
# erased), so the compiled bundles do NOT depend on them — only `tsc` does.
# Override the source dir with DSH_NM if your DSH checkout lives elsewhere.
set -euo pipefail

DSH_NM="${DSH_NM:-/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai}"

if [ ! -d "$DSH_NM" ]; then
  echo "DSH node_modules not found at $DSH_NM" >&2
  echo "Set DSH_NM=/path/to/@deepseek-ai to point at a DSH checkout's node_modules." >&2
  exit 1
fi

mkdir -p node_modules/@deepseek-ai
for pkg in \
  cordis \
  dsh-client-runtime \
  dsh-client-locale \
  dsh-client-ui-slots \
  dsh-client-ui-settings \
  dsh-api-remotes \
  dsh-typert-protocol \
  dsh-settings \
  schemastery; do
  ln -sfn "$DSH_NM/$pkg" "node_modules/@deepseek-ai/$pkg"
done

echo "Linked @deepseek-ai type packages from $DSH_NM"
