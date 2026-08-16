/**
 * dsh-model-enhance locale namespace: the settings section copy.
 * Chinese is the product copy; English mirrors it.
 */

export const zh = {
  'nav': '模型增强',
  'title': '模型增强',
  'subtitle': '按提供方与模型编辑推理强度（reasoningEfforts）；改动即时生效。',
  'save': '保存',
  'saving': '保存中…',
  'saved': '已保存',
  'saveFailed': '保存失败',
  'loading': '加载配置中…',
  'loadFailed': '加载失败',
  'empty': '未找到任何模型配置（llm-pi-ai.providers 为空）',
  'providerCount': '{count} 个模型',
  'toggleOn': '已启用 reasoningEfforts（点击关闭）',
  'toggleOff': '未启用 reasoningEfforts（点击启用）',
  'enabledLabel': '推理强度',
  'effort.off': '关闭',
  'effort.minimal': '极低',
  'effort.low': '低',
  'effort.medium': '中',
  'effort.high': '高',
  'effort.xhigh': '超高',
  'effort.max': '最大',
  'readonly': '设置文档为只读，无法保存',
} satisfies Record<string, string>

export type ModelEnhanceKey = keyof typeof zh

export const en = {
  'nav': 'Model enhance',
  'title': 'Model enhance',
  'subtitle': 'Edit reasoningEfforts per provider and model; changes apply live.',
  'save': 'Save',
  'saving': 'Saving…',
  'saved': 'Saved',
  'saveFailed': 'Save failed',
  'loading': 'Loading configuration…',
  'loadFailed': 'Load failed',
  'empty': 'No model configuration found (llm-pi-ai.providers is empty)',
  'providerCount': '{count} models',
  'toggleOn': 'reasoningEfforts enabled (click to disable)',
  'toggleOff': 'reasoningEfforts disabled (click to enable)',
  'enabledLabel': 'Reasoning effort',
  'effort.off': 'Off',
  'effort.minimal': 'Minimal',
  'effort.low': 'Low',
  'effort.medium': 'Medium',
  'effort.high': 'High',
  'effort.xhigh': 'X-high',
  'effort.max': 'Max',
  'readonly': 'Settings document is read-only; cannot save',
} satisfies Record<ModelEnhanceKey, string>

/** Locale namespace id registered under ctx.locale. */
export const NS = 'model-enhance'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    [NS]: ModelEnhanceKey
  }
}
