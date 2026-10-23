// Runs before each test file: the values Vite would provide through import.meta.env.
globalThis.__VITE_ENV__ = {
  BASE_URL: '/',
  MODE: 'test',
  DEV: false,
  PROD: false,
  SSR: false,
};

// jsdom does not expose TextEncoder/TextDecoder, which react-router needs.
const { TextEncoder, TextDecoder } = require('util');
globalThis.TextEncoder = globalThis.TextEncoder || TextEncoder;
globalThis.TextDecoder = globalThis.TextDecoder || TextDecoder;
