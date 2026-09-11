// ESLint flat config (ESLint v9) — Expo's shared preset covering react,
// react-native, import ordering, and TypeScript rules. Run with `npm run lint`.

const expoConfigs = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfigs,
  {
    ignores: ['coverage/**', 'node_modules/**'],
  },
];
