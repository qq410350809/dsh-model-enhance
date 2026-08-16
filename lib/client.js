window.__ModuleLoader__.load({ id: 'dsh-model-enhance', factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/ModelEnhanceSection.tsx
var import_react = require("react");

// src/contract.ts
var SETTINGS_NS = "llm-pi-ai";
var EFFORT_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];

// src/client/store.ts
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nonEmptyString(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function effortsDictOf(raw) {
  return isPlainObject(raw) ? raw : void 0;
}
function effortKeysOf(raw) {
  const dict = effortsDictOf(raw);
  if (dict === void 0) return [];
  return EFFORT_LEVELS.filter((level) => Object.prototype.hasOwnProperty.call(dict, level));
}
function readModel(model) {
  const id = nonEmptyString(model?.id);
  if (id === void 0) return null;
  const dict = effortsDictOf(model.reasoningEfforts);
  return {
    id,
    enabled: dict !== void 0,
    efforts: effortKeysOf(model.reasoningEfforts)
  };
}
function readConfig(section) {
  const providers = [];
  const providerMap = section?.providers;
  if (isPlainObject(providerMap)) {
    for (const [name, value] of Object.entries(providerMap)) {
      const profile = isPlainObject(value) ? value : {};
      const display_name = nonEmptyString(profile.displayName) ?? name;
      const models = [];
      if (Array.isArray(profile.models)) {
        for (const entry of profile.models) {
          if (!isPlainObject(entry)) continue;
          const model = readModel(entry);
          if (model !== null) models.push(model);
        }
      }
      providers.push({ name, display_name, models });
    }
  }
  return { providers };
}
function providerBadgeOf(directory) {
  const current = directory.current;
  if (current === null) return void 0;
  const group = directory.groups.find((candidate) => candidate.id === current.provider);
  const providerName = group?.name ?? current.provider;
  const model = group?.models.find((candidate) => candidate.id === current.model);
  const modelLabel = model?.name ?? current.model;
  return { modelLabel, providerName };
}
function renderEfforts(original, selected) {
  const dict = effortsDictOf(original);
  const out = {};
  for (const level of EFFORT_LEVELS) {
    if (!selected.includes(level)) continue;
    const existing = dict !== void 0 ? dict[level] : void 0;
    if (level === "off") {
      out.off = nonEmptyString(existing) ?? null;
    } else {
      out[level] = nonEmptyString(existing) ?? level;
    }
  }
  return out;
}
function deepEqualJson(a, b) {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => deepEqualJson(value, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqualJson(a[key], b[key]));
  }
  return false;
}
function buildOps(original, next) {
  const ops = [];
  const providerMap = isPlainObject(original?.providers) ? original.providers : {};
  for (const provider of next.providers) {
    const rawProvider = isPlainObject(providerMap[provider.name]) ? providerMap[provider.name] : {};
    const rawModels = Array.isArray(rawProvider.models) ? rawProvider.models : [];
    const byId = new Map(provider.models.map((model) => [model.id, model]));
    const newModels = rawModels.map((entry) => {
      if (!isPlainObject(entry)) return entry;
      const rawId = nonEmptyString(entry.id);
      const ui = rawId !== void 0 ? byId.get(rawId) : void 0;
      if (ui === void 0) return { ...entry };
      const originalEfforts = entry.reasoningEfforts;
      const wasDict = effortsDictOf(originalEfforts) !== void 0;
      const out = { ...entry };
      if (ui.enabled && ui.efforts.length > 0) {
        out.reasoningEfforts = renderEfforts(originalEfforts, ui.efforts);
      } else if (wasDict) {
        delete out.reasoningEfforts;
      }
      return out;
    });
    if (!deepEqualJson(newModels, rawModels)) {
      ops.push({ op: "set", path: ["providers", provider.name, "models"], value: newModels });
    }
  }
  return ops;
}

// src/client/prefs.ts
var PROVIDER_LABEL_KEY = "dsh-model-enhance:providerLabel";
var EVENT = "dsh-model-enhance:providerLabel";
function readProviderLabel() {
  try {
    return localStorage.getItem(PROVIDER_LABEL_KEY) === "1";
  } catch {
    return false;
  }
}
function writeProviderLabel(value) {
  try {
    if (value) localStorage.setItem(PROVIDER_LABEL_KEY, "1");
    else localStorage.removeItem(PROVIDER_LABEL_KEY);
  } catch {
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}
function subscribeProviderLabel(callback) {
  const onEvent = () => callback(readProviderLabel());
  const onStorage = (event) => {
    if (event.key === PROVIDER_LABEL_KEY || event.key === null) onEvent();
  };
  window.addEventListener(EVENT, onEvent);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onEvent);
    window.removeEventListener("storage", onStorage);
  };
}

// src/client/ModelEnhanceSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var EFFORT_META = [
  { key: "off", color: "#6b7280" },
  { key: "minimal", color: "#14b8a6" },
  { key: "low", color: "#10b981" },
  { key: "medium", color: "#f59e0b" },
  { key: "high", color: "#f97316" },
  { key: "xhigh", color: "#a855f7" },
  { key: "max", color: "#ef4444" }
];
var INITIAL = {
  status: "loading",
  error: null,
  writable: true,
  revision: void 0,
  section: void 0,
  config: { providers: [] },
  saving: false,
  toast: null,
  providerLabel: false
};
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
function patchModel(config, providerName, modelId, patch) {
  return {
    providers: config.providers.map(
      (provider) => provider.name !== providerName ? provider : {
        ...provider,
        models: provider.models.map((model) => model.id !== modelId ? model : { ...model, ...patch })
      }
    )
  };
}
var DEFAULT_EFFORTS = ["off", "low", "medium"];
function ModelEnhanceSection({ api, t, onInvalidate }) {
  const [state, setState] = (0, import_react.useState)(INITIAL);
  const toastTimer = (0, import_react.useRef)(void 0);
  const showToast = (text, error = false) => {
    setState((s) => ({ ...s, toast: { text, error } }));
    if (toastTimer.current !== void 0) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, toast: null }));
    }, 2500);
  };
  const load = async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const response = await api.settings.describe({});
      if (!response.result.ok) throw new Error(response.result.error.message);
      const { writable, namespaces } = response.result.value;
      const view = namespaces.find((n) => n.ns === SETTINGS_NS);
      if (view === void 0) throw new Error(`settings namespace "${SETTINGS_NS}" is not registered`);
      const section = view.user ?? view.value;
      setState((s) => ({
        ...s,
        status: "ready",
        writable,
        revision: view.revision,
        section,
        config: readConfig(section)
      }));
    } catch (error) {
      setState((s) => ({ ...s, status: "error", error: messageOf(error) }));
    }
  };
  (0, import_react.useEffect)(() => {
    void load();
    setState((s) => ({ ...s, providerLabel: readProviderLabel() }));
    const offInvalidate = onInvalidate(() => {
      void load();
    });
    return () => {
      offInvalidate();
      if (toastTimer.current !== void 0) clearTimeout(toastTimer.current);
    };
  }, []);
  const save = async () => {
    const ops = buildOps(state.section, state.config);
    if (ops.length === 0) {
      showToast(t("saved"));
      return;
    }
    setState((s) => ({ ...s, saving: true }));
    try {
      const response = await api.settings.mutate({ ns: SETTINGS_NS, ops, expectedRevision: state.revision });
      if (!response.result.ok) {
        const { error } = response.result;
        throw new Error(error.code === "settings-conflict" ? `${error.code}: ${error.message}` : error.message);
      }
      await load();
      showToast(t("saved"));
    } catch (error) {
      showToast(`${t("saveFailed")}: ${messageOf(error)}`, true);
    } finally {
      setState((s) => ({ ...s, saving: false }));
    }
  };
  const toggleModel = (providerName, modelId, model) => {
    if (model.enabled) {
      setState((s) => ({ ...s, config: patchModel(s.config, providerName, modelId, { enabled: false, efforts: [] }) }));
    } else {
      const efforts = model.efforts.length > 0 ? model.efforts : [...DEFAULT_EFFORTS];
      setState((s) => ({ ...s, config: patchModel(s.config, providerName, modelId, { enabled: true, efforts }) }));
    }
  };
  const toggleEffort = (providerName, modelId, model, level) => {
    const efforts = model.efforts.includes(level) ? model.efforts.filter((e) => e !== level) : [...model.efforts, level].sort(
      (a, b) => EFFORT_META.findIndex((m) => m.key === a) - EFFORT_META.findIndex((m) => m.key === b)
    );
    setState((s) => ({ ...s, config: patchModel(s.config, providerName, modelId, { efforts }) }));
  };
  const toggleProviderLabel = () => {
    const next = !readProviderLabel();
    setState((s) => ({ ...s, providerLabel: next }));
    writeProviderLabel(next);
  };
  if (state.status === "loading") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_me_empty", children: t("loading") });
  }
  if (state.status === "error") {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "dsh_me_error", children: [
      t("loadFailed"),
      ": ",
      state.error
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsh_me_section", "aria-labelledby": "dsh-model-enhance-title", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_me_head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_me_head_row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { className: "dsh_me_icon", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "path",
            {
              d: "M8.00192 6.64454C8.75026 6.64454 9.35732 7.25169 9.35739 8.00001C9.35739 8.74838 8.7503 9.35548 8.00192 9.35548C7.25367 9.35533 6.64743 8.74829 6.64743 8.00001C6.6475 7.25178 7.25371 6.64468 8.00192 6.64454Z",
              fill: "currentColor"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "path",
            {
              fillRule: "evenodd",
              clipRule: "evenodd",
              d: "M9.97165 1.29981C11.5853 0.718916 13.271 0.642197 14.3144 1.68555C15.3577 2.72902 15.2811 4.41466 14.7002 6.02833C14.4707 6.66561 14.1504 7.32937 13.75 8.00001C14.1504 8.67062 14.4707 9.33444 14.7002 9.97169C15.2811 11.5854 15.3578 13.271 14.3144 14.3145C13.271 15.3579 11.5854 15.2811 9.97165 14.7002C9.3344 14.4708 8.67059 14.1505 7.99997 13.75C7.32933 14.1505 6.66558 14.4708 6.02829 14.7002C4.41461 15.2811 2.72899 15.3578 1.68552 14.3145C0.642155 13.271 0.71887 11.5854 1.29977 9.97169C1.52915 9.33454 1.84865 8.67049 2.24899 8.00001C1.84866 7.32953 1.52915 6.66544 1.29977 6.02833C0.718852 4.41459 0.64207 2.729 1.68552 1.68555C2.72897 0.642112 4.41456 0.718887 6.02829 1.29981C6.66541 1.52918 7.32949 1.8487 7.99997 2.24903C8.67045 1.84869 9.33451 1.52919 9.97165 1.29981ZM12.9404 9.2129C12.4391 9.893 11.8616 10.5681 11.2148 11.2149C10.568 11.8616 9.89296 12.4391 9.21286 12.9404C9.62532 13.1579 10.0271 13.338 10.4121 13.4766C11.9146 14.0174 12.9172 13.8738 13.3955 13.3955C13.8737 12.9173 14.0174 11.9146 13.4765 10.4121C13.3379 10.0271 13.1578 9.62535 12.9404 9.2129ZM3.05856 9.2129C2.84121 9.62523 2.66197 10.0272 2.52341 10.4121C1.98252 11.9146 2.12627 12.9172 2.60446 13.3955C3.08278 13.8737 4.08544 14.0174 5.58786 13.4766C5.97264 13.338 6.37389 13.1577 6.7861 12.9404C6.10624 12.4393 5.43168 11.8614 4.78513 11.2149C4.13823 10.5679 3.55992 9.89313 3.05856 9.2129ZM7.99899 3.792C7.23179 4.31419 6.45306 4.95512 5.70407 5.70411C4.95509 6.45309 4.31415 7.23184 3.79196 7.99903C4.3143 8.76666 4.95471 9.54653 5.70407 10.2959C6.45309 11.0449 7.23271 11.6848 7.99997 12.207C8.76725 11.6848 9.54683 11.0449 10.2959 10.2959C11.0449 9.54686 11.6848 8.76729 12.207 8.00001C11.6848 7.23275 11.0449 6.45312 10.2959 5.70411C9.5465 4.95475 8.76662 4.31434 7.99899 3.792ZM5.58786 2.52344C4.08533 1.98255 3.08272 2.12625 2.60446 2.6045C2.12621 3.08275 1.98252 4.08536 2.52341 5.5879C2.66189 5.97253 2.8414 6.37409 3.05856 6.78614C3.55983 6.10611 4.1384 5.43189 4.78513 4.78516C5.43186 4.13843 6.10606 3.55987 6.7861 3.0586C6.37405 2.84144 5.97249 2.66192 5.58786 2.52344ZM13.3955 2.6045C12.9172 2.12631 11.9146 1.98257 10.4121 2.52344C10.0272 2.66201 9.62519 2.84125 9.21286 3.0586C9.8931 3.55996 10.5679 4.13827 11.2148 4.78516C11.8614 5.43172 12.4392 6.10627 12.9404 6.78614C13.1577 6.37393 13.338 5.97267 13.4765 5.5879C14.0174 4.08549 13.8736 3.08281 13.3955 2.6045Z",
              fill: "currentColor"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { id: "dsh-model-enhance-title", className: "dsh_me_title", children: t("title") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_me_subtitle", children: t("subtitle") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_me_pref", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_me_pref_text", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_me_pref_title", children: t("providerLabel") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_me_pref_desc", children: t("providerLabelDesc") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          role: "switch",
          "aria-checked": state.providerLabel,
          className: `dsh_me_toggle${state.providerLabel ? " dsh_me_toggle_on" : ""}`,
          title: state.providerLabel ? t("providerLabelOn") : t("providerLabelOff"),
          onClick: () => void toggleProviderLabel()
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_me_actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: "dsh_me_btn dsh_me_btn_save",
          disabled: state.saving || !state.writable,
          onClick: () => void save(),
          children: state.saving ? t("saving") : t("save")
        }
      ),
      !state.writable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_me_toast", children: t("readonly") }) : null,
      state.toast !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `dsh_me_toast${state.toast.error ? " dsh_me_toast_error" : ""}`, children: state.toast.text }) : null
    ] }),
    state.config.providers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_me_empty", children: t("empty") }) : state.config.providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ProviderCard,
      {
        provider,
        t,
        onToggleModel: toggleModel,
        onToggleEffort: toggleEffort
      },
      provider.name
    ))
  ] });
}
function ProviderCard({ provider, t, onToggleModel, onToggleEffort }) {
  const [collapsed, setCollapsed] = (0, import_react.useState)(false);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `dsh_me_card${collapsed ? " dsh_me_card_collapsed" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: "dsh_me_card_header",
        onClick: () => setCollapsed((c) => !c),
        "aria-expanded": !collapsed,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "svg",
            {
              className: "dsh_me_chevron",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              "aria-hidden": "true",
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "6 9 12 15 18 9" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_me_card_title", children: provider.display_name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_me_count", children: t("providerCount", { count: String(provider.models.length) }) })
        ]
      }
    ),
    !collapsed ? provider.models.map((model) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ModelRow,
      {
        providerName: provider.name,
        model,
        t,
        onToggleModel,
        onToggleEffort
      },
      model.id
    )) : null
  ] });
}
function ModelRow({ providerName, model, t, onToggleModel, onToggleEffort }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `dsh_me_row${model.enabled ? "" : " dsh_me_row_dim"}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_me_model", title: model.id, children: model.id }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        role: "switch",
        "aria-checked": model.enabled,
        "aria-label": t("enabledLabel"),
        className: `dsh_me_toggle${model.enabled ? " dsh_me_toggle_on" : ""}`,
        title: model.enabled ? t("toggleOn") : t("toggleOff"),
        onClick: () => onToggleModel(providerName, model.id, model)
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_me_chips", role: "group", "aria-label": t("enabledLabel"), children: EFFORT_META.map((meta) => {
      const active = model.efforts.includes(meta.key);
      const labelKey = `effort.${meta.key}`;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          type: "button",
          className: `dsh_me_chip${active ? " dsh_me_chip_on" : ""}`,
          style: { "--eff": meta.color },
          "aria-pressed": active,
          title: `${meta.key} / ${t(labelKey)}`,
          onClick: () => onToggleEffort(providerName, model.id, model, meta.key),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_me_chip_dot" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: meta.key })
          ]
        },
        meta.key
      );
    }) })
  ] });
}

// src/client/locales.ts
var zh = {
  "nav": "\u6A21\u578B\u589E\u5F3A",
  "title": "\u6A21\u578B\u589E\u5F3A",
  "subtitle": "\u6309\u63D0\u4F9B\u65B9\u4E0E\u6A21\u578B\u7F16\u8F91\u63A8\u7406\u5F3A\u5EA6\uFF08reasoningEfforts\uFF09\uFF1B\u6539\u52A8\u5373\u65F6\u751F\u6548\u3002",
  "save": "\u4FDD\u5B58",
  "saving": "\u4FDD\u5B58\u4E2D\u2026",
  "saved": "\u5DF2\u4FDD\u5B58",
  "saveFailed": "\u4FDD\u5B58\u5931\u8D25",
  "loading": "\u52A0\u8F7D\u914D\u7F6E\u4E2D\u2026",
  "loadFailed": "\u52A0\u8F7D\u5931\u8D25",
  "empty": "\u672A\u627E\u5230\u4EFB\u4F55\u6A21\u578B\u914D\u7F6E\uFF08llm-pi-ai.providers \u4E3A\u7A7A\uFF09",
  "providerCount": "{count} \u4E2A\u6A21\u578B",
  "toggleOn": "\u5DF2\u542F\u7528 reasoningEfforts\uFF08\u70B9\u51FB\u5173\u95ED\uFF09",
  "toggleOff": "\u672A\u542F\u7528 reasoningEfforts\uFF08\u70B9\u51FB\u542F\u7528\uFF09",
  "enabledLabel": "\u63A8\u7406\u5F3A\u5EA6",
  "effort.off": "\u5173\u95ED",
  "effort.minimal": "\u6781\u4F4E",
  "effort.low": "\u4F4E",
  "effort.medium": "\u4E2D",
  "effort.high": "\u9AD8",
  "effort.xhigh": "\u8D85\u9AD8",
  "effort.max": "\u6700\u5927",
  "providerLabel": "\u63A5\u5165\u65B9\u663E\u793A\u6A21\u5F0F",
  "providerLabelDesc": "\u5728\u6A21\u578B\u9009\u62E9\u5668\u4E2D\uFF0C\u4E8E\u6A21\u578B\u540D\u79F0\u524D\u663E\u793A\u63A5\u5165\u65B9\uFF08\u63D0\u4F9B\u65B9\uFF09\u540D\u79F0\u5FBD\u6807",
  "providerLabelOn": "\u5DF2\u5F00\u542F\u63A5\u5165\u65B9\u663E\u793A\u6A21\u5F0F\uFF08\u70B9\u51FB\u5173\u95ED\uFF09",
  "providerLabelOff": "\u672A\u5F00\u542F\u63A5\u5165\u65B9\u663E\u793A\u6A21\u5F0F\uFF08\u70B9\u51FB\u5F00\u542F\uFF09",
  "readonly": "\u8BBE\u7F6E\u6587\u6863\u4E3A\u53EA\u8BFB\uFF0C\u65E0\u6CD5\u4FDD\u5B58"
};
var en = {
  "nav": "Model enhance",
  "title": "Model enhance",
  "subtitle": "Edit reasoningEfforts per provider and model; changes apply live.",
  "save": "Save",
  "saving": "Saving\u2026",
  "saved": "Saved",
  "saveFailed": "Save failed",
  "loading": "Loading configuration\u2026",
  "loadFailed": "Load failed",
  "empty": "No model configuration found (llm-pi-ai.providers is empty)",
  "providerCount": "{count} models",
  "toggleOn": "reasoningEfforts enabled (click to disable)",
  "toggleOff": "reasoningEfforts disabled (click to enable)",
  "enabledLabel": "Reasoning effort",
  "effort.off": "Off",
  "effort.minimal": "Minimal",
  "effort.low": "Low",
  "effort.medium": "Medium",
  "effort.high": "High",
  "effort.xhigh": "X-high",
  "effort.max": "Max",
  "providerLabel": "Provider label",
  "providerLabelDesc": "Show the provider name as a badge before the model name in the model selector",
  "providerLabelOn": "Provider label enabled (click to disable)",
  "providerLabelOff": "Provider label disabled (click to enable)",
  "readonly": "Settings document is read-only; cannot save"
};
var NS = "model-enhance";

// src/client/providerLabel.ts
function installProviderLabelBadges(getBadge, subscribe) {
  const BADGE_ATTR = "data-dsh-provider";
  const CSS_ID = "dsh-model-enhance-provider-label-css";
  const ensureCss = () => {
    if (document.getElementById(CSS_ID) !== null) return;
    const style = document.createElement("style");
    style.id = CSS_ID;
    style.textContent = `button[aria-haspopup="menu"][${BADGE_ATTR}]{max-width:340px}button[aria-haspopup="menu"][${BADGE_ATTR}]::before{content:attr(` + BADGE_ATTR + ");flex:none;padding:0 5px;border-radius:4px;font-size:10px;line-height:16px;font-weight:600;letter-spacing:.2px;background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.08));color:var(--dsw-alias-label-caption,#8a8a9e);white-space:nowrap;}";
    document.head.appendChild(style);
  };
  const patchTriggers = () => {
    const badge = getBadge();
    const triggers = document.querySelectorAll('button[aria-haspopup="menu"]');
    for (const btn of Array.from(triggers)) {
      const labelEl = btn.firstElementChild;
      if (labelEl === null) continue;
      const text = (labelEl.textContent ?? "").trim();
      if (badge !== void 0 && text === badge.modelLabel) {
        if (btn.getAttribute(BADGE_ATTR) !== badge.providerName) btn.setAttribute(BADGE_ATTR, badge.providerName);
      } else if (btn.hasAttribute(BADGE_ATTR)) {
        btn.removeAttribute(BADGE_ATTR);
      }
    }
  };
  ensureCss();
  patchTriggers();
  let raf = 0;
  const schedule = () => {
    if (raf !== 0) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      patchTriggers();
    });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  const offSubscribe = subscribe(schedule);
  return () => {
    offSubscribe();
    observer.disconnect();
    if (raf !== 0) cancelAnimationFrame(raf);
    document.getElementById(CSS_ID)?.remove();
    for (const btn of Array.from(document.querySelectorAll(`button[aria-haspopup="menu"][${BADGE_ATTR}]`))) {
      btn.removeAttribute(BADGE_ATTR);
    }
  };
}

// src/client/styles.ts
var STYLE_ID = "dsh-model-enhance-style";
var cssText = `
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
`;
function adoptStyles() {
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = cssText;
  document.head.appendChild(style);
}

// src/client/index.ts
var inject = ["slots", "locale", "connection", "remote", "sessions", "modelDirectories"];
function apply(ctx) {
  adoptStyles();
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-model-enhance: dictionaries");
  const connection = ctx.get("connection");
  const remote = ctx.get("remote");
  const sessions = ctx.get("sessions");
  const modelDirectories = ctx.get("modelDirectories");
  const t = ctx.locale.bind(NS);
  const readBadge = () => {
    const sessionId = sessions.list.getSnapshot().current;
    if (sessionId === void 0) return void 0;
    try {
      const directory = modelDirectories.directoryFor(sessionId);
      return providerBadgeOf(directory.store.getSnapshot());
    } catch {
      return void 0;
    }
  };
  const subscribeBadgeChanges = (onChange) => {
    let offDirectory = null;
    let bound;
    const resync = () => {
      const sessionId = sessions.list.getSnapshot().current;
      if (sessionId !== bound || sessionId !== void 0 && offDirectory === null) {
        bound = sessionId;
        offDirectory?.();
        offDirectory = null;
        if (sessionId !== void 0) {
          try {
            offDirectory = modelDirectories.directoryFor(sessionId).store.subscribe(onChange);
          } catch {
          }
        }
      }
      onChange();
    };
    resync();
    const offSessions = sessions.list.subscribe(resync);
    return () => {
      offSessions();
      offDirectory?.();
    };
  };
  let badgesDispose = null;
  const syncBadges = () => {
    const enabled = readProviderLabel();
    if (enabled && badgesDispose === null) {
      badgesDispose = installProviderLabelBadges(readBadge, subscribeBadgeChanges);
    } else if (!enabled && badgesDispose !== null) {
      badgesDispose();
      badgesDispose = null;
    }
  };
  ctx.effect(() => {
    syncBadges();
    const offToggle = subscribeProviderLabel(syncBadges);
    return () => {
      offToggle();
      if (badgesDispose !== null) {
        badgesDispose();
        badgesDispose = null;
      }
    };
  }, "dsh-model-enhance: provider labels");
  const injected = () => ({
    api: { settings: connection.api.settings },
    // The section re-reads its namespaces whenever the settings document changes
    // (another tab, the Models page, or an external edit) or the connection resets.
    onInvalidate: (reload) => {
      const disposers = [
        remote.$on("settings/document-updated", () => reload()),
        ctx.on("connection/reset", () => reload())
      ];
      return () => {
        for (const dispose of disposers) dispose();
      };
    }
  });
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: "model-enhance",
        order: 20,
        label: () => t("nav"),
        locale: NS,
        inject: injected
      },
      ModelEnhanceSection
    )
  );
}
return module.exports; } });
//# sourceMappingURL=client.js.map
