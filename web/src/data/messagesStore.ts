export interface DemoMessage {
  id: string; from: string; to: string; cc?: string; bcc?: string;
  subject: string; body: string; timestamp: string; read: boolean; archived: boolean;
  attachments?: string[];
}
const KEY = 'careconnect_demo_messages';
const initial: DemoMessage[] = [
  { id: 'welcome', from: 'Demo care coordinator', to: 'Caregiver', subject: 'Welcome to your demo care plan', body: 'This fictional inbox helps you try read, reply, archive and local composition. No messages are sent to a real service.', timestamp: '2026-10-21T09:00:00Z', read: false, archived: false },
  { id: 'visit', from: 'Demo family contact', to: 'Caregiver', subject: 'Planning the next visit', body: 'Please review the appointment list and update the assigned caregiver. This is demonstration content only.', timestamp: '2026-10-21T08:00:00Z', read: false, archived: false },
];
export function getMessages(): DemoMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial.map(message => ({ ...message }));
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    return values.filter((value): value is DemoMessage => Boolean(value && typeof value === 'object' &&
      ['id', 'from', 'to', 'subject', 'body', 'timestamp'].every(key => typeof value[key] === 'string') && Number.isFinite(Date.parse(value.timestamp))));
  } catch { return []; }
}
export function saveMessages(messages: DemoMessage[]): void {
  localStorage.setItem(KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event('careconnect:messages'));
}
export function updateMessage(id: string, patch: Partial<Pick<DemoMessage, 'read' | 'archived'>>): void {
  saveMessages(getMessages().map(message => message.id === id ? { ...message, ...patch } : message));
}
export function removeMessage(id: string): void { saveMessages(getMessages().filter(message => message.id !== id)); }
export function addMessage(message: Omit<DemoMessage, 'id' | 'timestamp' | 'read' | 'archived'>): void {
  saveMessages([{ ...message, id: crypto.randomUUID(), timestamp: new Date().toISOString(), read: true, archived: false }, ...getMessages()]);
}
