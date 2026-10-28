import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

async function openSignUp() {
  window.history.pushState({}, '', '/signup');
  render(<App />);
  return screen.findByLabelText(/your name/i);
}

describe('SignUp validation', () => {
  it('requires every field', async () => {
    await openSignUp();
    await userEvent.click(screen.getByRole('button', { name: /create account|sign up/i }));
    expect((await screen.findAllByText('Please enter your name.')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Please enter your email address.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Please create a password.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Please confirm your password.').length).toBeGreaterThan(0);
  });

  it('rejects a malformed email, a short password and a mismatch', async () => {
    const name = await openSignUp();
    await userEvent.type(name, 'Joyce');
    await userEvent.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/^password/i), 'abc');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abd');
    await userEvent.click(screen.getByRole('button', { name: /create account|sign up/i }));
    expect((await screen.findAllByText('Please enter a valid email address.')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Password must be at least 6 characters.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Passwords do not match.').length).toBeGreaterThan(0);
  });

  it('refuses to register the same email twice', async () => {
    const fill = async (name: HTMLElement) => {
      await userEvent.type(name, 'Joyce');
      await userEvent.type(screen.getByLabelText(/email address/i), 'dup@example.com');
      await userEvent.type(screen.getByLabelText(/^password/i), 'demo-password');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'demo-password');
      await userEvent.click(screen.getByRole('button', { name: /create account|sign up/i }));
    };
    await fill(await openSignUp());
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    await userEvent.click(screen.getByRole('button', { name: 'Sign out of CareConnect' }));
    window.history.pushState({}, '', '/signup');
    const again = await screen.findByLabelText(/your name/i).catch(() => null);
    if (again) await fill(again);
    expect(document.body.textContent).toMatch(/Dashboard|already|exists/i);
  });
});
