/**
 * The provider-label switch, persisted in localStorage.
 *
 * A pure browser preference rather than host configuration: DSH's settings
 * seam only exposes namespaces on a core allowlist (`dsh-host-apiproxy`'s
 * `WEB_SETTINGS_NAMESPACES` / provider namespaces), so a plugin-owned
 * namespace answers `settings-not-exposed` to configuration clients. Keeping
 * the switch in localStorage makes it self-contained, immediate, and working
 * on every install without a core change.
 */
/** localStorage key for the provider-label switch. */
export declare const PROVIDER_LABEL_KEY = "dsh-model-enhance:providerLabel";
/** Whether the provider-label badges are enabled. */
export declare function readProviderLabel(): boolean;
/** Persist the switch and notify subscribers in this tab. */
export declare function writeProviderLabel(value: boolean): void;
/**
 * Subscribe to switch changes (same tab via {@link EVENT}, other tabs via
 * the `storage` event).
 * @param callback - invoked with the current value on every change.
 * @returns a disposer removing both listeners.
 */
export declare function subscribeProviderLabel(callback: (value: boolean) => void): () => void;
