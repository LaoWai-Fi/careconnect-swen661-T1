import { localDay } from './localDay';
import type {
  Medication,
  Contact,
  CaregiverNote,
} from '../types';

const TODAY = localDay();

// ── Medications ────────────────────────────────────────────────────────────

export const medications: Medication[] = [
  {
    id: 'm1',
    name: 'Amlodipine',
    dosage: '5 mg — 1 tablet',
    times: ['08:30'],
    instructions: 'Take with food.',
    colour: 'bg-calm-200',
    taken: { [TODAY]: true },
  },
  {
    id: 'm2',
    name: 'Atorvastatin',
    dosage: '20 mg — 1 tablet',
    times: ['20:00'],
    instructions: 'Take in the evening.',
    colour: 'bg-warm-200',
    taken: { [TODAY]: false },
  },
  {
    id: 'm3',
    name: 'Sertraline',
    dosage: '50 mg — 1 tablet',
    times: ['08:30'],
    instructions: 'Take with or without food.',
    colour: 'bg-success-200',
    taken: { [TODAY]: true },
  },
  {
    id: 'm4',
    name: 'Vitamin D3',
    dosage: '1000 IU — 1 capsule',
    times: ['08:30'],
    instructions: 'Take with breakfast.',
    colour: 'bg-warning-200',
    taken: { [TODAY]: false },
  },
];

// ── Contacts ────────────────────────────────────────────────────────────────

export const contacts: Contact[] = [
  {
    id: 'c1',
    name: 'Maria Thompson',
    role: 'family',
    phone: '07700 900 123',
    avatarInitials: 'MT',
    avatarColour: 'bg-calm-500',
    notes: 'Your daughter. Calls every Tuesday and Sunday.',
    isEmergency: true,
  },
  {
    id: 'c2',
    name: 'Joyce Adeyemi',
    role: 'caregiver',
    phone: '07700 900 456',
    avatarInitials: 'JA',
    avatarColour: 'bg-success-600',
    notes: 'Your daytime carer. Visits Monday to Friday, 9am–1pm.',
    isEmergency: true,
  },
  {
    id: 'c3',
    name: 'Dr. Priya Sharma',
    role: 'doctor',
    phone: '01234 567 890',
    avatarInitials: 'PS',
    avatarColour: 'bg-warm-600',
    notes: 'Your GP at the Greenfield Surgery. Call for appointments.',
    isEmergency: false,
  },
  {
    id: 'c4',
    name: 'Tom Thompson',
    role: 'family',
    phone: '07700 900 789',
    avatarInitials: 'TT',
    avatarColour: 'bg-calm-700',
    notes: "Maria's husband. Can help in emergencies.",
    isEmergency: false,
  },
  {
    id: 'c5',
    name: 'Emergency Services',
    role: 'emergency',
    phone: '999',
    avatarInitials: '!',
    avatarColour: 'bg-alert-600',
    notes: 'Call 999 for police, fire, or ambulance.',
    isEmergency: true,
  },
];

// ── Caregiver Notes ─────────────────────────────────────────────────────────

export const caregiverNotes: CaregiverNote[] = [
  {
    id: 'n1',
    date: TODAY,
    author: 'Joyce Adeyemi',
    note: 'Good morning. Dorothy had a restful night. She ate all of her breakfast and took morning meds without difficulty. Mood is cheerful.',
    priority: 'low',
  },
  {
    id: 'n2',
    date: TODAY,
    author: 'Joyce Adeyemi',
    note: 'Dorothy mentioned her left knee is a little sore today. She skipped the garden walk but did 10 minutes of gentle seated exercises instead. Worth noting for the GP review next week.',
    priority: 'medium',
  },
  {
    id: 'n3',
    date: '2026-06-03',
    author: 'Maria Thompson',
    note: "Had a lovely video call with Mum yesterday. She remembered Ella's school play and was asking about the cat. Great day overall.",
    priority: 'low',
  },
  {
    id: 'n4',
    date: '2026-06-02',
    author: 'Joyce Adeyemi',
    note: 'Dorothy was confused about the day of the week this morning and asked for Robert twice. Gently reminded her and she settled quickly. No distress. Monitoring.',
    priority: 'medium',
  },
];
