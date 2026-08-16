import { create } from 'zustand'

export type AppView = 'chat' | 'projects'
export type ProjectDetailTab = 'documents' | 'settings'

interface ViewStore {
  currentView: AppView
  detailProjectId: string | null
  detailTab: ProjectDetailTab

  // Navigation actions
  navigateToChat: (sessionId?: string, projectId?: string) => void
  navigateToProjects: () => void
  navigateToProjectDetail: (projectId: string, tab?: ProjectDetailTab) => void
  setDetailTab: (tab: ProjectDetailTab) => void
}

export const useViewStore = create<ViewStore>((set) => ({
  currentView: 'chat',
  detailProjectId: null,
  detailTab: 'documents',

  navigateToChat: (_sessionId, _projectId) => {
    set({ currentView: 'chat' })
  },

  navigateToProjects: () => {
    set({ currentView: 'projects', detailProjectId: null })
  },

  navigateToProjectDetail: (projectId, tab = 'documents') => {
    set({ currentView: 'projects', detailProjectId: projectId, detailTab: tab })
  },

  setDetailTab: (tab) => {
    set({ detailTab: tab })
  },
}))
