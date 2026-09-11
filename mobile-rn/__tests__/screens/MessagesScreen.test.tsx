// Screen tests for MessagesScreen — inbox list, read/unread toggle, archive
// entry point, and the compose sheet's reply prefill.

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { MessagesScreen } from '../../src/screens/MessagesScreen';
import { seededInitialState } from '../../src/state/seed';
import { TestAppProviders } from '../../src/testing/test-utils';

function renderMessages() {
  return render(
    <TestAppProviders initialState={seededInitialState()}>
      <MessagesScreen onOpenMessage={jest.fn()} onOpenArchive={jest.fn()} />
    </TestAppProviders>,
  );
}

describe('MessagesScreen', () => {
  test('renders active (non-archived) messages with unread count', async () => {
    await renderMessages();
    expect(screen.getByText('Dr. Sharma')).toBeTruthy();
    expect(screen.getByText('Emma Thompson')).toBeTruthy();
    expect(screen.getByText('Vision Plus Opticians')).toBeTruthy();
    expect(screen.getByText('2 unread')).toBeTruthy();
  });

  test('read-dot toggle flips read state', async () => {
    await renderMessages();
    // msg1 is unread → its dot says "mark as read".
    fireEvent.press(screen.getByLabelText('Mark message from Dr. Sharma as read'));
    await waitFor(() => {
      expect(screen.getByText('1 unread')).toBeTruthy();
    });
  });

  test('archive entry point navigates to the archived list', async () => {
    const onOpenArchive = jest.fn();
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <MessagesScreen onOpenMessage={jest.fn()} onOpenArchive={onOpenArchive} />
      </TestAppProviders>,
    );
    fireEvent.press(screen.getByText('🗄 Archive'));
    expect(onOpenArchive).toHaveBeenCalledTimes(1);
  });

  test('opening a message marks it read and calls onOpenMessage', async () => {
    const onOpenMessage = jest.fn();
    await render(
      <TestAppProviders initialState={seededInitialState()}>
        <MessagesScreen onOpenMessage={onOpenMessage} onOpenArchive={jest.fn()} />
      </TestAppProviders>,
    );
    // The row content (not the dot) opens the message.
    fireEvent.press(
      screen.getByLabelText("Unread message from Dr. Sharma: Margaret's blood pressure results"),
    );
    expect(onOpenMessage).toHaveBeenCalledWith('msg1');
    await waitFor(() => {
      expect(screen.getByText('1 unread')).toBeTruthy();
    });
  });
});
