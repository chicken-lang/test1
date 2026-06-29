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
