/**
 * dsh-model-enhance host plugin. Registers the plugin's own UI-preference
 * settings namespace (`dsh-model-enhance`, currently the provider-label
 * switch) so the browser half can persist the toggle through the settings
 * wire. Everything else is browser-side: the section edits the `llm-pi-ai`
 * namespace and the provider-label badges are pure DOM.
 */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name (the Loader entry and client bundle id). */
export declare const name = "dsh-model-enhance";
/** Services required before load: the settings provider (registers the pref namespace). */
export declare const inject: string[];
/**
 * Register the preference namespace with the settings provider.
 * @param ctx - host cordis context.
 */
export declare function apply(ctx: Context): void;
