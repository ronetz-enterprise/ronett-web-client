import js from "@eslint/js";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y";
import imports from "eslint-plugin-import-x";
export default ts.config(
  {
    ignores: [
      "build/**",
      ".react-router/**",
      "public/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      ".agents/**",
      "frontend-contract/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks, "jsx-a11y": a11y, "import-x": imports },
    settings: { "import-x/resolver": { typescript: true } },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      ...a11y.configs.recommended.rules,
      "import-x/no-cycle": "error",
      "no-restricted-imports": ["error", { patterns: ["@/features/*/*"] }],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/app/**",
            "@/pages/**",
            "@/features/**",
            "**/pages/**",
            "**/features/**",
            "**/app/layouts/**",
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/app/**", "@/pages/**", "**/pages/**", "@/features/*/*"],
        },
      ],
    },
  },
);
