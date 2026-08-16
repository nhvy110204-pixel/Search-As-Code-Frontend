import { useViewStore } from '@/store/useViewStore'
import { ProjectsHub } from './ProjectsHub'
import { ProjectDetailView } from './ProjectDetailView'

export function ProjectsRoot() {
  const { detailProjectId } = useViewStore()

  if (detailProjectId) {
    return <ProjectDetailView projectId={detailProjectId} />
  }

  return <ProjectsHub />
}
