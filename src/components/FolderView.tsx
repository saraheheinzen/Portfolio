import { categories, getProjectsByCategory, type ProjectCategory } from '../data/content'
import { DesktopIcon } from './DesktopIcon'
import { WinIcon } from './WinIcon'

interface FolderViewProps {
  category: ProjectCategory
  selectedIcon: string | null
  onSelect: (id: string) => void
  onOpenProject: (id: string) => void
}

export function FolderView({
  category,
  selectedIcon,
  onSelect,
  onOpenProject,
}: FolderViewProps) {
  const info = categories[category]
  const items = getProjectsByCategory(category)

  return (
    <div className="folder-view">
      <div className="folder-view__toolbar">
        <WinIcon name="folder" size={20} />
        <span>{info.label}</span>
        <span className="folder-view__meta">{items.length} items</span>
      </div>
      <p className="folder-view__desc">{info.description}</p>
      <div className="folder-view__grid">
        {items.map((project) => (
          <DesktopIcon
            key={project.id}
            id={`folder-item-${project.id}`}
            label={project.title}
            cover={project.cover}
            selected={selectedIcon === project.id}
            onSelect={() => onSelect(project.id)}
            onOpen={() => onOpenProject(project.id)}
          />
        ))}
      </div>
    </div>
  )
}
