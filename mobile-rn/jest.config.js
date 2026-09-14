module.exports = {
  preset: 'jest-expo',
  // Coverage instrumentation slows renders enough that 5s default timeouts
  // flake on slower machines — give the async RNTL tests headroom.
  testTimeout: 15000,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-safe-area-context|react-native-screens))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/state/seed.ts',
  ],
  coverageReporters: ['text-summary', 'text', 'lcov'],
};
