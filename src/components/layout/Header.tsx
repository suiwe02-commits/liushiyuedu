import { Link, useLocation } from 'react-router-dom'
import { Settings, LogOut, BookMarked } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function Header() {
  const location = useLocation()
  const { isAuthenticated, logout } = useAuthStore()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">流</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">流式网读</span>
          </Link>

          {/* 右侧：单词本 + 设置 + 登录/注册/退出 */}
          <nav className="flex items-center gap-1">
            <Link
              to="/wordbook"
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive('/wordbook') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <BookMarked size={18} />
              <span className="hidden sm:inline">单词本</span>
            </Link>
            <Link
              to="/settings"
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive('/settings') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">设置</span>
            </Link>

            {!isAuthenticated ? (
              <div className="flex items-center gap-1 ml-1">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  注册
                </Link>
              </div>
            ) : (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">退出</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
