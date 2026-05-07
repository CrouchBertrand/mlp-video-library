import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  { ignores: ["dist/**", ".next/**", "node_modules/**"] },
  ...nextVitals
];

export default eslintConfig;
