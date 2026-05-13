import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 检查是否已配置 Supabase
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// 创建 Supabase 客户端（仅在配置有效时创建）
let _supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!_supabase && isSupabaseConfigured()) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return _supabase!
}

// 导出的 supabase 代理，延迟初始化
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// 获取当前会话
export const getCurrentSession = async () => {
  if (!isSupabaseConfigured()) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// 获取当前用户
export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
