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
export declare function installProviderLabelBadges(getLabels: () => Readonly<Record<string, string>>): () => void;
