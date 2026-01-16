import path from "node:path";
import { fileURLToPath } from "node:url";
import { fixupPluginRules } from "@eslint/compat";
import js from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  reactHooksPlugin.configs.flat.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      sourceType: "module",
    },
    linterOptions: {
      reportUnusedInlineConfigs: "error",
    },
    plugins: {
      perfectionist,
      "react": fixupPluginRules(reactPlugin),
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],
      "perfectionist/sort-classes": [
        "warn",
        {
          ignoreCase: true,
          order: "asc",
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-imports": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          ignoreCase: true,
          newlinesBetween: 0,
          order: "asc",
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-jsx-props": [
        "warn",
        {
          customGroups: [
            { groupName: "shorthand", modifiers: ["shorthand"] },
            { elementNamePattern: "^on.+", groupName: "callback" },
          ],
          groups: ["shorthand", "unknown", "callback"],
          ignoreCase: true,
          order: "asc",
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-objects": [
        "warn",
        {
          ignoreCase: true,
          order: "asc",
          type: "alphabetical",
        },
      ],
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: ["metadata", "generateMetadata", "generateStaticParams", "viewport"],
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Three.js/R3F components use custom JSX properties (args, fragmentShader, etc.)
  {
    files: ["src/app/_3d/**/*.tsx"],
    rules: {
      "react/no-unknown-property": "off",
    },
  },
);
