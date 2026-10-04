// Jest runs two projects:
//   main      - Electron main-process modules and the preload bridge (Node env)
//   renderer  - React components and state logic (jsdom + React Testing Library)
// Coverage is collected across both and written to coverage/ (HTML report in
// coverage/lcov-report/index.html).

const shared = { clearMocks: true, restoreMocks: true }

module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'main',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/main/**/*.test.cjs'],
      transform: {},
    },
    {
      ...shared,
      displayName: 'renderer',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/test/renderer/**/*.test.{ts,tsx}'],
      transform: { '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.cjs' }] },
      moduleNameMapper: { '\\.(css)$': '<rootDir>/test/renderer/styleStub.cjs' },
      setupFilesAfterEnv: ['<rootDir>/test/renderer/setup.ts'],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/types.ts',
    '!src/**/*.d.ts',
    'electron/**/*.cjs',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  coverageThreshold: { global: { lines: 60, statements: 60, functions: 60, branches: 50 } },
}
