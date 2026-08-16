/**
 * Provider-label badge installer for the model selector — the "接入方显示模式"
 * surface. Renders the provider (接入方) display name as a flex-none badge
 * before the model label on every model-selector trigger button.
 *
 * The badge rides a `data-dsh-provider` attribute plus a CSS `::before`, so it
 * survives React re-renders (no DOM insertion to fight over) and is never
 * squeezed out by the trigger's 220px max-width (relaxed to 340px while a
 * badge is present). A MutationObserver keeps it fresh as the selector mounts,
 * and the label map is re-read on every patch, so settings edits land live.
 *
 * @param getLabels - current model-label → provider display-name map.
 * @returns a disposer that removes the injected stylesheet, observer, and badges.
 */
export function installProviderLabelBadges(getLabels: () => Readonly<Record<string, string>>): () => void {
  const BADGE_ATTR = 'data-dsh-provider'
  const CSS_ID = 'dsh-model-enhance-provider-label-css'

  const providerFor = (text: string): string | undefined => {
    const trimmed = text.trim()
    if (trimmed.length === 0) return undefined
    const labels = getLabels()
    return Object.prototype.hasOwnProperty.call(labels, trimmed) ? labels[trimmed] : undefined
  }

  const ensureCss = (): void => {
    if (document.getElementById(CSS_ID) !== null) return
    const style = document.createElement('style')
    style.id = CSS_ID
    style.textContent =
      `button[aria-haspopup="menu"][${BADGE_ATTR}]{max-width:340px}` +
      `button[aria-haspopup="menu"][${BADGE_ATTR}]::before{` +
      'content:attr(' + BADGE_ATTR + ');flex:none;' +
      'padding:0 5px;border-radius:4px;' +
      'font-size:10px;line-height:16px;font-weight:600;letter-spacing:.2px;' +
      'background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.08));' +
      'color:var(--dsw-alias-label-caption,#8a8a9e);' +
      'white-space:nowrap;' +
      '}'
    document.head.appendChild(style)
  }

  const patchTriggers = (): void => {
    const triggers = document.querySelectorAll('button[aria-haspopup="menu"]')
    for (const btn of Array.from(triggers)) {
      const labelEl = btn.firstElementChild
      if (labelEl === null) continue
      const provider = providerFor(labelEl.textContent ?? '')
      if (provider !== undefined) {
        if (btn.getAttribute(BADGE_ATTR) !== provider) btn.setAttribute(BADGE_ATTR, provider)
      } else if (btn.hasAttribute(BADGE_ATTR)) {
        btn.removeAttribute(BADGE_ATTR)
      }
    }
  }

  ensureCss()
  patchTriggers()

  let raf = 0
  const schedule = (): void => {
    if (raf !== 0) return
    raf = requestAnimationFrame(() => {
      raf = 0
      patchTriggers()
    })
  }
  const observer = new MutationObserver(schedule)
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })

  return () => {
    observer.disconnect()
    if (raf !== 0) cancelAnimationFrame(raf)
    document.getElementById(CSS_ID)?.remove()
    for (const btn of Array.from(document.querySelectorAll(`button[aria-haspopup="menu"][${BADGE_ATTR}]`))) {
      btn.removeAttribute(BADGE_ATTR)
    }
  }
}
