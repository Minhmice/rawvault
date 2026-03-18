import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      // Next.js build output
      ".next/**",
      "**/.next/**",

      // Other generated / vendor output
      "node_modules/**",
      "**/node_modules/**",
      "coverage/**",
      "**/coverage/**",
      "dist/**",
      "**/dist/**",
      "build/**",
      "**/build/**",

      // Local tooling / scratch
      ".claude/**",

      // Non-product docs/examples/tooling
      "skills/**",
      "**/skills/**",
      "scripts/**",
      "**/scripts/**",
      ".sisyphus/**",
      "**/.sisyphus/**",
      ".cursor/**",
      "**/.cursor/**",
    ],
  },
  {
    rules: {
      // These rules are noisy/false-positive for our current patterns.
      // Prefer keeping code clean without forcing non-idiomatic rewrites.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
