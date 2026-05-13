# 流式阅读 - 项目指南

> 高效外语阅读辅助工具，支持单词标注、翻译和单词本记忆

## 📁 项目结构

```
liushiyuedu/
├── public/                     # 静态资源
├── src/
│   ├── api/                    # API 调用
│   │   ├── supabase.ts        # Supabase 客户端
│   │   ├── dictionary.ts      # 词典 API
│   │   └── translation.ts     # 翻译 API
│   ├── components/
│   │   ├── common/            # 通用组件
│   │   │   ├── Button.tsx     # 按钮
│   │   │   ├── Modal.tsx      # 弹窗
│   │   │   ├── Toast.tsx      # 提示
│   │   │   └── QuotaWarning.tsx # 配额警告
│   │   └── layout/            # 布局组件
│   │       ├── Header.tsx     # 顶部导航
│   │       └── AppLayout.tsx  # 页面布局
│   ├── pages/                 # 页面组件
│   │   ├── Home.tsx          # 首页/文章列表
│   │   ├── Reader.tsx        # 阅读器
│   │   ├── Wordbook.tsx      # 单词本
│   │   ├── Login.tsx         # 登录
│   │   ├── Register.tsx      # 注册
│   │   └── Settings.tsx      # 设置
│   ├── stores/                # Zustand 状态管理
│   │   ├── authStore.ts      # 认证状态
│   │   ├── articleStore.ts   # 文章状态
│   │   ├── annotationStore.ts # 标注状态
│   │   └── wordbookStore.ts  # 单词本状态
│   ├── services/
│   │   └── localDB.ts        # localForage 本地数据库
│   ├── types/
│   │   └── index.ts          # TypeScript 类型定义
│   ├── App.tsx               # 根组件
│   ├── main.tsx              # 入口文件
│   └── index.css             # 全局样式
├── supabase-init.sql          # 数据库初始化脚本
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── PROJECT_GUIDE.md          # 本文档
```

## 🚀 本地开发

### 前置要求

- Node.js >= 18.0.0
- npm 或 yarn
- Supabase 账户（用于云端同步功能，可选）

### 安装依赖

```bash
cd liushiyuedu
npm install
```

### 配置环境变量

创建 `.env` 文件（从 `.env.example` 复制）：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **注意**：Supabase 配置是可选的。没有配置时，应用程序将以纯本地模式运行，所有数据存储在浏览器 IndexedDB 中。

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
npm run preview  # 预览生产版本
```

## ☁️ Supabase 配置步骤

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 点击 "New Project"
3. 输入项目名称（如 `liushiyuedu`）
4. 选择区域（建议选择离用户最近的区域）
5. 设置数据库密码（妥善保存）
6. 点击 "Create new project"

### 2. 获取连接信息

1. 进入项目 Dashboard
2. 点击左侧 **Settings** → **API**
3. 复制以下信息：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 3. 初始化数据库

1. 在 Supabase Dashboard 中，点击左侧 **SQL Editor**
2. 点击 **New query**
3. 复制 `supabase-init.sql` 文件的全部内容
4. 粘贴到查询编辑器中
5. 点击 **Run** 执行

### 4. 验证表创建

执行以下查询验证表已创建：

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

应看到以下表：
- profiles
- user_quotas
- folders
- articles
- annotations
- translations
- wordbook
- api_usage_logs
- global_config

### 5. 启用邮箱认证（可选）

1. 进入 **Authentication** → **Providers**
2. 启用 **Email** 提供商
3. 配置邮件模板（可选）

## 🌐 部署到 Vercel

### 方式一：通过 GitHub 部署（推荐）

#### 1. 推送代码到 GitHub

```bash
# 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 创建 GitHub 仓库并推送
git remote add origin https://github.com/yourusername/liushiyuedu.git
git push -u origin main
```

#### 2. 部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Add New..." → "Project"
3. 选择 "Import Git Repository"
4. 选择刚才创建的仓库
5. 配置环境变量：
   - `VITE_SUPABASE_URL` = 你的 Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = 你的 Supabase Anon Key
6. 点击 "Deploy"

#### 3. 自定义域名（可选）

1. 进入项目 Settings → Domains
2. 添加你的域名
3. 按照提示配置 DNS

### 方式二：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd liushiyuedu
vercel

# 设置生产环境变量
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# 部署到生产
vercel --prod
```

## 👨‍💼 管理员后台使用

### 访问 Supabase 管理面板

1. 登录 [supabase.com](https://supabase.com)
2. 选择你的项目
3. 点击左侧相应菜单管理数据

### 用户管理

在 **Table Editor** 中：

- **profiles** 表：查看所有注册用户
- **user_quotas** 表：管理用户配额
- **api_usage_logs** 表：查看 API 使用情况

### 配置管理

在 **global_config** 表中编辑配置：

| 字段 | 说明 | 默认值 |
|------|------|--------|
| guest_max_articles | 游客最大文章数 | 10 |
| guest_daily_api_calls | 游客每日API调用次数 | 100 |
| user_max_articles | 注册用户最大文章数 | 50 |
| user_daily_api_calls | 注册用户每日API调用次数 | 500 |
| user_storage_limit_mb | 用户存储空间上限(MB) | 50 |
| developer_email | 开发者邮箱 | developer@example.com |
| developer_wechat | 开发者微信 | developer |

### 手动调整用户配额

```sql
-- 查看用户配额
SELECT * FROM user_quotas WHERE user_id = 'user-uuid';

-- 更新配额
UPDATE user_quotas 
SET quota_limit = 100 
WHERE user_id = 'user-uuid' AND quota_type = 'max_articles';
```

## 📱 功能使用说明

### 游客模式

首次访问时自动进入游客模式，无需注册即可使用所有核心功能：
- 创建、编辑、删除文章
- 导入 .txt 文件
- 单词查询和标注
- 段落翻译
- 单词本背诵

所有数据存储在浏览器本地，换浏览器或清除缓存后数据将丢失。

### 注册与登录

1. 点击右上角"注册"
2. 输入邮箱和密码
3. 注册后自动同步本地数据到云端
4. 登录后可多设备同步

### 数据同步

- 登录后，所有操作实时同步到云端
- 离线时自动切换到本地存储
- 网络恢复后自动同步增量数据

## 🛠️ 外部 API 配置

### 词典 API

使用免费的 [Free Dictionary API](https://dictionaryapi.dev/)，无需配置 API Key。

如需使用其他词典服务，修改 `src/api/dictionary.ts`。

### 翻译 API

使用免费的 [MyMemory Translation API](https://mymemory.translated.net/)，有一定频率限制。

如需更强大的翻译服务，可接入 Google Translate API、DeepL API 等。

## 📝 常见问题

### Q: 游客数据会丢失吗？

A: 游客数据存储在浏览器 IndexedDB 中。清除浏览器数据、切换浏览器或使用无痕模式会导致数据丢失。建议注册账户进行云端备份。

### Q: 如何恢复误删的数据？

A: 如果已注册并开启了云端同步，可以在其他设备登录账户恢复数据。否则无法恢复。

### Q: API 调用次数用完了怎么办？

A: 联系开发者提升配额（邮箱：developer@example.com，微信：developer）。

### Q: 支持离线使用吗？

A: 支持。应用程序完全基于浏览器本地运行。离线时可以正常使用，离线期间的操作会在联网后自动同步。

## 📄 许可证

本项目仅供个人学习使用，禁止商业用途。

---

如有其他问题，请联系开发者。
