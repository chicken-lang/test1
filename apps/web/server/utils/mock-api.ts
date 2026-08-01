/**
 * Server 工具 - D1/Mock 双模式 API 辅助
 * 本地开发时自动使用 mock 数据,部署到 Cloudflare 后使用 D1
 */
import {
  banners,
  studentNotices,
  teacherNotices,
  newsList,
  quickLinks,
  commonInfo,
  columns,
  queryList,
  getFilterOptions,
  hotArticles,
  recommendArticles,
  getArticleDetail,
  searchArticles,
  getSearchSuggestions,
  hotKeywords,
  deptIntro,
  deptLeaders,
  businessDivisions,
  mainDuties,
  deptContact,
  classSchedule,
  schoolCalendar,
  busSchedule,
  departmentPhones,
  downloadFiles,
  downloadCategories,
  feedbackTypes,
  feedbackList,
  userProfile,
  userMessages,
  userFavorites,
  userHistory,
  userFeedback,
  userSubscriptions,
  disclosureDirectory,
  disclosureReport,
  sitemapData,
  courseConstruction,
  reportInfo,
  disclosureLinks,
} from '~/mock/data'

// ========== D1 可用性检测 ==========

/** 安全获取 Cloudflare D1 实例,不可用时返回 null */
export function getD1(event: any): any {
  try {
    const db = event.context?.cloudflare?.env?.DB
    return db ?? null
  } catch {
    return null
  }
}

/** 标准 API 响应包装 */
export function apiOk(data: any) {
  return { code: 0, data }
}

/** 标准分页响应 */
export function apiPage(list: any[], total: number, page: number, pageSize: number) {
  return { code: 0, data: { list, total, page, page_size: pageSize } }
}

/** 标准错误响应 */
export function apiError(statusCode: number, message: string) {
  throw createError({ statusCode, message: message })
}

// ========== Mock 数据适配层 ==========

/**
 * 内存中的栏目状态覆盖层
 * Mock 降级模式下，enable/disable 操作会修改此 Map，使栏目状态变更在前台/后台即时生效
 * key: columnId, value: 'ACTIVE' | 'DISABLED'
 */
const columnStatusOverrides = new Map<number, 'ACTIVE' | 'DISABLED'>()

/** 设置栏目状态（供 admin 路由的 enable/disable 降级 mock 调用） */
export function setMockColumnStatus(columnId: number, status: 'ACTIVE' | 'DISABLED') {
  columnStatusOverrides.set(columnId, status)
}

// ===== Mock 栏目创建/更新/删除（admin-mock 降级使用） =====
// 测试栏目数据已清空（新栏目导航显示逻辑验证完毕）
const mockCreatedColumns: any[] = []

/** 添加新创建的栏目到 mock 存储 */
export function addMockColumn(col: any) {
  mockCreatedColumns.push(col)
}

/** 更新 mock 栏目（包括 columnStatusOverrides 和 mockCreatedColumns） */
export function updateMockColumn(columnId: number, updates: any) {
  // 更新状态覆盖
  if (updates.status) {
    columnStatusOverrides.set(columnId, updates.status)
  }
  // 更新新创建的栏目
  const idx = mockCreatedColumns.findIndex(c => c.columnId === columnId)
  if (idx >= 0) {
    mockCreatedColumns[idx] = { ...mockCreatedColumns[idx], ...updates }
  }
}

/** 获取所有 mock 创建的栏目（供 mockColumnTree 合并使用） */
export function getMockCreatedColumns(): any[] {
  return mockCreatedColumns
}

/**
 * 对后端返回的栏目树应用 Mock 状态覆盖
 * 场景：后端可用但栏目管理 API 未实现（路径不匹配），后台停用/启用走 Mock 降级，
 * 此时前台获取后端栏目树后需要合并 Mock 状态覆盖，才能正确隐藏停用栏目
 */
export function applyMockStatusOverrides(nodes: any[], includeDisabled = false): any[] {
  if (!Array.isArray(nodes)) return []
  return nodes
    .map((node) => {
      const columnId = node.columnId || node.id
      const override = columnId != null ? columnStatusOverrides.get(columnId) : undefined
      // 后端 status 可能是数字 1/0、字符串 'ACTIVE'/'DISABLED'
      const backendActive = node.status === 1 || node.status === 'ACTIVE' || node.status === true
      const status = override ?? (backendActive ? 'ACTIVE' : 'DISABLED')
      return {
        ...node,
        status,
        is_enabled: status === 'ACTIVE',
        children: node.children ? applyMockStatusOverrides(node.children, includeDisabled) : [],
      }
    })
    .filter(node => includeDisabled || node.status === 'ACTIVE')
}

/**
 * 规范化后端栏目树
 * V2.0: 后端已按 6 个一级栏目结构返回，无需旧版 14→12 合并逻辑
 * 此函数保留为透传，仅做防御性空值处理
 */
export function normalizeColumnTree(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) return []
  return nodes.map((node: any) => ({
    ...node,
    // 兼容别名：后端返回 columnId/columnName，部分前端组件仍用 id/name
    id: node.columnId ?? node.id,
    name: node.columnName ?? node.name,
    children: Array.isArray(node.children) ? normalizeColumnTree(node.children) : [],
  }))
}

/** 获取栏目状态（合并静态数据与内存覆盖） */
function getColumnStatus(c: typeof columns[number]): 'ACTIVE' | 'DISABLED' {
  return columnStatusOverrides.get(c.columnId) ?? c.status
}

/**
 * 栏目树（V2.0 §5.3.3 标准结构）
 * 返回 V2.0 标准字段（columnId/columnSlug/columnName/parentId/sortOrder/status/responsibleBusiness/description/version）
 * 同时保留旧字段别名（id/name/code/parent_id/sort_order/is_enabled）向后兼容，供未迁移的页面使用
 * 前台公开接口默认不返回 DISABLED 栏目（V2.0 §5.3.3）
 */
export function mockColumnTree(options?: { includeDisabled?: boolean }) {
  const includeDisabled = options?.includeDisabled ?? false
  const buildNode = (c: typeof columns[number]): any => {
    const status = getColumnStatus(c)
    return {
      // ===== V2.0 标准字段 =====
      columnId: c.columnId,
      columnSlug: c.columnSlug,
      columnName: c.columnName,
      parentId: c.parentIdNum,
      sortOrder: c.sortOrder,
      status,
      responsibleBusiness: c.responsibleBusiness ?? null,
      description: c.description ?? null,
      linkUrl: (c as any).linkUrl ?? null,
      version: c.version,
      // ===== 旧字段别名（向后兼容，供 fetchColumnTree() 的调用方使用） =====
      id: c.columnId,
      name: c.columnName,
      code: c.columnSlug,
      parent_id: c.parentIdNum,
      sort_order: c.sortOrder,
      is_enabled: status === 'ACTIVE',
      icon: c.icon ?? null,
      children: (c.children ?? [])
        .map(buildNode)
        .filter((n: any) => n.status !== 'DELETED' && (includeDisabled || n.status === 'ACTIVE')),
    }
  }

  const tree = columns
    .map(buildNode)
    .filter((n: any) => n.status !== 'DELETED' && (includeDisabled || n.status === 'ACTIVE'))

  // 合并 Mock 创建的新栏目到树中
  const createdCols = getMockCreatedColumns()
  for (const col of createdCols) {
    const colStatus = columnStatusOverrides.get(col.columnId) || col.status || 'ACTIVE'
    if (colStatus === 'DELETED' || (!includeDisabled && colStatus !== 'ACTIVE')) continue

    const node: any = {
      columnId: col.columnId,
      columnSlug: col.columnSlug,
      columnName: col.columnName,
      parentId: col.parentId,
      sortOrder: col.sortOrder,
      status: colStatus,
      responsibleBusiness: col.responsibleBusiness ?? null,
      description: col.description ?? null,
      linkUrl: col.linkUrl ?? null,
      version: col.version ?? 1,
      id: col.columnId,
      name: col.columnName,
      code: col.columnSlug,
      parent_id: col.parentId,
      sort_order: col.sortOrder,
      is_enabled: colStatus === 'ACTIVE',
      icon: null,
      children: [],
    }

    if (col.parentId == null || col.parentId === 0) {
      // 一级栏目：添加到顶层
      tree.push(node)
    } else {
      // 二级栏目：添加到对应父级
      const parent = tree.find((n: any) => n.columnId === col.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      }
    }
  }

  return tree
}

/**
 * 栏目扁平列表:前端配置格式（保留 slug/title/parentId/listStyle 等旧字段）
 * 供 list/[slug].vue 等页面查询 currentColumn/sidebarColumns/breadcrumb 使用
 */
export function mockColumns() {
  // 将嵌套的 columns（一级含 children）展平为扁平结构（供 list/[slug].vue 查找 currentColumn、sidebarColumns、面包屑使用）
  // 同时添加旧字段别名（slug/title/parentId/order），向后兼容未迁移的页面
  const flat: any[] = []
  columns.forEach((c) => {
    const { children, ...rest } = c as any
    // 添加旧字段别名
    const node = {
      ...rest,
      slug: c.columnSlug,
      title: c.columnName,
      parentId: c.parentIdNum !== null && c.parentIdNum !== undefined ? String(c.parentIdNum) : null,
      order: c.sortOrder,
      articleCount: 0, // 默认值，实际由 /api/list/:slug 返回
      listStyle: 'card', // 默认列表样式
    }
    flat.push(node)
    if (children && children.length) {
      children.forEach((sub: any) => {
        flat.push({
          ...sub,
          slug: sub.columnSlug,
          title: sub.columnName,
          parentId: sub.parentIdNum !== null && sub.parentIdNum !== undefined ? String(sub.parentIdNum) : null,
          order: sub.sortOrder,
          articleCount: 0,
          listStyle: 'card',
        })
      })
    }
  })

  // 合并 Mock 创建的新栏目到扁平列表
  const createdCols = getMockCreatedColumns()
  for (const col of createdCols) {
    const colStatus = columnStatusOverrides.get(col.columnId) || col.status || 'ACTIVE'
    if (colStatus === 'DELETED' || colStatus !== 'ACTIVE') continue
    flat.push({
      ...col,
      slug: col.columnSlug,
      title: col.columnName,
      parentId: col.parentId != null ? String(col.parentId) : null,
      order: col.sortOrder,
      articleCount: 0,
      listStyle: 'card',
    })
  }

  return flat
}

/**
 * 全部栏目扁平化列表（含一级和二级），供映射查询使用
 */
function flattenColumns(): typeof columns[number][] {
  const flat: typeof columns[number][] = []
  columns.forEach((c) => {
    flat.push(c)
    if (c.children && c.children.length) {
      c.children.forEach((sub) => flat.push(sub))
    }
  })
  return flat
}

/**
 * slug → columnId 映射查询（V2.0 §5.3.4）
 */
export function mockSlugToId(slug: string): { columnId: number; columnSlug: string; columnName: string } | null {
  const node = flattenColumns().find((c) => c.columnSlug === slug)
  if (!node) return null
  return {
    columnId: node.columnId,
    columnSlug: node.columnSlug,
    columnName: node.columnName,
  }
}

/**
 * columnId → slug 映射查询（V2.0 §5.3.4）
 */
export function mockIdToSlug(columnId: number): { columnId: number; columnSlug: string; columnName: string } | null {
  const node = flattenColumns().find((c) => c.columnId === columnId)
  if (!node) return null
  return {
    columnId: node.columnId,
    columnSlug: node.columnSlug,
    columnName: node.columnName,
  }
}

/**
 * 批量映射（V2.0 §5.3.4）
 * @param type SLUG_TO_ID 或 ID_TO_SLUG
 * @param values 待映射值列表
 */
export function mockBatchMapping(
  type: 'SLUG_TO_ID' | 'ID_TO_SLUG',
  values: (string | number)[],
): Record<string, number | string> {
  const flat = flattenColumns()
  const result: Record<string, number | string> = {}
  if (type === 'SLUG_TO_ID') {
    values.forEach((v) => {
      const s = String(v)
      const node = flat.find((c) => c.columnSlug === s)
      if (node) result[s] = node.columnId
    })
  } else {
    values.forEach((v) => {
      const id = Number(v)
      const node = flat.find((c) => c.columnId === id)
      if (node) result[String(id)] = node.columnSlug
    })
  }
  return result
}

/**
 * 文章列表:对齐前端驼峰字段（API 响应格式）
 * 字段: id, title, content, publishDate, views, isTop, columnId, status, summary, source, tags, isImportant, hasAttachment
 */
export function mockArticlesList(columnSlug?: string, page = 1, pageSize = 10) {
  if (columnSlug) {
    const result = queryList({ columnSlug, page, pageSize })
    return {
      list: result.list.map(toArticleRow),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
  }

  // 无栏目过滤时返回所有文章(合并教学通知+公示公告+列表项)
  const all = [
    ...studentNotices.map((n) => ({ ...n, columnSlug: 'notice-teaching', columnTitle: '教学通知' })),
    ...teacherNotices.map((n) => ({ ...n, columnSlug: 'notice-public', columnTitle: '公示公告' })),
  ].sort((a, b) => {
    const aTop = a.isTop ? 1 : 0
    const bTop = b.isTop ? 1 : 0
    if (aTop !== bTop) return bTop - aTop
    return b.publishDate.localeCompare(a.publishDate)
  })

  const total = all.length
  const start = (page - 1) * pageSize
  const list = all.slice(start, start + pageSize).map((n) => ({
    id: n.id,
    title: n.title,
    publishDate: n.publishDate,
    views: n.views,
    isTop: n.isTop,
    columnId: columns.findIndex((c) => c.slug === n.columnSlug) + 1,
    columnName: n.columnTitle,
    summary: n.summary,
    source: n.source,
  }))

  return { list, total, page, pageSize }
}

function toArticleRow(item: any) {
  return {
    id: item.id,
    title: item.title,
    publishDate: item.publishDate,
    views: item.views,
    isTop: item.isTop,
    columnId: columns.findIndex((c) => c.slug === item.columnSlug) + 1,
    columnName: item.columnTitle,
    summary: item.summary ?? '',
    source: item.source ?? '',
  }
}

/**
 * 文章详情 mock（驼峰字段）
 */
export function mockArticleDetail(id: string | number) {
  const detail = getArticleDetail(Number(id))
  if (!detail) return null
  return {
    id: detail.id,
    title: detail.title,
    content: detail.content,
    publishDate: detail.publishDate,
    views: detail.views,
    isTop: detail.isTop,
    columnId: columns.findIndex((c) => c.slug === detail.columnSlug) + 1,
    columnName: detail.columnTitle,
    summary: detail.summary ?? '',
    source: detail.source ?? '',
    tags: detail.tags,
    isImportant: detail.isImportant,
    hasAttachment: detail.hasAttachment,
    attachments: detail.attachments,
    contact: detail.contact,
    acceptTime: detail.acceptTime,
    supervise: detail.supervise,
    prev: detail.prev,
    next: detail.next,
  }
}

/**
 * Banner 轮播 mock（驼峰字段）
 */
export function mockBanners() {
  return banners.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description ?? '',
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl,
    order: b.order,
  }))
}

/**
 * 新闻列表 mock（驼峰字段）
 */
export function mockNews(page = 1, pageSize = 10) {
  const total = newsList.length
  const start = (page - 1) * pageSize
  const list = newsList.slice(start, start + pageSize).map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary,
    imageUrl: n.imageUrl,
    publishDate: n.publishDate,
    views: n.views,
  }))
  return { list, total, page, pageSize }
}

/**
 * 通知列表 mock(学生/教师，驼峰字段)
 */
export function mockNotices(type: 'student' | 'teacher', page = 1, pageSize = 10) {
  const source = type === 'student' ? studentNotices : teacherNotices
  const total = source.length
  const start = (page - 1) * pageSize
  const list = source.slice(start, start + pageSize).map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.summary,
    publishDate: n.publishDate,
    source: n.source,
    views: n.views,
    tags: n.tags,
    isTop: n.isTop,
    isImportant: n.isImportant,
  }))
  return { list, total, page, pageSize }
}

/**
 * 搜索 mock（驼峰字段）
 */
export function mockSearch(keyword: string) {
  return searchArticles(keyword).map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    publishDate: r.publishDate,
    source: r.source,
    columnSlug: r.columnSlug,
    columnTitle: r.columnTitle,
    url: r.url,
  }))
}

export function mockSearchSuggestions(keyword: string) {
  return getSearchSuggestions(keyword)
}

/**
 * 快速通道 mock
 */
export function mockQuickLinks() {
  return quickLinks
}

/**
 * 常用信息 mock
 */
export function mockCommonInfo() {
  return commonInfo
}

/**
 * 部门领导 mock（驼峰字段）
 */
export function mockDeptLeaders() {
  return deptLeaders.map((l) => ({
    id: l.id,
    name: l.name,
    position: l.title,
    photo: l.avatar,
    intro: l.duty,
    sortOrder: l.id,
  }))
}

/**
 * 部门介绍完整 mock
 */
export function mockDeptIntro() {
  return {
    brief: deptIntro.brief,
    history: deptIntro.history,
    leaders: deptLeaders,
    divisions: businessDivisions,
    duties: mainDuties,
    contact: deptContact,
  }
}

/**
 * 课程表 mock
 */
export function mockClassSchedule() {
  return classSchedule
}

/**
 * 校历 mock
 */
export function mockSchoolCalendar() {
  return schoolCalendar
}

/**
 * 班车 mock
 */
export function mockBusSchedule() {
  return busSchedule
}

/**
 * 下载中心 mock
 */
export function mockDownloads(category?: string, page = 1, pageSize = 20) {
  let filtered = [...downloadFiles]
  if (category && category !== 'all') {
    filtered = filtered.filter((f) => f.category === category)
  }
  const total = filtered.length
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)
  return { list, total, page, pageSize, categories: downloadCategories }
}

/**
 * 用户中心 mock
 */
export function mockUserProfile() {
  return userProfile
}

export function mockUserMessages() {
  return userMessages
}

export function mockUserFavorites() {
  return userFavorites
}

export function mockUserHistory() {
  return userHistory
}

/**
 * 用户反馈记录 mock
 */
export function mockUserFeedback() {
  return userFeedback
}

/**
 * 用户订阅设置 mock
 */
export function mockUserSubscriptions() {
  return userSubscriptions
}

/**
 * 热门搜索词 mock
 */
export function mockHotKeywords() {
  return hotKeywords
}

/**
 * 教学反馈 mock
 */
export function mockFeedbackTypes() {
  return feedbackTypes
}

export function mockFeedbackList() {
  return feedbackList
}

/**
 * 信息公开 mock
 */
export function mockDisclosureDirectory() {
  return disclosureDirectory
}

export function mockDisclosureReport() {
  return disclosureReport
}

/**
 * 站点地图 mock
 */
export function mockSitemap() {
  return sitemapData
}

/**
 * 热门/推荐文章 mock
 */
export function mockHotArticles() {
  return hotArticles
}

export function mockRecommendArticles() {
  return recommendArticles
}

/**
 * 列表页筛选选项
 */
export function mockFilterOptions(columnSlug: string) {
  return getFilterOptions(columnSlug)
}

/**
 * 课程建设分区
 */
export function mockCourseConstruction() {
  return courseConstruction
}

/**
 * 投诉举报方式
 */
export function mockReportInfo() {
  return reportInfo
}

/**
 * 信息公开入口
 */
export function mockDisclosureLinks() {
  return disclosureLinks
}

/**
 * 部门电话
 */
export function mockDepartmentPhones() {
  return departmentPhones
}

// ========== 办事指南 Mock ==========
const mockGuideItems = [
  {
    id: 1,
    title: '学生转学办理',
    columnSlug: 'student-affairs',
    target: '在校学生',
    process: ['提交申请', '院系审核', '学籍办公室审批', '办理完成'],
    materials: ['转学申请表', '本人身份证', '原学校成绩单'],
    duration: '5-10个工作日',
    contactDept: '教务处学籍科',
    contactPhone: '0571-88888888',
    attachments: [],
  },
  {
    id: 2,
    title: '教师职称评审',
    columnSlug: 'teacher-affairs',
    target: '在职教师',
    process: ['个人申报', '院系评审', '学校评审', '公示', '发证'],
    materials: ['申报表', '科研成果', '教学评价'],
    duration: '30-60个工作日',
    contactDept: '人事处',
    contactPhone: '0571-88888889',
    attachments: [],
  },
  {
    id: 3,
    title: '新生报到注册',
    columnSlug: 'student-affairs',
    target: '新生',
    process: ['线上预约', '到校核验', '缴纳学费', '领取教材', '宿舍入住'],
    materials: ['录取通知书', '身份证', '照片'],
    duration: '1-3个工作日',
    contactDept: '学生工作处',
    contactPhone: '0571-88888890',
    attachments: [],
  },
]

export function mockGuideList(slug?: string) {
  const list = slug ? mockGuideItems.filter((g) => g.columnSlug === slug) : mockGuideItems
  return {
    list,
    total: list.length,
  }
}

// 重新导出原始查询函数,供高级路由使用
export { queryList, getFilterOptions }
