import { useState, useRef } from "react"
import { useFocusTrap } from "../useFocusTrap"
import TapButton from "../components/TapButton"
import { useTapRipple } from "../useTapRipple"
import type { AppState, DashboardWidget, Page } from "../types"

interface Props {
  state: AppState
  navigate: (p: Page) => void
  onToggleWidget: (id: string) => void
  onReorderWidgets: (widgets: DashboardWidget[]) => void
  onToggleMedTaken: (id: string) => void
  onCheckIn: () => void
  onUndoCheckIn?: () => void
  handLeft?: boolean
  onViewMessage: (id: string) => void
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  onClick,
  ariaLabel,
}: {
  icon: string
  label: string
  value: string
  sub: string
  accent: string
  onClick?: () => void
  ariaLabel?: string
}) {
  const ripple = useTapRipple()
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onPointerDown={ripple}
      className={`text-left rounded-2xl border-2 p-4 flex flex-col gap-1 transition-all active:scale-[0.98] focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2 ${accent}`}
    >
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-70">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-[var(--foreground)]">{value}</div>
      <div className="text-xs text-[var(--muted-foreground)]">{sub}</div>
    </button>
  )
}

function AlertCard({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  const [dismissed, setDismissed] = useState(false)
  const ripple = useTapRipple()
  if (dismissed) return null
  return (
    <div className="bg-[var(--warning-bg)] border-2 border-[var(--warning-border)] rounded-xl p-4 flex gap-3">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[var(--foreground)]">{title}</div>
        <div className="text-sm text-[var(--muted-foreground)] mt-0.5">
          {body}
        </div>
      </div>
      <button
        onPointerDown={ripple}
        onClick={() => setDismissed(true)}
        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
        aria-label="Dismiss alert"
      >
        ✕
      </button>
    </div>
  )
}

function DragHandle() {
  return (
    <svg
      width="14"
      height="20"
      viewBox="0 0 14 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="3" cy="4" r="2" />
      <circle cx="11" cy="4" r="2" />
      <circle cx="3" cy="10" r="2" />
      <circle cx="11" cy="10" r="2" />
      <circle cx="3" cy="16" r="2" />
      <circle cx="11" cy="16" r="2" />
    </svg>
  )
}

function CustomizeModal({
  widgets,
  onToggle,
  onReorder,
  onClose,
}: {
  widgets: DashboardWidget[]
  onToggle: (id: string) => void
  onReorder: (widgets: DashboardWidget[]) => void
  onClose: () => void
}) {
  const [items, setItems] = useState(() =>
    [...widgets].sort((a, b) => a.order - b.order),
  )
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const dialogRef = useFocusTrap(true, onClose)

  function commit(next: DashboardWidget[]) {
    const updated = next.map((w, i) => ({ ...w, order: i }))
    setItems(updated)
    onReorder(updated)
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commit(next)
  }

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragOver(e: React.DragEvent, overIndex: number) {
    e.preventDefault()
    const from = dragIndex.current
    if (from === null || from === overIndex) return
    setDragOver(overIndex)
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(overIndex, 0, moved)
    const updated = next.map((w, i) => ({ ...w, order: i }))
    setItems(updated)
    onReorder(updated)
    dragIndex.current = overIndex
  }

  function handleDragEnd() {
    dragIndex.current = null
    setDragOver(null)
  }

  function handleToggle(id: string) {
    setItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    )
    onToggle(id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Customize Dashboard"
        className="relative bg-[var(--card)] w-full max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header — stays visible regardless of list length or viewport height */}
        <div className="flex-shrink-0 px-6 pt-6 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Customize Dashboard
            </h2>
            <TapButton variant="ghost" size="sm" onClick={onClose}>
              Done
            </TapButton>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Drag <DragHandle /> to reorder sections, or use ↑ ↓ buttons. Toggle
            to show or hide.
          </p>
        </div>
        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="divide-y divide-[var(--border)]">
            {items.map((w, index) => (
              <div
                key={w.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 py-3 select-none transition-colors rounded-lg ${
                  dragOver === index ? "bg-[var(--muted)]" : ""
                }`}
              >
                {/* Drag handle */}
                <span
                  className="text-[var(--muted-foreground)] cursor-grab active:cursor-grabbing flex-shrink-0 px-1"
                  aria-hidden="true"
                >
                  <DragHandle />
                </span>

                {/* Label */}
                <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                  {w.label}
                </span>

                {/* Up / down buttons */}
                <div className="flex gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-25 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--ring)] transition-colors"
                    aria-label={`Move ${w.label} up`}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(index, index + 1)}
                    disabled={index === items.length - 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-25 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--ring)] transition-colors"
                    aria-label={`Move ${w.label} down`}
                  >
                    ↓
                  </button>
                </div>

                {/* Visibility toggle */}
                <button
                  onClick={() => handleToggle(w.id)}
                  role="switch"
                  aria-checked={w.enabled}
                  aria-label={`${w.label} — ${
                    w.enabled ? "visible" : "hidden"
                  }`}
                  className={`relative inline-flex w-14 h-8 flex-shrink-0 rounded-full border-2 transition-colors duration-200 focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2 ${
                    w.enabled
                      ? "bg-[var(--primary)] border-[var(--primary)]"
                      : "bg-[var(--muted)] border-[var(--border)]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      w.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage({
  state,
  navigate,
  onToggleWidget,
  onReorderWidgets,
  onToggleMedTaken,
  onCheckIn,
  onUndoCheckIn,
  handLeft,
  onViewMessage,
}: Props) {
  const [customizing, setCustomizing] = useState(false)
  const [checkInFeedback, setCheckInFeedback] = useState("")
  const [medFeedback, setMedFeedback] = useState<Record<string, string>>({})

  const meds = state.medications
  const checkedIn = state.checkedIn
  const takenCount = meds.filter((m) => m.taken).length
  const totalTasks = meds.length + 1
  const doneTasks = takenCount + (checkedIn ? 1 : 0)
  const nextAppt = state.appointments[0]

  function handleMedToggle(id: string, currentlyTaken: boolean) {
    onToggleMedTaken(id)
    setMedFeedback((f) => ({
      ...f,
      [id]: currentlyTaken ? "↩ Unmarked" : "✓ Taken!",
    }))
    setTimeout(
      () =>
        setMedFeedback((f) => {
          const n = { ...f }
          delete n[id]
          return n
        }),
      2000,
    )
  }

  function handleCheckIn() {
    if (checkedIn) {
      // Pressing the card again undoes the check-in (no drag-only or hidden undo).
      onUndoCheckIn?.()
      setCheckInFeedback("↩ Check-in undone")
    } else {
      onCheckIn()
      setCheckInFeedback("✓ Check-in recorded!")
    }
    setTimeout(() => setCheckInFeedback(""), 3000)
  }

  const overdueUntakenMeds = meds.filter((m) => !m.taken)
  const alerts = [
    nextAppt?.dateTime.toLowerCase().includes("today") && {
      id: "appt",
      icon: "📅",
      title: "Appointment today",
      body: `${nextAppt.title} at ${nextAppt.dateTime.split("—")[1]?.trim() ?? nextAppt.dateTime} — ${nextAppt.location.split("—")[0].trim()}.`,
    },
    overdueUntakenMeds.length > 0 && {
      id: "meds",
      icon: "💊",
      title: `${overdueUntakenMeds.length} medication${
        overdueUntakenMeds.length > 1 ? "s" : ""
      } not yet taken`,
      body:
        overdueUntakenMeds.map((m) => `${m.name} ${m.dose}`).join(", ") +
        " — scheduled for " +
        overdueUntakenMeds[0].time +
        ".",
    },
    !checkedIn && {
      id: "checkin",
      icon: "👤",
      title: "No check-in yet",
      body: "Margaret hasn't checked in this morning. Tap the Check-in card above to record it.",
    },
  ].filter(Boolean) as { id: string; icon: string; title: string; body: string }[]

  const enabledWidgets = state.dashboardWidgets
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="px-4 py-5 flex flex-col gap-6 max-w-4xl mx-auto landscape-2col">
      {/* Header */}
      <div
        className={`flex items-center gap-2 ${
          handLeft ? "flex-row-reverse justify-end" : "justify-between"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Margaret's care overview —{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <TapButton
          variant="outline"
          size="sm"
          onClick={() => setCustomizing(true)}
          aria-label="Customize dashboard"
        >
          ✎
        </TapButton>
      </div>

      {/* Task counter */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          📋
        </span>
        <div className="flex-1">
          <div className="font-bold text-[var(--foreground)] text-lg leading-tight">
            {doneTasks} of {totalTasks} tasks done
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            today's care plan progress
          </div>
        </div>
        <div
          className="w-16 h-2 bg-[var(--muted)] rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Today's care plan progress"
          aria-valuemin={0}
          aria-valuenow={doneTasks}
          aria-valuemax={totalTasks}
        >
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
            style={{
              width:
                totalTasks > 0
                  ? `${Math.round((doneTasks / totalTasks) * 100)}%`
                  : "0%",
            }}
          />
        </div>
      </div>

      {/* Widget sections — rendered in user-defined order */}
      {enabledWidgets.map((widget) => {
        if (widget.id === "status")
          return (
            <section key="status" aria-label="Status overview">
              <h2 className="font-bold text-[var(--foreground)] mb-3">
                Margaret's status today
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  icon="💊"
                  label="Medications"
                  value={`${takenCount} of ${meds.length}`}
                  sub="taken today"
                  accent="bg-[var(--warning-bg)] border-[var(--warning-border)]"
                  onClick={() => navigate("medications")}
                />
                <StatCard
                  icon="👤"
                  label="Check-in"
                  value={checkedIn ? "Done" : "Not yet"}
                  sub={checkedIn ? "Completed · press to undo" : "Awaiting check-in"}
                  ariaLabel={
                    checkedIn
                      ? "Check-in done. Press to undo the check-in"
                      : "Check-in not yet recorded. Press to record Margaret's check-in"
                  }
                  accent={
                    checkedIn
                      ? "bg-[var(--success-bg)] border-[var(--success-border)]"
                      : "bg-[var(--muted)] border-[var(--border)]"
                  }
                  onClick={handleCheckIn}
                />
                <StatCard
                  icon="📅"
                  label="Next Appointment"
                  value={
                    nextAppt ? nextAppt.title.split("—")[0].trim() : "None"
                  }
                  sub={nextAppt ? nextAppt.dateTime : "—"}
                  accent="bg-[var(--info-bg)] border-[var(--info-border)]"
                  onClick={() => navigate("appointments")}
                />
              </div>
              {checkInFeedback && (
                <div
                  className="mt-2 text-sm font-semibold text-[var(--success-text)] bg-[var(--success-bg)] border border-[var(--success-border)] rounded-xl px-4 py-2"
                  role="status"
                  aria-live="polite"
                >
                  {checkInFeedback}
                </div>
              )}
            </section>
          )

        if (widget.id === "alerts")
          return alerts.length > 0 ? (
            <section key="alerts" aria-label="Alerts">
              <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
                ⚠️ Alerts
                <span
                  className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  aria-label={`${alerts.length} alerts`}
                >
                  {alerts.length}
                </span>
              </h2>
              <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
                {alerts.map((a) => (
                  <AlertCard
                    key={a.id}
                    icon={a.icon}
                    title={a.title}
                    body={a.body}
                  />
                ))}
              </div>
            </section>
          ) : null

        if (widget.id === "medications")
          return (
            <section key="medications" aria-label="Today's medications">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[var(--foreground)]">
                  💊 Today's medications
                </h2>
                <TapButton
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("medications")}
                >
                  View all →
                </TapButton>
              </div>
              <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
                {meds.slice(0, 3).map((med) => (
                  <button
                    key={med.id}
                    onClick={() => handleMedToggle(med.id, med.taken)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors active:scale-[0.98] focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] focus-visible:outline-offset-1 min-h-[60px] ${
                      med.taken
                        ? "bg-[var(--success-bg)] border-[var(--success-border)]"
                        : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]"
                    }`}
                    aria-label={`${med.name} — ${
                      med.taken ? "mark as not taken" : "mark as taken"
                    }`}
                  >
                    <span className="text-lg flex-shrink-0" aria-hidden="true">
                      {med.taken ? "✅" : "⭕"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[var(--foreground)]">
                        {med.name}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {med.dose} · {med.time}
                      </div>
                    </div>
                    {medFeedback[med.id] ? (
                      <span
                        className="text-xs font-semibold text-[var(--success-text)] flex-shrink-0"
                        role="status"
                        aria-live="polite"
                      >
                        {medFeedback[med.id]}
                      </span>
                    ) : med.taken ? (
                      <span className="text-xs text-[var(--success-text)] font-semibold flex-shrink-0">
                        Taken
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          )

        if (widget.id === "appointments")
          return nextAppt ? (
            <section key="appointments" aria-label="Next appointment">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[var(--foreground)]">
                  📅 Next appointment
                </h2>
                <TapButton
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("appointments")}
                >
                  View all →
                </TapButton>
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
                <div className="font-bold text-[var(--foreground)]">
                  {nextAppt.title}
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  🕐 {nextAppt.dateTime}
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  📍 {nextAppt.location}
                </div>
                <div className="text-sm text-[var(--muted-foreground)] mt-1">
                  {nextAppt.notes}
                </div>
              </div>
            </section>
          ) : null

        if (widget.id === "messages") {
          const unread = state.messages.filter((m) => !m.read && !m.archived)
          const preview = unread.slice(0, 3)
          return (
            <section key="messages" aria-label="Unread messages">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[var(--foreground)]">
                  ✉ Unread Messages{unread.length > 0 && ` (${unread.length})`}
                </h2>
                <TapButton
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("messages")}
                >
                  View all →
                </TapButton>
              </div>
              {unread.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3">
                  No new messages
                </p>
              ) : (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
                  {preview.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => onViewMessage(msg.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] focus-visible:outline-offset-[-2px] min-h-[60px]"
                      aria-label={`Unread message from ${msg.from}: ${msg.subject}`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] flex-shrink-0"
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--foreground)] truncate">
                          {msg.from}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">
                          {msg.subject}
                        </div>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                        {msg.timestamp}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )
        }

        return null
      })}

      {/* Customize modal */}
      {customizing && (
        <CustomizeModal
          widgets={state.dashboardWidgets}
          onToggle={onToggleWidget}
          onReorder={(widgets) => onReorderWidgets(widgets)}
          onClose={() => setCustomizing(false)}
        />
      )}
    </div>
  )
}
