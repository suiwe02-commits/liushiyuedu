import localforage from 'localforage'
import { Folder, Article, Annotation, Translation, WordbookEntry, ReaderSettings } from '@/types'

// 配置 localForage
const folderStore = localforage.createInstance({
  name: 'liushiyuedu',
  storeName: 'folders',
})

const articleStore = localforage.createInstance({
  name: 'liushiyuedu',
  storeName: 'articles',
})

const annotationStore = localforage.createInstance({
  name: 'liushiyuedu',
  storeName: 'annotations',
})

const translationStore = localforage.createInstance({
  name: 'liushiyuedu',
  storeName: 'translations',
})

const wordbookStore = localforage.createInstance({
  name: 'liushiyuedu',
  storeName: 'wordbook',
})

const settingsStore = localforage.createInstance({
  name: 'liushiyuedu',
  storeName: 'settings',
})

// 文件夹操作
export const localDB = {
  // 文件夹
  folders: {
    async getAll(): Promise<Folder[]> {
      const items: Folder[] = []
      await folderStore.iterate((value: Folder) => {
        items.push(value)
      })
      return items.sort((a, b) => a.sort_order - b.sort_order)
    },

    async get(id: string): Promise<Folder | null> {
      return await folderStore.getItem(id)
    },

    async set(folder: Folder): Promise<void> {
      await folderStore.setItem(folder.id, folder)
    },

    async remove(id: string): Promise<void> {
      await folderStore.removeItem(id)
    },

    async clear(): Promise<void> {
      await folderStore.clear()
    },
  },

  // 文章
  articles: {
    async getAll(): Promise<Article[]> {
      const items: Article[] = []
      await articleStore.iterate((value: Article) => {
        items.push(value)
      })
      return items.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    },

    async get(id: string): Promise<Article | null> {
      return await articleStore.getItem(id)
    },

    async set(article: Article): Promise<void> {
      await articleStore.setItem(article.id, article)
    },

    async remove(id: string): Promise<void> {
      await articleStore.removeItem(id)
    },

    async clear(): Promise<void> {
      await articleStore.clear()
    },

    async getByFolder(folderId: string | null): Promise<Article[]> {
      const all = await this.getAll()
      return all.filter(a => a.folder_id === folderId)
    },
  },

  // 标注
  annotations: {
    async getAll(): Promise<Annotation[]> {
      const items: Annotation[] = []
      await annotationStore.iterate((value: Annotation) => {
        items.push(value)
      })
      return items
    },

    async getByArticle(articleId: string): Promise<Annotation[]> {
      const all = await this.getAll()
      return all.filter(a => a.article_id === articleId)
    },

    async get(id: string): Promise<Annotation | null> {
      return await annotationStore.getItem(id)
    },

    async set(annotation: Annotation): Promise<void> {
      await annotationStore.setItem(annotation.id, annotation)
    },

    async remove(id: string): Promise<void> {
      await annotationStore.removeItem(id)
    },

    async clear(): Promise<void> {
      await annotationStore.clear()
    },
  },

  // 翻译
  translations: {
    async getAll(): Promise<Translation[]> {
      const items: Translation[] = []
      await translationStore.iterate((value: Translation) => {
        items.push(value)
      })
      return items
    },

    async getByArticle(articleId: string): Promise<Translation[]> {
      const all = await this.getAll()
      return all.filter(t => t.article_id === articleId)
    },

    async set(translation: Translation): Promise<void> {
      await translationStore.setItem(translation.id, translation)
    },

    async remove(id: string): Promise<void> {
      await translationStore.removeItem(id)
    },

    async clear(): Promise<void> {
      await translationStore.clear()
    },
  },

  // 单词本
  wordbook: {
    async getAll(): Promise<WordbookEntry[]> {
      const items: WordbookEntry[] = []
      await wordbookStore.iterate((value: WordbookEntry) => {
        items.push(value)
      })
      return items.sort((a, b) => a.sort_order - b.sort_order)
    },

    async get(id: string): Promise<WordbookEntry | null> {
      return await wordbookStore.getItem(id)
    },

    async set(entry: WordbookEntry): Promise<void> {
      await wordbookStore.setItem(entry.id, entry)
    },

    async remove(id: string): Promise<void> {
      await wordbookStore.removeItem(id)
    },

    async clear(): Promise<void> {
      await wordbookStore.clear()
    },

    async getByWord(word: string): Promise<WordbookEntry | null> {
      const all = await this.getAll()
      return all.find(w => w.word.toLowerCase() === word.toLowerCase()) || null
    },
  },

  // 设置
  settings: {
    async get(): Promise<ReaderSettings> {
      const settings = await settingsStore.getItem<ReaderSettings>('reader')
      return settings || { fontSize: 16, lineHeight: 1.5 }
    },

    async set(settings: ReaderSettings): Promise<void> {
      await settingsStore.setItem('reader', settings)
    },
  },

  // 清除所有数据
  async clearAll(): Promise<void> {
    await Promise.all([
      folderStore.clear(),
      articleStore.clear(),
      annotationStore.clear(),
      translationStore.clear(),
      wordbookStore.clear(),
      settingsStore.clear(),
    ])
  },

  // 导出所有数据
  async exportAll(): Promise<{
    folders: Folder[]
    articles: Article[]
    annotations: Annotation[]
    translations: Translation[]
    wordbook: WordbookEntry[]
    settings: ReaderSettings
  }> {
    return {
      folders: await this.folders.getAll(),
      articles: await this.articles.getAll(),
      annotations: await this.annotations.getAll(),
      translations: await this.translations.getAll(),
      wordbook: await this.wordbook.getAll(),
      settings: await this.settings.get(),
    }
  },

  // 导入数据
  async importAll(data: {
    folders?: Folder[]
    articles?: Article[]
    annotations?: Annotation[]
    translations?: Translation[]
    wordbook?: WordbookEntry[]
    settings?: ReaderSettings
  }): Promise<void> {
    const promises: Promise<void>[] = []

    if (data.folders) {
      for (const folder of data.folders) {
        promises.push(this.folders.set(folder))
      }
    }

    if (data.articles) {
      for (const article of data.articles) {
        promises.push(this.articles.set(article))
      }
    }

    if (data.annotations) {
      for (const annotation of data.annotations) {
        promises.push(this.annotations.set(annotation))
      }
    }

    if (data.translations) {
      for (const translation of data.translations) {
        promises.push(this.translations.set(translation))
      }
    }

    if (data.wordbook) {
      for (const entry of data.wordbook) {
        promises.push(this.wordbook.set(entry))
      }
    }

    if (data.settings) {
      promises.push(this.settings.set(data.settings))
    }

    await Promise.all(promises)
  },
}
