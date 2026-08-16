/**
 * dsh-model-enhance client plugin: the browser half. Registers the settings
 * section that edits the `llm-pi-ai` namespace, its locale dictionaries, the
 * provider-label switch (a localStorage preference), and keeps everything
 * fresh on pushed settings invalidations. The provider-label badges react to
 * the switch live: toggling the setting in this page shows or hides the
 * provider badge in the model selector immediately.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: brings the ctx.locale Context merge in.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the settings.section SlotMap seat and locale namespace table.
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: brings the `settings.section` SlotMap augmentation (declared by the
// settings domain base plugin) into this program.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { SETTINGS_NS, type RawSection, type SettingsWireFace } from '../contract.ts'
import { ModelEnhanceSection, type ModelEnhanceSectionInjected } from './ModelEnhanceSection.tsx'
import { NS, en, zh } from './locales.ts'
import { readProviderLabel, subscribeProviderLabel } from './prefs.ts'
import { installProviderLabelBadges } from './providerLabel.ts'
import { providerLabelsOf } from './store.ts'
import { adoptStyles } from './styles.ts'

/** Required services: settings section slot, locale, wire connection, and pushed invalidations. */
export const inject = ['slots', 'locale', 'connection', 'remote']

/** The connection service face this plugin reaches (structural). */
interface ConnectionHandleLike {
  api: { settings: SettingsWireFace }
}

/** The remote service face this plugin reaches (structural). */
interface RemoteFaceLike {
  $on(event: string, handler: (payload?: unknown) => void): () => void
}

/**
 * Compose the model-enhance settings surface and the provider-label badges.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  adoptStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-model-enhance: dictionaries')

  const connection = ctx.get('connection') as ConnectionHandleLike
  const remote = ctx.get('remote') as RemoteFaceLike
  const t = ctx.locale.bind(NS)

  // Provider labels for the model-selector badges: model id/name → provider
  // display name, projected from the same `llm-pi-ai` section the page edits.
  let labels: Record<string, string> = {}
  const refreshLabels = async (): Promise<void> => {
    try {
      const response = await connection.api.settings.describe({})
      if (!response.result.ok) return
      const view = response.result.value.namespaces.find((n) => n.ns === SETTINGS_NS)
      if (view === undefined) return
      labels = providerLabelsOf((view.user ?? view.value) as RawSection | undefined)
    } catch {
      // Transient transport failure: badges keep the last good labels.
    }
  }

  // Badge lifecycle, gated by the localStorage switch: install once when it
  // flips on, dispose when it flips off.
  let badgesDispose: (() => void) | null = null
  const syncBadges = (): void => {
    const enabled = readProviderLabel()
    if (enabled && badgesDispose === null) {
      badgesDispose = installProviderLabelBadges(() => labels)
    } else if (!enabled && badgesDispose !== null) {
      badgesDispose()
      badgesDispose = null
    }
  }

  ctx.effect(() => {
    void refreshLabels().then(syncBadges)
    const disposers = [
      subscribeProviderLabel(syncBadges),
      remote.$on('settings/document-updated', () => {
        void refreshLabels().then(syncBadges)
      }),
      ctx.on('connection/reset', () => {
        labels = {}
        void refreshLabels().then(syncBadges)
      }),
    ]
    return () => {
      for (const dispose of disposers) dispose()
      if (badgesDispose !== null) {
        badgesDispose()
        badgesDispose = null
      }
    }
  }, 'dsh-model-enhance: provider labels')

  const injected = (): ModelEnhanceSectionInjected => ({
    api: { settings: connection.api.settings },
    // The section re-reads its namespaces whenever the settings document changes
    // (another tab, the Models page, or an external edit) or the connection resets.
    onInvalidate: (reload) => {
      const disposers = [
        remote.$on('settings/document-updated', () => reload()),
        ctx.on('connection/reset', () => reload()),
      ]
      return () => {
        for (const dispose of disposers) dispose()
      }
    },
  })

  ctx.slots.inject(
    'settings.section',
    () =>
      ctx.slots.register(
        {
          name: 'settings.section',
          id: 'model-enhance',
          order: 20,
          label: () => t('nav'),
          locale: NS,
          inject: injected,
        },
        ModelEnhanceSection,
      ),
  )
}
