import { useState, type FormEvent, type ReactNode } from 'react'
import { contact, contactInbox } from '../data/content'

function initials(from: string) {
  const parts = from.replace(/[^\w\s]/g, '').trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return from.slice(0, 2).toUpperCase()
}

function avatarTone(from: string) {
  let hash = 0
  for (let i = 0; i < from.length; i++) hash = (hash + from.charCodeAt(i) * (i + 1)) % 6
  return hash
}

function FolderIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="mail-app__folder-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const folderIcons = {
  inbox: (
    <FolderIcon>
      <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z" />
      <path d="M4 8l2.2-3.3A1 1 0 0 1 7 4h10a1 1 0 0 1 .8.4L20 8" />
      <path d="M4 8h16" />
    </FolderIcon>
  ),
  drafts: (
    <FolderIcon>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
      <path d="M9 13h6M9 17h4" />
    </FolderIcon>
  ),
  sent: (
    <FolderIcon>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </FolderIcon>
  ),
  deleted: (
    <FolderIcon>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </FolderIcon>
  ),
  junk: (
    <FolderIcon>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.3 2.6 18a1.5 1.5 0 0 0 1.3 2.25h16.2A1.5 1.5 0 0 0 21.4 18L13.7 4.3a1.5 1.5 0 0 0-2.6 0Z" />
    </FolderIcon>
  ),
} as const

export function ContactView({ linear = false }: { linear?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')
  const [inboxOpen, setInboxOpen] = useState(false)
  const showInbox = linear || inboxOpen

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '')
    const email = String(data.get('email') ?? '')
    const message = String(data.get('message') ?? '')
    const body = encodeURIComponent(
      `Hi Sarah,\n\n${message}\n\n${name} (${email})`,
    )
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Portfolio inquiry')}&body=${body}`
    setStatus('sent')
  }

  const folders = (
    <nav className="mail-app__folders" aria-label="Folders">
      <button
        type="button"
        className={`mail-app__folder${showInbox ? ' is-active' : ''}`}
        title="Inbox"
        aria-label={`Inbox, ${contactInbox.length} messages`}
        aria-current={showInbox ? 'page' : undefined}
        aria-expanded={linear ? undefined : showInbox}
        onClick={linear ? undefined : () => setInboxOpen((v) => !v)}
      >
        {folderIcons.inbox}
        <em>{contactInbox.length}</em>
      </button>
      <button
        type="button"
        className="mail-app__folder"
        title="Drafts"
        aria-label="Drafts"
        tabIndex={-1}
      >
        {folderIcons.drafts}
      </button>
      <button
        type="button"
        className="mail-app__folder"
        title="Sent Items"
        aria-label="Sent Items"
        tabIndex={-1}
      >
        {folderIcons.sent}
      </button>
      <button
        type="button"
        className="mail-app__folder"
        title="Deleted Items"
        aria-label="Deleted Items"
        tabIndex={-1}
      >
        {folderIcons.deleted}
      </button>
      <button
        type="button"
        className="mail-app__folder"
        title="Junk Email"
        aria-label="Junk Email"
        tabIndex={-1}
      >
        {folderIcons.junk}
      </button>
    </nav>
  )

  const inbox = (
    <section className="mail-app__list" aria-label="Inbox">
      <header className="mail-app__list-header">
        <h1>Inbox</h1>
        <span>{contactInbox.length} messages</span>
      </header>
      <ul className="mail-app__messages">
        {contactInbox.map((msg) => (
          <li key={msg.id}>
            <div
              className={`mail-app__message${msg.unread ? ' is-unread' : ''}`}
            >
              <span
                className={`mail-app__avatar mail-app__avatar--${avatarTone(msg.from)}`}
                aria-hidden="true"
              >
                {initials(msg.from)}
              </span>
              <span className="mail-app__message-copy">
                <span className="mail-app__message-top">
                  <strong>{msg.from}</strong>
                  <time dateTime={msg.received}>{msg.receivedLabel}</time>
                </span>
                <span className="mail-app__message-subject">
                  {msg.subject}
                </span>
                <span className="mail-app__message-preview">
                  {msg.preview}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )

  const compose = (
    <section className="mail-app__reading" aria-label="New email">
      <div className="mail-app__compose">
        <header className="mail-app__compose-header">
          <h2>New Email</h2>
          <p>
            To: <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </header>
        <p className="mail-app__compose-note">{contact.note}</p>
        <form className="mail-app__form" onSubmit={onSubmit}>
          <label>
            Name
            <input name="name" type="text" required autoComplete="name" />
          </label>
          <label>
            Email Address
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Message
            <textarea name="message" rows={6} required />
          </label>
          <button type="submit">Send</button>
        </form>
        {status === 'sent' ? (
          <p className="mail-app__status" role="status">
            Opening your mail app…
          </p>
        ) : null}
      </div>
    </section>
  )

  return (
    <div className="mail-app">
      <div
        className={`mail-app__body${!linear && !showInbox ? ' mail-app__body--inbox-closed' : ''}`}
      >
        {linear ? (
          <>
            {compose}
            {folders}
            {inbox}
          </>
        ) : (
          <>
            {folders}
            {showInbox ? inbox : null}
            {compose}
          </>
        )}
      </div>
    </div>
  )
}
