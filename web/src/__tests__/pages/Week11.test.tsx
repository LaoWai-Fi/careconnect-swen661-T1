import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import Settings from '../../pages/Settings';
import { PreferencesProvider } from '../../context/PreferencesContext';
import { persistSession } from '../../auth/mockAuth';
function app(route: string) {
  persistSession({ user: { id: 'week11-test', name: 'Demo Caregiver', email: 'demo@example.com' } });
  window.history.pushState({}, '', route); return render(<App />);
}
describe('Week 11 implementation', () => {
  it('applies saved display settings and restores defaults', async () => {
    render(<PreferencesProvider><Settings /></PreferencesProvider>);
    await userEvent.selectOptions(screen.getByLabelText('Theme'), 'dark');
    await userEvent.selectOptions(screen.getByLabelText('Text size'), 'large');
    await userEvent.selectOptions(screen.getByLabelText('One-handed controls'), 'left');
    await userEvent.click(screen.getByLabelText('Stronger borders and focus'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem('careconnect_web_preferences')!).handMode).toBe('left');
    await userEvent.click(screen.getByRole('button', { name: 'Restore default settings' }));
    expect(screen.getByLabelText('Text size')).toHaveValue('normal');
  });
  it('recovers saved settings and safe widget defaults', () => {
    localStorage.setItem('careconnect_web_preferences', JSON.stringify({ theme: 'invalid', fontSize: 'invalid', handMode: 'invalid', widgets: [{ id: 'messages', enabled: false }, { id: 'messages' }, { id: 'bad' }, null] }));
    render(<PreferencesProvider><Settings /></PreferencesProvider>);
    expect(screen.getByLabelText('Theme')).toHaveValue('system');
  });
  it('contains a configurable dashboard with keyboard reordering controls', async () => {
    app('/app'); await userEvent.click(await screen.findByRole('button', { name: 'Customize dashboard' }));
    const dialog = screen.getByRole('dialog', { name: 'Customize dashboard' });
    await userEvent.click(within(dialog).getByLabelText('Unread messages'));
    await userEvent.click(within(dialog).getByRole('button', { name: "Move Today's medications up" }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close customization' }));
    expect(screen.queryByRole('heading', { name: 'Unread messages' })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('careconnect_web_preferences')!).widgets[0].id).toBe('medications');
  });
  it('validates and saves a local demo message, then deletes it', async () => {
    app('/app/messages/compose');
    await userEvent.click(await screen.findByRole('button', { name: 'Save demo message' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a recipient');
    await userEvent.type(screen.getByLabelText(/^To/), 'Fictional contact');
    await userEvent.type(screen.getByLabelText(/^Subject/), 'Test message');
    await userEvent.type(screen.getByLabelText(/^Message/), 'Only a local demonstration');
    await userEvent.click(screen.getByRole('button', { name: 'Save demo message' }));
    await userEvent.click(await screen.findByRole('link', { name: 'Test message' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete message' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm delete' }));
    expect(screen.queryByRole('link', { name: 'Test message' })).not.toBeInTheDocument();
  });
  it('archives and restores a message and opens a reply', async () => {
    app('/app/messages');
    await userEvent.click(await screen.findByRole('button', { name: 'Archive Welcome to your demo care plan' }));
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Message folders' })).getByRole('link', { name: 'Archive' }));
    await userEvent.click(screen.getByRole('button', { name: 'Unarchive Welcome to your demo care plan' }));
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Message folders' })).getByRole('link', { name: 'Inbox' }));
    await userEvent.click(screen.getByRole('button', { name: 'Mark as read: Welcome to your demo care plan' }));
    await userEvent.click(screen.getByRole('link', { name: 'Welcome to your demo care plan' }));
    await userEvent.click(screen.getByRole('link', { name: 'Reply' }));
    expect(screen.getByLabelText(/^Subject/)).toHaveValue('Re: Welcome to your demo care plan');
  });
});
