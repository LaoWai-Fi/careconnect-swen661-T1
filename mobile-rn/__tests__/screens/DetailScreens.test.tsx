// Screen tests for the detail screens — stale-item guard, mark-taken,
// archive/unarchive, delete confirmation, and the archived list.

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import {
  AppointmentDetailScreen,
  ArchivedMessagesScreen,
  MedicationDetailScreen,
  MessageDetailScreen,
} from '../../src/screens/DetailScreens';
import { seededInitialState } from '../../src/state/seed';
import { TestAppProviders } from '../../src/testing/test-utils';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('MedicationDetailScreen', () => {
  test('shows the medication with its fields and marks taken', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <MedicationDetailScreen medicationId="m1" onBack={jest.fn()} />
      </TestAppProviders>,
    );
    expect(await screen.findByText('Amlodipine')).toBeTruthy();
    expect(screen.getByText('Not taken yet')).toBeTruthy();
    fireEvent.press(screen.getByText('Mark as taken'));
    await waitFor(() => {
      expect(screen.getByText('✓ Taken')).toBeTruthy();
    });
  });

  test('pops back when the medication no longer exists (stale item)', async () => {
    const onBack = jest.fn();
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <MedicationDetailScreen medicationId="gone" onBack={onBack} />
      </TestAppProviders>,
    );
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });
});

describe('AppointmentDetailScreen', () => {
  test('shows appointment fields and assignee chip', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <AppointmentDetailScreen appointmentId="a1" onBack={jest.fn()} />
      </TestAppProviders>,
    );
    expect(await screen.findByText('Blood pressure check — Dr. Sharma')).toBeTruthy();
    expect(screen.getByText('✓ Maria Thompson is assigned')).toBeTruthy();
    expect(screen.getByText('Today — 10:30 am')).toBeTruthy();
  });

  test('pops back on a stale appointment', async () => {
    const onBack = jest.fn();
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <AppointmentDetailScreen appointmentId="gone" onBack={onBack} />
      </TestAppProviders>,
    );
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });
});

describe('MessageDetailScreen', () => {
  test('shows the message and toggles read state', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <MessageDetailScreen messageId="msg1" onBack={jest.fn()} />
      </TestAppProviders>,
    );
    expect(await screen.findByText("Margaret's blood pressure results")).toBeTruthy();
    fireEvent.press(screen.getByText('Mark as read'));
    await waitFor(() => {
      expect(screen.getByText('Mark as unread')).toBeTruthy();
    });
  });

  test('archive moves the message out of the inbox', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <MessageDetailScreen messageId="msg1" onBack={jest.fn()} />
      </TestAppProviders>,
    );
    await screen.findByText("Margaret's blood pressure results");
    fireEvent.press(screen.getByText('🗄 Archive'));
    // The archived variant of the actions now shows Unarchive.
    await waitFor(() => {
      expect(screen.getByText('Unarchive')).toBeTruthy();
    });
  });

  test('delete confirms then removes the message', async () => {
    const onBack = jest.fn();
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <MessageDetailScreen messageId="msg1" onBack={onBack} />
      </TestAppProviders>,
    );
    await screen.findByText("Margaret's blood pressure results");
    fireEvent.press(screen.getByText('Delete'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete message',
      expect.stringContaining("Margaret's blood pressure results"),
      expect.anything(),
    );
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as {
      text: string;
      onPress?: () => void;
    }[];
    buttons.find((b) => b.text === 'Delete')!.onPress!();
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });

  test('reply opens the compose sheet prefilled with Re: subject', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <MessageDetailScreen messageId="msg1" onBack={jest.fn()} />
      </TestAppProviders>,
    );
    await screen.findByText("Margaret's blood pressure results");
    fireEvent.press(screen.getByText('↩ Reply'));
    expect(await screen.findByText('Reply')).toBeTruthy();
    expect(screen.getByText(/Dr\. Sharma wrote:/)).toBeTruthy();
  });
});

describe('ArchivedMessagesScreen', () => {
  test('empty state when nothing is archived', async () => {
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <ArchivedMessagesScreen onOpenMessage={jest.fn()} onBack={jest.fn()} />
      </TestAppProviders>,
    );
    expect(await screen.findByText('Nothing archived')).toBeTruthy();
  });

  test('lists archived messages after archiving one', async () => {
    const state = seededInitialState();
    state.messages[0].archived = true;
    await render(
      <TestAppProviders initialState={state}>
        <ArchivedMessagesScreen onOpenMessage={jest.fn()} onBack={jest.fn()} />
      </TestAppProviders>,
    );
    expect(await screen.findByText('Dr. Sharma')).toBeTruthy();
  });
});
