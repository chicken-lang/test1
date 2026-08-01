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
    subtitle: '深化教学改革 · 提升育人质量',
    description: '总结春季学期教学工作成果，部署下阶段教学改革重点任务，推动人才培养质量持续提升。全校各学院教学副院长、专业负责人及教师代表共200余人参加会议。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20campus%20teaching%20conference%20banner%20blue%20academic%20building%20spring%20semester%20students%20professor&image_size=landscape_16_9',
    linkUrl: '/article/1',
    linkText: '查看详情',
    order: 1,
    startDate: '2026-06-01',
    endDate: '2026-12-31',
  },
  {
    id: 2,
    title: '我校获批3个省级一流本科专业建设点',
    subtitle: '专业内涵建设再上新台阶',
    description: '深化专业内涵建设，打造高水平专业群，我校软件技术、大数据技术、人工智能3个专业获批省级一流本科专业建设点，专业建设取得历史性突破。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20professional%20construction%20achievement%20ceremony%20banner%20blue%20gold%20medal%20award%20academic&image_size=landscape_16_9',
    linkUrl: '/article/2',
    linkText: '了解更多',
    order: 2,
    startDate: '2026-05-15',
    endDate: '2026-11-15',
  },
  {
    id: 3,
    title: '教务处智慧教学平台正式上线',
    subtitle: '科技赋能教育 · 数据驱动决策',
    description: '集成课程管理、教学评价、资源共享、数据分析于一体的智慧教学平台全面启用。平台涵盖智慧课室260余间，服务师生超2万人。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20classroom%20technology%20education%20platform%20digital%20teaching%20blue%20modern%20futuristic&image_size=landscape_16_9',
    linkUrl: '/article/3',
    linkText: '立即体验',
    order: 3,
    startDate: '2026-06-10',
    endDate: '2027-06-10',
  },
  {
    id: 4,
    title: '2026年职业本科人才培养方案发布',
    subtitle: '岗课赛证融通 · 产教深度融合',
    description: '对标职业本科办学标准，深化产教融合校企合作，全面修订12个职业本科专业人才培养方案，强化岗课赛证综合育人。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vocational%20education%20undergraduate%20curriculum%20training%20plan%20university%20blue%20professional%20modern&image_size=landscape_16_9',
    linkUrl: '/article/9101',
    linkText: '查看方案',
    order: 4,
    startDate: '2026-06-15',
    endDate: '2026-09-15',
  },
  {
    id: 5,
    title: '2026年广东省职业院校技能大赛报名启动',
    subtitle: '以赛促学 · 以赛促教 · 以赛促改',
    description: '省教育厅公布2026年广东省职业院校技能大赛赛程，我校承办5个赛项，现启动校内选拔与报名工作，请各学院积极组织。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vocational%20skills%20competition%20university%20students%20robotics%20technology%20competition%20blue%20energetic&image_size=landscape_16_9',
    linkUrl: '/article/9201',
    linkText: '我要报名',
    order: 5,
    startDate: '2026-07-01',
    endDate: '2026-08-10',
  },
  {
    id: 6,
    title: '产教融合战略：校企共建比亚迪产业学院',
    subtitle: '校企双元育人 · 精准对接产业',
    description: '我校与比亚迪股份有限公司签署产教融合战略合作协议，共建比亚迪新能源汽车产业学院，在专业共建、课程开发、实训基地、实习就业等方面深度合作。',
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industry%20university%20collaboration%20signing%20ceremony%20electric%20vehicle%20new%20energy%20factory%20blue%20corporate&image_size=landscape_16_9',
    linkUrl: '/article/9001',
    linkText: '合作详情',
    order: 6,
    startDate: '2026-05-20',
    endDate: '2026-11-20',
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
// 内部内容页跳转 _self;外部业务系统跳转 _blank(需登录,Mock 阶段指向 SSO 登录页)
export const quickLinks: QuickLink[] = [
  { id: 1, title: '教务管理系统', url: '/login/student', icon: 'mdi:school', category: '教学', order: 1, target: '_blank' },
  { id: 2, title: '成绩查询', url: '/login/student', icon: 'mdi:clipboard-text', category: '学生', order: 2, target: '_blank' },
  { id: 3, title: '选课系统', url: '/list/operation-course', icon: 'mdi:book-open-variant', category: '学生', order: 3, target: '_self' },
  { id: 4, title: '课表查询', url: '/list/operation-calendar', icon: 'mdi:calendar-clock', category: '学生', order: 4, target: '_self' },
  { id: 5, title: '考试报名', url: '/list/exam-school', icon: 'mdi:file-document-edit', category: '考试', order: 5, target: '_self' },
  { id: 6, title: '教学评价', url: '#', icon: 'mdi:star', category: '评价', order: 6, target: '_self' },
  { id: 7, title: '教材管理', url: '/list/exam-textbook', icon: 'mdi:book', category: '教材', order: 7, target: '_self' },
  { id: 8, title: '毕业论文', url: '/list/practice', icon: 'mdi:file-pdf', category: '毕业', order: 8, target: '_self' },
  { id: 9, title: '实习管理', url: '/list/practice-internship', icon: 'mdi:briefcase', category: '实践', order: 9, target: '_self' },
  { id: 10, title: '学籍证明', url: '/list/guide-student', icon: 'mdi:certificate', category: '学生', order: 10, target: '_self' },
  { id: 11, title: '教学平台', url: '/login/teacher', icon: 'mdi:monitor', category: '教学', order: 11, target: '_blank' },
  { id: 12, title: '教室预约', url: '/login/teacher', icon: 'mdi:door', category: '教室', order: 12, target: '_blank' },
]

// ========== 常用信息(FR-01.07) ==========
export const commonInfo = [
  { title: '教学日历', url: '/list/operation-calendar', icon: 'mdi:calendar-month' },
  { title: '选课服务', url: '/list/operation-course', icon: 'mdi:book-open-variant' },
  { title: '办事指南', url: '/list/guide', icon: 'mdi:map-marker-path' },
  { title: '下载中心', url: '/list/download', icon: 'mdi:download' },
  { title: '规章制度', url: '/list/regulation-school', icon: 'mdi:file-document' },
  { title: '部门概况', url: '/about', icon: 'mdi:account-group' },
]

// ========== 课程建设分区(FR-01.06) ==========
export const courseConstruction = [
  { title: '国家级课程', count: 5, url: '/list/course', color: '#f5222d' },
  { title: '省级课程', count: 18, url: '/list/course', color: '#faad14' },
  { title: '校级课程', count: 62, url: '/list/course', color: '#52c41a' },
  { title: '在线开放课程', count: 35, url: '/list/course', color: '#0073bd' }, // VI 主色 #0073BD(Pantone 2172C)
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
// V2.0 对齐：保留 slug/title/parentId/order 旧字段供前台路由使用，新增 columnId/columnName/columnSlug/status/responsibleBusiness/version 字段对齐 V2.0 模块五
export interface ColumnCategory {
  // ===== V2.0 标准字段（对齐 V1.0 §7.1 字段契约 + V2.0 §5.3.3） =====
  /** 主键 ID（不可变，V2.0 §5.3.2） */
  columnId: number
  /** 路由别名（可修改，V2.0 §5.3.2，与 slug 同值，向后兼容） */
  columnSlug: string
  /** 栏目名称（V2.0 §7.1，与 title 同值，向后兼容） */
  columnName: string
  /** 父栏目 columnId（一级栏目为 null） */
  parentIdNum: number | null
  /** 排序权重（与 order 同值，向后兼容） */
  sortOrder: number
  /** 状态（V2.0 §5.3.3） */
  status: 'ACTIVE' | 'DISABLED'
  /** 二级栏目必填：责任业务编码（V2.0 §5.4.2） */
  responsibleBusiness?: string
  /** 乐观锁版本号（V2.0 §5.7） */
  version: number
  /** 外部链接地址（仅链接型栏目使用） */
  linkUrl?: string

  // ===== 旧字段（向后兼容，供 list/[slug].vue / 面包屑 / 侧边栏使用） =====
  /** @deprecated 使用 columnSlug */
  slug: string
  /** @deprecated 使用 columnName */
  title: string
  icon?: string
  description?: string
  /** @deprecated 使用 parentIdNum；父栏目 slug,顶层为 null */
  parentId: string | null
  /** @deprecated 使用 sortOrder */
  order: number
  articleCount: number
  children?: ColumnCategory[]
  /** 前端扩展:列表展示样式 card 卡片 / table 表格 / compact 紧凑 / gallery 图文画廊(后端不返回) */
  listStyle: 'card' | 'table' | 'compact' | 'gallery'
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
  author?: string
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

// ========== 栏目树(对齐《教务处网站改版项目需求说明书》6 个一级栏目 + 22 个二级栏目) ==========
export const columns: ColumnCategory[] = [
  // 1. 部门概况
  {
    columnId: 1, columnSlug: 'about', columnName: '部门概况', parentIdNum: null, sortOrder: 1, status: 'ACTIVE', version: 1, responsibleBusiness: 'general',
    slug: 'about', title: '部门概况', parentId: null, order: 1, articleCount: 7, listStyle: 'compact',
    description: '部门简介、机构设置', icon: 'mdi:account-group',
    children: [
      { columnId: 9, columnSlug: 'about-brief', columnName: '部门简介', parentIdNum: 1, sortOrder: 1, status: 'ACTIVE', version: 1, responsibleBusiness: 'about-brief',
        slug: 'about-brief', title: '部门简介', parentId: 'about', order: 1, articleCount: 3, listStyle: 'compact',
        description: '教务处部门职能介绍、发展历程、主要职责', icon: 'mdi:information-outline' },
      { columnId: 10, columnSlug: 'about-structure', columnName: '机构设置', parentIdNum: 1, sortOrder: 2, status: 'ACTIVE', version: 1, responsibleBusiness: 'about-structure',
        slug: 'about-structure', title: '机构设置', parentId: 'about', order: 2, articleCount: 4, listStyle: 'compact',
        description: '教务处下设科室、人员配置、业务分工', icon: 'mdi:office-building-outline' },
    ]
  },
  // 2. 通知公告
  {
    columnId: 2, columnSlug: 'notices', columnName: '通知公告', parentIdNum: null, sortOrder: 2, status: 'ACTIVE', version: 1, responsibleBusiness: 'notice',
    slug: 'notices', title: '通知公告', parentId: null, order: 2, articleCount: 84, listStyle: 'table',
    description: '教师公告、学生公告、处务通知', icon: 'mdi:bell-outline',
    children: [
      { columnId: 11, columnSlug: 'notice-teacher', columnName: '教师公告', parentIdNum: 2, sortOrder: 1, status: 'ACTIVE', version: 1, responsibleBusiness: 'notice-teacher',
        slug: 'notice-teacher', title: '教师公告', parentId: 'notices', order: 1, articleCount: 36, listStyle: 'table',
        description: '面向教师的教学通知、排课选课、考试安排等', icon: 'mdi:account-tie-outline' },
      { columnId: 12, columnSlug: 'notice-student', columnName: '学生公告', parentIdNum: 2, sortOrder: 2, status: 'ACTIVE', version: 1, responsibleBusiness: 'notice-student',
        slug: 'notice-student', title: '学生公告', parentId: 'notices', order: 2, articleCount: 28, listStyle: 'table',
        description: '面向学生的通知公告、活动通知等', icon: 'mdi:account-school-outline' },
      { columnId: 13, columnSlug: 'notice-office', columnName: '处务通知', parentIdNum: 2, sortOrder: 3, status: 'ACTIVE', version: 1, responsibleBusiness: 'notice-office',
        slug: 'notice-office', title: '处务通知', parentId: 'notices', order: 3, articleCount: 20, listStyle: 'table',
        description: '教务处内部会议、培训、行政事务通知', icon: 'mdi:file-document-outline' },
    ]
  },
  // 3. 教务动态
  {
    columnId: 3, columnSlug: 'news', columnName: '教务动态', parentIdNum: null, sortOrder: 3, status: 'ACTIVE', version: 1, responsibleBusiness: 'news',
    slug: 'news', title: '教务动态', parentId: null, order: 3, articleCount: 48, listStyle: 'card',
    description: '工作动态、会议活动', icon: 'mdi:newspaper-variant-outline',
    children: [
      { columnId: 14, columnSlug: 'news-work', columnName: '工作动态', parentIdNum: 3, sortOrder: 1, status: 'ACTIVE', version: 1, responsibleBusiness: 'news-work',
        slug: 'news-work', title: '工作动态', parentId: 'news', order: 1, articleCount: 28, listStyle: 'card',
        description: '教务处日常工作进展、重要举措、阶段性成果', icon: 'mdi:update' },
      { columnId: 15, columnSlug: 'news-meeting', columnName: '会议活动', parentIdNum: 3, sortOrder: 2, status: 'ACTIVE', version: 1, responsibleBusiness: 'news-meeting',
        slug: 'news-meeting', title: '会议活动', parentId: 'news', order: 2, articleCount: 20, listStyle: 'card',
        description: '教学工作会议、研讨活动、培训讲座等活动报道', icon: 'mdi:account-group-outline' },
    ]
  },
  // 4. 一流育人体系
  {
    columnId: 4, columnSlug: 'first-class-education', columnName: '一流育人体系', parentIdNum: null, sortOrder: 4, status: 'ACTIVE', version: 1, responsibleBusiness: 'first-class',
    slug: 'first-class-education', title: '一流育人体系', parentId: null, order: 4, articleCount: 84, listStyle: 'card',
    description: '一流专业、一流课程、一流教师、一流教材、实训基地建设', icon: 'mdi:school-outline',
    children: [
      { columnId: 16, columnSlug: 'first-class-major', columnName: '一流专业', parentIdNum: 4, sortOrder: 1, status: 'ACTIVE', version: 1, responsibleBusiness: 'first-class-major',
        slug: 'first-class-major', title: '一流专业', parentId: 'first-class-education', order: 1, articleCount: 18, listStyle: 'card',
        description: '一流本科专业建设点申报、建设与评估', icon: 'mdi:book-open-page-variant' },
      { columnId: 17, columnSlug: 'first-class-course', columnName: '一流课程', parentIdNum: 4, sortOrder: 2, status: 'ACTIVE', version: 1, responsibleBusiness: 'first-class-course',
        slug: 'first-class-course', title: '一流课程', parentId: 'first-class-education', order: 2, articleCount: 22, listStyle: 'card',
        description: '精品在线开放课程、一流课程建设', icon: 'mdi:google-classroom' },
      { columnId: 18, columnSlug: 'first-class-teacher', columnName: '一流教师', parentIdNum: 4, sortOrder: 3, status: 'ACTIVE', version: 1, responsibleBusiness: 'first-class-teacher',
        slug: 'first-class-teacher', title: '一流教师', parentId: 'first-class-education', order: 3, articleCount: 16, listStyle: 'card',
        description: '教学名师、优秀教师、教学团队建设', icon: 'mdi:account-tie-outline' },
      { columnId: 19, columnSlug: 'first-class-textbook', columnName: '一流教材', parentIdNum: 4, sortOrder: 4, status: 'ACTIVE', version: 1, responsibleBusiness: 'first-class-textbook',
        slug: 'first-class-textbook', title: '一流教材', parentId: 'first-class-education', order: 4, articleCount: 14, listStyle: 'card',
        description: '优秀教材、规划教材建设与评选', icon: 'mdi:book-multiple' },
      { columnId: 20, columnSlug: 'first-class-base', columnName: '实训基地建设', parentIdNum: 4, sortOrder: 5, status: 'ACTIVE', version: 1, responsibleBusiness: 'first-class-base',
        slug: 'first-class-base', title: '实训基地建设', parentId: 'first-class-education', order: 5, articleCount: 14, listStyle: 'gallery',
        description: '校内外实训基地建设与管理', icon: 'mdi:factory' },
    ]
  },
  // 5. 人才培养平台（链接型）
  {
    columnId: 5, columnSlug: 'talent-platform', columnName: '人才培养平台', parentIdNum: null, sortOrder: 5, status: 'ACTIVE', version: 1, responsibleBusiness: 'platform',
    slug: 'talent-platform', title: '人才培养平台', parentId: null, order: 5, articleCount: 0, listStyle: 'compact',
    description: '本科教务系统、专科教务系统等外部平台链接', icon: 'mdi:link-variant',
    children: [
      { columnId: 21, columnSlug: 'platform-undergraduate', columnName: '本科教务系统', parentIdNum: 5, sortOrder: 1, status: 'ACTIVE', version: 1, responsibleBusiness: 'platform-link', linkUrl: 'https://jwxt.sziit.edu.cn/undergraduate',
        slug: 'platform-undergraduate', title: '本科教务系统', parentId: 'talent-platform', order: 1, articleCount: 0, listStyle: 'compact',
        description: '本科教务管理系统', icon: 'mdi:school' },
      { columnId: 22, columnSlug: 'platform-college', columnName: '专科教务系统', parentIdNum: 5, sortOrder: 2, status: 'ACTIVE', version: 1, responsibleBusiness: 'platform-link', linkUrl: 'https://jwxt.sziit.edu.cn/college',
        slug: 'platform-college', title: '专科教务系统', parentId: 'talent-platform', order: 2, articleCount: 0, listStyle: 'compact',
        description: '专科教务管理系统', icon: 'mdi:school' },
      { columnId: 23, columnSlug: 'platform-competition', columnName: '大赛与荣誉系统', parentIdNum: 5, sortOrder: 3, status: 'ACTIVE', version: 1, responsibleBusiness: 'platform-link', linkUrl: 'https://competition.sziit.edu.cn',
        slug: 'platform-competition', title: '大赛与荣誉系统', parentId: 'talent-platform', order: 3, articleCount: 0, listStyle: 'compact',
        description: '技能大赛与荣誉管理系统', icon: 'mdi:trophy-award' },
      { columnId: 24, columnSlug: 'platform-college-mgmt', columnName: '二级学院育人综合管理平台', parentIdNum: 5, sortOrder: 4, status: 'ACTIVE', version: 1, responsibleBusiness: 'platform-link', linkUrl: 'https://college-mgmt.sziit.edu.cn',
        slug: 'platform-college-mgmt', title: '二级学院育人综合管理平台', parentId: 'talent-platform', order: 4, articleCount: 0, listStyle: 'compact',
        description: '二级学院育人综合管理平台', icon: 'mdi:domain' },
      { columnId: 25, columnSlug: 'platform-review', columnName: '通用项目评审', parentIdNum: 5, sortOrder: 5, status: 'ACTIVE', version: 1, responsibleBusiness: 'platform-link', linkUrl: 'https://review.sziit.edu.cn',
        slug: 'platform-review', title: '通用项目评审', parentId: 'talent-platform', order: 5, articleCount: 0, listStyle: 'compact',
        description: '通用项目评审系统', icon: 'mdi:clipboard-check' },
      { columnId: 26, columnSlug: 'platform-quality-eval', columnName: '教学质量评价系统', parentIdNum: 5, sortOrder: 6, status: 'ACTIVE', version: 1, responsibleBusiness: 'platform-link', linkUrl: 'https://quality.sziit.edu.cn',
        slug: 'platform-quality-eval', title: '教学质量评价系统', parentId: 'talent-platform', order: 6, articleCount: 0, listStyle: 'compact',
        description: '教学质量评价系统', icon: 'mdi:star-outline' },
      { columnId: 27, columnSlug: 'platform-practice', columnName: '实践教学平台', parentIdNum: 5, sortOrder: 7, status: 'ACTIVE', version: 1, responsibleBusiness: 'platform-link', linkUrl: 'https://practice.sziit.edu.cn',
        slug: 'platform-practice', title: '实践教学平台', parentId: 'talent-platform', order: 7, articleCount: 0, listStyle: 'compact',
        description: '实践教学管理平台', icon: 'mdi:factory' },
    ]
  },
  // 6. 办事指南
  {
    columnId: 6, columnSlug: 'guide', columnName: '办事指南', parentIdNum: null, sortOrder: 6, status: 'ACTIVE', version: 1, responsibleBusiness: 'guide',
    slug: 'guide', title: '办事指南', parentId: null, order: 6, articleCount: 84, listStyle: 'compact',
    description: '国家及省市文件、学校规章制度、下载中心', icon: 'mdi:map-marker-path',
    children: [
      { columnId: 28, columnSlug: 'regulation-national', columnName: '国家及省市文件', parentIdNum: 6, sortOrder: 1, status: 'ACTIVE', version: 1, responsibleBusiness: 'regulation-national',
        slug: 'regulation-national', title: '国家及省市文件', parentId: 'guide', order: 1, articleCount: 12, listStyle: 'table',
        description: '教育部、教育厅等上级主管部门文件', icon: 'mdi:flag-outline' },
      { columnId: 29, columnSlug: 'regulation-school', columnName: '学校规章制度', parentIdNum: 6, sortOrder: 2, status: 'ACTIVE', version: 1, responsibleBusiness: 'regulation-school',
        slug: 'regulation-school', title: '学校规章制度', parentId: 'guide', order: 2, articleCount: 24, listStyle: 'table',
        description: '学校及教务处制定的教学管理规章制度', icon: 'mdi:rule' },
      { columnId: 30, columnSlug: 'download', columnName: '下载中心', parentIdNum: 6, sortOrder: 3, status: 'ACTIVE', version: 1, responsibleBusiness: 'download',
        slug: 'download', title: '下载中心', parentId: 'guide', order: 3, articleCount: 48, listStyle: 'table',
        description: '各类表格模板、文件下载', icon: 'mdi:download-circle-outline' },
    ]
  },
]

// 旧 slug → 新 slug 重定向映射(保留旧路由,301 跳转到新栏目)
// 用于 redirect-slug.global.ts 中间件,避免旧链接 404
export const slugRedirects: Record<string, string> = {
  'student-notices': 'notice-student',
  'teacher-notices': 'notice-teacher',
  'notice-teaching': 'notice-teacher',
  'notice-public': 'notice-student',
  academic: 'news-work',
  research: 'first-class-major',
  honor: 'first-class-teacher',
  classroom: 'guide',
  feedback: 'guide',
  // V2.0 栏目体系调整：旧栏目合并/重定向
  'teaching-construction': 'first-class-education',
  'practice-teaching': 'first-class-base',
  'skills-competition': 'platform-competition',
  'teaching-quality': 'platform-quality-eval',
  'construction': 'first-class-education',
  'practice': 'first-class-base',
  'competition': 'platform-competition',
  'quality': 'platform-quality-eval',
  'operation': 'talent-platform',
  'exam': 'platform-undergraduate',
  'scheduling': 'platform-undergraduate',
  'student-status': 'platform-undergraduate',
  'guide-student': 'regulation-national',
  'guide-teacher': 'regulation-school',
  'guide-visitor': 'download',
  'regulations': 'regulation-national',
}

// ========== 列表项数据池(模拟各栏目文章) ==========
// 说明: 为支持分页与筛选验证,每个栏目生成足够数量的条目
const tagPool = [
  '通知', '公告', '报名', '考试', '选课', '毕业', '成绩', '教学', '实践', '竞赛',
  '荣誉', '教室', '项目', '下载', '反馈', '指南', '教学改革', '校企合作', '产教融合',
  '一流专业', '一流课程', '人才培养', '职业本科', '智慧教学', '教学成果',
  '实习实训', '技能大赛', '教学评价', '教学检查', '教学大纲', '教材建设',
  '学籍异动', '学位授予', '四六级', '补考', '缓考', '重修', '免修', '创新学分',
  '毕业论文', '顶岗实习', '就业', '奖助学金', '学术讲座', '师德师风',
  '教研项目', '课程思政', '劳动教育', '创新创业', '在线课程', 'MOOC',
  '虚拟仿真', '实训室建设', '教学基地', '职教本科', '1+X证书', '岗课赛证',
]
const sourcePool = ['教务科', '学籍科', '考试科', '教学科', '教研科', '实践科', '综合科', '教材科', '教学督导室']
const authorPool = ['张主任', '李老师', '王老师', '赵秘书', '陈科长', '刘科长', '周科长', '吴老师', '郑老师', '孙老师', '教务处', '教学科（发布）', '学籍科（发布）', '教研科（发布）', '考试科（发布）', '实践科（发布）']

const columnTitlesPool: Record<string, { titles: string[]; summaries: string[] }> = {
  'about-brief': {
    titles: ['教务处部门职能介绍（2026版）', '教务处主要职责与业务范围说明', '教务处"十四五"教学工作规划发布', '教务处岗位设置与业务分工详解', '关于教务处机构职能调整的说明'],
    summaries: ['为方便全校师生了解教务处业务流程，现将各科室职责、办公地点、联系电话汇总发布。', '教务处是学校教学管理核心职能部门，本文对机构历史、职能发展、近年工作做系统介绍。'],
  },
  'about-structure': {
    titles: ['教务处下设机构一览（7个科室）', '教务处各科室内部分工与岗位职责说明', '教务处2026年领导班子分工调整通知', '教学督导组工作职责说明', '教师发展中心挂牌运行通知'],
    summaries: ['教务处现设综合科、教务科、学籍科、考试科、教学科、教研科、实践科7个业务科室，各司其职，协同配合。', '为便于师生办事对接，现将各科室人员分工、岗位职责及办公区域公开发布。'],
  },
  'notice-teacher': {
    titles: [
      '关于2026年秋季学期教学工作量统计的通知', '关于开展2026年校级教学成果奖评选的通知', '关于提交期末考试试卷的通知',
      '关于2026年暑期教师教学能力培训安排的通知', '关于开展2025-2026学年第二学期期中教学检查的通知',
      '关于申报2026年校级在线开放课程建设项目的通知', '关于2026年教材选用与征订工作的通知',
      '关于开展课程思政示范课程评选活动的通知', '关于2026-2027学年第一学期教学任务落实的通知',
      '关于开展新学期任课教师教案检查的通知', '关于组织2026年青年教师教学基本功比赛的通知',
    ],
    summaries: [
      '请各位教师核对本人教学工作量，如有异议及时反馈，截止时间7月5日。',
      '2026年校级教学成果奖评选工作启动，欢迎教师积极申报，申报截止8月15日。',
      '请各位教师按学校统一模板提交期末考试试卷，截止时间7月10日。',
    ],
  },
  'notice-student': {
    titles: [
      '关于2026年秋季学期选课工作的通知', '关于2026届毕业生毕业资格审查的通知',
      '关于2026年大学英语四六级考试报名的通知', '关于2026年秋季学期期末考试安排的通知',
      '关于办理2026届毕业生学位证书的通知', '关于学生成绩复核申请的通知',
      '关于2026年秋季学期新生报到注册的通知', '关于开展2026年学生教学满意度评价的通知',
      '关于2026-2027学年第一学期补考工作安排的通知', '关于2026年学生创新创业项目立项的通知',
    ],
    summaries: [
      '2026年秋季学期选课分三轮进行，请各学院通知学生按时完成预选、正选、退改选。',
      '2026届毕业生毕业资格审查工作启动，请各学院按要求于7月15日前提交材料。',
      '2026年下半年全国大学英语四六级考试将于12月14日举行，报名工作9月10日启动。',
    ],
  },
  'notice-office': {
    titles: [
      '关于召开2026年春季学期教学工作例会的通知', '教务处关于2026年暑假值班安排的通知',
      '教务处关于组织"迎七一"主题党日活动的通知', '教务处关于开展档案整理归档工作的通知',
      '教务处关于报送2026年上半年工作总结的通知', '教务处关于组织政治学习的通知',
      '关于教务处公章使用与管理规定的通知', '教务处关于更新OA流程审批人的通知',
      '教务处关于组织处内业务培训的通知', '教务处办公区域消防演练通知',
      '教务处关于开展作风建设专项学习的通知', '教务处关于做好学期末总结工作的通知',
      '教务处关于举办教务处开放日活动的通知', '关于开展信息安全专项检查的通知',
      '教务处关于落实《新时代高校教师职业行为十项准则》学习的通知',
    ],
    summaries: [
      '经研究决定，于2026年X月X日（周三）下午2:30在行政楼301会议室召开教学工作例会，请准时参加。',
      '暑假期间（7月15日-8月30日）各科室安排值班人员，保证日常业务办理畅通，值班表见附件。',
    ],
  },
  'news-work': {
    titles: [
      '我校2026年教学工作会议圆满召开', '教务处召开2026届毕业生就业推进会',
      '校领导深入教学一线开展新学期听课调研', '教务处举办2026年新版人才培养方案解读会',
      '我校2026级新生顺利开课，教学秩序井然', '教务处召开"说专业·说课程"活动启动会',
      '我校召开职业本科教学合格评估动员会', '教务处组织《职业教育法》专题学习会',
      '2026年暑期教师企业实践项目顺利启动', '学校召开教学指导委员会年度工作会议',
      '教务处启动2026版课程标准全面修订工作', '我校顺利通过学士学位授予权评审现场考察',
      '教务处召开课程思政建设经验交流会', '学校与华为技术有限公司共建ICT学院签约仪式隆重举行',
      '2026年全校教学工作研讨会顺利召开',
    ],
    summaries: [
      '6月28日，我校2026年教学工作会议在报告厅召开，校长作工作报告，部署全年教学改革重点任务。',
      '教务处深入各学院调研，走访比亚迪、腾讯、华大基因等企业，就产业学院共建、学生就业等开展对接。',
    ],
  },
  'news-meeting': {
    titles: [
      '2026年全国职业本科教学改革研讨会在我校成功举办', '粤港澳大湾区职业教育产教融合论坛成功举办',
      '广东省职业院校教学管理工作年会我校代表参会交流', '我校举办第一届数字经济与人才培养高峰论坛',
      '专家报告会：华东师大徐国庆教授应邀来校作学术报告', '教学创新沙龙：项目化教学设计工作坊圆满举办',
      '教务处组织学习《国家职业教育改革实施方案》专题会议', '新教师岗前培训开班仪式顺利举行',
      '我校举办2026届毕业生就业校企供需见面会', '省教育厅教学督导组莅临我校督导检查',
      '双高校建设中期汇报会顺利召开', '教务处组织骨干教师赴德国双元制教育考察学习',
      '我校成功承办广东省职业院校技能大赛5个赛项', '全国职业院校教学诊断与改进工作现场会代表来校交流',
      '《深圳信息职业技术大学发展论坛》第26讲开讲',
    ],
    summaries: [
      '5月20日，来自全国28所职业本科高校的300余位专家学者齐聚我校，共话职业本科教育高质量发展。',
      '粤港澳大湾区200余家企业参与产教融合论坛，签约共建12个特色产业学院。',
    ],
  },
  'news-media': {
    titles: [
      '《中国教育报》专题报道我校职业本科人才培养模式创新', '《深圳特区报》报道：信大产教融合培养"四链贯通"人才',
      '《南方日报》刊发：比亚迪产业学院订单班，让学生"入学即入职"', '深圳卫视《第一现场》报道我校智慧教室建设成果',
      '《广东教育》杂志专题：技能大赛"金牌学校"是怎样炼成的', '学习强国平台推送我校课程思政典型案例',
      '《职教论坛》刊发我校教学成果奖研究成果', '深圳新闻网专访教务处：新版人才培养方案有哪些亮点？',
      '《中国职业技术教育》收录我校岗课赛证综合育人实践', '深圳商报报道：我校就业率连续三年保持98%以上',
    ],
    summaries: [
      '6月15日，《中国教育报》以"岗课赛证融通，职业本科人才培养的深圳探索"为题，专题报道我校创新实践。',
      '深圳卫视走进我校260间智慧教室，拍摄《未来课堂》专题片，展示学校教育数字化转型成效。',
    ],
  },
  'major': {
    titles: [
      '我校新增人工智能、智能制造工程2个职业本科专业获教育部备案', '软件技术专业群入选国家级高水平专业群',
      '3个专业获批省级一流本科专业建设点', '大数据技术专业顺利通过工程教育专业认证进校考察',
      '信息工程学院召开专业建设指导委员会年会', '金融科技专业人才培养方案专家论证会召开',
      '《2026年专业设置动态调整方案》发布', '环境工程技术专业完成省级重点专业验收',
      '新能源汽车技术专业群入选省级高水平专业群', '数字媒体艺术专业获市级品牌专业称号',
      '现代物流管理专业群：深化产教融合 培养供应链人才', '跨境电子商务专业教学标准通过国家级专家组审定',
      '建筑工程技术专业群入选"双高计划"建设中期绩效优秀', '集成电路技术专业获批国家职业教育示范专业',
      '学校召开2026年专业设置评议委员会会议',
    ],
    summaries: [
      '教育部公布2026年度普通高等学校本科专业备案和审批结果，我校申报的人工智能、智能制造工程2个职业本科专业成功获批。',
      '经省教育厅推荐、专家评审、公示，我校软件技术、大数据技术、信息安全与管理3个专业入选省级一流本科专业建设点。',
    ],
  },
  'training-plan': {
    titles: [
      '2026级职业本科人才培养方案发布', '关于修订2026级各专业人才培养方案的通知',
      '《岗课赛证综合育人人才培养模式实施方案》印发', '2026级人才培养方案制（修）订工作专题培训会举办',
      '各专业人才培养方案校内专家评审完成', '《职业本科专业人才培养方案编制指南》发布',
      '2026级专业群平台课程设置专家论证会', '《关于强化毕业设计（毕业论文）实践环节的指导意见》发布',
      '《劳动教育实施方案（试行）》印发实施', '《创新创业教育融入人才培养全过程实施细则》通知',
      '关于加强课程思政建设的实施方案', '各专业2026级推荐课表已上传教务系统',
      '《1+X证书制度融入人才培养方案工作指引》发布', '2026级公共基础课程模块优化方案评审通过',
      '职业本科"五育并举"人才培养体系构建完成',
    ],
    summaries: [
      '《2026级职业本科专业人才培养方案》经教学工作委员会审议通过，全文正式发布，突出"岗课赛证融通"特色。',
      '新版培养方案围绕职业本科办学定位，重构"平台+模块+方向"课程体系，强化实践课时占比≥50%。',
    ],
  },
  'course': {
    titles: [
      '我校新增8门省级一流本科课程', '《Python程序设计》等3门课程获批国家级一流本科课程',
      '校级首批精品在线开放课程建设立项', '《职业素养与工匠精神》课程思政示范课开讲',
      '智慧教学平台新上线课程260门，使用率达92%', '虚拟仿真实验教学中心新增5个实验项目',
      '《电工电子技术》等6门MOOC在中国大学MOOC上线', '课程思政教学案例评选：12个案例获评校级优秀',
      '2026年校级混合式一流课程申报通知', '《基于真实项目的课程》改革试点启动',
      '校级课程思政示范课程建设项目中期检查完成', '《岗课赛证融合课程建设标准》正式发布',
      '优质课程资源跨校共享联盟成立，10校资源互通', '人工智能通识课《AI原理与应用》首次开课',
      '2026年校级优秀教材/课程思政示范教材评选结果公布',
    ],
    summaries: [
      '广东省教育厅公布2026年省级一流课程名单，我校申报的8门课程全部入选，覆盖线上、线下、混合式等多种类型。',
      '继《Python程序设计》之后，《大数据技术》《物联网系统集成》2门课程获批国家级一流本科课程，我校国家级课程总数达7门。',
    ],
  },
  'project': {
    titles: [
      '2026年校级教学改革研究项目立项名单公布（50项）', '我校6个项目获2026年广东省高等教育教学改革项目立项',
      '教育部职业教育教学改革研究项目我校2项入选', '关于开展2026年校级教研项目中期检查的通知',
      '2024年度40项校级教研项目顺利结题验收', '关于申报2026年教育科学规划课题的通知',
      '教育部新工科研究与实践项目我校1项获批', '《职业本科产教融合人才培养模式研究》等3项重点项目开题',
      '广东省高等职业教育教学质量与教学改革工程项目申报指南发布', '关于组织申报2026年市级教育规划课题的通知',
      '我校2项教学改革成果入选省级推广应用案例', '校级虚拟仿真实验教学项目申报启动',
      '《产教融合背景下的"双师型"教师队伍建设研究》项目启动会', '教学改革项目成果丛书首批6本正式出版',
      '关于开展2026年度校级教学成果鉴定工作的通知',
    ],
    summaries: [
      '经专家评审，2026年校级教改研究项目共立项50项，其中重点项目10项、一般项目30项、青年项目10项，立项经费合计120万元。',
      '广东省教育厅公布2026年高等教育教学改革项目名单，我校6项课题榜上有名，立项数创近年新高。',
    ],
  },
  'first-class-major': {
    titles: [
      '我校新增人工智能、智能制造工程2个职业本科专业获教育部备案', '软件技术专业群入选国家级高水平专业群',
      '3个专业获批省级一流本科专业建设点', '大数据技术专业顺利通过工程教育专业认证进校考察',
      '信息工程学院召开专业建设指导委员会年会', '金融科技专业人才培养方案专家论证会召开',
      '《2026年专业设置动态调整方案》发布', '环境工程技术专业完成省级重点专业验收',
    ],
    summaries: [
      '教育部公布2026年度普通高等学校本科专业备案和审批结果，我校申报的人工智能、智能制造工程2个职业本科专业成功获批。',
      '经省教育厅推荐、专家评审、公示，我校软件技术、大数据技术、信息安全与管理3个专业入选省级一流本科专业建设点。',
    ],
  },
  'first-class-course': {
    titles: [
      '我校新增8门省级一流本科课程', '《Python程序设计》等3门课程获批国家级一流本科课程',
      '校级首批精品在线开放课程建设立项', '《职业素养与工匠精神》课程思政示范课开讲',
      '智慧教学平台新上线课程260门，使用率达92%', '虚拟仿真实验教学中心新增5个实验项目',
    ],
    summaries: [
      '广东省教育厅公布2026年省级一流课程名单，我校申报的8门课程全部入选，覆盖线上、线下、混合式等多种类型。',
      '继《Python程序设计》之后，《大数据技术》《物联网系统集成》2门课程获批国家级一流本科课程。',
    ],
  },
  'first-class-teacher': {
    titles: [
      '2026年校级教学成果奖评选结果揭晓：一等奖10项、二等奖20项', '我校荣获2026年省级教学成果奖一等奖3项、二等奖5项',
      '2026年职业教育国家级教学成果奖推荐名单公示', '《职业本科"四链贯通"人才培养模式探索与实践》教学成果奖报告发布',
      '关于组织申报2026年高等教育（职业教育）国家级教学成果奖的通知', '教学成果奖励办法（2026年修订版）印发',
    ],
    summaries: [
      '经个人（团队）申报、学院推荐、专家评审、教学工作委员会审议，2026年校级教学成果奖共评出一等奖10项、二等奖20项、三等奖25项。',
      '广东省教育厅公布2026年省级教学成果奖获奖名单，我校收获颇丰。',
    ],
  },
  'guide-student': {
    titles: ['学生休学申请办理指南', '学生成绩复议流程说明', '学生转专业办理指引', '学生毕业手续办理须知'],
    summaries: ['在校学生办理休学、复学、转专业等学籍异动手续的完整流程和所需材料说明。'],
  },
  'guide-teacher': {
    titles: ['教师调课申请流程', '教师教材申报指南', '教师教学考核办法', '教师项目申报说明'],
    summaries: ['教师办理调课、代课、教材申报、项目申报等办事流程指引。'],
  },
  'regulation-national': {
    titles: ['教育部《关于深化新时代职业教育教学改革的意见》', '《国家职业教育改革实施方案》全文', '广东省职业教育条例', '《职业本科学校设置标准》'],
    summaries: ['国家及省市发布的职业教育相关政策文件汇总。'],
  },
  'regulation-school': {
    titles: ['深圳信息职业技术大学教学管理规定', '《学生学籍管理办法》（2026修订版）', '《教学工作量计算办法》', '《课程考核管理办法》'],
    summaries: ['学校及教务处制定的教学管理规章制度汇编。'],
  },
}

// ========== 事项页数据(需求 5.2 事项页模板:办理对象→流程→材料→时限→联系→附件) ==========
export interface GuideItem {
  id: number
  title: string // 事项名称
  description?: string // 事项简介
  columnSlug: string // 所属栏目(guide-student/teacher/visitor)
  target: string // 办理对象
  process: string[] // 办理流程(步骤)
  materials: string[] // 所需材料
  duration: string // 办理时限
  contactDept: string // 联系业务
  contactPhone: string // 联系电话
  notes?: string[] // 注意事项
  attachments: { name: string; size: string }[] // 相关附件
}

export const guideItems: GuideItem[] = [
  // ========== 学生办事（16项） ==========
  {
    id: 2001, title: '休学办理',
    description: '学生因个人原因或身体状况申请暂停学业，保留学籍资格的手续办理流程。',
    columnSlug: 'guide-student',
    target: '在校全日制学生（入伍、伤病、创业等原因）',
    process: ['学生登录教务管理系统提交休学申请', '上传相关证明材料扫描件', '所在学院教学办公室审核签署意见', '教务处学籍科审批并备案', '系统生成休学证明，学生可自行打印或到学籍科领取'],
    materials: ['深圳信息职业技术大学休学申请表（系统填写后打印签字）', '学生证原件', '因伤病休学：二级甲等以上医院诊断证明及建议休学的医疗意见', '因入伍休学：入伍通知书复印件', '因创业休学：营业执照复印件及创业项目计划书'],
    duration: '材料齐全后5个工作日',
    contactDept: '学籍科', contactPhone: '0755-89226666-8002',
    notes: ['休学期间不享受在校生待遇，不参与评优评奖', '休学最长累计时限不得超过两年', '休学期满前一个月应提交复学申请'],
    attachments: [{ name: '休学申请表.docx', size: '32KB' }, { name: '休学办理流程图.pdf', size: '128KB' }, { name: '学生学籍管理规定.pdf', size: '512KB' }],
  },
  {
    id: 2002, title: '复学办理',
    description: '休学期满或提前结束休学状态，申请恢复学籍继续学业的办理流程。',
    columnSlug: 'guide-student',
    target: '已办理休学手续的在校学生',
    process: ['休学期满前30日内向所在学院提交复学申请', '因伤病休学的需提交康复证明', '所在学院审核是否同意复学', '教务处学籍科审批并恢复学籍状态', '系统恢复选课及成绩登录权限'],
    materials: ['复学申请表', '学生证原件', '因伤病休学：二级甲等以上医院康复证明', '因入伍休学：退伍证复印件', '休学期间思想总结及学习计划'],
    duration: '5个工作日',
    contactDept: '学籍科', contactPhone: '0755-89226666-8002',
    notes: ['逾期未申请复学且未办理延期手续的，按自动退学处理', '复学后编入下一年级相同专业学习'],
    attachments: [{ name: '复学申请表.docx', size: '30KB' }],
  },
  {
    id: 2003, title: '转专业申请',
    description: '符合转专业条件的学生，申请转入其他专业学习的办理流程。',
    columnSlug: 'guide-student',
    target: '在校全日制一年级学生（无纪律处分、成绩合格）',
    process: ['学校公布年度转专业工作方案', '学生在规定时间登录教务系统提交转专业申请', '学生到拟转入学院报名参加转专业考核', '转入学院组织笔试+面试考核并公示拟录取名单', '教务处复核审批并办理学籍异动手续'],
    materials: ['转专业申请表（系统导出）', '在读期间成绩单（需学院盖章）', '拟转入专业要求的其他证明材料（如作品集、获奖证书等）'],
    duration: '考核结束后15个工作日完成审批',
    contactDept: '学籍科', contactPhone: '0755-89226666-8002',
    notes: ['每名学生在校期间只能申请转专业一次', '订单班、中外合作办学等特殊招生形式学生不可转专业', '转专业后需按新专业培养方案补修相应课程'],
    attachments: [{ name: '转专业申请表.docx', size: '35KB' }, { name: '转专业管理办法.pdf', size: '480KB' }],
  },
  {
    id: 2004, title: '成绩证明开具',
    description: '学生因就业、升学、留学等需要，申请开具官方成绩单或在读/毕业证明的流程。',
    columnSlug: 'guide-student',
    target: '在校生（中文成绩单、在读证明）及往届毕业生（中文/英文成绩单、毕业/学位证明）',
    process: ['在校生：登录教务系统→学生中心→成绩证明→自助生成PDF→线上申请盖章或自助机打印', '毕业生：携带身份证到教务处办事窗口，或通过学校官网"成绩证明"入口线上申请', '需英文成绩单的，上传英文翻译件经教务科审核后出具中英对照版', '加盖教务处公章后生效，如需密封加盖骑缝章请说明'],
    materials: ['在校学生：学生证或校园卡', '毕业生：身份证或毕业证书编号', '英文成绩单：自行翻译的英文Word版本（用于审核对照）'],
    duration: '自助证明即时办理，人工审核英文证明3个工作日',
    contactDept: '学籍科', contactPhone: '0755-89226666-8002',
    notes: ['每生每学期可免费出具5份中文成绩单，超出部分每份5元', '英文成绩单审核盖章不额外收费', '自助打印终端设在行政楼一楼大厅'],
    attachments: [{ name: '成绩证明申请表.docx', size: '28KB' }, { name: '英文成绩单模板.zip', size: '120KB' }],
  },
  {
    id: 2005, title: '学籍证明（在读/毕业）',
    description: '用于各类报名资格审查、资格认定、落户申请等的学籍学历证明办理。',
    columnSlug: 'guide-student',
    target: '在校生（在读证明）、毕业生（学历证明）',
    process: ['方式一：行政楼自助终端机凭学生证/身份证打印在读证明（即时）', '方式二：教务系统下载电子版→学院盖章→教务处盖章', '方式三：学信网下载《教育部学籍在线验证报告》（具有同等效力）'],
    materials: ['学生证/身份证', '需多份加盖公章的请说明份数和用途'],
    duration: '自助打印即时办理，人工盖章1个工作日',
    contactDept: '学籍科', contactPhone: '0755-89226666-8002',
    notes: ['教育部学籍在线验证报告效力等同于学校开具的在读证明', '考研、考公、专升本等一般可直接使用学信网验证报告'],
    attachments: [{ name: '在读证明模板（中英双语）.docx', size: '42KB' }],
  },
  {
    id: 2006, title: '选课退改选',
    description: '每学期选课期间，学生进行课程选择、退选、改选的操作流程及注意事项。',
    columnSlug: 'guide-student',
    target: '所有需修课的在校学生',
    process: ['第一轮选课（预选）：查看专业推荐课表，选择本专业必修+选修，不限人数随机抽签', '第二轮选课（正选）：查看中签结果，补选未满课程，超量班级先到先得', '退改选阶段：开学前2周可退课/改选（注意：已点名的课程不可退）', '确认选课结果：在"课表查询"中核对无误后截图留存'],
    materials: ['无（全程线上操作，教务系统）'],
    duration: '各阶段共约3周，以选课通知为准',
    contactDept: '教务科', contactPhone: '0755-89226666-8001',
    notes: ['体育课、实验课等特殊课程不可跨专业选', '超过选课学分上限需学院审核', '未选上的课程不可直接参加学习和考试'],
    attachments: [{ name: '选课操作指南.pdf', size: '256KB' }, { name: '选课常见问题解答.docx', size: '64KB' }],
  },
  {
    id: 2007, title: '补考与重修申请',
    description: '期末考核不及格学生参加补考或重修的报名流程与管理规定。',
    columnSlug: 'guide-student',
    target: '课程期末考试不及格的学生',
    process: ['成绩公布后查看不及格课程清单', '开学前3周关注教务系统补考报名通知', '在规定时间内登录教务系统提交补考报名', '打印准考证并按时参加补考', '补考仍不及格：后续学期开学时在教务系统提交重修报名，随下一年级修读'],
    materials: ['补考/重修报名费（在线支付）', '准考证（考前3天系统下载）'],
    duration: '补考：开学第2-3周进行；重修：随下一年级开课学期办理',
    contactDept: '教务科', contactPhone: '0755-89226666-8001',
    notes: ['毕业资格审查前，所有不及格课程必须补考或重修通过', '每门课程最多可重修2次，超过需特别申请', '旷考、作弊的课程不得参加补考，直接进入重修'],
    attachments: [{ name: '补考报名流程指南.pdf', size: '320KB' }],
  },
  {
    id: 2008, title: '课程免修申请',
    description: '学生已通过其他方式学习并掌握某门课程内容，申请免修该课程并直接考核。',
    columnSlug: 'guide-student',
    target: '学习成绩优异、有相关证书或同等学力证明的学生',
    process: ['每学期开学第1周，向所在学院提交免修申请表', '附上相关学习证明（MOOC证书、同等课程成绩单、技能证书等）', '课程所在教研室组织考核或认定', '学院审核通过后报教务处备案', '教务系统标注免修，学生可直接参加期末考核或按认定成绩记录'],
    materials: ['课程免修申请表', '相关学习证明材料（证书、成绩单、课程证书等）', '已自学完成的课程笔记或作业（可选）'],
    duration: '开学后2周内完成审批',
    contactDept: '教务科', contactPhone: '0755-89226666-8001',
    notes: ['思想政治课、体育课、实验课、毕业实习、毕业设计等不得申请免修', '免修比例不得超过毕业学分的15%'],
    attachments: [{ name: '课程免修申请表.docx', size: '32KB' }],
  },
  {
    id: 2009, title: '缓考申请',
    description: '学生因特殊原因不能参加正常考试，申请延后参加考试的办理流程。',
    columnSlug: 'guide-student',
    target: '因病住院、直系亲属丧事、代表学校参加重要公务等无法参加考试的学生',
    process: ['考试前向学院提交缓考申请表和相关证明', '因病缓考的需提供二级甲等以上医院诊断证明', '学院教学办公室审核同意后报教务科', '教务科备案后，学生可在规定的缓考时间参加考试'],
    materials: ['缓考申请表（需辅导员签字）', '因病：二级甲等以上医院诊断证明+病历+缴费凭证', '因公务：学校相关部门出具的公务派遣证明'],
    duration: '考试前提交，3个工作日内审批',
    contactDept: '教务科', contactPhone: '0755-89226666-8001',
    notes: ['一般不适用于开卷考试、考查课', '未提前申请、事后补交材料的不予受理', '缓考一般安排在下学期开学初，与补考同期进行'],
    attachments: [{ name: '缓考申请表.docx', size: '28KB' }],
  },
  {
    id: 2010, title: '成绩复核申请',
    description: '学生对期末考试成绩有异议，申请查阅试卷或复核成绩的办理流程。',
    columnSlug: 'guide-student',
    target: '所有对课程成绩有疑问的在校学生',
    process: ['成绩公布后5个工作日内，向学院教学办公室提交成绩复核申请表', '学院安排课程任课教师与教学秘书共同复核试卷', '复核结果书面通知学生本人', '确有计分错误的，由任课教师提交成绩变更申请，教务科修改成绩并记录'],
    materials: ['成绩复核申请表', '成绩单截图或准考证号'],
    duration: '5-7个工作日内反馈复核结果',
    contactDept: '教务科', contactPhone: '0755-89226666-8001',
    notes: ['复核只检查核分、登分错误，不重新评阅评分标准', '学生本人不得直接查阅试卷，由教务部门复核'],
    attachments: [{ name: '成绩复核申请表.docx', size: '24KB' }],
  },
  {
    id: 2011, title: '毕业资格审核',
    description: '应届毕业生毕业资格、学位授予资格的审查流程与结果公示。',
    columnSlug: 'guide-student',
    target: '所有应届毕业生（含延长学制学生）',
    process: ['第7学期末：学生自查毕业学分完成情况，对照本专业培养方案', '第8学期第3周：学院初审毕业资格，公示初审名单', '第8学期第6周：教务处复审毕业资格与学位授予资格', '最终资格公示5个工作日，接受学生申诉', '制发毕业证书与学位证书，安排毕业典礼授予'],
    materials: ['毕业资格审核表（系统生成）', '在校完整成绩单', '顶岗实习证明（职业本科专业）', '毕业设计/论文最终稿归档确认单'],
    duration: '毕业学期3-6月集中审核，30个工作日',
    contactDept: '学籍科', contactPhone: '0755-89226666-8002',
    notes: ['毕业资格审核前需还清图书、退寝、缴清学费', '通过CET-4或校级学位英语考试方可申请学士学位'],
    attachments: [{ name: '毕业资格审核表.docx', size: '40KB' }, { name: '学位授予实施细则.pdf', size: '384KB' }],
  },
  {
    id: 2012, title: '毕业证书/学位证书补办',
    description: '毕业证书或学位证书遗失、损坏后，申请补办学历学位证明书的流程。',
    columnSlug: 'guide-student',
    target: '本校毕业的往届毕业生（证书遗失或损毁）',
    process: ['携带本人身份证原件到教务处学籍科申请', '填写《学历学位证明书申请表》', '教务处核实毕业信息后，出具加盖公章的毕业证明书/学位证明书（与原证书效力等同）', '如需邮寄请提供EMS收件地址并支付邮费'],
    materials: ['身份证原件及复印件', '近期免冠蓝底证件照（2寸，2张+电子版）', '学信网学历备案表（打印版）'],
    duration: '10个工作日',
    contactDept: '学籍科', contactPhone: '0755-89226666-8002',
    notes: ['按教育部规定，原毕业证书/学位证书遗失后不予补发原件，只能出具证明书', '证明书与原件具有同等法律效力，可用于考研、考公、求职、落户等'],
    attachments: [{ name: '学历学位证明书申请表.docx', size: '36KB' }],
  },
  {
    id: 2013, title: 'CET四六级考试报名',
    description: '大学英语四六级考试（CET-4/6）的报名条件、流程与注意事项。',
    columnSlug: 'guide-student',
    target: '全日制在校生（CET-4修完大学英语四级课程；CET-6需CET-4≥425分）',
    process: ['关注考试科发布的报名通知', '登录CET全国网上报名系统（https://cet-bm.neea.edu.cn）注册', '确认个人学籍信息，选择考点（本校）和科目', '网上缴费（报名费约30元/科目）', '考前10天下载准考证，携带身份证+学生证+准考证参加考试'],
    materials: ['有效身份证原件', '学生证', '2寸免冠电子照片（白底，按报名系统要求）', '报名缴费（线上支付）'],
    duration: '报名窗口期约10天，考试时间通常为6月和12月的第三个周六',
    contactDept: '考试科', contactPhone: '0755-89226666-8003',
    notes: ['一经缴费不可退费、不可变更科目', '缺考将被禁考下一次考试', '请务必在本校考点报考，跨校报考成绩不予承认'],
    attachments: [{ name: '四六级考生须知.pdf', size: '180KB' }, { name: 'CET报名操作手册.docx', size: '420KB' }],
  },
  {
    id: 2014, title: '顶岗实习办理',
    description: '职业本科/高职专业学生岗位实习的报名、单位落实、过程管理流程。',
    columnSlug: 'guide-student',
    target: '三年级（高职）或四年级（职业本科）需参加顶岗实习的学生',
    process: ['实习前一学期末：学院发布实习单位清单或学生自行联系单位（需学院审核）', '签订三方协议（学校-实习单位-学生），购买实习责任险', '到实践科办理实习登记备案', '实习过程：每周提交周记，指导教师每月至少1次走访', '实习结束：提交实习报告+实习鉴定表+企业盖章证明，进行实习答辩'],
    materials: ['顶岗实习申请表', '三方实习协议（学校统一模板）', '实习单位接收函', '家长知情同意书', '实习周记本+实习报告模板'],
    duration: '实习前1个月备案，整个实习过程3-6个月',
    contactDept: '实践科', contactPhone: '0755-89226666-8006',
    notes: ['实习单位需与专业对口，禁止在娱乐场所实习', '实习期间需购买实习责任险，费用由学校承担', '自行联系的单位需经指导教师和学院审核同意'],
    attachments: [{ name: '实习手册.pdf', size: '1.2MB' }, { name: '三方实习协议模板.docx', size: '56KB' }],
  },
  {
    id: 2015, title: '创新创业学分认定',
    description: '学生通过学科竞赛、科研、创业、技能证书等获取的创新创业学分认定流程。',
    columnSlug: 'guide-student',
    target: '有创新成果、学科竞赛获奖、创业项目、技能等级证书的学生',
    process: ['登录教务系统→创新创业→学分认定申请', '上传证明材料扫描件（证书、项目文件、论文、营业执照等）', '学院创新创业教研室审核认定', '教务处复核后将学分计入培养方案创新学分模块'],
    materials: ['创新创业学分认定申请表', '支撑材料：竞赛获奖证书/专利证书/论文录用通知/营业执照/职业资格证书等'],
    duration: '每学期第8-10周集中受理，10个工作日内完成认定',
    contactDept: '教研科', contactPhone: '0755-89226666-8005',
    notes: ['每证对应1-6个创新学分不等，具体对照《创新创业学分认定标准》', '超出的创新学分可按学校规定抵充选修学分'],
    attachments: [{ name: '创新创业学分认定标准.pdf', size: '320KB' }, { name: '学分认定申请表.docx', size: '42KB' }],
  },
  {
    id: 2016, title: '国家助学贷款/奖助学金申请',
    description: '家庭经济困难学生申请国家奖助学金、助学贷款、临时困难补助等的流程指引。',
    columnSlug: 'guide-student',
    target: '家庭经济困难的在校全日制学生',
    process: ['9月份：新生登录"国家开发银行高校助学贷款系统"或生源地助学贷款系统申请', '9-10月：班级/学院评议认定家庭经济困难学生资格', '10-11月：国家奖学金、励志奖学金、助学金申请（按通知要求提交材料）', '学院公示推荐名单→学校学生处审核→省教育厅备案→资金发放'],
    materials: ['家庭经济困难学生认定申请表', '国家开发银行生源地贷款申请表', '低保证/低保边缘证/特困人员救助供养证（如有）', '残疾证或重大疾病诊断证明（如有）', '奖助学金：学年成绩单、获奖证书复印件、申请书'],
    duration: '9-12月进行申请与认定，奖助学金12月底前发放',
    contactDept: '学生处学生资助中心（行政楼2楼）', contactPhone: '0755-89226666-2001',
    notes: ['奖助学金不可重复领取，国家奖学金与励志奖学金不可兼得', '本指南主要由学生处负责，教务处负责成绩核查与学分配合'],
    attachments: [{ name: '学生资助政策手册.pdf', size: '1.5MB' }, { name: '家庭经济困难认定表.docx', size: '48KB' }],
  },

  // ========== 教师办事（14项） ==========
  {
    id: 3001, title: '调课申请',
    description: '教师因特殊原因需调整上课时间、地点或授课教师的申请审批流程。',
    columnSlug: 'guide-teacher',
    target: '专任教师、兼课教师、外聘教师',
    process: ['方式一：系统线上申请：教务系统→教师调课→填写调课原因、停课/补课安排', '方式二：紧急情况先电话报备教学科，后2日内补填调课单', '所在学院教学办公室审核→教务处教学科审批', '审批通过后系统自动短信通知学生，课表同步更新'],
    materials: ['调课申请表（系统填写）', '调课原因证明：会议通知、培训函件、就医证明、出差审批单等'],
    duration: '材料齐全后3个工作日',
    contactDept: '教学科', contactPhone: '0755-89226666-8004',
    notes: ['每门课程一学期调课不得超过3次，超过须分管教学副校长审批', '调课须安排补课，课时不得减少', '原则上不得将课程安排在双休日或晚上补课'],
    attachments: [{ name: '调课申请表.docx', size: '30KB' }, { name: '调课管理规定.pdf', size: '256KB' }],
  },
  {
    id: 3002, title: '课程考核方式调整申请',
    description: '因教学改革需要，申请将课程期末考试调整为考查、项目式考核、过程性考核等方式的流程。',
    columnSlug: 'guide-teacher',
    target: '课程负责人或课程组',
    process: ['提交课程考核方式调整申请表及考核方案', '说明调整理由：如项目化教学改革、岗课赛证融合等', '所在学院教学工作委员会审核', '教务处教学科审批备案', '按审批通过的考核方案组织考核，成绩录入系统时注明考核方式'],
    materials: ['课程考核方式调整申请表', '调整后的课程考核方案（含各环节占比、评分标准）', '课程教学大纲修订对照稿'],
    duration: '开学后第4周前提交申请，10个工作日内审批',
    contactDept: '教学科', contactPhone: '0755-89226666-8004',
    notes: ['专业核心课、考试课原则上不得调整为纯考查课', '调整后的考核方案须在第一次课向学生说明并写入课程简介'],
    attachments: [{ name: '考核方式调整申请表.docx', size: '36KB' }],
  },
  {
    id: 3003, title: '教室借用申请',
    description: '校内举办活动、学生竞赛培训、讲座等需临时借用教室的申请流程。',
    columnSlug: 'guide-teacher',
    target: '全校教职工（学生组织借用需由指导教师代办）',
    process: ['登录智慧校园-教室预约系统，选择可用教室和时间段', '填写借用事由、人数、活动方案等信息', '教务处综合科审核（如涉及多媒体设备会联动信息中心）', '审批通过后系统自动发送确认短信，凭预约号开教室门'],
    materials: ['教室借用申请表（系统填写）', '活动方案或会议议程', '学生活动需指导教师签名同意'],
    duration: '提前1-5个工作日预约，2个工作日内审批',
    contactDept: '综合科', contactPhone: '0755-89226666-8000',
    notes: ['原则上不得借用正处于上课时段的教室', '使用后应恢复教室整洁，关闭设备电源、门窗', '多媒体设备使用不当造成损坏需照价赔偿'],
    attachments: [{ name: '教室借用申请表.docx', size: '32KB' }, { name: '教室使用须知.pdf', size: '128KB' }],
  },
  {
    id: 3004, title: '教学资料油印/印刷',
    description: '课程教学大纲、实验指导书、试卷等教学资料的校内文印室印制申请流程。',
    columnSlug: 'guide-teacher',
    target: '专任教师、课程负责人、教研室主任',
    process: ['登录OA-教务处-教学资料印制申请', '上传电子版资料（需加密的试卷走保密通道）', '选择规格（黑白/彩色、A4/A3、装订方式、份数）', '综合科审批后转文印室印制', '印制完成后短信通知领取'],
    materials: ['油印/印刷申请表（OA系统）', '需印制资料电子版（PDF格式最佳）'],
    duration: '普通资料2个工作日，试卷类保密印制3个工作日',
    contactDept: '综合科', contactPhone: '0755-89226666-8000',
    notes: ['超过200页的彩色印刷需提前5个工作日预约', '期末试卷须由命题教师本人或教学秘书亲自送交保密印制', '印制错误系资料格式问题的，费用由申请教师所在学院承担'],
    attachments: [{ name: '油印申请表.docx', size: '28KB' }],
  },
  {
    id: 3005, title: '教学改革研究项目申报',
    description: '校级、省级、国家级教学改革与教学研究项目的申报推荐流程。',
    columnSlug: 'guide-teacher',
    target: '专任教师、教学团队负责人（校级项目须工作满2年）',
    process: ['关注教研科发布的项目申报通知（通常10-11月）', '查阅申报指南，组建项目组，填写项目申报书', '学院组织初审推荐，公示推荐名单', '报送教务处教研科，学校组织专家评审', '公示立项名单，下达立项通知书，签订合同书，拨付经费'],
    materials: ['教学改革研究项目申报书', '项目可行性论证报告', '学院推荐意见（院长签字盖章）', '相关前期研究成果支撑材料（论文、获奖、专利等）'],
    duration: '申报期约2周，专家评审约4周，公示5个工作日',
    contactDept: '教研科', contactPhone: '0755-89226666-8005',
    notes: ['同一教师同一年度不得主持申报超过1项、参与超过2项校级以上项目', '校级项目周期一般2年，须按期结题并提交结题报告'],
    attachments: [{ name: '教学项目申报书.docx', size: '48KB' }, { name: '项目申报指南.pdf', size: '512KB' }],
  },
  {
    id: 3006, title: '教材选用与征订',
    description: '每学期各课程选用教材、办理教材征订的规范流程。',
    columnSlug: 'guide-teacher',
    target: '各课程负责人、教研室主任',
    process: ['每学期第10周前后，关注教务处发布的下学期教材征订通知', '登录教材管理系统，为所负责课程选用教材（优先选用"马工程"重点教材、国家级规划教材）', '填写教材选用论证意见，教研室审核', '学院教材建设工作组审核后报考试科（教材科）', '教材科统一集中招标采购，开学前组织发放到学生'],
    materials: ['教材选用审批表', '新版教材样书（如需更换教材）', '教材选用论证报告（首次选用或更换教材）'],
    duration: '每学期第10-14周完成教材选用与征订',
    contactDept: '考试科（教材科）', contactPhone: '0755-89226666-8003',
    notes: ['一门课程一个学期只能选用一种教材', '自编教材须经校教材委员会审核通过方可使用', '未经审批征订的教材不得向学生收取费用'],
    attachments: [{ name: '教材征订单.xlsx', size: '24KB' }, { name: '教材选用与管理办法.pdf', size: '384KB' }],
  },
  {
    id: 3007, title: '教材自编/讲义出版申请',
    description: '教师申请编写校内自用讲义或正式出版规划教材的立项资助流程。',
    columnSlug: 'guide-teacher',
    target: '有教学积累、课程连续开设3轮以上的教师或教学团队',
    process: ['提交自编教材（讲义）立项申请表', '附编写大纲、章节目录、适用专业说明、样章', '学院教材建设工作组初审推荐', '学校教材建设委员会评审立项', '编写完成后教材科统一组织印制或对接出版社'],
    materials: ['自编教材/讲义立项申请表', '教材编写大纲', '1-2章的样章试写稿', '适用专业及开课计划证明'],
    duration: '3月、9月集中受理，评审约15个工作日',
    contactDept: '考试科（教材科）', contactPhone: '0755-89226666-8003',
    notes: ['校级规划教材可获1-3万元编写资助', '讲义仅限在校内教学使用，不得对外销售'],
    attachments: [{ name: '自编教材立项申请表.docx', size: '40KB' }],
  },
  {
    id: 3008, title: '教学工作量核算与核对',
    description: '学期末教师教学工作量（理论课、实验课、指导实习、指导论文等）的统计核对流程。',
    columnSlug: 'guide-teacher',
    target: '所有承担教学任务的专任教师、兼课教师、外聘教师',
    process: ['学期教学任务确定后，系统自动生成初算工作量', '第16-17周：教师登录教务系统→教学工作量，核对数据', '有误的附证明材料向学院教学秘书提出复核', '学院汇总、核对、公示后上报教学科', '教学科终审，作为绩效/课酬发放依据'],
    materials: ['工作量核算表（系统导出）', '调课记录、批改作业量、指导学生人数等证明材料（如有异议时）'],
    duration: '学期第16-18周，2周内完成核对终审',
    contactDept: '教学科', contactPhone: '0755-89226666-8004',
    notes: ['请务必在公示期内核对，过期不予受理', '毕业论文指导工作量由实践科核对后汇总'],
    attachments: [{ name: '教学工作量核算办法.pdf', size: '320KB' }],
  },
  {
    id: 3009, title: '期末命题与试卷提交',
    description: '每学期期末考试课程的命题、审核、送印及归档规范流程。',
    columnSlug: 'guide-teacher',
    target: '所有承担期末考试课程命题任务的教师',
    process: ['第12周前：确定命题教师（同课程需2人命题，形成A/B卷）', '命题按学校统一试卷模板，难易度、题量符合大纲要求', '教研室/课程组讨论审题→学院教学副院长审核签字', '第14周前将A/B卷+参考答案+评分标准（电子版+纸质密封版）送考试科保密印制', '考试结束后，试卷统一装订交学院存档'],
    materials: ['期末试卷A/B卷（按统一模板排版）', '参考答案及评分标准（Word/PDF）', '试卷审核表（教研室、学院两级签字）'],
    duration: '第12-14周命题，考试周前2周送印完毕',
    contactDept: '考试科', contactPhone: '0755-89226666-8003',
    notes: ['A/B卷重复率不得超过30%，近三年试题重复率不得超过40%', '严禁泄题，命题教师不得以任何形式给学生划考试范围', '提交的电子版试卷需加密后通过保密通道上传'],
    attachments: [{ name: '期末考试命题规范.pdf', size: '256KB' }, { name: '试卷模板.docx', size: '64KB' }],
  },
  {
    id: 3010, title: '成绩录入与变更',
    description: '课程考核结束后，任课教师登录教务系统录入成绩、打印成绩单并归档、后期变更成绩申请的流程。',
    columnSlug: 'guide-teacher',
    target: '所有课程任课教师、课程负责人',
    process: ['课程考核结束后7个工作日内，登录教务系统→成绩录入', '按系统要求录入平时、期中、期末成绩，系统自动核算总评', '保存后提交，打印一式两份成绩单签字盖章，一份交学院教学秘书，一份自留', '成绩提交后确需修改的，填写"成绩变更申请单"，说明变更原因，学院签字→教务科审批→系统修改记录'],
    materials: ['学生答卷（需妥善保存至少6年）', '成绩分析报告（提交成绩时系统填写）', '成绩变更申请单（仅变更时需要）'],
    duration: '成绩录入：7个工作日内完成；成绩变更：5个工作日内审批',
    contactDept: '教务科', contactPhone: '0755-89226666-8001',
    notes: ['逾期未录入成绩将影响教师年度考核', '成绩一经提交，无正当理由不得随意变更'],
    attachments: [{ name: '成绩录入操作手册.pdf', size: '180KB' }, { name: '成绩变更申请单.docx', size: '26KB' }],
  },
  {
    id: 3011, title: '教学成果奖申报',
    description: '校级、省级、国家级教学成果奖的推荐申报流程。',
    columnSlug: 'guide-teacher',
    target: '在教育教学改革中取得突出成果的集体或个人',
    process: ['每两年（奇数年）教研科发布申报通知', '申报人/团队填写教学成果奖申报书', '准备支撑材料：成果总结报告、论文、教材、应用证明、学生作品等', '学院推荐→学校组织专家评审→公示推荐名单', '报送上级教育主管部门参评'],
    materials: ['教学成果奖申报书', '成果总结报告（不低于5000字）', '支撑材料汇编成册', '应用推广证明（其他院校采用证明、获奖证书等）'],
    duration: '申报期3周，评审2周，公示5个工作日',
    contactDept: '教研科', contactPhone: '0755-89226666-8005',
    notes: ['教学成果须经过不少于2年的教育教学实践检验', '成果署名单位仅限本校，排序应与贡献度一致'],
    attachments: [{ name: '教学成果奖申报书.docx', size: '64KB' }, { name: '教学成果奖励办法.pdf', size: '256KB' }],
  },
  {
    id: 3012, title: '学生毕业论文（设计）指导安排',
    description: '各专业毕业班学生毕业论文（设计）的选题、双选、指导与答辩组织流程。',
    columnSlug: 'guide-teacher',
    target: '具有讲师及以上职称、具备指导资格的教师',
    process: ['第7学期末：教师在毕业论文系统提交选题', '学院审核题目后开放学生选题（双选制）', '双选确定后，师生对接下达任务书，学生开题', '第8学期：每周至少1次面对面指导，过程记录在系统', '答辩：学院组织答辩委员会，按公开答辩流程评分', '成绩评定后归档：论文+开题报告+任务书+答辩记录+评语等'],
    materials: ['毕业论文选题申报表', '毕业论文指导教师资格审核表', '指导记录手册'],
    duration: '第7学期末启动，第8学期5月底前完成答辩',
    contactDept: '实践科', contactPhone: '0755-89226666-8006',
    notes: ['每位教师每届指导学生原则上不超过8人', '论文须进行知网查重，重复率≤30%方可参加答辩', '优秀毕业设计（论文）可推荐参评省级优秀论文'],
    attachments: [{ name: '毕业论文工作手册.pdf', size: '860KB' }, { name: '任务书模板.docx', size: '48KB' }],
  },
  {
    id: 3013, title: '一流课程申报',
    description: '申报校级、省级、国家级一流本科课程（线上、线下、线上线下混合式、社会实践、虚拟仿真）的流程。',
    columnSlug: 'guide-teacher',
    target: '课程开设满3轮、教学效果优良的课程团队',
    process: ['关注教研科发布的一流课程申报通知（每年3-4月）', '对照申报条件，组建课程团队，准备申报书', '录制课程录像、整理教学资源、填报数据', '学院初审推荐→学校评审→择优推荐省级', '立项后建设周期2年，期满验收'],
    materials: ['一流课程申报书', '课程教学大纲、教案、课件', '代表性授课录像（2节完整课堂）', '课程数据：选课人数、学习成效、学生评价、应用推广证明'],
    duration: '申报期约2周，校级评审约3周',
    contactDept: '教研科', contactPhone: '0755-89226666-8005',
    notes: ['校级一流课程可获建设经费5万元/门，省级15万元/门', '优先推荐在智慧教学平台已上线运行的课程'],
    attachments: [{ name: '一流课程申报书.docx', size: '56KB' }, { name: '一流课程建设标准.pdf', size: '320KB' }],
  },
  {
    id: 3014, title: '教学能力大赛报名',
    description: '校级、省级教师教学能力比赛（含教学创新大赛、微课比赛等）的报名参赛流程。',
    columnSlug: 'guide-teacher',
    target: '年龄在50周岁以下、教学评价优良的专任教师',
    process: ['学校每年3-5月组织校级选拔赛，9-10月省级国赛', '关注竞赛通知，组队（1-3人）或个人报名', '准备参赛材料：教学设计、课堂视频、课程报告、现场答辩', '校级比赛评出等级奖，择优确定省赛推荐名单', '推荐团队集中培训备赛，参赛'],
    materials: ['教学能力大赛报名表', '参赛教案（2-4课时）', '课堂实录视频（45分钟或15分钟微课版）', '教学实施报告、人才培养方案、课程标准等辅助材料'],
    duration: '校级赛期约1个月，省级赛约3个月',
    contactDept: '教研科', contactPhone: '0755-89226666-8005',
    notes: ['省级以上获奖者在职称评审、岗位聘任中给予政策倾斜', '获奖课程及团队将在全校推广教学经验'],
    attachments: [{ name: '教学能力大赛方案.pdf', size: '380KB' }],
  },

  // ========== 访客办事（6项） ==========
  {
    id: 4001, title: '社会考试报名（含考生服务）',
    description: '社会考生报考全国计算机等级考试、全国英语等级考试、教师资格证考试（笔试）等本校考点的考试服务。',
    columnSlug: 'guide-visitor',
    target: '社会考生、非本校学生（具体以各考试报名条件为准）',
    process: ['考试科在官网公布当年社会考试报名简章', '登录教育部考试中心官网或广东省教育考试院网上报名系统', '选择深圳信息职业技术大学考点，完成注册、填报信息、上传照片', '网上缴报名费→审核通过→考前10天打印准考证', '考试日携带身份证+准考证+文具到指定考场参加考试'],
    materials: ['有效期内身份证原件', '符合要求的电子照片（蓝底免冠证件照，具体尺寸以系统要求为准）', '报名费用（线上支付，各考试费用不同）'],
    duration: '报名窗口一般10-15天，考试结束后2个月左右可查询成绩并领取证书',
    contactDept: '考试科（社会考试考务组）', contactPhone: '0755-89226666-8003',
    notes: ['请考生关注本校考点入场须知，提前30分钟到达考场', '校园进出需凭准考证+身份证进行登记，外校考生请预留足够时间'],
    attachments: [{ name: '社会考试报名指南.pdf', size: '384KB' }, { name: '考点交通指引.docx', size: '1.1MB' }],
  },
  {
    id: 4002, title: '企业/行业合作对接',
    description: '校外企业、行业协会与学校洽谈产教融合、实习基地、订单培养、横向课题等合作事项的对接流程。',
    columnSlug: 'guide-visitor',
    target: '企业人力资源或校企合作负责人、行业协会/商会代表、政府产业园区部门',
    process: ['方式一：官网下载《校企合作意向书》填写后发送到jwc-hz@sziit.edu.cn', '方式二：电话联系实践科预约对接洽谈时间', '教务处实践科根据合作方向，推荐对应二级学院和专业群', '校企双方对接会谈，拟定合作框架协议', '协议签订后，根据合作内容立项推进'],
    materials: ['企业营业执照副本复印件', '企业简介（含业务领域、人员规模、拟合作方向）', '校企合作意向书或方案', '来访人员名单、职务、身份证号（用于进校登记）'],
    duration: '意向对接3个工作日内响应，协议签订及落地15-30个工作日',
    contactDept: '实践科（校企合作组）', contactPhone: '0755-89226666-8006',
    notes: ['校企合作需符合职业教育法、学校对外合作管理规定', '涉及学生实习、就业推荐的合作，需遵守教育部"三不得"规定'],
    attachments: [{ name: '校企合作意向书模板.docx', size: '36KB' }, { name: '学校校企合作政策.pdf', size: '1.2MB' }],
  },
  {
    id: 4003, title: '来访接待预约（参观访问）',
    description: '兄弟院校、政府部门、社会团体等预约来校参观、交流座谈、调研考察的接待流程。',
    columnSlug: 'guide-visitor',
    target: '兄弟院校教务处/教学副院长团队、教育主管部门工作人员、其他单位来访人员',
    process: ['至少提前5个工作日，将来访公函或单位介绍信传真/邮件至综合科', '注明来访目的、人员名单、职务、拟到访日期、希望交流的内容', '综合科协调相关业务科室和分管处长，确认接待方案并电话回访确认', '来访当日凭身份证在安保处登记，由接待人员带入行政楼会议室'],
    materials: ['来访公函/单位介绍信（盖公章）', '来访人员名单（姓名、性别、单位、职务、身份证号）', '拟交流的提纲或议题'],
    duration: '至少提前5个工作日预约，1个工作日内确认是否可接待',
    contactDept: '综合科（对外接待）', contactPhone: '0755-89226666-8000',
    notes: ['校内参观一般仅限教学区、实训中心、图书馆等公共区域', '如需参观实训室或实验室，需提前与实践科协调，部分涉密区域需另走审批'],
    attachments: [{ name: '来访预约函模板.docx', size: '26KB' }],
  },
  {
    id: 4004, title: '学历/成绩单验证服务（用人单位/第三方机构）',
    description: '用人单位、人才服务中心、留学机构、背景调查公司验证我校毕业生学历、成绩单真实性的流程。',
    columnSlug: 'guide-visitor',
    target: '合法注册的企业HR、人才服务机构、留学背景调查公司',
    process: ['方式一：毕业生本人在学信网申请《教育部学历证书电子注册备案表》发给用人单位验证（免费）', '方式二：发公函至学籍科并附上：授权委托书（有毕业生本人签字）、查询函件、经办人工作证复印件', '学籍科核对存档信息后，5个工作日内书面回复验证结果'],
    materials: ['验证查询函（加盖用人单位公章）', '毕业生本人签署的《授权查询同意书》', '经办人工作证或身份证复印件', '毕业证/学位证/成绩单复印件（需验证的材料）'],
    duration: '5个工作日（以收到完整材料之日起）',
    contactDept: '学籍科（学历认证）', contactPhone: '0755-89226666-8002',
    notes: ['优先推荐学信网在线验证方式，免费、即时、权威', '不接受个人电话口头查询学历信息，必须公函或学信网验证'],
    attachments: [{ name: '学历验证授权同意书.docx', size: '22KB' }],
  },
  {
    id: 4005, title: '继续教育/非学历培训咨询',
    description: '校外人员咨询我校继续教育、职业资格培训、企业定制培训、党政干部培训等非学历培训项目的对接流程。',
    columnSlug: 'guide-visitor',
    target: '社会人员、企业培训负责人、政府事业单位培训主管',
    process: ['方式一：官网继续教育部（继续教育学院）栏目浏览项目介绍、在线报名', '方式二：拨打综合科或继续教育学院公开咨询电话，说明培训需求', '培训专员对接，定制培训方案（课程、师资、时长、地点、费用）', '签订培训合同，缴费后开班授课', '考核合格颁发结业证书或培训证明'],
    materials: ['企业营业执照或事业单位法人证书（团报）', '学员名单（姓名、身份证号、联系方式、职务）', '定制课程需求说明'],
    duration: '定制方案3-5个工作日，开班时间根据双方协商确定',
    contactDept: '综合科 / 继续教育部', contactPhone: '0755-89226666-8000',
    notes: ['职业资格证书类培训必须与官方认定的考培项目一致', '继续教育部在行政楼4楼，可前往现场咨询'],
    attachments: [{ name: '非学历培训项目目录.pdf', size: '2.4MB' }],
  },
  {
    id: 4006, title: '档案查阅/个人成绩单补办（往届校友）',
    description: '毕业多年后需查档、补成绩单、补学历证明等校友服务的办理流程。',
    columnSlug: 'guide-visitor',
    target: '本校往届毕业生（需补办成绩单、学籍档案证明、录取名册等）',
    process: ['本人持身份证原件到校，可委托他人代办（需委托书+代办人身份证）', '到综合科填写校友档案查阅申请表', '综合科协助联系学籍档案室调档复印', '复印件加盖教务处公章后生效（用于考研、职称、调档、留学等）'],
    materials: ['本人身份证原件', '委托书+代办人身份证（代办需提供）', '需查阅的档案内容说明（如：2010级录取名册、2014届成绩单）'],
    duration: '预约后1-2个工作日，大批量查阅需提前5个工作日预约',
    contactDept: '综合科 / 学籍档案室', contactPhone: '0755-89226666-8000',
    notes: ['仅复印档案相关证明，原始档案不得外借', '学校档案保存期限：录取名册、成绩单永久保存；试卷保存6年'],
    attachments: [{ name: '校友查档申请表.docx', size: '28KB' }],
  },
]

function buildListItems(): ListItem[] {
  const items: ListItem[] = []
  const allCols: typeof columns = []
  columns.forEach((c) => {
    allCols.push(c)
    if (c.children && c.children.length) {
      c.children.forEach((sub) => allCols.push(sub))
    }
  })
  let id = 1000
  allCols.forEach((col) => {
    const pool = columnTitlesPool[col.slug] || null
    const titles = pool ? pool.titles : []
    const summaries = pool ? pool.summaries : []
    const count = col.articleCount || 10
    for (let i = 0; i < count; i++) {
      let dateStr: string
      let year: number
      let month: number
      if (i === 0) {
        dateStr = '2026-07-25'; year = 2026; month = 7
      } else if (i === 1) {
        dateStr = '2026-07-22'; year = 2026; month = 7
      } else if (i === 2) {
        dateStr = '2026-07-15'; year = 2026; month = 7
      } else if (i === 3) {
        dateStr = '2026-07-08'; year = 2026; month = 7
      } else if (i === 4) {
        dateStr = '2026-06-28'; year = 2026; month = 6
      } else {
        year = 2024 + ((i + col.order) % 3)
        month = (i % 12) + 1
        const day = ((i * 5 + col.order * 3) % 27) + 1
        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
      const tag1 = tagPool[(i * 2 + col.order) % tagPool.length]
      const tag2 = tagPool[(i * 7 + col.order * 3) % tagPool.length]
      const tag3 = tagPool[(i * 11 + col.order * 5) % tagPool.length]
      const title = titles[i % titles.length] || `${col.title}｜${tag1}工作${i < 12 ? `的${['通知','安排','方案','公示','发布','解读','申报','评选','评审','总结','汇报','通报'][i]}报告` : `深度解读${i}`}`
      const summary = summaries[i % summaries.length] || `本${['通知','公告','文章','报告','解读'][i % 5]}围绕${col.title}栏目重点内容，聚焦${tag1}、${tag2}、${tag3}相关工作事项，明确${['工作目标','实施路径','进度安排','责任分工','保障措施'][i % 5]}，确保高质量完成各项任务。`
      const author = authorPool[(i + col.order) % authorPool.length]
      let coverUrl: string | undefined
      if (col.listStyle === 'card' || col.listStyle === 'gallery') {
        const prompts = [
          'university%20classroom%20teaching%20blue%20academic',
          'students%20group%20study%20modern%20campus',
          'smart%20education%20technology%20classroom%20digital',
          'vocational%20skills%20competition%20students%20robotics',
          'graduation%20ceremony%20university%20students%20celebration',
          'library%20study%20students%20silent%20campus%20blue',
          'laboratory%20experiment%20science%20university%20research',
          'professor%20lecture%20hall%20students%20teaching',
        ]
        coverUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompts[(i + col.order) % prompts.length]}&image_size=landscape_4_3`
      }
      items.push({
        id: id++,
        title,
        summary,
        publishDate: dateStr,
        year,
        month,
        source: sourcePool[(i + col.order) % sourcePool.length],
        author,
        views: 50 + Math.floor((1500 - i * 12 + col.order * 20) / (1 + (Math.floor(i / 5)))),
        tags: Array.from(new Set([tag1, tag2, tag3])).slice(0, 3),
        columnSlug: col.slug,
        columnTitle: col.title,
        isTop: i < 2,
        isImportant: i % 5 === 0,
        hasAttachment: i % 3 === 0,
        coverUrl,
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
  // 摘要
  summary?: string
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
type ArticleRef = { id: number; title: string; summary: string; publishDate: string; source: string; author?: string; views: number; tags: string[]; isTop: boolean; isImportant: boolean; hasAttachment: boolean; columnSlug: string; columnTitle: string }

function buildArticleRefList(): ArticleRef[] {
  const refs: ArticleRef[] = []
  // Banner 文章
  banners.forEach((b) =>
    refs.push({ id: b.id, title: b.title, summary: b.description || '', publishDate: '2026-06-28', source: '教务处', views: 1280, tags: ['教务动态'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'news', columnTitle: '教务动态' }),
  )
  // 教学通知(原 studentNotices 数据复用,对齐新栏目 notice-student)
  studentNotices.forEach((n) => refs.push({ ...n, summary: n.summary, isTop: !!n.isTop, isImportant: !!n.isImportant, hasAttachment: false, columnSlug: 'notice-student', columnTitle: '学生公告' }))
  // 公示公告(原 teacherNotices 数据复用,对齐新栏目 notice-teacher)
  teacherNotices.forEach((n) => refs.push({ ...n, summary: n.summary, isTop: !!n.isTop, isImportant: !!n.isImportant, hasAttachment: false, columnSlug: 'notice-teacher', columnTitle: '教师公告' }))
  // 教务动态(原 newsList 数据复用,对齐新栏目 news)
  newsList.forEach((n) =>
    refs.push({ id: n.id, title: n.title, summary: n.summary, publishDate: n.publishDate, source: '教务处', views: n.views, tags: ['教务动态'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'news', columnTitle: '教务动态' }),
  )
  // 列表项
  allListItems.forEach((it) => refs.push({ id: it.id, title: it.title, summary: it.summary, publishDate: it.publishDate, source: it.source, author: it.author, views: it.views, tags: it.tags, isTop: it.isTop, isImportant: it.isImportant, hasAttachment: it.hasAttachment, columnSlug: it.columnSlug, columnTitle: columns.find((c) => c.slug === it.columnSlug)?.title || '栏目' }))
  // 专题页关联文章(需求 5.2:专题页相关动态文章需可正常跳转,后端可替换为真实文章 ID)
  const topicArticleRefs: ArticleRef[] = [
    { id: 9001, title: '我校与比亚迪签署产教融合战略合作协议', summary: '双方将在新能源汽车领域共建实训基地与课程体系', publishDate: '2026-05-20', source: '实践科', views: 580, tags: ['产教融合'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'practice', columnTitle: '实践教学' },
    { id: 9002, title: '产业学院 2026 年招生工作启动', summary: '六大产业学院面向全校招收新生,实行校企双导师制', publishDate: '2026-04-15', source: '教研科', views: 420, tags: ['产教融合'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'practice', columnTitle: '实践教学' },
    { id: 9003, title: '校企联合课程开发研讨会顺利召开', summary: '30 余家企业代表与学校教师共商课程共建方案', publishDate: '2026-03-28', source: '教学科', views: 350, tags: ['产教融合'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'practice', columnTitle: '实践教学' },
    { id: 9101, title: '2026 级职业本科人才培养方案论证会召开', summary: '邀请行业专家与企业代表共同论证 12 个本科专业培养方案', publishDate: '2026-06-10', source: '教研科', views: 510, tags: ['职教本建设'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'construction', columnTitle: '教学建设' },
    { id: 9102, title: '职业本科课程标准建设推进会', summary: '部署本科课程标准修订工作,强化岗课对接', publishDate: '2026-05-18', source: '教学科', views: 380, tags: ['职教本建设'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'construction', columnTitle: '教学建设' },
    { id: 9103, title: '首届职业本科毕业设计展顺利举办', summary: '展示本科毕业生真实项目成果,企业现场对接', publishDate: '2026-04-20', source: '实践科', views: 460, tags: ['职教本建设'], isTop: false, isImportant: false, hasAttachment: false, columnSlug: 'construction', columnTitle: '教学建设' },
    { id: 9201, title: '关于组织 2026 年广东省职业院校技能大赛报名的通知', summary: '各学院请于 8 月 10 日前完成报名工作', publishDate: '2026-07-15', source: '教研科', views: 890, tags: ['技能竞赛'], isTop: true, isImportant: true, hasAttachment: true, columnSlug: 'competition', columnTitle: '技能竞赛' },
    { id: 9202, title: '2026 年全国职业院校技能大赛获奖公示', summary: '我校代表队在国赛中获 6 金 8 银好成绩', publishDate: '2026-07-08', source: '教研科', views: 1200, tags: ['技能竞赛'], isTop: false, isImportant: true, hasAttachment: false, columnSlug: 'competition', columnTitle: '技能竞赛' },
    { id: 9203, title: '校级技能竞赛月活动方案', summary: '6 月开展校级技能竞赛,覆盖全部专业', publishDate: '2026-06-25', source: '教学科', views: 530, tags: ['技能竞赛'], isTop: false, isImportant: false, hasAttachment: true, columnSlug: 'competition', columnTitle: '技能竞赛' },
  ]
  refs.push(...topicArticleRefs)
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
  author?: string
  columnSlug: string
  columnTitle: string
  url: string
  highlight?: string
  tags?: string[]
}

// 全文搜索(标题 + 摘要 + 标签)
export function searchArticles(keyword: string): SearchResult[] {
  if (!keyword || !keyword.trim()) return []
  const kw = keyword.trim()
  const kwLower = kw.toLowerCase()
  const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig')
  const results: SearchResult[] = []
  for (const a of allArticleRefs) {
    const summary = a.summary || ''
    const tags = a.tags || []
    const text = (a.title + ' ' + summary + ' ' + tags.join(' ')).toLowerCase()
    let score = 0
    if (a.title.toLowerCase().includes(kwLower)) { score += 10 }
    if (summary.toLowerCase().includes(kwLower)) { score += 4 }
    if (tags.some((t: string) => t.toLowerCase().includes(kwLower))) { score += 3 }
    if (score === 0) continue
    let highlight = summary
    const firstMatch = highlight.toLowerCase().indexOf(kwLower)
    if (firstMatch >= 0) {
      const start = Math.max(0, firstMatch - 40)
      const end = Math.min(highlight.length, firstMatch + kw.length + 120)
      highlight = (start > 0 ? '…' : '') + highlight.slice(start, end).replace(kwRegex, (m) => `<em>${m}</em>`) + (end < highlight.length ? '…' : '')
    } else {
      highlight = a.title.replace(kwRegex, (m) => `<em>${m}</em>`)
    }
    const author = (a as any).author || undefined
    const result: SearchResult & { score: number } = {
      id: a.id,
      title: a.title.replace(kwRegex, (m) => `<em>${m}</em>`),
      summary: a.summary,
      publishDate: a.publishDate,
      source: a.source,
      author,
      columnSlug: a.columnSlug,
      columnTitle: a.columnTitle,
      tags: a.tags,
      url: `/article/${a.id}`,
      highlight,
      score,
    }
    results.push(result)
  }
  return (results as (SearchResult & { score: number })[]).sort((a, b) => b.score - a.score)
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
  { id: 1, title: '学校基本信息', description: '学校基本情况、办学规模、专业设置等信息', icon: 'mdi:school', articleCount: 5, url: '/about' },
  { id: 2, title: '教务处规章制度', description: '教务管理相关规章制度文件', icon: 'mdi:file-document-multiple', articleCount: 28, url: '/list/regulation-school' },
  { id: 3, title: '人才培养方案', description: '各专业人才培养方案与教学计划', icon: 'mdi:account-school', articleCount: 18, url: '/list/first-class-major' },
  { id: 4, title: '招生就业信息', description: '招生计划与就业指导信息', icon: 'mdi:account-plus', articleCount: 12, url: '#' },
  { id: 5, title: '财务信息公开', description: '财务预算决算等公开信息', icon: 'mdi:currency-cny', articleCount: 6, url: '#' },
  { id: 6, title: '教学评估结果', description: '教学评估与质量报告', icon: 'mdi:clipboard-check', articleCount: 8, url: '#' },
  { id: 7, title: '学生管理规定', description: '学生管理相关规章制度', icon: 'mdi:account-group', articleCount: 15, url: '/list/regulation-school' },
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
  // 信息公开组
  {
    title: '部门概况',
    links: [
      { title: '部门简介', url: '/list/about-brief' },
      { title: '机构设置', url: '/list/about-structure' },
      { title: '联系方式', url: '/list/about-contact' },
    ],
  },
  {
    title: '通知公告',
    links: [
      { title: '教学通知', url: '/list/notice-teaching' },
      { title: '公示公告', url: '/list/notice-public' },
      { title: '处务通知', url: '/list/notice-office' },
    ],
  },
  {
    title: '教务动态',
    links: [
      { title: '工作动态', url: '/list/news-work' },
      { title: '会议活动', url: '/list/news-meeting' },
      { title: '媒体聚焦', url: '/list/news-media' },
    ],
  },
  // 业务建设组
  {
    title: '教学建设',
    links: [
      { title: '专业建设', url: '/list/first-class-major' },
      { title: '人才培养方案', url: '/list/training-plan' },
      { title: '课程建设', url: '/list/course' },
      { title: '教学项目', url: '/list/project' },
      { title: '教学成果奖', url: '/list/award' },
    ],
  },
  {
    title: '实践教学',
    links: [
      { title: '专业综合实训', url: '/list/practice-training' },
      { title: '岗位实习', url: '/list/practice-internship' },
      { title: '实训室建设', url: '/list/practice-lab' },
      { title: '实践教学基地', url: '/list/practice-base' },
      { title: '劳动教育', url: '/list/practice-labor' },
    ],
  },
  {
    title: '技能竞赛',
    links: [
      { title: '学生技能竞赛', url: '/list/competition-student' },
      { title: '教师教学比赛', url: '/list/competition-teacher' },
      { title: '教学荣誉奖', url: '/list/competition-honor' },
      { title: '竞赛风采', url: '/list/competition-gallery' },
    ],
  },
  {
    title: '教学运行',
    links: [
      { title: '教学日历', url: '/list/operation-calendar' },
      { title: '选课服务', url: '/list/operation-course' },
      { title: '学籍学业', url: '/list/operation-status' },
      { title: '运行安排', url: '/list/operation-arrangement' },
    ],
  },
  {
    title: '考务教材',
    links: [
      { title: '校内考试', url: '/list/exam-school' },
      { title: '社会考试', url: '/list/exam-social' },
      { title: '试卷(题)库建设', url: '/list/exam-paper' },
      { title: '教材建设', url: '/list/exam-textbook' },
    ],
  },
  {
    title: '教学质量',
    links: [
      { title: '教学质量评价', url: '#' },
      { title: '教学督导', url: '/list/quality-supervision' },
      { title: '教学文件检查', url: '/list/quality-check' },
      { title: '学生信息员', url: '/list/quality-officer' },
      { title: '第三方评价', url: '/list/quality-third' },
    ],
  },
  // 办事服务组
  {
    title: '办事指南',
    links: [
      { title: '学生办事', url: '/list/guide-student' },
      { title: '教师办事', url: '/list/guide-teacher' },
      { title: '访客办事', url: '/list/guide-visitor' },
    ],
  },
  {
    title: '规章制度',
    links: [
      { title: '国家及省市文件', url: '/list/regulation-national' },
      { title: '学校规章制度', url: '/list/regulation-school' },
    ],
  },
  {
    title: '下载中心',
    links: [{ title: '下载中心', url: '/list/download' }],
  },
  // 常用功能
  {
    title: '常用功能',
    links: [
      { title: '教学日历', url: '/list/operation-calendar' },
      { title: '站内搜索', url: '/search' },
      { title: '用户中心', url: '/user' },
      { title: '信息公开', url: '/disclosure' },
      { title: '站点地图', url: '/sitemap' },
      { title: '教学反馈', url: '/feedback' },
    ],
  },
]

// ====================================================================
// 专题页数据(需求 5.2 专题页模板:版式灵活,支持自定义模块组合,可快速上下线)
// 由后台发布/下线,不在顶部导航栏设独立入口,仅通过首页专题推荐跳转
// ====================================================================

// 专题模块类型:每种类型对应一种版式,后台按需组合
export type TopicModuleType = 'banner' | 'articles' | 'timeline' | 'highlights' | 'links' | 'richtext'

export interface TopicModule {
  id: number
  type: TopicModuleType
  title?: string
  // banner:横幅图文章节
  banner?: { description: string }
  // articles:文章列表模块(可关联栏目或手工挑选)
  articles?: { id: number; title: string; publishDate: string; source: string; url: string; summary: string }[]
  // timeline:大事记/赛程模块
  timeline?: { date: string; title: string; desc: string }[]
  // highlights:成果/亮点卡片模块
  highlights?: { title: string; desc: string; icon: string }[]
  // links:相关链接模块
  links?: { title: string; url: string }[]
  // richtext:富文本模块
  content?: string
}

export interface Topic {
  slug: string
  title: string
  subtitle: string
  description: string
  status: 'online' | 'offline' // 后台控制上下线
  publishDate: string
  modules: TopicModule[]
}

export const topics: Topic[] = [
  {
    slug: 'industry-education',
    title: '产教融合',
    subtitle: 'Industry-Education Integration',
    description: '校企协同育人,共建专业课程与实训基地,打造职业本科产教融合新范式',
    status: 'online',
    publishDate: '2026-03-15',
    modules: [
      {
        id: 1, type: 'banner',
        banner: { description: '学校与华为、腾讯、比亚迪等领军企业深度合作,共建产业学院与实训基地,实现专业与产业精准对接。' },
      },
      {
        id: 2, type: 'highlights', title: '建设成果',
        highlights: [
          { title: '产业学院', desc: '与龙头企业共建 6 个特色产业学院', icon: 'mdi:school' },
          { title: '实训基地', desc: '建成 32 个校企联合实训基地', icon: 'mdi:factory' },
          { title: '共建课程', desc: '校企联合开发课程 120 余门', icon: 'mdi:book-open-variant' },
          { title: '双师团队', desc: '企业工程师驻校授课 80 余人', icon: 'mdi:account-group' },
        ],
      },
      {
        id: 3, type: 'timeline', title: '建设历程',
        timeline: [
          { date: '2024-03', title: '启动产教融合工程', desc: '学校出台产教融合实施方案,明确职业本科建设路径' },
          { date: '2024-09', title: '首批产业学院揭牌', desc: '与华为、腾讯共建信息与数字产业学院' },
          { date: '2025-03', title: '实训基地规模化', desc: '新增 15 个校企联合实训基地,覆盖全部专业群' },
          { date: '2025-09', title: '课程体系重构', desc: '校企联合开发课程突破 100 门,引入企业真实项目' },
          { date: '2026-01', title: '育人成效显现', desc: '首届产教融合培养毕业生就业率达 98%' },
        ],
      },
      {
        id: 4, type: 'articles', title: '相关动态',
        articles: [
          { id: 9001, title: '我校与比亚迪签署产教融合战略合作协议', publishDate: '2026-05-20', source: '实践科', url: '/article/9001', summary: '双方将在新能源汽车领域共建实训基地与课程体系' },
          { id: 9002, title: '产业学院 2026 年招生工作启动', publishDate: '2026-04-15', source: '教研科', url: '/article/9002', summary: '六大产业学院面向全校招收新生,实行校企双导师制' },
          { id: 9003, title: '校企联合课程开发研讨会顺利召开', publishDate: '2026-03-28', source: '教学科', url: '/article/9003', summary: '30 余家企业代表与学校教师共商课程共建方案' },
        ],
      },
      {
        id: 5, type: 'links', title: '相关链接',
        links: [
          { title: '实践教学栏目', url: '/list/practice' },
          { title: '实训基地建设', url: '/list/practice-lab' },
          { title: '岗位实习管理', url: '/list/practice-internship' },
        ],
      },
    ],
  },
  {
    slug: 'vocational-degree',
    title: '职教本建设',
    subtitle: 'Vocational Undergraduate',
    description: '职业本科专业建设与人才培养方案优化,探索长学制高层次技术技能人才培养',
    status: 'online',
    publishDate: '2026-02-20',
    modules: [
      {
        id: 1, type: 'banner',
        banner: { description: '学校作为职业本科教育试点院校,围绕"岗课赛证"综合育人模式,打造高层次技术技能人才培养高地。' },
      },
      {
        id: 2, type: 'highlights', title: '专业建设概览',
        highlights: [
          { title: '本科专业', desc: '已设职业本科专业 12 个', icon: 'mdi:cap' },
          { title: '培养方案', desc: '完成 12 个专业人才培养方案修订', icon: 'mdi:clipboard-text' },
          { title: '课程标准', desc: '制定本科课程标准 200 余门', icon: 'mdi:book' },
          { title: '学位授予', desc: '首届本科毕业生学位授予率 95%', icon: 'mdi:certificate' },
        ],
      },
      {
        id: 3, type: 'articles', title: '建设动态',
        articles: [
          { id: 9101, title: '2026 级职业本科人才培养方案论证会召开', publishDate: '2026-06-10', source: '教研科', url: '/article/9101', summary: '邀请行业专家与企业代表共同论证 12 个本科专业培养方案' },
          { id: 9102, title: '职业本科课程标准建设推进会', publishDate: '2026-05-18', source: '教学科', url: '/article/9102', summary: '部署本科课程标准修订工作,强化岗课对接' },
          { id: 9103, title: '首届职业本科毕业设计展顺利举办', publishDate: '2026-04-20', source: '实践科', url: '/article/9103', summary: '展示本科毕业生真实项目成果,企业现场对接' },
        ],
      },
      {
        id: 4, type: 'links', title: '相关链接',
        links: [
          { title: '教学建设栏目', url: '/list/construction' },
          { title: '专业建设', url: '/list/first-class-major' },
          { title: '人才培养方案', url: '/list/training-plan' },
          { title: '教学成果奖', url: '/list/award' },
        ],
      },
    ],
  },
  {
    slug: 'major-competition',
    title: '重大赛事',
    subtitle: 'Major Competitions',
    description: '技能竞赛组织通知、获奖公示与风采展示,以赛促学、以赛促教',
    status: 'online',
    publishDate: '2026-01-10',
    modules: [
      {
        id: 1, type: 'banner',
        banner: { description: '学校坚持"以赛促学、以赛促教、以赛促改",在国家级、省级技能竞赛中屡获佳绩,展现职业本科育人成果。' },
      },
      {
        id: 2, type: 'highlights', title: '竞赛成绩',
        highlights: [
          { title: '国家级奖项', desc: '获国赛奖项 28 项', icon: 'mdi:trophy' },
          { title: '省级奖项', desc: '获省赛奖项 96 项', icon: 'mdi:medal' },
          { title: '金牌数量', desc: '国赛金牌 6 枚', icon: 'mdi:trophy-award' },
          { title: '参赛规模', desc: '年度参赛学生 1200 余人次', icon: 'mdi:account-group' },
        ],
      },
      {
        id: 3, type: 'timeline', title: '2026 赛事日历',
        timeline: [
          { date: '2026-03', title: '省赛选拔', desc: '广东省职业院校技能大赛校内外选拔赛' },
          { date: '2026-05', title: '省赛决赛', desc: '组队参加省赛决赛,角逐国赛入场券' },
          { date: '2026-06', title: '国赛备战', desc: '国赛参赛队伍集训,邀请专家指导' },
          { date: '2026-07', title: '全国决赛', desc: '参加全国职业院校技能大赛' },
          { date: '2026-11', title: '颁奖表彰', desc: '年度竞赛总结表彰大会' },
        ],
      },
      {
        id: 4, type: 'articles', title: '赛事通知',
        articles: [
          { id: 9201, title: '关于组织 2026 年广东省职业院校技能大赛报名的通知', publishDate: '2026-07-15', source: '教研科', url: '/article/9201', summary: '各学院请于 8 月 10 日前完成报名工作' },
          { id: 9202, title: '2026 年全国职业院校技能大赛获奖公示', publishDate: '2026-07-08', source: '教研科', url: '/article/9202', summary: '我校代表队在国赛中获 6 金 8 银好成绩' },
          { id: 9203, title: '校级技能竞赛月活动方案', publishDate: '2026-06-25', source: '教学科', url: '/article/9203', summary: '6 月开展校级技能竞赛,覆盖全部专业' },
        ],
      },
      {
        id: 5, type: 'links', title: '相关链接',
        links: [
          { title: '技能竞赛栏目', url: '/list/competition' },
          { title: '学生技能竞赛', url: '/list/competition-student' },
          { title: '教师教学比赛', url: '/list/competition-teacher' },
          { title: '竞赛风采', url: '/list/competition-gallery' },
        ],
      },
    ],
  },
]

// ====================================================================
// 图文画廊数据(实训室建设/实践教学基地/竞赛风采,需求 5.2:用卡片展示图片或视频)
// 用于 listStyle: 'gallery' 的栏目,后端可替换为真实图文数据
// ====================================================================
export interface GalleryItem {
  id: number
  columnSlug: string
  title: string
  description: string
  coverUrl: string // 封面图(后端可替换为真实图片)
  videoUrl?: string // 视频地址(可选,有值时显示播放图标)
  type: 'image' | 'video'
  publishDate: string
  views: number
  url: string // 点击跳转(可跳文章详情或外部链接)
}

const galleryImageBase = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt='

export const galleryItems: GalleryItem[] = [
  // ========== 实训室建设 ==========
  { id: 7001, columnSlug: 'practice-lab', title: '智能制造实训中心', description: '配备工业机器人、数控机床等先进设备,支撑机械类专业实训教学', coverUrl: `${galleryImageBase}${encodeURIComponent('现代化智能制造实训中心,工业机器人设备,明亮的实验室环境')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-06-15', views: 820, url: '/article/7001' },
  { id: 7002, columnSlug: 'practice-lab', title: '物联网技术实训室', description: '拥有传感器、嵌入式开发平台,支撑物联网应用实训', coverUrl: `${galleryImageBase}${encodeURIComponent('物联网技术实训室,电子设备,传感器实验台')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-05-20', views: 560, url: '/article/7002' },
  { id: 7003, columnSlug: 'practice-lab', title: '数字媒体实训中心', description: '专业摄影棚、后期剪辑工作站,服务数字媒体艺术专业', coverUrl: `${galleryImageBase}${encodeURIComponent('数字媒体实训中心,专业摄影棚,视频剪辑工作站')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-04-18', views: 680, url: '/article/7003' },
  { id: 7004, columnSlug: 'practice-lab', title: '新能源汽车实训室导览', description: '整车实训平台、动力电池检测设备,360°全景展示', coverUrl: `${galleryImageBase}${encodeURIComponent('新能源汽车实训室,电动汽车底盘,动力电池检测设备')}&image_size=landscape_4_3`, videoUrl: '#', type: 'video', publishDate: '2026-03-25', views: 1200, url: '/article/7004' },
  { id: 7005, columnSlug: 'practice-lab', title: '云计算与大数据实验室', description: '高性能服务器集群,支撑大数据分析与云计算实训', coverUrl: `${galleryImageBase}${encodeURIComponent('云计算大数据实验室,服务器机房,计算机设备')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-02-10', views: 430, url: '/article/7005' },
  { id: 7006, columnSlug: 'practice-lab', title: '智能网联汽车实训平台', description: '智能驾驶感知系统、车路协同设备,对接产业前沿', coverUrl: `${galleryImageBase}${encodeURIComponent('智能网联汽车实验平台,自动驾驶传感器,车辆测试')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-01-15', views: 590, url: '/article/7006' },
  // ========== 实践教学基地 ==========
  { id: 7101, columnSlug: 'practice-base', title: '比亚迪产业学院', description: '与比亚迪共建,涵盖新能源汽车检测与维修实训基地', coverUrl: `${galleryImageBase}${encodeURIComponent('校企合作产业学院大楼,企业实训基地')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-06-20', views: 950, url: '/article/7101' },
  { id: 7102, columnSlug: 'practice-base', title: '华为 ICT 学院实训基地', description: '华为认证实训平台,开展数据通信、云计算实训', coverUrl: `${galleryImageBase}${encodeURIComponent('华为ICT学院实训基地,网络通信设备,实训机房')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-05-12', views: 720, url: '/article/7102' },
  { id: 7103, columnSlug: 'practice-base', title: '腾讯云人工智能基地', description: '腾讯云 AI 平台,支撑机器学习与深度学习实训', coverUrl: `${galleryImageBase}${encodeURIComponent('腾讯云人工智能实训基地,AI实验室,大屏幕展示')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-04-08', views: 630, url: '/article/7103' },
  { id: 7104, columnSlug: 'practice-base', title: '大疆创新无人机基地', description: '无人机装配、飞控调试、航拍实训一体化基地', coverUrl: `${galleryImageBase}${encodeURIComponent('大疆无人机实训基地,无人机设备,飞行测试场')}&image_size=landscape_4_3`, videoUrl: '#', type: 'video', publishDate: '2026-03-18', views: 1100, url: '/article/7104' },
  { id: 7105, columnSlug: 'practice-base', title: '深圳地铁运营实训基地', description: '城市轨道交通运营管理仿真实训系统', coverUrl: `${galleryImageBase}${encodeURIComponent('地铁运营实训基地,轨道交通模拟驾驶舱')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-02-22', views: 480, url: '/article/7105' },
  { id: 7106, columnSlug: 'practice-base', title: '前海深港现代服务业基地', description: '金融服务、跨境电商实训,对接前海产业生态', coverUrl: `${galleryImageBase}${encodeURIComponent('现代服务业实训基地,金融交易模拟室,商务办公环境')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-01-08', views: 380, url: '/article/7106' },
  // ========== 竞赛风采 ==========
  { id: 7201, columnSlug: 'competition-gallery', title: '国赛金牌!物联网应用技术赛项夺冠瞬间', description: '我校代表队在全国职业院校技能大赛中荣获物联网应用技术赛项金牌', coverUrl: `${galleryImageBase}${encodeURIComponent('技能竞赛颁奖典礼,学生获奖合影,金牌奖杯')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-07-10', views: 2100, url: '/article/7201' },
  { id: 7202, columnSlug: 'competition-gallery', title: '省赛数控加工赛项精彩集锦', description: '广东省职业院校技能大赛数控综合加工技术赛项比赛现场', coverUrl: `${galleryImageBase}${encodeURIComponent('数控加工技能竞赛现场,学生操作数控机床')}&image_size=landscape_4_3`, videoUrl: '#', type: 'video', publishDate: '2026-06-05', views: 1580, url: '/article/7202' },
  { id: 7203, columnSlug: 'competition-gallery', title: '软件开发赛项团队风采', description: '软件测试与开发赛项参赛团队备赛训练日常', coverUrl: `${galleryImageBase}${encodeURIComponent('软件开发竞赛团队,学生编程比赛,计算机教室')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-05-18', views: 920, url: '/article/7203' },
  { id: 7204, columnSlug: 'competition-gallery', title: '电子商务赛项运营直播实战', description: '电子商务技能赛项直播带货环节,学生实战演练', coverUrl: `${galleryImageBase}${encodeURIComponent('电子商务竞赛直播,学生直播带货,比赛现场')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-04-22', views: 1300, url: '/article/7204' },
  { id: 7205, columnSlug: 'competition-gallery', title: '教师教学能力比赛决赛风采', description: '我校教师在省教师教学能力比赛中获一等奖', coverUrl: `${galleryImageBase}${encodeURIComponent('教师教学比赛,大学教师授课,比赛讲台')}&image_size=landscape_4_3`, type: 'image', publishDate: '2026-03-30', views: 760, url: '/article/7205' },
  { id: 7206, columnSlug: 'competition-gallery', title: '技能竞赛月开幕式', description: '校级技能竞赛月活动启动,千余名学生同台竞技', coverUrl: `${galleryImageBase}${encodeURIComponent('校园技能竞赛开幕式,学生方阵,运动场')}&image_size=landscape_4_3`, videoUrl: '#', type: 'video', publishDate: '2026-03-01', views: 1850, url: '/article/7206' },
]


// ====================================================================
export const consultationCategories = [
  { id: 1, name: '教学管理', dept: '教学科' },
  { id: 2, name: '考务管理', dept: '考试科' },
  { id: 3, name: '学籍管理', dept: '学籍科' },
  { id: 4, name: '选课管理', dept: '教学科' },
  { id: 5, name: '教材管理', dept: '考试科' },
  { id: 6, name: '实践教学', dept: '实践科' },
  { id: 7, name: '其他', dept: '综合科' },
]

export interface Consultation {
  id: number
  categoryId: number
  categoryName: string
  title: string
  content: string
  isPublic: boolean // 是否公开(公开的显示在首页)
  status: 'pending' | 'replied' | 'closed' // 待答复/已答复/已关闭
  submitDate: string
  reply?: string // 答复内容
  replyDate?: string
  replyDept?: string // 答复业务
  deadline: string // 限时答复截止日
}

export const consultations: Consultation[] = [
  {
    id: 5001, categoryId: 1, categoryName: '教学管理',
    title: '课程考核方式如何申请调整?',
    content: '因课程教学改革需要,拟将期末考试调整为项目答辩形式,请问如何申请?',
    isPublic: true, status: 'replied',
    submitDate: '2026-07-10', replyDate: '2026-07-12',
    replyDept: '教学科',
    reply: '您好,课程考核方式调整需填写《课程考核方式变更申请表》,经学院教学办公室审核后报教务处教学科审批,一般在 5 个工作日内反馈。申请表可在下载中心获取。',
    deadline: '2026-07-15',
  },
  {
    id: 5002, categoryId: 3, categoryName: '学籍管理',
    title: '学分认定申请的受理范围有哪些?',
    content: '请问校外取得的证书、在线课程学分是否可以申请认定?',
    isPublic: true, status: 'replied',
    submitDate: '2026-07-05', replyDate: '2026-07-08',
    replyDept: '学籍科',
    reply: '您好,学分认定范围包括:1+X 职业技能等级证书、国家级/省级技能竞赛获奖、认可的在线课程学分等。具体认定办法详见《学分认定管理办法》,可在规章制度栏目查阅。',
    deadline: '2026-07-12',
  },
  {
    id: 5003, categoryId: 4, categoryName: '选课管理',
    title: '跨专业选课有什么要求?',
    content: '想选修其他专业的课程,请问有什么限制条件?',
    isPublic: true, status: 'pending',
    submitDate: '2026-07-20',
    deadline: '2026-07-27',
  },
]

// ====================================================================
// 问卷调查数据(需求 4.1:后台创建,定向发布,结果统计导出)
// ====================================================================
export interface SurveyQuestion {
  id: number
  type: 'single' | 'multiple' | 'text' // 单选/多选/简答
  title: string
  required: boolean
  options?: string[] // 单选/多选选项
}

export interface Survey {
  id: number
  title: string
  description: string
  deadline: string
  target: string // 定向对象描述
  status: 'active' | 'ended' // 进行中/已结束
  publishDate: string
  responseCount: number
  questions: SurveyQuestion[]
}

export const surveys: Survey[] = [
  {
    id: 3001,
    title: '2026 年春季学期教学质量评价问卷',
    description: '为持续提升教学质量,现面向全体在校学生开展教学质量评价,请根据实际学习体验如实填写。',
    deadline: '2026-08-15',
    target: '全体在校学生',
    status: 'active',
    publishDate: '2026-07-01',
    responseCount: 1280,
    questions: [
      { id: 1, type: 'single', title: '您对所学课程的整体满意度如何?', required: true, options: ['非常满意', '满意', '一般', '不满意'] },
      { id: 2, type: 'single', title: '教师授课是否清晰易懂?', required: true, options: ['非常清晰', '较清晰', '一般', '不够清晰'] },
      { id: 3, type: 'multiple', title: '您认为课程中哪些环节最有帮助?(可多选)', required: false, options: ['课堂讲授', '实践实训', '小组讨论', '课后作业', '在线资源'] },
      { id: 4, type: 'text', title: '您对改进教学有什么建议?', required: false },
    ],
  },
  {
    id: 3002,
    title: '教务管理系统使用体验调查',
    description: '为优化教务管理系统功能,现收集师生使用体验与改进建议。',
    deadline: '2026-08-10',
    target: '全体师生',
    status: 'active',
    publishDate: '2026-07-10',
    responseCount: 652,
    questions: [
      { id: 1, type: 'single', title: '您使用教务系统的频率是?', required: true, options: ['每天', '每周数次', '每月数次', '很少使用'] },
      { id: 2, type: 'single', title: '系统响应速度是否满意?', required: true, options: ['非常满意', '满意', '一般', '不满意'] },
      { id: 3, type: 'text', title: '您希望系统增加什么功能?', required: false },
    ],
  },
]
