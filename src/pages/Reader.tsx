import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, BookMarked, ZoomIn, ZoomOut, RefreshCw, Edit3, Check, X, Moon, Sun } from 'lucide-react'
import { useArticleStore } from '@/stores/articleStore'
import { useAnnotationStore } from '@/stores/annotationStore'
import { useWordbookStore } from '@/stores/wordbookStore'
import { useThemeStore } from '@/stores/themeStore'
import { localDB } from '@/services/localDB'
import { lookupWord } from '@/api/dictionary'
import { translateText } from '@/api/translation'
import { Article, Annotation, Translation, WordbookEntry, DictionaryResult } from '@/types'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'

export default function Reader() {
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const { articleId } = useParams<{ articleId: string }>()
  const navigate = useNavigate()
  const contentRef = useRef<HTMLDivElement>(null)
  
  const { articles, updateArticle } = useArticleStore()
  const { annotations, translations, setAnnotations, setTranslations, addAnnotation, removeAnnotation, addTranslation } = useAnnotationStore()
  const { entries: wordbookEntries, addEntry: addWordbookEntry, removeEntry: removeWordbookEntry } = useWordbookStore()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.5)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [wordResult, setWordResult] = useState<DictionaryResult | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [showWordTooltip, setShowWordTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [existingAnnotation, setExistingAnnotation] = useState<Annotation | null>(null)
  
  const [translatingParagraphs, setTranslatingParagraphs] = useState<Set<number>>(new Set())
  const [collapsedTranslations, setCollapsedTranslations] = useState<Set<number>>(new Set())
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadArticle()
  }, [articleId])

  // 移动端选词支持：监听 selectionchange 事件
  useEffect(() => {
    let timeoutId: number | null = null
    
    const handleSelectionChange = () => {
      // 清除之前的定时器
      if (timeoutId) clearTimeout(timeoutId)
      
      // 延迟执行，等待选区稳定
      timeoutId = window.setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed) return
        
        const selectedText = selection.toString().trim()
        if (!selectedText || selectedText.length > 50 || selectedText.includes(' ')) return
        
        const word = selectedText.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
        if (!word || word.length < 2) return
        
        // 检查选区是否在文章内容区域内
        const range = selection.getRangeAt(0)
        if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
          handleTextSelect()
        }
      }, 300)
    }
    
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [articleId, annotations])

  const loadArticle = async () => {
    if (!articleId) return
    setIsLoading(true)
    try {
      let articleData = articles.find(a => a.id === articleId)
      if (!articleData) {
        articleData = await localDB.articles.get(articleId) || undefined
      }
      if (articleData) {
        setArticle(articleData)
        setEditContent(articleData.content)
        const articleAnnotations = await localDB.annotations.getByArticle(articleId)
        setAnnotations(articleAnnotations)
        const articleTranslations = await localDB.translations.getByArticle(articleId)
        setTranslations(articleTranslations)
        autoAnnotateFromWordbook(articleData.content, articleAnnotations)
      }
    } catch (error) {
      console.error('Failed to load article:', error)
    }
    setIsLoading(false)
  }

  const autoAnnotateFromWordbook = (content: string, existingAnnotations: Annotation[]) => {
    const words = content.toLowerCase().match(/\b[a-z]+\b/g) || []
    const uniqueWords = [...new Set(words)]
    for (const word of uniqueWords) {
      if (existingAnnotations.some(a => a.word.toLowerCase() === word)) continue
      const wordbookEntry = wordbookEntries.find(w => w.word.toLowerCase() === word)
      if (wordbookEntry) {
        const positions = findWordPositions(content, word)
        const newAnnotation: Annotation = {
          id: crypto.randomUUID(),
          article_id: articleId!,
          word,
          translation: wordbookEntry.translation,
          phonetic: wordbookEntry.phonetic,
          positions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        addAnnotation(newAnnotation)
        localDB.annotations.set(newAnnotation)
      }
    }
  }

  const findWordPositions = (text: string, word: string): number[] => {
    const positions: number[] = []
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      positions.push(match.index)
    }
    return positions
  }

  const handleTextSelect = async () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const selectedText = selection.toString().trim()
    if (!selectedText || selectedText.length > 50) return
    if (selectedText.includes(' ')) return
    const word = selectedText.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
    if (!word || word.length < 2) return
    
    const annotation = annotations.find(a => a.word.toLowerCase() === word)
    setSelectedWord(word)
    setExistingAnnotation(annotation || null)
    
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 8,
    })
    
    if (annotation) {
      setWordResult(null)
      setIsLookingUp(false)
    } else {
      setIsLookingUp(true)
      try {
        const result = await lookupWord(word)
        setWordResult(result)
      } catch (error) {
        console.error('Lookup error:', error)
        setWordResult(null)
      }
      setIsLookingUp(false)
    }
    setShowWordTooltip(true)
    selection.removeAllRanges()
  }

  const handleSelectTranslation = async (translation: string, phonetic: string) => {
    if (!article || !selectedWord) return
    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      article_id: article.id,
      word: selectedWord,
      translation,
      phonetic,
      positions: findWordPositions(article.content, selectedWord),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    addAnnotation(newAnnotation)
    await localDB.annotations.set(newAnnotation)
    
    const wordbookEntry: WordbookEntry = {
      id: crypto.randomUUID(),
      word: selectedWord,
      phonetic,
      translation,
      familiarity: 1,
      sort_order: wordbookEntries.length,
      last_reviewed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    addWordbookEntry(wordbookEntry)
    await localDB.wordbook.set(wordbookEntry)
    
    setShowWordTooltip(false)
    setSelectedWord(null)
    setWordResult(null)
  }

  const handleMastered = async () => {
    if (!existingAnnotation || !selectedWord) return
    const wordbookEntry = wordbookEntries.find(w => w.word.toLowerCase() === selectedWord.toLowerCase())
    if (wordbookEntry) {
      await localDB.wordbook.remove(wordbookEntry.id)
      removeWordbookEntry(wordbookEntry.id)
    }
    await localDB.annotations.remove(existingAnnotation.id)
    removeAnnotation(existingAnnotation.id)
    setShowWordTooltip(false)
    setSelectedWord(null)
    setExistingAnnotation(null)
  }

  // 点击已标注单词 - 显示学会了选项
  const handleWordClick = (word: string, annotation: Annotation) => {
    setSelectedWord(word)
    setExistingAnnotation(annotation)
    setWordResult(null)
    setIsLookingUp(false)
    setTooltipPosition({ x: 0, y: 0 })
    setShowWordTooltip(true)
  }

  const handleSaveEdit = async () => {
    if (!article || !editContent.trim()) return
    const lines = editContent.trim().split('\n')
    const title = lines[0].substring(0, 50) || '无标题'
    const updated: Article = {
      ...article,
      title,
      content: editContent.trim(),
      word_count: editContent.split(/\s+/).filter(w => w).length,
      updated_at: new Date().toISOString(),
    }
    await localDB.articles.set(updated)
    updateArticle(article.id, updated)
    setArticle(updated)
    setIsEditMode(false)
  }

  const handleTranslate = async (paragraphIndex: number, text: string) => {
    if (!articleId) return
    const existingTranslation = translations.find(
      t => t.article_id === articleId && t.paragraph_index === paragraphIndex
    )
    if (existingTranslation) {
      // 切换折叠状态
      const newCollapsed = new Set(collapsedTranslations)
      if (newCollapsed.has(paragraphIndex)) {
        newCollapsed.delete(paragraphIndex)
      } else {
        newCollapsed.add(paragraphIndex)
      }
      setCollapsedTranslations(newCollapsed)
      return
    }
    setTranslatingParagraphs(prev => new Set(prev).add(paragraphIndex))
    try {
      const result = await translateText(text)
      if (result) {
        const newTranslation: Translation = {
          id: crypto.randomUUID(),
          article_id: articleId,
          paragraph_index: paragraphIndex,
          original_text: text,
          translated_text: result.translatedText,
          created_at: new Date().toISOString(),
        }
        addTranslation(newTranslation)
        await localDB.translations.set(newTranslation)
      }
    } catch (error) {
      console.error('Translation error:', error)
    }
    setTranslatingParagraphs(prev => {
      const next = new Set(prev)
      next.delete(paragraphIndex)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-4">文章不存在</p>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    )
  }

  const paragraphs = article.content.split(/\n/)

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700'}`}>
      <header className={`sticky top-0 z-30 backdrop-blur border-b transition-colors ${isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={() => navigate('/')}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className={`text-base font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {article.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
              {/* 桌面端字号控制 */}
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className={`p-2 rounded-lg hidden sm:block ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                title="减小字号"
              >
                <ZoomOut size={18} />
              </button>
              <span className={`text-sm w-12 text-center hidden sm:inline ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                className={`p-2 rounded-lg hidden sm:block ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                title="增大字号"
              >
                <ZoomIn size={18} />
              </button>
              
              <div className={`w-px h-6 mx-1 hidden sm:block ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              
              {isEditMode && (
                <button
                  onClick={() => setIsEditMode(false)}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="取消编辑"
                >
                  <X size={18} />
                </button>
              )}
              
              <button
                onClick={() => isEditMode ? handleSaveEdit() : setIsEditMode(true)}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  isEditMode 
                    ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-600' 
                    : isDarkMode 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={isEditMode ? '保存编辑' : '编辑文章'}
              >
                {isEditMode ? <Check size={18} /> : <Edit3 size={18} />}
              </button>
              
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isDarkMode ? 'text-yellow-400 hover:bg-gray-800' : 'hover:bg-gray-100 text-gray-600'}`}
                title={isDarkMode ? '日间模式' : '夜间模式'}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg hidden sm:block ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <Settings size={18} />
              </button>
              
              <a
                href="/wordbook"
                className={`p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                title="单词本"
              >
                <BookMarked size={18} />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isEditMode ? (
          <div className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={`w-full h-[calc(100vh-200px)] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none font-mono text-sm transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
              }`}
              placeholder="编辑文章内容..."
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                <X size={16} className="mr-2" />
                取消
              </Button>
              <Button onClick={handleSaveEdit}>
                <Check size={16} className="mr-2" />
                保存
              </Button>
            </div>
          </div>
        ) : (
          <article
            ref={contentRef}
            className="prose prose-lg max-w-none"
            style={{ fontSize: `${fontSize}px`, lineHeight, color: isDarkMode ? '#9ca3af' : '#4b5563' }}
            onMouseUp={handleTextSelect}
            onTouchEnd={() => {
              // 移动端选词：等待选区完成
              setTimeout(handleTextSelect, 300)
            }}
          >
            {paragraphs.map((paragraph, index) => {
              const translation = translations.find(
                t => t.article_id === articleId && t.paragraph_index === index
              )
              const isTranslating = translatingParagraphs.has(index)
              const hasTranslation = !!translation
              const isCollapsed = collapsedTranslations.has(index)
              const showTranslation = hasTranslation && !isCollapsed
              
              return (
                <div key={index} className="mb-1 relative group">
                  {/* 原文 */}
                  <div className="whitespace-pre-wrap">
                    {articleId && renderParagraphWithHighlights(paragraph, annotations, articleId, handleWordClick, isDarkMode)}
                  </div>
                  
                  {/* 翻译按钮 - 段落下方独立一行，空行不显示 */}
                  {paragraph.trim() && (
                    <div className="mt-1">
                      {!hasTranslation ? (
                        <button
                          onClick={() => handleTranslate(index, paragraph)}
                          disabled={isTranslating}
                          className={`text-xs px-2 py-0.5 rounded transition-colors ${
                            isDarkMode 
                              ? 'text-gray-500 hover:text-cyan-600 hover:bg-gray-800' 
                              : 'text-gray-400 hover:text-cyan-600 hover:bg-gray-100'
                          }`}
                          title="翻译整段"
                        >
                          {isTranslating ? <RefreshCw size={10} className="animate-spin inline" /> : <span>译</span>}
                        </button>
                      ) : isCollapsed ? (
                        <button
                          onClick={() => handleTranslate(index, paragraph)}
                          className={`text-xs px-2 py-0.5 rounded transition-colors ${
                            isDarkMode 
                              ? 'text-cyan-600 hover:bg-gray-800' 
                              : 'text-cyan-600 hover:bg-gray-100'
                          }`}
                          title="查看翻译"
                        >
                          <span>译</span>
                        </button>
                      ) : null}
                    </div>
                  )}

                  {/* 翻译内容 */}
                  {showTranslation && translation && (
                    <div className={`mt-2 p-4 rounded-lg border-l-4 transition-colors ${isDarkMode ? 'bg-gray-800 border-cyan-700' : 'bg-gray-50 border-cyan-400'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-cyan-600' : 'text-cyan-600'}`}>中文翻译</span>
                        <button
                          onClick={() => handleTranslate(index, paragraph)}
                          className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          <span>收起</span>
                        </button>
                      </div>
                      <p className={`leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{translation.translated_text}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </article>
        )}
      </main>

      {showWordTooltip && selectedWord && (
        <WordTooltip
          word={selectedWord}
          result={wordResult}
          existingAnnotation={existingAnnotation}
          isLoading={isLookingUp}
          position={tooltipPosition}
          onSelect={handleSelectTranslation}
          onMastered={handleMastered}
          onClose={() => setShowWordTooltip(false)}
        />
      )}

      <Modal isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="阅读设置"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">字号: {fontSize}px</label>
            <input type="range" min="12" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>12px</span><span>24px</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">行高: {lineHeight}</label>
            <input type="range" min="1.2" max="2.0" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>紧凑</span><span>宽松</span></div>
          </div>
          <Button className="w-full" onClick={() => setShowSettings(false)}>完成</Button>
        </div>
      </Modal>
    </div>
  )
}

// 单词查询浮层组件
function WordTooltip({
  word, result, existingAnnotation, isLoading, position, onSelect, onMastered, onClose
}: {
  word: string
  result: DictionaryResult | null
  existingAnnotation: Annotation | null
  isLoading: boolean
  position: { x: number; y: number }
  onSelect: (translation: string, phonetic: string) => void
  onMastered: () => void
  onClose: () => void
}) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [onClose])
  
  const style = position.x === 0 ? {
    position: 'fixed' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  } : {
    position: 'fixed' as const,
    left: Math.min(Math.max(position.x, 16), window.innerWidth - 300),
    top: Math.min(position.y, window.innerHeight - 250),
  }
  
  return (
    <div ref={tooltipRef} className="annotation-tooltip w-80 max-w-[calc(100vw-2rem)] bg-white shadow-xl border border-gray-200 rounded-lg p-4 z-50" style={style}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{word}</h4>
          {result?.phonetic && <p className="text-sm text-gray-500">{result.phonetic}</p>}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">×</button>
      </div>
      
      {isLoading ? (
        <div className="py-4 text-center">
          <div className="loading-spinner mx-auto" />
          <p className="text-sm text-gray-500 mt-2">查询中...</p>
        </div>
      ) : existingAnnotation ? (
        // 已标注单词 - 显示"学会了"选项
        <div className="space-y-3">
          <div className="p-3 bg-cyan-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">当前释义</p>
            <p className="text-cyan-600 font-medium">{existingAnnotation.translation}</p>
          </div>
          <button
            onClick={onMastered}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check size={18} />
            学会了，移出单词本
          </button>
        </div>
      ) : result ? (
        // 新单词 - 显示释义列表
        <div className="space-y-3">
          {result.meanings.map((meaning, i) => (
            <div key={i}>
              <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-cyan-700 rounded mb-1">{meaning.partOfSpeech}</span>
              <ul className="space-y-1">
                {meaning.definitions.slice(0, 3).map((def, j) => (
                  <li key={j} onClick={() => onSelect(def.definition, result.phonetic || '')}
                    className="text-sm text-gray-700 cursor-pointer hover:bg-cyan-50 px-2 py-1 rounded">
                    {def.definition}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">未找到释义，请尝试其他单词</p>
      )}
    </div>
  )
}

// 渲染带标注的段落
function renderParagraphWithHighlights(
  paragraph: string, annotations: Annotation[], articleId: string, onWordClick: (word: string, annotation: Annotation) => void, isDarkMode?: boolean
) {
  const words = paragraph.toLowerCase().match(/\b[a-z]+\b/g) || []
  const uniqueWords = [...new Set(words)]
  
  const highlights: { start: number; end: number; word: string; translation: string; annotation: Annotation }[] = []
  
  for (const word of uniqueWords) {
    const annotation = annotations.find(a => a.article_id === articleId && a.word.toLowerCase() === word)
    if (annotation) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      let match
      while ((match = regex.exec(paragraph)) !== null) {
        highlights.push({
          start: match.index, end: match.index + word.length, word: match[0], translation: annotation.translation, annotation,
        })
      }
    }
  }
  
  highlights.sort((a, b) => a.start - b.start)
  
  const merged: typeof highlights = []
  for (const h of highlights) {
    const last = merged[merged.length - 1]
    if (last && h.start < last.end) {
      last.end = Math.max(last.end, h.end)
    } else {
      merged.push({ ...h })
    }
  }
  
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  
  merged.forEach((h, i) => {
    if (h.start > lastIndex) parts.push(paragraph.slice(lastIndex, h.start))
    
    parts.push(
      <span key={`${h.word}-${i}`} className="annotated-word cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onWordClick(h.word, h.annotation) }}>
        {paragraph.slice(h.start, h.end)}
        <span className={`text-sm ${isDarkMode ? 'text-cyan-600' : 'text-cyan-400'}`}>({h.translation})</span>
      </span>
    )
    lastIndex = h.end
  })
  
  if (lastIndex < paragraph.length) parts.push(paragraph.slice(lastIndex))
  return parts.length > 0 ? parts : paragraph
}