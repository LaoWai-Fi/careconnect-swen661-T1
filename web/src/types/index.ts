// ── Shared domain types ───────────────────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high';
export type StatusBadge = 'success' | 'warning' | 'alert' | 'calm' | 'neutral';

// ── Medications ──────────────────────────────────────────────────────────

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];     // ["08:00", "20:00"]
  instructions?: string;
  colour: string;      // Tailwind bg class for pill visualisation
  taken: Record<string, boolean>; // date "YYYY-MM-DD" → taken?
}

// ── Contacts ─────────────────────────────────────────────────────────────

export type ContactRole = 'caregiver' | 'family' | 'doctor' | 'emergency';

export interface Contact {
  id: string;
  name: string;
  role: ContactRole;
  phone: string;
  avatarInitials: string;
  avatarColour: string; // Tailwind bg class
  notes?: string;
  isEmergency: boolean;
}

// ── Caregiver notes ───────────────────────────────────────────────────────

export interface CaregiverNote {
  id: string;
  date: string;        // "YYYY-MM-DD"
  author: string;
  note: string;
  priority: Priority;
}
