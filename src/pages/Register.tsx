import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/api/supabase'
import { localDB } from '@/services/localDB'
import Button from '@/components/common/Button'

export default function Register() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证密码
    if (password.length < 6) {
      setError('密码长度至少为6位')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user) {
        // 注册成功，将本地数据同步到云端
        await syncLocalDataToCloud(data.user.id)
        
        setSuccess(true)
        
        // 自动登录
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at,
          last_login_at: new Date().toISOString(),
          is_active: true,
        })
        
        // 延迟跳转
        setTimeout(() => {
          navigate('/')
        }, 2000)
      }
    } catch (err) {
      setError('注册失败，请稍后重试')
      console.error('Register error:', err)
    }

    setIsLoading(false)
  }

  // 将本地数据同步到云端
  const syncLocalDataToCloud = async (userId: string) => {
    try {
      // 获取所有本地数据
      const localData = await localDB.exportAll()
      
      // 同步到云端
      if (localData.folders.length > 0) {
        const foldersToInsert = localData.folders.map(f => ({
          ...f,
          user_id: userId,
        }))
        await supabase.from('folders').upsert(foldersToInsert)
      }
      
      if (localData.articles.length > 0) {
        const articlesToInsert = localData.articles.map(a => ({
          ...a,
          user_id: userId,
        }))
        await supabase.from('articles').upsert(articlesToInsert)
      }
      
      if (localData.annotations.length > 0) {
        const annotationsToInsert = localData.annotations.map(a => ({
          ...a,
          user_id: userId,
        }))
        await supabase.from('annotations').upsert(annotationsToInsert)
      }
      
      if (localData.translations.length > 0) {
        const translationsToInsert = localData.translations.map(t => ({
          ...t,
          user_id: userId,
        }))
        await supabase.from('translations').upsert(translationsToInsert)
      }
      
      if (localData.wordbook.length > 0) {
        const wordbookToInsert = localData.wordbook.map(w => ({
          ...w,
          user_id: userId,
        }))
        await supabase.from('wordbook').upsert(wordbookToInsert)
      }
      
      console.log('Local data synced to cloud')
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">注册成功！</h2>
          <p className="text-gray-600 mb-4">
            您的本地数据正在同步到云端，稍后将自动跳转到首页...
          </p>
          <div className="loading-spinner mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          返回首页
        </Link>

        {/* 注册表单 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">创建账户</h1>
              <p className="text-sm text-gray-500">注册后自动同步本地数据</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                确认密码
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* 提示 */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>提示：</strong>注册后，您本地的所有数据（文章、单词本等）将自动同步到云端，可在多设备间同步。
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              注册
            </Button>
          </form>

          {/* 分隔线 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">已有账户？</span>
            </div>
          </div>

          {/* 登录链接 */}
          <p className="text-center text-sm text-gray-600">
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
