export type ImportLikeNode = {
	readonly importKind?: "type" | "value";
	readonly exportKind?: "type" | "value";
	readonly specifiers?: readonly { readonly importKind?: "type" | "value" }[];
};

/**
 * The subset of TypeScript type AST nodes inspected by `readonly-type-declarations`.
 */
export type TypeLikeNode = {
	readonly type: string;
	readonly readonly?: boolean;
	readonly operator?: string;
	readonly typeName?: { readonly type: string; readonly name?: string };
	readonly parent?: TypeLikeNode;
};

type OxlintRuleContext = {
	readonly report: (descriptor: { readonly node: unknown; readonly message: string }) => void;
};

type OxlintRule<TNode = ImportLikeNode> = {
	readonly create: (context: OxlintRuleContext) => Readonly<Record<string, (node: TNode) => void>>;
};

type OxlintPlugin = {
	readonly meta: { readonly name: string };
	readonly rules: Readonly<Record<string, OxlintRule<never>>>;
};

const kontentOxlintPluginName = "kontent";
const noNamedZodImportRuleName = "no-named-zod-import";
const noStaticSchemaImportRuleName = "no-static-schema-import";
const readonlyTypeDeclarationsRuleName = "readonly-type-declarations";

const noNamedZodImportSelector = "ImportDeclaration[source.value=/^(zod(\\/mini)?|@zod\\/mini)$/] > ImportSpecifier[imported.name='z']";
const noNamedZodImportMessage =
	'Use `import * as z from "@zod/mini"` instead. The named `{ z }` import defeats esbuild\'s namespace tree-shaking and pulls ~280 kB of zod locales into consumer bundles.';

/**
 * Matches both `*.schema.js` and `*.schemas.js` module specifiers.
 */
const schemaSourceRegex = String.raw`/\.schemas?\.js$/`;
const noStaticSchemaImportMessage =
	"Schema modules (`*.schema.js` / `*.schemas.js`) must be loaded with a dynamic `await import(...)` so they're not bundled into the main entry. For top-level use, import them from the SDK's public schemas entry instead.";

const noNamedZodImportRule: OxlintRule = {
	create: (context) => ({
		[noNamedZodImportSelector]: (node) => context.report({ node, message: noNamedZodImportMessage }),
	}),
};

/**
 * Type-only imports are erased by the compiler, so they don't pull schema code into the bundle.
 * The model files legitimately `import type` from schemas to derive types via `z.infer`.
 */
const isTypeOnly = (node: ImportLikeNode): boolean =>
	node.importKind === "type" ||
	node.exportKind === "type" ||
	(node.specifiers !== undefined && node.specifiers.length > 0 && node.specifiers.every((specifier) => specifier.importKind === "type"));

/**
 * Unlike oxlint's `no-restricted-imports`, this ignores dynamic `import()` expressions,
 * which are the intended way to load schema modules.
 */
const noStaticSchemaImportRule: OxlintRule = {
	create: (context) => {
		const reportUnlessTypeOnly = (node: ImportLikeNode): void => {
			if (isTypeOnly(node)) {
				return;
			}
			context.report({ node, message: noStaticSchemaImportMessage });
		};

		return {
			[`ImportDeclaration[source.value=${schemaSourceRegex}]`]: reportUnlessTypeOnly,
			[`ExportNamedDeclaration[source.value=${schemaSourceRegex}]`]: reportUnlessTypeOnly,
			[`ExportAllDeclaration[source.value=${schemaSourceRegex}]`]: reportUnlessTypeOnly,
		};
	},
};

/**
 * Only type declarations are checked, so local accumulators such as `const acc: T[] = []` stay allowed.
 */
const typeDeclarationSelectorPrefix = ":matches(TSInterfaceDeclaration, TSTypeAliasDeclaration) ";
const readonlyOperator = "readonly";
const identifierNodeType = "Identifier";
const typeOperatorNodeType = "TSTypeOperator";

const mutableToReadonlyCollection: ReadonlyMap<string, string> = new Map([
	["Array", "ReadonlyArray"],
	["Map", "ReadonlyMap"],
	["Set", "ReadonlySet"],
]);

const missingReadonlyMemberMessage = "Mark this property as `readonly`.";
const mutableArrayMessage = "Use a readonly array or tuple type (`readonly T[]` / `readonly [A, B]`).";
const mutableCollectionMessage = (mutableName: string, readonlyName: string): string =>
	`Use \`${readonlyName}\` instead of \`${mutableName}\`.`;

const isReadonlyOperand = (node: TypeLikeNode): boolean =>
	node.parent?.type === typeOperatorNodeType && node.parent.operator === readonlyOperator;

const referencedIdentifierName = (node: TypeLikeNode): string | undefined =>
	node.typeName?.type === identifierNodeType ? node.typeName.name : undefined;

const readonlyTypeDeclarationsRule: OxlintRule<TypeLikeNode> = {
	create: (context) => ({
		[`${typeDeclarationSelectorPrefix}:matches(TSPropertySignature, TSIndexSignature)`]: (node) => {
			if (node.readonly === true) {
				return;
			}
			context.report({ node, message: missingReadonlyMemberMessage });
		},
		[`${typeDeclarationSelectorPrefix}:matches(TSArrayType, TSTupleType)`]: (node) => {
			if (isReadonlyOperand(node)) {
				return;
			}
			context.report({ node, message: mutableArrayMessage });
		},
		[`${typeDeclarationSelectorPrefix}TSTypeReference`]: (node) => {
			const mutableName = referencedIdentifierName(node);
			const readonlyName = mutableName === undefined ? undefined : mutableToReadonlyCollection.get(mutableName);
			if (mutableName === undefined || readonlyName === undefined) {
				return;
			}
			context.report({ node, message: mutableCollectionMessage(mutableName, readonlyName) });
		},
	}),
};

const kontentOxlintPlugin = {
	meta: { name: kontentOxlintPluginName },
	rules: {
		[noNamedZodImportRuleName]: noNamedZodImportRule,
		[noStaticSchemaImportRuleName]: noStaticSchemaImportRule,
		[readonlyTypeDeclarationsRuleName]: readonlyTypeDeclarationsRule,
	},
} as const satisfies OxlintPlugin;

export default kontentOxlintPlugin;
