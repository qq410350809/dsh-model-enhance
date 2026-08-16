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
        <div className="dsh_me_head_row">
          <svg className="dsh_me_icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8.00192 6.64454C8.75026 6.64454 9.35732 7.25169 9.35739 8.00001C9.35739 8.74838 8.7503 9.35548 8.00192 9.35548C7.25367 9.35533 6.64743 8.74829 6.64743 8.00001C6.6475 7.25178 7.25371 6.64468 8.00192 6.64454Z"
              fill="currentColor"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.97165 1.29981C11.5853 0.718916 13.271 0.642197 14.3144 1.68555C15.3577 2.72902 15.2811 4.41466 14.7002 6.02833C14.4707 6.66561 14.1504 7.32937 13.75 8.00001C14.1504 8.67062 14.4707 9.33444 14.7002 9.97169C15.2811 11.5854 15.3578 13.271 14.3144 14.3145C13.271 15.3579 11.5854 15.2811 9.97165 14.7002C9.3344 14.4708 8.67059 14.1505 7.99997 13.75C7.32933 14.1505 6.66558 14.4708 6.02829 14.7002C4.41461 15.2811 2.72899 15.3578 1.68552 14.3145C0.642155 13.271 0.71887 11.5854 1.29977 9.97169C1.52915 9.33454 1.84865 8.67049 2.24899 8.00001C1.84866 7.32953 1.52915 6.66544 1.29977 6.02833C0.718852 4.41459 0.64207 2.729 1.68552 1.68555C2.72897 0.642112 4.41456 0.718887 6.02829 1.29981C6.66541 1.52918 7.32949 1.8487 7.99997 2.24903C8.67045 1.84869 9.33451 1.52919 9.97165 1.29981ZM12.9404 9.2129C12.4391 9.893 11.8616 10.5681 11.2148 11.2149C10.568 11.8616 9.89296 12.4391 9.21286 12.9404C9.62532 13.1579 10.0271 13.338 10.4121 13.4766C11.9146 14.0174 12.9172 13.8738 13.3955 13.3955C13.8737 12.9173 14.0174 11.9146 13.4765 10.4121C13.3379 10.0271 13.1578 9.62535 12.9404 9.2129ZM3.05856 9.2129C2.84121 9.62523 2.66197 10.0272 2.52341 10.4121C1.98252 11.9146 2.12627 12.9172 2.60446 13.3955C3.08278 13.8737 4.08544 14.0174 5.58786 13.4766C5.97264 13.338 6.37389 13.1577 6.7861 12.9404C6.10624 12.4393 5.43168 11.8614 4.78513 11.2149C4.13823 10.5679 3.55992 9.89313 3.05856 9.2129ZM7.99899 3.792C7.23179 4.31419 6.45306 4.95512 5.70407 5.70411C4.95509 6.45309 4.31415 7.23184 3.79196 7.99903C4.3143 8.76666 4.95471 9.54653 5.70407 10.2959C6.45309 11.0449 7.23271 11.6848 7.99997 12.207C8.76725 11.6848 9.54683 11.0449 10.2959 10.2959C11.0449 9.54686 11.6848 8.76729 12.207 8.00001C11.6848 7.23275 11.0449 6.45312 10.2959 5.70411C9.5465 4.95475 8.76662 4.31434 7.99899 3.792ZM5.58786 2.52344C4.08533 1.98255 3.08272 2.12625 2.60446 2.6045C2.12621 3.08275 1.98252 4.08536 2.52341 5.5879C2.66189 5.97253 2.8414 6.37409 3.05856 6.78614C3.55983 6.10611 4.1384 5.43189 4.78513 4.78516C5.43186 4.13843 6.10606 3.55987 6.7861 3.0586C6.37405 2.84144 5.97249 2.66192 5.58786 2.52344ZM13.3955 2.6045C12.9172 2.12631 11.9146 1.98257 10.4121 2.52344C10.0272 2.66201 9.62519 2.84125 9.21286 3.0586C9.8931 3.55996 10.5679 4.13827 11.2148 4.78516C11.8614 5.43172 12.4392 6.10627 12.9404 6.78614C13.1577 6.37393 13.338 5.97267 13.4765 5.5879C14.0174 4.08549 13.8736 3.08281 13.3955 2.6045Z"
              fill="currentColor"
            />
          </svg>
          <h2 id="dsh-model-enhance-title" className="dsh_me_title">{t('title')}</h2>
        </div>
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
