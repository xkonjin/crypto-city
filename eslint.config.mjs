import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: ["playwright-report/**", "test-results/**"],
  },
  ...nextConfig,
];

export default config;
