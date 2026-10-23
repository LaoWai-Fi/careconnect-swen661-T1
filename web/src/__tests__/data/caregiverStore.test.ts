import {
  getActivityLog,
  appendActivityEvent,
  getTodayMedications,
  setMedicationTaken,
  getMedAdherence,
  getCheckInStatus,
  recordCheckIn,
  getNextAppointment,
  getUpcomingAlerts,
} from '../../data/caregiverStore';
import { saveAppointments } from '../../data/apptStore';
import type { Appointment } from '../../data/appointmentsData';

const isoDay = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().split('T')[0];

function appointment(id: string, date: string, time: string): Appointment {
  return { id, title: `Appointment ${id}`, date, time, location: { name: 'Clinic', type: 'clinic' }, isInMyDay: false };
}

describe('activity log', () => {
  it('starts empty and tolerates corrupt data', () => {
    expect(getActivityLog()).toEqual([]);
    localStorage.setItem('careconnect_activity_log', '{bad');
    expect(getActivityLog()).toEqual([]);
  });

  it('adds the newest event first and keeps at most 100', () => {
    for (let i = 0; i < 105; i++) {
      appendActivityEvent({ kind: 'task_completed', label: `Task ${i}`, timestamp: new Date().toISOString() });
    }
    const log = getActivityLog();
    expect(log).toHaveLength(100);
    expect(log[0].label).toBe('Task 104');
  });
});

describe('medication tracking', () => {
  it('marks a medication taken, then unmarks it, logging each action', () => {
    const [med] = getTodayMedications();
    setMedicationTaken(med.id, true);
    expect(getTodayMedications().find((m) => m.id === med.id)?.taken).toBe(true);
    setMedicationTaken(med.id, false);
    expect(getTodayMedications().find((m) => m.id === med.id)?.taken).toBe(false);

    const [latest, previous] = getActivityLog();
    expect(latest).toMatchObject({ kind: 'med_unmarked', label: `${med.name} unmarked` });
    expect(previous).toMatchObject({ kind: 'med_taken', label: `${med.name} marked as taken` });
  });

  it('ignores an unknown medication id', () => {
    setMedicationTaken('does-not-exist', true);
    expect(getActivityLog()).toEqual([]);
  });

  it("ignores taken flags recorded on a previous day", () => {
    const [med] = getTodayMedications();
    localStorage.setItem(
      'careconnect_meds_taken',
      JSON.stringify({ date: '2000-01-01', taken: { [med.id]: true } }),
    );
    const seedValue = getTodayMedications().find((m) => m.id === med.id)?.taken;
    expect(seedValue).toBe(med.taken);
  });

  it('counts adherence and clears missed medications once all are taken', () => {
    const meds = getTodayMedications();
    meds.forEach((m) => setMedicationTaken(m.id, true));
    const adherence = getMedAdherence();
    expect(adherence.totalCount).toBe(meds.length);
    expect(adherence.takenCount).toBe(meds.length);
    expect(adherence.missedMeds).toEqual([]);
  });

  it('flags a medication as missed when its time has passed and it is untaken', () => {
    jest.useFakeTimers().setSystemTime(new Date('2030-06-15T23:30:00'));
    try {
      const meds = getTodayMedications();
      meds.forEach((m) => setMedicationTaken(m.id, false));
      const adherence = getMedAdherence();
      expect(adherence.takenCount).toBe(0);
      expect(adherence.missedMeds.length).toBeGreaterThan(0);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('check-in', () => {
  it('records the check-in once and logs it', () => {
    expect(getCheckInStatus()).toEqual({ checkedIn: false, time: '' });
    recordCheckIn();
    const status = getCheckInStatus();
    expect(status.checkedIn).toBe(true);
    expect(status.time).not.toBe('');
    recordCheckIn();
    expect(getActivityLog().filter((e) => e.kind === 'check_in')).toHaveLength(1);
  });

  it('ignores a check-in from a previous day', () => {
    localStorage.setItem('careconnect_checkin', JSON.stringify({ date: '2000-01-01', time: '9:00 AM' }));
    expect(getCheckInStatus().checkedIn).toBe(false);
  });
});

describe('appointments summary', () => {
  it('returns the soonest future appointment', () => {
    saveAppointments([
      appointment('later', isoDay(5), '09:00'),
      appointment('sooner', isoDay(2), '14:30'),
      appointment('past', isoDay(-3), '10:00'),
    ]);
    expect(getNextAppointment()).toMatchObject({ title: 'Appointment sooner', time: '14:30' });
  });

  it('returns null when nothing is upcoming', () => {
    saveAppointments([appointment('past', isoDay(-3), '10:00')]);
    expect(getNextAppointment()).toBeNull();
  });

  it('alerts for appointments today and tomorrow only', () => {
    saveAppointments([
      appointment('today', isoDay(0), '23:00'),
      appointment('tomorrow', isoDay(1), '08:00'),
      appointment('next-week', isoDay(7), '08:00'),
    ]);
    expect(getUpcomingAlerts().map((a) => a.id)).toEqual(['today', 'tomorrow']);
  });
});
