import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import stylePropertiesPerLine from "./eslint-rules/style-properties-per-line.mjs";

export default tseslint.config(
  {
    ignores: [
      "**/._*",
      "**/.expo/**",
      "**/.vite/**",
      "**/coverage/**",
      "**/dist/**",
      "**/libs/**",
      "**/node_modules/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.jest,
        __DEV__: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.{cjs,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.es2024,
        ...globals.jest,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },
  {
    files: ["apps/web/src/**/*.{jsx,tsx}", "apps/mobile/src/**/*.{jsx,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      grip: { rules: { "style-properties-per-line": stylePropertiesPerLine } },
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "grip/style-properties-per-line": "error",
    },
  },
  {
    files: ["apps/web/src/**/*.{jsx,tsx}"],
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    files: ["*.config.{js,cjs,mjs,ts}", "scripts/**/*.{js,cjs,mjs,ts}", "packages/core/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
        ...globals.jest,
      },
    },
  },
);
