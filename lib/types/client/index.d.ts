/**
 * dsh-model-enhance client plugin: the browser half. Registers the settings
 * section that edits the `llm-pi-ai` namespace, its locale dictionaries, and
 * keeps the section fresh on pushed settings invalidations — no host-side
 * behavior is involved: reads and writes go through the settings wire API
 * (`connection.api.settings`), the same plane the Models page uses.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services: settings section slot, locale, the wire connection, and pushed invalidation events. */
export declare const inject: string[];
/**
 * Compose the model-enhance settings surface.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
