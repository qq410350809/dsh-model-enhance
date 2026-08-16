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
export declare function buildOps(original: RawSection | undefined, next: ModelEnhanceConfig): PathOp[];
