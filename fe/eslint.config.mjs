import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noDeprecatedSymbolRule from "../eslint-rules/no-deprecated-symbol.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      topcv: {
        rules: {
          "no-deprecated-symbol": noDeprecatedSymbolRule,
        },
      },
    },
    rules: {
      "topcv/no-deprecated-symbol": "error",
    },
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@topcv/shared/*/*"],
              message:
                "Do not deep-import from @topcv/shared. Import only from @topcv/shared or its public subpath exports (e.g. @topcv/shared/forms).",
            },
            {
              group: ["../shared/**", "../../shared/**", "../../../shared/**"],
              message:
                "Do not import shared source via relative paths. Use @topcv/shared (package exports) instead.",
            },
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
          patterns: [
            {
              group: ["@/src/features/*/*", "@/src/features/*/*/**"],
              message:
                "Features must not deep-import other feature files. Import only from feature public entrypoints (e.g. `@/src/features/forms`) or from `@/src/shared/**`.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/src/features/*/*"],
              message:
                "Routes must import features via their public entrypoints (e.g. `@/src/features/forms`), not deep feature files.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
