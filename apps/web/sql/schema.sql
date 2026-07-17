-- ========================================================================
-- 深圳信息职业技术大学教务处 - D1 数据库建表脚本
-- 数据库名: sziit-db
-- 适用: Cloudflare D1 (SQLite)
-- ========================================================================

-- 1. 栏目表
CREATE TABLE IF NOT EXISTS columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER DEFAULT 0,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  sort_order INTEGER DEFAULT 0,
  icon TEXT,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_columns_parent ON columns(parent_id);
CREATE INDEX IF NOT EXISTS idx_columns_status ON columns(status);

-- 2. 文章表
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  author TEXT,
  source TEXT,
  cover_image TEXT,
  publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  views INTEGER DEFAULT 0,
  is_top INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (column_id) REFERENCES columns(id)
);

CREATE INDEX IF NOT EXISTS idx_articles_column ON articles(column_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_publish ON articles(publish_date DESC);

-- 3. 部门领导表
CREATE TABLE IF NOT EXISTS dept_leaders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  photo TEXT,
  intro TEXT,
  responsibility TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 部门介绍表
CREATE TABLE IF NOT EXISTS dept_intro (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 课程表
CREATE TABLE IF NOT EXISTS class_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_number INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  period INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  teacher TEXT,
  classroom TEXT,
  class_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_week ON class_schedule(week_number);

-- 6. 公开目录表
CREATE TABLE IF NOT EXISTS disclosure_directory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  document_url TEXT,
  publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  sort_order INTEGER DEFAULT 0
);

-- 7. 用户表
-- password_bcrypt: bcrypt(sha256(明文)) 双层哈希
-- account_status: 1=正常 0=禁用
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_bcrypt TEXT NOT NULL,
  nickname TEXT,
  email TEXT,
  phone TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  account_status INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 登录令牌表（自定义随机Token，替代JWT）
CREATE TABLE IF NOT EXISTS user_token (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expire_time DATETIME NOT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_token_username ON user_token(username);
CREATE INDEX IF NOT EXISTS idx_user_token_token ON user_token(token);

-- 8. 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  article_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, article_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- 9. 用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  column_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, column_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (column_id) REFERENCES columns(id)
);

-- 10. 反馈表
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  contact TEXT,
  status INTEGER DEFAULT 0,
  reply TEXT,
  replied_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. 下载文件表
CREATE TABLE IF NOT EXISTS downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  download_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
