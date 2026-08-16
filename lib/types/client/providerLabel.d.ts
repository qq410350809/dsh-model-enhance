/**
 * Provider-label badge installer for the model selector — the "接入方显示模式"
 * surface. Renders the provider (接入方) display name as a flex-none badge
 * before the model label on the model-selector trigger button.
 *
 * The badge is provider-aware, not name-keyed: the caller supplies the *current
 * selection's* badge (model display name + provider display name), so a model
 * offered by several providers at once is always labeled with the provider that
 * actually serves the selected route. The badge rides a `data-dsh-provider`
 * attribute plus a CSS `::before`, so it survives React re-renders (no DOM
 * insertion to fight over) and is never squeezed out by the trigger's 220px
 * max-width (relaxed to 340px while a badge is present).
 *
 * A MutationObserver keeps it fresh as the selector mounts/re-renders, and the
 * caller's `subscribe` re-patches on selection/directory changes that mutate no
 * DOM text (switching between two providers that share a model name).
 *
 * @param getBadge - current badge state, or undefined while none applies.
 * @param subscribe - subscribe to badge-source changes; returns a disposer.
 * @returns a disposer that removes the injected stylesheet, observer, badges,
 *   and source subscription.
 */
export declare function installProviderLabelBadges(getBadge: () => {
    modelLabel: string;
    providerName: string;
} | undefined, subscribe: (onChange: () => void) => () => void): () => void;
