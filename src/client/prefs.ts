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
export const PROVIDER_LABEL_KEY = 'dsh-model-enhance:providerLabel'

/** Same-tab change event; `storage` covers other tabs. */
const EVENT = 'dsh-model-enhance:providerLabel'

/** Whether the provider-label badges are enabled. */
export function readProviderLabel(): boolean {
  try {
    return localStorage.getItem(PROVIDER_LABEL_KEY) === '1'
  } catch {
    return false
  }
}

/** Persist the switch and notify subscribers in this tab. */
export function writeProviderLabel(value: boolean): void {
  try {
    if (value) localStorage.setItem(PROVIDER_LABEL_KEY, '1')
    else localStorage.removeItem(PROVIDER_LABEL_KEY)
  } catch {
    // Storage unavailable (private mode etc.); the toggle still applies
    // for this session via the event below.
  }
  window.dispatchEvent(new CustomEvent(EVENT))
}

/**
 * Subscribe to switch changes (same tab via {@link EVENT}, other tabs via
 * the `storage` event).
 * @param callback - invoked with the current value on every change.
 * @returns a disposer removing both listeners.
 */
export function subscribeProviderLabel(callback: (value: boolean) => void): () => void {
  const onEvent = (): void => callback(readProviderLabel())
  const onStorage = (event: StorageEvent): void => {
    if (event.key === PROVIDER_LABEL_KEY || event.key === null) onEvent()
  }
  window.addEventListener(EVENT, onEvent)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, onEvent)
    window.removeEventListener('storage', onStorage)
  }
}
