/**
 * Pure read/write logic for dsh-model-enhance, ported from the DSH Client
 * "模型增强" feature (Rust `get_model_config`/`save_model_config` + the overlay's
 * `render`/`collect`). No React, no DOM, no network — the node-safe build
 * (`lib/store.js`) and the browser bundle both import this.
 *
 * - `readConfig` projects the raw `llm-pi-ai` section into the UI shape.
 * - `buildOps` diffs a collected UI config back into path-addressed settings
 *   edits, touching only the fields a user changed so every unrelated key in the
 *   section survives.
 */
import {
  EFFORT_LEVELS,
  type EffortLevel,
  type ModelEnhanceConfig,
  type ModelEnhanceModel,
  type ModelEnhanceProvider,
  type PathOp,
  type RawModelProfile,
  type RawSection,
} from '../contract.ts'

/** A JSON value is a plain object (not null/array) — what a `reasoningEfforts` dict is. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Read a positive integer field, else null (UI's "unset" marker). */
function positiveInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.trunc(value)
}

/** Read a non-empty string field, else undefined. */
function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** Whether the raw `reasoningEfforts` value is a selectable dict (not `false`/absent). */
function effortsDictOf(raw: unknown): Record<string, unknown> | undefined {
  return isPlainObject(raw) ? raw : undefined
}

/** The reasoning levels a raw model actually declares, sorted in escalation order. */
function effortKeysOf(raw: unknown): EffortLevel[] {
  const dict = effortsDictOf(raw)
  if (dict === undefined) return []
  return EFFORT_LEVELS.filter((level) => Object.prototype.hasOwnProperty.call(dict, level))
}

/** Project one raw model entry into the UI row. */
export function readModel(model: RawModelProfile): ModelEnhanceModel | null {
  const id = nonEmptyString(model?.id)
  if (id === undefined) return null
  const dict = effortsDictOf(model.reasoningEfforts)
  return {
    id,
    enabled: dict !== undefined,
    efforts: effortKeysOf(model.reasoningEfforts),
    context_window: positiveInt(model.contextWindow),
    max_tokens: positiveInt(model.maxTokens),
  }
}

/**
 * Project the raw `llm-pi-ai` section into the UI config. Reads the *user*
 * section (the stored document, what `settings.mutate` edits); callers pass
 * `namespace.user ?? namespace.value` as the section.
 */
export function readConfig(section: RawSection | undefined): ModelEnhanceConfig {
  const providers: ModelEnhanceProvider[] = []
  const providerMap = section?.providers
  if (isPlainObject(providerMap)) {
    for (const [name, value] of Object.entries(providerMap)) {
      const profile = isPlainObject(value) ? value : {}
      const display_name = nonEmptyString(profile.displayName) ?? name
      const models: ModelEnhanceModel[] = []
      if (Array.isArray(profile.models)) {
        for (const entry of profile.models) {
          if (!isPlainObject(entry)) continue
          const model = readModel(entry as unknown as RawModelProfile)
          if (model !== null) models.push(model)
        }
      }
      providers.push({ name, display_name, models })
    }
  }
  return { providers }
}

/**
 * Render the `reasoningEfforts` dict for a newly collected set of levels.
 * Preserves an existing level's wire spelling (e.g. `max: ultra`) and defaults
 * newly-added levels to `null` (off) / the level key (everything else), matching
 * the original feature's `off: null, <level>: <level>` convention.
 */
export function renderEfforts(original: unknown, selected: readonly EffortLevel[]): Record<string, string | null> {
  const dict = effortsDictOf(original)
  const out: Record<string, string | null> = {}
  for (const level of EFFORT_LEVELS) {
    if (!selected.includes(level)) continue
    const existing = dict !== undefined ? dict[level] : undefined
    if (level === 'off') {
      out.off = nonEmptyString(existing) ?? null
    } else {
      out[level] = nonEmptyString(existing) ?? level
    }
  }
  return out
}

/** Deep equality over JSON-shaped values (objects, arrays, primitives). */
export function deepEqualJson(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((value, index) => deepEqualJson(value, b[index]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqualJson(a[key], b[key]))
  }
  return false
}

/** Reduce a raw `reasoningEfforts` dict to only the level keys (for diffing). */
function levelsOnly(raw: unknown): Record<string, unknown> | undefined {
  const dict = effortsDictOf(raw)
  if (dict === undefined) return undefined
  const out: Record<string, unknown> = {}
  for (const level of EFFORT_LEVELS) {
    if (Object.prototype.hasOwnProperty.call(dict, level)) out[level] = dict[level]
  }
  return out
}

/**
 * Compute path-addressed settings edits that turn the stored section into the
 * collected UI config. Only changed fields emit ops; `reasoningEfforts: false`
 * (a hand-declared non-reasoning model) and absent fields are preserved unless
 * the user actually changes them. Array indices reference the stored section's
 * own order, which is the order `readConfig` read.
 *
 * @param original - the stored user section the config was read from.
 * @param next - the collected UI config.
 * @returns the ops to send through `settings.mutate` (empty when nothing changed).
 */
export function buildOps(original: RawSection | undefined, next: ModelEnhanceConfig): PathOp[] {
  const ops: PathOp[] = []
  const providerMap = isPlainObject(original?.providers) ? original!.providers : {}

  for (const provider of next.providers) {
    const rawProvider = isPlainObject(providerMap[provider.name]) ? providerMap[provider.name] : {}
    const rawModels = Array.isArray(rawProvider.models) ? rawProvider.models : []

    provider.models.forEach((model, index) => {
      const base = ['providers', provider.name, 'models', String(index)]
      const raw = isPlainObject(rawModels[index]) ? (rawModels[index] as unknown as RawModelProfile) : {}
      const originalEfforts = raw.reasoningEfforts
      const wasDict = effortsDictOf(originalEfforts) !== undefined

      // reasoningEfforts: set the collected dict, or remove a dict that was
      // disabled (preserving `false` and absent unless actually changed).
      if (model.enabled && model.efforts.length > 0) {
        const nextDict = renderEfforts(originalEfforts, model.efforts)
        const prevDict = levelsOnly(originalEfforts)
        if (prevDict === undefined || !deepEqualJson(nextDict, prevDict)) {
          ops.push({ op: 'set', path: [...base, 'reasoningEfforts'], value: nextDict })
        }
      } else if (wasDict) {
        ops.push({ op: 'unset', path: [...base, 'reasoningEfforts'] })
      }

      // contextWindow
      if (model.context_window === null) {
        if (raw.contextWindow !== undefined) {
          ops.push({ op: 'unset', path: [...base, 'contextWindow'] })
        }
      } else if (positiveInt(raw.contextWindow) !== model.context_window) {
        ops.push({ op: 'set', path: [...base, 'contextWindow'], value: model.context_window })
      }

      // maxTokens
      if (model.max_tokens === null) {
        if (raw.maxTokens !== undefined) {
          ops.push({ op: 'unset', path: [...base, 'maxTokens'] })
        }
      } else if (positiveInt(raw.maxTokens) !== model.max_tokens) {
        ops.push({ op: 'set', path: [...base, 'maxTokens'], value: model.max_tokens })
      }
    })
  }

  return ops
}
