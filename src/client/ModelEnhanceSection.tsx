/**
 * The settings-page section for model enhancement: per-provider collapsible
 * cards, each row exposing an enable toggle and multi-select reasoning-effort
 * chips, plus the provider-label switch that gates the model-selector badges.
 * The `llm-pi-ai` namespace rides the settings wire API; the switch is a
 * localStorage preference.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  SETTINGS_NS,
  type EffortLevel,
  type ModelEnhanceConfig,
  type ModelEnhanceModel,
  type ModelEnhanceProvider,
  type RawSection,
  type SettingsWireFace,
} from '../contract.ts'
import { buildOps, readConfig } from './store.ts'
import { readProviderLabel, writeProviderLabel } from './prefs.ts'
import type { ModelEnhanceKey } from './locales.ts'

/** The namespace-bound translate function shared by the section and its rows. */
type T = PropsLocale<'model-enhance'>['t']

/** Effort-level display metadata (colors follow the escalation order). */
const EFFORT_META: ReadonlyArray<{ key: EffortLevel; color: string }> = [
  { key: 'off', color: '#6b7280' },
  { key: 'minimal', color: '#14b8a6' },
  { key: 'low', color: '#10b981' },
  { key: 'medium', color: '#f59e0b' },
  { key: 'high', color: '#f97316' },
  { key: 'xhigh', color: '#a855f7' },
  { key: 'max', color: '#ef4444' },
]

/** Injected business face: the settings wire API plus a live-refresh subscription. */
export interface ModelEnhanceSectionInjected {
  api: { settings: SettingsWireFace }
  /** Subscribe to external changes; the returned disposer unsubscribes. */
  onInvalidate: (reload: () => void) => () => void
}

/** Full section props: runtime share + injected face + the locale seat. */
export type ModelEnhanceSectionProps = PropsRuntime<'settings.section'> &
  InjectFace<ModelEnhanceSectionInjected> &
  PropsLocale<'model-enhance'>

/** Local section state. */
interface SectionState {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  writable: boolean
  revision: number | undefined
  section: RawSection | undefined
  config: ModelEnhanceConfig
  saving: boolean
  toast: { text: string; error: boolean } | null
  providerLabel: boolean
}

const INITIAL: SectionState = {
  status: 'loading',
  error: null,
  writable: true,
  revision: undefined,
  section: undefined,
  config: { providers: [] },
  saving: false,
  toast: null,
  providerLabel: false,
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Update one model inside an immutable config copy. */
function patchModel(
  config: ModelEnhanceConfig,
  providerName: string,
  modelId: string,
  patch: Partial<ModelEnhanceModel>,
): ModelEnhanceConfig {
  return {
    providers: config.providers.map((provider) =>
      provider.name !== providerName
        ? provider
        : {
            ...provider,
            models: provider.models.map((model) => (model.id !== modelId ? model : { ...model, ...patch })),
          },
    ),
  }
}

/** Default efforts applied when a model is turned on with none selected. */
const DEFAULT_EFFORTS: EffortLevel[] = ['off', 'low', 'medium']

export function ModelEnhanceSection({ api, t, onInvalidate }: ModelEnhanceSectionProps) {
  const [state, setState] = useState<SectionState>(INITIAL)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showToast = (text: string, error = false): void => {
    setState((s) => ({ ...s, toast: { text, error } }))
    if (toastTimer.current !== undefined) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, toast: null }))
    }, 2500)
  }

  const load = async (): Promise<void> => {
    setState((s) => ({ ...s, status: 'loading', error: null }))
    try {
      const response = await api.settings.describe({})
      if (!response.result.ok) throw new Error(response.result.error.message)
      const { writable, namespaces } = response.result.value
      const view = namespaces.find((n) => n.ns === SETTINGS_NS)
      if (view === undefined) throw new Error(`settings namespace "${SETTINGS_NS}" is not registered`)
      const section = (view.user ?? view.value) as RawSection | undefined
      setState((s) => ({
        ...s,
        status: 'ready',
        writable,
        revision: view.revision,
        section,
        config: readConfig(section),
      }))
    } catch (error) {
      setState((s) => ({ ...s, status: 'error', error: messageOf(error) }))
    }
  }

  useEffect(() => {
    void load()
    setState((s) => ({ ...s, providerLabel: readProviderLabel() }))
    const offInvalidate = onInvalidate(() => {
      void load()
    })
    return () => {
      offInvalidate()
      if (toastTimer.current !== undefined) clearTimeout(toastTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async (): Promise<void> => {
    const ops = buildOps(state.section, state.config)
    if (ops.length === 0) {
      showToast(t('saved'))
      return
    }
    setState((s) => ({ ...s, saving: true }))
    try {
      const response = await api.settings.mutate({ ns: SETTINGS_NS, ops, expectedRevision: state.revision })
      if (!response.result.ok) {
        const { error } = response.result
        throw new Error(error.code === 'settings-conflict' ? `${error.code}: ${error.message}` : error.message)
      }
      // Re-read so the section, revision, and values reflect what just persisted.
      await load()
      showToast(t('saved'))
    } catch (error) {
      showToast(`${t('saveFailed')}: ${messageOf(error)}`, true)
    } finally {
      setState((s) => ({ ...s, saving: false }))
    }
  }

  const toggleModel = (providerName: string, modelId: string, model: ModelEnhanceModel): void => {
    if (model.enabled) {
      setState((s) => ({ ...s, config: patchModel(s.config, providerName, modelId, { enabled: false, efforts: [] }) }))
    } else {
      const efforts = model.efforts.length > 0 ? model.efforts : [...DEFAULT_EFFORTS]
      setState((s) => ({ ...s, config: patchModel(s.config, providerName, modelId, { enabled: true, efforts }) }))
    }
  }

  const toggleEffort = (providerName: string, modelId: string, model: ModelEnhanceModel, level: EffortLevel): void => {
    const efforts = model.efforts.includes(level)
      ? model.efforts.filter((e) => e !== level)
      : [...model.efforts, level].sort(
          (a, b) => EFFORT_META.findIndex((m) => m.key === a) - EFFORT_META.findIndex((m) => m.key === b),
        )
    setState((s) => ({ ...s, config: patchModel(s.config, providerName, modelId, { efforts }) }))
  }

  const toggleProviderLabel = (): void => {
    const next = !readProviderLabel()
    setState((s) => ({ ...s, providerLabel: next }))
    writeProviderLabel(next)
  }

  if (state.status === 'loading') {
    return <p className="dsh_me_empty">{t('loading')}</p>
  }
  if (state.status === 'error') {
    return (
      <p className="dsh_me_error">
        {t('loadFailed')}: {state.error}
      </p>
    )
  }

  return (
    <section className="dsh_me_section" aria-labelledby="dsh-model-enhance-title">
      <div className="dsh_me_head">
        <h2 id="dsh-model-enhance-title" className="dsh_me_title">{t('title')}</h2>
        <p className="dsh_me_subtitle">{t('subtitle')}</p>
      </div>

      <div className="dsh_me_pref">
        <div className="dsh_me_pref_text">
          <span className="dsh_me_pref_title">{t('providerLabel')}</span>
          <span className="dsh_me_pref_desc">{t('providerLabelDesc')}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={state.providerLabel}
          className={`dsh_me_toggle${state.providerLabel ? ' dsh_me_toggle_on' : ''}`}
          title={state.providerLabel ? t('providerLabelOn') : t('providerLabelOff')}
          onClick={() => void toggleProviderLabel()}
        />
      </div>

      <div className="dsh_me_actions">
        <button
          type="button"
          className="dsh_me_btn dsh_me_btn_save"
          disabled={state.saving || !state.writable}
          onClick={() => void save()}
        >
          {state.saving ? t('saving') : t('save')}
        </button>
        {!state.writable ? <span className="dsh_me_toast">{t('readonly')}</span> : null}
        {state.toast !== null ? (
          <span className={`dsh_me_toast${state.toast.error ? ' dsh_me_toast_error' : ''}`}>{state.toast.text}</span>
        ) : null}
      </div>

      {state.config.providers.length === 0 ? (
        <p className="dsh_me_empty">{t('empty')}</p>
      ) : (
        state.config.providers.map((provider) => (
          <ProviderCard
            key={provider.name}
            provider={provider}
            t={t}
            onToggleModel={toggleModel}
            onToggleEffort={toggleEffort}
          />
        ))
      )}
    </section>
  )
}

interface ProviderCardProps {
  provider: ModelEnhanceProvider
  t: T
  onToggleModel: (providerName: string, modelId: string, model: ModelEnhanceModel) => void
  onToggleEffort: (providerName: string, modelId: string, model: ModelEnhanceModel, level: EffortLevel) => void
}

function ProviderCard({ provider, t, onToggleModel, onToggleEffort }: ProviderCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className={`dsh_me_card${collapsed ? ' dsh_me_card_collapsed' : ''}`}>
      <button
        type="button"
        className="dsh_me_card_header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <svg
          className="dsh_me_chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className="dsh_me_card_title">{provider.display_name}</span>
        <span className="dsh_me_count">{t('providerCount', { count: String(provider.models.length) })}</span>
      </button>
      {!collapsed
        ? provider.models.map((model) => (
            <ModelRow
              key={model.id}
              providerName={provider.name}
              model={model}
              t={t}
              onToggleModel={onToggleModel}
              onToggleEffort={onToggleEffort}
            />
          ))
        : null}
    </div>
  )
}

interface ModelRowProps {
  providerName: string
  model: ModelEnhanceModel
  t: T
  onToggleModel: (providerName: string, modelId: string, model: ModelEnhanceModel) => void
  onToggleEffort: (providerName: string, modelId: string, model: ModelEnhanceModel, level: EffortLevel) => void
}

function ModelRow({ providerName, model, t, onToggleModel, onToggleEffort }: ModelRowProps) {
  return (
    <div className={`dsh_me_row${model.enabled ? '' : ' dsh_me_row_dim'}`}>
      <span className="dsh_me_model" title={model.id}>{model.id}</span>

      <button
        type="button"
        role="switch"
        aria-checked={model.enabled}
        aria-label={t('enabledLabel')}
        className={`dsh_me_toggle${model.enabled ? ' dsh_me_toggle_on' : ''}`}
        title={model.enabled ? t('toggleOn') : t('toggleOff')}
        onClick={() => onToggleModel(providerName, model.id, model)}
      />

      <div className="dsh_me_chips" role="group" aria-label={t('enabledLabel')}>
        {EFFORT_META.map((meta) => {
          const active = model.efforts.includes(meta.key)
          const labelKey = `effort.${meta.key}` as ModelEnhanceKey
          return (
            <button
              key={meta.key}
              type="button"
              className={`dsh_me_chip${active ? ' dsh_me_chip_on' : ''}`}
              style={{ '--eff': meta.color } as CSSProperties}
              aria-pressed={active}
              title={`${meta.key} / ${t(labelKey)}`}
              onClick={() => onToggleEffort(providerName, model.id, model, meta.key)}
            >
              <span className="dsh_me_chip_dot" />
              <span>{meta.key}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
