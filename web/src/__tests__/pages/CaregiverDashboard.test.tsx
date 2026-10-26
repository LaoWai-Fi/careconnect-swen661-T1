import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CaregiverDashboard from '../../pages/CaregiverDashboard';
import { getTodayMedications, getActivityLog } from '../../data/caregiverStore';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <CaregiverDashboard />
    </MemoryRouter>,
  );
}

// Seed data may already have some doses marked as taken, so pick one that is still open.
function firstUntaken() {
  const med = getTodayMedications().find((m) => !m.taken);
  if (!med) throw new Error('Seed data has no untaken medication');
  return med;
}

describe('CaregiverDashboard', () => {
  it('shows the status summary, medications and an empty activity timeline', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /status today/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Today's medications" })).toBeInTheDocument();
    expect(screen.getByText('No activity recorded yet.')).toBeInTheDocument();
    getTodayMedications().forEach((med) => {
      expect(screen.getByText(med.name)).toBeInTheDocument();
    });
  });

  it('marks a medication as taken, announces it and records activity', async () => {
    renderDashboard();
    const med = firstUntaken();
    await userEvent.click(screen.getByRole('button', { name: `Mark as taken: ${med.name}` }));

    expect(screen.getByRole('button', { name: `Undo: unmark ${med.name} as taken` })).toBeInTheDocument();
    expect(screen.getByText(`${med.name} marked as taken`, { selector: '[role="status"]' })).toBeInTheDocument();
    const timeline = screen.getByRole('list', { name: 'Recent activity timeline' });
    expect(within(timeline).getByText(`${med.name} marked as taken`)).toBeInTheDocument();
    expect(getActivityLog()[0].kind).toBe('med_taken');
  });

  it('undoes a taken medication', async () => {
    renderDashboard();
    const med = firstUntaken();
    await userEvent.click(screen.getByRole('button', { name: `Mark as taken: ${med.name}` }));
    await userEvent.click(screen.getByRole('button', { name: `Undo: unmark ${med.name} as taken` }));
    expect(screen.getByRole('button', { name: `Mark as taken: ${med.name}` })).toBeInTheDocument();
    expect(getActivityLog()[0].kind).toBe('med_unmarked');
  });

  it('records the daily check-in once', async () => {
    renderDashboard();
    await userEvent.click(screen.getByRole('button', { name: "Check in now: record Margaret's check-in" }));
    expect(screen.queryByRole('button', { name: "Check in now: record Margaret's check-in" })).not.toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(getActivityLog().filter((e) => e.kind === 'check_in')).toHaveLength(1);
  });

  it('counts tasks as medications taken plus the check-in', async () => {
    renderDashboard();
    const total = getTodayMedications().length + 1;
    expect(screen.getByText(new RegExp(`/${total} tasks done`))).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: "Check in now: record Margaret's check-in" }));
    const done = getTodayMedications().filter((m) => m.taken).length + 1;
    expect(screen.getByText(`${done}/${total} tasks done`)).toBeInTheDocument();
  });
});
