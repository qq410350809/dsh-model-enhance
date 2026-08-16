import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOps, deepEqualJson, readConfig, renderEfforts } from '../lib/store.js'

const section = {
  providers: {
    acme: {
      displayName: 'ACME AI',
      apiKeyEnv: 'ACME_API_KEY',
      api: 'openai-completions',
      baseURL: 'https://acme.example/v1',
      models: [
        { id: 'model-a', contextWindow: 65536, reasoningEfforts: { off: null, high: 'high' } },
        { id: 'model-b', contextWindow: 32768, maxTokens: 4096 },
      ],
    },
    beta: {
      displayName: 'Beta',
      models: [{ id: 'model-c', reasoningEfforts: { off: null, low: 'low', medium: 'medium' } }],
    },
  },
}

test('readConfig projects providers/models/efforts', () => {
  const config = readConfig(section)
  assert.equal(config.providers.length, 2)

  const acme = config.providers[0]
  assert.equal(acme.name, 'acme')
  assert.equal(acme.display_name, 'ACME AI')
  assert.equal(acme.models.length, 2)

  const a = acme.models[0]
  assert.equal(a.id, 'model-a')
  assert.equal(a.enabled, true)
  assert.deepEqual(a.efforts, ['off', 'high'])
  assert.equal(a.context_window, 65536)
  assert.equal(a.max_tokens, null)

  const b = acme.models[1]
  assert.equal(b.enabled, false)
  assert.deepEqual(b.efforts, [])
  assert.equal(b.context_window, 32768)
  assert.equal(b.max_tokens, 4096)

  const beta = config.providers[1]
  assert.equal(beta.display_name, 'Beta')
  const c = beta.models[0]
  assert.equal(c.id, 'model-c')
  assert.equal(c.enabled, true)
  assert.deepEqual(c.efforts, ['off', 'low', 'medium'])
})

test('buildOps yields no ops for an unchanged config', () => {
  const config = readConfig(section)
  assert.deepEqual(buildOps(section, config), [])
})

test('buildOps emits the minimal diff for edits', () => {
  const config = readConfig(section)
  // acme/model-a: swap high -> max (off kept)
  config.providers[0].models[0].efforts = ['off', 'max']
  // acme/model-b: enable with off/low/high
  config.providers[0].models[1].enabled = true
  config.providers[0].models[1].efforts = ['off', 'low', 'high']
  // beta/model-c: disable
  config.providers[1].models[0].enabled = false
  config.providers[1].models[0].efforts = []

  const ops = buildOps(section, config)

  const set = (path) => ops.find((op) => op.op === 'set' && deepEqualJson(op.path, path))
  const unset = (path) => ops.find((op) => op.op === 'unset' && deepEqualJson(op.path, path))

  const aEfforts = set(['providers', 'acme', 'models', '0', 'reasoningEfforts'])
  assert.ok(aEfforts, 'model-a reasoningEfforts set')
  assert.deepEqual(aEfforts.value, { off: null, max: 'max' })

  const bEfforts = set(['providers', 'acme', 'models', '1', 'reasoningEfforts'])
  assert.ok(bEfforts, 'model-b reasoningEfforts set')
  assert.deepEqual(bEfforts.value, { off: null, low: 'low', high: 'high' })

  assert.ok(unset(['providers', 'beta', 'models', '0', 'reasoningEfforts']), 'model-c reasoningEfforts unset')

  // contextWindow/maxTokens were not touched anywhere -> no capacity ops.
  const capacityOps = ops.filter((op) => op.path[op.path.length - 1] === 'contextWindow' || op.path[op.path.length - 1] === 'maxTokens')
  assert.deepEqual(capacityOps, [])
})

test('buildOps writes and removes capacities', () => {
  const config = readConfig(section)
  // model-a: change context, set maxTokens
  config.providers[0].models[0].context_window = 200000
  config.providers[0].models[0].max_tokens = 16000
  // model-b: clear both
  config.providers[0].models[1].context_window = null
  config.providers[0].models[1].max_tokens = null

  const ops = buildOps(section, config)
  const setCtx = ops.find((op) => op.op === 'set' && deepEqualJson(op.path, ['providers', 'acme', 'models', '0', 'contextWindow']))
  const setMax = ops.find((op) => op.op === 'set' && deepEqualJson(op.path, ['providers', 'acme', 'models', '0', 'maxTokens']))
  const unsetCtx = ops.find((op) => op.op === 'unset' && deepEqualJson(op.path, ['providers', 'acme', 'models', '1', 'contextWindow']))
  const unsetMax = ops.find((op) => op.op === 'unset' && deepEqualJson(op.path, ['providers', 'acme', 'models', '1', 'maxTokens']))

  assert.equal(setCtx.value, 200000)
  assert.equal(setMax.value, 16000)
  assert.ok(unsetCtx, 'model-b contextWindow removed')
  assert.ok(unsetMax, 'model-b maxTokens removed')
})

test('renderEfforts preserves custom wire spellings', () => {
  const original = { off: null, max: 'ultra' }
  assert.deepEqual(renderEfforts(original, ['off', 'max']), { off: null, max: 'ultra' })
  assert.deepEqual(renderEfforts(original, ['off', 'high']), { off: null, high: 'high' })
  assert.deepEqual(renderEfforts(undefined, ['off', 'low']), { off: null, low: 'low' })
})
