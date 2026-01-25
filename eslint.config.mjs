import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: ["playwright-report/**", "test-results/**", ".next/**", "node_modules/**"],
  },
  ...nextConfig,
  {
    rules: {
      // General code quality rules
      "no-console": "warn",
      
      // React specific rules
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
    },
  },
];

export default config;
