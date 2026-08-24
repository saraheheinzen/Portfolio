import { useState } from 'react'
import { figmaFiles } from '../data/figma'
import { FigmaEmbedView } from './FigmaEmbedView'
import { WinIcon } from './WinIcon'

export function FigmaView() {
  const [activeFileId, setActiveFileId] = useState(figmaFiles[0]?.id ?? '')
  const activeFile =
    figmaFiles.find((file) => file.id === activeFileId) ?? figmaFiles[0]

  return (
    <div className="figma-view">
      <header className="figma-view__chrome">
        <div className="figma-view__brand">
          <WinIcon name="figma" size={18} />
          <span className="figma-view__file">
            {activeFile ? `${activeFile.label}.fig` : 'Figma'}
          </span>
        </div>
        <span className="figma-view__meta">{figmaFiles.length} files</span>
      </header>

      <div className="figma-view__body figma-view__body--live">
        <nav className="figma-view__pages" aria-label="Figma files">
          <p className="figma-view__pages-label">Files</p>
          <ul className="figma-view__page-list">
            {figmaFiles.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  className={`figma-view__page${
                    activeFileId === file.id ? ' is-active' : ''
                  }`}
                  aria-current={activeFileId === file.id ? 'page' : undefined}
                  onClick={() => setActiveFileId(file.id)}
                >
                  {file.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="figma-view__canvas-wrap figma-view__canvas-wrap--live">
          {activeFile ? (
            <FigmaEmbedView
              key={activeFile.id}
              shareUrl={activeFile.url}
              title={activeFile.label}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
