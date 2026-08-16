/**
 * dsh-model-enhance client plugin: the browser half. Registers the settings
 * section that edits the `llm-pi-ai` namespace, its locale dictionaries, and
 * keeps the section fresh on pushed settings invalidations — no host-side
 * behavior is involved: reads and writes go through the settings wire API
 * (`connection.api.settings`), the same plane the Models page uses.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: brings the ctx.locale Context merge in.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the settings.section SlotMap seat and locale namespace table.
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: brings the `settings.section` SlotMap augmentation (declared by the
// settings domain base plugin) into this program.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SettingsWireFace } from '../contract.ts'
import { ModelEnhanceSection, type ModelEnhanceSectionInjected } from './ModelEnhanceSection.tsx'
import { NS, en, zh } from './locales.ts'
import { adoptStyles } from './styles.ts'

/** Required services: settings section slot, locale, the wire connection, and pushed invalidation events. */
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
 * Compose the model-enhance settings surface.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  adoptStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-model-enhance: dictionaries')

  const connection = ctx.get('connection') as ConnectionHandleLike
  const remote = ctx.get('remote') as RemoteFaceLike
  const t = ctx.locale.bind(NS)

  const injected = (): ModelEnhanceSectionInjected => ({
    api: { settings: connection.api.settings },
    // The section re-reads its namespace whenever the settings document changes
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
