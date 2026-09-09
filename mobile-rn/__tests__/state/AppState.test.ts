// Jest unit tests for the AppState reducer — the RN counterpart of the
// Flutter suite's app_state_test.dart. Drives the pure reducer directly, no
// React tree needed.

import {
  appReducer,
  createInitialState,
  formatClockTime,
  unreadMessageCount,
} from '../../src/state/AppState';
import type { AppStateData } from '../../src/state/AppState';
import { seededInitialState } from '../../src/state/seed';
import {
  ALERT_APPOINTMENT_TODAY,
  ALERT_MEDS_UNTAKEN,
  ALERT_NO_CHECK_IN,
} from '../../src/models/types';
import type { Medication, Appointment } from '../../src/models/types';

const fixedNow = () => new Date(2026, 8, 15, 9, 30); // Sep 15 2026, 9:30 am

function fresh(): AppStateData {
  return seededInitialState(fixedNow);
}

describe('formatClockTime', () => {
  it('formats midnight as 12:00 am', () => {
    expect(formatClockTime(new Date(2026, 0, 1, 0, 0))).toBe('12:00 am');
  });
  it('formats noon as 12:00 pm', () => {
    expect(formatClockTime(new Date(2026, 0, 1, 12, 0))).toBe('12:00 pm');
  });
  it('pads single-digit minutes', () => {
    expect(formatClockTime(new Date(2026, 0, 1, 9, 5))).toBe('9:05 am');
  });
  it('formats afternoon hours', () => {
    expect(formatClockTime(new Date(2026, 0, 1, 14, 45))).toBe('2:45 pm');
  });
});

describe('signIn', () => {
  it('records the user name', () => {
    const s = appReducer(fresh(), { type: 'signIn', name: 'Dorothy' });
    expect(s.userName).toBe('Dorothy');
  });

  it('relabels appointments assigned to the demo placeholder', () => {
    const s = appReducer(fresh(), { type: 'signIn', name: 'Dorothy' });
    const assigned = s.appointments.filter((a) => a.assignee === 'Dorothy');
    expect(assigned).toHaveLength(2); // a1 and a2 were "Maria Thompson"
  });

  it('leaves unassigned appointments alone', () => {
    const s = appReducer(fresh(), { type: 'signIn', name: 'Dorothy' });
    const eye = s.appointments.find((a) => a.id === 'a3');
    expect(eye?.assignee).toBe('');
  });

  it('relabels messages addressed to the demo placeholder', () => {
    const s = appReducer(fresh(), { type: 'signIn', name: 'Dorothy' });
    expect(s.messages.every((m) => m.to === 'Dorothy')).toBe(true);
  });
});

describe('signOut', () => {
  it('resets user-scoped state but keeps data', () => {
    let s = appReducer(fresh(), { type: 'signIn', name: 'Dorothy' });
    s = appReducer(s, { type: 'setHandMode', mode: 'left' });
    s = appReducer(s, { type: 'checkIn' });
    s = appReducer(s, { type: 'dismissAlert', id: ALERT_MEDS_UNTAKEN });

    s = appReducer(s, { type: 'signOut' });

    expect(s.userName).toBe('');
    expect(s.handMode).toBe('off');
    expect(s.checkedIn).toBe(false);
    expect(s.dismissedAlertIds).toEqual([]);
    // Data survives sign-out (matches the Flutter build).
    expect(s.medications.length).toBe(3);
  });
});

describe('checkIn', () => {
  it('sets checkedIn and logs activity', () => {
    const s = appReducer(fresh(), { type: 'checkIn' });
    expect(s.checkedIn).toBe(true);
    expect(s.activity[0].type).toBe('checkedIn');
    expect(s.activity[0].description).toBe('Margaret checked in');
    expect(s.activity[0].timestamp).toBe('9:30 am'); // from the injected clock
  });

  it('is idempotent — a second check-in changes nothing', () => {
    let s = appReducer(fresh(), { type: 'checkIn' });
    const afterFirst = s.activity.length;
    s = appReducer(s, { type: 'checkIn' });
    expect(s.activity.length).toBe(afterFirst);
  });

  it('clears a previously dismissed no-check-in alert', () => {
    let s = appReducer(fresh(), { type: 'dismissAlert', id: ALERT_NO_CHECK_IN });
    expect(s.dismissedAlertIds).toContain(ALERT_NO_CHECK_IN);
    s = appReducer(s, { type: 'checkIn' });
    expect(s.dismissedAlertIds).not.toContain(ALERT_NO_CHECK_IN);
  });
});

describe('medications', () => {
  const newMed: Medication = {
    id: 'm9',
    name: 'Aspirin',
    dose: '81 mg — 1 tablet',
    time: '8:00 am',
    notes: '',
    taken: false,
  };

  it('addMedication appends and logs activity', () => {
    const s = appReducer(fresh(), { type: 'addMedication', med: newMed });
    expect(s.medications).toHaveLength(4);
    expect(s.medications[3].name).toBe('Aspirin');
    expect(s.activity[0].description).toBe("Added Aspirin to Margaret's medications");
  });

  it('addMedication re-surfaces a dismissed meds-untaken alert', () => {
    let s = appReducer(fresh(), { type: 'dismissAlert', id: ALERT_MEDS_UNTAKEN });
    s = appReducer(s, { type: 'addMedication', med: newMed });
    expect(s.dismissedAlertIds).not.toContain(ALERT_MEDS_UNTAKEN);
  });

  it('updateMedication replaces in place by id', () => {
    const updated = { ...newMed, id: 'm1', name: 'Amlodipine XL' };
    const s = appReducer(fresh(), { type: 'updateMedication', id: 'm1', updated });
    expect(s.medications.find((m) => m.id === 'm1')?.name).toBe('Amlodipine XL');
    expect(s.medications).toHaveLength(3);
  });

  it('deleteMedication removes by id', () => {
    const s = appReducer(fresh(), { type: 'deleteMedication', id: 'm2' });
    expect(s.medications.map((m) => m.id)).toEqual(['m1', 'm3']);
  });

  it('toggleMedTaken flips taken and logs medicationTaken', () => {
    const s = appReducer(fresh(), { type: 'toggleMedTaken', id: 'm1' });
    expect(s.medications.find((m) => m.id === 'm1')?.taken).toBe(true);
    expect(s.activity[0].type).toBe('medicationTaken');
    expect(s.activity[0].description).toBe('Amlodipine marked as taken');
  });

  it('toggleMedTaken back off logs medicationUnmarked', () => {
    const s = appReducer(fresh(), { type: 'toggleMedTaken', id: 'm2' }); // m2 starts taken
    expect(s.medications.find((m) => m.id === 'm2')?.taken).toBe(false);
    expect(s.activity[0].type).toBe('medicationUnmarked');
    expect(s.activity[0].description).toBe('Metformin unmarked');
  });

  it('toggleMedTaken on an unknown id is a no-op', () => {
    const before = fresh();
    const s = appReducer(before, { type: 'toggleMedTaken', id: 'nope' });
    expect(s).toBe(before);
  });
});

describe('appointments', () => {
  const newAppt: Appointment = {
    id: 'a9',
    title: 'Physio session',
    dateTime: 'Tomorrow — 9:00 am',
    location: 'Westfield Clinic',
    assignee: '',
    notes: '',
  };

  it('addAppointment inserts at the front', () => {
    const s = appReducer(fresh(), { type: 'addAppointment', appt: newAppt });
    expect(s.appointments[0].title).toBe('Physio session');
    expect(s.appointments).toHaveLength(4);
  });

  it('addAppointment re-surfaces a dismissed appointment-today alert', () => {
    let s = appReducer(fresh(), { type: 'dismissAlert', id: ALERT_APPOINTMENT_TODAY });
    s = appReducer(s, { type: 'addAppointment', appt: newAppt });
    expect(s.dismissedAlertIds).not.toContain(ALERT_APPOINTMENT_TODAY);
  });

  it('updateAppointment replaces by id', () => {
    const updated = { ...newAppt, id: 'a2', title: 'Rescheduled review' };
    const s = appReducer(fresh(), { type: 'updateAppointment', id: 'a2', updated });
    expect(s.appointments.find((a) => a.id === 'a2')?.title).toBe('Rescheduled review');
  });

  it('deleteAppointment removes by id', () => {
    const s = appReducer(fresh(), { type: 'deleteAppointment', id: 'a1' });
    expect(s.appointments.map((a) => a.id)).toEqual(['a2', 'a3']);
  });
});

describe('messages', () => {
  it('sendMessage prepends a read message with a clock timestamp', () => {
    const s = appReducer(
      fresh(),
      { type: 'sendMessage', from: 'Maria', to: 'Dr. Sharma', subject: 'Thanks', body: 'Got it.' },
    );
    expect(s.messages[0].subject).toBe('Thanks');
    expect(s.messages[0].read).toBe(true);
    expect(s.messages[0].timestamp).toBe('9:30 am');
  });

  it('markMessageRead flips unread to read only', () => {
    let s = fresh();
    expect(s.messages.find((m) => m.id === 'msg1')?.read).toBe(false);
    s = appReducer(s, { type: 'markMessageRead', id: 'msg1' });
    expect(s.messages.find((m) => m.id === 'msg1')?.read).toBe(true);
    // Already-read stays read.
    s = appReducer(s, { type: 'markMessageRead', id: 'msg1' });
    expect(s.messages.find((m) => m.id === 'msg1')?.read).toBe(true);
  });

  it('toggleMessageRead flips both directions', () => {
    let s = appReducer(fresh(), { type: 'toggleMessageRead', id: 'msg3' }); // starts read
    expect(s.messages.find((m) => m.id === 'msg3')?.read).toBe(false);
    s = appReducer(s, { type: 'toggleMessageRead', id: 'msg3' });
    expect(s.messages.find((m) => m.id === 'msg3')?.read).toBe(true);
  });

  it('archiveMessage hides from the inbox; unarchiveMessage restores', () => {
    let s = appReducer(fresh(), { type: 'archiveMessage', id: 'msg1' });
    expect(s.messages.find((m) => m.id === 'msg1')?.archived).toBe(true);
    s = appReducer(s, { type: 'unarchiveMessage', id: 'msg1' });
    expect(s.messages.find((m) => m.id === 'msg1')?.archived).toBe(false);
  });

  it('deleteMessage removes by id', () => {
    const s = appReducer(fresh(), { type: 'deleteMessage', id: 'msg2' });
    expect(s.messages.map((m) => m.id)).toEqual(['msg1', 'msg3']);
  });

  it('unreadMessageCount counts unread non-archived only', () => {
    let s = fresh(); // msg1 + msg2 unread, msg3 read
    expect(unreadMessageCount(s.messages)).toBe(2);
    s = appReducer(s, { type: 'archiveMessage', id: 'msg1' });
    expect(unreadMessageCount(s.messages)).toBe(1);
    s = appReducer(s, { type: 'markMessageRead', id: 'msg2' });
    expect(unreadMessageCount(s.messages)).toBe(0);
  });
});

describe('dashboard widgets', () => {
  it('toggleWidget flips enabled for the matching id only', () => {
    const s = appReducer(fresh(), { type: 'toggleWidget', id: 'alerts' });
    expect(s.dashboardWidgets.find((w) => w.id === 'alerts')?.enabled).toBe(false);
    expect(s.dashboardWidgets.find((w) => w.id === 'status')?.enabled).toBe(true);
  });

  it('reorderWidgets rewrites order fields to match the new sequence', () => {
    const s = fresh();
    const reordered = [...s.dashboardWidgets].reverse();
    const next = appReducer(s, { type: 'reorderWidgets', ordered: reordered });
    expect(next.dashboardWidgets.map((w) => w.order)).toEqual([0, 1, 2, 3, 4]);
    expect(next.dashboardWidgets[0].id).toBe('messages');
  });
});

describe('settings', () => {
  it('setHandMode / setTheme / setFontScale update their fields', () => {
    let s = appReducer(fresh(), { type: 'setHandMode', mode: 'left' });
    expect(s.handMode).toBe('left');
    s = appReducer(s, { type: 'setTheme', theme: 'dark' });
    expect(s.theme).toBe('dark');
    s = appReducer(s, { type: 'setFontScale', scale: 'xlarge' });
    expect(s.fontSize).toBe('xlarge');
  });
});

describe('createInitialState', () => {
  it('starts signed out with empty collections', () => {
    const s = createInitialState(fixedNow);
    expect(s.userName).toBe('');
    expect(s.medications).toEqual([]);
    expect(s.messages).toEqual([]);
    expect(s.theme).toBe('system');
    expect(s.handMode).toBe('off');
  });
});
