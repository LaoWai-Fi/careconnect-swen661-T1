// Seed data — ported from mobile-flutter/lib/main.dart's _seededAppState so
// the React Native build starts from the same demo content as the Flutter
// build (same medications, appointments, messages, dashboard widgets).

import type { AppStateData } from './AppState';
import { createInitialState } from './AppState';

export function seededInitialState(now: () => Date = () => new Date()): AppStateData {
  const state = createInitialState(now);
  return {
    ...state,
    dashboardWidgets: [
      { id: 'status', label: "Margaret's status", enabled: true, order: 0 },
      { id: 'alerts', label: 'Alerts', enabled: true, order: 1 },
      { id: 'medications', label: "Today's medications", enabled: true, order: 2 },
      { id: 'appointments', label: 'Next appointment', enabled: true, order: 3 },
      { id: 'messages', label: 'Unread messages', enabled: true, order: 4 },
    ],
    medications: [
      {
        id: 'm1',
        name: 'Amlodipine',
        dose: '5 mg — 1 tablet',
        time: '8:30 am',
        notes: 'Take with or without food.',
        taken: false,
      },
      {
        id: 'm2',
        name: 'Metformin',
        dose: '500 mg — 1 tablet',
        time: '8:30 am',
        notes: 'Take with breakfast.',
        taken: true,
      },
      {
        id: 'm3',
        name: 'Vitamin D3',
        dose: '1000 IU — 1 capsule',
        time: '8:30 am',
        notes: 'Take with breakfast.',
        taken: false,
      },
    ],
    appointments: [
      {
        id: 'a1',
        title: 'Blood pressure check — Dr. Sharma',
        dateTime: 'Today — 10:30 am',
        location: 'Greenfield Surgery — 12 Greenfield Road, Westfield',
        assignee: 'Maria Thompson',
        notes: 'Your blood pressure check. Dr. Sharma will review all your medicines.',
      },
      {
        id: 'a2',
        title: 'Annual health review — Dr. Sharma',
        dateTime: 'Monday 22 June — 2:00 pm',
        location: 'Greenfield Surgery — 12 Greenfield Road, Westfield',
        assignee: 'Maria Thompson',
        notes: 'Your yearly health check. Dr. Sharma will review all your medicines. Maria will drive you.',
      },
      {
        id: 'a3',
        title: 'Eye test',
        dateTime: 'Friday 18 July — 11:00 am',
        location: 'Vision Plus Opticians — 22 High Street, Westfield',
        assignee: '',
        notes: 'Routine yearly eye test. Your glasses prescription may be updated. No special preparation needed.',
      },
    ],
    messages: [
      {
        id: 'msg1',
        from: 'Dr. Sharma',
        to: 'Maria Thompson',
        subject: "Margaret's blood pressure results",
        body: "Hi Maria,\n\nI reviewed Margaret's blood pressure readings from this week. The numbers are slightly elevated but not concerning at this stage. Please ensure she takes her Amlodipine consistently at 8:30 am.\n\nI'll check again at her appointment on Thursday.\n\nBest regards,\nDr. Sharma",
        timestamp: '9:15 am',
        read: false,
        archived: false,
      },
      {
        id: 'msg2',
        from: 'Emma Thompson',
        to: 'Maria Thompson',
        subject: 'Cover this afternoon?',
        body: "Hi,\n\nCould you cover Margaret's afternoon visit today? I have a clash with another appointment. She needs her 2 pm medications checked.\n\nThanks,\nEmma",
        timestamp: 'Yesterday',
        read: false,
        archived: false,
      },
      {
        id: 'msg3',
        from: 'Vision Plus Opticians',
        to: 'Maria Thompson',
        subject: 'Appointment reminder',
        body: 'This is a reminder that Margaret Thompson has an eye test booked for Friday 18 July at 11:00 am at Vision Plus Opticians, 22 High Street, Westfield. Please call us if you need to reschedule.',
        timestamp: 'Mon',
        read: true,
        archived: false,
      },
    ],
  };
}
