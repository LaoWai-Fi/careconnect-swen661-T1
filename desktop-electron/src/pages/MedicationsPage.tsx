import { useState } from 'react';
import TapButton from '../components/TapButton';
import { useFocusTrap } from '../useFocusTrap';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField, { Input } from '../components/FormField';
import type { AppState, Medication } from '../types';

/** Medication times every 15 minutes, in the care plan's "8:30 am" format. */
export const TIME_OPTIONS: string[] = Array.from({ length: 96 }, (_, i) => {
  const h24 = Math.floor(i / 4);
  const m = (i % 4) * 15;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'am' : 'pm'}`;
});
const DEFAULT_TIME = '8:30 am';

/** The list, plus the current value if it is not on the 15 minute grid. */
export function timeOptions(current: string): string[] {
  return current && !TIME_OPTIONS.includes(current) ? [current, ...TIME_OPTIONS] : TIME_OPTIONS;
}


interface Props {
  state: AppState;
  onAdd: (med: Omit<Medication, 'id' | 'taken'>) => void;
  onDelete: (id: string) => void;
  onToggleTaken: (id: string) => void;
}

function MedCard({
  med,
  onEdit,
  onDelete,
  onToggle,
}: {
  med: Medication;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [feedback, setFeedback] = useState('');

  function handleToggle() {
    onToggle();
    setFeedback(med.taken ? '↩ Marked as not taken' : '✓ Marked as taken!');
    setTimeout(() => setFeedback(''), 2500);
  }

  return (
    <div className={`bg-[var(--card)] rounded-2xl border-2 p-4 space-y-3 ${med.taken ? 'border-[var(--success-border)]' : 'border-[var(--border)]'}`}>
      <div className="flex items-start gap-2 justify-between">
        <div>
          <h2 className="font-bold text-lg text-[var(--foreground)]">{med.name}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{med.dose}</p>
        </div>
        <button
          onClick={handleToggle}
          className={`text-2xl mt-0.5 active:scale-90 transition-transform focus-visible:outline-2 focus-visible:outline-[var(--ring)]`}
          aria-label={`${med.name}: ${med.taken ? 'mark as not taken' : 'mark as taken'}`}
          aria-pressed={med.taken}
        >
          {med.taken ? '✅' : '⭕'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 bg-[var(--info-bg)] text-[var(--info-text)] rounded-full px-3 py-1 text-sm font-semibold">
          🕐 {med.time}
        </span>
      </div>

      {med.notes && (
        <p className="text-sm italic text-[var(--muted-foreground)]">{med.notes}</p>
      )}

      {feedback && (
        <p className="text-sm font-semibold text-[var(--success-text)] bg-[var(--success-bg)] rounded-lg px-3 py-1.5" role="status" aria-live="polite">
          {feedback}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <TapButton variant="outline" size="sm" onClick={onEdit} className="flex-1" aria-label={`Edit ${med.name}`}>
          ✎ Edit
        </TapButton>
        <TapButton variant="destructive" size="sm" onClick={onDelete} className="flex-1" aria-label={`Delete ${med.name}`}>
          🗑 Delete
        </TapButton>
      </div>
    </div>
  );
}

interface FormState {
  name: string;
  dose: string;
  time: string;
  notes: string;
}

function MedForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial ?? { name: '', dose: '', time: DEFAULT_TIME, notes: '' }
  );
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saved, setSaved] = useState(false);
  const dialogRef = useFocusTrap(true, onCancel);

  function set(k: keyof FormState, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<FormState> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.dose.trim()) errs.dose = 'Required';
    if (!form.time) errs.time = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaved(true);
    setTimeout(() => { onSave(form); setSaved(false); }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="med-form-title"
        className="relative bg-[var(--card)] w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="med-form-title" className="text-xl font-bold">{initial ? 'Edit medication' : 'Add new medication'}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--muted)] font-bold text-[var(--muted-foreground)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Medication name" required error={errors.name}>
            <Input
              placeholder="e.g. Amlodipine"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={!!errors.name}
            />
          </FormField>
          <FormField label="Dose" required hint="Include strength, form, and quantity." error={errors.dose}>
            <Input
              placeholder="e.g. 5 mg — 1 tablet"
              value={form.dose}
              onChange={(e) => set('dose', e.target.value)}
              error={!!errors.dose}
            />
          </FormField>
          <FormField label="Schedule time" required error={errors.time}>
            {/* A plain list instead of the native time field: fully keyboard and
                screen reader operable, no picker popup, same "8:30 am" format
                as the rest of the care plan. */}
            <select
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
              aria-invalid={errors.time ? true : undefined}
              className={`w-full px-4 py-3 text-base rounded-xl border-2 bg-[var(--card)] text-[var(--foreground)] min-h-[52px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2 ${errors.time ? 'border-[var(--destructive)]' : 'border-[var(--border)] focus:border-[var(--primary)]'}`}
            >
              {timeOptions(form.time).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Take with food"
              rows={3}
              className="w-full px-4 py-3 text-base rounded-xl border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:outline-none focus:border-[var(--primary)] focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] resize-none min-h-[100px]"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <TapButton variant="outline" size="lg" onClick={onCancel} className="flex-1">Cancel</TapButton>
            <TapButton type="submit" variant="primary" size="lg" className="flex-1" disabled={saved}>
              {saved ? '✓ Saved!' : initial ? 'Save changes' : 'Add medication'}
            </TapButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MedicationsPage({ state, onAdd, onDelete, onToggleTaken }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editMed, setEditMed] = useState<Medication | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  return (
    <div className="px-4 py-5 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            💊 Manage medications
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Add, edit, or remove Margaret's prescriptions</p>
        </div>
        <TapButton variant="primary" size="md" onClick={() => setShowForm(true)}>
          + Add
        </TapButton>
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        {state.medications.length === 0 && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 text-center md:col-span-2">
            <div className="text-4xl mb-3">💊</div>
            <p className="font-semibold text-[var(--foreground)]">No medications yet</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Tap "Add" to add Margaret's first prescription.</p>
          </div>
        )}
        {state.medications.map((med) => (
          <MedCard
            key={med.id}
            med={med}
            onEdit={() => setEditMed(med)}
            onDelete={() => setDeleteConfirm(med.id)}
            onToggle={() => onToggleTaken(med.id)}
          />
        ))}
      </div>

      {showForm && (
        <MedForm
          onSave={(data) => { onAdd(data); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editMed && (
        <MedForm
          initial={{ name: editMed.name, dose: editMed.dose, time: editMed.time, notes: editMed.notes }}
          onSave={(data) => {
            onAdd(data);
            onDelete(editMed.id);
            setEditMed(null);
          }}
          onCancel={() => setEditMed(null)}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete medication?"
          body="This will remove the medication from Margaret's plan. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }}
        />
      )}
    </div>
  );
}

