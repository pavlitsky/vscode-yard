// @ts-check
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["out/", ".vscode-test/", "src/test/project/"] },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  // This config file isn't a part of the TypeScript project
  { files: ["**/*.mjs"], extends: [tseslint.configs.disableTypeChecked] },
);
