import { Link, useLocation } from 'react-router-dom'
import { Settings, LogOut, BookMarked, Moon, Sun, Download } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useWordbookStore } from '@/stores/wordbookStore'

export default function Header() {
  const location = useLocation()
  const { isAuthenticated, logout } = useAuthStore()
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const { entries } = useWordbookStore()

  const isActive = (path: string) => location.pathname === path
  const isWordbook = location.pathname === '/wordbook'

  // 导出单词本
  const handleExport = () => {
    const headers = ['英文', '中文']
    const rows = entries.map(e => [e.word, e.translation])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `单词本_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className={`sticky top-0 z-40 border-b ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">流</span>
            </div>
            <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>流式网读</span>
          </Link>

          {/* 右侧导航 */}
          <nav className="flex items-center gap-1">
            {/* 夜间模式切换 */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* 桌面端单词本 */}
            <Link
              to="/wordbook"
              className={`
                hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive('/wordbook') 
                  ? 'bg-cyan-50 text-cyan-600' 
                  : isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <BookMarked size={18} />
              <span>单词本</span>
            </Link>

            {/* 单词本导出按钮（只在单词本页面显示） */}
            {isWordbook && entries.length > 0 && (
              <button
                onClick={handleExport}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Download size={18} />
                <span className="hidden sm:inline">导出</span>
              </button>
            )}
            <Link
              to="/settings"
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive('/settings') 
                  ? 'bg-cyan-50 text-cyan-600' 
                  : isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">设置</span>
            </Link>

            {!isAuthenticated ? (
              <div className="flex items-center gap-1 ml-1">
                <Link
                  to="/login"
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-800' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  注册
                </Link>
              </div>
            ) : (
              <button
                onClick={logout}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ml-1 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">退出</span>
              </button>
            )}
          </nav>
        </div>

        {/* 移动端：单词本按钮（在导航栏下方） */}
        <div className={`sm:hidden flex items-center justify-between py-2 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <Link
            to="/wordbook"
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive('/wordbook') 
                ? 'bg-cyan-50 text-cyan-600' 
                : isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <BookMarked size={18} />
            <span>单词本</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
