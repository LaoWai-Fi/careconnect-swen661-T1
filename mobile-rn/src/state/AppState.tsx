// Root app state — a React Context + useReducer port of the Flutter build's
// AppState (ChangeNotifier). Navigation is NOT tracked here: which screen is
// showing is owned by React Navigation, not by a field on this store. This
// module only holds app data and business logic.
//
// The reducer is pure and exported so Jest unit tests can drive it directly
// without rendering any React tree — the RN counterpart of the Flutter
// suite's app_state_test.dart.

import { createContext, useContext, useMemo, useReducer } from 'react';
import type {
  ActivityEntry,
  ActivityType,
  Appointment,
  DashboardWidget,
  FontScale,
  HandMode,
  Medication,
  Message,
  ThemeModeSetting,
} from '../models/types';
import { ALERT_MEDS_UNTAKEN, ALERT_NO_CHECK_IN, ALERT_APPOINTMENT_TODAY } from '../models/types';
import { formatClockTime } from '../utils/format';

export interface AppStateData {
  handMode: HandMode;
  userName: string;
  medications: Medication[];
  appointments: Appointment[];
  activity: ActivityEntry[];
  dashboardWidgets: DashboardWidget[];
  messages: Message[];
  fontSize: FontScale;
  checkedIn: boolean;
  theme: ThemeModeSetting;
  /** Ids of dashboard Alert cards the user has dismissed. Lives on the store
   * (not on the card component) so a dismissal survives navigating away and
   * back, and the Alerts count badge — computed from the same filtered list —
   * always agrees with the cards shown. */
  dismissedAlertIds: string[];
}

/** The name baked into the demo/seed data before anyone has signed in. Any
 * record still carrying it once a real name is known belongs to whoever just
 * signed in — see signIn(). */
const DEMO_USER_PLACEHOLDER = 'Maria Thompson';

export function createInitialState(now: () => Date = () => new Date()): AppStateData {
  return {
    handMode: 'off',
    userName: '',
    medications: [],
    appointments: [],
    activity: [],
    dashboardWidgets: [],
    messages: [],
    fontSize: 'normal',
    checkedIn: false,
    theme: 'system',
    dismissedAlertIds: [],
    // `now` is captured so activity/message timestamps are deterministic and
    // testable without depending on the wall clock.
    _now: now,
  } as AppStateData & { _now: () => Date };
}

// The clock is stored on the state object but never rendered; typed loosely
// here so the public interface stays clean.
type StateWithClock = AppStateData & { _now: () => Date };

export type AppAction =
  | { type: 'setHandMode'; mode: HandMode }
  | { type: 'setTheme'; theme: ThemeModeSetting }
  | { type: 'setFontScale'; scale: FontScale }
  | { type: 'signIn'; name: string }
  | { type: 'signOut' }
  | { type: 'checkIn' }
  | { type: 'dismissAlert'; id: string }
  | { type: 'toggleWidget'; id: string }
  | { type: 'reorderWidgets'; ordered: DashboardWidget[] }
  | { type: 'addMedication'; med: Medication }
  | { type: 'updateMedication'; id: string; updated: Medication }
  | { type: 'deleteMedication'; id: string }
  | { type: 'toggleMedTaken'; id: string }
  | { type: 'addAppointment'; appt: Appointment }
  | { type: 'updateAppointment'; id: string; updated: Appointment }
  | { type: 'deleteAppointment'; id: string }
  | { type: 'addActivity'; entry: ActivityEntry }
  | { type: 'sendMessage'; from: string; to: string; subject: string; body: string }
  | { type: 'markMessageRead'; id: string }
  | { type: 'toggleMessageRead'; id: string }
  | { type: 'archiveMessage'; id: string }
  | { type: 'unarchiveMessage'; id: string }
  | { type: 'deleteMessage'; id: string };

let uidCounter = 0;
function uid(): string {
  uidCounter += 1;
  return `id${uidCounter}${Date.now() % 100000}`;
}

// formatClockTime / unreadMessageCount live in src/utils/ now; re-exported
// here so existing deep imports keep working.
export { formatClockTime } from '../utils/format';
export { unreadMessageCount } from '../utils/counts';

function logActivity(state: StateWithClock, type: ActivityType, description: string): ActivityEntry[] {
  return [
    { id: uid(), type, description, timestamp: formatClockTime(state._now()) },
    ...state.activity,
  ];
}

export function appReducer(state: AppStateData, action: AppAction): AppStateData {
  const s = state as StateWithClock;

  switch (action.type) {
    case 'setHandMode':
      return { ...state, handMode: action.mode };

    case 'setTheme':
      return { ...state, theme: action.theme };

    case 'setFontScale':
      return { ...state, fontSize: action.scale };

    case 'signIn': {
      // Seed data is created once at startup with a placeholder name for "the
      // person using this app". Relabel anything still carrying that
      // placeholder to whoever actually just signed in/up.
      const appointments = state.appointments.map((a) =>
        a.assignee === DEMO_USER_PLACEHOLDER ? { ...a, assignee: action.name } : a,
      );
      const messages = state.messages.map((m) =>
        m.to === DEMO_USER_PLACEHOLDER ? { ...m, to: action.name } : m,
      );
      return { ...state, userName: action.name, appointments, messages };
    }

    case 'signOut':
      return {
        ...state,
        userName: '',
        handMode: 'off',
        checkedIn: false,
        dismissedAlertIds: [],
      };

    case 'checkIn': {
      if (state.checkedIn) return state;
      return {
        ...state,
        checkedIn: true,
        dismissedAlertIds: state.dismissedAlertIds.filter((id) => id !== ALERT_NO_CHECK_IN),
        activity: logActivity(s, 'checkedIn', 'Margaret checked in'),
      };
    }

    case 'dismissAlert':
      return {
        ...state,
        dismissedAlertIds: [...state.dismissedAlertIds, action.id],
      };

    case 'toggleWidget':
      return {
        ...state,
        dashboardWidgets: state.dashboardWidgets.map((w) =>
          w.id === action.id ? { ...w, enabled: !w.enabled } : w,
        ),
      };

    case 'reorderWidgets': {
      const ordered = action.ordered.map((w, i) => ({ ...w, order: i }));
      return { ...state, dashboardWidgets: ordered };
    }

    case 'addMedication':
      return {
        ...state,
        medications: [...state.medications, action.med],
        // A newly added medication may itself be untaken, which should surface
        // as a fresh alert even if an earlier one was already dismissed.
        dismissedAlertIds: state.dismissedAlertIds.filter((id) => id !== ALERT_MEDS_UNTAKEN),
        activity: logActivity(s, 'taskCompleted', `Added ${action.med.name} to Margaret's medications`),
      };

    case 'updateMedication':
      return {
        ...state,
        medications: state.medications.map((m) => (m.id === action.id ? action.updated : m)),
        dismissedAlertIds: state.dismissedAlertIds.filter((id) => id !== ALERT_MEDS_UNTAKEN),
      };

    case 'deleteMedication':
      return {
        ...state,
        medications: state.medications.filter((m) => m.id !== action.id),
        dismissedAlertIds: state.dismissedAlertIds.filter((id) => id !== ALERT_MEDS_UNTAKEN),
      };

    case 'toggleMedTaken': {
      let toggled: Medication | undefined;
      const medications = state.medications.map((m) => {
        if (m.id !== action.id) return m;
        toggled = { ...m, taken: !m.taken };
        return toggled;
      });
      if (!toggled) return state;
      const t = toggled as Medication;
      return {
        ...state,
        medications,
        // Marking one taken can still leave others untaken, and unmarking one
        // can turn the alert back on — either way this is a new state worth
        // surfacing again, not the occurrence the user already dismissed.
        dismissedAlertIds: state.dismissedAlertIds.filter((id) => id !== ALERT_MEDS_UNTAKEN),
        activity: logActivity(
          s,
          t.taken ? 'medicationTaken' : 'medicationUnmarked',
          `${t.name} ${t.taken ? 'marked as taken' : 'unmarked'}`,
        ),
      };
    }

    case 'addAppointment':
      return {
        ...state,
        appointments: [action.appt, ...state.appointments],
        dismissedAlertIds: state.dismissedAlertIds.filter((id) => id !== ALERT_APPOINTMENT_TODAY),
      };

    case 'updateAppointment':
      return {
        ...state,
        appointments: state.appointments.map((a) => (a.id === action.id ? action.updated : a)),
        dismissedAlertIds: state.dismissedAlertIds.filter((id) => id !== ALERT_APPOINTMENT_TODAY),
      };

    case 'deleteAppointment':
      return {
        ...state,
        appointments: state.appointments.filter((a) => a.id !== action.id),
        dismissedAlertIds: state.dismissedAlertIds.filter((id) => id !== ALERT_APPOINTMENT_TODAY),
      };

    case 'addActivity':
      return { ...state, activity: [action.entry, ...state.activity] };

    case 'sendMessage': {
      const message: Message = {
        id: uid(),
        from: action.from,
        to: action.to,
        subject: action.subject,
        body: action.body,
        timestamp: formatClockTime(s._now()),
        read: true,
        archived: false,
      };
      return { ...state, messages: [message, ...state.messages] };
    }

    case 'markMessageRead':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id && !m.read ? { ...m, read: true } : m,
        ),
      };

    case 'toggleMessageRead':
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.id ? { ...m, read: !m.read } : m)),
      };

    case 'archiveMessage':
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.id ? { ...m, archived: true } : m)),
      };

    case 'unarchiveMessage':
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.id ? { ...m, archived: false } : m)),
      };

    case 'deleteMessage':
      return { ...state, messages: state.messages.filter((m) => m.id !== action.id) };

    default:
      return state;
  }
}

// ── React wiring ────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppStateData;
  dispatch: (action: AppAction) => void;
}

const AppStateContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: AppStateData;
}) {
  const [state, dispatch] = useReducer(appReducer, initialState ?? createInitialState());
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
