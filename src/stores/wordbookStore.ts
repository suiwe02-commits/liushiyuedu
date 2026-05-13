import { create } from 'zustand'
import { WordbookEntry } from '@/types'

interface WordbookState {
  entries: WordbookEntry[]
  isLoading: boolean
  mode: 'flashcard' | 'list'  // 背单词模式还是列表模式
  
  setEntries: (entries: WordbookEntry[]) => void
  addEntry: (entry: WordbookEntry) => void
  updateEntry: (id: string, updates: Partial<WordbookEntry>) => void
  removeEntry: (id: string) => void
  reorderEntries: (familiar: string[], unfamiliar: string[]) => void
  
  setLoading: (loading: boolean) => void
  setMode: (mode: 'flashcard' | 'list') => void
}

export const useWordbookStore = create<WordbookState>((set) => ({
  entries: [],
  isLoading: false,
  mode: 'flashcard',
  
  setEntries: (entries) => set({ entries }),
  addEntry: (entry) => set((state) => ({ 
    entries: [...state.entries, entry] 
  })),
  updateEntry: (id, updates) => set((state) => ({
    entries: state.entries.map((e) => 
      e.id === id ? { ...e, ...updates } : e
    ),
  })),
  removeEntry: (id) => set((state) => ({
    entries: state.entries.filter((e) => e.id !== id),
  })),
  
  // 重新排序：熟悉移到末尾，陌生插入到1/3位置
  reorderEntries: (familiarIds, unfamiliarIds) => set((state) => {
    const entries = [...state.entries]
    const familiarEntries: WordbookEntry[] = []
    const unfamiliarEntries: WordbookEntry[] = []
    const neutralEntries: WordbookEntry[] = []
    
    entries.forEach(entry => {
      if (familiarIds.includes(entry.id)) {
        familiarEntries.push(entry)
      } else if (unfamiliarIds.includes(entry.id)) {
        unfamiliarEntries.push(entry)
      } else {
        neutralEntries.push(entry)
      }
    })
    
    // 合并：陌生 -> 中间 -> 熟悉
    const oneThird = Math.floor(neutralEntries.length / 3)
    const reordered: WordbookEntry[] = [
      ...unfamiliarEntries,
      ...neutralEntries.slice(0, oneThird),
      ...neutralEntries.slice(oneThird),
      ...familiarEntries,
    ]
    
    // 更新sort_order
    return {
      entries: reordered.map((e, i) => ({ ...e, sort_order: i }))
    }
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setMode: (mode) => set({ mode }),
}))
