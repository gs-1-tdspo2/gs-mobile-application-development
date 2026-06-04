// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // The react-hooks/set-state-in-effect rule fires false positives when
    // calling async data-fetching functions from useEffect via `void fn()`.
    // The async fn calls setState only after awaiting, which is safe.
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
