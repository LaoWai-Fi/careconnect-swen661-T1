import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { persistSession } from '../../auth/mockAuth';

function renderApp(path = '/app') {
  persistSession({ user: { id: 'u1', name: 'Joyce Adeyemi', email: 'joyce@example.com' } });
  window.history.pushState({}, '', path);
  return render(<App />);
}

describe('Layout shell', () => {
  it('greets the caregiver by first name and names the care plan being viewed', async () => {
    renderApp();
    expect(await screen.findByText(/^Good (morning|afternoon|evening), Joyce$/)).toBeInTheDocument();
    expect(screen.getByText(/Viewing .+'s care plan/)).toBeInTheDocument();
    expect(screen.getByText('Caregiver', { selector: '.web-role' })).toBeInTheDocument();
  });

  it('opens and closes the keyboard help dialog', async () => {
    renderApp();
    await userEvent.click(await screen.findByRole('button', { name: 'Help and keyboard shortcuts' }));
    const dialog = await screen.findByRole('dialog', { name: 'Help and keyboard shortcuts' });
    expect(within(dialog).getByText(/Use Tab and Shift\+Tab/)).toBeInTheDocument();
    // jsdom does not fire the native cancel event for Escape, so close with the dialog button.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close dialog' }));
    expect(screen.queryByRole('dialog', { name: 'Help and keyboard shortcuts' })).not.toBeInTheDocument();
  });

  it('opens help from the quick navigation bar', async () => {
    renderApp();
    const quick = await screen.findByRole('navigation', { name: 'Quick navigation' });
    await userEvent.click(within(quick).getByRole('button', { name: 'Help' }));
    expect(await screen.findByRole('dialog', { name: 'Help and keyboard shortcuts' })).toBeInTheDocument();
  });

  it('finds a page from the search box and clears the field', async () => {
    renderApp();
    const box = await screen.findByLabelText('Find a page');
    await userEvent.type(box, 'messages{Enter}');
    expect(await screen.findByRole('heading', { level: 1, name: 'Messages' })).toBeInTheDocument();
    expect(screen.getByLabelText('Find a page')).toHaveValue('');
  });

  it('explains when no page matches the search', async () => {
    renderApp();
    await userEvent.type(await screen.findByLabelText('Find a page'), 'zzzz{Enter}');
    expect(await screen.findByText('No matching page. Try a navigation label.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('ignores an empty search', async () => {
    renderApp();
    await userEvent.type(await screen.findByLabelText('Find a page'), '   {Enter}');
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('toggles the tablet sidebar', async () => {
    renderApp();
    const toggle = await screen.findByRole('button', { name: /Collapse sidebar|Expand sidebar/ });
    const before = toggle.getAttribute('aria-expanded');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: /Collapse sidebar|Expand sidebar/ }).getAttribute('aria-expanded')).not.toBe(before);
  });

  it('opens the mobile navigation drawer and closes it after choosing a page', async () => {
    renderApp();
    await userEvent.click(await screen.findByRole('button', { name: 'Open navigation' }));
    const drawer = await screen.findByRole('dialog', { name: 'CareConnect navigation' });
    await userEvent.click(within(drawer).getByRole('link', { name: /Settings/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'CareConnect navigation' })).not.toBeInTheDocument();
  });

  it('links to contacts from the footer', async () => {
    renderApp();
    await userEvent.click(await screen.findByRole('link', { name: 'Caregiver and support contacts' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Contacts' })).toBeInTheDocument();
  });
});
