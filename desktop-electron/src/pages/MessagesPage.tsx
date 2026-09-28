import { useState, useEffect, useRef } from "react"
import TapButton from "../components/TapButton"
import FormField, { Input, Textarea } from "../components/FormField"
import { useFocusTrap } from "../useFocusTrap"
import { MailIcon } from "../components/icons"
import type { Message, Page } from "../types"

interface Props {
  messages: Message[]
  onMarkRead: (id: string) => void
  onToggleRead: (id: string) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onSend: (data: {
    from: string
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body: string
    attachments?: { name: string; type: string }[]
  }) => void
  navigate: (page: Page) => void
  initialMessageId?: string | null
  handLeft: boolean
}

function fileIcon(type: string) {
  if (type.includes("pdf")) return "📄"
  if (type.startsWith("image/")) return "🖼"
  if (type.includes("word") || type.includes("doc")) return "📝"
  return "📎"
}

export default function MessagesPage({
  messages,
  onMarkRead,
  onToggleRead,
  onDelete,
  onArchive,
  onUnarchive,
  onSend,
  navigate: _navigate,
  initialMessageId,
  handLeft,
}: Props) {
  const [view, setView] = useState<"list" | "detail" | "compose">(() =>
    initialMessageId ? "detail" : "list",
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    () => initialMessageId ?? null,
  )
  const [folder, setFolder] = useState<"inbox" | "archive">(() =>
    initialMessageId &&
    messages.find((m) => m.id === initialMessageId)?.archived
      ? "archive"
      : "inbox",
  )
  const [announcement, setAnnouncement] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const deleteDialogRef = useFocusTrap(!!deleteConfirmId, () =>
    setDeleteConfirmId(null),
  )

  // Compose fields
  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [attachments, setAttachments] = useState<{
    name: string
    type: string
  }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mark as read whenever a message is opened in detail view
  useEffect(() => {
    if (selectedId) {
      const msg = messages.find((m) => m.id === selectedId)
      if (msg && !msg.read) onMarkRead(selectedId)
    }
  }, [selectedId])

  const selectedMessage = selectedId
    ? (messages.find((m) => m.id === selectedId) ?? null)
    : null
  const activeMessages = messages.filter((m) => !m.archived)
  const archivedMessages = messages.filter((m) => m.archived)
  const listMessages = folder === "archive" ? archivedMessages : activeMessages
  const canSend = to.trim().length > 0 && body.trim().length > 0

  function openMessage(id: string) {
    setSelectedId(id)
    setView("detail")
  }

  function openCompose(replyTo?: Message) {
    if (replyTo) {
      setTo(replyTo.from)
      setCc("")
      setBcc("")
      setSubject(`Re: ${replyTo.subject}`)
      setBody(
        `\n\n— On ${replyTo.timestamp}, ${replyTo.from} wrote:\n\n${replyTo.body}`,
      )
      setShowCc(false)
      setShowBcc(false)
    } else {
      setTo("")
      setCc("")
      setBcc("")
      setSubject("")
      setBody("")
      setShowCc(false)
      setShowBcc(false)
    }
    setAttachments([])
    setView("compose")
  }

  function handleSend() {
    if (!canSend) return
    onSend({
      from: "Maria Thompson",
      to: to
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      cc: cc.trim()
        ? cc
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      bcc: bcc.trim()
        ? bcc
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      subject,
      body,
      attachments: attachments.length ? attachments : undefined,
    })
    setView("list")
    setTo("")
    setCc("")
    setBcc("")
    setSubject("")
    setBody("")
    setAttachments([])
  }

  function handleDeleteConfirm(id: string) {
    onDelete(id)
    setDeleteConfirmId(null)
    setSelectedId(null)
    setView("list")
  }

  function handleArchive(id: string) {
    onArchive(id)
    setSelectedId(null)
    setView("list")
    setAnnouncement("Message moved to Archive")
  }

  function handleUnarchive(id: string) {
    onUnarchive(id)
    setSelectedId(null)
    setView("list")
    setAnnouncement("Message moved back to Inbox")
  }

  function toggleArchiveFromList(msg: Message) {
    if (msg.archived) {
      onUnarchive(msg.id)
      setAnnouncement("Message from " + msg.from + " moved back to Inbox")
    } else {
      onArchive(msg.id)
      setAnnouncement("Message from " + msg.from + " moved to Archive")
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setAttachments((prev) => [
      ...prev,
      ...files.map((f) => ({
        name: f.name,
        type: f.type || "application/octet-stream",
      })),
    ])
    e.target.value = ""
  }

  // ─── COMPOSE VIEW ─────────────────────────────────────────────────────────
  if (view === "compose") {
    return (
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        <div
          className={`flex items-center gap-3 ${
            handLeft ? "flex-row-reverse" : ""
          }`}
        >
          <button
            onClick={() => setView("list")}
            className="text-[var(--primary)] font-semibold text-sm rounded-xl px-3 py-2 hover:bg-[var(--muted)] min-h-[44px] focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] transition-colors"
            aria-label={
              folder === "archive"
                ? "Back to archived messages"
                : "Back to messages"
            }
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            New Message
          </h1>
        </div>

        <div className="space-y-4">
          <FormField label="To" required>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipient name or email"
              autoComplete="off"
            />
          </FormField>

          {showCc ? (
            <FormField label="Cc">
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Cc recipients, comma-separated"
                autoComplete="off"
              />
            </FormField>
          ) : (
            <button
              onClick={() => setShowCc(true)}
              className="text-sm text-[var(--primary)] font-semibold hover:underline focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] rounded min-h-[44px] px-1"
            >
              + Add Cc
            </button>
          )}

          {showBcc ? (
            <FormField label="Bcc">
              <Input
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="Bcc recipients, comma-separated"
                autoComplete="off"
              />
            </FormField>
          ) : (
            <button
              onClick={() => setShowBcc(true)}
              className="text-sm text-[var(--primary)] font-semibold hover:underline focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] rounded min-h-[44px] px-1"
            >
              + Add Bcc
            </button>
          )}

          <FormField label="Subject">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
          </FormField>

          <FormField label="Body" required>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              rows={8}
            />
          </FormField>

          {/* Attachment control */}
          <div className="space-y-2">
            <p
              className="text-sm font-semibold text-[var(--foreground)]"
              id="attach-label"
            >
              Attachments
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="sr-only"
              aria-labelledby="attach-label"
              onChange={handleFileChange}
              tabIndex={-1}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-[var(--primary)] font-semibold bg-[var(--muted)] rounded-xl px-4 py-2.5 min-h-[44px] hover:bg-[var(--border)] transition-colors focus-visible:outline-[3px] focus-visible:outline-[var(--ring)]"
            >
              <span aria-hidden="true">📎</span> Attach file
            </button>
            {attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-[var(--muted)] rounded-xl px-3 py-2 text-sm"
                  >
                    <span aria-hidden="true">{fileIcon(att.type)}</span>
                    <span className="flex-1 truncate text-[var(--foreground)]">
                      {att.name}
                    </span>
                    <button
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-[var(--destructive)] font-semibold text-xs hover:underline focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Remove attachment ${att.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex gap-3 pt-2 ${handLeft ? "flex-row-reverse" : ""}`}
        >
          <TapButton
            variant="ghost"
            size="lg"
            onClick={() => setView("list")}
            className="flex-1 border-2 border-[var(--border)]"
          >
            Cancel
          </TapButton>
          <TapButton
            variant="primary"
            size="lg"
            onClick={handleSend}
            disabled={!canSend}
            aria-disabled={!canSend}
            className="flex-1"
          >
            Send
          </TapButton>
        </div>
      </div>
    )
  }

  // ─── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === "detail" && selectedMessage) {
    const msg = selectedMessage
    return (
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-5">
        <div
          className={`flex items-center justify-between gap-3 ${
            handLeft ? "flex-row-reverse" : ""
          }`}
        >
          <button
            onClick={() => setView("list")}
            className="text-[var(--primary)] font-semibold text-sm rounded-xl px-3 py-2 hover:bg-[var(--muted)] min-h-[44px] focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] transition-colors"
            aria-label={
              folder === "archive"
                ? "Back to archived messages"
                : "Back to messages"
            }
          >
            ← Back
          </button>
          <button
            onClick={() => onToggleRead(msg.id)}
            className="text-[var(--primary)] font-semibold text-sm rounded-xl px-3 py-2 hover:bg-[var(--muted)] min-h-[44px] focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] transition-colors"
            aria-pressed={!msg.read}
          >
            {msg.read ? "Mark as unread" : "Mark as read"}
          </button>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
          {msg.archived && (
            <p className="inline-block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] border border-[var(--border)] rounded-md px-2 py-0.5">
              In Archive
            </p>
          )}
          <h1 className="text-xl font-bold text-[var(--foreground)]">
            {msg.subject}
          </h1>

          <dl className="space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="font-semibold text-[var(--foreground)] w-10 flex-shrink-0">
                From
              </dt>
              <dd className="text-[var(--muted-foreground)]">{msg.from}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-[var(--foreground)] w-10 flex-shrink-0">
                To
              </dt>
              <dd className="text-[var(--muted-foreground)]">
                {msg.to.join(", ")}
              </dd>
            </div>
            {msg.cc && msg.cc.length > 0 && (
              <div className="flex gap-2">
                <dt className="font-semibold text-[var(--foreground)] w-10 flex-shrink-0">
                  Cc
                </dt>
                <dd className="text-[var(--muted-foreground)]">
                  {msg.cc.join(", ")}
                </dd>
              </div>
            )}
            {msg.bcc && msg.bcc.length > 0 && (
              <div className="flex gap-2">
                <dt className="font-semibold text-[var(--foreground)] w-10 flex-shrink-0">
                  Bcc
                </dt>
                <dd className="text-[var(--muted-foreground)]">
                  {msg.bcc.join(", ")}
                </dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="font-semibold text-[var(--foreground)] w-10 flex-shrink-0">
                Date
              </dt>
              <dd className="text-[var(--muted-foreground)]">
                {msg.timestamp}
              </dd>
            </div>
          </dl>

          <hr className="border-[var(--border)]" />

          <p className="text-base text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
            {msg.body}
          </p>

          {msg.attachments && msg.attachments.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Attachments ({msg.attachments.length})
              </p>
              <div className="flex flex-col gap-2">
                {msg.attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-[var(--muted)] rounded-xl px-3 py-2.5 text-sm"
                  >
                    <span aria-hidden="true">{fileIcon(att.type)}</span>
                    <span className="text-[var(--foreground)] truncate">
                      {att.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <TapButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => openCompose(msg)}
            aria-label={`Reply to ${msg.from}`}
          >
            ↩ Reply
          </TapButton>
          {msg.archived ? (
            <TapButton
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => handleUnarchive(msg.id)}
              aria-label="Unarchive message and move it back to the Inbox"
            >
              Unarchive
            </TapButton>
          ) : (
            <TapButton
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => handleArchive(msg.id)}
              aria-label="Archive message"
            >
              Archive
            </TapButton>
          )}
          <TapButton
            variant="destructive"
            size="lg"
            fullWidth
            onClick={() => setDeleteConfirmId(msg.id)}
            aria-label="Delete message"
          >
            Delete
          </TapButton>
        </div>

        {/* Delete confirmation */}
        {deleteConfirmId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            role="presentation"
          >
            <div
              className="absolute inset-0 bg-black/40"
              aria-hidden="true"
              onClick={() => setDeleteConfirmId(null)}
            />
            <div
              ref={deleteDialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="del-msg-title"
              className="relative bg-[var(--card)] w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <h2
                id="del-msg-title"
                className="text-lg font-bold text-[var(--foreground)]"
              >
                Delete message?
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                This message will be permanently deleted. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <TapButton
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </TapButton>
                <TapButton
                  variant="destructive"
                  size="lg"
                  className="flex-1"
                  onClick={() => handleDeleteConfirm(deleteConfirmId)}
                >
                  Delete
                </TapButton>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
      <div
        className={`flex items-center justify-between gap-2 ${
          handLeft ? "flex-row-reverse" : ""
        }`}
      >
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {folder === "archive" ? "Archived messages" : "Messages"}
        </h1>
        <TapButton
          variant="primary"
          size="sm"
          onClick={() => openCompose()}
          aria-label="Compose new message"
        >
          <MailIcon className="w-5 h-5" /> New Message
        </TapButton>
      </div>

      <div
        className={
          "flex flex-wrap items-center gap-3 " +
          (handLeft ? "flex-row-reverse" : "")
        }
      >
        <div
          className="inline-flex gap-1 p-1 border border-[var(--border)] rounded-xl bg-[var(--card)]"
          role="group"
          aria-label="Message folders"
        >
          <TapButton
            size="xs"
            variant={folder === "inbox" ? "primary" : "ghost"}
            aria-pressed={folder === "inbox"}
            onClick={() => setFolder("inbox")}
          >
            Inbox{" "}
            <span className="text-[0.68rem] opacity-80">
              {activeMessages.length}
            </span>
          </TapButton>
          <TapButton
            size="xs"
            variant={folder === "archive" ? "primary" : "ghost"}
            aria-pressed={folder === "archive"}
            onClick={() => setFolder("archive")}
          >
            Archive{" "}
            <span className="text-[0.68rem] opacity-80">
              {archivedMessages.length}
            </span>
          </TapButton>
        </div>
        {folder === "archive" && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Archived messages stay out of the Inbox until you unarchive them.
          </p>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {listMessages.length === 0 && folder === "archive" ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-10 text-center space-y-2">
          <p className="font-semibold text-[var(--foreground)]">
            No archived messages
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Messages you archive from the Inbox will show up here.
          </p>
        </div>
      ) : listMessages.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-10 text-center space-y-2">
          <div className="text-4xl" aria-hidden="true">
            ✉
          </div>
          <p className="font-semibold text-[var(--foreground)]">
            No messages yet
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Tap "New Message" to send your first message to the care team.
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col gap-2"
          role="list"
          aria-label={
            folder === "archive" ? "Archived messages" : "Inbox messages"
          }
        >
          {listMessages.map((msg) => (
            <div
              key={msg.id}
              role="listitem"
              className="w-full flex items-stretch gap-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl pl-1 pr-4 py-2 hover:bg-[var(--muted)] transition-colors min-h-[72px]"
            >
              {/* Read/unread toggle — its own tap target, not a swipe gesture */}
              <button
                onClick={() => onToggleRead(msg.id)}
                className="flex-shrink-0 self-center w-11 h-11 rounded-full flex items-center justify-center hover:bg-[var(--border)] focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] transition-colors"
                aria-pressed={!msg.read}
                aria-label={
                  msg.read
                    ? `Mark message from ${msg.from} as unread`
                    : `Mark message from ${msg.from} as read`
                }
              >
                <span
                  className={
                    !msg.read
                      ? "block w-2.5 h-2.5 rounded-full bg-[var(--primary)]"
                      : "block w-2.5 h-2.5 rounded-full border-2 border-[var(--border)]"
                  }
                  aria-hidden="true"
                />
              </button>
              <button
                onClick={() => openMessage(msg.id)}
                className="flex-1 min-w-0 flex flex-col justify-center text-left rounded-xl px-2 py-2 focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] focus-visible:outline-offset-1"
                aria-label={`${
                  msg.read ? "Message" : "Unread message"
                } from ${msg.from}: ${msg.subject}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-sm truncate ${
                      msg.read
                        ? "text-[var(--muted-foreground)] font-normal"
                        : "text-[var(--foreground)] font-semibold"
                    }`}
                  >
                    {msg.from}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                    {msg.timestamp}
                  </span>
                </div>
                <p
                  className={`text-sm truncate mt-0.5 ${
                    msg.read
                      ? "text-[var(--muted-foreground)] font-normal"
                      : "text-[var(--foreground)] font-medium"
                  }`}
                >
                  {msg.subject}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5 leading-snug">
                  {msg.body.replace(/\n/g, " ").slice(0, 90)}
                  {msg.body.length > 90 ? "…" : ""}
                </p>
              </button>
              <button
                onClick={() => toggleArchiveFromList(msg)}
                className="flex-shrink-0 self-center text-xs font-semibold text-[var(--primary)] rounded-xl px-3 min-h-[44px] hover:bg-[var(--border)] focus-visible:outline-[3px] focus-visible:outline-[var(--ring)] transition-colors"
                aria-label={
                  (msg.archived
                    ? "Unarchive message from "
                    : "Archive message from ") + msg.from
                }
                title={msg.archived ? "Move back to Inbox" : "Move to Archive"}
              >
                {msg.archived ? "Unarchive" : "Archive"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
