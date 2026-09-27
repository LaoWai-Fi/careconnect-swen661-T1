import { useState } from 'react';
import TapButton from '../components/TapButton';
import FormField, { Input } from '../components/FormField';
import type { AppState, Appointment } from '../types';

interface Props {
  state: AppState;
  onAdd: (appt: Omit<Appointment, 'id'>) => void;
  onEdit: (id: string, appt: Omit<Appointment, 'id'>) => void;
  onDelete: (id: string) => void;
}

// ── Shared Add / Edit form ──────────────────────────────────────────────────

interface ApptFormProps {
  initial?: Appointment;
  onSave: (data: Omit<Appointment, 'id'>) => void;
  onCancel: () => void;
}

function ApptForm({ initial, onSave, onCancel }: ApptFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [dateTime, setDateTime] = useState(initial?.dateTime ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [assignee, setAssignee] = useState(initial?.assignee ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const isEdit = !!initial;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Required';
    if (!dateTime.trim()) errs.dateTime = 'Required';
    if (!location.trim()) errs.location = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaved(true);
    setTimeout(() => { onSave({ title, dateTime, location, assignee, notes }); setSaved(false); }, 500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-[var(--card)] w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto -mt-1 mb-1" />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {isEdit ? 'Edit appointment' : 'Add appointment'}
          </h2>
          <button
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

          <FormField label="Date and time" required error={errors.dateTime}
            hint="Type a date like 'Monday 22 June — 2:00 pm' or use the date picker.">
            <Input
              placeholder="e.g. Monday 22 June — 2:00 pm"
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
            <TapButton variant="outline" size="lg" onClick={onCancel} className="flex-1">
              Cancel
            </TapButton>
            <TapButton type="submit" variant="primary" size="lg" className="flex-1" disabled={saved}>
              {saved ? '✓ Saved!' : isEdit ? 'Save changes' : 'Add appointment'}
            </TapButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Appointment card ────────────────────────────────────────────────────────

function ApptCard({
  appt,
  onEdit,
  onDelete,
}: {
  appt: Appointment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="bg-[var(--card)] rounded-2xl border-2 border-[var(--border)] p-4 space-y-3">
      <h3 className="font-bold text-lg text-[var(--foreground)]">{appt.title}</h3>

      <div className="flex items-center gap-2 text-sm">
        <span>🕐</span>
        <span className="font-semibold text-[var(--foreground)]">{appt.dateTime}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <span>📍</span>
        <span>{appt.location}</span>
      </div>

      {appt.assignee && (
        <div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-xl px-3 py-2 text-sm flex items-center gap-2">
          <span aria-hidden="true">👤</span>
          <span className="font-semibold text-[var(--success-text)]">{appt.assignee}</span>
          <span className="text-[var(--success-text)] opacity-80">is assigned</span>
        </div>
      )}

      {appt.notes && (
        <div className="bg-[var(--muted)] rounded-xl px-3 py-2 text-sm text-[var(--muted-foreground)] flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">ℹ</span>
          <span>{appt.notes}</span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <TapButton variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          ✎ Edit
        </TapButton>
        <TapButton variant="destructive" size="sm" className="flex-1" onClick={() => setDeleteConfirm(true)}>
          🗑 Delete
        </TapButton>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-[var(--card)] w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold">Delete appointment?</h2>
            <p className="text-[var(--muted-foreground)] text-sm">
              This will remove the appointment from Margaret's plan. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <TapButton variant="outline" size="lg" onClick={() => setDeleteConfirm(false)} className="flex-1">
                Cancel
              </TapButton>
              <TapButton
                variant="destructive"
                size="lg"
                onClick={() => { onDelete(); setDeleteConfirm(false); }}
                className="flex-1"
              >
                Delete
              </TapButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AppointmentsPage({ state, onAdd, onEdit, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  return (
    <div className="px-4 py-5 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">📅 Manage Appointments</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Add, edit, or remove Margaret's upcoming appointments</p>
        </div>
        <TapButton variant="primary" size="md" onClick={() => setShowAdd(true)}>+ Add</TapButton>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        {state.appointments.length === 0 && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 text-center md:col-span-2">
            <div className="text-4xl mb-3">📅</div>
            <p className="font-semibold text-[var(--foreground)]">No appointments yet</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Tap "+ Add" to schedule Margaret's first appointment.</p>
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
          onSave={(data) => { onAdd(data); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Edit form — pre-filled with the selected appointment */}
      {editingAppt && (
        <ApptForm
          initial={editingAppt}
          onSave={(data) => { onEdit(editingAppt.id, data); setEditingAppt(null); }}
          onCancel={() => setEditingAppt(null)}
        />
      )}
    </div>
  );
}
