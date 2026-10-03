import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Las respuestas del backend se tipan en el borde (lib/api); las pantallas las leen como datos.
      "@typescript-eslint/no-explicit-any": "off",
      // useDatos carga al montar: el setState ocurre después de un await, no en cascada.
      "react-hooks/set-state-in-effect": "warn",
      // Las fotos de productos vienen del backend (uploads) y se muestran como miniaturas.
      "@next/next/no-img-element": "off",
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
