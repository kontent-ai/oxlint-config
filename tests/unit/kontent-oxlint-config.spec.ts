import { existsSync } from "node:fs";
import { basename } from "node:path";
import { describe, expect, it } from "vitest";
import { kontentOxlintConfig, kontentOxlintPlugin } from "../../lib/public_api.js";

const kontentRuleNames = Object.keys(kontentOxlintPlugin.rules).map((ruleName) => `${kontentOxlintPlugin.meta.name}/${ruleName}`);

describe("kontentOxlintConfig", () => {
	it("Should register the kontent plugin from an existing file next to the config module", () => {
		const [pluginPath] = kontentOxlintConfig.jsPlugins;

		expect(existsSync(pluginPath)).toBe(true);
		expect(basename(pluginPath)).toMatch(/^kontent\.oxlint-plugin\.(ts|js)$/);
	});

	it("Should enable every kontent plugin rule as an error", () => {
		const rules: Readonly<Record<string, unknown>> = kontentOxlintConfig.rules;

		expect(kontentRuleNames.map((ruleName) => rules[ruleName])).toStrictEqual(kontentRuleNames.map(() => "error"));
	});
});
