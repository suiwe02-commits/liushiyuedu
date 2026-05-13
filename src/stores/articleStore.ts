import { create } from 'zustand'
import { Article, Folder } from '@/types'

interface ArticleState {
  articles: Article[]
  folders: Folder[]
  currentArticle: Article | null
  isLoading: boolean
  searchQuery: string
  
  setArticles: (articles: Article[]) => void
  addArticle: (article: Article) => void
  updateArticle: (id: string, updates: Partial<Article>) => void
  removeArticle: (id: string) => void
  setCurrentArticle: (article: Article | null) => void
  
  setFolders: (folders: Folder[]) => void
  addFolder: (folder: Folder) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  removeFolder: (id: string) => void
  
  setLoading: (loading: boolean) => void
  setSearchQuery: (query: string) => void
}

export const useArticleStore = create<ArticleState>((set) => ({
  articles: [],
  folders: [],
  currentArticle: null,
  isLoading: false,
  searchQuery: '',
  
  setArticles: (articles) => set({ articles }),
  addArticle: (article) => set((state) => ({ 
    articles: [article, ...state.articles] 
  })),
  updateArticle: (id, updates) => set((state) => ({
    articles: state.articles.map((a) => 
      a.id === id ? { ...a, ...updates } : a
    ),
    currentArticle: state.currentArticle?.id === id 
      ? { ...state.currentArticle, ...updates } 
      : state.currentArticle,
  })),
  removeArticle: (id) => set((state) => ({
    articles: state.articles.filter((a) => a.id !== id),
    currentArticle: state.currentArticle?.id === id ? null : state.currentArticle,
  })),
  setCurrentArticle: (article) => set({ currentArticle: article }),
  
  setFolders: (folders) => set({ folders }),
  addFolder: (folder) => set((state) => ({ 
    folders: [...state.folders, folder] 
  })),
  updateFolder: (id, updates) => set((state) => ({
    folders: state.folders.map((f) => 
      f.id === id ? { ...f, ...updates } : f
    ),
  })),
  removeFolder: (id) => set((state) => ({
    folders: state.folders.filter((f) => f.id !== id),
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
