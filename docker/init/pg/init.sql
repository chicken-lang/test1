-- PostgreSQL 初始化脚本
-- 由 docker-entrypoint-initdb.d 自动执行(仅首次创建数据卷时)
-- 对应实施计划 T0.3: 配置 PG 初始化数据库 jwc_dev

-- 扩展安装(Prisma/全文检索所需)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- 模糊检索
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- 去重音(拼音检索辅助)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- UUID 主键生成

-- 说明: 主库 jwc_dev 由 POSTGRES_DB 环境变量自动创建
-- 测试库(集成测试用)
CREATE DATABASE jwc_test;
