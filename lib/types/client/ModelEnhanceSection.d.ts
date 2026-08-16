import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type ModelEnhancePrefs, type SettingsWireFace } from '../contract.ts';
/** Injected business face: the settings wire API, the preference scope, and a live-refresh subscription. */
export interface ModelEnhanceSectionInjected {
    api: {
        settings: SettingsWireFace;
    };
    /** The plugin's preference scope (hosts the provider-label switch). */
    prefs: SettingsScope<ModelEnhancePrefs>;
    /** Subscribe to external changes; the returned disposer unsubscribes. */
    onInvalidate: (reload: () => void) => () => void;
}
/** Full section props: runtime share + injected face + the locale seat. */
export type ModelEnhanceSectionProps = PropsRuntime<'settings.section'> & InjectFace<ModelEnhanceSectionInjected> & PropsLocale<'model-enhance'>;
export declare function ModelEnhanceSection({ api, prefs, t, onInvalidate }: ModelEnhanceSectionProps): import("react").JSX.Element;
