import { useState } from 'react'
import { DesktopIcon } from './DesktopIcon'
import { WinIcon } from './WinIcon'

export const DOCUMENTS = [
  {
    id: 'resume',
    label: 'Sarah Heinzen Resume',
    href: '/SarahHeinzenResume.pdf',
  },
] as const

interface DocumentsViewProps {
  onOpenDocument: (docId: string, title: string, href: string) => void
}

export function DocumentsView({ onOpenDocument }: DocumentsViewProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="folder-view">
      <div className="folder-view__toolbar">
        <WinIcon name="documents" size={20} />
        <span>Documents</span>
        <span className="folder-view__meta">{DOCUMENTS.length} items</span>
      </div>
      <p className="folder-view__desc">Files and downloads.</p>
      <div className="folder-view__grid">
        {DOCUMENTS.map((doc) => (
          <DesktopIcon
            key={doc.id}
            id={`doc-item-${doc.id}`}
            label={doc.label}
            icon="file"
            selected={selected === doc.id}
            onSelect={() => setSelected(doc.id)}
            onOpen={() => onOpenDocument(doc.id, doc.label, doc.href)}
          />
        ))}
      </div>
    </div>
  )
}
