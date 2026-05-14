import { Outlet } from 'react-router-dom'
import Header from './Header'
import { useThemeStore } from '@/stores/themeStore'

export default function AppLayout() {
  const { isDarkMode } = useThemeStore()

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header />
      <main className={`max-w-6xl mx-auto px-4 py-6 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <Outlet />
      </main>
    </div>
  )
}
