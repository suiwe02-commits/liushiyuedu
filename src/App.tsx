import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Home from '@/pages/Home'
import Reader from '@/pages/Reader'
import Wordbook from '@/pages/Wordbook'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Settings from '@/pages/Settings'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { localDB } from '@/services/localDB'

function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  const { setUser, setLoading } = useAuthStore()
  const { isDarkMode } = useThemeStore()

  useEffect(() => {
    // 初始化应用
    const initApp = async () => {
      try {
        setLoading(true)
        
        // 尝试从localStorage恢复游客数据
        const localData = await localDB.folders.getAll()
        console.log('Local data loaded:', localData.length, 'folders')
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setLoading(false)
      }
    }

    initApp()
  }, [setUser, setLoading])

  // 应用夜间模式到 body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode')
      document.documentElement.classList.add('dark')
    } else {
      document.body.classList.remove('dark-mode')
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  if (!isInitialized) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className={`transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 带导航栏的页面 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/wordbook" element={<Wordbook />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* 不带导航栏的页面 */}
        <Route path="/reader/:articleId" element={<Reader />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
