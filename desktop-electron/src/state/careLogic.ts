// Pure state transitions for the CareConnect renderer.
//
// Every function here takes the current AppState (plus arguments) and returns
// a new AppState without touching React, the DOM or Electron. App.tsx wires
// these into useState, and the Jest unit tests exercise them directly.

import type {
  ActivityEntry,
  AppState,
  Appointment,
  Medication,
  Message,
  Page,
} from "../types"
import {
  DEFAULT_APPTS,
  DEFAULT_MEDS,
  DEFAULT_MESSAGES,
  DEFAULT_WIDGETS,
  DEMO_USER_PLACEHOLDER,
} from "./seed"

export const SIGNED_IN_PAGES: Page[] = [
  "dashboard",
  "medications",
  "appointments",
  "activity",
  "messages",
]

let counter = 0
/** Short unique id. Uses crypto when available, with a counter fallback. */
export function uid(): string {
  counter += 1
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return random + counter.toString(36)
}

export function timeLabel(now: Date = new Date()): string {
  return now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function createInitialState(): AppState {
  return {
    page: "landing",
    handMode: "off",
    userName: "",
    medications: DEFAULT_MEDS,
    appointments: DEFAULT_APPTS,
    activity: [],
    dashboardWidgets: DEFAULT_WIDGETS,
    fontSize: "normal",
    checkedIn: false,
    theme: "system",
    messages: DEFAULT_MESSAGES,
    viewingMessageId: null,
  }
}

// ── Names ────────────────────────────────────────────────────────────────

/** Turns "jane.roe@example.com"-style input into "Jane Roe". */
export function toDisplayName(raw: string): string {
  const cleaned = raw.trim().split("@")[0]
  if (/\s/.test(cleaned)) return cleaned
  const words = cleaned.split(/[._-]+/).filter(Boolean)
  return (
    words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "Caregiver"
  )
}

export function firstNameOf(name: string): string {
  return name.trim().split(" ")[0]
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}

/** Re-attributes seed records from one user label to another. */
export function relabelUser(
  s: AppState,
  fromName: string,
  toName: string,
): Pick<AppState, "appointments" | "messages"> {
  if (fromName === toName)
    return { appointments: s.appointments, messages: s.messages }
  const fromFirst = firstNameOf(fromName)
  const toFirst = firstNameOf(toName)
  return {
    appointments: s.appointments.map((a) => ({
      ...a,
      assignee: a.assignee === fromName ? toName : a.assignee,
      notes: a.notes ? a.notes.split(fromFirst).join(toFirst) : a.notes,
    })),
    messages: s.messages.map((m) => {
      const mine = m.to.includes(fromName) || m.from === fromName
      return {
        ...m,
        to: m.to.map((t) => (t === fromName ? toName : t)),
        from: m.from === fromName ? toName : m.from,
        body: mine ? m.body.split(fromFirst).join(toFirst) : m.body,
      }
    }),
  }
}

// ── Session ──────────────────────────────────────────────────────────────

export function signIn(
  s: AppState,
  rawName: string,
  previousLabel: string = DEMO_USER_PLACEHOLDER,
): AppState {
  const displayName = toDisplayName(rawName)
  return {
    ...s,
    ...relabelUser(s, previousLabel, displayName),
    userName: displayName,
    page: "dashboard",
  }
}

export function signOut(s: AppState): AppState {
  return { ...s, page: "landing", userName: "", viewingMessageId: null }
}

export function navigateTo(s: AppState, page: Page): AppState {
  return {
    ...s,
    page,
    viewingMessageId: page === "messages" ? s.viewingMessageId : null,
  }
}

export function viewMessage(s: AppState, id: string): AppState {
  return { ...s, page: "messages", viewingMessageId: id }
}

// ── Messages ─────────────────────────────────────────────────────────────

function updateMessage(
  s: AppState,
  id: string,
  change: (m: Message) => Message,
): AppState {
  return {
    ...s,
    messages: s.messages.map((m) => (m.id === id ? change(m) : m)),
  }
}

export const markMessageRead = (s: AppState, id: string) =>
  updateMessage(s, id, (m) => ({ ...m, read: true }))

export const toggleMessageRead = (s: AppState, id: string) =>
  updateMessage(s, id, (m) => ({ ...m, read: !m.read }))

export const archiveMessage = (s: AppState, id: string) =>
  updateMessage(s, id, (m) => ({ ...m, archived: true }))

export const unarchiveMessage = (s: AppState, id: string) =>
  updateMessage(s, id, (m) => ({ ...m, archived: false }))

export function deleteMessage(s: AppState, id: string): AppState {
  return { ...s, messages: s.messages.filter((m) => m.id !== id) }
}

export type OutgoingMessage = Omit<
  Message,
  "id" | "timestamp" | "read" | "archived"
>

export function sendMessage(
  s: AppState,
  data: OutgoingMessage,
  now: Date = new Date(),
): AppState {
  return {
    ...s,
    messages: [
      { ...data, id: uid(), timestamp: timeLabel(now), read: true, archived: false },
      ...s.messages,
    ],
  }
}

export function unreadCount(s: Pick<AppState, "messages">): number {
  return s.messages.filter((m) => !m.read && !m.archived).length
}

// ── Medications ──────────────────────────────────────────────────────────

function logActivity(
  s: AppState,
  type: ActivityEntry["type"],
  description: string,
  now: Date,
): ActivityEntry[] {
  return [{ id: uid(), type, description, timestamp: timeLabel(now) }, ...s.activity]
}

export function addMedication(
  s: AppState,
  data: Omit<Medication, "id" | "taken">,
  now: Date = new Date(),
): AppState {
  return {
    ...s,
    medications: [...s.medications, { ...data, id: uid(), taken: false }],
    activity: logActivity(
      s,
      "task_completed",
      `Added ${data.name} to Margaret's medications`,
      now,
    ),
  }
}

export function deleteMedication(s: AppState, id: string): AppState {
  return { ...s, medications: s.medications.filter((m) => m.id !== id) }
}

export function toggleMedTaken(
  s: AppState,
  id: string,
  now: Date = new Date(),
): AppState {
  const med = s.medications.find((m) => m.id === id)
  if (!med) return s
  const nowTaken = !med.taken
  return {
    ...s,
    medications: s.medications.map((m) =>
      m.id === id ? { ...m, taken: nowTaken } : m,
    ),
    activity: logActivity(
      s,
      nowTaken ? "medication_taken" : "medication_unmarked",
      `${med.name} ${nowTaken ? "marked as taken" : "unmarked"}`,
      now,
    ),
  }
}

// ── Appointments ─────────────────────────────────────────────────────────

export function addAppointment(
  s: AppState,
  data: Omit<Appointment, "id">,
): AppState {
  return { ...s, appointments: [{ ...data, id: uid() }, ...s.appointments] }
}

export function editAppointment(
  s: AppState,
  id: string,
  data: Omit<Appointment, "id">,
): AppState {
  return {
    ...s,
    appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...data } : a)),
  }
}

export function deleteAppointment(s: AppState, id: string): AppState {
  return { ...s, appointments: s.appointments.filter((a) => a.id !== id) }
}

// ── Activity / dashboard ─────────────────────────────────────────────────

export function checkIn(s: AppState, now: Date = new Date()): AppState {
  return {
    ...s,
    checkedIn: true,
    activity: logActivity(s, "checked_in", "Margaret checked in", now),
  }
}

export function addActivity(
  s: AppState,
  entry: Omit<ActivityEntry, "id">,
): AppState {
  return { ...s, activity: [{ ...entry, id: uid() }, ...s.activity] }
}

export function toggleWidget(s: AppState, id: string): AppState {
  return {
    ...s,
    dashboardWidgets: s.dashboardWidgets.map((w) =>
      w.id === id ? { ...w, enabled: !w.enabled } : w,
    ),
  }
}

export function nextMedication(s: Pick<AppState, "medications">): Medication | undefined {
  return s.medications.find((m) => !m.taken)
}

// ── Persistence (desktop file system) ────────────────────────────────────

/** The part of AppState that is saved to disk between launches. */
export interface CareData {
  version: 1
  /** Name the records are currently attributed to (see relabelUser). */
  ownerName: string
  medications: Medication[]
  appointments: Appointment[]
  activity: ActivityEntry[]
  messages: Message[]
  dashboardWidgets: AppState["dashboardWidgets"]
  checkedIn: boolean
  handMode: AppState["handMode"]
  fontSize: AppState["fontSize"]
}

export function toCareData(s: AppState, ownerName: string): CareData {
  return {
    version: 1,
    ownerName,
    medications: s.medications,
    appointments: s.appointments,
    activity: s.activity,
    messages: s.messages,
    dashboardWidgets: s.dashboardWidgets,
    checkedIn: s.checkedIn,
    handMode: s.handMode,
    fontSize: s.fontSize,
  }
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === "string"

function validMedication(v: unknown): v is Medication {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    isStr(v.dose) &&
    isStr(v.time) &&
    isStr(v.notes) &&
    typeof v.taken === "boolean"
  )
}

function validAppointment(v: unknown): v is Appointment {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.title) &&
    isStr(v.dateTime) &&
    isStr(v.location) &&
    isStr(v.notes) &&
    (v.assignee === undefined || isStr(v.assignee))
  )
}

const ACTIVITY_TYPES = [
  "medication_taken",
  "medication_unmarked",
  "task_completed",
  "checked_in",
]

function validActivity(v: unknown): v is ActivityEntry {
  return (
    isObj(v) &&
    isStr(v.id) &&
    ACTIVITY_TYPES.includes(v.type as string) &&
    isStr(v.description) &&
    isStr(v.timestamp)
  )
}

function validMessage(v: unknown): v is Message {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.from) &&
    Array.isArray(v.to) &&
    v.to.every(isStr) &&
    isStr(v.subject) &&
    isStr(v.body) &&
    isStr(v.timestamp) &&
    typeof v.read === "boolean" &&
    typeof v.archived === "boolean"
  )
}

function validWidget(v: unknown): boolean {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.label) &&
    typeof v.enabled === "boolean" &&
    typeof v.order === "number"
  )
}

/**
 * Validates data read from disk or imported by the user. Returns null when the
 * shape is wrong so a corrupt or hand-edited file can never crash the UI.
 */
export function parseCareData(input: unknown): CareData | null {
  if (!isObj(input) || input.version !== 1) return null
  if (input.ownerName !== undefined && !isStr(input.ownerName)) return null
  const {
    medications,
    appointments,
    activity,
    messages,
    dashboardWidgets,
    checkedIn,
    handMode,
    fontSize,
  } = input
  if (!Array.isArray(medications) || !medications.every(validMedication)) return null
  if (!Array.isArray(appointments) || !appointments.every(validAppointment)) return null
  if (!Array.isArray(activity) || !activity.every(validActivity)) return null
  if (!Array.isArray(messages) || !messages.every(validMessage)) return null
  if (!Array.isArray(dashboardWidgets) || !dashboardWidgets.every(validWidget)) return null
  if (typeof checkedIn !== "boolean") return null
  if (!["off", "left", "right"].includes(handMode as string)) return null
  if (!["normal", "large", "xlarge"].includes(fontSize as string)) return null
  return {
    ...(input as unknown as CareData),
    ownerName: isStr(input.ownerName) ? input.ownerName : DEMO_USER_PLACEHOLDER,
  }
}

export function applyCareData(s: AppState, data: CareData): AppState {
  return {
    ...s,
    medications: data.medications,
    appointments: data.appointments,
    activity: data.activity,
    messages: data.messages,
    dashboardWidgets: data.dashboardWidgets,
    checkedIn: data.checkedIn,
    handMode: data.handMode,
    fontSize: data.fontSize,
  }
}
