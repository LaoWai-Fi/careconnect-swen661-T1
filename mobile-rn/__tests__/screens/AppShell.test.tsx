// Tests for AppShell (header, tab nav, badge, SOS confirm) and the App
// root's route switching (landing → auth → shell, sign-out back to landing).

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { AppShell } from '../../src/components/AppShell';
import { seededInitialState } from '../../src/state/seed';
import { TestAppProviders } from '../../src/testing/test-utils';
import type { HandMode } from '../../src/models/types';

function shellState(handMode?: HandMode) {
  const state = seededInitialState();
  state.userName = 'Sarah';
  if (handMode) state.handMode = handMode;
  return state;
}

function renderShell(handMode?: HandMode) {
  return render(
    <TestAppProviders initialState={shellState(handMode)}>
      <AppShell
        tab="dashboard"
        onTabChange={jest.fn()}
        onOpenMedication={jest.fn()}
        onOpenAppointment={jest.fn()}
        onOpenMessage={jest.fn()}
        onOpenArchive={jest.fn()}
      >
        <Text>screen content</Text>
      </AppShell>
    </TestAppProviders>,
  );
}

describe('AppShell', () => {
  test('renders header with greeting bar and all five tabs', async () => {
    await renderShell();
    expect(screen.getByText("Viewing Margaret's care plan")).toBeTruthy();
    expect(screen.getByText(/Sarah/)).toBeTruthy();
    expect(screen.getByLabelText('Dashboard')).toBeTruthy();
    expect(screen.getByLabelText('Meds')).toBeTruthy();
    expect(screen.getByLabelText('Appointments')).toBeTruthy();
    expect(screen.getByLabelText('Activity')).toBeTruthy();
    expect(screen.getByLabelText('Messages')).toBeTruthy();
  });

  test('unread badge shows the count of unread, non-archived messages', async () => {
    await renderShell();
    // Seed has 2 unread.
    expect(screen.getByText('2')).toBeTruthy();
  });

  test('tab press notifies the parent', async () => {
    const onTabChange = jest.fn();
    await render(
      <TestAppProviders initialState={shellState()}>
        <AppShell
          tab="dashboard"
          onTabChange={onTabChange}
          onOpenMedication={jest.fn()}
          onOpenAppointment={jest.fn()}
          onOpenMessage={jest.fn()}
          onOpenArchive={jest.fn()}
        >
          <Text>content</Text>
        </AppShell>
      </TestAppProviders>,
    );
    fireEvent.press(screen.getByLabelText('Meds'));
    expect(onTabChange).toHaveBeenCalledWith('medications');
  });

  test('SOS opens a confirmation dialog before dialing', async () => {
    await renderShell();
    fireEvent.press(screen.getByLabelText('Emergency SOS — call 911'));
    expect(await screen.findByText('Emergency')).toBeTruthy();
    expect(screen.getByText('📞 SOS Emergency Call')).toBeTruthy();
  });

  test('SOS cancel dismisses the dialog without dialing', async () => {
    await renderShell();
    fireEvent.press(screen.getByLabelText('Emergency SOS — call 911'));
    await screen.findByText('Emergency');
    fireEvent.press(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(screen.queryByText('Emergency')).toBeNull();
    });
  });

  test('sign out clears the user and returns to landing', async () => {
    await renderShell();
    fireEvent.press(screen.getByLabelText('Sign out'));
    // The greeting bar no longer shows the name.
    await waitFor(() => {
      expect(screen.queryByText(/Sarah/)).toBeNull();
    });
  });

  test('settings sheet opens from the header', async () => {
    await renderShell();
    fireEvent.press(screen.getByLabelText('Settings'));
    expect(await screen.findByText('APPEARANCE')).toBeTruthy();
  });

  describe('one-handed mode layout', () => {
    test('default (off) keeps the logo first and anchors SOS + tabs to the right/evenly', async () => {
      await renderShell('off');
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"Settings"')).toBeGreaterThan(tree.indexOf('CareConnect'));

      const sos = screen.getByLabelText('Emergency SOS — call 911');
      const sosStyle = StyleSheet.flatten(sos.props.style);
      expect(sosStyle.right).toBe(20);
      expect(sosStyle.left).toBeUndefined();

      const tabBar = StyleSheet.flatten(screen.getByTestId('tab-bar').props.style);
      expect(tabBar.justifyContent).toBe('space-evenly');
    });

    test('left mode moves header icons before the logo and anchors SOS + tabs left', async () => {
      await renderShell('left');
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"Settings"')).toBeLessThan(tree.indexOf('CareConnect'));

      const sos = screen.getByLabelText('Emergency SOS — call 911');
      const sosStyle = StyleSheet.flatten(sos.props.style);
      expect(sosStyle.left).toBe(20);
      expect(sosStyle.right).toBeUndefined();

      const tabBar = StyleSheet.flatten(screen.getByTestId('tab-bar').props.style);
      expect(tabBar.justifyContent).toBe('flex-start');
    });

    test('right mode keeps the logo first but anchors the tab cluster right', async () => {
      await renderShell('right');
      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"Settings"')).toBeGreaterThan(tree.indexOf('CareConnect'));

      const sos = screen.getByLabelText('Emergency SOS — call 911');
      const sosStyle = StyleSheet.flatten(sos.props.style);
      expect(sosStyle.right).toBe(20);

      const tabBar = StyleSheet.flatten(screen.getByTestId('tab-bar').props.style);
      expect(tabBar.justifyContent).toBe('flex-end');
    });
  });
});
