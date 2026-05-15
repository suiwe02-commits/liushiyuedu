import { supabase, isSupabaseConfigured } from '@/api/supabase'
import { localDB } from './localDB'
import type { Article, Folder, Annotation, Translation, WordbookEntry } from '@/types'

// 同步队列（用于离线时缓存操作）
interface SyncQueueItem {
  id: string
  table: string
  operation: 'upsert' | 'delete'
  data: unknown
  timestamp: number
}

const SYNC_QUEUE_KEY = 'sync_queue'

// 获取同步队列
const getSyncQueue = (): SyncQueueItem[] => {
  const queue = localStorage.getItem(SYNC_QUEUE_KEY)
  return queue ? JSON.parse(queue) : []
}

// 添加到同步队列
const addToSyncQueue = (item: Omit<SyncQueueItem, 'id' | 'timestamp'>) => {
  const queue = getSyncQueue()
  queue.push({
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  })
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
}

// 从队列中移除已完成的项目
const removeFromSyncQueue = (id: string) => {
  const queue = getSyncQueue().filter(item => item.id !== id)
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
}

// 同步单条数据到云端
export const syncToCloud = async (
  table: string,
  data: unknown,
  operation: 'upsert' | 'delete' = 'upsert'
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      // 未登录，添加到同步队列
      addToSyncQueue({ table, operation, data })
      return false
    }

    if (operation === 'delete') {
      const id = (data as { id: string }).id
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    } else {
      // 添加 user_id 以通过 RLS 策略
      const dataWithUser = { ...(data as Record<string, unknown>), user_id: session.user.id }
      const { error } = await supabase.from(table).upsert(dataWithUser)
      if (error) throw error
    }

    return true
  } catch (error) {
    console.error(`Sync to cloud failed [${table}]:`, error)
    // 同步失败，添加到队列稍后重试
    addToSyncQueue({ table, operation, data })
    return false
  }
}

// 从云端同步数据到本地
export const syncFromCloud = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    const userId = session.user.id

    // 并行获取所有数据
    const [
      { data: folders },
      { data: articles },
      { data: annotations },
      { data: translations },
      { data: wordbook },
    ] = await Promise.all([
      supabase.from('folders').select('*').eq('user_id', userId),
      supabase.from('articles').select('*').eq('user_id', userId),
      supabase.from('annotations').select('*').eq('user_id', userId),
      supabase.from('translations').select('*').eq('user_id', userId),
      supabase.from('wordbook').select('*').eq('user_id', userId),
    ])

    // 更新本地数据库
    if (folders) {
      for (const folder of folders as Folder[]) {
        await localDB.folders.set(folder)
      }
    }
    if (articles) {
      for (const article of articles as Article[]) {
        await localDB.articles.set(article)
      }
    }
    if (annotations) {
      for (const annotation of annotations as Annotation[]) {
        await localDB.annotations.set(annotation)
      }
    }
    if (translations) {
      for (const translation of translations as Translation[]) {
        await localDB.translations.set(translation)
      }
    }
    if (wordbook) {
      for (const entry of wordbook as WordbookEntry[]) {
        await localDB.wordbook.set(entry)
      }
    }

    return true
  } catch (error) {
    console.error('Sync from cloud failed:', error)
    return false
  }
}

// 处理同步队列（登录后调用）
export const processSyncQueue = async (): Promise<number> => {
  const queue = getSyncQueue()
  if (queue.length === 0) return 0

  let successCount = 0

  for (const item of queue) {
    const success = await syncToCloud(item.table, item.data, item.operation)
    if (success) {
      removeFromSyncQueue(item.id)
      successCount++
    }
  }

  return successCount
}

// 全量同步（双向）
export const fullSync = async (): Promise<{
  success: boolean
  uploaded: number
  downloaded: number
  message: string
}> => {
  if (!isSupabaseConfigured()) {
    return { success: false, uploaded: 0, downloaded: 0, message: 'Supabase 未配置' }
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, uploaded: 0, downloaded: 0, message: '未登录' }
    }

    // 1. 先处理队列中的离线操作
    const queueProcessed = await processSyncQueue()

    // 2. 上传本地所有数据
    const userId = session.user.id
    const localFolders = await localDB.folders.getAll()
    const localArticles = await localDB.articles.getAll()
    const localAnnotations = await localDB.annotations.getAll()
    const localTranslations = await localDB.translations.getAll()
    const localWordbook = await localDB.wordbook.getAll()

    // 添加 user_id 并上传
    const foldersWithUser = localFolders.map(f => ({ ...f, user_id: userId }))
    const articlesWithUser = localArticles.map(a => ({ ...a, user_id: userId }))
    const annotationsWithUser = localAnnotations.map(a => ({ ...a, user_id: userId }))
    const translationsWithUser = localTranslations.map(t => ({ ...t, user_id: userId }))
    const wordbookWithUser = localWordbook.map(w => ({ ...w, user_id: userId }))

    await Promise.all([
      foldersWithUser.length > 0 && supabase.from('folders').upsert(foldersWithUser),
      articlesWithUser.length > 0 && supabase.from('articles').upsert(articlesWithUser),
      annotationsWithUser.length > 0 && supabase.from('annotations').upsert(annotationsWithUser),
      translationsWithUser.length > 0 && supabase.from('translations').upsert(translationsWithUser),
      wordbookWithUser.length > 0 && supabase.from('wordbook').upsert(wordbookWithUser),
    ])

    const uploadedCount = localFolders.length + localArticles.length + localAnnotations.length + localTranslations.length + localWordbook.length

    // 3. 从云端下载数据
    await syncFromCloud()

    // 4. 重新获取本地数据数量（可能云端有新数据）
    const downloadedFolders = await localDB.folders.getAll()
    const downloadedArticles = await localDB.articles.getAll()
    const downloadedAnnotations = await localDB.annotations.getAll()
    const downloadedTranslations = await localDB.translations.getAll()
    const downloadedWordbook = await localDB.wordbook.getAll()

    const downloadedCount = downloadedFolders.length + downloadedArticles.length + downloadedAnnotations.length + downloadedTranslations.length + downloadedWordbook.length

    return {
      success: true,
      uploaded: uploadedCount,
      downloaded: downloadedCount,
      message: `同步完成：处理队列 ${queueProcessed} 条，上传 ${uploadedCount} 条，下载 ${downloadedCount} 条`,
    }
  } catch (error) {
    console.error('Full sync failed:', error)
    return { success: false, uploaded: 0, downloaded: 0, message: '同步失败：' + (error as Error).message }
  }
}

// 自动同步包装器（用于替换 localDB 操作）
export const syncWrapper = {
  folders: {
    set: async (data: Folder) => {
      await localDB.folders.set(data)
      await syncToCloud('folders', data)
    },
    remove: async (id: string) => {
      await localDB.folders.remove(id)
      await syncToCloud('folders', { id }, 'delete')
    },
  },
  articles: {
    set: async (data: Article) => {
      await localDB.articles.set(data)
      await syncToCloud('articles', data)
    },
    remove: async (id: string) => {
      await localDB.articles.remove(id)
      await syncToCloud('articles', { id }, 'delete')
    },
  },
  annotations: {
    set: async (data: Annotation) => {
      await localDB.annotations.set(data)
      await syncToCloud('annotations', data)
    },
    remove: async (id: string) => {
      await localDB.annotations.remove(id)
      await syncToCloud('annotations', { id }, 'delete')
    },
  },
  translations: {
    set: async (data: Translation) => {
      await localDB.translations.set(data)
      await syncToCloud('translations', data)
    },
    remove: async (id: string) => {
      await localDB.translations.remove(id)
      await syncToCloud('translations', { id }, 'delete')
    },
  },
  wordbook: {
    set: async (data: WordbookEntry) => {
      await localDB.wordbook.set(data)
      await syncToCloud('wordbook', data)
    },
    remove: async (id: string) => {
      await localDB.wordbook.remove(id)
      await syncToCloud('wordbook', { id }, 'delete')
    },
  },
}
