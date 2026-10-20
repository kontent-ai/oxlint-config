import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import kontentOxlintPlugin from "../../lib/kontent.oxlint-plugin.js";

const ruleName = "readonly-type-declarations" satisfies keyof typeof kontentOxlintPlugin.rules;
/**
 * oxlint exports no public `Rule` type, so the plugin declares minimal structural rule types
 * that are narrower than what `RuleTester` expects; the runtime contract is the same.
 */
const rule = kontentOxlintPlugin.rules[ruleName] as Parameters<RuleTester["run"]>[1];

const missingReadonlyMemberMessage = "Mark this property as `readonly`.";
const mutableArrayMessage = "Use a readonly array or tuple type (`readonly T[]` / `readonly [A, B]`).";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

ruleTester.run(ruleName, rule, {
	valid: [
		"interface A { readonly a: string; readonly [key: string]: string; }",
		"type A = { readonly a: { readonly b: number } };",
		"type A = { readonly items: readonly string[]; readonly pair: readonly [string, number] };",
		"type A = ReadonlyArray<string> | ReadonlyMap<string, number> | ReadonlySet<string>;",
		"interface A { method(): void; }",
		"const acc: string[] = [];",
		"const lookup: Map<string, number> = new Map();",
		"function f(items: string[]): void {}",
	],
	invalid: [
		{ code: "interface A { a: string; }", errors: [{ message: missingReadonlyMemberMessage }] },
		{ code: "type A = { [key: string]: string };", errors: [{ message: missingReadonlyMemberMessage }] },
		{ code: "type A = { readonly a: { b: number } };", errors: [{ message: missingReadonlyMemberMessage }] },
		{ code: "type A = string[];", errors: [{ message: mutableArrayMessage }] },
		{ code: "type A = [string, number];", errors: [{ message: mutableArrayMessage }] },
		{ code: "interface A { readonly items: string[] | undefined; }", errors: [{ message: mutableArrayMessage }] },
		{ code: "type A = readonly string[][];", errors: [{ message: mutableArrayMessage }] },
		{ code: "type A = Array<string>;", errors: [{ message: "Use `ReadonlyArray` instead of `Array`." }] },
		{ code: "interface A { readonly m: Map<string, number>; }", errors: [{ message: "Use `ReadonlyMap` instead of `Map`." }] },
		{ code: "type A = Set<string>;", errors: [{ message: "Use `ReadonlySet` instead of `Set`." }] },
	],
});
