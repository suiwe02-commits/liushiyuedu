import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  
  setUser: (user: User | null) => void
  setGuest: (isGuest: boolean) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: true, // 默认游客模式
  isLoading: true,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isGuest: !user,
    isLoading: false,
  }),
  
  setGuest: (isGuest) => set({ 
    isGuest,
    isAuthenticated: !isGuest,
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  logout: () => set({ 
    user: null, 
    isAuthenticated: false,
    isGuest: true,
    isLoading: false,
  }),
}))
