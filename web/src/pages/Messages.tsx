import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { addMessage, getMessages, removeMessage, updateMessage } from '../data/messagesStore';

const empty = { to: '', cc: '', bcc: '', subject: '', body: '' };
export default function Messages() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const compose = id === 'compose';
  const folder = params.get('folder') === 'archive' ? 'archive' : 'inbox';
  const reply = params.get('reply');
  const draftKey = `careconnect_message_draft:${reply || 'new'}`;
  const [messages, setMessages] = useState(getMessages);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState(empty);
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const summary = useRef<HTMLParagraphElement>(null);
  const selected = messages.find(item => item.id === id);
  useEffect(() => {
    const refresh = () => setMessages(getMessages());
    window.addEventListener('careconnect:messages', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('careconnect:messages', refresh); window.removeEventListener('storage', refresh); };
  }, []);
  useEffect(() => {
    setError(''); setFiles([]);
    if (!compose) return;
    setMessage('');
    const original = getMessages().find(item => item.id === reply);
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { /* Start a clean draft if corrupted. */ }
    setDraft(saved && Object.keys(empty).every(key => typeof saved[key] === 'string') ? saved : original
      ? { ...empty, to: original.from, subject: `Re: ${original.subject}`, body: `\n\nPrevious message:\n${original.body}` } : empty);
  }, [compose, reply, draftKey]);
  useEffect(() => {
    if (selected && !selected.read) updateMessage(selected.id, { read: true });
  }, [selected]);
  function change(field: keyof typeof empty, value: string) {
    const next = { ...draft, [field]: value }; setDraft(next);
    try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { setError('Draft storage is unavailable. Keep this page open until you save the message.'); }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!draft.to.trim() || !draft.subject.trim() || !draft.body.trim()) {
      setError('Enter a recipient, subject and message before saving.');
      requestAnimationFrame(() => summary.current?.focus()); return;
    }
    try {
      addMessage({ ...draft, from: user?.name || 'Demo caregiver', attachments: files });
      localStorage.removeItem(draftKey);
      navigate('/app/messages');
      setMessage('Demo message saved locally. Nothing was sent to a server.');
    } catch { setError('Message could not be saved. Your draft is still on this page.'); }
  }
  return <div className="space-y-5 max-w-6xl mx-auto">
    <div className="page-action-row flex flex-wrap gap-3 items-center justify-between">
      <h1>{compose ? 'Compose message' : selected ? selected.subject : id ? 'Message not found' : folder === 'archive' ? 'Archived messages' : 'Messages'}</h1>
      {!compose && <Link className="btn-primary no-underline" to="/app/messages/compose">New message</Link>}
    </div>
    <p className="text-sm">Local demo inbox. No real messages are sent, and no server synchronization is provided.</p>
    <p role="status">{message}</p>
    {compose ? <form className="card space-y-4" onSubmit={save} noValidate>
      {error && <p ref={summary} tabIndex={-1} role="alert">{error}</p>}
      <Field label="To" required value={draft.to} onChange={event => change('to', event.target.value)} hint="Enter a fictional name or address." />
      <details><summary>Additional recipients</summary><div className="space-y-3"><Field label="Cc" value={draft.cc} onChange={event => change('cc', event.target.value)} /><Field label="Bcc" value={draft.bcc} onChange={event => change('bcc', event.target.value)} /></div></details>
      <Field label="Subject" required value={draft.subject} onChange={event => change('subject', event.target.value)} />
      <Field label="Message" required multiline rows={7} value={draft.body} onChange={event => change('body', event.target.value)} />
      <label className="settings-field">Attachment names only<input type="file" multiple onChange={event => setFiles(Array.from(event.target.files || []).map(file => file.name))} aria-describedby="attachment-help" /></label>
      <p id="attachment-help" className="text-sm">Only filenames are saved in this demo. File contents are not uploaded or available for download.</p>
      {files.map((name, index) => <p key={`${name}-${index}`}>{name} <button type="button" className="web-icon-button" aria-label={`Remove attachment ${name}`} onClick={() => setFiles(files.filter((_, item) => item !== index))}>Remove</button></p>)}
      <div className="flex flex-wrap gap-3"><button type="submit" className="btn-primary">Save demo message</button><Link className="btn-secondary no-underline" to="/app/messages">Back to messages</Link></div>
      <p className="text-sm">Text drafts are saved while you type when browser storage is available.</p>
    </form> : selected ? <>
      <Link to="/app/messages">Back to messages</Link>
      <article className="card space-y-4" aria-label="Message detail"><dl><dt>From</dt><dd>{selected.from}</dd><dt>To</dt><dd>{selected.to}</dd>{selected.cc && <><dt>Cc</dt><dd>{selected.cc}</dd></>}{selected.bcc && <><dt>Bcc</dt><dd>{selected.bcc}</dd></>}<dt>Date</dt><dd><time dateTime={selected.timestamp}>{new Date(selected.timestamp).toLocaleString()}</time></dd></dl><p className="whitespace-pre-wrap">{selected.body}</p>{selected.attachments?.map((name, index) => <p key={index}>Attachment filename: {name} (content not stored)</p>)}</article>
      <div className="flex flex-wrap gap-3"><Link to={`/app/messages/compose?reply=${encodeURIComponent(selected.id)}`} className="btn-primary no-underline">Reply</Link><button type="button" className="btn-secondary" onClick={() => { updateMessage(selected.id, { archived: !selected.archived }); navigate(`/app/messages?folder=${selected.archived ? 'inbox' : 'archive'}`); }}> {selected.archived ? 'Unarchive' : 'Archive'}</button><button type="button" className="btn-secondary" onClick={() => setDeleting(true)}>Delete message</button></div>
      <Modal open={deleting} title="Delete message" description="This removes the local demo message. It cannot be undone." onClose={() => setDeleting(false)}><div className="web-dialog-actions"><button type="button" data-autofocus className="btn-secondary" onClick={() => setDeleting(false)}>Cancel</button><button type="button" className="btn-primary web-danger" onClick={() => { try { removeMessage(selected.id); setDeleting(false); navigate('/app/messages'); } catch { setError('Message could not be deleted.'); } }}>Confirm delete</button></div>{error && <p role="alert">{error}</p>}</Modal>
    </> : id ? <p>This message may have been deleted. <Link to="/app/messages">Return to messages</Link></p> : <>
      <nav aria-label="Message folders" className="flex gap-4"><Link to="/app/messages" aria-current={folder === 'inbox' ? 'page' : undefined}>Inbox</Link><Link to="/app/messages?folder=archive" aria-current={folder === 'archive' ? 'page' : undefined}>Archive</Link></nav>
      <ul className="message-grid" aria-label={folder === 'archive' ? 'Archived messages' : 'Inbox messages'}>
        {messages.filter(item => item.archived === (folder === 'archive')).map(item => <li key={item.id} className="card space-y-3"><p className="text-sm">{item.read ? 'Read' : 'Unread'} · {item.from}</p><h2 className="text-lg"><Link to={`/app/messages/${encodeURIComponent(item.id)}`}>{item.subject}</Link></h2><p>{item.body.slice(0, 120)}</p><div className="flex flex-wrap gap-2"><button className="web-icon-button" type="button" aria-label={`Mark as ${item.read ? 'unread' : 'read'}: ${item.subject}`} onClick={() => updateMessage(item.id, { read: !item.read })}>Mark as {item.read ? 'unread' : 'read'}</button><button className="web-icon-button" type="button" aria-label={`${item.archived ? 'Unarchive' : 'Archive'} ${item.subject}`} onClick={() => { updateMessage(item.id, { archived: !item.archived }); setMessage(item.archived ? 'Message restored to inbox.' : 'Message archived.'); }}>{item.archived ? 'Unarchive' : 'Archive'}</button></div></li>)}
      </ul>
      {messages.filter(item => item.archived === (folder === 'archive')).length === 0 && <p>No messages in this folder.</p>}
    </>}
  </div>;
}
