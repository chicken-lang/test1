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
  imageUrl: string
  linkUrl: string
  sort: number
}

export interface QuickLink {
  id: number
  title: string
  url: string
  icon: string
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
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20campus%20teaching%20conference%20banner%20blue%20academic%20building%20spring%20semester&image_size=landscape_16_9',
    linkUrl: '/article/1',
    sort: 1,
  },
  {
    id: 2,
    title: '我校获批省级一流本科专业建设点',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20professional%20construction%20achievement%20ceremony%20banner%20blue%20gold%20medal&image_size=landscape_16_9',
    linkUrl: '/article/2',
    sort: 2,
  },
  {
    id: 3,
    title: '教务处智慧教学平台正式上线',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20classroom%20technology%20education%20platform%20digital%20teaching%20blue%20modern&image_size=landscape_16_9',
    linkUrl: '/article/3',
    sort: 3,
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
  { id: 1, title: '教务管理系统', url: '#', icon: 'mdi:school', category: '教学' },
  { id: 2, title: '成绩查询', url: '#', icon: 'mdi:clipboard-text', category: '学生' },
  { id: 3, title: '选课系统', url: '#', icon: 'mdi:book-open-variant', category: '学生' },
  { id: 4, title: '课表查询', url: '#', icon: 'mdi:calendar-clock', category: '学生' },
  { id: 5, title: '考试报名', url: '#', icon: 'mdi:file-document-edit', category: '考试' },
  { id: 6, title: '教学评价', url: '#', icon: 'mdi:star', category: '评价' },
  { id: 7, title: '教材管理', url: '#', icon: 'mdi:book', category: '教材' },
  { id: 8, title: '毕业论文', url: '#', icon: 'mdi:file-pdf', category: '毕业' },
  { id: 9, title: '实习管理', url: '#', icon: 'mdi:briefcase', category: '实践' },
  { id: 10, title: '学籍证明', url: '#', icon: 'mdi:certificate', category: '学生' },
  { id: 11, title: '教学平台', url: '#', icon: 'mdi:monitor', category: '教学' },
  { id: 12, title: '教室预约', url: '#', icon: 'mdi:door', category: '教室' },
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
  { title: '国家级课程', count: 5, url: '/research', color: '#f5222d' },
  { title: '省级课程', count: 18, url: '/research', color: '#faad14' },
  { title: '校级课程', count: 62, url: '/research', color: '#52c41a' },
  { title: '在线开放课程', count: 35, url: '/research', color: '#005bac' },
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
  // 父栏目 slug,顶层为 null
  parent: string | null
  // 列表展示样式: card 卡片 / table 表格 / compact 紧凑
  listStyle: 'card' | 'table' | 'compact'
  order: number
}

// 列表项(支持置顶/加红/标签/年度/月份筛选)
export interface ListItem {
  id: number
  title: string
  summary: string
  publishDate: string
  // 年度,由 publishDate 派生,冗余存储便于筛选
  year: number
  // 月份 1-12,由 publishDate 派生
  month: number
  source: string
  views: number
  tags: string[]
  // 所属栏目 slug
  columnSlug: string
  isTop?: boolean
  isImportant?: boolean
  // 详情页链接
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
  { slug: 'regulations', title: '规章制度', parent: null, listStyle: 'table', order: 1 },
  { slug: 'notices', title: '通知公告', parent: null, listStyle: 'table', order: 2 },
  { slug: 'student-notices', title: '学生通知', parent: 'notices', listStyle: 'table', order: 1 },
  { slug: 'teacher-notices', title: '教师通知', parent: 'notices', listStyle: 'table', order: 2 },
  { slug: 'academic', title: '教务管理', parent: null, listStyle: 'card', order: 3 },
  { slug: 'practice', title: '实践教学', parent: null, listStyle: 'card', order: 4 },
  { slug: 'major', title: '专业建设', parent: null, listStyle: 'card', order: 5 },
  { slug: 'research', title: '教研教改', parent: null, listStyle: 'card', order: 6 },
  { slug: 'competition', title: '技能竞赛', parent: null, listStyle: 'card', order: 7 },
  { slug: 'honor', title: '教学荣誉', parent: null, listStyle: 'card', order: 8 },
  { slug: 'classroom', title: '智慧教室', parent: null, listStyle: 'compact', order: 9 },
  { slug: 'project', title: '项目指南', parent: null, listStyle: 'compact', order: 10 },
  { slug: 'download', title: '下载中心', parent: null, listStyle: 'table', order: 11 },
  { slug: 'feedback', title: '教学反馈', parent: null, listStyle: 'compact', order: 12 },
  { slug: 'guide', title: '办事指南', parent: null, listStyle: 'compact', order: 13 },
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
  const columnsToFill = columns.filter((c) => c.parent === null)
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
        // 前 2 条置顶,每 5 条标记重要
        isTop: i < 2,
        isImportant: i % 5 === 0,
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
