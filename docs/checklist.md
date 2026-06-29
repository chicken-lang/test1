# 教务处网站重构 · 子任务进度跟踪

> 对应文档:`docs/教务处网站重构实施计划.md`
> 更新规则:每完成一个子任务,勾选对应项并填写完成日期/提交哈希

图例:`[x]` 已完成 · `[ ]` 未完成 · `[~]` 进行中 · `[-]` 暂缓/阻塞

---

## 阶段 0:项目初始化与工程基础设施(M0)

### T0.1 Monorepo 仓库初始化 ✅
- 执行前
  - [x] 确认 Node 20+ / pnpm 9+ 已安装
  - [x] 确认 Git 仓库与分支策略(main/develop/feature)
  - [x] 确认目录命名规范(apps/web、apps/admin、apps/server、packages/shared)
- 执行中
  - [x] 创建 `pnpm-workspace.yaml`
  - [x] 初始化 4 个子包 `package.json`
  - [x] 配置根 `package.json` 聚合脚本(dev/build/lint/test)
  - [x] 配置 `.nvmrc`、`.npmrc`(shamefully-hoist、registry)
  - [x] 配置 `.editorconfig`、`.gitignore`、`.gitattributes`
- 完成后
  - [x] `pnpm install` 无报错
  - [x] `pnpm -r build` 全部子包构建通过
  - [x] README 含一键启动说明

> 完成时间:2026-06-29 · 提交:`2cd6521`

### T0.2 代码规范与 Git Hooks 配置 ✅
- 执行前
  - [x] 确认 ESLint/Prettier/Stylelint 版本与 Vue/TS 兼容
  - [x] 确认 commitlint 规则(feat/fix/docs/chore/refactor/test/perf/style/build/ci/revert)
- 执行中
  - [x] 配置根 `eslint.config.mjs`(ESLint 9 flat config,含 Vue、TS、Promise 规则)
  - [x] 配置 `.prettierrc`(2 空格、单引号、无分号、尾逗号)
  - [x] 配置 `.stylelintrc`(标准 + Vue 推荐)
  - [x] 配置 Husky `pre-commit`(lint-staged)
  - [x] 配置 `commit-msg`(commitlint)
  - [x] 配置 `commitlint.config.cjs`
- 完成后
  - [x] 故意提交未格式化代码 → 被 hooks 拦截(lint-staged 自动修复)
  - [x] 故意提交非规范 commit message → 被拦截(commitlint)
  - [x] 规范提交通过

> 完成时间:2026-06-29 · 提交:`ed682f6`

### T0.3 开发环境容器化 [~]
- 执行前
  - [x] 确认 Docker Desktop 可用
  - [x] 确认端口无冲突(5432/6379/9200/9000/5672)
  - [x] 准备初始化脚本目录(`docker/init/`)
- 执行中
  - [x] 编写 `docker-compose.yml`(pg16、redis7、es8、minio、rabbitmq)
  - [x] 配置 ES 中文分词插件(ik_max_word)
  - [x] 配置 PG 初始化数据库 `jwc_dev` + 扩展
  - [x] 配置 MinIO 默认 bucket `jwc-attachments`
  - [x] 配置数据卷持久化
  - [x] 编写 `.env.example`
  - [x] 配置 Docker 国内镜像源(daemon.json)
- 完成后
  - [ ] `docker compose up -d` 全部 healthy(待网络/镜像源验证)
  - [ ] PG 可连接并查询版本
  - [ ] ES `/_cluster/health` 返回 green
  - [ ] MinIO 控制台可访问(9001)
  - [ ] Redis `ping` 返回 PONG

> 配置文件已全部完成,实际启动验证暂缓(用户指示聚焦前端)

### T0.4 CI/CD 基础流水线 [-]
> 暂缓:待确认 CI 平台(GitHub Actions / GitLab CI)

---

## 阶段 1:后端核心基础(M1)

### T1.1 NestJS 项目骨架 + 配置中心
- [ ] 初始化 NestJS + Fastify
- [ ] 集成 ConfigModule + Joi 校验
- [ ] HealthController(DB/Redis/ES 健康检查)
- [ ] 全局前缀 /api/v1 + Swagger /api/docs

### T1.2 数据库连接 + Prisma schema 初始化
- [ ] prisma/schema.prisma + PrismaModule/PrismaService
- [ ] 软删除中间件 + 慢查询日志

### T1.3 核心数据模型迁移(20 个实体)
- [ ] User/Role/UserRole/Column/Article/ArticleRevision/Tag/ArticleTag
- [ ] Attachment/Department/Major/Course/TeachingProject
- [ ] FriendLink/QuickLink/Banner/Feedback/Semester/AuditLog
- [ ] 索引 + 全文索引 + 唯一约束 + 种子数据

### T1.4 通用中间件
- [ ] HttpExceptionFilter + Pino 日志 + trace_id
- [ ] CORS + Helmet + 限流(全局 + 登录)

### T1.5 认证模块(JWT + 本地账号)
- [ ] AuthService/AuthController + JwtStrategy
- [ ] 密码策略 + 登录失败锁定 + 双因素预留

### T1.6 RBAC 权限模块
- [ ] @Roles/@Permissions 装饰器 + Guard
- [ ] 数据范围过滤器 + 角色 CRUD

### T1.7 审计日志模块
- [ ] AuditLogInterceptor + 查询导出 API + 保留策略

### T1.8 文件上传 + 对象存储模块
- [ ] StorageService + 上传 API + 病毒扫描 + 下载统计

### T1.9 API 文档(Swagger)
- [ ] 全局 Swagger + ReDoc + DTO schema

---

## 阶段 2:CMS 后台(M2)

### T2.1 后台前端骨架
- [ ] Vite + Vue3 + TS + Element Plus + 动态路由 + 布局

### T2.2 登录与权限框架
- [ ] 登录页 + v-permission/v-roles 指令

### T2.3 栏目管理
### T2.4 文章管理(CRUD + 富文本)
### T2.5 文章工作流
### T2.6 附件管理
### T2.7 图片管理
### T2.8 标签管理
### T2.9 Banner / 友情链接 / 快捷入口管理
### T2.10 用户与角色管理
### T2.11 站点配置
### T2.12 数据看板
### T2.13 备份恢复

---

## 阶段 3:用户端前端基础(M3)

### T3.1 前端骨架(Nuxt 3) ✅
- 执行前
  - [x] 确认 Nuxt 3 版本与 Element Plus/Vant 兼容
  - [x] 确认 SSR/SSG 模式
- 执行中
  - [x] 初始化 `apps/web`(Nuxt 3 + TypeScript)
  - [x] 集成 @element-plus/nuxt 模块
  - [x] 集成 @pinia/nuxt 状态管理
  - [x] 集成 @nuxtjs/color-mode(适老化模式)
  - [x] 配置 `nuxt.config.ts`(SSR、模块、SCSS 自动注入、runtimeConfig)
  - [x] 配置 `tsconfig.json`
  - [x] 注册 @iconify/vue 全局 Icon 组件(plugins/iconify.ts)
  - [x] 配置 components 自动导入(pathPrefix: false)
- 完成后
  - [x] `pnpm dev:web` 启动成功(SSR 渲染 http://localhost:3000)
  - [x] Element Plus 组件可用
  - [x] Icon 组件全局可用

> 完成时间:2026-06-29

### T3.2 通用布局 ✅
- 执行前
  - [x] 确认导航结构(16 项主导航)
  - [x] 确认页脚信息结构(联系方式/友情链接/快捷入口/公众号)
- 执行中
  - [x] `layouts/default.vue`(skip-link + Header + Nav + main + Footer)
  - [x] `components/layout/AppHeader.vue`(校徽+校名+部门名+工具栏:搜索/登录/收藏/适老化)
  - [x] `components/layout/AppNav.vue`(16 项导航,sticky,移动端汉堡菜单)
  - [x] `components/layout/AppFooter.vue`(4 列 + 版权备案 + 站点地图 + 无障碍说明)
  - [x] `assets/css/variables.scss`(主题色 #005BAC + 5 档断点 mixin)
  - [x] `assets/css/main.scss`(reset + 工具类 + 适老化模式 + skip-link 无障碍)
- 完成后
  - [x] 桌面端布局正常
  - [x] 适老化模式可切换([data-color-mode='elderly'])
  - [x] 无障碍 skip-link 可用

> 完成时间:2026-06-29

### T3.3 通用组件库
- [ ] 列表组件(卡片/表格/紧凑)
- [ ] 分页组件
- [ ] 详情组件(文章正文/附件/相关推荐)
- [ ] 卡片组件
- [ ] 骨架屏组件

### T3.4 HTTP 封装 + 状态管理
- [ ] $fetch 封装(拦截器/错误处理/loading)
- [ ] Pinia stores(user/notice/news/site-config)
- [ ] Mock 拦截(nuxt server route 或 msw)

### T3.5 SEO 基础
- [ ] useSeoMeta 全局封装
- [ ] sitemap.xml
- [ ] robots.txt

### T3.6 响应式 + 适老化 + 无障碍基础
- [x] 响应式断点 mixin(xs/sm/md/lg/xl)
- [x] 适老化模式切换(elderly)
- [x] skip-link 无障碍
- [ ] ARIA 标签完善
- [ ] 键盘导航测试

---

## 阶段 4:用户端核心页面(M4)

### T4.1 首页 ✅
- 执行前
  - [x] 确认首页 14 个区块结构(FR-01)
  - [x] 准备 Mock 数据(`mock/data.ts`)
- 执行中
  - [x] `components/home/HomeBanner.vue`(el-carousel 轮播 3 张)
  - [x] `components/home/HomeNotice.vue`(学生/教师双 Tab 通知公告)
  - [x] `components/home/HomeNews.vue`(大图 + 列表新闻资讯)
  - [x] `components/home/HomeQuickLink.vue`(12 入口快速通道网格)
  - [x] `components/home/HomeSections.vue`(课程建设 + 常用信息 + 投诉举报 + 信息公开)
  - [x] `pages/index.vue`(组合首页区块 + useSeoMeta)
  - [x] Mock 数据(banners/notices/news/quickLinks/commonInfo/courseConstruction/reportInfo/disclosureLinks)
- 完成后
  - [x] 首页 SSR 渲染正常(http://localhost:3000)
  - [x] 14 个区块全部展示
  - [x] 响应式布局(桌面/平板/移动端)
  - [x] SEO 元信息已设置

> 完成时间:2026-06-29

### T4.2 列表页通用模板
- [ ] 栏目列表页(顶栏标题 + 筛选 + 列表 + 分页)
- [ ] 卡片/表格/紧凑三种列表样式
- [ ] 侧边栏(栏目导航 + 热门 + 推荐)

### T4.3 详情页通用模板
- [ ] 文章详情(标题 + 元信息 + 正文 + 附件 + 相关推荐)
- [ ] 上一篇/下一篇导航
- [ ] 分享/打印/字号调节

### T4.4 部门介绍页
### T4.5 通知公告
### T4.6 办事指南
### T4.7 下载中心
### T4.8 教学反馈
### T4.9 校历/作息/班车/地图/部门电话
### T4.10 搜索页
### T4.11 用户中心
### T4.12 404/500 错误页

---

## 阶段 5:业务内容模块(M5)

### T5.1 规章制度(FR-03)
### T5.2 教务管理(FR-04)
### T5.3 实践教学(FR-05)
### T5.4 专业建设(FR-06)
### T5.5 教研教改(FR-07)
### T5.6 技能竞赛(FR-08)
### T5.7 教学荣誉(FR-09)
### T5.8 智慧教室(FR-10)
### T5.9 项目指南(FR-11)

---

## 阶段 6:搜索与外部系统集成(M6)

### T6.1 Elasticsearch 索引 + 全文检索 API
### T6.2 搜索前端
### T6.3 SSO 对接
### T6.4 外部系统快捷入口(17 个)
### T6.5 快捷入口可用性监控
### T6.6 GIS 地图 + 班车 iframe 嵌入
### T6.7 邮件/短信/微信通知

---

## 阶段 7:非功能需求加固(M7)

### T7.1 性能优化
### T7.2 安全加固
### T7.3 SEO 完善
### T7.4 可访问性
### T7.5 监控告警
### T7.6 日志收集 + 链路追踪
### T7.7 灰度发布 + 回滚

---

## 阶段 8:数据迁移与上线(M8)

### T8.1 数据迁移脚本
### T8.2 URL 重定向映射(301)
### T8.3 校名统一清洗
### T8.4 等保测评准备
### T8.5 上线演练 + 蓝绿部署
### T8.6 监控验证

---

## 阶段 9:测试与验收(M9)

### T9.1 单元测试
### T9.2 集成测试
### T9.3 E2E 测试
### T9.4 性能压测
### T9.5 验收测试(DoD 299 条)
