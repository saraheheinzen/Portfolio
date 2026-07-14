import { EXPLORE_OPTIONS, type ExploreMode } from '../hooks/useExploreMode'

interface ExploreGateProps {
  onChoose: (mode: ExploreMode) => void
}

export function ExploreGate({ onChoose }: ExploreGateProps) {
  return (
    <div className="explore-gate" role="dialog" aria-modal="true" aria-labelledby="explore-title">
      <div className="explore-gate__panel">
        <p className="explore-gate__eyebrow">Accessibility · Portfolio OS</p>
        <h1 id="explore-title">How would you like to explore?</h1>
        <p className="explore-gate__lede">
          Pick a starting mode. The whole desktop adapts — you can change this
          anytime from the dock.
        </p>
        <ul className="explore-gate__options">
          {EXPLORE_OPTIONS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="explore-gate__option"
                onClick={() => onChoose(option.id)}
              >
                <span className="explore-gate__option-label">{option.label}</span>
                <span className="explore-gate__option-desc">{option.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
