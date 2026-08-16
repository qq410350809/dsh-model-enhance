/**
 * dsh-model-enhance client plugin: the browser half. Registers the settings
 * section that edits the `llm-pi-ai` namespace, its locale dictionaries, the
 * durable provider-label switch (its own `dsh-model-enhance` preference
 * namespace), and keeps both fresh on pushed settings invalidations. The
 * provider-label badges react to the switch live: toggling the setting in this
 * page shows or hides the provider badge in the model selector immediately.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services: settings section slot, locale, wire connection, pushed invalidations, and the pref scope. */
export declare const inject: string[];
/**
 * Compose the model-enhance settings surface and the provider-label badges.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
