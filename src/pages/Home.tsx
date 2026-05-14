import { useState, useEffect } from 'react'
import { FolderPlus, FilePlus, Upload, Search, ChevronRight, ChevronDown, MoreVertical, Trash2, Folder, Edit3, Move } from 'lucide-react'
import { useArticleStore } from '@/stores/articleStore'
import { localDB } from '@/services/localDB'
import { Folder as FolderType, Article } from '@/types'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'

export default function Home() {
  const { articles, folders, setArticles, setFolders, addArticle, removeArticle, addFolder, removeFolder, updateArticle } = useArticleStore()
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [showNewArticleModal, setShowNewArticleModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [movingArticle, setMovingArticle] = useState<Article | null>(null)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newArticleContent, setNewArticleContent] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [articlesData, foldersData] = await Promise.all([
        localDB.articles.getAll(),
        localDB.folders.getAll(),
      ])
      setArticles(articlesData)
      setFolders(foldersData)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setIsLoading(false)
  }

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    const newFolder: FolderType = {
      id: crypto.randomUUID(),
      parent_id: selectedFolder,
      name: newFolderName.trim(),
      sort_order: folders.filter(f => f.parent_id === selectedFolder).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await localDB.folders.set(newFolder)
    addFolder(newFolder)
    setNewFolderName('')
    setShowNewFolderModal(false)
  }

  // 创建文章
  const handleCreateArticle = async () => {
    if (!newArticleContent.trim()) return

    const lines = newArticleContent.trim().split('\n')
    const title = lines[0].substring(0, 50) || '无标题'
    const content = newArticleContent.trim()

    const newArticle: Article = {
      id: crypto.randomUUID(),
      folder_id: selectedFolder,
      title,
      content,
      word_count: content.split(/\s+/).filter(w => w).length,
      read_progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await localDB.articles.set(newArticle)
    addArticle(newArticle)
    setNewArticleContent('')
    setShowNewArticleModal(false)
  }

  // 编辑文章
  const handleEditArticle = (article: Article) => {
    setEditingArticle(article)
    setEditContent(article.content)
    setShowEditModal(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingArticle || !editContent.trim()) return

    const lines = editContent.trim().split('\n')
    const title = lines[0].substring(0, 50) || '无标题'
    
    const updated: Article = {
      ...editingArticle,
      title,
      content: editContent.trim(),
      word_count: editContent.split(/\s+/).filter(w => w).length,
      updated_at: new Date().toISOString(),
    }

    await localDB.articles.set(updated)
    updateArticle(editingArticle.id, updated)
    setShowEditModal(false)
    setEditingArticle(null)
    setEditContent('')
  }

  // 移动文章
  const handleMoveArticle = (article: Article) => {
    setMovingArticle(article)
    setShowMoveModal(true)
  }

  // 确认移动文章到目标文件夹
  const confirmMoveArticle = async (targetFolderId: string | null) => {
    if (!movingArticle) return
    
    const updated: Article = {
      ...movingArticle,
      folder_id: targetFolderId,
      updated_at: new Date().toISOString(),
    }
    
    await localDB.articles.set(updated)
    removeArticle(movingArticle.id)
    addArticle(updated)
    
    setShowMoveModal(false)
    setMovingArticle(null)
  }

  // 导入文件
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const content = await file.text()
    const title = file.name.replace(/\.txt$/, '')

    const newArticle: Article = {
      id: crypto.randomUUID(),
      folder_id: selectedFolder,
      title,
      content,
      word_count: content.split(/\s+/).filter(w => w).length,
      read_progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await localDB.articles.set(newArticle)
    addArticle(newArticle)
    setShowImportModal(false)
    e.target.value = ''
  }

  // 删除文章
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return
    await localDB.articles.remove(id)
    removeArticle(id)
  }

  // 删除文件夹
  const handleDeleteFolder = async (id: string) => {
    if (!confirm('确定要删除这个文件夹吗？文件夹内的文章将移到根目录。')) return
    
    // 将文件夹内的文章移到根目录
    const articlesInFolder = articles.filter(a => a.folder_id === id)
    for (const article of articlesInFolder) {
      const updated = { ...article, folder_id: null }
      await localDB.articles.set(updated)
      removeArticle(article.id)
      addArticle(updated)
    }
    
    // 删除子文件夹
    const subFolders = folders.filter(f => f.parent_id === id)
    for (const subFolder of subFolders) {
      await handleDeleteFolder(subFolder.id)
    }
    
    await localDB.folders.remove(id)
    removeFolder(id)
  }

  // 切换文件夹展开
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  // 获取文件夹树
  const getFolderTree = (parentId: string | null): FolderType[] => {
    return folders
      .filter(f => f.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  // 获取当前显示的文章
  const getDisplayedArticles = () => {
    let filtered = selectedFolder
      ? articles.filter(a => a.folder_id === selectedFolder)
      : articles.filter(a => !a.folder_id)

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-6">
      {/* 侧边栏 - 文件夹树 */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">文件夹</h2>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="p-1 hover:bg-gray-100 rounded"
              title="新建文件夹"
            >
              <FolderPlus size={18} className="text-gray-500" />
            </button>
          </div>

          {/* 根目录 */}
          <div
            className={`
              flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer mb-1
              ${selectedFolder === null ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}
            `}
            onClick={() => setSelectedFolder(null)}
          >
            <Folder size={16} />
            <span className="text-sm">全部文章</span>
            <span className="ml-auto text-xs text-gray-400">{articles.length}</span>
          </div>

          {/* 文件夹列表 */}
          <div className="space-y-1">
            {getFolderTree(null).map(folder => (
              <FolderItem
                key={folder.id}
                folder={folder}
                level={0}
                selectedFolder={selectedFolder}
                onSelect={setSelectedFolder}
                expandedFolders={expandedFolders}
                onToggle={toggleFolder}
                onDelete={handleDeleteFolder}
                getFolderTree={getFolderTree}
                articles={articles}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 min-w-0">
        {/* 手机端文件夹选择 */}
        <div className="md:hidden mb-3">
          <select
            value={selectedFolder || ''}
            onChange={(e) => setSelectedFolder(e.target.value ? e.target.value : null)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部文章 ({articles.length})</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          {/* 手机端新建文件夹按钮 */}
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="md:hidden p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            title="新建文件夹"
          >
            <FolderPlus size={18} className="text-gray-600" />
          </button>
          
          <Button
            variant="outline"
            leftIcon={<Upload size={16} />}
            onClick={() => setShowImportModal(true)}
            className="hidden sm:flex"
          >
            导入
          </Button>
          <Button
            leftIcon={<FilePlus size={16} className="hidden sm:block" />}
            onClick={() => setShowNewArticleModal(true)}
          >
            <span className="hidden sm:inline">新建文章</span>
            <FilePlus size={18} className="sm:hidden" />
          </Button>
        </div>

        {/* 文章列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {getDisplayedArticles().length === 0 ? (
            <div className="py-12 text-center">
              <FilePlus size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">
                {searchQuery ? '没有找到匹配的文章' : '还没有文章'}
              </p>
              <p className="text-sm text-gray-400">
                {searchQuery ? '尝试其他关键词' : '点击上方按钮创建或导入文章'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {getDisplayedArticles().map(article => (
                <ArticleItem
                  key={article.id}
                  article={article}
                  onDelete={handleDeleteArticle}
                  onEdit={handleEditArticle}
                  onMove={handleMoveArticle}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 新建文件夹弹窗 */}
      <Modal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        title="新建文件夹"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowNewFolderModal(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleCreateFolder}>
              创建
            </Button>
          </div>
        </div>
      </Modal>

      {/* 新建文章弹窗 */}
      <Modal
        isOpen={showNewArticleModal}
        onClose={() => setShowNewArticleModal(false)}
        title="创建新文章"
        size="lg"
      >
        <div className="space-y-4">
          <textarea
            placeholder="粘贴文章内容...&#10;&#10;第一行将自动作为文章标题"
            value={newArticleContent}
            onChange={(e) => setNewArticleContent(e.target.value)}
            className="w-full h-64 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowNewArticleModal(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleCreateArticle}>
              创建
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑文章弹窗 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑文章"
        size="lg"
      >
        <div className="space-y-4">
          <textarea
            placeholder="编辑文章内容..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-64 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowEditModal(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleSaveEdit}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* 导入文件弹窗 */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="导入文章"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
            <Upload size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-1">点击选择文件或拖拽到此处</p>
            <p className="text-xs text-gray-400">支持 .txt 文件</p>
            <input
              type="file"
              accept=".txt"
              onChange={handleImportFile}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowImportModal(false)}
          >
            取消
          </Button>
        </div>
      </Modal>

      {/* 移动文章弹窗 */}
      <Modal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        title={`移动文章：${movingArticle?.title}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">选择目标文件夹：</p>
          
          {/* 根目录选项 */}
          <button
            onClick={() => confirmMoveArticle(null)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              movingArticle?.folder_id === null 
                ? 'bg-blue-50 text-blue-600' 
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder size={16} />
              <span>根目录（无文件夹）</span>
            </div>
          </button>
          
          {/* 文件夹列表 */}
          <div className="max-h-60 overflow-y-auto space-y-1">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => confirmMoveArticle(folder.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  movingArticle?.folder_id === folder.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder size={16} />
                  <span className="truncate">{folder.name}</span>
                </div>
              </button>
            ))}
          </div>
          
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowMoveModal(false)}
          >
            取消
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// 文件夹项组件
function FolderItem({
  folder,
  level,
  selectedFolder,
  onSelect,
  expandedFolders,
  onToggle,
  onDelete,
  getFolderTree,
  articles,
}: {
  folder: FolderType
  level: number
  selectedFolder: string | null
  onSelect: (id: string) => void
  expandedFolders: Set<string>
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  getFolderTree: (parentId: string | null) => FolderType[]
  articles: Article[]
}) {
  const children = getFolderTree(folder.id)
  const hasChildren = children.length > 0
  const articleCount = articles.filter(a => a.folder_id === folder.id).length
  const isExpanded = expandedFolders.has(folder.id)

  return (
    <div>
      <div
        className={`
          flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer group
          ${selectedFolder === folder.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(folder.id)
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Folder size={16} />
        <span className="text-sm flex-1 truncate">{folder.name}</span>
        <span className="text-xs text-gray-400">{articleCount}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(folder.id)
          }}
          className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="删除文件夹"
        >
          <Trash2 size={12} className="text-red-500" />
        </button>
      </div>
      {isExpanded && children.map(child => (
        <FolderItem
          key={child.id}
          folder={child}
          level={level + 1}
          selectedFolder={selectedFolder}
          onSelect={onSelect}
          expandedFolders={expandedFolders}
          onToggle={onToggle}
          onDelete={onDelete}
          getFolderTree={getFolderTree}
          articles={articles}
        />
      ))}
    </div>
  )
}

// 文章项组件
function ArticleItem({
  article,
  onDelete,
  onEdit,
  onMove,
}: {
  article: Article
  onDelete: (id: string) => void
  onEdit: (article: Article) => void
  onMove: (article: Article) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 group transition-colors"
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{article.title}</h3>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          <span>{article.word_count} 字</span>
          <span>{new Date(article.updated_at).toLocaleDateString()}</span>
          {article.read_progress > 0 && (
            <span className="text-blue-600">{article.read_progress}% 已读</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <a
          href={`/reader/${article.id}`}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          阅读
        </a>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-200 rounded"
          >
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
              <button
                onClick={() => {
                  onEdit(article)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit3 size={14} />
                编辑
              </button>
              <button
                onClick={() => {
                  onMove(article)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Move size={14} />
                移动
              </button>
              <button
                onClick={() => {
                  onDelete(article.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                删除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
