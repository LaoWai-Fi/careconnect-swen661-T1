// Tests for the App root — route switching between landing, auth, and the
// signed-in shell, driven through the real React Navigation navigators.
//
// RNTL v14's fireEvent helpers return promises — every call is awaited so no
// act() scope is left dangling across tests.

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from '../../src/App';
import { seededInitialState } from '../../src/state/seed';
import { flushReact, testInitialMetrics } from '../../src/testing/test-utils';

/** App mounts its own AppStateProvider; tests inject state via the
 * initialState prop and only need the SafeArea wrapper (test metrics). */
function mountApp(initialState = seededInitialState()) {
  return render(
    <SafeAreaProvider initialMetrics={testInitialMetrics}>
      <App initialState={initialState} />
    </SafeAreaProvider>,
  );
}

describe('App routing', () => {
  test('starts on the landing screen', async () => {
    await mountApp();
    expect(screen.getByText('CareConnect')).toBeTruthy();
    expect(screen.getByText('Get started')).toBeTruthy();
  });

  test('Get started opens sign-up', async () => {
    await mountApp();
    await fireEvent.press(screen.getByText('Get started'));
    expect(await screen.findByText('Create your account')).toBeTruthy();
  });

  test('sign-up form signs in and lands on the dashboard', async () => {
    await mountApp();
    await fireEvent.press(screen.getByText('Get started'));
    await screen.findByText('Create your account');
    await fireEvent.changeText(screen.getByLabelText('e.g. Sarah Chen'), 'Sarah Chen');
    await fireEvent.changeText(screen.getByLabelText('you@example.com'), 'sarah@family.com');
    await fireEvent.changeText(screen.getByLabelText('At least 6 characters'), 'secret123');
    await fireEvent.changeText(screen.getByLabelText('Repeat your password'), 'secret123');
    await flushReact();
    await fireEvent.press(screen.getByText('Create account'));
    // Wait out the 700ms fake network delay inside act().
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    });
    expect(screen.getByText("Viewing Margaret's care plan")).toBeTruthy();
  });

  test('sign-in link goes to the sign-in screen', async () => {
    await mountApp();
    await fireEvent.press(screen.getByText('I already have an account'));
    expect(await screen.findByText('Welcome back')).toBeTruthy();
  });

  test('a signed-in user sees the shell; signing out returns to landing', async () => {
    const state = seededInitialState();
    state.userName = 'Sarah';
    await mountApp(state);
    expect(screen.getByText("Viewing Margaret's care plan")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Sign out'));
    await waitFor(() => {
      expect(screen.getByText('Get started')).toBeTruthy();
    });
  });

  test('tab navigation switches between screens', async () => {
    const state = seededInitialState();
    state.userName = 'Sarah';
    await mountApp(state);
    await fireEvent.press(screen.getByLabelText('Meds'));
    expect(await screen.findByText('1 of 3 taken today')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Appointments'));
    expect(await screen.findByText('3 upcoming')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Messages'));
    expect(await screen.findByText('2 unread')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Activity'));
    expect(await screen.findByText('No activity yet')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Dashboard'));
    expect(await screen.findByText('1 of 4 tasks done')).toBeTruthy();
  });
});
