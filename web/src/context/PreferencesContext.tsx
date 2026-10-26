import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const widgetLabels = {
  status: "Margaret's status", medications: "Today's medications", alerts: 'Alerts',
  activity: 'Recent activity and quick links', next: 'Next appointment', messages: 'Unread messages',
};
export type WidgetId = keyof typeof widgetLabels;
type Preferences = {
  theme: 'system' | 'light' | 'dark'; fontSize: 'normal' | 'large' | 'xlarge';
  handMode: 'off' | 'left' | 'right'; highContrast: boolean;
  widgets: { id: WidgetId; enabled: boolean }[];
};
const defaults: Preferences = { theme: 'system', fontSize: 'normal', handMode: 'off', highContrast: false,
  widgets: (Object.keys(widgetLabels) as WidgetId[]).map(id => ({ id, enabled: true })) };
const KEY = 'careconnect_web_preferences';
function load(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!value || typeof value !== 'object') return defaults;
    const widgets: Preferences['widgets'] = [];
    if (Array.isArray(value.widgets)) for (const item of value.widgets) {
      if (item && Object.prototype.hasOwnProperty.call(widgetLabels, item.id) && !widgets.some(widget => widget.id === item.id)) {
        widgets.push({ id: item.id, enabled: item.enabled !== false });
      }
    }
    for (const item of defaults.widgets) if (!widgets.some(widget => widget.id === item.id)) widgets.push(item);
    return {
      theme: ['system', 'light', 'dark'].includes(value.theme) ? value.theme : 'system',
      fontSize: ['normal', 'large', 'xlarge'].includes(value.fontSize) ? value.fontSize : 'normal',
      handMode: ['off', 'left', 'right'].includes(value.handMode) ? value.handMode : 'off',
      highContrast: value.highContrast === true, widgets,
    };
  } catch { return defaults; }
}
const PreferencesContext = createContext<{ preferences: Preferences; update: (patch: Partial<Preferences>) => void; reset: () => void } | null>(null);
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch { /* Settings remain available for this visit. */ }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = preferences.theme === 'system' ? (media.matches ? 'dark' : 'light') : preferences.theme;
      document.documentElement.dataset.contrast = preferences.highContrast ? 'more' : 'normal';
      document.documentElement.dataset.hand = preferences.handMode;
      document.documentElement.style.fontSize = { normal: '18px', large: '20.25px', xlarge: '22.5px' }[preferences.fontSize];
    };
    apply(); media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preferences]);
  return <PreferencesContext.Provider value={{ preferences, update: patch => setPreferences(current => ({ ...current, ...patch })), reset: () => setPreferences(defaults) }}>{children}</PreferencesContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences() {
  const context = useContext(PreferencesContext);
  // Standalone page/component tests and embedders can use the uncustomized layout.
  return context ?? { preferences: defaults, update: () => {}, reset: () => {} };
}
