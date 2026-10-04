import type { Appointment, DashboardWidget, Medication, Message } from "../types"

// Seed dates are generated relative to today so the demo always looks current.
export function formatDay(offsetDays: number, now: Date = new Date()) {
  const d = new Date(now.getTime())
  d.setDate(d.getDate() + offsetDays)
  // Keep appointments on weekdays.
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}
export const ANNUAL_REVIEW_DAY = formatDay(8)
export const EYE_TEST_DAY = formatDay(21)
export const REMINDER_SENT_DAY = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 3)
  return d.toLocaleDateString("en-US", { weekday: "short" })
})()

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "status", label: "Margaret's status", enabled: true, order: 0 },
  { id: "alerts", label: "Alerts", enabled: true, order: 1 },
  { id: "medications", label: "Today's medications", enabled: true, order: 2 },
  { id: "appointments", label: "Next appointment", enabled: true, order: 3 },
  { id: "messages", label: "Unread messages", enabled: true, order: 4 },
]

export const DEFAULT_MESSAGES: Message[] = [
  {
    id: "msg1",
    from: "Dr. Sharma",
    to: ["Maria Thompson"],
    subject: "Margaret's blood pressure results",
    body: "Hi Maria,\n\nI reviewed Margaret's blood pressure readings from this week. The numbers are slightly elevated but not concerning at this stage. Please ensure she takes her Amlodipine consistently at 8:30 am.\n\nI'll check again at her appointment today.\n\nBest regards,\nDr. Sharma",
    timestamp: "9:15 am",
    read: false,
    archived: false,
    attachments: [{ name: "BP_readings.pdf", type: "application/pdf" }],
  },
  {
    id: "msg2",
    from: "Emma Thompson",
    to: ["Maria Thompson"],
    subject: "Cover this afternoon?",
    body: "Hi,\n\nCould you cover Margaret's afternoon visit today? I have a clash with another appointment. She needs her 2 pm medications checked.\n\nThanks,\nEmma",
    timestamp: "Yesterday",
    read: false,
    archived: false,
  },
  {
    id: "msg3",
    from: "Vision Plus Opticians",
    to: ["Maria Thompson"],
    subject: "Appointment reminder",
    body:
      "This is a reminder that Margaret Thompson has an eye test booked for " +
      EYE_TEST_DAY +
      " at 11:00 am at Vision Plus Opticians, 22 High Street, Westfield. Please call us if you need to reschedule.",
    timestamp: REMINDER_SENT_DAY,
    read: true,
    archived: false,
  },
]

export const DEFAULT_MEDS: Medication[] = [
  {
    id: "m1",
    name: "Amlodipine",
    dose: "5 mg — 1 tablet",
    time: "8:30 am",
    notes: "Take with or without food.",
    taken: false,
  },
  {
    id: "m2",
    name: "Metformin",
    dose: "500 mg — 1 tablet",
    time: "8:30 am",
    notes: "Take with breakfast.",
    taken: true,
  },
  {
    id: "m3",
    name: "Vitamin D3",
    dose: "1000 IU — 1 capsule",
    time: "8:30 am",
    notes: "Take with breakfast.",
    taken: false,
  },
]

export const DEFAULT_APPTS: Appointment[] = [
  {
    id: "a1",
    title: "Blood pressure check — Dr. Sharma",
    dateTime: "Today — 10:30 am",
    location: "Greenfield Surgery — 12 Greenfield Road, Westfield",
    assignee: "Maria Thompson",
    notes:
      "Your blood pressure check. Dr. Sharma will review all your medicines.",
  },
  {
    id: "a2",
    title: "Annual health review — Dr. Sharma",
    dateTime: ANNUAL_REVIEW_DAY + " — 2:00 pm",
    location: "Greenfield Surgery — 12 Greenfield Road, Westfield",
    assignee: "Maria Thompson",
    notes:
      "Your yearly health check. Dr. Sharma will review all your medicines. Maria will drive you.",
  },
  {
    id: "a3",
    title: "Eye test",
    dateTime: EYE_TEST_DAY + " — 11:00 am",
    location: "Vision Plus Opticians — 22 High Street, Westfield",
    notes:
      "Routine yearly eye test. Your glasses prescription may be updated. No special preparation needed.",
  },
]

// Seed data is created before anyone signs in, so it uses a placeholder name
// for the person using the app. On sign-in, records carrying this label are
// relabeled to the signed-in user (same approach as the Flutter and RN builds).
export const DEMO_USER_PLACEHOLDER = "Maria Thompson"
