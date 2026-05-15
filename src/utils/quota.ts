// 存储容量限制
export const QUOTA_LIMITS = {
  // 游客限制
  guest: {
    wordbookLimit: 50,
    cacheLimitMB: 5,
  },
  // 已登录用户限制
  user: {
    wordbookLimit: 300,
    cacheLimitMB: 10,
  },
}

// 获取存储用量
export async function getStorageUsage(): Promise<{
  wordbookCount: number
  cacheSize: number
  cacheSizeMB: number
}> {
  return new Promise((resolve) => {
    const result = {
      wordbookCount: 0,
      cacheSize: 0,
      cacheSizeMB: 0,
    }
    
    const request = indexedDB.open('liushiyuedu', 1)
    
    request.onerror = () => {
      resolve(result)
    }
    
    request.onsuccess = () => {
      const db = request.result
      
      // 获取单词本数量
      try {
        const wordbookTx = db.transaction(['wordbook'], 'readonly')
        const wordbookStore = wordbookTx.objectStore('wordbook')
        const wordbookRequest = wordbookStore.getAll()
        
        wordbookRequest.onsuccess = () => {
          result.wordbookCount = wordbookRequest.result?.length || 0
        }
      } catch (e) {
        // wordbook store might not exist
      }
      
      // 获取文章缓存大小
      try {
        const articlesTx = db.transaction(['articles'], 'readonly')
        const articlesStore = articlesTx.objectStore('articles')
        const articlesRequest = articlesStore.getAll()
        
        articlesRequest.onsuccess = () => {
          const articles = articlesRequest.result || []
          for (const article of articles) {
            result.cacheSize += (article.title?.length || 0) * 2
            result.cacheSize += (article.content?.length || 0) * 2
          }
          result.cacheSizeMB = result.cacheSize / (1024 * 1024)
          db.close()
          resolve(result)
        }
        
        articlesRequest.onerror = () => {
          db.close()
          resolve(result)
        }
      } catch (e) {
        db.close()
        resolve(result)
      }
    }
  })
}

// 检查单词本是否超限
export async function checkWordbookQuota(isAuth: boolean): Promise<{
  isOverLimit: boolean
  current: number
  limit: number
  message: string
}> {
  const usage = await getStorageUsage()
  const limit = isAuth ? QUOTA_LIMITS.user.wordbookLimit : QUOTA_LIMITS.guest.wordbookLimit
  
  return {
    isOverLimit: usage.wordbookCount >= limit,
    current: usage.wordbookCount,
    limit,
    message: isAuth 
      ? '单词本已达上限（300个），联系开发者享受更大容量' 
      : '单词本已达上限（50个），请先注册登录后享受更多功能',
  }
}

// 检查缓存是否超限
export async function checkCacheQuota(isAuth: boolean): Promise<{
  isOverLimit: boolean
  current: number
  limitMB: number
  message: string
}> {
  const usage = await getStorageUsage()
  const limitMB = isAuth ? QUOTA_LIMITS.user.cacheLimitMB : QUOTA_LIMITS.guest.cacheLimitMB
  const limitBytes = limitMB * 1024 * 1024
  
  return {
    isOverLimit: usage.cacheSize >= limitBytes,
    current: usage.cacheSize,
    limitMB,
    message: isAuth 
      ? `缓存已达上限（${limitMB}MB），联系开发者享受更大容量` 
      : `缓存已达上限（${limitMB}MB），请先注册登录后享受更多功能`,
  }
}

// 格式化文件大小
export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
