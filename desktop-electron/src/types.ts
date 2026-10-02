export type Page =
  | 'landing'
  | 'signin'
  | 'signup'
  | 'dashboard'
  | 'medications'
  | 'appointments'
  | 'activity'
  | 'messages';

export type HandMode = 'off' | 'left' | 'right';

export interface Medication {
  id: string;
  name: string;
  dose: string;
  time: string;
  notes: string;
  taken: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  dateTime: string;
  location: string;
  assignee?: string;
  notes: string;
}

export interface ActivityEntry {
  id: string;
  type: 'medication_taken' | 'medication_unmarked' | 'task_completed' | 'checked_in' | 'check_in_undone';
  description: string;
  timestamp: string;
}

export interface DashboardWidget {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

export interface Message {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  attachments?: { name: string; type: string }[];
}

export interface AppState {
  page: Page;
  handMode: HandMode;
  userName: string;
  medications: Medication[];
  appointments: Appointment[];
  activity: ActivityEntry[];
  dashboardWidgets: DashboardWidget[];
  fontSize: 'normal' | 'large' | 'xlarge';
  checkedIn: boolean;
  theme: 'light' | 'dark' | 'system';
  messages: Message[];
  viewingMessageId: string | null;
}
