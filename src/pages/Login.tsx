import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/api/supabase'
import { localDB } from '@/services/localDB'
import Button from '@/components/common/Button'

export default function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user) {
        // 登录成功
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at,
          last_login_at: new Date().toISOString(),
          is_active: true,
        })
        
        // 从云端同步数据
        await syncDataFromCloud()
        
        navigate('/')
      }
    } catch (err) {
      setError('登录失败，请稍后重试')
      console.error('Login error:', err)
    }

    setIsLoading(false)
  }

  // 从云端同步数据
  const syncDataFromCloud = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 获取云端数据
      const [folders, articles, annotations, translations, wordbook] = await Promise.all([
        supabase.from('folders').select('*').eq('user_id', user.id),
        supabase.from('articles').select('*').eq('user_id', user.id),
        supabase.from('annotations').select('*').eq('user_id', user.id),
        supabase.from('translations').select('*').eq('user_id', user.id),
        supabase.from('wordbook').select('*').eq('user_id', user.id),
      ])

      // 同步到本地
      if (folders.data) {
        for (const folder of folders.data) {
          await localDB.folders.set(folder)
        }
      }
      if (articles.data) {
        for (const article of articles.data) {
          await localDB.articles.set(article)
        }
      }
      if (annotations.data) {
        for (const annotation of annotations.data) {
          await localDB.annotations.set(annotation)
        }
      }
      if (translations.data) {
        for (const translation of translations.data) {
          await localDB.translations.set(translation)
        }
      }
      if (wordbook.data) {
        for (const entry of wordbook.data) {
          await localDB.wordbook.set(entry)
        }
      }

      console.log('Data synced from cloud')
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  // 发送密码重置邮件
  const handleResetPassword = async () => {
    if (!email) {
      setError('请先输入邮箱地址')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setResetSent(true)
    } catch (err) {
      setError('发送失败，请稍后重试')
    }

    setIsLoading(false)
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

        {/* 登录表单 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <LogIn size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">登录账户</h1>
              <p className="text-sm text-gray-500">登录后可同步数据到云端</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg mb-4">
              <p className="text-sm">密码重置邮件已发送，请查收</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-gray-600">记住登录状态</span>
              </label>
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-blue-600 hover:underline"
              >
                忘记密码？
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              登录
            </Button>
          </form>

          {/* 分隔线 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          {/* 注册链接 */}
          <p className="text-center text-sm text-gray-600">
            还没有账户？{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
