/**
 * dsh-model-enhance host plugin. Registers the plugin's own UI-preference
 * settings namespace (`dsh-model-enhance`, currently the provider-label
 * switch) so the browser half can persist the toggle through the settings
 * wire. Everything else is browser-side: the section edits the `llm-pi-ai`
 * namespace and the provider-label badges are pure DOM.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
// Type-only: brings the `ctx.settings` Context merge into this program.
import type {} from '@deepseek-ai/dsh-settings'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { PROVIDER_LABEL_NS, type ModelEnhancePrefs } from './contract.ts'

/** Cordis plugin name (the Loader entry and client bundle id). */
export const name = 'dsh-model-enhance'

/** Services required before load: the settings provider (registers the pref namespace). */
export const inject = ['settings']

/** Schemastery schema of the plugin's UI-preference namespace. */
const PrefsSchema: z<ModelEnhancePrefs> = z.object({
  providerLabel: z.boolean().default(false),
})

/**
 * Register the preference namespace with the settings provider.
 * @param ctx - host cordis context.
 */
export function apply(ctx: Context): void {
  ctx.settings.register(settingsNamespace(PROVIDER_LABEL_NS), PrefsSchema, { applies: 'live' })
}
