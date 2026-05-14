import { Link, useLocation } from 'react-router-dom'
import { BookOpen, BookMarked, Settings, LogIn, LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function Header() {
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuthStore()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* 第一栏：Logo + 登录注册 */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">流</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">流式网读</span>
            </Link>

            {!isAuthenticated && (
              <div className="flex items-center gap-1.5 ml-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogIn size={15} />
                  <span className="hidden sm:inline">登录</span>
                </Link>
                <Link
                  to="/register"
                  className="px-2.5 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="hidden sm:inline">注册</span>
                </Link>
              </div>
            )}
          </div>

          {/* 第二栏：设置 + 书架 + 单词本 */}
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline">书架</span>
            </Link>
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

            {/* 已登录用户 */}
            {isAuthenticated && (
              <div className="flex items-center gap-1.5 ml-1 pl-1 border-l border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <User size={15} />
                  <span className="hidden sm:inline max-w-[120px] truncate">{user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="退出登录"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
