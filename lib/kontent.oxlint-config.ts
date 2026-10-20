import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import type { OxlintConfig } from "oxlint";

const pluginFileBaseName = "kontent.oxlint-plugin";

/**
 * Resolves the plugin next to this module, keeping this module's extension so it works
 * both from source (`.ts`, via Node type stripping) and from compiled output (`.js`).
 */
const resolvePluginPath = (): string => fileURLToPath(new URL(`./${pluginFileBaseName}${extname(import.meta.url)}`, import.meta.url));

// oxlint's rule typings (checked through `satisfies OxlintConfig` below) declare the option arrays as mutable,
// so readonly arrays are not assignable to them.
/* oxlint-disable kontent/readonly-type-declarations */
type BuiltInTypeSpecifier =
	| { readonly from: "lib"; readonly name: string[] }
	| { readonly from: "package"; readonly package: string; readonly name: string[] };

type PreferReadonlyParameterTypesOptions = {
	readonly treatMethodsAsReadonly: boolean;
	readonly allow: BuiltInTypeSpecifier[];
};
/* oxlint-enable kontent/readonly-type-declarations */

/**
 * Built-in global types with settable properties. They can't be made readonly,
 * so parameters of these types would always be reported.
 */
const mutableBuiltInTypeNames = ["URL", "AbortSignal", "Error", "RegExp"] as const;

/**
 * Depending on the consumer's tsconfig, globals such as `URL` are declared by Node's typings instead of TypeScript's lib.
 */
const nodeTypesPackageName = "@types/node";

/**
 * Options of `typescript/prefer-readonly-parameter-types` used by `kontentOxlintConfig`.
 *
 * `from: "lib"` matches types from TypeScript's built-in `lib.*.d.ts` files, not a project folder.
 * Methods are treated as readonly so method-only classes (`Blob`, `Date`, `Promise`, ...) are not reported.
 *
 * Overriding the rule replaces these options, so spread them to add repo-specific types.
 */
export const kontentPreferReadonlyParameterTypesOptions: PreferReadonlyParameterTypesOptions = {
	treatMethodsAsReadonly: true,
	allow: [
		{ from: "lib", name: [...mutableBuiltInTypeNames] },
		{ from: "package", package: nodeTypesPackageName, name: [...mutableBuiltInTypeNames] },
	],
};

/**
 * Shared oxlint configuration for Kontent.ai SDKs.
 *
 * Use in `oxlint.config.ts`: `export default defineConfig({ extends: [kontentOxlintConfig] })`
 */
export const kontentOxlintConfig = {
	plugins: ["typescript"],
	jsPlugins: [resolvePluginPath()],
	categories: {
		correctness: "off",
	},
	ignorePatterns: ["dist/**"],
	rules: {
		"no-duplicate-imports": "error",
		"no-promise-executor-return": "error",
		"no-unexpected-multiline": "error",
		"no-unreachable-loop": "error",
		"no-useless-backreference": "error",

		"no-loop-func": "error",
		"typescript/no-redundant-type-constituents": "error",
		"typescript/no-unnecessary-boolean-literal-compare": "error",
		"typescript/no-unnecessary-qualifier": "error",
		"typescript/prefer-includes": "error",
		"typescript/prefer-return-this-type": "error",
		"typescript/prefer-string-starts-ends-with": "error",
		"typescript/await-thenable": "error",
		"typescript/no-unsafe-argument": "error",
		"typescript/no-unsafe-assignment": "error",
		"typescript/no-unsafe-call": "error",
		"typescript/no-unsafe-member-access": "error",
		"typescript/no-unsafe-return": "error",
		"typescript/prefer-nullish-coalescing": "error",
		"typescript/restrict-plus-operands": "error",
		"typescript/restrict-template-expressions": "error",
		"typescript/unbound-method": "error",
		"typescript/no-duplicate-enum-values": "error",
		"typescript/no-unnecessary-type-assertion": "error",
		"typescript/promise-function-async": "error",
		"typescript/no-mixed-enums": "error",
		"typescript/no-unsafe-enum-comparison": "error",
		"typescript/prefer-readonly-parameter-types": ["error", kontentPreferReadonlyParameterTypesOptions],

		"kontent/no-named-zod-import": "error",
		"kontent/no-static-schema-import": "error",
		"kontent/readonly-type-declarations": "error",
	},
} as const satisfies OxlintConfig;
