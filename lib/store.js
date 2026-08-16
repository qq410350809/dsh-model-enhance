// src/contract.ts
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
export {
  buildOps,
  deepEqualJson,
  providerBadgeOf,
  readConfig,
  readModel,
  renderEfforts
};
//# sourceMappingURL=store.js.map
