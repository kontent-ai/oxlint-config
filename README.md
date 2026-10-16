[![npm version](https://badge.fury.io/js/%40kontent-ai%2Foxlint-config.svg)](https://www.npmjs.com/package/@kontent-ai/oxlint-config)
[![npm](https://img.shields.io/npm/dt/@kontent-ai/oxlint-config.svg)](https://www.npmjs.com/package/@kontent-ai/oxlint-config)
[![GitHub license](https://img.shields.io/github/license/kontent-ai/oxlint-config.svg)](https://github.com/kontent-ai/oxlint-config)

# @kontent-ai/oxlint-config

Shared [oxlint](https://oxc.rs/docs/guide/usage/linter) configuration for Kontent.ai packages, bundled with the `kontent` JS plugin.

## Installation

```bash
pnpm add -D @kontent-ai/oxlint-config oxlint oxlint-tsgolint
```

`oxlint-tsgolint` is an optional peer dependency. It is required to run the type-aware `typescript/*` rules in the shared config (`--type-aware`).

## Usage

Extend the shared config in your `oxlint.config.ts`:

```typescript
import { kontentOxlintConfig } from "@kontent-ai/oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [kontentOxlintConfig],
  rules: {
    // add or override rules here
  },
});
```

Run it with type information enabled:

```bash
oxlint --type-aware
```

The config registers the `kontent` plugin automatically; you do not need to add it to `jsPlugins` yourself.

### Using only the plugin

To use the `kontent` rules without the rest of the shared config, register the plugin by its package specifier:

```typescript
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["@kontent-ai/oxlint-config/plugin"],
  rules: {
    "kontent/no-named-zod-import": "error",
    "kontent/no-static-schema-import": "error",
  },
});
```

The plugin object is also exported as `kontentOxlintPlugin` from the package root.

## Rules

The `kontent` plugin provides these rules (both enabled as `error` in `kontentOxlintConfig`):

| Rule | What it enforces |
| --- | --- |
| `kontent/no-named-zod-import` | Import zod as a namespace (`import * as z from "@zod/mini"`), not as `import { z }`, which defeats tree-shaking. |
| `kontent/no-static-schema-import` | Schema modules (`*.schema.js` / `*.schemas.js`) are loaded with a dynamic `await import(...)`, not a static import or re-export, so they stay out of the main bundle. Type-only imports are allowed. |

## License

[MIT](./LICENSE.md)
