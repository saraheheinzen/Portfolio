import { about } from '../data/content'

interface WelcomeViewProps {
  onOpenAbout: () => void
  onOpenBrowser: () => void
}

export function WelcomeView({ onOpenAbout, onOpenBrowser }: WelcomeViewProps) {
  return (
    <div className="sticky-note">
      <p className="sticky-note__label">Sticky</p>
      <h1 className="sticky-note__title">
        Hey — this is {about.name.split(' ')[0]}&rsquo;s space.
      </h1>
      <p className="sticky-note__body">
        {about.title} at {about.company}. Start in the Browser — Featured,
        Product, Games, Inclusive Design — or poke around Games and YouTube.
        Drag this note wherever you like.
      </p>
      <ul className="sticky-note__tips">
        <li>Drag me around the desktop</li>
        <li>Dock magnifier zooms into work</li>
        <li>A11y settings sit next to Magnifier</li>
      </ul>
      <div className="sticky-note__actions">
        <button type="button" onClick={onOpenAbout}>
          About
        </button>
        <button type="button" className="is-primary" onClick={onOpenBrowser}>
          Browser
        </button>
      </div>
    </div>
  )
}
