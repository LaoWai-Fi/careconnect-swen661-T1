import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, CalendarDays, Pill, BookOpen, Phone, ShieldCheck, Heart,
  LogOut, ArrowLeftRight, PhoneCall, LayoutDashboard, Activity, Menu, PanelLeftClose,
  PanelLeftOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useApp } from '../context/AppContext';
import type { AppView } from '../types';
import Modal from './Modal';

interface NavItem { to: string; label: string; Icon: LucideIcon }
const patientNav: NavItem[] = [
  { to: '/app', label: 'Home', Icon: Home },
  { to: '/app/schedule', label: 'My Day', Icon: Calendar },
  { to: '/app/appointments', label: 'Appointments', Icon: CalendarDays },
  { to: '/app/medications', label: 'Medicines', Icon: Pill },
  { to: '/app/memories', label: 'Memories', Icon: BookOpen },
  { to: '/app/contacts', label: 'Contacts', Icon: Phone },
];
const caregiverNav: NavItem[] = [
  { to: '/app', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/app/manage-medications', label: 'Medications', Icon: Pill },
  { to: '/app/manage-appointments', label: 'Appointments', Icon: CalendarDays },
  { to: '/app/activity', label: 'Activity', Icon: Activity },
  { to: '/app/caregiver', label: 'Notes', Icon: ShieldCheck },
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

export default function Layout({ children, view, onSwitchRole, onSignOut }: {
  children: React.ReactNode; view: AppView; onSwitchRole: () => void; onSignOut: () => void;
}) {
  const { user } = useAuth();
  const { patient } = useApp();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const isPatient = view === 'patient';
  const items = isPatient ? patientNav : caregiverNav;

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
        <div className="web-utility">
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
          <span className="web-role">{isPatient ? 'Care recipient' : 'Caregiver'}</span>
          <div className="web-account-actions">
            <button className="web-icon-button" type="button" onClick={onSwitchRole}
              aria-label={isPatient ? 'Switch role to caregiver' : 'Switch role to care recipient'}>
              <ArrowLeftRight size={20} aria-hidden="true" /><span className="web-control-label">Switch role</span>
            </button>
            <button className="web-icon-button" type="button" onClick={onSignOut} aria-label="Sign out of CareConnect">
              <LogOut size={20} aria-hidden="true" /><span className="web-control-label">Sign out</span>
            </button>
          </div>
        </div>
        <div className="web-orientation">
          <div>
            <p className="web-greeting">{greeting}{firstName ? `, ${firstName}` : ''}</p>
            <p className="web-plan">{isPatient ? 'Your daily care plan' : `Viewing ${patient.name}'s care plan`}</p>
          </div>
          <time dateTime={now.toISOString()} className="web-date">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </time>
          {isPatient && <a className="web-call" href="tel:07700900456" aria-label="Call your caregiver Joyce: 07700 900 456">
            <PhoneCall size={18} aria-hidden="true" /> Call my caregiver
          </a>}
        </div>
      </header>
      <div className="web-workspace">
        <aside id="web-sidebar" className="web-sidebar" data-collapsed={!expanded} aria-label="Care plan navigation">
          <Navigation items={items} />
        </aside>
        <main id="main-content" tabIndex={-1} className="web-main" aria-label="Main content">{children}</main>
      </div>
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
    </div>
  );
}
