// Data model types — ported 1:1 from mobile-flutter/lib/models/app_state.dart
// so the React Native build behaves identically to the Flutter build and the
// two can be compared feature-for-feature.

/** One-Handed Mode: off / left / right. The team's assigned accessibility
 * constraint is `left` — it anchors navigation and key actions to the left
 * edge for left-thumb reach. */
export type HandMode = 'off' | 'left' | 'right';

export type FontScale = 'normal' | 'large' | 'xlarge';

export type ThemeModeSetting = 'light' | 'system' | 'dark';

export interface Medication {
  id: string;
  name: string;
  dose: string;
  time: string;
  notes: string;
  taken: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  dateTime: string;
  location: string;
  assignee: string;
  notes: string;
}

export type ActivityType =
  | 'medicationTaken'
  | 'medicationUnmarked'
  | 'taskCompleted'
  | 'checkedIn';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
}

export interface DashboardWidget {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

/** A message in the caregiver's inbox — cc/bcc/attachments were dropped in the
 * Flutter port; everything that drives read/unread + navigation is kept. */
export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
}

/** Stable ids for the Dashboard's Alert cards — shared constants so a
 * dismissal recorded under one of these ids can be found and cleared again
 * when the underlying condition changes (see AppState.dismissAlert). */
export const ALERT_APPOINTMENT_TODAY = 'appointment-today';
export const ALERT_MEDS_UNTAKEN = 'meds-untaken';
export const ALERT_NO_CHECK_IN = 'no-checkin';
