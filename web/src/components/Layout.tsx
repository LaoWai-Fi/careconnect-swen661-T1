import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Pill, ShieldCheck, Heart, LogOut, LayoutDashboard, Activity,
  Menu, PanelLeftClose, PanelLeftOpen, Settings, Mail, HelpCircle, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useApp } from '../context/AppContext';
import { usePreferences } from '../context/PreferencesContext';
import Modal from './Modal';

interface NavItem { to: string; label: string; Icon: LucideIcon }
const caregiverNav: NavItem[] = [
  { to: '/app', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/app/manage-medications', label: 'Medications', Icon: Pill },
  { to: '/app/manage-appointments', label: 'Appointments', Icon: CalendarDays },
  { to: '/app/activity', label: 'Activity', Icon: Activity },
  { to: '/app/messages', label: 'Messages', Icon: Mail },
  { to: '/app/caregiver', label: 'Notes', Icon: ShieldCheck },
  { to: '/app/settings', label: 'Settings', Icon: Settings },
];

function Navigation({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation">
      <ul className="web-nav-list">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to === '/app'} onClick={onNavigate}
              className={({ isActive }) => `web-nav-link${isActive ? ' web-nav-current' : ''}`}
              title={label}>
              <Icon size={22} aria-hidden="true" />
              <span className="web-nav-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Layout({ children, onSignOut }: {
  children: React.ReactNode; onSignOut: () => void;
}) {
  const { user } = useAuth();
  const { patient } = useApp();
  const { preferences } = usePreferences();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const items = caregiverNav;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { setDrawerOpen(false); }, [pathname]);
  useEffect(() => {
    const tablet = window.matchMedia('(min-width: 768px)');
    const closeDrawer = () => { if (tablet.matches) setDrawerOpen(false); };
    tablet.addEventListener('change', closeDrawer);
    return () => tablet.removeEventListener('change', closeDrawer);
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? '';
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="web-app">
      <header className="web-header">
        <div className="web-utility" data-hand={preferences.handMode}>
          {/* One-handed mode: the order in the page is the visual order, so reading and Tab order always match what is seen. */}
          {preferences.handMode === 'left' ? <>
          <div className="web-account-actions">
            <Link to="/app/settings" className="web-icon-button" aria-label="Settings"><Settings size={20} aria-hidden="true" /></Link>
            <button type="button" className="web-icon-button" aria-label="Help and keyboard shortcuts" onClick={() => setHelpOpen(true)}><HelpCircle size={20} aria-hidden="true" /></button>
            <button className="web-icon-button" type="button" onClick={onSignOut} aria-label="Sign out of CareConnect">
              <LogOut size={20} aria-hidden="true" /><span className="web-control-label">Sign out</span>
            </button>
          </div>
          <button className="web-icon-button web-mobile-menu" type="button"
            aria-label="Open navigation" aria-expanded={drawerOpen} aria-haspopup="dialog"
            aria-controls={drawerOpen ? 'mobile-navigation' : undefined} onClick={() => setDrawerOpen(true)}>
            <Menu aria-hidden="true" />
          </button>
          <button className="web-icon-button web-tablet-menu" type="button"
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={expanded}
            aria-controls="web-sidebar" onClick={() => setExpanded(!expanded)}>
            {expanded ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
          </button>
          <Link to="/app" className="web-brand" aria-label="CareConnect home">
            <span className="web-brandmark"><Heart size={22} aria-hidden="true" /></span>
            <span className="web-brand-name">CareConnect</span>
          </Link>
          <span className="web-role">Caregiver</span>
          </> : preferences.handMode === 'right' ? <>
          <button className="web-icon-button web-tablet-menu" type="button"
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={expanded}
            aria-controls="web-sidebar" onClick={() => setExpanded(!expanded)}>
            {expanded ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
          </button>
          <Link to="/app" className="web-brand" aria-label="CareConnect home">
            <span className="web-brandmark"><Heart size={22} aria-hidden="true" /></span>
            <span className="web-brand-name">CareConnect</span>
          </Link>
          <span className="web-role">Caregiver</span>
          <div className="web-account-actions">
            <Link to="/app/settings" className="web-icon-button" aria-label="Settings"><Settings size={20} aria-hidden="true" /></Link>
            <button type="button" className="web-icon-button" aria-label="Help and keyboard shortcuts" onClick={() => setHelpOpen(true)}><HelpCircle size={20} aria-hidden="true" /></button>
            <button className="web-icon-button" type="button" onClick={onSignOut} aria-label="Sign out of CareConnect">
              <LogOut size={20} aria-hidden="true" /><span className="web-control-label">Sign out</span>
            </button>
          </div>
          <button className="web-icon-button web-mobile-menu" type="button"
            aria-label="Open navigation" aria-expanded={drawerOpen} aria-haspopup="dialog"
            aria-controls={drawerOpen ? 'mobile-navigation' : undefined} onClick={() => setDrawerOpen(true)}>
            <Menu aria-hidden="true" />
          </button>
          </> : <>
          <button className="web-icon-button web-mobile-menu" type="button"
            aria-label="Open navigation" aria-expanded={drawerOpen} aria-haspopup="dialog"
            aria-controls={drawerOpen ? 'mobile-navigation' : undefined} onClick={() => setDrawerOpen(true)}>
            <Menu aria-hidden="true" />
          </button>
          <button className="web-icon-button web-tablet-menu" type="button"
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={expanded}
            aria-controls="web-sidebar" onClick={() => setExpanded(!expanded)}>
            {expanded ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
          </button>
          <Link to="/app" className="web-brand" aria-label="CareConnect home">
            <span className="web-brandmark"><Heart size={22} aria-hidden="true" /></span>
            <span className="web-brand-name">CareConnect</span>
          </Link>
          <span className="web-role">Caregiver</span>
          <div className="web-account-actions">
            <Link to="/app/settings" className="web-icon-button" aria-label="Settings"><Settings size={20} aria-hidden="true" /></Link>
            <button type="button" className="web-icon-button" aria-label="Help and keyboard shortcuts" onClick={() => setHelpOpen(true)}><HelpCircle size={20} aria-hidden="true" /></button>
            <button className="web-icon-button" type="button" onClick={onSignOut} aria-label="Sign out of CareConnect">
              <LogOut size={20} aria-hidden="true" /><span className="web-control-label">Sign out</span>
            </button>
          </div>
          </>}
        </div>
        <div className="web-orientation">
          <div>
            <p className="web-greeting">{greeting}{firstName ? `, ${firstName}` : ''}</p>
            <p className="web-plan">{`Viewing ${patient.name}'s care plan`}</p>
          </div>
          <time dateTime={now.toISOString()} className="web-date">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </time>
        </div>
      </header>
      <form role="search" className="web-search" onSubmit={event => { event.preventDefault(); const match = caregiverNav.find(item => item.label.toLowerCase().includes(search.trim().toLowerCase())); if (search.trim() && match) { navigate(match.to); setSearch(''); } }}>
        <label htmlFor="page-search"><Search size={18} aria-hidden="true" />Find a page</label>
        <input id="page-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Medications, messages, settings…" list="page-destinations" />
        <datalist id="page-destinations">{caregiverNav.map(item => <option key={item.to} value={item.label} />)}</datalist>
        <button type="submit" className="web-icon-button">Go</button>
        {search.trim() && !caregiverNav.some(item => item.label.toLowerCase().includes(search.trim().toLowerCase())) && <p role="status">No matching page. Try a navigation label.</p>}
      </form>
      <div className="web-workspace">
        <aside id="web-sidebar" className="web-sidebar" data-collapsed={!expanded} aria-label="Care plan navigation">
          <Navigation items={items} />
        </aside>
        <main id="main-content" tabIndex={-1} className="web-main" aria-label="Main content">{children}</main>
      </div>
      <nav className="web-quick-nav" aria-label="Quick navigation"><Link to="/app">Home</Link><Link to="/app/manage-medications">Medications</Link><Link to="/app/messages">Messages</Link><button type="button" onClick={() => setHelpOpen(true)}>Help</button></nav>
      <footer className="web-footer">
        <p>CareConnect · Course prototype · Demo data stays on this device.</p>
        <Link to="/app/contacts">Caregiver and support contacts</Link>
        <details className="web-install-help"><summary>Install on your device</summary>
          <p>Chrome or Edge: use Install app in your browser menu when offered. On iPhone or iPad: open the Share menu, choose Add to Home Screen, then turn on Open as Web App if shown.</p>
        </details>
      </footer>
      <Modal id="mobile-navigation" open={drawerOpen} title="CareConnect navigation"
        onClose={() => setDrawerOpen(false)} className="web-nav-dialog">
        <Navigation items={items} onNavigate={() => setDrawerOpen(false)} />
      </Modal>
      <Modal open={helpOpen} title="Help and keyboard shortcuts" onClose={() => setHelpOpen(false)}>
        <div className="space-y-3"><p>Use Tab and Shift+Tab to move, Enter to follow links, and Enter or Space to activate buttons. Escape closes dialogs. Focus stays inside an open modal and returns to its opener when closed.</p><p>Use the first Skip to main content link to bypass navigation. Find a page searches navigation destinations, not private care data. Settings controls theme, text size, stronger focus and one-handed reach. Customize dashboard changes widget visibility and order using Up and Down buttons.</p><p>This app uses fictional local data only. It does not provide real authentication, clinical advice, message delivery or cloud synchronization.</p><Link to="/app/contacts" onClick={() => setHelpOpen(false)}>Caregiver and support contacts</Link></div>
      </Modal>
    </div>
  );
}
