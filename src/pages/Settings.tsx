import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, Palette, Database, Info, Trash2, ArrowLeft, HardDrive, Book } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { localDB } from '@/services/localDB'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'

export default function Settings() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { isDarkMode } = useThemeStore()
  const [showClearDataModal, setShowClearDataModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  
  // 存储用量
  const [wordbookCount, setWordbookCount] = useState(0)
  const [cacheSize, setCacheSize] = useState(0) // bytes
  
  // 计算容量上限
  const wordbookLimit = isAuthenticated ? 300 : 50
  const cacheLimit = isAuthenticated ? 10 * 1024 * 1024 : 5 * 1024 * 1024 // 10MB : 5MB
  
  // 加载存储用量
  useEffect(() => {
    const loadUsage = async () => {
      try {
        const wordbookData = await localDB.wordbook?.getAll() || []
        const articlesData = await localDB.articles.getAll() || []
        setWordbookCount(wordbookData.length)
        
        // 计算文章总大小（估算：每个汉字2字节，英文1字节）
        let totalSize = 0
        for (const article of articlesData) {
          totalSize += (article.title?.length || 0) * 2
          totalSize += (article.content?.length || 0) * 2
        }
        setCacheSize(totalSize)
      } catch (error) {
        console.error('Failed to load usage:', error)
      }
    }
    loadUsage()
  }, [])
  
  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }
  
  // 计算百分比
  const getPercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100)
  }

  // 清除本地数据
  const handleClearLocalData = async () => {
    try {
      await localDB.clearAll()
      alert('本地数据已清除')
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear data:', error)
      alert('清除失败')
    }
    setShowClearDataModal(false)
  }

  // 退出登录
  const handleLogout = () => {
    if (!confirm('确定要退出登录吗？')) return
    logout()
    window.location.href = '/'
  }

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
        >
          <ArrowLeft size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
        </button>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <SettingsIcon size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
        </div>
        <div>
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>设置</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>管理您的偏好设置</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 账户信息 */}
        <div className={`rounded-lg shadow-sm border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>账户信息</h2>
          </div>
          <div className="p-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>邮箱</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>注册时间</span>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>账户状态</span>
                  <span className="text-sm text-green-500">已认证</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleLogout}
                >
                  退出登录
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className={`mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>您目前以游客身份使用</p>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  注册后可以将数据同步到云端，在多设备间同步
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.location.href = '/login'}
                  >
                    登录
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => window.location.href = '/register'}
                  >
                    注册
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 阅读设置 */}
        <div className={`rounded-lg shadow-sm border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>阅读设置</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette size={18} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>默认字号</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>设置阅读器的默认字体大小</p>
                </div>
              </div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>16px</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database size={18} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>默认行高</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>设置阅读器的默认行高</p>
                </div>
              </div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1.5</span>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className={`rounded-lg shadow-sm border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>存储用量</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* 单词本用量 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Book size={18} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>单词本</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {isAuthenticated ? '已登录用户' : '游客'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm ${wordbookCount >= wordbookLimit ? 'text-red-500' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {wordbookCount} / {wordbookLimit}
                </span>
              </div>
              <div className={`h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className={`h-full rounded-full transition-all ${wordbookCount >= wordbookLimit ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${getPercentage(wordbookCount, wordbookLimit)}%` }}
                />
              </div>
            </div>
            
            {/* 缓存用量 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive size={18} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>文章缓存</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {isAuthenticated ? '已登录用户' : '游客'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm ${cacheSize >= cacheLimit ? 'text-red-500' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatSize(cacheSize)} / {formatSize(cacheLimit)}
                </span>
              </div>
              <div className={`h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className={`h-full rounded-full transition-all ${cacheSize >= cacheLimit ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${getPercentage(cacheSize, cacheLimit)}%` }}
                />
              </div>
            </div>
            
            <div className={`pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database size={18} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>云端同步</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {isAuthenticated ? '已启用，数据将自动同步' : '未启用，登录后开启'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm ${isAuthenticated ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {isAuthenticated ? '已启用' : '未启用'}
                </span>
              </div>
            </div>
            
            <div className={`pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <Button
                variant="danger"
                className="w-full"
                leftIcon={<Trash2 size={16} />}
                onClick={() => setShowClearDataModal(true)}
              >
                清除本地数据
              </Button>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className={`rounded-lg shadow-sm border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>关于</h2>
          </div>
          <div className="p-4">
            <button
              onClick={() => setShowAboutModal(true)}
              className="flex items-center gap-3 w-full"
            >
              <Info size={18} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
              <div className="text-left">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>流式阅读</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>版本 1.0.0</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 清除数据确认弹窗 */}
      <Modal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        title="确认清除数据"
      >
        <div className="space-y-4">
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            确定要清除所有本地数据吗？此操作不可恢复：
          </p>
          <ul className={`list-disc list-inside text-sm space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <li>所有文章</li>
            <li>所有文件夹</li>
            <li>所有标注</li>
            <li>单词本</li>
          </ul>
          {isAuthenticated && (
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                注意：如果您已登录，云端数据不会受影响。
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowClearDataModal(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleClearLocalData}
            >
              确认清除
            </Button>
          </div>
        </div>
      </Modal>

      {/* 关于弹窗 */}
      <Modal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title="关于流式阅读"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">流</span>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>流式阅读</h3>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>版本 1.0.0</p>
            </div>
          </div>
          
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            流式阅读是一款帮助用户高效阅读外语文章的工具，核心功能包括：
          </p>
          
          <ul className={`list-disc list-inside text-sm space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <li>文章导入与管理</li>
            <li>单词即点即译</li>
            <li>自动标注翻译</li>
            <li>段落翻译</li>
            <li>单词本记忆</li>
            <li>云端同步（注册后）</li>
          </ul>
          
          <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Button className="w-full" onClick={() => setShowAboutModal(false)}>
              知道了
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
