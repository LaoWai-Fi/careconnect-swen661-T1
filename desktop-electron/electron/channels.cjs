'use strict'

// IPC channel names shared by the main process modules.
//
// preload.cjs runs in a sandbox and cannot require() local files, so it keeps
// its own copy of these strings. test/main/preload.test.cjs asserts the two
// lists stay identical.

const CHANNELS = Object.freeze({
  // main -> renderer
  MENU_COMMAND: 'menu:command',
  // renderer -> main (fire and forget)
  SESSION_UPDATE: 'session:update',
  // renderer -> main (request / response via ipcRenderer.invoke)
  CARE_LOAD: 'care:load',
  CARE_SAVE: 'care:save',
  CARE_EXPORT: 'care:export',
  CARE_IMPORT: 'care:import',
  CARE_CLEAR: 'care:clear',
  NOTIFY: 'app:notify',
  APP_INFO: 'app:info',
})

// Every action string the main process may send on MENU_COMMAND. The renderer
// ignores anything else.
const MENU_ACTIONS = Object.freeze([
  'dashboard',
  'medications',
  'appointments',
  'activity',
  'messages',
  'compose',
  'save',
  'export',
  'import',
  'print',
  'settings',
  'signout',
  'search',
  'zoomIn',
  'zoomOut',
  'zoomReset',
  'toggleHandMode',
  'highContrast',
  'shortcuts',
  'help',
  'checkin',
  'emergency',
])

module.exports = { CHANNELS, MENU_ACTIONS }
