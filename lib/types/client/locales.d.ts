/**
 * dsh-model-enhance locale namespace: the settings section copy.
 * Chinese is the product copy; English mirrors it.
 */
export declare const zh: {
    nav: string;
    title: string;
    subtitle: string;
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    loading: string;
    loadFailed: string;
    empty: string;
    providerCount: string;
    toggleOn: string;
    toggleOff: string;
    enabledLabel: string;
    contextWindow: string;
    maxTokens: string;
    fieldHint: string;
    'effort.off': string;
    'effort.minimal': string;
    'effort.low': string;
    'effort.medium': string;
    'effort.high': string;
    'effort.xhigh': string;
    'effort.max': string;
    readonly: string;
};
export type ModelEnhanceKey = keyof typeof zh;
export declare const en: {
    nav: string;
    title: string;
    subtitle: string;
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    loading: string;
    loadFailed: string;
    empty: string;
    providerCount: string;
    toggleOn: string;
    toggleOff: string;
    enabledLabel: string;
    contextWindow: string;
    maxTokens: string;
    fieldHint: string;
    'effort.off': string;
    'effort.minimal': string;
    'effort.low': string;
    'effort.medium': string;
    'effort.high': string;
    'effort.xhigh': string;
    'effort.max': string;
    readonly: string;
};
/** Locale namespace id registered under ctx.locale. */
export declare const NS = "model-enhance";
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        [NS]: ModelEnhanceKey;
    }
}
