import { create } from 'zustand'
import type { AuthUser } from '@toolhub/auth'

interface AppState {
  user: AuthUser | null
  setUser: (u: AuthUser | null) => void
  activeCategory: string | null
  setActiveCategory: (id: string | null) => void
  showFavoritesOnly: boolean
  setShowFavoritesOnly: (v: boolean) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  activeCategory: null,
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  showFavoritesOnly: false,
  setShowFavoritesOnly: (showFavoritesOnly) => set({ showFavoritesOnly }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}))
