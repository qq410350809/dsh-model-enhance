/**
 * Shared wire/UI contract for dsh-model-enhance. Pure types and constants only
 * (no React, no DOM, no Node imports), so the node-safe `lib/store.js` build and
 * the browser client bundle both consume it.
 *
 * This plugin edits the `llm-pi-ai` user-settings namespace
 * (`llm-pi-ai.providers.<provider>.models.<model>`), which the pi-ai adapter
 * registers through `installSettingsSection`. The client reads and writes it
 * through the settings wire API without any host-side logic of its own.
 */
/** The settings namespace this plugin edits. */
export declare const SETTINGS_NS = "llm-pi-ai";
/**
 * Every reasoning level DSH's pi-ai adapter accepts, in escalation order.
 * The original Tauri client omitted `minimal`; DSH's `THINKING_LEVELS` includes
 * it, so the surface offers the full set the schema validates.
 */
export declare const EFFORT_LEVELS: readonly ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
export type EffortLevel = (typeof EFFORT_LEVELS)[number];
/** One model row in the UI (the shape the section renders and collects). */
export interface ModelEnhanceModel {
    /** Model id sent to the provider. */
    id: string;
    /** Whether a `reasoningEfforts` dict is present for this model. */
    enabled: boolean;
    /** Selected reasoning levels, in escalation order. */
    efforts: EffortLevel[];
}
/** One provider card in the UI. */
export interface ModelEnhanceProvider {
    /** Provider route key (the settings dict key). */
    name: string;
    /** Display name shown in the UI (`displayName` or the route key). */
    display_name: string;
    models: ModelEnhanceModel[];
}
/** The whole UI config. */
export interface ModelEnhanceConfig {
    providers: ModelEnhanceProvider[];
}
/** One path-addressed settings edit (mirrors `SettingsPathOpView`). */
export type PathOp = {
    op: 'set';
    path: string[];
    value: unknown;
} | {
    op: 'unset';
    path: string[];
};
/** Raw wire shapes of the `llm-pi-ai` namespace (structural, schema-validated). */
export type RawReasoningEfforts = false | Record<string, string | null>;
export interface RawModelProfile {
    id?: string;
    name?: string;
    reasoningEfforts?: RawReasoningEfforts;
    [key: string]: unknown;
}
export interface RawProviderProfile {
    displayName?: string;
    apiKeyEnv?: string;
    api?: string;
    baseURL?: string;
    models?: RawModelProfile[];
    [key: string]: unknown;
}
export interface RawSection {
    providers?: Record<string, RawProviderProfile>;
    [key: string]: unknown;
}
/** The `settings.describe` namespace view (fields this plugin reads). */
export interface SettingsNamespaceView {
    ns: string;
    schema: unknown;
    value: unknown;
    base?: unknown;
    user?: unknown;
    applies: 'live' | 'restart';
    secrets: unknown[];
    revision: number;
}
/** The `settings.describe` value payload. */
export interface SettingsDescribeValue {
    writable: boolean;
    hasDocument: boolean;
    namespaces: SettingsNamespaceView[];
}
/** The `settings.mutate` request payload. */
export interface SettingsMutateRequest {
    ns: string;
    ops: PathOp[];
    expectedRevision?: number;
}
/** RPC result/response envelopes (the `connection.api` wire face). */
export interface RpcError {
    code: string;
    message: string;
    details?: unknown;
}
export type RpcResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: RpcError;
};
export interface RpcResponse<T> {
    rpcId?: unknown;
    result: RpcResult<T>;
}
/** The settings domain face the client reaches through `connection.api`. */
export interface SettingsWireFace {
    describe(request: {}): Promise<RpcResponse<SettingsDescribeValue>>;
    mutate(request: SettingsMutateRequest): Promise<RpcResponse<SettingsNamespaceView>>;
}
