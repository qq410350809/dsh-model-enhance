# dsh-model-enhance

把 DSH Client（Tauri 应用）的「模型增强」菜单移植为 DeepSeek Harness（DSH）的 Web 插件。

在 DSH Web 的设置页新增一个「模型增强」板块，按提供方与模型编辑：

- **推理强度**（`reasoningEfforts`）——开关 + 多选等级（off / minimal / low / medium / high / xhigh / max），对应 DSH `llm-pi-ai` 适配器接受的全部思维等级。
- **上下文窗口**（`contextWindow`）
- **最大输出 token**（`maxTokens`）

改动即时生效（`llm-pi-ai` 命名空间以 `live` 语义注册），并保留配置里的其他字段。

## 工作原理

原 Tauri 客户端直接读写 `~/.dsh/settings.yaml` 的 `llm-pi-ai.providers` 一节。DSH 已经把这一节暴露为同名设置命名空间（`llm-pi-ai`，由 `dsh-llm-pi-ai` 通过 `installSettingsSection` 注册），所以本插件**不需要任何 host 端逻辑**：

- host 端只是一个空的注册标记（`src/index.ts`），让该包进入 host Loader 与客户端 boot graph；
- 浏览器端（`src/client/**`）通过 `connection.api.settings.describe` / `settings.mutate` 读写 `llm-pi-ai` 命名空间，并通过 `settings.section` slot 注册设置页板块。

## 目录结构

```
src/
  index.ts                     # host 插件入口（空 apply 标记）
  contract.ts                  # 共享类型与常量（纯 TS，无 React/DOM）
  client/
    index.ts                   # 客户端插件入口（slot + locale + 失效订阅）
    store.ts                   # 纯逻辑：readConfig / buildOps（移植自 Rust 读写）
    ModelEnhanceSection.tsx    # 设置页 React 组件
    styles.ts                  # 注入的样式表（--dsw-alias-* 设计令牌）
    locales.ts                 # 中英文字典
tests/
  store.spec.mjs               # readConfig / buildOps 单元测试（node:test）
```

## 构建

```sh
pnpm install               # 安装 esbuild / typescript 等 devDependencies
bash scripts/link-types.sh # 把 @deepseek-ai/* 类型包链接进 node_modules（仅 tsc 需要）
node build.mjs             # esbuild 产出 lib/index.js + lib/client.js + lib/store.js，再 tsc 产出 .d.ts
node --test tests/*.spec.mjs   # 运行单元测试
```

> 说明：`src/` 里所有 `@deepseek-ai/*` 导入都是 `import type`（esbuild 会抹除、并 external 化），
> 因此编译产物不依赖它们；只有 `tsc` 类型检查与 `.d.ts` 产出需要这些类型。
> `link-types.sh` 默认从 `/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai`
> 链接，可用 `DSH_NM=...` 覆盖为你的 DSH checkout 路径。

## 安装到 Web profile

在插件目录打包/链接后，把包加进 `~/.dsh/profiles/web`：

```sh
dsh plugin --profile web add link:/Applications/custom/dsh-plugins/dsh-model-enhance
```

或在 `~/.dsh/profiles/web/package.json` 手工添加依赖与 bundle 条目：

```jsonc
{
  "dependencies": {
    "dsh-model-enhance": "link:/Applications/custom/dsh-plugins/dsh-model-enhance"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-model-enhance"
      ]
    }
  }
}
```

随后在该 profile 目录执行 `pnpm install`，重启 `dsh web` 即可在「设置 → 模型增强」看到板块。
