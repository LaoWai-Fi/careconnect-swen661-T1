import { useState } from 'react';
import TapButton from '../components/TapButton';
import type { AppState, ActivityEntry } from '../types';

const TYPE_COLORS: Record<ActivityEntry['type'], { dot: string; label: string; bg: string }> = {
  medication_taken:   { dot: 'bg-green-500', label: 'Medication taken',    bg: 'bg-[var(--success-bg)] border-[var(--success-border)]' },
  medication_unmarked:{ dot: 'bg-amber-400', label: 'Medication unmarked', bg: 'bg-[var(--warning-bg)] border-[var(--warning-border)]' },
  task_completed:     { dot: 'bg-[var(--primary)]', label: 'Task completed', bg: 'bg-[var(--info-bg)] border-[var(--info-border)]' },
  checked_in:         { dot: 'bg-green-500', label: 'Checked in',          bg: 'bg-[var(--success-bg)] border-[var(--success-border)]' },
  check_in_undone:    { dot: 'bg-amber-400', label: 'Check-in undone',     bg: 'bg-[var(--warning-bg)] border-[var(--warning-border)]' },
};

interface Props {
  state: AppState;
  onAddEntry: (entry: Omit<ActivityEntry, 'id'>) => void;
}

export default function ActivityPage({ state, onAddEntry }: Props) {
  const [activeFilter, setActiveFilter] = useState<ActivityEntry['type'] | 'all'>('all');
  const [refreshed, setRefreshed] = useState(false);

  function handleRefresh() {
    setRefreshed(true);
    onAddEntry({
      type: 'checked_in',
      description: 'Margaret checked in via dashboard',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    });
    setTimeout(() => setRefreshed(false), 2000);
  }

  const filtered =
    activeFilter === 'all'
      ? state.activity
      : state.activity.filter((e) => e.type === activeFilter);

  const filterTypes = [
    { id: 'medication_taken' as const,   label: 'Medication taken',    dot: 'bg-green-500' },
    { id: 'medication_unmarked' as const, label: 'Medication unmarked', dot: 'bg-amber-400' },
    { id: 'task_completed' as const,     label: 'Task completed',       dot: 'bg-[var(--primary)]' },
    { id: 'checked_in' as const,         label: 'Checked in',           dot: 'bg-green-500' },
    { id: 'check_in_undone' as const,    label: 'Check-in undone',      dot: 'bg-amber-400' },
  ];

  const pillBase = 'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]';
  const pillActive = 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]';
  const pillIdle = 'bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]';

  return (
    <div className="px-4 py-5 space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
          📈 Activity log
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Margaret's recent actions — medications taken, check-ins, and tasks
        </p>
      </div>

      <TapButton variant="outline" size="md" onClick={handleRefresh} disabled={refreshed}>
        {refreshed ? '✓ Refreshed!' : '↺ Refresh'}
      </TapButton>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter activity">
        <button
          onClick={() => setActiveFilter('all')}
          aria-pressed={activeFilter === 'all'}
          className={`${pillBase} ${activeFilter === 'all' ? pillActive : pillIdle}`}
        >
          All
        </button>
        {filterTypes.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            aria-pressed={activeFilter === f.id}
            className={`${pillBase} ${activeFilter === f.id ? pillActive : pillIdle}`}
          >
            <span className={`w-2 h-2 rounded-full ${f.dot}`} aria-hidden="true" />
            {f.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-10 text-center space-y-2">
          <div className="text-4xl" aria-hidden="true">ℹ</div>
          <p className="font-semibold text-[var(--foreground)]">No activity yet</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Events will appear here when Margaret takes medications, completes tasks, or checks in.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
          {filtered.map((entry) => {
            const style = TYPE_COLORS[entry.type];
            return (
              <div key={entry.id} className={`flex items-start gap-3 rounded-xl border p-4 ${style.bg}`}>
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{style.label}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{entry.description}</p>
                </div>
                <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0 mt-0.5">{entry.timestamp}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
