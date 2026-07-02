/**
 * Mock 数据 - 前端开发阶段模拟后端 API 响应
 * 后端 API 就绪后,将 useApi composable 切换为真实请求即可
 */

// ========== 文章/通知类型 ==========
export interface Article {
  id: number
  title: string
  summary: string
  publishDate: string
  source: string
  views: number
  tags: string[]
  isTop?: boolean
  isImportant?: boolean
  url?: string
}

export interface Banner {
  id: number
  title: string
  subtitle?: string
  // 副标题/摘要(浮层展示),对应 API 文档 Banner.description
  description?: string
  imageUrl: string
  linkUrl: string
  linkText?: string
  order: number
  startDate?: string
  endDate?: string
}

export interface QuickLink {
  id: number
  title: string
  url: string
  icon: string
  description?: string
  target?: '_self' | '_blank'
  order: number
  // 前端扩展:分组标签(后端不返回,前端用于 QuickLink 分区展示)
  category: string
}

export interface NewsItem {
  id: number
  title: string
  summary: string
  imageUrl: string
  publishDate: string
  views: number
}

// ========== Banner 轮播(FR-01.02) ==========
export const banners: Banner[] = [
  {
    id: 1,
    title: '2026年春季学期教学工作会议顺利召开',
    description: '总结春季学期教学工作成果,部署下阶段教学改革重点任务,推动人才培养质量持续提升。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20campus%20teaching%20conference%20banner%20blue%20academic%20building%20spring%20semester&image_size=landscape_16_9',
    linkUrl: '/article/1',
    order: 1,
  },
  {
    id: 2,
    title: '我校获批省级一流本科专业建设点',
    description: '深化专业内涵建设,打造高水平专业群,我校3个专业获批省级一流本科专业建设点。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20professional%20construction%20achievement%20ceremony%20banner%20blue%20gold%20medal&image_size=landscape_16_9',
    linkUrl: '/article/2',
    order: 2,
  },
  {
    id: 3,
    title: '教务处智慧教学平台正式上线',
    description: '集成课程管理、教学评价、资源共享、数据分析于一体的智慧教学平台全面启用。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20classroom%20technology%20education%20platform%20digital%20teaching%20blue%20modern&image_size=landscape_16_9',
    linkUrl: '/article/3',
    order: 3,
  },
]

// ========== 学生通知(FR-01.03) ==========
export const studentNotices: Article[] = [
  {
    id: 101,
    title: '关于2026年春季学期选课工作的通知',
    summary: '各学院、各位同学:2026年春季学期选课工作即将开始,请按时完成选课。',
    publishDate: '2026-06-28',
    source: '教务科',
    views: 1280,
    tags: ['选课', '通知'],
    isTop: true,
    isImportant: true,
  },
  {
    id: 102,
    title: '关于2026届毕业生毕业资格审查的通知',
    summary: '2026届毕业生毕业资格审查工作启动,请各学院按要求提交材料。',
    publishDate: '2026-06-25',
    source: '学籍科',
    views: 980,
    tags: ['毕业', '资格审查'],
    isImportant: true,
  },
  {
    id: 103,
    title: '关于2026年大学英语四六级考试报名的通知',
    summary: '2026年上半年大学英语四六级考试报名工作即将开始。',
    publishDate: '2026-06-22',
    source: '考试科',
    views: 2150,
    tags: ['四六级', '考试报名'],
  },
  {
    id: 104,
    title: '关于2026年春季学期期末考试安排的通知',
    summary: '2026年春季学期期末考试时间安排已发布,请查阅考试日程表。',
    publishDate: '2026-06-20',
    source: '考试科',
    views: 3200,
    tags: ['期末考试', '考试安排'],
    isImportant: true,
  },
  {
    id: 105,
    title: '关于办理2026届毕业生学位证书的通知',
    summary: '2026届毕业生学位证书发放事宜,请毕业生关注领取时间及地点。',
    publishDate: '2026-06-18',
    source: '学籍科',
    views: 870,
    tags: ['学位证书', '毕业'],
  },
  {
    id: 106,
    title: '关于学生成绩复核申请的通知',
    summary: '成绩复核申请通道已开放,如有异议请在规定时间内提交申请。',
    publishDate: '2026-06-15',
    source: '教务科',
    views: 650,
    tags: ['成绩复核'],
  },
]

// ========== 教师通知(FR-01.03) ==========
export const teacherNotices: Article[] = [
  {
    id: 201,
    title: '关于2026年春季学期教学工作量统计的通知',
    summary: '请各位教师核对本人教学工作量,如有异议及时反馈。',
    publishDate: '2026-06-27',
    source: '教学科',
    views: 560,
    tags: ['工作量', '统计'],
    isTop: true,
    isImportant: true,
  },
  {
    id: 202,
    title: '关于开展2026年校级教学成果奖评选的通知',
    summary: '2026年校级教学成果奖评选工作启动,欢迎教师积极申报。',
    publishDate: '2026-06-24',
    source: '教研科',
    views: 420,
    tags: ['教学成果奖', '评选'],
    isImportant: true,
  },
  {
    id: 203,
    title: '关于提交期末考试试卷的通知',
    summary: '请各位教师按模板提交期末考试试卷,截止时间7月10日。',
    publishDate: '2026-06-21',
    source: '考试科',
    views: 380,
    tags: ['期末考试', '试卷'],
  },
  {
    id: 204,
    title: '关于2026年教师教学能力大赛报名的通知',
    summary: '2026年教师教学能力大赛报名启动,请有意向的教师踊跃参加。',
    publishDate: '2026-06-19',
    source: '教研科',
    views: 310,
    tags: ['教学能力大赛', '报名'],
  },
  {
    id: 205,
    title: '关于课程教学大纲修订的通知',
    summary: '根据新版培养方案,请各课程负责人完成教学大纲修订工作。',
    publishDate: '2026-06-16',
    source: '教学科',
    views: 290,
    tags: ['教学大纲', '修订'],
  },
  {
    id: 206,
    title: '关于2026年春季学期教学检查的通知',
    summary: '本学期教学检查工作安排,请各学院配合做好自查工作。',
    publishDate: '2026-06-12',
    source: '教学科',
    views: 240,
    tags: ['教学检查'],
  },
]

// ========== 新闻资讯(FR-01.04) ==========
export const newsList: NewsItem[] = [
  {
    id: 301,
    title: '我校成功举办2026年教学创新大赛',
    summary: '6月25日,我校2026年教学创新大赛决赛在学校报告厅圆满落幕,共评出一等奖5项。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=teaching%20innovation%20competition%20university%20award%20ceremony%20teachers%20stage&image_size=landscape_4_3',
    publishDate: '2026-06-26',
    views: 1500,
  },
  {
    id: 302,
    title: '教务处组织召开专业建设研讨会',
    summary: '6月20日,教务处组织召开专业建设研讨会,就高水平专业群建设进行深入交流。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=academic%20professional%20construction%20seminar%20meeting%20room%20university&image_size=landscape_4_3',
    publishDate: '2026-06-21',
    views: 890,
  },
  {
    id: 303,
    title: '我校新增3个省级一流课程',
    summary: '省教育厅公布2026年省级一流课程名单,我校3门课程成功入选。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=excellent%20course%20certificate%20education%20achievement%20gold%20blue%20document&image_size=landscape_4_3',
    publishDate: '2026-06-18',
    views: 1200,
  },
  {
    id: 304,
    title: '教务处开展智慧教室使用培训',
    summary: '为提升教师信息化教学能力,教务处组织开展智慧教室使用专项培训。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20classroom%20teacher%20training%20technology%20screen%20education%20modern&image_size=landscape_4_3',
    publishDate: '2026-06-15',
    views: 670,
  },
]

// ========== 快速通道(FR-01.05, FR-17) ==========
export const quickLinks: QuickLink[] = [
  { id: 1, title: '教务管理系统', url: '#', icon: 'mdi:school', category: '教学', order: 1, target: '_blank' },
  { id: 2, title: '成绩查询', url: '#', icon: 'mdi:clipboard-text', category: '学生', order: 2, target: '_blank' },
  { id: 3, title: '选课系统', url: '#', icon: 'mdi:book-open-variant', category: '学生', order: 3, target: '_blank' },
  { id: 4, title: '课表查询', url: '#', icon: 'mdi:calendar-clock', category: '学生', order: 4, target: '_blank' },
  { id: 5, title: '考试报名', url: '#', icon: 'mdi:file-document-edit', category: '考试', order: 5, target: '_blank' },
  { id: 6, title: '教学评价', url: '#', icon: 'mdi:star', category: '评价', order: 6, target: '_blank' },
  { id: 7, title: '教材管理', url: '#', icon: 'mdi:book', category: '教材', order: 7, target: '_blank' },
  { id: 8, title: '毕业论文', url: '#', icon: 'mdi:file-pdf', category: '毕业', order: 8, target: '_blank' },
  { id: 9, title: '实习管理', url: '#', icon: 'mdi:briefcase', category: '实践', order: 9, target: '_blank' },
  { id: 10, title: '学籍证明', url: '#', icon: 'mdi:certificate', category: '学生', order: 10, target: '_blank' },
  { id: 11, title: '教学平台', url: '#', icon: 'mdi:monitor', category: '教学', order: 11, target: '_blank' },
  { id: 12, title: '教室预约', url: '#', icon: 'mdi:door', category: '教室', order: 12, target: '_blank' },
]

// ========== 常用信息(FR-01.07) ==========
export const commonInfo = [
  { title: '校历安排', url: '/calendar', icon: 'mdi:calendar-month' },
  { title: '作息时间', url: '/calendar', icon: 'mdi:clock-outline' },
  { title: '班车时刻', url: '/calendar', icon: 'mdi:bus' },
  { title: '校园地图', url: '/calendar', icon: 'mdi:map' },
  { title: '部门电话', url: '/calendar', icon: 'mdi:phone-classic' },
  { title: '教学管理人员', url: '/about', icon: 'mdi:account-group' },
]

// ========== 课程建设分区(FR-01.06) ==========
export const courseConstruction = [
  { title: '国家级课程', count: 5, url: '/list/research', color: '#f5222d' },
  { title: '省级课程', count: 18, url: '/list/research', color: '#faad14' },
  { title: '校级课程', count: 62, url: '/list/research', color: '#52c41a' },
  { title: '在线开放课程', count: 35, url: '/list/research', color: '#005bac' },
]

// ========== 投诉举报方式(FR-01.08) ==========
export const reportInfo = [
  { label: '电话', value: '0755-89226666' },
  { label: '邮箱', value: 'jwc-jb@sziit.edu.cn' },
  { label: '地址', value: '教务处办公室(行政楼3楼)' },
  { label: '在线', value: '教学反馈系统' },
]

// ========== 信息公开入口(FR-01.09) ==========
export const disclosureLinks = [
  { title: '信息公开目录', url: '/disclosure' },
  { title: '信息公开指南', url: '/disclosure/guide' },
  { title: '信息公开年报', url: '/disclosure/report' },
  { title: '信息公开申请', url: '/disclosure/apply' },
]

// ====================================================================
// T4.2 列表页通用模板 Mock 数据
// ====================================================================

// 栏目结构(用于侧边栏导航 + 面包屑)
export interface ColumnCategory {
  slug: string
  title: string
  icon?: string
  description?: string
  // 父栏目 slug,顶层为 null(对应 API 文档 parentId)
  parentId: string | null
  order: number
  articleCount: number
  children?: ColumnCategory[]
  // 前端扩展:列表展示样式 card 卡片 / table 表格 / compact 紧凑(后端不返回)
  listStyle: 'card' | 'table' | 'compact'
}

// 列表项(支持置顶/加红/标签/年度/月份筛选)
// 对应 API 文档 ArticleListItem,补充 year/month/url 前端辅助字段
export interface ListItem {
  id: number
  title: string
  summary: string
  publishDate: string
  // 年度,由 publishDate 派生,冗余存储便于筛选(前端扩展)
  year: number
  // 月份 1-12,由 publishDate 派生(前端扩展)
  month: number
  source: string
  views: number
  tags: string[]
  columnSlug: string
  columnTitle: string
  isTop: boolean
  isImportant: boolean
  hasAttachment: boolean
  coverUrl?: string
  // 详情页链接(前端扩展)
  url: string
}

// 侧边栏热门/推荐项(轻量)
export interface SideItem {
  id: number
  title: string
  publishDate: string
  views: number
  url: string
}

// ========== 栏目树(对应主导航 16 项中的内容栏目) ==========
export const columns: ColumnCategory[] = [
  { slug: 'regulations', title: '规章制度', parentId: null, listStyle: 'table', order: 1, articleCount: 28 },
  { slug: 'notices', title: '通知公告', parentId: null, listStyle: 'table', order: 2, articleCount: 156 },
  { slug: 'student-notices', title: '学生通知', parentId: 'notices', listStyle: 'table', order: 1, articleCount: 89 },
  { slug: 'teacher-notices', title: '教师通知', parentId: 'notices', listStyle: 'table', order: 2, articleCount: 67 },
  { slug: 'academic', title: '教务管理', parentId: null, listStyle: 'card', order: 3, articleCount: 45 },
  { slug: 'practice', title: '实践教学', parentId: null, listStyle: 'card', order: 4, articleCount: 32 },
  { slug: 'major', title: '专业建设', parentId: null, listStyle: 'card', order: 5, articleCount: 18 },
  { slug: 'research', title: '教研教改', parentId: null, listStyle: 'card', order: 6, articleCount: 24 },
  { slug: 'competition', title: '技能竞赛', parentId: null, listStyle: 'card', order: 7, articleCount: 12 },
  { slug: 'honor', title: '教学荣誉', parentId: null, listStyle: 'card', order: 8, articleCount: 15 },
  { slug: 'classroom', title: '智慧教室', parentId: null, listStyle: 'compact', order: 9, articleCount: 8 },
  { slug: 'project', title: '项目指南', parentId: null, listStyle: 'compact', order: 10, articleCount: 10 },
  { slug: 'download', title: '下载中心', parentId: null, listStyle: 'table', order: 11, articleCount: 12 },
  { slug: 'feedback', title: '教学反馈', parentId: null, listStyle: 'compact', order: 12, articleCount: 0 },
  { slug: 'guide', title: '办事指南', parentId: null, listStyle: 'compact', order: 13, articleCount: 6 },
]

// ========== 列表项数据池(模拟各栏目文章) ==========
// 说明: 为支持分页与筛选验证,每个栏目生成足够数量的条目
const tagPool = [
  '通知',
  '公告',
  '报名',
  '考试',
  '选课',
  '毕业',
  '成绩',
  '教学',
  '实践',
  '竞赛',
  '荣誉',
  '教室',
  '项目',
  '下载',
  '反馈',
  '指南',
]
const sourcePool = ['教务科', '学籍科', '考试科', '教学科', '教研科', '实践科', '综合科']

// 生成确定性的列表项(避免随机导致 SSR/CSR 不一致)
function buildListItems(): ListItem[] {
  const items: ListItem[] = []
  const columnsToFill = columns.filter((c) => c.parentId === null)
  let id = 1000
  columnsToFill.forEach((col) => {
    // 每个栏目生成 28 条,覆盖 2024-2026 三个年度,便于分页与筛选验证
    for (let i = 0; i < 28; i++) {
      const year = 2024 + (i % 3)
      const month = (i % 12) + 1
      const day = ((i * 7) % 27) + 1
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const tag1 = tagPool[(i + col.order) % tagPool.length]
      const tag2 = tagPool[(i * 3 + col.order) % tagPool.length]
      items.push({
        id: id++,
        title: `${col.title}·${year}年第${i + 1}号关于${tag1}工作的通知`,
        summary: `本通知为${col.title}栏目第${i + 1}条内容,涉及${tag1}与${tag2}相关事宜,请相关师生关注并按要求执行。`,
        publishDate: dateStr,
        year,
        month,
        source: sourcePool[i % sourcePool.length],
        views: 1000 - i * 15 + col.order * 10,
        tags: Array.from(new Set([tag1, tag2])),
        columnSlug: col.slug,
        columnTitle: col.title,
        isTop: i < 2,
        isImportant: i % 5 === 0,
        hasAttachment: i % 3 === 0,
        url: `/article/${id}`,
      })
    }
  })
  return items
}

const allListItems: ListItem[] = buildListItems()

// 列表查询参数
export interface ListQuery {
  columnSlug: string
  page: number
  pageSize: number
  year?: number
  month?: number
  tag?: string
}

// 列表查询结果(分页)
export interface ListResult {
  list: ListItem[]
  total: number
  page: number
  pageSize: number
}

// 模拟后端分页+筛选查询(同步,前端直接调用)
// 筛选规则: 年度/月份/标签组合,置顶优先排序,重要置红由样式控制
export function queryList(query: ListQuery): ListResult {
  let filtered = allListItems.filter((it) => it.columnSlug === query.columnSlug)
  if (query.year) filtered = filtered.filter((it) => it.year === query.year)
  if (query.month) filtered = filtered.filter((it) => it.month === query.month)
  if (query.tag) filtered = filtered.filter((it) => it.tags.includes(query.tag as string))

  // 排序: 置顶在前,其次按发布日期倒序
  filtered = filtered.sort((a, b) => {
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    return b.publishDate.localeCompare(a.publishDate)
  })

  const total = filtered.length
  const start = (query.page - 1) * query.pageSize
  const list = filtered.slice(start, start + query.pageSize)
  return { list, total, page: query.page, pageSize: query.pageSize }
}

// 筛选选项(根据栏目动态生成)
export function getFilterOptions(columnSlug: string) {
  const items = allListItems.filter((it) => it.columnSlug === columnSlug)
  const years = Array.from(new Set(items.map((it) => it.year))).sort((a, b) => b - a)
  const tags = Array.from(new Set(items.flatMap((it) => it.tags)))
  return { years, tags }
}

// 侧边栏热门(按浏览量取前 8)
export const hotArticles: SideItem[] = [...allListItems]
  .sort((a, b) => b.views - a.views)
  .slice(0, 8)
  .map((it) => ({
    id: it.id,
    title: it.title,
    publishDate: it.publishDate,
    views: it.views,
    url: it.url,
  }))

// 侧边栏推荐(取重要标记前 6)
export const recommendArticles: SideItem[] = allListItems
  .filter((it) => it.isImportant)
  .slice(0, 6)
  .map((it) => ({
    id: it.id,
    title: it.title,
    publishDate: it.publishDate,
    views: it.views,
    url: it.url,
  }))

// ====================================================================
// T4.3 文章详情 Mock 数据
// ====================================================================

// 附件
export interface Attachment {
  id: number
  name: string
  size: string
  // 文件扩展名(用于图标)
  ext: string
  downloads: number
  url: string
}

// 文章详情(完整版,含正文/附件/上下篇)
// 对应 API 文档 ArticleDetail extends ArticleListItem
export interface ArticleDetail {
  id: number
  title: string
  subtitle?: string
  publishDate: string
  source: string
  author?: string
  views: number
  tags: string[]
  isTop: boolean
  isImportant: boolean
  hasAttachment: boolean
  coverUrl?: string
  // 富文本正文(HTML)
  content: string
  attachments: Attachment[]
  // 联系人/受理时间/监督渠道(办事类文章)
  contact?: string
  acceptTime?: string
  supervise?: string
  // 所属栏目
  columnSlug: string
  columnTitle: string
  // 上一篇/下一篇
  prev?: { id: number; title: string }
  next?: { id: number; title: string }
}

// 汇总所有文章(用于详情页查询 + 搜索)
type ArticleRef = { id: number; title: string; summary: string; publishDate: string; source: string; views: number; tags: string[]; isTop: boolean; isImportant: boolean; hasAttachment: boolean; columnSlug: string; columnTitle: string }

function buildArticleRefList(): ArticleRef[] {
  const refs: ArticleRef[] = []
  // Banner 文章
  banners.forEach((b) =>
    refs.push({ id: b.id, title: b.title, summary: b.description || '', publishDate: '2026-06-28', source: '教务处', views: 1280, tags: ['教务动态'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'academic', columnTitle: '教务管理' }),
  )
  // 学生通知
  studentNotices.forEach((n) => refs.push({ ...n, summary: n.summary, isTop: !!n.isTop, isImportant: !!n.isImportant, hasAttachment: false, columnSlug: 'student-notices', columnTitle: '学生通知' }))
  // 教师通知
  teacherNotices.forEach((n) => refs.push({ ...n, summary: n.summary, isTop: !!n.isTop, isImportant: !!n.isImportant, hasAttachment: false, columnSlug: 'teacher-notices', columnTitle: '教师通知' }))
  // 新闻
  newsList.forEach((n) =>
    refs.push({ id: n.id, title: n.title, summary: n.summary, publishDate: n.publishDate, source: '教务处', views: n.views, tags: ['新闻资讯'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'academic', columnTitle: '教务管理' }),
  )
  // 列表项
  allListItems.forEach((it) => refs.push({ id: it.id, title: it.title, summary: it.summary, publishDate: it.publishDate, source: it.source, views: it.views, tags: it.tags, isTop: it.isTop, isImportant: it.isImportant, hasAttachment: it.hasAttachment, columnSlug: it.columnSlug, columnTitle: columns.find((c) => c.slug === it.columnSlug)?.title || '栏目' }))
  return refs
}

const allArticleRefs = buildArticleRefList()

// 富文本正文模板(确定性生成,避免 SSR/CSR 不一致)
function buildArticleContent(title: string, summary: string, tags: string[]): string {
  return `
    <p class="article-lead">${summary}</p>
    <h2>一、工作背景</h2>
    <p>为贯彻落实学校教学工作总体部署,进一步规范教学管理流程,提升教育教学质量,根据《深圳信息职业技术大学教学管理规定》及相关文件精神,现就${tags.join('、')}相关工作通知如下。</p>
    <h2>二、主要内容</h2>
    <p>各学院、各部门应高度重视${tags[0] || '本'}项工作,认真组织学习相关文件,明确责任分工,确保各项工作落到实处。具体要求如下:</p>
    <ol>
      <li>加强组织领导,成立工作小组,制定实施方案;</li>
      <li>严格按照时间节点推进,各阶段材料按时提交;</li>
      <li>注重过程管理,做好档案留存与数据统计;</li>
      <li>遇到问题及时沟通反馈,确保工作顺畅推进。</li>
    </ol>
    <h2>三、时间安排</h2>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;text-align:center;">
      <thead><tr style="background:#f0f6fc;"><th>阶段</th><th>时间</th><th>工作内容</th><th>责任人</th></tr></thead>
      <tbody>
        <tr><td>准备阶段</td><td>2026年7月1日-7月10日</td><td>制定方案、组织动员</td><td>各学院教学副院长</td></tr>
        <tr><td>实施阶段</td><td>2026年7月11日-8月20日</td><td>具体执行、材料整理</td><td>相关专业负责人</td></tr>
        <tr><td>总结阶段</td><td>2026年8月21日-8月31日</td><td>总结报告、归档</td><td>教务处相关科室</td></tr>
      </tbody>
    </table>
    <h2>四、联系方式</h2>
    <p>如有疑问,请联系教务处相关科室:</p>
    <ul>
      <li>教务科:0755-89226666-8001</li>
      <li>学籍科:0755-89226666-8002</li>
      <li>考试科:0755-89226666-8003</li>
      <li>邮箱:jwc@sziit.edu.cn</li>
    </ul>
    <blockquote>本通知自发布之日起执行,未尽事宜由教务处负责解释。</blockquote>
  `
}

// 通用附件列表
const commonAttachments: Attachment[] = [
  { id: 1, name: '工作通知附件.pdf', size: '256 KB', ext: 'pdf', downloads: 326, url: '#' },
  { id: 2, name: '申请表模板.docx', size: '48 KB', ext: 'doc', downloads: 512, url: '#' },
  { id: 3, name: '相关文件依据.pdf', size: '1.2 MB', ext: 'pdf', downloads: 198, url: '#' },
]

// 根据文章 ID 获取详情
export function getArticleDetail(id: number): ArticleDetail | null {
  const ref = allArticleRefs.find((a) => a.id === id)
  if (!ref) return null

  // 按发布日期排序,找上下篇
  const sorted = [...allArticleRefs].sort((a, b) => b.publishDate.localeCompare(a.publishDate))
  const idx = sorted.findIndex((a) => a.id === id)
  const prev = idx < sorted.length - 1 ? { id: sorted[idx + 1].id, title: sorted[idx + 1].title } : undefined
  const next = idx > 0 ? { id: sorted[idx - 1].id, title: sorted[idx - 1].title } : undefined

  return {
    ...ref,
    content: buildArticleContent(ref.title, ref.summary, ref.tags),
    attachments: commonAttachments,
    contact: '教务处 ' + ref.source + ' 0755-89226666',
    acceptTime: '工作日 8:30-12:00, 14:00-17:30',
    supervise: '教务处办公室 0755-89226666-8000',
    prev,
    next,
  }
}

// ====================================================================
// T4.4 部门介绍 Mock 数据
// ====================================================================

export interface DeptLeader {
  id: number
  name: string
  title: string
  duty: string
  avatar: string
}

export interface BusinessDivision {
  id: number
  name: string
  duty: string
  leader: string
  phone: string
  staff: { name: string; role: string }[]
}

export interface DeptStaff {
  id: number
  name: string
  division: string
  role: string
  phone: string
}

export const deptIntro = {
  brief:
    '教务处是学校主管教学工作的职能部门,负责全校教学运行、教学建设、教学研究、教学评价及教学质量管理等工作。教务处秉承"以学生为中心、以质量为生命"的理念,致力于深化教育教学改革,提升人才培养质量,为学校高质量发展提供坚实保障。',
  history:
    '教务处随学校发展不断壮大,现下设7个业务科室,统筹管理全校教学事务。近年来,围绕"双高计划"建设目标,持续推进专业内涵建设、课程改革与实践教学创新,取得显著成效。',
}

export const deptLeaders: DeptLeader[] = [
  { id: 1, name: '张明华', title: '教务处处长', duty: '主持教务处全面工作,分管综合科、教学质量管理', avatar: 'mdi:account-tie' },
  { id: 2, name: '李建国', title: '教务处副处长', duty: '分管教学运行、学籍管理、考试管理', avatar: 'mdi:account-tie-outline' },
  { id: 3, name: '王秀英', title: '教务处副处长', duty: '分管实践教学、专业建设、教研教改', avatar: 'mdi:account-tie-outline' },
  { id: 4, name: '陈志强', title: '教务处副处长', duty: '分管信息化建设、智慧教室、教学平台', avatar: 'mdi:account-tie-outline' },
]

export const businessDivisions: BusinessDivision[] = [
  {
    id: 1,
    name: '综合科',
    duty: '负责处内行政事务、公文流转、会议组织、印章管理、对外联络及信息公开等工作',
    leader: '刘芳',
    phone: '0755-89226666-8000',
    staff: [
      { name: '刘芳', role: '科长' },
      { name: '赵敏', role: '科员' },
      { name: '孙伟', role: '科员' },
    ],
  },
  {
    id: 2,
    name: '教务科',
    duty: '负责教学运行管理、排课选课、教室调度、成绩管理等工作',
    leader: '周强',
    phone: '0755-89226666-8001',
    staff: [
      { name: '周强', role: '科长' },
      { name: '吴丽', role: '科员' },
      { name: '郑杰', role: '科员' },
    ],
  },
  {
    id: 3,
    name: '学籍科',
    duty: '负责学生学籍管理、毕业资格审查、学位授予、学籍证明等工作',
    leader: '黄玲',
    phone: '0755-89226666-8002',
    staff: [
      { name: '黄玲', role: '科长' },
      { name: '林峰', role: '科员' },
    ],
  },
  {
    id: 4,
    name: '考试科',
    duty: '负责考试组织管理、试卷保密、成绩复核、四六级考试等工作',
    leader: '杨光',
    phone: '0755-89226666-8003',
    staff: [
      { name: '杨光', role: '科长' },
      { name: '何静', role: '科员' },
    ],
  },
  {
    id: 5,
    name: '教学科',
    duty: '负责教学建设、培养方案、教学大纲、教学检查、教师发展等工作',
    leader: '徐辉',
    phone: '0755-89226666-8004',
    staff: [
      { name: '徐辉', role: '科长' },
      { name: '马兰', role: '科员' },
    ],
  },
  {
    id: 6,
    name: '教研科',
    duty: '负责教研项目、课程建设、教学成果奖、教材建设、技能竞赛等工作',
    leader: '高翔',
    phone: '0755-89226666-8005',
    staff: [
      { name: '高翔', role: '科长' },
      { name: '罗琳', role: '科员' },
    ],
  },
  {
    id: 7,
    name: '实践科',
    duty: '负责实践教学、实习实训、毕业论文、校企合作、实践基地建设等工作',
    leader: '谢军',
    phone: '0755-89226666-8006',
    staff: [
      { name: '谢军', role: '科长' },
      { name: '蔡萍', role: '科员' },
    ],
  },
]

export const mainDuties: string[] = [
  '拟订学校教学管理规章制度,并组织实施',
  '组织编制各专业人才培养方案和教学计划',
  '负责教学运行管理,包括排课、选课、调课、教室调度',
  '负责学生学籍管理、成绩管理、毕业资格审查与学位授予',
  '组织各类考试工作,包括期末考试、补考、四六级考试等',
  '负责专业建设与调整,组织专业评估与新专业申报',
  '负责课程建设,推进各级各类课程项目',
  '组织教研教改项目立项、中期检查与结题验收',
  '负责教材建设与管理工作',
  '组织学生技能竞赛与教师教学能力大赛',
  '负责实践教学管理,包括实习实训、毕业论文',
  '负责智慧教室建设与教学信息化推进',
  '组织教学质量检查与教学评价',
  '负责教学档案管理与教学数据统计',
  '完成学校交办的其他教学工作',
]

export const deptContact = {
  address: '深圳市龙岗区龙翔大道2188号 行政楼3楼',
  phone: '0755-89226666',
  email: 'jwc@sziit.edu.cn',
  postcode: '518172',
  officeHours: '工作日 8:30-12:00, 14:00-17:30',
}

// ====================================================================
// T4.9 校历/作息/班车 Mock 数据
// ====================================================================

// 作息时间表
export const classSchedule = [
  { section: '第1节', time: '08:30 - 09:15', note: '第一小节' },
  { section: '第2节', time: '09:20 - 10:05', note: '第一小节' },
  { section: '课间操', time: '10:05 - 10:25', note: '大课间' },
  { section: '第3节', time: '10:25 - 11:10', note: '第二小节' },
  { section: '第4节', time: '11:15 - 12:00', note: '第二小节' },
  { section: '午休', time: '12:00 - 14:00', note: '午餐休息' },
  { section: '第5节', time: '14:00 - 14:45', note: '第三小节' },
  { section: '第6节', time: '14:50 - 15:35', note: '第三小节' },
  { section: '第7节', time: '15:50 - 16:35', note: '第四小节' },
  { section: '第8节', time: '16:40 - 17:25', note: '第四小节' },
  { section: '第9节', time: '18:30 - 19:15', note: '晚间课程' },
  { section: '第10节', time: '19:20 - 20:05', note: '晚间课程' },
]

// 校历安排
export const schoolCalendar = [
  { week: '第1周', date: '2026-02-24 至 2026-03-01', event: '学生报到注册、开学第一周' },
  { week: '第2-16周', date: '2026-03-02 至 2026-06-14', event: '正常上课(共15周)' },
  { week: '第17-18周', date: '2026-06-15 至 2026-06-28', event: '期末考试周' },
  { week: '第19-20周', date: '2026-06-29 至 2026-07-12', event: '阅卷登分、学期总结' },
  { week: '暑假', date: '2026-07-13 至 2026-08-30', event: '暑期放假' },
  { week: '下学期开学', date: '2026-08-31', event: '新生报到' },
]

// 班车时刻表
export const busSchedule = [
  { route: '1号线', direction: '学校 → 龙岗地铁站', morning: '07:30', noon: '12:30', evening: '17:30', stops: '行政楼 → 南门 → 龙岗地铁站' },
  { route: '2号线', direction: '学校 → 布吉地铁站', morning: '07:20', noon: '12:20', evening: '17:20', stops: '行政楼 → 东门 → 布吉地铁站' },
  { route: '3号线', direction: '学校 → 深圳北站', morning: '07:00', noon: '—', evening: '17:00', stops: '行政楼 → 南门 → 深圳北站' },
  { route: '4号线', direction: '学校 → 福田口岸', morning: '07:10', noon: '—', evening: '17:10', stops: '行政楼 → 东门 → 福田口岸' },
]

// 部门电话
export const departmentPhones = businessDivisions.map((d) => ({
  name: d.name,
  leader: d.leader,
  phone: d.phone,
  duty: d.duty,
}))

// ====================================================================
// T4.10 搜索 Mock 数据
// ====================================================================

export interface SearchResult {
  id: number
  title: string
  summary: string
  publishDate: string
  source: string
  columnSlug: string
  columnTitle: string
  url: string
  highlight?: string
}

// 全文搜索(标题 + 摘要 + 标签)
export function searchArticles(keyword: string): SearchResult[] {
  if (!keyword || !keyword.trim()) return []
  const kw = keyword.trim().toLowerCase()
  return allArticleRefs
    .filter(
      (a) =>
        a.title.toLowerCase().includes(kw) ||
        a.summary.toLowerCase().includes(kw) ||
        a.tags.some((t) => t.toLowerCase().includes(kw)),
    )
    .map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      publishDate: a.publishDate,
      source: a.source,
      columnSlug: a.columnSlug,
      columnTitle: a.columnTitle,
      url: `/article/${a.id}`,
    }))
}

// 搜索建议(基于标题)
export function getSearchSuggestions(keyword: string): string[] {
  if (!keyword || !keyword.trim()) return []
  const kw = keyword.trim().toLowerCase()
  const titles = allArticleRefs
    .filter((a) => a.title.toLowerCase().includes(kw))
    .slice(0, 8)
    .map((a) => a.title)
  return Array.from(new Set(titles))
}

// 热门搜索词
export const hotKeywords = ['选课', '期末考试', '毕业', '成绩查询', '四六级', '教学成果奖', '实习', '学籍证明']

// ====================================================================
// T4.11 用户中心 Mock 数据
// ====================================================================

export const userProfile = {
  id: '20260001',
  name: '张同学',
  role: 'student' as const,
  roleLabel: '学生',
  college: '信息工程学院',
  major: '软件技术',
  grade: '2024级',
  avatar: 'mdi:account-circle',
  email: 'student@sziit.edu.cn',
  phone: '138****8888',
}

export interface UserMessage {
  id: number
  title: string
  content: string
  date: string
  read: boolean
  type: 'system' | 'notice' | 'feedback'
  relatedUrl?: string
}

export const userMessages: UserMessage[] = [
  { id: 1, title: '选课成功提醒', content: '您已成功选课《Python程序设计》,请按时上课。', date: '2026-06-28', read: false, type: 'system' },
  { id: 2, title: '成绩发布通知', content: '您2026年春季学期《高等数学》成绩已发布,请查阅。', date: '2026-06-27', read: false, type: 'notice' },
  { id: 3, title: '反馈处理结果', content: '您提交的教学反馈已处理完毕,请查看处理结果。', date: '2026-06-25', read: true, type: 'feedback' },
  { id: 4, title: '考试安排提醒', content: '《大学英语》期末考试将于7月5日10:30进行,请提前到场。', date: '2026-06-20', read: true, type: 'system' },
]

export const userFavorites = [
  { id: 1, articleId: 101, title: '关于2026年春季学期选课工作的通知', url: '/article/101', date: '2026-06-28' },
  { id: 2, articleId: 104, title: '关于2026年春季学期期末考试安排的通知', url: '/article/104', date: '2026-06-20' },
  { id: 3, articleId: 301, title: '我校成功举办2026年教学创新大赛', url: '/article/301', date: '2026-06-26' },
]

export const userHistory = [
  { id: 1, articleId: 102, title: '关于2026届毕业生毕业资格审查的通知', url: '/article/102', date: '2026-06-29' },
  { id: 2, articleId: 103, title: '关于2026年大学英语四六级考试报名的通知', url: '/article/103', date: '2026-06-29' },
  { id: 3, articleId: 101, title: '关于2026年春季学期选课工作的通知', url: '/article/101', date: '2026-06-28' },
  { id: 4, articleId: 301, title: '我校成功举办2026年教学创新大赛', url: '/article/301', date: '2026-06-28' },
  { id: 5, articleId: 104, title: '关于2026年春季学期期末考试安排的通知', url: '/article/104', date: '2026-06-27' },
]

export const userFeedback = [
  { id: 1, title: '关于课程安排的建议', type: '建议', status: 'resolved' as const, statusLabel: '已处理', date: '2026-06-25', reply: '已转教务科研究,下学期将优化排课方案。' },
  { id: 2, title: '教室设备问题反馈', type: '投诉', status: 'processing' as const, statusLabel: '处理中', date: '2026-06-22', reply: '' },
]

export const userSubscriptions = [
  { id: 1, type: 'column' as const, name: '通知公告', active: true },
  { id: 2, type: 'column' as const, name: '教务管理', active: true },
  { id: 3, type: 'tag' as const, name: '选课', active: true },
  { id: 4, type: 'tag' as const, name: '考试', active: false },
]

// ====================================================================
// T4.8 教学反馈 Mock 数据
// ====================================================================

export const feedbackTypes = [
  { value: 'course', label: '课程教学反馈', icon: 'mdi:book-open-variant' },
  { value: 'teacher', label: '教师听课反馈', icon: 'mdi:account-voice' },
  { value: 'info', label: '教学信息员反馈', icon: 'mdi:clipboard-account' },
  { value: 'complaint', label: '投诉举报', icon: 'mdi:alert-circle' },
  { value: 'suggest', label: '意见建议', icon: 'mdi:lightbulb-on' },
]

export const feedbackList = [
  { id: 1, title: '关于课程安排的建议', type: '建议', status: 'resolved' as const, statusLabel: '已处理', date: '2026-06-25', reply: '已转教务科研究,下学期将优化排课方案。' },
  { id: 2, title: '教室设备问题反馈', type: '投诉', status: 'processing' as const, statusLabel: '处理中', date: '2026-06-22', reply: '' },
  { id: 3, title: '教师教学评价', type: '听课反馈', status: 'resolved' as const, statusLabel: '已处理', date: '2026-06-18', reply: '感谢您的反馈,已转达相关教师。' },
]

// ====================================================================
// T4.7 下载中心 Mock 数据
// ====================================================================

export interface DownloadFile {
  id: number
  name: string
  category: string // 分类 value
  categoryLabel: string // 分类显示名
  size: string
  ext: string
  uploadDate: string
  downloads: number
  url: string
  description?: string
}

export const downloadFiles: DownloadFile[] = [
  { id: 1, name: '学生学籍异动申请表', category: 'student-form', categoryLabel: '学生表格', size: '32 KB', ext: 'doc', uploadDate: '2026-06-01', downloads: 1256, url: '#' },
  { id: 2, name: '成绩复核申请表', category: 'student-form', categoryLabel: '学生表格', size: '28 KB', ext: 'doc', uploadDate: '2026-06-01', downloads: 892, url: '#' },
  { id: 3, name: '选课申请表', category: 'student-form', categoryLabel: '学生表格', size: '35 KB', ext: 'doc', uploadDate: '2026-06-01', downloads: 1560, url: '#' },
  { id: 4, name: '毕业论文封面模板', category: 'student-form', categoryLabel: '学生表格', size: '48 KB', ext: 'doc', uploadDate: '2026-05-20', downloads: 2100, url: '#' },
  { id: 5, name: '教师调课申请表', category: 'teacher-form', categoryLabel: '教师表格', size: '30 KB', ext: 'doc', uploadDate: '2026-06-01', downloads: 680, url: '#' },
  { id: 6, name: '教学大纲模板', category: 'teacher-form', categoryLabel: '教师表格', size: '45 KB', ext: 'doc', uploadDate: '2026-05-15', downloads: 920, url: '#' },
  { id: 7, name: '期末试卷模板', category: 'teacher-form', categoryLabel: '教师表格', size: '52 KB', ext: 'doc', uploadDate: '2026-06-10', downloads: 450, url: '#' },
  { id: 8, name: '教研项目申报书', category: 'project', categoryLabel: '教学项目', size: '68 KB', ext: 'doc', uploadDate: '2026-05-10', downloads: 380, url: '#' },
  { id: 9, name: '实习计划表', category: 'practice', categoryLabel: '实习实训', size: '40 KB', ext: 'xls', uploadDate: '2026-05-08', downloads: 560, url: '#' },
  { id: 10, name: '实习鉴定表', category: 'practice', categoryLabel: '实习实训', size: '38 KB', ext: 'xls', uploadDate: '2026-05-08', downloads: 720, url: '#' },
  { id: 11, name: '考试报名表', category: 'exam-form', categoryLabel: '考试表格', size: '25 KB', ext: 'doc', uploadDate: '2026-06-05', downloads: 1340, url: '#' },
  { id: 12, name: '学位证明申请表', category: 'general-form', categoryLabel: '通用表格', size: '28 KB', ext: 'doc', uploadDate: '2026-06-01', downloads: 890, url: '#' },
]

export const downloadCategories = [
  { value: 'all', label: '全部', order: 0 },
  { value: 'student-form', label: '学生表格', order: 1 },
  { value: 'teacher-form', label: '教师表格', order: 2 },
  { value: 'general-form', label: '通用表格', order: 3 },
  { value: 'project', label: '教学项目', order: 4 },
  { value: 'practice', label: '实习实训', order: 5 },
  { value: 'exam-form', label: '考试表格', order: 6 },
]

// ====================================================================
// 信息公开 Mock 数据
// ====================================================================

// 信息公开目录(对应 API 文档 DisclosureDirectory)
// 前端扩展 url 字段用于跳转,后端不返回
export const disclosureDirectory = [
  { id: 1, title: '学校基本信息', description: '学校基本情况、办学规模、专业设置等信息', icon: 'mdi:school', articleCount: 5, url: '/disclosure/basic' },
  { id: 2, title: '教务处规章制度', description: '教务管理相关规章制度文件', icon: 'mdi:file-document-multiple', articleCount: 28, url: '/list/regulations' },
  { id: 3, title: '人才培养方案', description: '各专业人才培养方案与教学计划', icon: 'mdi:account-school', articleCount: 18, url: '/list/major' },
  { id: 4, title: '招生就业信息', description: '招生计划与就业指导信息', icon: 'mdi:account-plus', articleCount: 12, url: '#' },
  { id: 5, title: '财务信息公开', description: '财务预算决算等公开信息', icon: 'mdi:currency-cny', articleCount: 6, url: '#' },
  { id: 6, title: '教学评估结果', description: '教学评估与质量报告', icon: 'mdi:clipboard-check', articleCount: 8, url: '/list/research' },
  { id: 7, title: '学生管理规定', description: '学生管理相关规章制度', icon: 'mdi:account-group', articleCount: 15, url: '/list/regulations' },
  { id: 8, title: '教师人事信息', description: '教师队伍基本情况', icon: 'mdi:account-tie', articleCount: 10, url: '/about' },
  { id: 9, title: '年度工作报告', description: '教务处年度信息公开工作报告', icon: 'mdi:file-chart', articleCount: 1, url: '/disclosure/report' },
  { id: 10, title: '信息公开指南', description: '信息公开申请流程与指南', icon: 'mdi:information', articleCount: 1, url: '/disclosure/guide' },
]

// 信息公开年报(对应 API 文档 DisclosureReport)
// 前端扩展 sections 字段用于分节展示,后端返回 content 为完整 HTML
export const disclosureReport = {
  year: 2025,
  title: '2025年度信息公开工作报告',
  content: '2025年度教务处信息公开工作年度报告,汇总本年度信息公开工作开展情况、主动公开信息统计、依申请公开情况等内容。',
  publishedAt: '2026-03-15',
  attachments: [] as { id: number; name: string; size: string; ext: string; downloads: number; url: string }[],
  // 前端扩展:分节展示(后端可用 content 一段 HTML 替代)
  sections: [
    { title: '一、概述', content: '2025年,教务处认真贯彻落实《高等学校信息公开办法》,坚持"公开为常态、不公开为例外"的原则,积极推进信息公开工作。' },
    { title: '二、主动公开信息情况', content: '全年通过教务处网站主动公开各类信息共计326条,其中通知公告156条、规章制度28条、教务管理类信息89条、其他信息53条。' },
    { title: '三、依申请公开情况', content: '2025年度收到信息公开申请5件,均已在规定时限内答复,无复议、诉讼情况。' },
    { title: '四、主要问题与改进', content: '信息公开的时效性有待提升,后续将完善工作机制,优化公开流程,提升信息公开质量。' },
  ],
}

// ====================================================================
// 站点地图数据
// ====================================================================

export const sitemapData = [
  {
    title: '首页',
    links: [{ title: '首页', url: '/' }],
  },
  {
    title: '部门介绍',
    links: [
      { title: '部门简介', url: '/about' },
      { title: '部门领导', url: '/about#leaders' },
      { title: '组织机构', url: '/about#divisions' },
      { title: '主要职责', url: '/about#duties' },
      { title: '联系我们', url: '/about#contact' },
    ],
  },
  {
    title: '教学管理',
    links: [
      { title: '规章制度', url: '/list/regulations' },
      { title: '通知公告', url: '/list/notices' },
      { title: '教务管理', url: '/list/academic' },
      { title: '实践教学', url: '/list/practice' },
    ],
  },
  {
    title: '教学建设',
    links: [
      { title: '专业建设', url: '/list/major' },
      { title: '教研教改', url: '/list/research' },
      { title: '技能竞赛', url: '/list/competition' },
      { title: '教学荣誉', url: '/list/honor' },
    ],
  },
  {
    title: '教学服务',
    links: [
      { title: '智慧教室', url: '/list/classroom' },
      { title: '项目指南', url: '/list/project' },
      { title: '下载中心', url: '/list/download' },
      { title: '教学反馈', url: '/feedback' },
      { title: '办事指南', url: '/list/guide' },
    ],
  },
  {
    title: '常用功能',
    links: [
      { title: '校历作息', url: '/calendar' },
      { title: '新闻资讯', url: '/news' },
      { title: '搜索', url: '/search' },
      { title: '用户中心', url: '/user' },
      { title: '信息公开', url: '/disclosure' },
      { title: '站点地图', url: '/sitemap' },
    ],
  },
]
