import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOps, deepEqualJson, providerLabelsOf, readConfig, renderEfforts } from '../lib/store.js'

const section = {
  providers: {
    acme: {
      displayName: 'ACME AI',
      apiKeyEnv: 'ACME_API_KEY',
      api: 'openai-completions',
      baseURL: 'https://acme.example/v1',
      models: [
        { id: 'model-a', name: 'Model A', maxTokens: 128000, reasoningEfforts: { off: null, high: 'high' } },
        { id: 'model-b' },
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

  const b = acme.models[1]
  assert.equal(b.enabled, false)
  assert.deepEqual(b.efforts, [])

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

test('buildOps replaces whole models arrays, preserving unrelated fields', () => {
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
  assert.equal(ops.length, 2)

  const acme = ops.find((op) => op.op === 'set' && deepEqualJson(op.path, ['providers', 'acme', 'models']))
  assert.ok(acme, 'acme models set')
  assert.deepEqual(acme.value, [
    { id: 'model-a', name: 'Model A', maxTokens: 128000, reasoningEfforts: { off: null, max: 'max' } },
    { id: 'model-b', reasoningEfforts: { off: null, low: 'low', high: 'high' } },
  ])

  const beta = ops.find((op) => op.op === 'set' && deepEqualJson(op.path, ['providers', 'beta', 'models']))
  assert.ok(beta, 'beta models set')
  assert.deepEqual(beta.value, [{ id: 'model-c' }])
})

test('buildOps preserves hand-declared reasoningEfforts: false', () => {
  const raw = {
    providers: {
      acme: { models: [{ id: 'model-a', reasoningEfforts: false }] },
    },
  }
  const config = readConfig(raw)
  // The false marker is not a selectable dict, so the row reads disabled and
  // leaving it untouched must not emit an op.
  assert.equal(config.providers[0].models[0].enabled, false)
  assert.deepEqual(buildOps(raw, config), [])
})

test('providerLabelsOf maps model ids/names to provider display names', () => {
  const labels = providerLabelsOf(section)
  assert.equal(labels['model-a'], 'ACME AI')
  assert.equal(labels['Model A'], 'ACME AI')
  assert.equal(labels['model-b'], 'ACME AI')
  assert.equal(labels['model-c'], 'Beta')
  assert.deepEqual(providerLabelsOf(undefined), {})
})

test('renderEfforts preserves custom wire spellings', () => {
  const original = { off: null, max: 'ultra' }
  assert.deepEqual(renderEfforts(original, ['off', 'max']), { off: null, max: 'ultra' })
  assert.deepEqual(renderEfforts(original, ['off', 'high']), { off: null, high: 'high' })
  assert.deepEqual(renderEfforts(undefined, ['off', 'low']), { off: null, low: 'low' })
})
