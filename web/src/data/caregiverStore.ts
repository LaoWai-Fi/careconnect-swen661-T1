/**
 * Caregiver-side read utilities for care-plan data stored in localStorage.
 *
 * The caregiver records medications taken and check-ins from the dashboard.
 *
 * Keys:
 *   careconnect_meds_taken    — { date: string; taken: Record<medId, boolean> }
 *   careconnect_checkin       — { date: string; time: string }
 *   careconnect_activity_log  — ActivityEvent[]
 */

import { getMedications } from './medsStore';
import { getAppointments } from './apptStore';

const TODAY = new Date().toISOString().split('T')[0];

// ── Activity log ───────────────────────────────────────────────────────────────

export type ActivityEventKind =
  | 'med_taken'
  | 'med_unmarked'
  | 'task_completed'
  | 'check_in';

export interface ActivityEvent {
  id: string;
  kind: ActivityEventKind;
  label: string;
  timestamp: string; // ISO
}

const LS_ACTIVITY_KEY = 'careconnect_activity_log';

export function getActivityLog(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(LS_ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendActivityEvent(event: Omit<ActivityEvent, 'id'>): void {
  const log = getActivityLog();
  const newEvent: ActivityEvent = { ...event, id: `evt-${Date.now()}-${Math.random()}` };
  localStorage.setItem(LS_ACTIVITY_KEY, JSON.stringify([newEvent, ...log].slice(0, 100)));
}

// ── Medication adherence ────────────────────────────────────────────────────────

export interface MedAdherence {
  takenCount: number;
  totalCount: number;
  missedMeds: { id: string; name: string; dosage: string; scheduledTime: string }[];
}

const LS_MEDS_TAKEN_KEY = 'careconnect_meds_taken';

/** Taken flags the caregiver has recorded today, keyed by medication id. */
function readTakenToday(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_MEDS_TAKEN_KEY);
    const stored: { date: string; taken: Record<string, boolean> } | null = raw ? JSON.parse(raw) : null;
    return stored?.date === TODAY ? stored.taken : {};
  } catch {
    return {};
  }
}

export interface TodayMedication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  instructions?: string;
  taken: boolean;
}

/** Every medication with today's taken state. */
export function getTodayMedications(): TodayMedication[] {
  const storedTaken = readTakenToday();
  return getMedications().map((med) => ({
    id: med.id,
    name: med.name,
    dosage: med.dosage,
    times: med.times,
    instructions: med.instructions,
    // Recorded value wins; otherwise fall back to the seed value.
    taken: storedTaken[med.id] ?? (med.taken[TODAY] ?? false),
  }));
}

/** Marks a medication taken (or unmarks it) for today and logs the activity. */
export function setMedicationTaken(medId: string, taken: boolean): void {
  const med = getMedications().find((m) => m.id === medId);
  if (!med) return;
  localStorage.setItem(
    LS_MEDS_TAKEN_KEY,
    JSON.stringify({ date: TODAY, taken: { ...readTakenToday(), [medId]: taken } }),
  );
  appendActivityEvent({
    kind: taken ? 'med_taken' : 'med_unmarked',
    label: `${med.name} ${taken ? 'marked as taken' : 'unmarked'}`,
    timestamp: new Date().toISOString(),
  });
}

export function getMedAdherence(): MedAdherence {
  const medications = getTodayMedications();
  const totalCount = medications.length;
  let takenCount = 0;
  const missedMeds: MedAdherence['missedMeds'] = [];

  for (const med of medications) {
    if (med.taken) {
      takenCount++;
    } else {
      // Only flag as missed if the scheduled time has passed
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      for (const t of med.times) {
        const [h, m] = t.split(':').map(Number);
        const schedMin = h * 60 + m;
        if (schedMin <= nowMin) {
          missedMeds.push({
            id: med.id,
            name: med.name,
            dosage: med.dosage,
            scheduledTime: t,
          });
          break;
        }
      }
    }
  }

  return { takenCount, totalCount, missedMeds };
}

// ── Check-in ───────────────────────────────────────────────────────────────────

export interface CheckInStatus {
  checkedIn: boolean;
  time: string;
}

export function getCheckInStatus(): CheckInStatus {
  try {
    const raw = localStorage.getItem('careconnect_checkin');
    const stored: { date: string; time: string } = raw ? JSON.parse(raw) : null;
    if (stored?.date === TODAY) return { checkedIn: true, time: stored.time };
  } catch { /* empty */ }
  return { checkedIn: false, time: '' };
}

/** Records today's check-in (once) and logs the activity. */
export function recordCheckIn(): void {
  if (getCheckInStatus().checkedIn) return;
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  localStorage.setItem('careconnect_checkin', JSON.stringify({ date: TODAY, time }));
  appendActivityEvent({ kind: 'check_in', label: 'Margaret checked in', timestamp: now.toISOString() });
}

// ── Next appointment ────────────────────────────────────────────────────────────

export interface NextAppointment {
  title: string;
  date: string;
  time: string;
  locationName: string;
}

export function getNextAppointment(): NextAppointment | null {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const future = getAppointments()
    .filter((a) => {
      if (a.date > todayStr) return true;
      if (a.date === todayStr) {
        const [h, m] = a.time.split(':').map(Number);
        return h * 60 + m > nowMin;
      }
      return false;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.time < b.time ? -1 : 1;
    });

  if (!future.length) return null;
  const appt = future[0];
  return {
    title: appt.title,
    date: appt.date,
    time: appt.time,
    locationName: appt.location.name,
  };
}

// ── Upcoming appointment alerts (within 24 h) ─────────────────────────────────

export interface UpcomingAlert {
  id: string;
  title: string;
  date: string;
  time: string;
}

export function getUpcomingAlerts(): UpcomingAlert[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = new Date(now.getTime() + 86_400_000).toISOString().split('T')[0];

  return getAppointments()
    .filter((a) => a.date === todayStr || a.date === tomorrowStr)
    .map((a) => ({ id: a.id, title: a.title, date: a.date, time: a.time }))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.time < b.time ? -1 : 1;
    });
}
