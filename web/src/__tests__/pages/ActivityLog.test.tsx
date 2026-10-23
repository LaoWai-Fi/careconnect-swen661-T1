import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityLog from '../../pages/ActivityLog';
import { appendActivityEvent } from '../../data/caregiverStore';

describe('ActivityLog', () => {
  it('shows an empty state before anything is recorded', () => {
    render(<ActivityLog />);
    expect(screen.getByRole('heading', { level: 1, name: /activity log/i })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Activity type legend' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /^Events for/ })).not.toBeInTheDocument();
  });

  it('groups recorded events by day, newest first', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86_400_000);
    appendActivityEvent({ kind: 'med_taken', label: 'Older dose taken', timestamp: yesterday.toISOString() });
    appendActivityEvent({ kind: 'check_in', label: 'Margaret checked in', timestamp: now.toISOString() });
    render(<ActivityLog />);
    expect(screen.getByText('Margaret checked in')).toBeInTheDocument();
    expect(screen.getByText('Older dose taken')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /Events for Today/ })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /Events for Yesterday/ })).toBeInTheDocument();
  });

  it('refreshes when the refresh button is pressed', async () => {
    render(<ActivityLog />);
    appendActivityEvent({ kind: 'task_completed', label: 'Added Aspirin', timestamp: new Date().toISOString() });
    await userEvent.click(screen.getByRole('button', { name: 'Refresh activity log' }));
    expect(await screen.findByText('Added Aspirin')).toBeInTheDocument();
  });
});
