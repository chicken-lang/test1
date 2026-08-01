// ========== 角色标签 ==========
export enum RoleTag {
  STUDENT = 'student',
  TEACHER = 'teacher',
  VISITOR = 'visitor',
}

export const ROLE_TAG_VALUES = Object.values(RoleTag)

export const ROLE_LABELS: Record<string, string> = {
  [RoleTag.STUDENT]: '学生',
  [RoleTag.TEACHER]: '教师',
  [RoleTag.VISITOR]: '访客',
}

// ========== 推荐内容区域 ==========
export enum RecommendSection {
  NOTICE = 'notice',       // 通知公告
  GUIDE = 'guide',         // 办事指南
  QUICK_LINK = 'quickLink', // 快捷入口
  TOPIC = 'topic',         // 专题推荐
}

export const RECOMMEND_SECTION_VALUES = Object.values(RecommendSection)

// ========== 业务标签 (对齐需求文档 3.4 节) ==========
export enum BusinessTag {
  TEACHING_PROJECT = 'teaching-project',       // 教学项目
  PRACTICE_TEACHING = 'practice-teaching',     // 实践教学
  TEACHING_OPERATION = 'teaching-operation',   // 教学运行
  EXAM_TEXTBOOK = 'exam-textbook',             // 考务教材
  SKILL_COMPETITION = 'skill-competition',    // 技能竞赛
  TEACHING_QUALITY = 'teaching-quality',       // 教学质量
  INFORMATION_SERVICE = 'information-service', // 信息服务
  GENERAL_AFFAIRS = 'general-affairs',         // 综合事务
}

// ========== 角色-业务标签映射 (首页推荐权重) ==========
// 学生：侧重 教学运行、考务、技能竞赛、实践教学
// 教师：侧重 教学项目、教学质量、信息服务
// 访客：侧重 综合事务、教学项目
export const ROLE_BUSINESS_WEIGHTS: Record<string, Record<string, number>> = {
  [RoleTag.STUDENT]: {
    [BusinessTag.TEACHING_OPERATION]: 10,
    [BusinessTag.EXAM_TEXTBOOK]: 9,
    [BusinessTag.SKILL_COMPETITION]: 8,
    [BusinessTag.PRACTICE_TEACHING]: 7,
    [BusinessTag.TEACHING_PROJECT]: 5,
    [BusinessTag.TEACHING_QUALITY]: 3,
    [BusinessTag.INFORMATION_SERVICE]: 6,
    [BusinessTag.GENERAL_AFFAIRS]: 4,
  },
  [RoleTag.TEACHER]: {
    [BusinessTag.TEACHING_PROJECT]: 10,
    [BusinessTag.TEACHING_QUALITY]: 9,
    [BusinessTag.INFORMATION_SERVICE]: 8,
    [BusinessTag.TEACHING_OPERATION]: 7,
    [BusinessTag.PRACTICE_TEACHING]: 6,
    [BusinessTag.EXAM_TEXTBOOK]: 5,
    [BusinessTag.SKILL_COMPETITION]: 4,
    [BusinessTag.GENERAL_AFFAIRS]: 3,
  },
  [RoleTag.VISITOR]: {
    [BusinessTag.GENERAL_AFFAIRS]: 10,
    [BusinessTag.TEACHING_PROJECT]: 8,
    [BusinessTag.INFORMATION_SERVICE]: 7,
    [BusinessTag.PRACTICE_TEACHING]: 6,
    [BusinessTag.SKILL_COMPETITION]: 5,
    [BusinessTag.TEACHING_QUALITY]: 4,
    [BusinessTag.TEACHING_OPERATION]: 3,
    [BusinessTag.EXAM_TEXTBOOK]: 2,
  },
}

// ========== 推荐内容默认数量 ==========
export const RECOMMEND_DEFAULTS = {
  NOTICE_LIMIT: 10,        // 通知公告推荐数量
  GUIDE_LIMIT: 8,          // 办事指南推荐数量
  QUICK_LINK_LIMIT: 6,     // 快捷入口数量
  TOPIC_LIMIT: 4,          // 专题推荐数量
  MAX_TOTAL: 30,           // 最大推荐总数
  CACHE_TTL: 600,          // 缓存 TTL（秒）
  CACHE_KEY_PREFIX: 'homepage_recommend:',
}

// ========== 错误码 ==========
export enum RecommendErrorCode {
  INVALID_ROLE = 'RECOMMEND_001',
  INVALID_SECTION = 'RECOMMEND_002',
  INVALID_PARAMS = 'RECOMMEND_003',
}

// ========== 快捷入口配置（按角色）==========
export interface QuickLinkItem {
  id: string
  title: string
  url: string
  icon: string
  roles: string[]
  sortOrder: number
}

export const QUICK_LINKS: QuickLinkItem[] = [
  // 学生专属
  { id: 's-student-system', title: '教务系统', url: 'https://jwxt.sziit.edu.cn', icon: 'academic', roles: [RoleTag.STUDENT], sortOrder: 1 },
  { id: 's-course-select', title: '选课中心', url: '/course/select', icon: 'calendar', roles: [RoleTag.STUDENT], sortOrder: 2 },
  { id: 's-score-query', title: '成绩查询', url: '/score/query', icon: 'chart', roles: [RoleTag.STUDENT], sortOrder: 3 },
  { id: 's-exam-schedule', title: '考试安排', url: '/exam/schedule', icon: 'document', roles: [RoleTag.STUDENT], sortOrder: 4 },
  { id: 's-graduation', title: '毕业办理', url: '/graduation', icon: 'diploma', roles: [RoleTag.STUDENT], sortOrder: 5 },
  { id: 's-reissue', title: '补办证件', url: '/reissue', icon: 'card', roles: [RoleTag.STUDENT], sortOrder: 6 },

  // 教师专属
  { id: 't-teacher-system', title: '教务系统', url: 'https://jwxt.sziit.edu.cn', icon: 'academic', roles: [RoleTag.TEACHER], sortOrder: 1 },
  { id: 't-course-apply', title: '开课申请', url: '/course/apply', icon: 'calendar', roles: [RoleTag.TEACHER], sortOrder: 2 },
  { id: 't-grade-entry', title: '成绩录入', url: '/grade/entry', icon: 'edit', roles: [RoleTag.TEACHER], sortOrder: 3 },
  { id: 't-teaching-eval', title: '教学评估', url: '/teaching/eval', icon: 'chart', roles: [RoleTag.TEACHER], sortOrder: 4 },
  { id: 't-research', title: '教研项目', url: '/research', icon: 'book', roles: [RoleTag.TEACHER], sortOrder: 5 },
  { id: 't-schedule', title: '排课管理', url: '/schedule', icon: 'clock', roles: [RoleTag.TEACHER], sortOrder: 6 },

  // 公共（访客可用）
  { id: 'v-notice', title: '通知公告', url: '/notices', icon: 'bell', roles: [RoleTag.VISITOR], sortOrder: 1 },
  { id: 'v-guide', title: '办事指南', url: '/guide', icon: 'guide', roles: [RoleTag.VISITOR], sortOrder: 2 },
  { id: 'v-download', title: '下载中心', url: '/download', icon: 'download', roles: [RoleTag.VISITOR], sortOrder: 3 },
  { id: 'v-contact', title: '联系方式', url: '/contact', icon: 'phone', roles: [RoleTag.VISITOR], sortOrder: 4 },
  { id: 'v-feedback', title: '意见反馈', url: '/feedback', icon: 'message', roles: [RoleTag.VISITOR], sortOrder: 5 },

  // 师生共享
  { id: 'common-calendar', title: '教学日历', url: '/calendar', icon: 'calendar', roles: [RoleTag.STUDENT, RoleTag.TEACHER], sortOrder: 7 },
  { id: 'common-service', title: '网上办事大厅', url: '/hall', icon: 'service', roles: [RoleTag.STUDENT, RoleTag.TEACHER], sortOrder: 8 },
  { id: 'common-download', title: '下载中心', url: '/download', icon: 'download', roles: [RoleTag.STUDENT, RoleTag.TEACHER], sortOrder: 9 },
]
