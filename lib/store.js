// src/contract.ts
var EFFORT_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];

// src/client/store.ts
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function positiveInt(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return Math.trunc(value);
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
    efforts: effortKeysOf(model.reasoningEfforts),
    context_window: positiveInt(model.contextWindow),
    max_tokens: positiveInt(model.maxTokens)
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
function levelsOnly(raw) {
  const dict = effortsDictOf(raw);
  if (dict === void 0) return void 0;
  const out = {};
  for (const level of EFFORT_LEVELS) {
    if (Object.prototype.hasOwnProperty.call(dict, level)) out[level] = dict[level];
  }
  return out;
}
function buildOps(original, next) {
  const ops = [];
  const providerMap = isPlainObject(original?.providers) ? original.providers : {};
  for (const provider of next.providers) {
    const rawProvider = isPlainObject(providerMap[provider.name]) ? providerMap[provider.name] : {};
    const rawModels = Array.isArray(rawProvider.models) ? rawProvider.models : [];
    provider.models.forEach((model, index) => {
      const base = ["providers", provider.name, "models", String(index)];
      const raw = isPlainObject(rawModels[index]) ? rawModels[index] : {};
      const originalEfforts = raw.reasoningEfforts;
      const wasDict = effortsDictOf(originalEfforts) !== void 0;
      if (model.enabled && model.efforts.length > 0) {
        const nextDict = renderEfforts(originalEfforts, model.efforts);
        const prevDict = levelsOnly(originalEfforts);
        if (prevDict === void 0 || !deepEqualJson(nextDict, prevDict)) {
          ops.push({ op: "set", path: [...base, "reasoningEfforts"], value: nextDict });
        }
      } else if (wasDict) {
        ops.push({ op: "unset", path: [...base, "reasoningEfforts"] });
      }
      if (model.context_window === null) {
        if (raw.contextWindow !== void 0) {
          ops.push({ op: "unset", path: [...base, "contextWindow"] });
        }
      } else if (positiveInt(raw.contextWindow) !== model.context_window) {
        ops.push({ op: "set", path: [...base, "contextWindow"], value: model.context_window });
      }
      if (model.max_tokens === null) {
        if (raw.maxTokens !== void 0) {
          ops.push({ op: "unset", path: [...base, "maxTokens"] });
        }
      } else if (positiveInt(raw.maxTokens) !== model.max_tokens) {
        ops.push({ op: "set", path: [...base, "maxTokens"], value: model.max_tokens });
      }
    });
  }
  return ops;
}
export {
  buildOps,
  deepEqualJson,
  readConfig,
  readModel,
  renderEfforts
};
//# sourceMappingURL=store.js.map
