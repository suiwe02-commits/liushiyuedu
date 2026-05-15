import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { supabase } from '@/api/supabase'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  
  setUser: (user: User | null) => void
  setGuest: (isGuest: boolean) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  initAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isGuest: true,
      isLoading: true,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isGuest: !user,
        isLoading: false,
      }),
      
      setGuest: (isGuest) => set({ 
        isGuest,
        isAuthenticated: !isGuest && !!get().user,
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      logout: () => {
        supabase.auth.signOut()
        set({ 
          user: null, 
          isAuthenticated: false,
          isGuest: true,
          isLoading: false,
        })
      },
      
      // 初始化时恢复登录状态
      initAuth: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            set({
              user: {
                id: session.user.id,
                email: session.user.email || '',
                created_at: session.user.created_at,
                last_login_at: new Date().toISOString(),
                is_active: true,
              },
              isAuthenticated: true,
              isGuest: false,
              isLoading: false,
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Auth init error:', error)
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
      }),
    }
  )
)
