import { create } from 'zustand'
import { Annotation, Translation } from '@/types'

interface AnnotationState {
  annotations: Annotation[]
  translations: Translation[]
  isLoading: boolean
  
  setAnnotations: (annotations: Annotation[]) => void
  addAnnotation: (annotation: Annotation) => void
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void
  getAnnotationByWord: (word: string) => Annotation | undefined
  
  setTranslations: (translations: Translation[]) => void
  addTranslation: (translation: Translation) => void
  updateTranslation: (id: string, updates: Partial<Translation>) => void
  removeTranslation: (id: string) => void
  
  setLoading: (loading: boolean) => void
  clearForArticle: (articleId: string) => void
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  translations: [],
  isLoading: false,
  
  setAnnotations: (annotations) => set({ annotations }),
  addAnnotation: (annotation) => set((state) => ({ 
    annotations: [...state.annotations, annotation] 
  })),
  updateAnnotation: (id, updates) => set((state) => ({
    annotations: state.annotations.map((a) => 
      a.id === id ? { ...a, ...updates } : a
    ),
  })),
  removeAnnotation: (id) => set((state) => ({
    annotations: state.annotations.filter((a) => a.id !== id),
  })),
  getAnnotationByWord: (word) => {
    return get().annotations.find(
      a => a.word.toLowerCase() === word.toLowerCase()
    )
  },
  
  setTranslations: (translations) => set({ translations }),
  addTranslation: (translation) => set((state) => ({ 
    translations: [...state.translations, translation] 
  })),
  updateTranslation: (id, updates) => set((state) => ({
    translations: state.translations.map((t) => 
      t.id === id ? { ...t, ...updates } : t
    ),
  })),
  removeTranslation: (id) => set((state) => ({
    translations: state.translations.filter((t) => t.id !== id),
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  clearForArticle: (articleId) => set((state) => ({
    annotations: state.annotations.filter(a => a.article_id !== articleId),
    translations: state.translations.filter(t => t.article_id !== articleId),
  })),
}))
