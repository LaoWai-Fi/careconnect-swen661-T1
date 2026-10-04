import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  {
    ignores: ['dist', 'release', 'coverage', 'node_modules', 'test-results', 'playwright-report', 'build'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['electron/**/*.cjs', 'test/main/**/*.cjs', 'test/renderer/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest },
    },
  },
  {
    files: ['test/renderer/**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.jest, ...globals.browser } },
  },
  {
    files: ['test/e2e/**/*.ts', 'playwright.config.ts', 'vite.config.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['jest.config.cjs', 'babel.config.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
)
