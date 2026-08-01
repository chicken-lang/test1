/**
 * V2.0 前后端字段映射中间层
 * 
 * 职责:
 * - 双向映射: V2.0 标准字段 ↔ 旧兼容字段
 * - 处理日期格式转换 (ISO ↔ YYYY-MM-DD)
 * - 处理字符串→数组转换 (tags, businessTags)
 * - 提供默认值 (防止 undefined 导致渲染错误)
 */

// ============================================================
// v2FieldMappings 配置对象
// ============================================================

export const v2FieldMappings = {
  frontendToBackend: {
    id: 'articleId',
    publishDate: 'publishedAt',
    views: 'viewCount',
    columnTitle: 'columnName',
    coverImage: 'coverImageUrl',
    docNumber: 'documentNumber',
  },
  backendToFrontend: {
    articleId: 'id',
    publishedAt: 'publishDate',
    viewCount: 'views',
    columnName: 'columnTitle',
    coverImageUrl: 'coverImage',
    documentNumber: 'docNumber',
  },
  fieldMap: {
    id: 'articleId',
    publishDate: 'publishedAt',
    views: 'viewCount',
    columnTitle: 'columnName',
    coverImage: 'coverImageUrl',
    docNumber: 'documentNumber',
  },
  types: ['article', 'articleDetail', 'listItem', 'banner', 'guide', 'column', 'columnTree'] as const,
}

export type MapType = (typeof v2FieldMappings.types)[number] | 'attachment' | 'searchResult'

// ============================================================
// 双向映射规则表 (旧 ↔ 新)
// ============================================================

// 每个规则: [旧字段, 新字段]
const BIDIR_RULES: Record<string, [string, string][]> = {
  article: [
    ['id', 'articleId'],
    ['publishDate', 'publishedAt'],
    ['views', 'viewCount'],
    ['columnTitle', 'columnName'],
    ['coverUrl', 'coverImageUrl'],
    ['coverImage', 'coverImageUrl'],
    ['docNumber', 'documentNumber'],
  ],
  articleDetail: [
    ['id', 'articleId'],
    ['publishDate', 'publishedAt'],
    ['views', 'viewCount'],
    ['columnTitle', 'columnName'],
    ['coverUrl', 'coverImageUrl'],
    ['coverImage', 'coverImageUrl'],
    ['docNumber', 'documentNumber'],
  ],
  listItem: [
    ['id', 'articleId'],
    ['publishDate', 'publishedAt'],
    ['views', 'viewCount'],
    ['columnTitle', 'columnName'],
    ['coverUrl', 'coverImageUrl'],
    ['coverImage', 'coverImageUrl'],
  ],
  banner: [],
  guide: [],
  attachment: [
    ['downloads', 'downloadCount'],
    ['path', 'url'],
  ],
  searchResult: [
    ['id', 'articleId'],
    ['publishDate', 'publishedAt'],
    ['columnTitle', 'columnName'],
  ],
  column: [
    ['id', 'id'],
    ['slug', 'slug'],
    ['title', 'title'],
    ['parentId', 'parentId'],
    ['listStyle', 'listStyle'],
    ['order', 'order'],
    ['articleCount', 'articleCount'],
    ['icon', 'icon'],
  ],
  columnTree: [
    ['id', 'id'],
    ['parentId', 'parentId'],
    ['name', 'name'],
    ['code', 'code'],
    ['sortOrder', 'sortOrder'],
    ['icon', 'icon'],
    ['status', 'status'],
  ],
}

// ============================================================
// 通用工具函数
// ============================================================

/** 将值包装为数组 (如果是字符串) */
function ensureArray(value: any): any[] {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return value ? [value] : []
  return [value]
}

/** 标准化日期: string/Date/null → ISO 字符串 */
function normalizeDate(value: any): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') {
    if (value.includes('T')) return value
    return `${value}T00:00:00.000Z`
  }
  return String(value)
}

// ============================================================
// mapBackendToFrontend - 后端 V2.0 → 前端
// ============================================================

export function mapBackendToFrontend<T extends Record<string, any>>(
  data: T | null | undefined,
  type: string,
): T & Record<string, any> | null | undefined {
  if (data === null || data === undefined) return data

  const rules = BIDIR_RULES[type] || []
  const result: Record<string, any> = { ...data }

  // 双向映射: 旧字段 → 新字段, 新字段 → 旧字段 (互相补全)
  for (const [oldField, newField] of rules) {
    // 如果有旧字段, 设置新字段
    if (data[oldField] !== undefined && data[oldField] !== null) {
      result[newField] = data[oldField]
    }
    // 如果有新字段, 设置旧字段 (保持向后兼容)
    if (data[newField] !== undefined && data[newField] !== null) {
      result[oldField] = data[newField]
    }
  }

  // ---- article / articleDetail 默认值 ----
  if (type === 'article' || type === 'articleDetail') {
    if (result.title === undefined) result.title = ''
    if (result.summary === undefined) result.summary = ''
    if (result.source === undefined) result.source = ''
    if (result.columnSlug === undefined) result.columnSlug = ''
    if (result.isTop === undefined) result.isTop = false
    if (result.isImportant === undefined) result.isImportant = false
    if (result.hasAttachment === undefined) result.hasAttachment = false
    if (result.articleSlug === undefined) result.articleSlug = ''
    if (result.tags === undefined) result.tags = []

    if (type === 'articleDetail') {
      if (result.attachments === undefined) result.attachments = []
      if (result.prev === undefined) result.prev = null
      if (result.next === undefined) result.next = null
      if (result.author === undefined) result.author = ''
      if (result.authorId === undefined) result.authorId = ''
      if (result.contact === undefined) result.contact = ''
      if (result.content === undefined) result.content = ''
      if (result.visibility === undefined) result.visibility = 'PUBLIC'
    }
  }

  // ---- listItem: tags/businessTags 字符串 → 数组 ----
  if (type === 'listItem') {
    if (result.tags !== undefined) result.tags = ensureArray(result.tags)
    else result.tags = []
    if (result.businessTags !== undefined) result.businessTags = ensureArray(result.businessTags)
    else result.businessTags = []
  }

  // ---- banner 默认值 + 日期标准化 ----
  if (type === 'banner') {
    if (result.id === undefined) result.id = 0
    if (result.title === undefined) result.title = ''
    if (result.subtitle === undefined) result.subtitle = ''
    if (result.description === undefined) result.description = ''
    if (result.imageUrl === undefined) result.imageUrl = ''
    if (result.linkUrl === undefined) result.linkUrl = ''
    if (result.linkText === undefined) result.linkText = ''
    if (result.order === undefined) result.order = 0
    if (result.startDate === undefined) result.startDate = ''
    if (result.endDate === undefined) result.endDate = ''
    // 日期标准化
    if (result.startDate) result.startDate = normalizeDate(result.startDate)
    if (result.endDate) result.endDate = normalizeDate(result.endDate)
  }

  // ---- guide: 字符串 → 数组 ----
  if (type === 'guide') {
    if (result.process !== undefined) result.process = ensureArray(result.process)
    else result.process = []
    if (result.materials !== undefined) result.materials = ensureArray(result.materials)
    else result.materials = []
  }

  // ---- column 默认值 ----
  if (type === 'column') {
    if (result.id === undefined) result.id = 0
    if (result.slug === undefined) result.slug = ''
    if (result.title === undefined) result.title = ''
    if (result.parentId === undefined) result.parentId = null
    if (result.listStyle === undefined) result.listStyle = 'card'
    if (result.order === undefined) result.order = 0
    if (result.articleCount === undefined) result.articleCount = 0
    if (result.icon === undefined) result.icon = null
  }

  // ---- columnTree 默认值 ----
  if (type === 'columnTree') {
    if (result.id === undefined) result.id = 0
    if (result.parentId === undefined) result.parentId = null
    if (result.name === undefined) result.name = ''
    if (result.code === undefined) result.code = ''
    if (result.sortOrder === undefined) result.sortOrder = 0
    if (result.icon === undefined) result.icon = null
    if (result.status === undefined) result.status = 1
    if (result.children === undefined) result.children = []
  }

  return result as T & Record<string, any>
}

// ============================================================
// mapFrontendToBackend - 前端 → 后端 V2.0
// ============================================================

export function mapFrontendToBackend<T extends Record<string, any>>(
  data: T | null | undefined,
  type: string,
): T & Record<string, any> | null | undefined {
  if (data === null || data === undefined) return data

  const rules = BIDIR_RULES[type] || BIDIR_RULES['article'] || []
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    // 查找旧→新映射: 如果 key 是旧字段, 转换为新字段
    const match = rules.find(([oldField]) => oldField === key)
    if (match) {
      result[match[1]] = value
    } else {
      result[key] = value
    }
  }

  // 默认值
  if (type === 'article' || type === 'articleDetail') {
    if (result.title === undefined) result.title = ''
    if (result.summary === undefined) result.summary = ''
    if (result.source === undefined) result.source = ''
    if (result.columnSlug === undefined) result.columnSlug = ''
    if (result.isTop === undefined) result.isTop = false
    if (result.isImportant === undefined) result.isImportant = false
    if (result.hasAttachment === undefined) result.hasAttachment = false
    if (result.tags === undefined) result.tags = []
    if (type === 'articleDetail') {
      if (result.attachments === undefined) result.attachments = []
      if (result.prev === undefined) result.prev = null
      if (result.next === undefined) result.next = null
    }
  }

  return result as T & Record<string, any>
}

// ============================================================
// 批量映射
// ============================================================

export function mapBackendListToFrontend<T extends Record<string, any>>(
  list: T[] | null | undefined,
  type: string,
): T[] {
  if (!Array.isArray(list)) return []
  return list.map(item => mapBackendToFrontend(item, type)) as T[]
}

// ============================================================
// mapArticleRow - 单条文章行映射
// ============================================================

export function mapArticleRow(row: any | null | undefined): any {
  if (row === null || row === undefined) return row

  const result: Record<string, any> = { ...row }

  // 单向映射: 旧字段 → 新字段, 并删除旧字段
  const bidirRules: [string, string][] = [
    ['id', 'articleId'],
    ['publishDate', 'publishedAt'],
    ['views', 'viewCount'],
    ['columnTitle', 'columnName'],
    ['coverUrl', 'coverImageUrl'],
    ['coverImage', 'coverImageUrl'],
    ['docNumber', 'documentNumber'],
  ]

  for (const [oldField, newField] of bidirRules) {
    if (row[oldField] !== undefined && row[oldField] !== null) {
      result[newField] = row[oldField]
      delete result[oldField] // 删除旧字段
    }
  }

  // 默认值
  if (result.title === undefined) result.title = ''
  if (result.summary === undefined) result.summary = ''
  if (result.publishedAt === undefined) result.publishedAt = ''
  if (result.source === undefined) result.source = ''
  if (result.viewCount === undefined) result.viewCount = 0
  if (result.columnSlug === undefined) result.columnSlug = ''
  if (result.columnName === undefined) result.columnName = ''
  if (result.isTop === undefined) result.isTop = false
  if (result.isImportant === undefined) result.isImportant = false
  if (result.hasAttachment === undefined) result.hasAttachment = false
  if (result.coverImageUrl === undefined) result.coverImageUrl = null
  if (result.articleSlug === undefined) result.articleSlug = ''
  if (result.tags === undefined) result.tags = []
  if (result.businessTags === undefined) result.businessTags = []
  if (result.documentNumber === undefined) result.documentNumber = ''
  if (result.authorId === undefined) result.authorId = ''
  if (result.content === undefined) result.content = ''
  if (result.attachments === undefined) result.attachments = []
  if (result.author === undefined) result.author = ''
  if (result.contact === undefined) result.contact = ''
  if (result.prev === undefined) result.prev = null
  if (result.next === undefined) result.next = null
  if (result.visibility === undefined) result.visibility = 'PUBLIC'

  // 日期标准化
  if (typeof result.publishedAt === 'string' && result.publishedAt && !result.publishedAt.includes('T')) {
    result.publishedAt = normalizeDate(result.publishedAt)
  }

  // 字符串 → 数组
  if (typeof result.tags === 'string') result.tags = result.tags ? [result.tags] : []
  if (typeof result.businessTags === 'string') result.businessTags = result.businessTags ? [result.businessTags] : []

  return result
}

// ============================================================
// mapArticleList - 批量文章行映射
// ============================================================

export function mapArticleList(rows: any[] | null | undefined): any[] {
  if (!Array.isArray(rows)) return []
  return rows.map(row => mapArticleRow(row))
}

// ============================================================
// mapGuideItem - 办事指南映射
// ============================================================

export function mapGuideItem(item: any | null | undefined): any {
  if (item === null || item === undefined) return item

  const result: Record<string, any> = { ...item }

  // 默认值
  if (result.id === undefined) result.id = 0
  if (result.title === undefined) result.title = ''
  if (result.columnSlug === undefined) result.columnSlug = ''
  if (result.target === undefined) result.target = ''
  if (result.process === undefined) result.process = []
  if (result.materials === undefined) result.materials = []
  if (result.duration === undefined) result.duration = ''
  if (result.contactDept === undefined) result.contactDept = ''
  if (result.contactPhone === undefined) result.contactPhone = ''
  if (result.attachments === undefined) result.attachments = []

  // 字符串 → 数组
  if (typeof result.process === 'string') result.process = result.process ? [result.process] : []
  if (typeof result.materials === 'string') result.materials = result.materials ? [result.materials] : []
  if (typeof result.attachments === 'string') result.attachments = result.attachments ? [result.attachments] : []

  return result
}

// ============================================================
// mapBanner - Banner 映射
// ============================================================

export function mapBanner(item: any | null | undefined): any {
  if (item === null || item === undefined) return item

  const result: Record<string, any> = { ...item }

  // 默认值
  if (result.id === undefined) result.id = 0
  if (result.title === undefined) result.title = ''
  if (result.subtitle === undefined) result.subtitle = ''
  if (result.description === undefined) result.description = ''
  if (result.imageUrl === undefined) result.imageUrl = ''
  if (result.linkUrl === undefined) result.linkUrl = ''
  if (result.linkText === undefined) result.linkText = ''
  if (result.order === undefined) result.order = 0
  if (result.startDate === undefined) result.startDate = ''
  if (result.endDate === undefined) result.endDate = ''

  // 日期标准化 (null → '')
  if (result.startDate === null) result.startDate = ''
  if (result.endDate === null) result.endDate = ''

  if (result.startDate) result.startDate = normalizeDate(result.startDate)
  if (result.endDate) result.endDate = normalizeDate(result.endDate)

  return result
}

// ============================================================
// 便捷函数
// ============================================================

/** 批量映射办事指南列表 */
export function mapGuideList(list: any[]): any[] {
  if (!Array.isArray(list)) return []
  return list.map(item => mapGuideItem(item))
}