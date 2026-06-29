# 深圳信息职业技术大学 · 教务处网站

> 基于 pnpm workspace 的 Monorepo 项目,重构教务处官方网站。

## 技术栈

| 模块     | 技术                          | 位置              |
| -------- | ----------------------------- | ----------------- |
| 用户端   | Nuxt 3 (SSR/SSG) + Vue 3 + TS | `apps/web`        |
| CMS 后台 | Vue 3 + Element Plus + TS     | `apps/admin`      |
| 后端     | NestJS 10 + Fastify + Prisma  | `apps/server`     |
| 共享包   | TypeScript 类型与工具         | `packages/shared` |

## 环境要求

- Node.js ≥ 20 (推荐通过 `.nvmrc` 锁定版本)
- pnpm ≥ 9
- Docker Desktop(用于本地中间件,见 T0.3)

## 一键启动

```bash
# 1. 安装依赖
pnpm install

# 2. 启动本地中间件(PG/Redis/ES/MinIO/RabbitMQ)
docker compose up -d

# 3. 并行启动所有应用(开发模式)
pnpm dev

# 或单独启动某个应用
pnpm dev:web      # 用户端
pnpm dev:admin    # CMS 后台
pnpm dev:server   # 后端 API
```

## 常用脚本

| 命令             | 说明               |
| ---------------- | ------------------ |
| `pnpm build`     | 构建所有子包       |
| `pnpm lint`      | 全量 lint          |
| `pnpm lint:fix`  | 自动修复 lint 问题 |
| `pnpm format`    | Prettier 格式化    |
| `pnpm test`      | 运行所有测试       |
| `pnpm typecheck` | 全量类型检查       |
| `pnpm clean`     | 清理构建产物与缓存 |

## 目录结构

```
JWC/
├── apps/
│   ├── web/        # 用户端(Nuxt 3, SSR/SSG)
│   ├── admin/      # CMS 后台(Vue 3 + Element Plus)
│   └── server/     # 后端(NestJS 10 + Fastify + Prisma)
├── packages/
│   └── shared/     # 跨端共享类型、常量、工具函数
├── docs/           # 项目文档(需求/实施计划/交接文档)
│   └── handover/   # 子任务交接文档
└── docker/         # 本地开发容器配置与初始化脚本
```

## 开发约定

- 提交规范:Conventional Commits(`feat`/`fix`/`docs`/`chore`/`refactor`/`test`)
- 分支策略:`main`(生产)/ `develop`(集成)/ `feature/*`(功能)/ `fix/*`(修复)
- 代码风格:ESLint + Prettier + Stylelint,Husky pre-commit 自动校验
- 详细实施计划见 `docs/教务处网站重构实施计划.md`
- 任务进度跟踪见 `docs/checklist.md`
