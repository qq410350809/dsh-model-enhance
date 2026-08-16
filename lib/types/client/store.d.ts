/**
 * Pure read/write logic for dsh-model-enhance. No React, no DOM, no network —
 * the node-safe build (`lib/store.js`) and the browser bundle both import this.
 *
 * - `readConfig` projects the raw `llm-pi-ai` section into the UI shape.
 * - `buildOps` diffs a collected UI config back into path-addressed settings
 *   edits, touching only the fields a user changed so every unrelated key in the
 *   section survives.
 */
import { type EffortLevel, type ModelEnhanceConfig, type ModelEnhanceModel, type PathOp, type RawModelProfile, type RawSection } from '../contract.ts';
/** Project one raw model entry into the UI row. */
export declare function readModel(model: RawModelProfile): ModelEnhanceModel | null;
/**
 * Project the raw `llm-pi-ai` section into the UI config. Reads the *user*
 * section (the stored document, what `settings.mutate` edits); callers pass
 * `namespace.user ?? namespace.value` as the section.
 */
export declare function readConfig(section: RawSection | undefined): ModelEnhanceConfig;
/** Structural view of the model-directory snapshot the provider badge reads. */
export interface ProviderBadgeInput {
    /** The selection the host reports for the session; null before the first load. */
    current: {
        provider: string;
        model: string;
    } | null;
    /** Successfully loaded provider groups (provider route + display name + models). */
    groups: ReadonlyArray<{
        id: string;
        name: string;
        models: ReadonlyArray<{
            id: string;
            name: string;
        }>;
    }>;
}
/** The badge state: which trigger label to match and which provider name to show. */
export interface ProviderBadge {
    /** Display name of the currently selected model (matches the trigger's label). */
    modelLabel: string;
    /** Display name of the provider serving that model. */
    providerName: string;
}
/**
 * Resolve the provider badge from a model-directory snapshot. Unlike a flat
 * model-label → provider map, this keys off the *current selection's route*
 * (`current.provider`), so a model served by several providers at once resolves
 * to the provider that actually serves the selected route, never to whichever
 * entry happened to win a name collision. The trigger is matched by the current
 * model's display name (`name ?? id`, mirroring the selector's own resolution).
 */
export declare function providerBadgeOf(directory: ProviderBadgeInput): ProviderBadge | undefined;
/**
 * Render the `reasoningEfforts` dict for a newly collected set of levels.
 * Preserves an existing level's wire spelling (e.g. `max: ultra`) and defaults
 * newly-added levels to `null` (off) / the level key (everything else), matching
 * the original feature's `off: null, <level>: <level>` convention.
 */
export declare function renderEfforts(original: unknown, selected: readonly EffortLevel[]): Record<string, string | null>;
/** Deep equality over JSON-shaped values (objects, arrays, primitives). */
export declare function deepEqualJson(a: unknown, b: unknown): boolean;
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
export declare function buildOps(original: RawSection | undefined, next: ModelEnhanceConfig): PathOp[];
