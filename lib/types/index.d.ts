/**
 * dsh-model-enhance host plugin — a pure registration marker. The feature is
 * entirely browser-side: it edits the `llm-pi-ai` settings namespace through
 * the settings wire API and keeps its provider-label switch in localStorage,
 * so no host behavior is needed. The empty `apply` keeps this row in the host
 * Loader (and therefore in the client boot graph); the browser half ships
 * through `exports["./client"]`, discovered from the package.json `dsh.client`
 * declaration.
 */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name (the Loader entry and client bundle id). */
export declare const name = "dsh-model-enhance";
/** Services required before load — none host-side. */
export declare const inject: string[];
/**
 * Mount nothing host-side.
 * @param _ctx - host cordis context (unused).
 */
export declare function apply(_ctx: Context): void;
