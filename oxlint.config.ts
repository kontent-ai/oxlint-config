import { defineConfig } from "oxlint";
import { kontentOxlintConfig } from "./lib/kontent.oxlint-config.ts";

export default defineConfig({ extends: [kontentOxlintConfig] });
