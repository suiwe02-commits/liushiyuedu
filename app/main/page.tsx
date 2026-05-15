"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { FolderPlus, FilePlus, RefreshCw, LogOut } from "lucide-react"

interface Article {
  id: string
  title: string
  content: string
  wordCount: number
  createdAt: string
}

interface Folder {
  id: string
  name: string
  isSystem: boolean
}

export default function HomePage() {
  const { data: session } = useSession()
  const [articles, setArticles] = useState<Article[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [articlesRes, foldersRes] = await Promise.all([
        fetch("/api/articles"),
        fetch("/api/folders"),
      ])

      if (articlesRes.ok) {
        setArticles(await articlesRes.json())
      }
      if (foldersRes.ok) {
        setFolders(await foldersRes.json())
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    // 在 Next.js 中，数据已经实时同步到数据库
    // 这里可以添加额外的同步逻辑
    alert("数据已同步到云端")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">流式阅读</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session?.user?.email}</span>
              <button
                onClick={handleSync}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                同步
              </button>
              <Link
                href="/api/auth/signout"
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                退出
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 侧边栏 */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {/* 操作按钮 */}
              <div className="space-y-2 mb-6">
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <FolderPlus size={16} />
                  新增文件夹
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <FilePlus size={16} />
                  新增文章
                </button>
              </div>

              {/* 文件夹列表 */}
              <div className="space-y-1">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                      folder.isSystem
                        ? "text-gray-400 cursor-default"
                        : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                    }`}
                  >
                    <span>{folder.name}</span>
                    {folder.isSystem && (
                      <span className="text-xs text-gray-400">(系统)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* 主内容区 */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  文章列表 ({articles.length})
                </h2>
              </div>

              {articles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  暂无文章，点击"新增文章"创建
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/reader/${article.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-base font-medium text-gray-900 mb-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {article.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{article.wordCount} 词</span>
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
