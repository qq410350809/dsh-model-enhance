import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type SettingsWireFace } from '../contract.ts';
/** Injected business face: the settings wire API plus a live-refresh subscription. */
export interface ModelEnhanceSectionInjected {
    api: {
        settings: SettingsWireFace;
    };
    /** Subscribe to external changes; the returned disposer unsubscribes. */
    onInvalidate: (reload: () => void) => () => void;
}
/** Full section props: runtime share + injected face + the locale seat. */
export type ModelEnhanceSectionProps = PropsRuntime<'settings.section'> & InjectFace<ModelEnhanceSectionInjected> & PropsLocale<'model-enhance'>;
export declare function ModelEnhanceSection({ api, t, onInvalidate }: ModelEnhanceSectionProps): import("react").JSX.Element;
