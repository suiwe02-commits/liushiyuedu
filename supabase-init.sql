-- 流式阅读 - Supabase 数据库初始化脚本（可重复执行）
-- 在 Supabase SQL Editor 中执行此脚本

-- ============================================
-- 1. 清理已存在的策略和触发器（避免重复执行报错）
-- ============================================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- 删除所有自定义策略
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 删除已存在的触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS folders_updated_at ON public.folders;
DROP TRIGGER IF EXISTS articles_updated_at ON public.articles;
DROP TRIGGER IF EXISTS annotations_updated_at ON public.annotations;
DROP TRIGGER IF EXISTS wordbook_updated_at ON public.wordbook;

-- 删除已存在的函数
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at();

-- 删除已存在的表（按依赖顺序）
DROP TABLE IF EXISTS public.api_usage_logs CASCADE;
DROP TABLE IF EXISTS public.wordbook CASCADE;
DROP TABLE IF EXISTS public.translations CASCADE;
DROP TABLE IF EXISTS public.annotations CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.user_quotas CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.global_config CASCADE;

-- ============================================
-- 2. 创建用户档案表
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 自动创建档案的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. 用户配额表
-- ============================================
CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quota_type TEXT NOT NULL CHECK (quota_type IN ('max_articles', 'daily_api_calls', 'storage_limit_mb')),
  quota_limit INTEGER NOT NULL DEFAULT 50,
  used_count INTEGER NOT NULL DEFAULT 0,
  reset_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, quota_type)
);

ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own quotas" ON user_quotas FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. 文件夹表
-- ============================================
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own folders" ON folders FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 5. 文章表
-- ============================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  read_progress DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own articles" ON articles FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 6. 单词标注表
-- ============================================
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  phonetic TEXT,
  positions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, word)
);

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own annotations" ON annotations FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 7. 段落翻译表
-- ============================================
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  paragraph_index INTEGER NOT NULL,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, paragraph_index)
);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own translations" ON translations FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 8. 单词本表
-- ============================================
CREATE TABLE wordbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT,
  translation TEXT NOT NULL,
  familiarity INTEGER DEFAULT 1 CHECK (familiarity BETWEEN 1 AND 5),
  sort_order INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

ALTER TABLE wordbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own wordbook" ON wordbook FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER wordbook_updated_at
  BEFORE UPDATE ON wordbook
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 9. API使用日志表
-- ============================================
CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_type TEXT NOT NULL CHECK (api_type IN ('dictionary', 'translation')),
  endpoint TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own logs" ON api_usage_logs FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 10. 全局配置表
-- ============================================
CREATE TABLE global_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  guest_max_articles INTEGER DEFAULT 10,
  guest_daily_api_calls INTEGER DEFAULT 100,
  user_max_articles INTEGER DEFAULT 50,
  user_daily_api_calls INTEGER DEFAULT 500,
  user_storage_limit_mb INTEGER DEFAULT 50,
  developer_email TEXT DEFAULT 'developer@example.com',
  developer_wechat TEXT DEFAULT 'developer',
  dictionary_api_key TEXT,
  translation_api_key TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO global_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE global_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read config" ON global_config FOR SELECT TO authenticated USING (true);

-- ============================================
-- 11. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_folder_id ON articles(folder_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_article_id ON annotations(article_id);
CREATE INDEX IF NOT EXISTS idx_translations_user_id ON translations(user_id);
CREATE INDEX IF NOT EXISTS idx_translations_article_id ON translations(article_id);
CREATE INDEX IF NOT EXISTS idx_wordbook_user_id ON wordbook(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_used_at ON api_usage_logs(used_at);

-- ============================================
-- 完成
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '数据库初始化完成！';
END $$;
