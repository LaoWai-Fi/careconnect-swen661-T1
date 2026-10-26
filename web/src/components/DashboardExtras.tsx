import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMessages } from '../data/messagesStore';
import { getNextAppointment } from '../data/caregiverStore';
export default function DashboardExtras({ kind }: { kind: 'next' | 'messages' }) {
  const [unread, setUnread] = useState(() => getMessages().filter(item => !item.read && !item.archived).length);
  useEffect(() => {
    const refresh = () => setUnread(getMessages().filter(item => !item.read && !item.archived).length);
    window.addEventListener('careconnect:messages', refresh);
    return () => window.removeEventListener('careconnect:messages', refresh);
  }, []);
  const appointment = getNextAppointment();
  return <section className="card space-y-3" aria-labelledby={`extra-${kind}`}>
    <h2 id={`extra-${kind}`}>{kind === 'next' ? 'Next appointment' : 'Unread messages'}</h2>
    {kind === 'next' ? <><p>{appointment ? `${appointment.title} on ${appointment.date} at ${appointment.time}` : 'No upcoming appointments.'}</p><Link to="/app/manage-appointments">Open appointments</Link></>
      : <><p>{unread} unread {unread === 1 ? 'message' : 'messages'} in this local demo inbox.</p><Link to="/app/messages">Open messages</Link></>}
  </section>;
}
