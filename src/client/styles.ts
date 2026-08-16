/**
 * The model-enhance section stylesheet, injected once by the client plugin body.
 * Tokens come only from the shared `--dsw-alias-*` design platform (no literal
 * colors); class names carry the `dsh_me` prefix to stay unique in the shell.
 */

export const STYLE_ID = 'dsh-model-enhance-style'

export const cssText = `
.dsh_me_section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.dsh_me_head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.dsh_me_head_row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.dsh_me_icon {
  flex: none;
  width: 20px;
  height: 20px;
  color: var(--dsw-alias-brand-primary);
}
.dsh_me_title {
  margin: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 18px;
  line-height: 26px;
  font-weight: 600;
}
.dsh_me_subtitle {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.dsh_me_pref {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 14px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.dsh_me_pref_text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dsh_me_pref_title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.dsh_me_pref_desc {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh_me_actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dsh_me_btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.dsh_me_btn:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh_me_btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.dsh_me_btn_save {
  background: var(--dsw-alias-brand-primary);
  border-color: transparent;
  color: var(--dsw-alias-label-primary-foreground);
}
.dsh_me_btn_save:hover:not(:disabled) {
  background: var(--dsw-alias-brand-primary-hover, var(--dsw-alias-brand-primary));
}
.dsh_me_toast {
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.dsh_me_toast_error {
  color: var(--dsw-alias-danger, #ef4444);
}
.dsh_me_empty,
.dsh_me_error {
  color: var(--dsw-alias-label-tertiary);
  font-size: 14px;
  line-height: 22px;
  padding: 8px 0;
}
.dsh_me_error {
  color: var(--dsw-alias-danger, #ef4444);
}
.dsh_me_card {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
  overflow: hidden;
}
.dsh_me_card_header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border: 0;
  width: 100%;
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}
.dsh_me_card_header:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh_me_chevron {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--dsw-alias-label-dimmed);
  transition: transform .18s ease;
}
.dsh_me_card_collapsed .dsh_me_chevron {
  transform: rotate(-90deg);
}
.dsh_me_card_title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh_me_count {
  flex: none;
  font-size: 11px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover);
  padding: 2px 9px;
  border-radius: 999px;
}
.dsh_me_row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 14px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dsh_me_model {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, "SF Mono", "Fira Code", monospace;
  font-size: 12.5px;
  color: var(--dsw-alias-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh_me_row_dim .dsh_me_model {
  color: var(--dsw-alias-label-dimmed);
}
.dsh_me_toggle {
  flex: none;
  position: relative;
  width: 38px;
  height: 22px;
  border: 0;
  padding: 0;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-border-l2));
  cursor: pointer;
  transition: background .2s;
}
.dsh_me_toggle::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: var(--dsw-alias-label-primary-foreground);
  border-radius: 50%;
  transition: transform .2s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 1px 2px rgba(0,0,0,.3);
}
.dsh_me_toggle_on {
  background: var(--dsw-alias-brand-primary);
}
.dsh_me_toggle_on::after {
  transform: translateX(16px);
}
.dsh_me_chips {
  display: flex;
  align-items: stretch;
  flex: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  overflow: hidden;
}
.dsh_me_row_dim .dsh_me_chips {
  opacity: .4;
  pointer-events: none;
}
.dsh_me_chip {
  --eff: #888;
  min-width: 42px;
  height: 24px;
  border: 0;
  padding: 0 7px;
  font: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-bg-layer-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.dsh_me_chip + .dsh_me_chip {
  border-left: 1px solid var(--dsw-alias-border-l2);
}
.dsh_me_chip_dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--eff);
}
.dsh_me_chip:hover:not(.dsh_me_chip_on) {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsh_me_chip_on {
  background: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-label-primary-foreground);
}
.dsh_me_chip_on .dsh_me_chip_dot {
  background: var(--dsw-alias-label-primary-foreground);
}
@media (max-width: 720px) {
  .dsh_me_row { flex-wrap: wrap; }
  .dsh_me_chips { order: 10; width: 100%; }
}
`

export function adoptStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = cssText
  document.head.appendChild(style)
}
