/**
 * Build for dsh-model-enhance: a single-file browser client + a plain ESM host,
 * mirroring the dsh-at-file build discipline.
 *
 * - The web server serves exactly one file per client plugin
 *   (/plugins/dsh-model-enhance/client.js), so the client half is one CJS
 *   bundle wrapped in the `window.__ModuleLoader__.load` factory handshake.
 *   `@deepseek-ai/dsh-*` and `react` stay external (the profile's node_modules
 *   and the shell's module system provide them).
 * - The host half is plain ESM for Node, externalizing `@deepseek-ai/dsh-*`
 *   plus `@deepseek-ai/cordis`.
 * - `lib/store.js` is a node-safe ESM build of the pure read/write logic so the
 *   unit tests can import it without pulling in the browser bundle.
 */
import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

mkdirSync('lib', { recursive: true })

const dshExternal = ['@deepseek-ai/cordis', '@deepseek-ai/dsh-*']

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node22'],
  sourcemap: true,
  external: dshExternal,
  logLevel: 'info',
})

await build({
  entryPoints: ['src/client/store.ts'],
  outfile: 'lib/store.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node22'],
  sourcemap: true,
  external: dshExternal,
  logLevel: 'info',
})

await build({
  entryPoints: ['src/client/index.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: true,
  jsx: 'automatic',
  external: [...dshExternal, 'react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
  banner: {
    js: "window.__ModuleLoader__.load({ id: 'dsh-model-enhance', factory: (require) => { var module = { exports: {} }; var exports = module.exports;",
  },
  footer: {
    js: 'return module.exports; } });',
  },
  logLevel: 'info',
})

execFileSync('node_modules/.bin/tsc', ['-p', 'tsconfig.json'], { stdio: 'inherit' })
