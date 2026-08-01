/**
 * 文件资源管理常量定义 (模块十: 文件资源管理)
 */

// 文件访问级别
export enum AccessLevel {
  PUBLIC = 'PUBLIC',       // 公开: 任何人可下载
  CAMPUS = 'CAMPUS',     // 校内: 仅SSO师生可访问
  INTERNAL = 'INTERNAL', // 内部: 仅后台管理员可访问
}

// 文件密级
export enum SecretLevel {
  NORMAL = 'NORMAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
}

// 文件状态
export enum FileStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

// 下载中心分类
export enum FileCategory {
  NOTICE = 'notice',           // 公告通知
  MATERIAL = 'material',       // 教学资料
  TEMPLATE = 'template',       // 模板下载
  FORM = 'form',               // 表格下载
  POLICY = 'policy',           // 政策文件
  MEETING = 'meeting',         // 会议资料
  OTHER = 'other',             // 其他
}

// 预览模式
export enum PreviewMode {
  FULL = 'full',
  THUMBNAIL = 'thumbnail',
}

// 设备类型
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
}

// 可执行文件黑名单扩展名
export const EXECUTABLE_BLACKLIST = [
  '.exe', '.bat', '.sh', '.cmd', '.ps1', '.com', '.scr',
  '.pif', '.jar', '.msi', '.hta', '.vbs', '.js', '.wsf',
  '.cpl', '.inf', '.reg', '.rgs',
]

// 可预览的文件格式白名单
export const PREVIEWABLE_FORMATS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff',
]

// 图片格式
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff']

// 文档格式 (需转换)
export const DOCUMENT_FORMATS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']

// 单文件最大上传大小 (字节) - 默认 100MB
export const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024

// 单账号单日下载上限
export const DEFAULT_DAILY_DOWNLOAD_LIMIT = 100

// 匿名访客单IP每分钟下载上限
export const DEFAULT_ANONYMOUS_RATE_LIMIT = 10

// 预览缓存路径
export const PREVIEW_CACHE_PATH = '/preview_cache'

// 文件资源存储根目录
export const FILE_STORAGE_PATH = '/file_resources'

// 归档时间阈值 (天) - 超过180天未下载自动归档
export const AUTO_ARCHIVE_DAYS = 180

// 审计日志动作
export const FileAuditAction = {
  UPLOAD: 'file_upload',
  EDIT: 'file_edit',
  DELETE: 'file_delete',
  ARCHIVE: 'file_archive',
  PHYSICAL_DELETE: 'file_physical_delete',
  PERMISSION_UPDATE: 'file_permission_update',
  PREVIEW: 'file_preview',
  DOWNLOAD: 'file_download',
} as const

// 角色文件操作权限矩阵
export const ROLE_FILE_PERMISSIONS: Record<string, {
  upload: boolean
  edit: boolean
  delete: boolean
  physicalDelete: boolean
  configPermission: boolean
  viewStats: boolean
}> = {
  editor: {
    upload: true,
    edit: true,
    delete: false,
    physicalDelete: false,
    configPermission: true,
    viewStats: true,
  },
  reviewer: {
    upload: true,
    edit: true,
    delete: false,
    physicalDelete: false,
    configPermission: false,
    viewStats: true,
  },
  column_admin: {
    upload: true,
    edit: true,
    delete: true,
    physicalDelete: false,
    configPermission: true,
    viewStats: true,
  },
  system_admin: {
    upload: true,
    edit: true,
    delete: true,
    physicalDelete: true,
    configPermission: true,
    viewStats: true,
  },
}