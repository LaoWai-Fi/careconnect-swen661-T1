/** Jest configuration for unit and component tests (React Testing Library). */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest/env.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript',
        ],
        // Vite exposes import.meta.env; Jest does not, so map it to a test stub.
        plugins: [require('path').join(__dirname, 'jest', 'viteMetaEnv.cjs')],
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css|svg|png|jpg|jpeg|webp)$': '<rootDir>/jest/fileMock.cjs',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx', // browser entry point: mounts the app and registers the service worker
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  // "lcov" also writes the HTML report to coverage/lcov-report/index.html
  coverageThreshold: { global: { statements: 75, branches: 70, functions: 75, lines: 75 } },
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
};
