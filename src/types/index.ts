// 用户相关类型
export interface User {
  id: string;
  email: string;
  created_at: string;
  last_login_at: string;
  is_active: boolean;
}

export interface UserQuota {
  id: string;
  user_id: string;
  quota_type: QuotaType;
  quota_limit: number;
  used_count: number;
  reset_date: string;
}

export type QuotaType = 'max_articles' | 'daily_api_calls' | 'storage_limit_mb';

// 文件夹相关类型
export interface Folder {
  id: string;
  user_id?: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // 本地额外字段
  article_count?: number;
  children?: Folder[];
  isExpanded?: boolean;
}

// 文章相关类型
export interface Article {
  id: string;
  user_id?: string;
  folder_id: string | null;
  title: string;
  content: string;
  word_count: number;
  read_progress: number;
  created_at: string;
  updated_at: string;
}

// 标注相关类型
export interface Annotation {
  id: string;
  user_id?: string;
  article_id: string;
  word: string;
  translation: string;
  phonetic: string;
  positions: number[];
  created_at: string;
  updated_at: string;
}

// 翻译相关类型
export interface Translation {
  id: string;
  user_id?: string;
  article_id: string;
  paragraph_index: number;
  original_text: string;
  translated_text: string;
  created_at: string;
}

// 单词本相关类型
export interface WordbookEntry {
  id: string;
  user_id?: string;
  word: string;
  phonetic: string;
  translation: string;
  familiarity: number;
  sort_order: number;
  last_reviewed_at: string;
  created_at: string;
  updated_at: string;
}

// API使用日志
export interface ApiUsageLog {
  id: string;
  user_id: string;
  api_type: 'dictionary' | 'translation';
  endpoint: string;
  used_at: string;
}

// 全局配置
export interface GlobalConfig {
  id: number;
  guest_max_articles: number;
  guest_daily_api_calls: number;
  user_max_articles: number;
  user_daily_api_calls: number;
  user_storage_limit_mb: number;
  developer_email: string;
  developer_wechat: string;
  dictionary_api_key: string;
  translation_api_key: string;
  updated_at: string;
}

// 词典API返回类型
export interface DictionaryResult {
  word: string;
  phonetic?: string;
  phonetics?: { text: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }[];
  }[];
}

// 翻译API返回类型
export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
}

// 应用状态类型
export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  isGuest: boolean;
}

// 阅读器设置
export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
}

// Toast通知类型
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// 本地存储数据结构
export interface LocalData {
  folders: Folder[];
  articles: Article[];
  annotations: Annotation[];
  translations: Translation[];
  wordbook: WordbookEntry[];
  settings: ReaderSettings;
  lastSyncTime: string;
}
