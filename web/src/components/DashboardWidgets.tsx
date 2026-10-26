import { Children, isValidElement, useState, type ReactNode } from 'react';
import { usePreferences, widgetLabels, type WidgetId } from '../context/PreferencesContext';
import Modal from './Modal';
export default function DashboardWidgets({ children }: { children: ReactNode }) {
  const { preferences, update } = usePreferences();
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  function move(id: WidgetId, direction: number) {
    const items = [...preferences.widgets];
    const index = items.findIndex(item => item.id === id), target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    update({ widgets: items });
    setAnnouncement(`${widgetLabels[id]} moved to position ${target + 1}.`);
  }
  const blocks = Children.toArray(children);
  const ordered = preferences.widgets.filter(item => item.enabled).flatMap(item => blocks.filter(block =>
    isValidElement<{ 'data-widget'?: string }>(block) && block.props['data-widget'] === item.id));
  return <>
    <div><button type="button" className="btn-secondary" onClick={() => setOpen(true)}>Customize dashboard</button></div>
    {blocks.filter(block => !isValidElement<{ 'data-widget'?: string }>(block) || !block.props['data-widget'])}
    {ordered.length ? ordered : <p>No dashboard widgets selected. Choose Customize dashboard to show your care overview.</p>}
    <Modal open={open} title="Customize dashboard" description="Show, hide and reorder widgets. Changes are applied immediately and saved on this browser." onClose={() => setOpen(false)}>
      <ol className="space-y-3">
        {preferences.widgets.map((item, index) => <li key={item.id} className="widget-option">
          <label className="flex gap-3 items-center"><input type="checkbox" checked={item.enabled} onChange={event => update({ widgets: preferences.widgets.map(widget => widget.id === item.id ? { ...widget, enabled: event.target.checked } : widget) })} />{widgetLabels[item.id]}</label>
          <div className="flex gap-2"><button type="button" className="web-icon-button" aria-label={`Move ${widgetLabels[item.id]} up`} disabled={index === 0} onClick={() => move(item.id, -1)}>Up</button><button type="button" className="web-icon-button" aria-label={`Move ${widgetLabels[item.id]} down`} disabled={index === preferences.widgets.length - 1} onClick={() => move(item.id, 1)}>Down</button></div>
        </li>)}
      </ol>
      <p role="status">{announcement}</p>
      <button type="button" className="btn-primary mt-4" onClick={() => setOpen(false)}>Close customization</button>
    </Modal>
  </>;
}
