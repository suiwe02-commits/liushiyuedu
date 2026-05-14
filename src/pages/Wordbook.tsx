import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Shuffle, List, ArrowLeft, Volume2, BookMarked } from 'lucide-react'
import { useWordbookStore } from '@/stores/wordbookStore'
import { useThemeStore } from '@/stores/themeStore'
import { localDB } from '@/services/localDB'
import { getWordAudio } from '@/api/dictionary'
import Button from '@/components/common/Button'

export default function Wordbook() {
  const navigate = useNavigate()
  const { entries, setEntries, removeEntry, mode, setMode } = useWordbookStore()
  const { isDarkMode } = useThemeStore()
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 加载单词本
  useEffect(() => {
    loadWordbook()
  }, [])

  const loadWordbook = async () => {
    setIsLoading(true)
    try {
      const data = await localDB.wordbook.getAll()
      setEntries(data)
    } catch (error) {
      console.error('Failed to load wordbook:', error)
    }
    setIsLoading(false)
  }

  // 删除单词
  const handleDelete = async (id: string) => {
    if (!confirm('确定要从单词本中删除这个单词？')) return
    await localDB.wordbook.remove(id)
    removeEntry(id)
  }

  // 播放发音
  const handlePlayAudio = async (word: string) => {
    const audioUrl = await getWordAudio(word)
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch(console.error)
    }
  }

  // 背单词模式操作
  const handleFamiliar = () => {
    // 熟悉：将当前单词移到末尾
    const currentEntry = entries[currentCardIndex]
    if (!currentEntry) return
    
    const newOrder = [...entries]
    newOrder.splice(currentCardIndex, 1)
    newOrder.push(currentEntry)
    
    // 更新sort_order
    newOrder.forEach((e, i) => {
      e.sort_order = i
      localDB.wordbook.set(e)
    })
    
    setEntries(newOrder)
    setShowTranslation(false)
    
    if (currentCardIndex >= newOrder.length - 1) {
      setCurrentCardIndex(0)
    }
  }

  const handleUnfamiliar = () => {
    // 陌生：将当前单词插入到1/3位置
    const currentEntry = entries[currentCardIndex]
    if (!currentEntry) return
    
    const newOrder = [...entries]
    newOrder.splice(currentCardIndex, 1)
    
    const oneThird = Math.floor(newOrder.length / 3)
    const insertIndex = Math.min(oneThird, newOrder.length)
    newOrder.splice(insertIndex, 0, currentEntry)
    
    // 更新sort_order
    newOrder.forEach((e, i) => {
      e.sort_order = i
      localDB.wordbook.set(e)
    })
    
    setEntries(newOrder)
    setShowTranslation(false)
    
    if (currentCardIndex >= newOrder.length) {
      setCurrentCardIndex(0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{entries.length} 个单词</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 模式切换 */}
          <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setMode('flashcard')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === 'flashcard' 
                  ? isDarkMode 
                    ? 'bg-gray-700 shadow text-cyan-400' 
                    : 'bg-white shadow text-cyan-600' 
                  : isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-600'
              }`}
            >
              <Shuffle size={16} />
              背诵
            </button>
            <button
              onClick={() => setMode('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                mode === 'list' 
                  ? isDarkMode 
                    ? 'bg-gray-700 shadow text-cyan-400' 
                    : 'bg-white shadow text-cyan-600' 
                  : isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-600'
              }`}
            >
              <List size={16} />
              列表
            </button>
          </div>
        </div>
      </div>

      {/* 内容 */}
      {entries.length === 0 ? (
        <div className={`rounded-lg shadow-sm border py-12 text-center transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <BookMarked size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>单词本为空</p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            在阅读时选中单词并选择释义，单词会自动添加到单词本
          </p>
        </div>
      ) : mode === 'flashcard' ? (
        /* 背诵模式 */
        <div className={`rounded-lg shadow-sm border p-6 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* 进度指示 */}
          <div className="flex items-center justify-between mb-6">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              第 {currentCardIndex + 1} / {entries.length}
            </span>
            <div className={`flex-1 mx-4 rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="bg-cyan-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentCardIndex + 1) / entries.length) * 100}%` }}
              />
            </div>
            <button
              onClick={() => setCurrentCardIndex(Math.floor(Math.random() * entries.length))}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="随机跳转"
            >
              <Shuffle size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </button>
          </div>

          {/* 单词卡片 */}
          <div
            className="min-h-[200px] flex flex-col items-center justify-center p-8 cursor-pointer"
            onClick={() => setShowTranslation(!showTranslation)}
          >
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {entries[currentCardIndex].word}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayAudio(entries[currentCardIndex].word)
                }}
                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <Volume2 size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
            {entries[currentCardIndex].phonetic && (
              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {entries[currentCardIndex].phonetic}
              </p>
            )}
            
            {/* 翻译 */}
            <div className="text-center">
              {showTranslation ? (
                <p className={`text-xl ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  {entries[currentCardIndex].translation}
                </p>
              ) : (
                <p className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>点击显示翻译</p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 max-w-[200px]"
              onClick={(e) => {
                e.stopPropagation()
                handleUnfamiliar()
              }}
            >
              陌生
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1 max-w-[200px]"
              onClick={(e) => {
                e.stopPropagation()
                handleFamiliar()
              }}
            >
              熟悉
            </Button>
          </div>
          
          <p className={`text-center text-sm mt-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            点击卡片也可以翻转
          </p>
        </div>
      ) : (
        /* 列表模式 */
        <div className={`rounded-lg shadow-sm border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 px-4 py-3 group ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{entry.word}</span>
                    {entry.phonetic && (
                      <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{entry.phonetic}</span>
                    )}
                    <button
                      onClick={() => handlePlayAudio(entry.word)}
                      className={`p-1 rounded transition-opacity opacity-0 group-hover:opacity-100 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                    >
                      <Volume2 size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                    </button>
                  </div>
                  <p className={`text-sm truncate ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{entry.translation}</p>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
