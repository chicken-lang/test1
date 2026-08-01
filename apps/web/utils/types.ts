// ====================================================================
// CMS 后台管理系统 完整类型定义 v4.0
// 覆盖: RBAC权限 + 三审三校工作流 + 富文本约束 + 后台管控机制
// ====================================================================

// ========== 一、RBAC 角色权限系统 ==========

/** 管理员角色枚举（对齐后端 V2.0 四级角色 R1-R4） */
export enum AdminRole {
  /** R1 编辑管理员: 业务通讯员, 各科室干事 */
  EDITOR = 'editor',
  /** R2 审核管理员: 业务负责人, 科室副主任/科长 */
  REVIEWER = 'reviewer',
  /** R3 栏目管理员: 大赛综合, 全站终审 + 首页推荐位管理 */
  COLUMN_ADMIN = 'column_admin',
  /** R4 系统管理员: 技术方, 用户/角色/系统配置/安全维护 */
  SYSTEM_ADMIN = 'system_admin',
}

/** 角色中文名称映射（对齐需求说明书四级角色） */
export const RoleLabels: Record<AdminRole, string> = {
  [AdminRole.EDITOR]: '编辑管理员',
  [AdminRole.REVIEWER]: '审核管理员',
  [AdminRole.COLUMN_ADMIN]: '栏目管理员',
  [AdminRole.SYSTEM_ADMIN]: '系统管理员',
}

/** 管理员账号 */
export interface AdminUser {
  id: number
  /** 教职工工号 */
  staffId: string
  username: string
  realName: string
  role: AdminRole
  /** 所属科室(复审不可跨科室) */
  department: string
  /** 可管辖栏目 ID 列表 */
  bindColumnIds: number[]
  avatar?: string
  phone: string
  email: string
  status: 'active' | 'locked' | 'disabled'
  /** 最后登录IP */
  lastLoginIp?: string
  lastLoginAt?: string
  /** 密码最后修改时间 */
  passwordChangedAt: string
  /** 连续错误次数 */
  failedLoginAttempts: number
  /** 锁定到期时间 */
  lockedUntil?: string
  createdAt: string
}

/** 登录表单 */
export interface LoginForm {
  staffId: string
  password: string
  /** 二次验证码(企业微信扫码/短信) */
  verificationCode: string
}

/** 登录响应 */
export interface LoginResult {
  token: string
  refreshToken: string
  user: AdminUser
  /** 会话过期时间(15分钟无操作) */
  sessionExpiresAt: string
}

/** 权限检查映射（对齐后端 V2.0 四级角色权限矩阵） */
export const RolePermissions: Record<AdminRole, string[]> = {
  [AdminRole.EDITOR]: [
    'article:create', 'article:draft', 'article:upload',
    'article:submit-review', 'article:edit-own-draft',
  ],
  [AdminRole.REVIEWER]: [
    'article:review', 'article:approve', 'article:reject',
    'article:view-department-drafts', 'audit:export-department',
  ],
  [AdminRole.COLUMN_ADMIN]: [
    // 栏目管理员: 全站终审 + 发布 + 撤回/置顶 + 栏目管理 + 首页推荐位
    'article:final-review', 'article:publish', 'article:publish-scheduled',
    'article:unpublish', 'article:withdraw', 'column:manage',
    'article:batch-import',
    // 栏目管理员可查看操作日志
    'audit:view-all',
  ],
  [AdminRole.SYSTEM_ADMIN]: [
    // 系统管理员: 系统配置 + 用户管理 + 安全维护
    'system:config', 'system:vulnerability', 'user:batch-manage',
    'user:manage-editors', 'sensitive-words:manage', 'system:scan',
    // 系统管理员可查看审计日志（用于系统监控）
    'audit:view-all',
  ],
}

// ========== 二、三审三校工作流 ==========

/** 文章审核状态 */
export enum ArticleStatus {
  /** 草稿(编辑员撰写中) */
  DRAFT = 'draft',
  /** 已提交初审(等待复审) */
  SUBMITTED = 'submitted',
  /** 复审中(科室负责人审核) */
  IN_REVIEW = 'in_review',
  /** 复审驳回(退回编辑) */
  REJECTED = 'rejected',
  /** 终审中(处长审核) */
  IN_FINAL_REVIEW = 'in_final_review',
  /** 终审驳回(退回复审) */
  FINAL_REJECTED = 'final_rejected',
  /** 加审中(重大事项需党委宣传部复核) */
  IN_EXTRA_REVIEW = 'in_extra_review',
  /** 待发布(终审通过) */
  PENDING_PUBLISH = 'pending_publish',
  /** 已发布 */
  PUBLISHED = 'published',
  /** 定时发布(已排期) */
  SCHEDULED = 'scheduled',
  /** 已下架(主动隐藏) */
  UNPUBLISHED = 'unpublished',
  /** 已废止(失效通知标记) */
  ABOLISHED = 'abolished',
  /** 已归档(永久保留) */
  ARCHIVED = 'archived',
}

/** 状态中文标签 */
export const StatusLabels: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: '草稿',
  [ArticleStatus.SUBMITTED]: '已提交',
  [ArticleStatus.IN_REVIEW]: '复审中',
  [ArticleStatus.REJECTED]: '复审驳回',
  [ArticleStatus.IN_FINAL_REVIEW]: '终审中',
  [ArticleStatus.FINAL_REJECTED]: '终审驳回',
  [ArticleStatus.IN_EXTRA_REVIEW]: '加审中',
  [ArticleStatus.PENDING_PUBLISH]: '待发布',
  [ArticleStatus.PUBLISHED]: '已发布',
  [ArticleStatus.SCHEDULED]: '定时发布',
  [ArticleStatus.UNPUBLISHED]: '已下架',
  [ArticleStatus.ABOLISHED]: '已废止',
  [ArticleStatus.ARCHIVED]: '已归档',
}

/** 状态对应的 Element Plus tag 类型 */
export const StatusTagType: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: 'info',
  [ArticleStatus.SUBMITTED]: '',
  [ArticleStatus.IN_REVIEW]: 'warning',
  [ArticleStatus.REJECTED]: 'danger',
  [ArticleStatus.IN_FINAL_REVIEW]: 'warning',
  [ArticleStatus.FINAL_REJECTED]: 'danger',
  [ArticleStatus.IN_EXTRA_REVIEW]: 'warning',
  [ArticleStatus.PENDING_PUBLISH]: 'success',
  [ArticleStatus.PUBLISHED]: 'success',
  [ArticleStatus.SCHEDULED]: '',
  [ArticleStatus.UNPUBLISHED]: 'info',
  [ArticleStatus.ABOLISHED]: 'danger',
  [ArticleStatus.ARCHIVED]: 'info',
}

/** 文章栏目(固定分类,不允许自定义) */
export enum ArticleColumn {
  DEPARTMENT_NEWS = 'department_news',
  NOTICE = 'notice',
  EXAM_NOTICE = 'exam_notice',
  ENROLLMENT = 'enrollment',
  POLICY = 'policy',
  COMPETITION = 'competition',
  STUDENT_NOTICE = 'student_notice',
  TEACHER_NOTICE = 'teacher_notice',
}

export const ColumnLabels: Record<ArticleColumn, string> = {
  [ArticleColumn.DEPARTMENT_NEWS]: '部门动态',
  [ArticleColumn.NOTICE]: '通知公告',
  [ArticleColumn.EXAM_NOTICE]: '考试公示',
  [ArticleColumn.ENROLLMENT]: '招生就业',
  [ArticleColumn.POLICY]: '政策文件',
  [ArticleColumn.COMPETITION]: '竞赛新闻',
  [ArticleColumn.STUDENT_NOTICE]: '学生通知',
  [ArticleColumn.TEACHER_NOTICE]: '教师通知',
}

/** 重大事项标记(需额外加审) */
export enum MajorFlag {
  /** 普通稿件 */
  NORMAL = 'normal',
  /** 全校停课/统考 */
  MAJOR_TEACHING = 'major_teaching',
  /** 招生录取 */
  ENROLLMENT = 'enrollment',
  /** 学费调整 */
  TUITION = 'tuition',
  /** 学生处分公示 */
  DISCIPLINE = 'discipline',
  /** 涉及校领导活动 */
  LEADER_ACTIVITY = 'leader_activity',
}

export const MajorFlagLabels: Record<MajorFlag, string> = {
  [MajorFlag.NORMAL]: '普通稿件',
  [MajorFlag.MAJOR_TEACHING]: '全校教学重大事项',
  [MajorFlag.ENROLLMENT]: '招生录取',
  [MajorFlag.TUITION]: '学费调整',
  [MajorFlag.DISCIPLINE]: '学生处分公示',
  [MajorFlag.LEADER_ACTIVITY]: '涉及校领导活动',
}

/** 是否涉密(禁止上传外网) */
export enum ConfidentialLevel {
  PUBLIC = 'public',
  /** 仅内网 */
  INTERNAL = 'internal',
  /** 涉密,禁止上传 */
  CONFIDENTIAL = 'confidential',
}

/** CMS文章完整数据结构 */
export interface CmsArticle {
  id: number
  title: string
  /** 文号(如 深信息教〔2026〕XX号) */
  docNumber?: string
  column: ArticleColumn
  content: string
  summary?: string
  coverImage?: string
  /** 来源(转载必须标注) */
  source?: string
  /** 是否为转载 */
  isReprint: boolean
  /** 原文链接(转载时必填) */
  reprintUrl?: string
  status: ArticleStatus
  majorFlag: MajorFlag
  confidentialLevel: ConfidentialLevel

  // 审核相关
  /** 创建人(编辑员) */
  authorId: number
  authorName: string
  authorDepartment: string
  /** 当前审核节点 */
  currentReviewStep: ReviewStep
  /** 审核历史记录 */
  reviewHistory: ReviewRecord[]
  /** 定时发布时间 */
  scheduledPublishAt?: string
  /** 自动下架时间(公示类7-15天) */
  autoUnpublishAt?: string

  // 附件
  attachments: Attachment[]
  /** 图片列表 */
  images: ArticleImage[]

  // 统计
  views: number
  publishDate?: string
  createdAt: string
  updatedAt: string
  /** 是否已归档(不可物理删除) */
  isArchived: boolean
}

/** 审核步骤 */
export enum ReviewStep {
  /** 编辑撰稿+一校 */
  DRAFTING = 'drafting',
  /** 科室复审+二校 */
  DEPARTMENT_REVIEW = 'department_review',
  /** 处长终审+三校 */
  FINAL_REVIEW = 'final_review',
  /** 加审(党委宣传部) */
  EXTRA_REVIEW = 'extra_review',
  /** 已发布 */
  PUBLISHED = 'published',
}

/** 审核操作记录 */
export interface ReviewRecord {
  id: number
  articleId: number
  /** 审核步骤 */
  step: ReviewStep
  /** 操作人ID */
  operatorId: number
  operatorName: string
  operatorRole: AdminRole
  /** 操作类型 */
  action: ReviewAction
  /** 审核意见 */
  comment: string
  /** 操作时间 */
  operatedAt: string
  /** 操作人IP */
  operatorIp: string
}

/** 审核操作类型 */
export enum ReviewAction {
  /** 提交审核 */
  SUBMIT = 'submit',
  /** 通过 */
  APPROVE = 'approve',
  /** 驳回/退回 */
  REJECT = 'reject',
  /** 发布 */
  PUBLISH = 'publish',
  /** 定时发布 */
  SCHEDULE = 'schedule',
  /** 下架 */
  UNPUBLISH = 'unpublish',
  /** 撤稿 */
  WITHDRAW = 'withdraw',
  /** 废止 */
  ABOLISH = 'abolish',
}

export const ReviewActionLabels: Record<ReviewAction, string> = {
  [ReviewAction.SUBMIT]: '提交审核',
  [ReviewAction.APPROVE]: '审核通过',
  [ReviewAction.REJECT]: '驳回退回',
  [ReviewAction.PUBLISH]: '立即发布',
  [ReviewAction.SCHEDULE]: '定时发布',
  [ReviewAction.UNPUBLISH]: '下架',
  [ReviewAction.WITHDRAW]: '撤稿',
  [ReviewAction.ABOLISH]: '标记废止',
}

// ========== 三、富文本编辑器约束 ==========

/** 富文本编辑器工具栏配置 */
export const EditorToolbarConfig = {
  /** 基础文字 */
  textFormat: ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clearFormat'] as const,
  /** 段落排版 */
  paragraph: ['alignLeft', 'alignCenter', 'alignRight', 'indent', 'outdent', 'orderedList', 'unorderedList', 'horizontalRule'] as const,
  /** 仅允许 H1-H3 */
  headings: ['h1', 'h2', 'h3'] as const,
  /** 链接功能 */
  links: ['link', 'emailLink', 'anchor', 'unlink'] as const,
  /** 表格 */
  table: ['insertTable', 'addRow', 'addCol', 'deleteRow', 'deleteCol', 'mergeCells', 'splitCell', 'deleteTable'] as const,
  /** 插入 */
  insert: ['image', 'attachment', 'formula', 'specialChar', 'video'] as const,
  /** 操作 */
  actions: ['undo', 'redo', 'findReplace', 'fullscreen', 'preview', 'sourceCode', 'saveDraft'] as const,
} as const

/** 富文本强制禁用功能 */
export const EditorDisabledFeatures = {
  /** 禁止的样式 */
  bannedStyles: ['textShadow', 'textGradient', 'animation', 'blink', 'customBackground'] as const,
  /** 禁止的HTML元素 */
  bannedElements: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'style'] as const,
  /** 禁止的链接域名模式(商业/短视频/自媒体) */
  bannedDomainPatterns: [/douyin\.com/, /tiktok\./, /kuaishou\.com/, /weibo\.com\/p/, /xiaohongshu\.com/, /taobao\.com/, /jd\.com/, /pinduoduo\.com/] as const,
  /** 允许的校内/官方域名 */
  allowedDomains: [/sziit\.edu\.cn/, /moe\.gov\.cn/, /moe\.gd\.gov\.cn/, /szeb\.sz\.gov\.cn/, /edu\.cn/] as const,
} as const

/** 图片上传规则(全校统一标准) */
export const ImageRule = {
  /** 最大宽度(px), 超过自动等比缩放 */
  maxWidth: 1500,
  /** 编辑器内插入最大宽度 */
  contentMaxWidth: 750,
  /** 单张最大大小(bytes) 2MB */
  maxSize: 2 * 1024 * 1024,
  /** 允许格式: JPG/PNG/GIF(仅宣传)/SVG(图标) */
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'svg'] as const,
  /** GIF 仅宣传稿允许, 需额外审核 */
  gifRequiresReview: true,
  /** 禁止格式 */
  blockedFormats: ['psd', 'raw', 'bmp', 'webp', 'tiff'] as const,
  /** 是否必须 alt 文字(无障碍) */
  requireAlt: true,
  /** alt 最小长度 */
  minAltLength: 4,
  /** 上传自动压缩 */
  autoCompress: true,
  /** 自动去除EXIF地理位置 */
  stripExif: true,
  /** 自动加水印 */
  autoWatermark: true,
  /** 水印文字 */
  watermarkText: '深圳信息职业技术学院教务处',
} as const

/** 图片上传校验结果 */
export interface ImageValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/** 附件白名单(教务固定) */
export const AttachmentRules = {
  /** 允许的文档类型 */
  allowedDocTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'] as const,
  /** 允许的图片附件 */
  allowedImageTypes: ['jpg', 'jpeg', 'png'] as const,
  /** 永久拦截的文件类型 */
  blockedTypes: ['exe', 'bat', 'zip', 'rar', '7z', 'apk', 'mp4', 'psd', 'raw', 'dll', 'sh', 'py', 'js', 'php'] as const,
  /** 单文件上限 25MB */
  maxSize: 25 * 1024 * 1024,
  /** 文件名正则: 仅中文/数字/短横线/〔〕号 */
  namePattern: /^[\u4e00-\u9fa5a-zA-Z0-9\-\u3014\u3015〔〕.]+$/,
  /** 禁止的文件名特殊字符 */
  bannedNameChars: [' ', '(', ')', '*', '#', '&', '?', '<', '>', '|', '"'] as const,
  /** 外链仅允许校内域名 */
  externalLinkAllowedDomains: [/sziit\.edu\.cn/, /moe\.gov\.cn/, /gd\.gov\.cn/, /sz\.gov\.cn/] as const,
} as const

/** 附件数据 */
export interface Attachment {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  /** 文件命名是否合规 */
  nameCompliant: boolean
  /** 关联稿件ID列表(溯源) */
  linkedArticleIds: number[]
  /** 媒体库目录ID */
  folderId: number | null
  uploadAt: string
  uploadedBy: number
  uploadedByName: string
}

/** 文章图片 */
export interface ArticleImage {
  id: number
  url: string
  alt: string
  width: number
  height: number
  /** 是否通过AI脱敏检测(人脸/身份证/学生证/手机号截图) */
  privacyChecked: boolean
  /** 脱敏提示 */
  privacyWarning?: string
  /** 媒体库ID(复用时关联) */
  mediaId?: number
}

/** 标题格式规则 */
export const TitleRules = {
  /** 通知标题必须包含文号 */
  requireDocNumber: true,
  /** 文号正则(如 深信息教〔2026〕XX号) */
  docNumberPattern: /^深信息[教政]\u3014\d{4}\u3015\d+号$/,
  /** 禁止的营销词汇 */
  bannedWords: ['重磅', '震惊', '必看', '速看', '不看后悔', '爆款', '刷屏'],
  /** 最大长度 */
  maxLength: 80,
} as const

/** 敏感词分类 */
export enum SensitiveWordCategory {
  /** 涉政 */
  POLITICAL = 'political',
  /** 低俗 */
  VULGAR = 'vulgar',
  /** 商业推广 */
  COMMERCIAL = 'commercial',
  /** 隐私泄露 */
  PRIVACY = 'privacy',
  /** 营销词汇 */
  MARKETING = 'marketing',
  /** 网络热梗 */
  SLANG = 'slang',
}

/** 敏感词条目 */
export interface SensitiveWord {
  id: number
  word: string
  category: SensitiveWordCategory
  /** 拦截级别: block=直接拦截, warn=提示警告 */
  level: 'block' | 'warn'
}

/** 敏感词检测结果 */
export interface SensitiveCheckResult {
  passed: boolean
  blockedWords: SensitiveWord[]
  warnedWords: SensitiveWord[]
}

// ========== 四、后台管控机制 ==========

/** 操作日志(全留痕) */
export interface AuditLog {
  id: number
  /** 操作人工号 */
  operatorStaffId: string
  operatorName: string
  operatorRole: AdminRole
  /** 操作类型 */
  action: AuditAction
  /** 操作对象(表名) */
  targetTable: string
  /** 操作对象ID */
  targetId: number | null
  /** 操作描述 */
  description: string
  /** 变更前值(JSON) */
  oldValue?: Record<string, unknown>
  /** 变更后值(JSON) */
  newValue?: Record<string, unknown>
  /** 操作IP */
  ip: string
  /** User-Agent */
  userAgent: string
  /** 操作时间 */
  operatedAt: string
}

/** 审计操作类型 */
export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  UNPUBLISH = 'unpublish',
  REVIEW_APPROVE = 'review_approve',
  REVIEW_REJECT = 'review_reject',
  SCHEDULE = 'schedule',
  WITHDRAW = 'withdraw',
  ABOLISH = 'abolish',
  USER_CREATE = 'user_create',
  USER_DISABLE = 'user_disable',
  USER_ROLE_CHANGE = 'user_role_change',
  CONFIG_UPDATE = 'config_update',
  SENSITIVE_WORD_UPDATE = 'sensitive_word_update',
  /** 图片上传 */
  IMAGE_UPLOAD = 'image_upload',
  /** 图片删除 */
  IMAGE_DELETE = 'image_delete',
  /** 附件上传 */
  ATTACHMENT_UPLOAD = 'attachment_upload',
  /** 附件删除 */
  ATTACHMENT_DELETE = 'attachment_delete',
  /** 编辑记录 */
  EDIT_CONTENT = 'edit_content',
  /** 链接修改 */
  LINK_UPDATE = 'link_update',
  /** 版本回退 */
  VERSION_RESTORE = 'version_restore',
  /** 批量下架 */
  BATCH_UNPUBLISH = 'batch_unpublish',
  /** 批量归档 */
  BATCH_ARCHIVE = 'batch_archive',
}

/** 定时发布时间规则 */
export const ScheduleRules = {
  /** 允许发布时间段: 8:00-18:00 */
  allowedHoursStart: 8,
  allowedHoursEnd: 18,
  /** 禁止自动上线时段: 22:00-次日7:00 */
  blackoutHoursStart: 22,
  blackoutHoursEnd: 7,
} as const

/** 密码规则 */
export const PasswordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  /** 强制更换周期(天) */
  rotationDays: 90,
  /** 连续错误锁定次数 */
  maxFailedAttempts: 5,
  /** 锁定时长(分钟) */
  lockDurationMinutes: 30,
} as const

/** 会话规则 */
export const SessionRules = {
  /** 闲置超时(分钟) */
  idleTimeoutMinutes: 15,
  /** 同时在线设备数 */
  maxDevices: 1,
} as const

/** 账号生命周期 */
export interface AccountLifecycleEvent {
  type: 'created' | 'role_changed' | 'disabled' | 'enabled' | 'password_reset'
  operatorId: number
  operatorName: string
  targetUserId: number
  description: string
  createdAt: string
}

// ========== 五、系统配置 ==========

/** 栏目配置 */
export interface ColumnConfig {
  id: number
  key: ArticleColumn
  label: string
  /** 是否需要文号 */
  requireDocNumber: boolean
  /** 是否允许转载 */
  allowReprint: boolean
  /** 公示类自动下架天数 */
  autoExpireDays?: number
  /** 排序 */
  sortOrder: number
  isActive: boolean
}

/** 系统配置项 */
export interface SystemConfig {
  key: string
  value: string
  group: 'general' | 'editor' | 'security' | 'notification'
  label: string
  description: string
  updatedAt: string
}

// ========== 五-B、V2.0 栏目架构管理（对齐 V1.0 实施方案 §3.2.6 + V2.0 模块五） ==========

/** 栏目状态（V2.0 §5.3.3） */
export enum ColumnStatus {
  /** 启用 */
  ACTIVE = 'ACTIVE',
  /** 停用 */
  DISABLED = 'DISABLED',
  /** 已删除（软删除） */
  DELETED = 'DELETED',
}

/** 栏目状态中文标签 */
export const ColumnStatusLabel: Record<ColumnStatus, string> = {
  [ColumnStatus.ACTIVE]: '启用',
  [ColumnStatus.DISABLED]: '停用',
  [ColumnStatus.DELETED]: '已删除',
}

/**
 * 二级栏目责任业务编码（V2.0 §5.4.2）
 * 每个二级栏目必须绑定唯一责任业务，用于首页分区数据筛选与权限隔离
 */
export enum ResponsibleBusiness {
  // 部门概况
  GENERAL = 'general',
  ABOUT_BRIEF = 'about-brief',
  ABOUT_STRUCTURE = 'about-structure',
  // 通知公告
  NOTICE = 'notice',
  NOTICE_TEACHER = 'notice-teacher',
  NOTICE_STUDENT = 'notice-student',
  NOTICE_OFFICE = 'notice-office',
  // 教务动态
  NEWS = 'news',
  NEWS_WORK = 'news-work',
  NEWS_MEETING = 'news-meeting',
  // 一流育人体系
  FIRST_CLASS = 'first-class',
  FIRST_CLASS_MAJOR = 'first-class-major',
  FIRST_CLASS_COURSE = 'first-class-course',
  FIRST_CLASS_TEACHER = 'first-class-teacher',
  FIRST_CLASS_TEXTBOOK = 'first-class-textbook',
  FIRST_CLASS_BASE = 'first-class-base',
  // 人才培养平台（链接型）
  PLATFORM = 'platform',
  PLATFORM_LINK = 'platform-link',
  // 办事指南
  GUIDE = 'guide',
  REGULATION_NATIONAL = 'regulation-national',
  REGULATION_SCHOOL = 'regulation-school',
  DOWNLOAD = 'download',
}

/** 责任业务中文标签 */
export const ResponsibleBusinessLabel: Record<string, string> = {
  [ResponsibleBusiness.GENERAL]: '综合',
  [ResponsibleBusiness.ABOUT_BRIEF]: '部门简介',
  [ResponsibleBusiness.ABOUT_STRUCTURE]: '机构设置',
  [ResponsibleBusiness.NOTICE]: '通知公告',
  [ResponsibleBusiness.NOTICE_TEACHER]: '教师公告',
  [ResponsibleBusiness.NOTICE_STUDENT]: '学生公告',
  [ResponsibleBusiness.NOTICE_OFFICE]: '处务通知',
  [ResponsibleBusiness.NEWS]: '教务动态',
  [ResponsibleBusiness.NEWS_WORK]: '工作动态',
  [ResponsibleBusiness.NEWS_MEETING]: '会议活动',
  [ResponsibleBusiness.FIRST_CLASS]: '一流育人体系',
  [ResponsibleBusiness.FIRST_CLASS_MAJOR]: '一流专业',
  [ResponsibleBusiness.FIRST_CLASS_COURSE]: '一流课程',
  [ResponsibleBusiness.FIRST_CLASS_TEACHER]: '一流教师',
  [ResponsibleBusiness.FIRST_CLASS_TEXTBOOK]: '一流教材',
  [ResponsibleBusiness.FIRST_CLASS_BASE]: '实训基地建设',
  [ResponsibleBusiness.PLATFORM]: '人才培养平台',
  [ResponsibleBusiness.PLATFORM_LINK]: '平台链接',
  [ResponsibleBusiness.GUIDE]: '办事指南',
  [ResponsibleBusiness.REGULATION_NATIONAL]: '国家及省市文件',
  [ResponsibleBusiness.REGULATION_SCHOOL]: '学校规章制度',
  [ResponsibleBusiness.DOWNLOAD]: '下载中心',
}

/** 栏目节点（V2.0 §5.3.3 栏目树接口响应结构） */
export interface ColumnNode {
  /** 主键 ID（不可变，权限校验/稿件绑定/外键关联） */
  columnId: number
  /** 路由别名（可修改，前台 URL 展示） */
  columnSlug: string
  /** 栏目名称 */
  columnName: string
  /** 父栏目 ID（一级栏目为 null） */
  parentId: number | null
  /** 排序权重 */
  sortOrder: number
  /** 状态 */
  status: ColumnStatus
  /** 二级栏目必填：责任业务编码 */
  responsibleBusiness?: ResponsibleBusiness
  /** 栏目描述 */
  description?: string
  /** 外部链接地址（仅链接型栏目使用） */
  linkUrl?: string
  /** 乐观锁版本号（V2.0 §5.7） */
  version?: number
  /** 子栏目 */
  children?: ColumnNode[]
}

/** 栏目映射查询结果（V2.0 §5.3.4） */
export interface ColumnMapping {
  columnId: number
  columnSlug: string
  columnName: string
}

/** 批量映射请求（V2.0 §5.3.4） */
export interface ColumnBatchMappingRequest {
  /** 映射方向 */
  type: 'SLUG_TO_ID' | 'ID_TO_SLUG'
  /** 待映射值列表 */
  values: (string | number)[]
}

/** 批量映射响应 */
export type ColumnBatchMappingResponse = Record<string, number | string>

/** 新增栏目请求（V2.0 §5.6 流程1） */
export interface CreateColumnRequest {
  columnName: string
  columnSlug: string
  parentId?: number | null
  responsibleBusiness?: ResponsibleBusiness
  sortOrder?: number
  description?: string
}

/** 编辑栏目请求（V2.0 §5.6 流程2） */
export interface UpdateColumnRequest {
  columnName?: string
  columnSlug?: string
  responsibleBusiness?: ResponsibleBusiness
  sortOrder?: number
  description?: string
  /** 乐观锁版本号 */
  version?: number
}

/** 栏目排序请求（V2.0 §5.6 流程3） */
export interface SortColumnRequest {
  items: Array<{ columnId: number; sortOrder: number }>
}

/** slug 格式正则（V2.0 §5.7：仅小写字母/数字/中划线，2-64 字符） */
export const COLUMN_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/

/** slug 系统保留字（V2.0 §5.3.5，禁止用作栏目 slug） */
export const COLUMN_SLUG_RESERVED_WORDS = [
  'api', 'admin', 'system', 'login', 'static', 'assets',
] as const

/** 栏目管理错误码（V2.0 §5.4.3 / §5.6 流程4） */
export enum ColumnErrorCode {
  /** 二级栏目必须绑定责任业务 */
  RESPONSIBLE_BUSINESS_REQUIRED = 40001,
  /** 栏目下存在已发布稿件，无法停用 */
  HAS_PUBLISHED_ARTICLES = 40002,
  /** slug 已被占用 */
  SLUG_DUPLICATED = 40003,
  /** slug 格式不合规 */
  SLUG_FORMAT_INVALID = 40004,
  /** slug 为系统保留字 */
  SLUG_RESERVED = 40005,
  /** 栏目不存在 */
  NOT_FOUND = 40401,
  /** 乐观锁冲突 */
  VERSION_CONFLICT = 40901,
}

// ========== 六、媒体资源库 ==========

/** 媒体资源分类 */
export enum MediaCategory {
  /** 活动照片 */
  ACTIVITY = 'activity',
  /** 公示配图 */
  NOTICE_IMAGE = 'notice_image',
  /** 文档封面 */
  DOC_COVER = 'doc_cover',
  /** 图标素材 */
  ICON = 'icon',
  /** 附件文档 */
  ATTACHMENT = 'attachment',
}

export const MediaCategoryLabels: Record<MediaCategory, string> = {
  [MediaCategory.ACTIVITY]: '活动照片',
  [MediaCategory.NOTICE_IMAGE]: '公示配图',
  [MediaCategory.DOC_COVER]: '文档封面',
  [MediaCategory.ICON]: '图标素材',
  [MediaCategory.ATTACHMENT]: '附件文档',
}

/** 媒体库目录 */
export interface MediaFolder {
  id: number
  name: string
  category: MediaCategory
  /** 年份归档(如 2026) */
  year: number
  parentId: number | null
  fileCount: number
  totalSize: number
  createdBy: number
  createdAt: string
}

/** 媒体资源项(图片+附件统一) */
export interface MediaItem {
  id: number
  filename: string
  originalName: string
  /** 媒体类型 */
  type: 'image' | 'attachment'
  mimeType: string
  size: number
  width?: number
  height?: number
  /** alt 文本(图片必填) */
  alt?: string
  /** 缩略图URL */
  thumbnailUrl?: string
  /** 下载/访问URL */
  url: string
  /** 所属目录ID */
  folderId: number | null
  /** 分类 */
  category: MediaCategory
  /** 上传人 */
  uploadedBy: number
  uploadedByName: string
  uploadedByDepartment: string
  /** 关联稿件(溯源) */
  linkedArticleIds: number[]
  /** AI安全检查结果 */
  securityChecked: boolean
  securityWarning?: string
  createdAt: string
  updatedAt: string
}

/** 媒体库筛选条件 */
export interface MediaFilter {
  keyword: string
  type: 'all' | 'image' | 'attachment'
  category: MediaCategory | ''
  uploadedBy: number | null
  dateRange: [string, string] | null
  folderId: number | null
}

/** 存储统计 */
export interface StorageStats {
  totalSize: number
  imageCount: number
  attachmentCount: number
  /** 按栏目统计 */
  byCategory: Record<MediaCategory, { count: number; size: number }>
  /** 容量预警阈值(bytes), 默认 5GB */
  warningThreshold: number
  /** 是否接近预警 */
  isNearLimit: boolean
}

// ========== 七、草稿与版本管理 ==========

/** 版本快照 */
export interface VersionSnapshot {
  id: number
  articleId: number
  /** 版本号(递增) */
  version: number
  /** 快照内容(HTML) */
  content: string
  /** 标题快照 */
  title: string
  /** 创建人 */
  createdBy: number
  createdByName: string
  /** 创建时间 */
  createdAt: string
  /** 触发原因: auto=自动草稿, submit=提交前快照, manual=手动保存 */
  trigger: 'auto' | 'submit' | 'manual'
}

/** 自动草稿配置 */
export const AutoDraftConfig = {
  /** 自动保存间隔(秒) */
  intervalSeconds: 30,
  /** 最大保留草稿数 */
  maxDrafts: 10,
  /** 关闭页面时提示未保存 */
  warnOnClose: true,
} as const

/** 版本管理配置 */
export const VersionConfig = {
  /** 最大版本数 */
  maxVersions: 20,
  /** 版本保留天数 */
  retentionDays: 90,
} as const
