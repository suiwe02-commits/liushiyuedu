import { useState } from 'react'
import { Settings as SettingsIcon, Palette, Database, Shield, Info, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { localDB } from '@/services/localDB'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'

export default function Settings() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [showClearDataModal, setShowClearDataModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)

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
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <SettingsIcon size={20} className="text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">设置</h1>
          <p className="text-sm text-gray-500">管理您的偏好设置</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 账户信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">账户信息</h2>
          </div>
          <div className="p-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">邮箱</span>
                  <span className="text-sm font-medium text-gray-900">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">注册时间</span>
                  <span className="text-sm text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">账户状态</span>
                  <span className="text-sm text-green-600">已认证</span>
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
                <p className="text-gray-500 mb-3">您目前以游客身份使用</p>
                <p className="text-sm text-gray-400 mb-4">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">阅读设置</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">默认字号</p>
                  <p className="text-xs text-gray-500">设置阅读器的默认字体大小</p>
                </div>
              </div>
              <span className="text-sm text-gray-600">16px</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">默认行高</p>
                  <p className="text-xs text-gray-500">设置阅读器的默认行高</p>
                </div>
              </div>
              <span className="text-sm text-gray-600">1.5</span>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">数据管理</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">本地存储</p>
                  <p className="text-xs text-gray-500">数据存储在浏览器本地</p>
                </div>
              </div>
              <span className="text-sm text-green-600">正常</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">云端同步</p>
                  <p className="text-xs text-gray-500">
                  {isAuthenticated ? '已启用，数据将自动同步' : '未启用，登录后开启'}
                </p>
                </div>
              </div>
              <span className={`text-sm ${isAuthenticated ? 'text-green-600' : 'text-gray-400'}`}>
                {isAuthenticated ? '已启用' : '未启用'}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-100">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">关于</h2>
          </div>
          <div className="p-4">
            <button
              onClick={() => setShowAboutModal(true)}
              className="flex items-center gap-3 w-full"
            >
              <Info size={18} className="text-gray-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">流式阅读</p>
                <p className="text-xs text-gray-500">版本 1.0.0</p>
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
          <p className="text-gray-600">
            确定要清除所有本地数据吗？此操作不可恢复：
          </p>
          <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
            <li>所有文章</li>
            <li>所有文件夹</li>
            <li>所有标注</li>
            <li>单词本</li>
          </ul>
          {isAuthenticated && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">流</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">流式阅读</h3>
              <p className="text-gray-500">版本 1.0.0</p>
            </div>
          </div>
          
          <p className="text-gray-600">
            流式阅读是一款帮助用户高效阅读外语文章的工具，核心功能包括：
          </p>
          
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>文章导入与管理</li>
            <li>单词即点即译</li>
            <li>自动标注翻译</li>
            <li>段落翻译</li>
            <li>单词本记忆</li>
            <li>云端同步（注册后）</li>
          </ul>
          
          <div className="pt-4 border-t border-gray-200">
            <Button className="w-full" onClick={() => setShowAboutModal(false)}>
              知道了
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
