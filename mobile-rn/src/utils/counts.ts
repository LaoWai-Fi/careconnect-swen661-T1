// Derived-count helpers — pure functions over the app state models.

import type { Message } from '../models/types';

/** Unread, non-archived message count — drives the nav badge. */
export function unreadMessageCount(messages: Message[]): number {
  return messages.filter((m) => !m.read && !m.archived).length;
}
