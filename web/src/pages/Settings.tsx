import { useState } from 'react';
import { usePreferences } from '../context/PreferencesContext';

export default function Settings() {
  const { preferences, update, reset } = usePreferences();
  const [message, setMessage] = useState('');
  function saved() { setMessage('Settings applied. Preferences are saved on this browser when storage is available.'); }
  return <div className="space-y-6 max-w-3xl mx-auto">
    <h1>Settings</h1>
    <p>Adjust CareConnect to your display and reach. These preferences apply across the app.</p>
    <section className="card space-y-5" aria-labelledby="display-heading">
      <h2 id="display-heading">Display and accessibility</h2>
      <div className="settings-field"><label htmlFor="theme-setting">Theme</label>
        <select id="theme-setting" value={preferences.theme} onChange={event => { update({ theme: event.target.value as typeof preferences.theme }); saved(); }}>
          <option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option>
        </select>
      </div>
      <div className="settings-field"><label htmlFor="text-setting">Text size</label>
        <select id="text-setting" value={preferences.fontSize} onChange={event => { update({ fontSize: event.target.value as typeof preferences.fontSize }); saved(); }}>
          <option value="normal">Normal</option><option value="large">Large</option><option value="xlarge">Extra large</option>
        </select>
      </div>
      <div className="settings-field"><label htmlFor="hand-setting">One-handed controls</label>
        <select id="hand-setting" value={preferences.handMode} onChange={event => { update({ handMode: event.target.value as typeof preferences.handMode }); saved(); }} aria-describedby="hand-help">
          <option value="off">Off</option><option value="left">Left hand</option><option value="right">Right hand</option>
        </select>
      </div>
      <p id="hand-help">On mobile, quick navigation is grouped within your chosen reach and the drawer opens from that side. Reading and keyboard order stay consistent.</p>
      <label className="flex items-center gap-3"><input type="checkbox" checked={preferences.highContrast} onChange={event => { update({ highContrast: event.target.checked }); saved(); }} />Stronger borders and focus</label>
    </section>
    <button type="button" className="btn-secondary" onClick={() => { reset(); setMessage('Default settings restored, including dashboard widgets.'); }}>Restore default settings</button>
    <p role="status">{message}</p>
    <section className="card space-y-3"><h2>Data and installation</h2><p>This course prototype stores fictional accounts, care-plan changes, messages and settings in this browser. Messages are not delivered to a real care team. There is no cloud sync.</p><p>Offline use requires an initial online production visit. Install from your browser menu when supported. An update only reloads after you choose Reload to update.</p></section>
  </div>;
}
