import { useState, useEffect } from "react"
import type {
  AppState,
  DashboardWidget,
  HandMode,
  Medication,
  Appointment,
  ActivityEntry,
  Message,
  Page,
} from "./types"
import LandingPage from "./pages/LandingPage"
import SignInPage from "./pages/SignInPage"
import SignUpPage from "./pages/SignUpPage"
import DashboardPage from "./pages/DashboardPage"
import MedicationsPage from "./pages/MedicationsPage"
import AppointmentsPage from "./pages/AppointmentsPage"
import ActivityPage from "./pages/ActivityPage"
import MessagesPage from "./pages/MessagesPage"
import AppShell from "./components/AppShell"

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "status", label: "Margaret's status", enabled: true, order: 0 },
  { id: "alerts", label: "Alerts", enabled: true, order: 1 },
  { id: "medications", label: "Today's medications", enabled: true, order: 2 },
  { id: "appointments", label: "Next appointment", enabled: true, order: 3 },
  { id: "messages", label: "Unread messages", enabled: true, order: 4 },
]

const DEFAULT_MESSAGES: Message[] = [
  {
    id: "msg1",
    from: "Dr. Sharma",
    to: ["Maria Thompson"],
    subject: "Margaret's blood pressure results",
    body: "Hi Maria,\n\nI reviewed Margaret's blood pressure readings from this week. The numbers are slightly elevated but not concerning at this stage. Please ensure she takes her Amlodipine consistently at 8:30 am.\n\nI'll check again at her appointment on Thursday.\n\nBest regards,\nDr. Sharma",
    timestamp: "9:15 am",
    read: false,
    archived: false,
    attachments: [{ name: "BP_readings_june.pdf", type: "application/pdf" }],
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
    body: "This is a reminder that Margaret Thompson has an eye test booked for Friday 18 July at 11:00 am at Vision Plus Opticians, 22 High Street, Westfield. Please call us if you need to reschedule.",
    timestamp: "Mon",
    read: true,
    archived: false,
  },
]

const DEFAULT_MEDS: Medication[] = [
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

const DEFAULT_APPTS: Appointment[] = [
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
    dateTime: "Monday 22 June — 2:00 pm",
    location: "Greenfield Surgery — 12 Greenfield Road, Westfield",
    assignee: "Maria Thompson",
    notes:
      "Your yearly health check. Dr. Sharma will review all your medicines. Maria will drive you.",
  },
  {
    id: "a3",
    title: "Eye test",
    dateTime: "Friday 18 July — 11:00 am",
    location: "Vision Plus Opticians — 22 High Street, Westfield",
    notes:
      "Routine yearly eye test. Your glasses prescription may be updated. No special preparation needed.",
  },
]

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function App() {
  const [state, setState] = useState<AppState>({
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
  })

  function applyTheme(theme: "light" | "dark" | "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches
    const isDark = theme === "dark" || (theme === "system" && prefersDark)
    document.documentElement.classList.toggle("dark", isDark)
  }

  useEffect(() => {
    const saved = (localStorage.getItem("cc-theme") ??
      "system") as "light" | "dark" | "system"
    applyTheme(saved)
    setState((s) => ({ ...s, theme: saved }))
  }, [])

  function setTheme(theme: "light" | "dark" | "system") {
    setState((s) => ({ ...s, theme }))
    applyTheme(theme)
    localStorage.setItem("cc-theme", theme)
  }

  function navigate(page: Page) {
    // Clear viewingMessageId when leaving the messages page
    setState((s) => ({
      ...s,
      page,
      viewingMessageId: page === "messages" ? s.viewingMessageId : null,
    }))
  }

  function handleViewMessage(id: string) {
    setState((s) => ({ ...s, page: "messages", viewingMessageId: id }))
  }

  function handleMarkMessageRead(id: string) {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.id === id ? { ...m, read: true } : m)),
    }))
  }

  function handleToggleMessageRead(id: string) {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, read: !m.read } : m,
      ),
    }))
  }

  function handleDeleteMessage(id: string) {
    setState((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== id) }))
  }

  function handleUnarchiveMessage(id: string) {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, archived: false } : m,
      ),
    }))
  }

  function handleArchiveMessage(id: string) {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, archived: true } : m,
      ),
    }))
  }

  function handleSendMessage(data: {
    from: string
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body: string
    attachments?: { name: string; type: string }[]
  }) {
    const now = new Date()
    const timestamp = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    setState((s) => ({
      ...s,
      messages: [
        {
          ...data,
          id: uid(),
          timestamp,
          read: true,
          archived: false,
        },
        ...s.messages,
      ],
    }))
  }

  function setHandMode(handMode: HandMode) {
    setState((s) => ({ ...s, handMode }))
    document.body.classList.remove("one-handed-left", "one-handed-right")
    if (handMode === "left") document.body.classList.add("one-handed-left")
    if (handMode === "right") document.body.classList.add("one-handed-right")
  }

  function handleSignIn(name: string) {
    const savedView = localStorage.getItem("cc-saved-view")
    const page = (["dashboard", "medications", "appointments", "activity", "messages"] as string[]).includes(savedView ?? "")
      ? (savedView as Page)
      : "dashboard"
    setState((s) => ({ ...s, userName: name, page }))
  }

  function handleSignUp(name: string) {
    setState((s) => ({ ...s, userName: name, page: "dashboard" }))
  }

  function handleSignOut() {
    setState((s) => ({ ...s, page: "landing", userName: "" }))
    document.body.classList.remove("one-handed-left", "one-handed-right")
  }

  function setFontSize(size: "normal" | "large" | "xlarge") {
    setState((s) => ({ ...s, fontSize: size }))
    const px = size === "normal" ? "16px" : size === "large" ? "19px" : "22px"
    document.documentElement.style.fontSize = px
  }

  function handleCheckIn() {
    setState((s) => ({
      ...s,
      checkedIn: true,
      activity: [
        {
          id: uid(),
          type: "checked_in",
          description: "Margaret checked in",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        },
        ...s.activity,
      ],
    }))
  }

  function toggleWidget(id: string) {
    setState((s) => ({
      ...s,
      dashboardWidgets: s.dashboardWidgets.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w,
      ),
    }))
  }

  function addMedication(data: Omit<Medication, "id" | "taken">) {
    setState((s) => ({
      ...s,
      medications: [...s.medications, { ...data, id: uid(), taken: false }],
      activity: [
        {
          id: uid(),
          type: "task_completed",
          description: `Added ${data.name} to Margaret's medications`,
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        },
        ...s.activity,
      ],
    }))
  }

  function deleteMedication(id: string) {
    setState((s) => ({
      ...s,
      medications: s.medications.filter((m) => m.id !== id),
    }))
  }

  function toggleMedTaken(id: string) {
    setState((s) => {
      const med = s.medications.find((m) => m.id === id)
      const nowTaken = !med?.taken
      return {
        ...s,
        medications: s.medications.map((m) =>
          m.id === id ? { ...m, taken: !m.taken } : m,
        ),
        activity: [
          {
            id: uid(),
            type: nowTaken ? "medication_taken" : "medication_unmarked",
            description: `${med?.name} ${
              nowTaken ? "marked as taken" : "unmarked"
            }`,
            timestamp: new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          },
          ...s.activity,
        ],
      }
    })
  }

  function addAppointment(data: Omit<Appointment, "id">) {
    setState((s) => ({
      ...s,
      appointments: [{ ...data, id: uid() }, ...s.appointments],
    }))
  }

  function editAppointment(id: string, data: Omit<Appointment, "id">) {
    setState((s) => ({
      ...s,
      appointments: s.appointments.map((a) =>
        a.id === id ? { ...a, ...data } : a,
      ),
    }))
  }

  function deleteAppointment(id: string) {
    setState((s) => ({
      ...s,
      appointments: s.appointments.filter((a) => a.id !== id),
    }))
  }

  function addActivity(entry: Omit<ActivityEntry, "id">) {
    setState((s) => ({
      ...s,
      activity: [{ ...entry, id: uid() }, ...s.activity],
    }))
  }

  const { page } = state

  // Unauthenticated pages
  if (page === "landing") return <LandingPage navigate={navigate} />
  if (page === "signin")
    return <SignInPage navigate={navigate} onSignIn={handleSignIn} />
  if (page === "signup")
    return <SignUpPage navigate={navigate} onSignUp={handleSignUp} />
  // Authenticated: shell + inner pages
  return (
    <AppShell
      state={state}
      navigate={navigate}
      onHandMode={setHandMode}
      onFontSize={setFontSize}
      onTheme={setTheme}
      onSignOut={handleSignOut}
    >
      {page === "dashboard" && (
        <DashboardPage
          state={state}
          navigate={navigate}
          onToggleWidget={toggleWidget}
          onReorderWidgets={(widgets) =>
            setState((s) => ({ ...s, dashboardWidgets: widgets }))
          }
          onToggleMedTaken={toggleMedTaken}
          onCheckIn={handleCheckIn}
          handLeft={state.handMode === "left"}
          onViewMessage={handleViewMessage}
        />
      )}
      {page === "medications" && (
        <MedicationsPage
          state={state}
          onAdd={addMedication}
          onDelete={deleteMedication}
          onToggleTaken={toggleMedTaken}
        />
      )}
      {page === "appointments" && (
        <AppointmentsPage
          state={state}
          onAdd={addAppointment}
          onEdit={editAppointment}
          onDelete={deleteAppointment}
        />
      )}
      {page === "activity" && (
        <ActivityPage state={state} onAddEntry={addActivity} />
      )}
      {page === "messages" && (
        <MessagesPage
          messages={state.messages}
          onMarkRead={handleMarkMessageRead}
          onToggleRead={handleToggleMessageRead}
          onDelete={handleDeleteMessage}
          onArchive={handleArchiveMessage}
          onUnarchive={handleUnarchiveMessage}
          onSend={handleSendMessage}
          navigate={navigate}
          initialMessageId={state.viewingMessageId}
          handLeft={state.handMode === "left"}
        />
      )}
    </AppShell>
  )
}
