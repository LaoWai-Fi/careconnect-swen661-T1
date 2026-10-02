import { useCallback, useEffect, useRef, useState } from "react"
import type {
  ActivityEntry,
  Appointment,
  AppState,
  DashboardWidget,
  HandMode,
  Medication,
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
import * as care from "./state/careLogic"
import { DEMO_USER_PLACEHOLDER } from "./state/seed"
import { baseName, getDesktop } from "./lib/desktop"

type Theme = AppState["theme"]

const THEME_KEY = "cc-theme"
const AUTOSAVE_DELAY_MS = 400

function readSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === "light" || saved === "dark" ? saved : "system"
  } catch {
    return "system"
  }
}

function applyTheme(theme: Theme) {
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  const isDark = theme === "dark" || (theme === "system" && prefersDark)
  document.documentElement.classList.toggle("dark", isDark)
}

export interface Notice {
  id: number
  text: string
}

export default function App() {
  const desktop = getDesktop()
  // Name the care records are currently attributed to (see care.relabelUser).
  const labeledAs = useRef(DEMO_USER_PLACEHOLDER)
  const [state, setState] = useState<AppState>(() => ({
    ...care.createInitialState(),
    theme: readSavedTheme(),
  }))
  // Desktop only: becomes true once saved care data has been read from disk,
  // so autosave never overwrites the file with seed data on startup.
  const [loaded, setLoaded] = useState(!desktop)
  const [notice, setNotice] = useState<Notice | null>(null)
  const noticeId = useRef(0)

  const announce = useCallback((text: string) => {
    noticeId.current += 1
    setNotice({ id: noticeId.current, text })
  }, [])

  const update = useCallback(
    (change: (s: AppState) => AppState) => setState(change),
    [],
  )

  // Theme ------------------------------------------------------------------
  useEffect(() => {
    applyTheme(state.theme)
  }, [state.theme])

  function setTheme(theme: Theme) {
    update((s) => ({ ...s, theme }))
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Storage can be unavailable (private mode); the theme still applies.
    }
  }

  // Hand mode body classes follow state, including state loaded from disk.
  useEffect(() => {
    document.body.classList.remove("one-handed-left", "one-handed-right")
    if (state.page === "landing") return
    if (state.handMode === "left") document.body.classList.add("one-handed-left")
    if (state.handMode === "right") document.body.classList.add("one-handed-right")
  }, [state.handMode, state.page])

  // Load saved care data from the desktop file system ------------------------
  useEffect(() => {
    if (!desktop) return
    let cancelled = false
    desktop
      .loadCareData()
      .then((result) => {
        if (cancelled) return
        if (result.ok && result.data) {
          const data = care.parseCareData(result.data)
          if (data) {
            labeledAs.current = data.ownerName
            setState((s) => care.applyCareData(s, data))
          } else {
            announce("Saved care plan could not be read; starting from sample data")
          }
        } else if (!result.ok) {
          announce("Could not open saved care plan: " + (result.error ?? "unknown error"))
        }
      })
      .catch(() => {
        if (!cancelled) announce("Could not open saved care plan")
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [desktop, announce])

  const signedIn = !["landing", "signin", "signup"].includes(state.page)

  // Autosave (debounced) whenever care data changes while signed in ---------
  // labeledAs is only written from event handlers and the load effect; reading it here is intentional.
  // eslint-disable-next-line react-hooks/refs
  const careData = care.toCareData(state, labeledAs.current)
  const careJson = JSON.stringify(careData)
  const lastSaved = useRef<string | null>(null)

  const saveNow = useCallback(
    async (data: care.CareData, manual: boolean) => {
      if (!desktop) {
        if (manual) announce("Browser preview: changes are kept until you close this tab")
        return
      }
      const result = await desktop.saveCareData(data)
      if (result.ok) {
        lastSaved.current = JSON.stringify(data)
        announce(manual ? "Care plan saved to this computer" : "All changes saved")
      } else {
        announce("Save failed: " + (result.error ?? "unknown error"))
      }
    },
    [desktop, announce],
  )

  useEffect(() => {
    if (!desktop || !loaded || !signedIn) return
    if (lastSaved.current === null) {
      lastSaved.current = careJson
      return
    }
    if (careJson === lastSaved.current) return
    const timer = window.setTimeout(() => {
      void saveNow(JSON.parse(careJson) as care.CareData, false)
    }, AUTOSAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [careJson, desktop, loaded, signedIn, saveNow])

  // Keep the main process (menu enabled-state, tray) in sync with the session.
  const unread = care.unreadCount(state)
  const nextMed = care.nextMedication(state)
  useEffect(() => {
    desktop?.setSession({
      signedIn,
      userName: state.userName,
      unread,
      nextMedication: nextMed ? `${nextMed.name} at ${nextMed.time}` : null,
    })
  }, [desktop, signedIn, state.userName, unread, nextMed])

  // Handlers -----------------------------------------------------------------
  const navigate = useCallback(
    (page: Page) => update((s) => care.navigateTo(s, page)),
    [update],
  )

  function handleSignIn(name: string) {
    const previous = labeledAs.current
    labeledAs.current = care.toDisplayName(name)
    update((s) => care.signIn(s, name, previous))
  }

  function handleSignOut() {
    update(care.signOut)
  }

  function handleCheckIn() {
    const now = new Date()
    update((s) => care.checkIn(s, now))
    void desktop?.notify(
      "Check-in recorded",
      "Margaret's check-in was logged at " + care.timeLabel(now),
    )
  }

  async function handleExport() {
    if (!desktop) return
    const result = await desktop.exportCareData(careData)
    if (result.ok) {
      announce("Care plan exported to " + baseName(result.filePath))
      void desktop.notify("Care plan exported", baseName(result.filePath))
    } else if (!result.canceled) {
      announce("Export failed: " + (result.error ?? "unknown error"))
    }
  }

  async function handleImport() {
    if (!desktop) return
    const result = await desktop.importCareData()
    if (!result.ok) {
      if (!result.canceled) announce("Import failed: " + (result.error ?? "unknown error"))
      return
    }
    const data = care.parseCareData(result.data)
    if (!data) {
      announce("Import failed: " + baseName(result.filePath) + " is not a CareConnect care plan")
      return
    }
    const owner = state.userName || labeledAs.current
    setState((s) => {
      const imported = care.applyCareData(s, data)
      return { ...imported, ...care.relabelUser(imported, data.ownerName, owner) }
    })
    labeledAs.current = owner
    announce("Imported care plan from " + baseName(result.filePath))
  }

  const { page } = state

  // Unauthenticated pages
  if (page === "landing") return <LandingPage navigate={navigate} />
  if (page === "signin")
    return <SignInPage navigate={navigate} onSignIn={handleSignIn} />
  if (page === "signup")
    return <SignUpPage navigate={navigate} onSignUp={handleSignIn} />

  // Authenticated: shell + inner pages
  return (
    <AppShell
      state={state}
      navigate={navigate}
      onHandMode={(handMode: HandMode) => update((s) => ({ ...s, handMode }))}
      onFontSize={(fontSize) => update((s) => ({ ...s, fontSize }))}
      onTheme={setTheme}
      onSignOut={handleSignOut}
      onSave={() => void saveNow(careData, true)}
      onExport={desktop ? () => void handleExport() : undefined}
      onImport={desktop ? () => void handleImport() : undefined}
      onCheckIn={handleCheckIn}
      notice={notice}
    >
      {page === "dashboard" && (
        <DashboardPage
          state={state}
          navigate={navigate}
          onToggleWidget={(id) => update((s) => care.toggleWidget(s, id))}
          onReorderWidgets={(widgets: DashboardWidget[]) =>
            update((s) => ({ ...s, dashboardWidgets: widgets }))
          }
          onToggleMedTaken={(id) => update((s) => care.toggleMedTaken(s, id))}
          onCheckIn={handleCheckIn}
          handLeft={state.handMode === "left"}
          onViewMessage={(id) => update((s) => care.viewMessage(s, id))}
        />
      )}
      {page === "medications" && (
        <MedicationsPage
          state={state}
          onAdd={(data: Omit<Medication, "id" | "taken">) =>
            update((s) => care.addMedication(s, data))
          }
          onDelete={(id) => update((s) => care.deleteMedication(s, id))}
          onToggleTaken={(id) => update((s) => care.toggleMedTaken(s, id))}
        />
      )}
      {page === "appointments" && (
        <AppointmentsPage
          state={state}
          onAdd={(data: Omit<Appointment, "id">) =>
            update((s) => care.addAppointment(s, data))
          }
          onEdit={(id, data) => update((s) => care.editAppointment(s, id, data))}
          onDelete={(id) => update((s) => care.deleteAppointment(s, id))}
        />
      )}
      {page === "activity" && (
        <ActivityPage
          state={state}
          onAddEntry={(entry: Omit<ActivityEntry, "id">) =>
            update((s) => care.addActivity(s, entry))
          }
        />
      )}
      {page === "messages" && (
        <MessagesPage
          messages={state.messages}
          onMarkRead={(id) => update((s) => care.markMessageRead(s, id))}
          onToggleRead={(id) => update((s) => care.toggleMessageRead(s, id))}
          onDelete={(id) => update((s) => care.deleteMessage(s, id))}
          onArchive={(id) => update((s) => care.archiveMessage(s, id))}
          onUnarchive={(id) => update((s) => care.unarchiveMessage(s, id))}
          currentUser={state.userName}
          onSend={(data) => update((s) => care.sendMessage(s, data))}
          navigate={navigate}
          initialMessageId={state.viewingMessageId}
          handLeft={state.handMode === "left"}
        />
      )}
    </AppShell>
  )
}
