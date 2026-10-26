import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { persistSession } from '../auth/mockAuth';

const user = { id: 'u1', name: 'Joyce Adeyemi', email: 'joyce@example.com' };

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

describe('public routes', () => {
  it('shows the landing page with a caregiver-only audience', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Made for caregivers' })).toBeInTheDocument();
    expect(screen.queryByText(/for care recipients/i)).not.toBeInTheDocument();
  });

  it('redirects unknown paths to the landing page', async () => {
    renderAt('/does-not-exist');
    expect(await screen.findByRole('heading', { name: 'Made for caregivers' })).toBeInTheDocument();
  });

  it('keeps visitors out of the app', async () => {
    renderAt('/app');
    expect(await screen.findByRole('heading', { name: 'Made for caregivers' })).toBeInTheDocument();
  });
});

describe('sign-up and sign-in', () => {
  it('signs a caregiver up and goes straight to the dashboard with no role step', async () => {
    renderAt('/signup');
    await userEvent.type(await screen.findByLabelText(/your name/i), 'Joyce Adeyemi');
    await userEvent.type(screen.getByLabelText(/email address/i), 'joyce@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'demo-password');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'demo-password');
    await userEvent.click(screen.getByRole('button', { name: /create account|sign up/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /switch role/i })).not.toBeInTheDocument();
  });

  it('shows an error for an email with no account', async () => {
    renderAt('/signin');
    await userEvent.type(await screen.findByLabelText(/email address/i), 'nobody@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'demo-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/sign up first/i)).toBeInTheDocument();
  });
});

describe('signed-in routes', () => {
  beforeEach(() => persistSession({ user }));

  it.each(['/app', '/app/activity'])('renders legacy and unknown persisted events on %s', async (route) => {
    localStorage.setItem('careconnect_activity_log', JSON.stringify(['med_skipped', 'schedule_done', 'future_kind'].map((kind, index) => ({
      id: `legacy-${index}`, kind, label: `Previous event ${index}`, timestamp: new Date().toISOString(),
    }))));
    renderAt(route);
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Previous event 0')).toBeInTheDocument();
    expect(screen.getByText('Previous event 2')).toBeInTheDocument();
  });

  it.each([
    ['/app', 'Dashboard'],
    ['/app/manage-medications', 'Manage medications'],
    ['/app/manage-appointments', 'Manage appointments'],
    ['/app/activity', 'Activity log'],
  ])('renders %s', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: new RegExp(heading, 'i') })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Caregiver', { selector: '.web-role' })).toBeInTheDocument();
  });

  it('has no role switcher and navigates between caregiver screens', async () => {
    renderAt('/app');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    expect(screen.queryByRole('button', { name: /switch role/i })).not.toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    await userEvent.click(within(nav).getByRole('link', { name: /Medications/ }));
    expect(await screen.findByRole('heading', { level: 1, name: /manage medications/i })).toBeInTheDocument();
  });

  it('signs out and returns to the landing page', async () => {
    renderAt('/app');
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out of CareConnect' }));
    expect(await screen.findByRole('heading', { name: 'Made for caregivers' })).toBeInTheDocument();
  });
});
