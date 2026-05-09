import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/app/generated/**",
    "node_modules.bak.*/**",
  ]),
  {
    files: [
      "app/**/*.ts",
      "app/**/*.tsx",
      "src/**/*.ts",
      "src/**/*.tsx",
      "lib/**/*.ts",
      "middleware.ts",
    ],
    ignores: ["src/app/generated/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='$executeRawUnsafe']",
          message:
            "Use $executeRaw with Prisma.sql — raw unsafe SQL is rejected by security policy.",
        },
        {
          selector: "CallExpression[callee.property.name='$queryRawUnsafe']",
          message:
            "Use $queryRaw with Prisma.sql — raw unsafe SQL is rejected by security policy.",
        },
      ],
    },
  },
]);

export default eslintConfig;
