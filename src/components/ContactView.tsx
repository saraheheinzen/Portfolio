import { useState, type FormEvent } from 'react'
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

export function ContactView() {
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '')
    const email = String(data.get('email') ?? '')
    const message = String(data.get('message') ?? '')
    const body = encodeURIComponent(
      `Hi Sarah,\n\n${message}\n\n— ${name} (${email})`,
    )
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Portfolio inquiry')}&body=${body}`
    setStatus('sent')
  }

  return (
    <div className="mail-app">
      <header className="mail-app__ribbon" aria-label="Mail toolbar">
        <span className="mail-app__new" aria-hidden="true">
          New Email
        </span>
        <div className="mail-app__ribbon-actions" aria-hidden="true">
          <span className="mail-app__ribbon-btn">Delete</span>
          <span className="mail-app__ribbon-btn">Archive</span>
          <span className="mail-app__ribbon-btn">Junk</span>
          <span className="mail-app__ribbon-sep" />
          <span className="mail-app__ribbon-btn">Reply</span>
          <span className="mail-app__ribbon-btn">Reply All</span>
          <span className="mail-app__ribbon-btn">Forward</span>
        </div>
        <label className="mail-app__search">
          <span className="visually-hidden">Search mail</span>
          <input type="search" placeholder="Search" disabled />
        </label>
      </header>

      <div className="mail-app__body">
        <nav className="mail-app__folders" aria-label="Folders">
          <p className="mail-app__folder-group">Favorites</p>
          <button type="button" className="mail-app__folder is-active">
            Inbox
            <em>{contactInbox.length}</em>
          </button>
          <p className="mail-app__folder-group">Folders</p>
          <button type="button" className="mail-app__folder" tabIndex={-1}>
            Drafts
          </button>
          <button type="button" className="mail-app__folder" tabIndex={-1}>
            Sent Items
          </button>
          <button type="button" className="mail-app__folder" tabIndex={-1}>
            Deleted Items
          </button>
          <button type="button" className="mail-app__folder" tabIndex={-1}>
            Junk Email
          </button>
        </nav>

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
      </div>
    </div>
  )
}
