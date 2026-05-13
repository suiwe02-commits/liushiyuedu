import { Link, useLocation } from 'react-router-dom'
import { BookOpen, BookMarked, Settings, LogIn, LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function Header() {
  const location = useLocation()
  const { isAuthenticated, isGuest, user, logout } = useAuthStore()

  const navItems = [
    { path: '/', label: '文章', icon: BookOpen },
    { path: '/wordbook', label: '单词本', icon: BookMarked },
    { path: '/settings', label: '设置', icon: Settings },
  ]

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
            <span className="text-lg font-semibold text-gray-900 hidden sm:block">
              流式阅读
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive(path) 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <User size={16} />
                  <span className="hidden sm:inline">{user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="退出登录"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogIn size={16} />
                  <span>登录</span>
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  注册
                </Link>
              </div>
            )}

            {/* Guest Badge */}
            {isGuest && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                游客模式
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
