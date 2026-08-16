# dsh-model-enhance

A DeepSeek Harness (DSH) web plugin that adds a "Model enhance" (模型增强)
section to the DSH Web settings page for editing, per provider and model:

- **Reasoning efforts** (`reasoningEfforts`) — an enable toggle plus a
  multi-select of levels (off / minimal / low / medium / high / xhigh / max),
  covering every thinking level DSH's `llm-pi-ai` adapter accepts.
- **Provider label** — an optional switch that shows the provider (接入方)
  name as a badge before the model name in the model selector, projected from
  the same `llm-pi-ai` section.

Changes apply live (the `llm-pi-ai` namespace registers with `live` semantics)
and every unrelated key in the section is preserved.

## How it works

The `llm-pi-ai.providers` section is exposed by DSH as a settings namespace of
the same name (`llm-pi-ai`, registered by `dsh-llm-pi-ai` through
`installSettingsSection`), so this plugin needs **no host-side logic**:

- the host half is an empty registration marker (`src/index.ts`) that puts the
  package in the host Loader (and therefore the client boot graph);
- the browser half (`src/client/**`) reads and writes the `llm-pi-ai` namespace
  through `connection.api.settings.describe` / `settings.mutate`, and registers
  its page via the `settings.section` slot.

## Layout

```
src/
  index.ts                     # host plugin entry (empty apply marker)
  contract.ts                  # shared types & constants (pure TS)
  client/
    index.ts                   # client entry (slot + locale + invalidation)
    store.ts                   # pure logic: readConfig / buildOps
    ModelEnhanceSection.tsx    # the settings React component
    styles.ts                  # injected stylesheet (--dsw-alias-* tokens)
    locales.ts                 # zh/en dictionaries
tests/
  store.spec.mjs               # readConfig / buildOps unit tests (node:test)
```

## Build

```sh
pnpm install               # devDependencies (esbuild, typescript)
bash scripts/link-types.sh # link @deepseek-ai/* type packages (needed by tsc only)
node build.mjs             # esbuild -> lib/index.js + lib/client.js + lib/store.js, then tsc .d.ts
node --test tests/*.spec.mjs
```

> Every `@deepseek-ai/*` import in `src/` is `import type` (erased and externalized
> by esbuild), so the compiled bundles do not depend on them — only `tsc`'s
> typecheck and `.d.ts` emission do. `link-types.sh` links from
> `/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai` by
> default; override with `DSH_NM=...`.

## Install into the web profile

Install from the npm registry (published as `@qq410350809/dsh-model-enhance`):

```sh
dsh plugin --profile web add @qq410350809/dsh-model-enhance
```

or from the GitHub tag (the repo ships the built `lib/`):

```sh
dsh plugin --profile web add https://github.com/qq410350809/dsh-model-enhance/archive/refs/tags/v0.1.0.tar.gz
```

> Pin a tag, not `main`: a `refs/heads/main` tarball changes on every push and
> breaks pnpm's lockfile checksum on later installs.

or edit `~/.dsh/profiles/web/package.json` directly (see README.zh.md), run
`pnpm install` in that profile, and restart `dsh web`.

> For local development, use a `link:` install instead:
> `dsh plugin --profile web add link:/Applications/custom/dsh-plugins/dsh-model-enhance`.
