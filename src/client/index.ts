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
import { SETTINGS_NS, type SettingsWireFace } from '../contract.ts'
import { ModelEnhanceSection, type ModelEnhanceSectionInjected } from './ModelEnhanceSection.tsx'
import { NS, en, zh } from './locales.ts'
import { readProviderLabel, subscribeProviderLabel } from './prefs.ts'
import { installProviderLabelBadges } from './providerLabel.ts'
import { providerBadgeOf, type ProviderBadge, type ProviderBadgeInput } from './store.ts'
import { adoptStyles } from './styles.ts'

/** Required services: settings section slot, locale, wire connection, pushed invalidations, and the model directory. */
export const inject = ['slots', 'locale', 'connection', 'remote', 'sessions', 'modelDirectories']

/** The connection service face this plugin reaches (structural). */
interface ConnectionHandleLike {
  api: { settings: SettingsWireFace }
}

/** The remote service face this plugin reaches (structural). */
interface RemoteFaceLike {
  $on(event: string, handler: (payload?: unknown) => void): () => void
}

/** The sessions-service face this plugin reaches (structural): the current session id. */
interface SessionsFaceLike {
  list: {
    getSnapshot(): { current?: string }
    subscribe(fn: () => void): () => void
  }
}

/** The model-directory service face this plugin reaches (structural): the current session's directory store. */
interface ModelDirectoriesFaceLike {
  directoryFor(sessionId: string): {
    store: {
      getSnapshot(): ProviderBadgeInput
      subscribe(fn: () => void): () => void
    }
  }
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
  const sessions = ctx.get('sessions') as SessionsFaceLike
  const modelDirectories = ctx.get('modelDirectories') as ModelDirectoriesFaceLike
  const t = ctx.locale.bind(NS)

  // The provider badge for the current session's selection, read live from the
  // model directory. Keying off `current.provider` (not the model label) is what
  // makes a model served by several providers resolve to the right one.
  const readBadge = (): ProviderBadge | undefined => {
    const sessionId = sessions.list.getSnapshot().current
    if (sessionId === undefined) return undefined
    try {
      const directory = modelDirectories.directoryFor(sessionId)
      return providerBadgeOf(directory.store.getSnapshot())
    } catch {
      // Session scope not minted yet; the sessions.list subscription retries.
      return undefined
    }
  }

  // Re-patch when the current session changes or its directory store changes,
  // covering selection switches that mutate no trigger text (two providers
  // sharing a model name).
  const subscribeBadgeChanges = (onChange: () => void): () => void => {
    let offDirectory: (() => void) | null = null
    let bound: string | undefined

    const resync = (): void => {
      const sessionId = sessions.list.getSnapshot().current
      if (sessionId !== bound || (sessionId !== undefined && offDirectory === null)) {
        bound = sessionId
        offDirectory?.()
        offDirectory = null
        if (sessionId !== undefined) {
          try {
            offDirectory = modelDirectories.directoryFor(sessionId).store.subscribe(onChange)
          } catch {
            // Scope not minted yet; a later sessions.list notification retries.
          }
        }
      }
      onChange()
    }

    resync()
    const offSessions = sessions.list.subscribe(resync)
    return () => {
      offSessions()
      offDirectory?.()
    }
  }

  // Badge lifecycle, gated by the localStorage switch: install once when it
  // flips on, dispose when it flips off.
  let badgesDispose: (() => void) | null = null
  const syncBadges = (): void => {
    const enabled = readProviderLabel()
    if (enabled && badgesDispose === null) {
      badgesDispose = installProviderLabelBadges(readBadge, subscribeBadgeChanges)
    } else if (!enabled && badgesDispose !== null) {
      badgesDispose()
      badgesDispose = null
    }
  }

  ctx.effect(() => {
    syncBadges()
    const offToggle = subscribeProviderLabel(syncBadges)
    return () => {
      offToggle()
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
