// Typed param lists for the two navigators. Keeping them in one place lets
// screens/navigators share a single source of truth for route names + params.

import type { AppTab } from '../components/AppShell';

export type RootStackParamList = {
  landing: undefined;
  signin: undefined;
  signup: undefined;
  /** `screen` lets the root navigator focus a nested tab:
   *  navigation.navigate('main', { screen: 'medications' }). */
  main: { screen?: keyof MainTabsParamList } | undefined;
  medicationDetail: { id: string };
  appointmentDetail: { id: string };
  messageDetail: { id: string };
  archivedMessages: undefined;
};

export type MainTabsParamList = {
  dashboard: undefined;
  medications: undefined;
  appointments: undefined;
  activity: undefined;
  messages: undefined;
};

/** Route-name ↔ AppTab mapping (the tab navigator uses the same names). */
export const TAB_ROUTES: Record<AppTab, keyof MainTabsParamList> = {
  dashboard: 'dashboard',
  medications: 'medications',
  appointments: 'appointments',
  activity: 'activity',
  messages: 'messages',
};
