import { useState } from "react"
import TapButton from "../components/TapButton"
import FormField, { Input } from "../components/FormField"
import { useFocusTrap } from "../useFocusTrap"
import ConfirmDialog from "../components/ConfirmDialog"
import type { AppState, Appointment } from "../types"

// Example date in the hint follows the real calendar (one week from today).
const EXAMPLE_DATE = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return (
    d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) + " — 2:00 pm"
  )
})()

interface Props {
  state: AppState
  onAdd: (appt: Omit<Appointment, "id">) => void
  onEdit: (id: string, appt: Omit<Appointment, "id">) => void
  onDelete: (id: string) => void
}

// ── Shared Add / Edit form ──────────────────────────────────────────────────

interface ApptFormProps {
  initial?: Appointment
  onSave: (data: Omit<Appointment, "id">) => void
  onCancel: () => void
}

function ApptForm({ initial, onSave, onCancel }: ApptFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [dateTime, setDateTime] = useState(initial?.dateTime ?? "")
  const [location, setLocation] = useState(initial?.location ?? "")
  const [assignee, setAssignee] = useState(initial?.assignee ?? "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const isEdit = !!initial
  const dialogRef = useFocusTrap(true, onCancel)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = "Required"
    if (!dateTime.trim()) errs.dateTime = "Required"
    if (!location.trim()) errs.location = "Required"
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setSaved(true)
    setTimeout(() => {
      onSave({ title, dateTime, location, assignee, notes })
      setSaved(false)
    }, 500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appt-form-title"
        className="relative bg-[var(--card)] w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between">
          <h2 id="appt-form-title" className="text-xl font-bold text-[var(--foreground)]">
            {isEdit ? "Edit appointment" : "Add appointment"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--muted)] font-bold text-[var(--muted-foreground)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Appointment title" required error={errors.title}>
            <Input
              placeholder="e.g. Blood pressure check — Dr. Sharma"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              autoFocus={!isEdit}
            />
          </FormField>

          <FormField
            label="Date and time"
            required
            error={errors.dateTime}
            hint={"Type a date like '" + EXAMPLE_DATE + "'."}
          >
            <Input
              placeholder={"e.g. " + EXAMPLE_DATE}
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              error={!!errors.dateTime}
            />
          </FormField>

          <FormField label="Location" required error={errors.location}>
            <Input
              placeholder="e.g. Greenfield Surgery — 12 Greenfield Road"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              error={!!errors.location}
            />
          </FormField>

          <FormField label="Assigned caregiver (optional)">
            <Input
              placeholder="e.g. Maria Thompson"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </FormField>

          <FormField label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preparation instructions, reminders, etc."
              rows={3}
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:outline-none focus:border-[var(--primary)] focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] resize-none min-h-[100px]"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <TapButton
              variant="outline"
              size="lg"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </TapButton>
            <TapButton
              type="submit"
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={saved}
            >
              {saved ? "✓ Saved!" : isEdit ? "Save changes" : "Add appointment"}
            </TapButton>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Appointment card ────────────────────────────────────────────────────────

function ApptCard({
  appt,
  onEdit,
  onDelete,
}: {
  appt: Appointment
  onEdit: () => void
  onDelete: () => void
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  return (
    <div className="bg-[var(--card)] rounded-2xl border-2 border-[var(--border)] p-4 space-y-3">
      <h2 className="font-bold text-lg text-[var(--foreground)]">
        {appt.title}
      </h2>

      <div className="flex items-center gap-2 text-sm">
        <span>🕐</span>
        <span className="font-semibold text-[var(--foreground)]">
          {appt.dateTime}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <span>📍</span>
        <span>{appt.location}</span>
      </div>

      {appt.assignee && (
        <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-xl px-3 py-2 text-sm flex items-center gap-2">
          <span aria-hidden="true">👤</span>
          <span className="font-semibold text-[var(--success-text)]">
            {appt.assignee}
          </span>
          <span className="text-[var(--success-text)] opacity-80">
            is assigned
          </span>
        </div>
      )}

      {appt.notes && (
        <div className="bg-[var(--muted)] rounded-xl px-3 py-2 text-sm text-[var(--muted-foreground)] flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">ℹ</span>
          <span>{appt.notes}</span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <TapButton
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onEdit}
          aria-label={`Edit ${appt.title}`}
        >
          ✎ Edit
        </TapButton>
        <TapButton
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => setDeleteConfirm(true)}
          aria-label={`Delete ${appt.title}`}
        >
          🗑 Delete
        </TapButton>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete appointment?"
          body="This will remove the appointment from Margaret's plan. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={() => {
            onDelete()
            setDeleteConfirm(false)
          }}
        />
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AppointmentsPage({
  state,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)

  return (
    <div className="px-4 py-5 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            📅 Manage Appointments
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Add, edit, or remove Margaret's upcoming appointments
          </p>
        </div>
        <TapButton variant="primary" size="md" onClick={() => setShowAdd(true)}>
          + Add
        </TapButton>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        {state.appointments.length === 0 && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 text-center md:col-span-2">
            <div className="text-4xl mb-3">📅</div>
            <p className="font-semibold text-[var(--foreground)]">
              No appointments yet
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Tap "+ Add" to schedule Margaret's first appointment.
            </p>
          </div>
        )}
        {state.appointments.map((appt) => (
          <ApptCard
            key={appt.id}
            appt={appt}
            onEdit={() => setEditingAppt(appt)}
            onDelete={() => onDelete(appt.id)}
          />
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <ApptForm
          onSave={(data) => {
            onAdd(data)
            setShowAdd(false)
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Edit form — pre-filled with the selected appointment */}
      {editingAppt && (
        <ApptForm
          initial={editingAppt}
          onSave={(data) => {
            onEdit(editingAppt.id, data)
            setEditingAppt(null)
          }}
          onCancel={() => setEditingAppt(null)}
        />
      )}
    </div>
  )
}
