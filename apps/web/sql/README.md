# D1 数据库初始化指南

## 1. 安装 wrangler

```bash
npm install -g wrangler
# 或项目内安装
pnpm add -D wrangler
```

## 2. 登录 Cloudflare

```bash
npx wrangler login
```

浏览器会打开 Cloudflare 授权页面,点 "Allow"。

## 3. 查看 D1 数据库列表

```bash
npx wrangler d1 list
```

确认 `sziit-db` 已存在,记录它的 `database_id`。

## 4. 执行 schema.sql (建表)

**本地(开发):**
```bash
npx wrangler d1 execute sziit-db --local --file=./sql/schema.sql
```

**远程(生产):**
```bash
npx wrangler d1 execute sziit-db --remote --file=./sql/schema.sql
```

## 5. 执行 seed.sql (导入测试数据)

**本地:**
```bash
npx wrangler d1 execute sziit-db --local --file=./sql/seed.sql
```

**远程:**
```bash
npx wrangler d1 execute sziit-db --remote --file=./sql/seed.sql
```

## 6. 一键执行 (建表 + 数据)

**远程一次性执行:**
```bash
npx wrangler d1 execute sziit-db --remote --file=./sql/schema.sql && \
npx wrangler d1 execute sziit-db --remote --file=./sql/seed.sql
```

## 7. 验证数据

```bash
npx wrangler d1 execute sziit-db --remote --command="SELECT name FROM columns"
```

应该看到 6 个主栏目 + 6 个子栏目。

## 8. 常用查询示例

```bash
# 查看所有文章
npx wrangler d1 execute sziit-db --remote --command="SELECT id, title, views FROM articles"

# 查看部门领导
npx wrangler d1 execute sziit-db --remote --command="SELECT name, position FROM dept_leaders"

# 查看课程表
npx wrangler d1 execute sziit-db --remote --command="SELECT * FROM class_schedule LIMIT 5"
```

## 注意事项

- `--local` 用于本地开发,数据存到 `.wrangler/state/v3/d1/` 目录
- `--remote` 用于生产环境,真实数据
- schema.sql 使用 `CREATE TABLE IF NOT EXISTS`,重复执行不会报错
- seed.sql 用 INSERT,如果重复导入会报 UNIQUE 约束错误
- 如果要重置数据,先 `DELETE FROM xxx` 再重新执行 seed.sql
