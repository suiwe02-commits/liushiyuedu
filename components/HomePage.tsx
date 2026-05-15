"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { FolderPlus, FilePlus, RefreshCw, LogOut, Plus } from "lucide-react"

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
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showNewArticle, setShowNewArticle] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newArticleTitle, setNewArticleTitle] = useState("")
  const [newArticleContent, setNewArticleContent] = useState("")

  const loadData = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    })
    if (res.ok) {
      setNewFolderName("")
      setShowNewFolder(false)
      loadData()
    }
  }

  const handleCreateArticle = async () => {
    if (!newArticleTitle.trim() || !newArticleContent.trim()) return
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newArticleTitle.trim(),
        content: newArticleContent.trim(),
      }),
    })
    if (res.ok) {
      setNewArticleTitle("")
      setNewArticleContent("")
      setShowNewArticle(false)
      loadData()
    }
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
                onClick={loadData}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                刷新
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                退出
              </button>
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
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FolderPlus size={16} />
                  新增文件夹
                </button>
                <button
                  onClick={() => setShowNewArticle(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FilePlus size={16} />
                  新增文章
                </button>
              </div>

              {/* 新增文件夹弹窗 */}
              {showNewFolder && (
                <div className="mb-4 p-3 border border-blue-200 rounded-lg bg-blue-50">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="文件夹名称"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateFolder}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      创建
                    </button>
                    <button
                      onClick={() => { setShowNewFolder(false); setNewFolderName("") }}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

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
            {/* 新增文章弹窗 */}
            {showNewArticle && (
              <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-medium text-gray-900 mb-3">新增文章</h3>
                <input
                  type="text"
                  value={newArticleTitle}
                  onChange={(e) => setNewArticleTitle(e.target.value)}
                  placeholder="文章标题"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={newArticleContent}
                  onChange={(e) => setNewArticleContent(e.target.value)}
                  placeholder="文章内容..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateArticle}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    创建
                  </button>
                  <button
                    onClick={() => { setShowNewArticle(false); setNewArticleTitle(""); setNewArticleContent("") }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

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
