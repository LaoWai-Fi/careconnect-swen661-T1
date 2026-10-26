import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstallPrompt from '../../components/InstallPrompt';

function fireInstallEvent(prompt: () => Promise<void> = () => Promise.resolve()) {
  const evt = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  };
  evt.prompt = prompt;
  evt.userChoice = Promise.resolve({ outcome: 'accepted' });
  act(() => { window.dispatchEvent(evt); });
}

describe('InstallPrompt', () => {
  it('renders nothing until the browser offers installation', () => {
    render(<InstallPrompt />);
    expect(screen.queryByRole('region', { name: 'Install CareConnect' })).not.toBeInTheDocument();
  });

  it('offers installation and dismisses for later', async () => {
    render(<InstallPrompt />);
    fireInstallEvent();
    expect(await screen.findByRole('heading', { name: 'Install CareConnect' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('heading', { name: 'Install CareConnect' })).not.toBeInTheDocument();
    expect(Number(localStorage.getItem('careconnect_install_dismissed_until'))).toBeGreaterThan(Date.now());
  });

  it('runs the install flow', async () => {
    const prompt = jest.fn().mockResolvedValue(undefined);
    render(<InstallPrompt />);
    fireInstallEvent(prompt);
    await userEvent.click(await screen.findByRole('button', { name: 'Install' }));
    expect(prompt).toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Install CareConnect' })).not.toBeInTheDocument();
  });

  it('shows an error when installation cannot start', async () => {
    render(<InstallPrompt />);
    fireInstallEvent(() => Promise.reject(new Error('blocked')));
    await userEvent.click(await screen.findByRole('button', { name: 'Install' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not start/i);
  });

  it('hides after the app is installed and stays hidden while dismissed', async () => {
    localStorage.setItem('careconnect_install_dismissed_until', String(Date.now() + 100000));
    render(<InstallPrompt />);
    fireInstallEvent();
    expect(screen.queryByRole('heading', { name: 'Install CareConnect' })).not.toBeInTheDocument();
  });
});
