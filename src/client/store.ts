/**
 * Pure read/write logic for dsh-model-enhance. No React, no DOM, no network —
 * the node-safe build (`lib/store.js`) and the browser bundle both import this.
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

/** Structural view of the model-directory snapshot the provider badge reads. */
export interface ProviderBadgeInput {
  /** The selection the host reports for the session; null before the first load. */
  current: { provider: string; model: string } | null
  /** Successfully loaded provider groups (provider route + display name + models). */
  groups: ReadonlyArray<{ id: string; name: string; models: ReadonlyArray<{ id: string; name: string }> }>
}

/** The badge state: which trigger label to match and which provider name to show. */
export interface ProviderBadge {
  /** Display name of the currently selected model (matches the trigger's label). */
  modelLabel: string
  /** Display name of the provider serving that model. */
  providerName: string
}

/**
 * Resolve the provider badge from a model-directory snapshot. Unlike a flat
 * model-label → provider map, this keys off the *current selection's route*
 * (`current.provider`), so a model served by several providers at once resolves
 * to the provider that actually serves the selected route, never to whichever
 * entry happened to win a name collision. The trigger is matched by the current
 * model's display name (`name ?? id`, mirroring the selector's own resolution).
 */
export function providerBadgeOf(directory: ProviderBadgeInput): ProviderBadge | undefined {
  const current = directory.current
  if (current === null) return undefined
  const group = directory.groups.find((candidate) => candidate.id === current.provider)
  const providerName = group?.name ?? current.provider
  const model = group?.models.find((candidate) => candidate.id === current.model)
  const modelLabel = model?.name ?? current.model
  return { modelLabel, providerName }
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

/**
 * Compute the settings edits that turn the stored section into the collected
 * UI config. The settings path-op layer only descends plain-object (dict)
 * paths — an array child is replaced, never indexed — so the `models` array
 * cannot be edited per model. Each provider whose models changed therefore
 * emits ONE `set` that replaces its whole `models` array, preserving every
 * other field on every entry and rewriting only `reasoningEfforts`.
 *
 * `reasoningEfforts: false` (a hand-declared non-reasoning model) and absent
 * fields are preserved unless the user actually changes them.
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

    const byId = new Map(provider.models.map((model) => [model.id, model]))
    const newModels = rawModels.map((entry) => {
      if (!isPlainObject(entry)) return entry
      const rawId = nonEmptyString(entry.id)
      const ui = rawId !== undefined ? byId.get(rawId) : undefined
      if (ui === undefined) return { ...entry }

      const originalEfforts = entry.reasoningEfforts
      const wasDict = effortsDictOf(originalEfforts) !== undefined
      const out = { ...entry }
      if (ui.enabled && ui.efforts.length > 0) {
        out.reasoningEfforts = renderEfforts(originalEfforts, ui.efforts)
      } else if (wasDict) {
        delete out.reasoningEfforts
      }
      return out
    })

    if (!deepEqualJson(newModels, rawModels)) {
      ops.push({ op: 'set', path: ['providers', provider.name, 'models'], value: newModels })
    }
  }

  return ops
}
