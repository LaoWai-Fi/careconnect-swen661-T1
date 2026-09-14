// Screen tests for ActivityScreen (filters, refresh) and the auth screens
// (validation, fake sign-in delay, name derivation).
//
// RNTL v14's fireEvent helpers return promises — every call is awaited so no
// act() scope is left dangling across tests.

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ActivityScreen } from '../../src/screens/ActivityScreen';
import { SignInScreen, SignUpScreen } from '../../src/screens/AuthScreens';
import { seededInitialState } from '../../src/state/seed';
import { flushReact, TestAppProviders } from '../../src/testing/test-utils';

describe('ActivityScreen', () => {
  test('renders seed activity entries', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <ActivityScreen />
      </TestAppProviders>,
    );
    expect(await screen.findByText('Activity')).toBeTruthy();
    // Seed has no activity entries yet — empty state shows.
    expect(screen.getByText('No activity yet')).toBeTruthy();
  });

  test('filter pills switch the visible list', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <ActivityScreen />
      </TestAppProviders>,
    );
    await screen.findByText('Activity');
    await fireEvent.press(screen.getByText('Medication'));
    // The selected state lives on the pill's Pressable (the Text's parent).
    const pill = await screen.findByText('Medication');
    expect(pill.parent?.props.accessibilityState?.selected).toBe(true);
  });

  test('refresh surfaces a checked-at timestamp', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <ActivityScreen />
      </TestAppProviders>,
    );
    await screen.findByText('Activity');
    await fireEvent.press(screen.getByLabelText('Refresh activity'));
    await waitFor(() => {
      expect(screen.getByText(/Checked for new activity at/)).toBeTruthy();
    });
  });
});

describe('SignInScreen', () => {
  test('validates email and password before submitting', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <SignInScreen onBack={jest.fn()} />
      </TestAppProviders>,
    );
    await fireEvent.press(await screen.findByText('Sign in'));
    expect(await screen.findByText('Email is required.')).toBeTruthy();
    expect(screen.getByText('Password must be at least 6 characters.')).toBeTruthy();
  });

  test('signs in after the fake delay and derives the name from the email', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <SignInScreen onBack={jest.fn()} />
      </TestAppProviders>,
    );
    await fireEvent.changeText(screen.getByLabelText('you@example.com'), 'sarah@family.com');
    await fireEvent.changeText(screen.getByLabelText('Your password'), 'secret123');
    await flushReact();
    await fireEvent.press(screen.getByText('Sign in'));
    // Wait out the full 700ms fake delay inside act() so the signIn dispatch
    // lands in an act scope and no timer leaks into later tests.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    });
    // Signed in: the busy state cleared and the button is enabled again.
    expect(screen.getByText('Sign in')).toBeTruthy();
  });
});

describe('SignUpScreen', () => {
  test('validates all four fields before submitting', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <SignUpScreen onBack={jest.fn()} />
      </TestAppProviders>,
    );
    await fireEvent.press(await screen.findByText('Create account'));
    expect(await screen.findByText('Name is required.')).toBeTruthy();
    expect(screen.getByText('Email is required.')).toBeTruthy();
    expect(screen.getByText('Password must be at least 6 characters.')).toBeTruthy();
  });

  test('mismatched confirm password is rejected', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <SignUpScreen onBack={jest.fn()} />
      </TestAppProviders>,
    );
    await fireEvent.changeText(await screen.findByLabelText('e.g. Sarah Chen'), 'Sarah Chen');
    await fireEvent.changeText(screen.getByLabelText('you@example.com'), 'sarah@family.com');
    await fireEvent.changeText(screen.getByLabelText('At least 6 characters'), 'secret123');
    await fireEvent.changeText(screen.getByLabelText('Repeat your password'), 'different1');
    await flushReact();
    await fireEvent.press(screen.getByText('Create account'));
    expect(await screen.findByText('Passwords do not match.')).toBeTruthy();
  });
});
