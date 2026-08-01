/**
 * 四级角色功能权限定义
 * 每个角色拥有的接口/功能权限列表
 * 权限格式: "模块.操作" 如 "article.create"
 */

// 所有可用权限枚举
export enum Permission {
  // 稿件管理
  ARTICLE_CREATE = 'article.create',
  ARTICLE_DRAFT = 'article.draft',
  ARTICLE_PENDING = 'article.pending',
  ARTICLE_REJECTED = 'article.rejected',
  ARTICLE_EDIT_OWN = 'article.edit_own',
  ARTICLE_DELETE_DRAFT = 'article.delete_draft',

  // 审核功能
  ARTICLE_REVIEW = 'article.review',          // 初审
  ARTICLE_REVIEW_PUBLISH = 'article.review_publish', // 审核通过并发布(普通资讯)
  ARTICLE_REVIEW_TO_FINAL = 'article.review_to_final', // 审核通过转终审(涉密公文)
  ARTICLE_REJECT = 'article.reject',
  ARTICLE_PUBLISHED_VIEW = 'article.published_view', // 查看已发布
  ARTICLE_WITHDRAW = 'article.withdraw',       // 撤回
  ARTICLE_TOP = 'article.top',                // 置顶

  // 终审功能
  ARTICLE_FINAL_REVIEW = 'article.final_review',
  ARTICLE_FINAL_PUBLISH = 'article.final_publish',
  ARTICLE_FINAL_REJECT = 'article.final_reject',

  // 全栏目检索
  ARTICLE_ALL_SEARCH = 'article.all_search',

  // 栏目管理
  COLUMN_MANAGE = 'column.manage',            // 增删改栏目
  COLUMN_RECOMMEND = 'column.recommend',      // 首页推荐位
  COLUMN_TAGS = 'column.tags',               // 栏目标签
  COLUMN_SORT = 'column.sort',               // 栏目排序
  COLUMN_DISABLE = 'column.disable',         // 停用/启用栏目

  // 消息
  MESSAGE_VIEW = 'message.view',
  MESSAGE_ARCHIVE = 'message.archive',
  MESSAGE_PUBLISH = 'message.publish',        // 发布全局公告(系统管理员)
  MESSAGE_VIEW_ALL = 'message.view_all',      // 查看全站消息(系统管理员)

  // 统计
  STATISTICS_VIEW = 'statistics.view',        // 本栏目统计
  STATISTICS_EXPORT = 'statistics.export',    // 统计导出
  STATISTICS_VIEW_ALL = 'statistics.view_all', // 全站统计(系统管理员)

  // 审计日志
  AUDIT_VIEW_OWN = 'audit.view_own',         // 查看个人日志
  AUDIT_VIEW_COLUMN = 'audit.view_column',   // 查看本栏目日志
  AUDIT_VIEW_ALL = 'audit.view_all',         // 查看全站日志
  AUDIT_EXPORT = 'audit.export',             // 日志导出
  AUDIT_ARCHIVE = 'audit.archive',           // 日志归档
  AUDIT_HASH_VERIFY = 'audit.hash_verify',   // 日志完整性校验

  // 账号管理(仅系统管理员)
  ADMIN_MANAGE = 'admin.manage',             // 账号增删改
  ADMIN_ROLE_CONFIG = 'admin.role_config',   // 角色权限配置
  ADMIN_BINDCOLUMN = 'admin.bind_column',    // 栏目权限分配

  // 系统配置(仅系统管理员)
  SYSTEM_SSO_CONFIG = 'system.sso_config',
  SYSTEM_SENSITIVE = 'system.sensitive',
  SYSTEM_RATELIMIT = 'system.ratelimit',
  SYSTEM_STATS_FILTER = 'system.stats_filter',
  SYSTEM_TAGS_MANAGE = 'system.tags_manage',

  // 稿件查询(只读, 系统管理员)
  ARTICLE_READONLY = 'article.readonly',

  // 敏感词管理(仅系统管理员)
  SENSITIVE_WORD_VIEW = 'sensitive_word.view',
  SENSITIVE_WORD_CREATE = 'sensitive_word.create',
  SENSITIVE_WORD_UPDATE = 'sensitive_word.update',
  SENSITIVE_WORD_DELETE = 'sensitive_word.delete',

  // 文件资源管理
  FILE_UPLOAD = 'file.upload',
  FILE_EDIT = 'file.edit',
  FILE_DELETE = 'file.delete',
  FILE_PHYSICAL_DELETE = 'file.physical_delete',
  FILE_CONFIG_PERMISSION = 'file.config_permission',
  FILE_PREVIEW = 'file.preview',
  FILE_VIEW_STATS = 'file.view_stats',
  FILE_SYSTEM_CONFIG = 'file.system_config',

  // 留言咨询管理 (V2.0 模块十三)
  INQUIRY_VIEW = 'inquiry.view',              // 查看咨询台账
  INQUIRY_REPLY = 'inquiry.reply',           // 答复咨询
  INQUIRY_ASSIGN = 'inquiry.assign',         // 手动指派处理人
  INQUIRY_CLOSE = 'inquiry.close',           // 关闭咨询
  INQUIRY_TOGGLE_PUBLIC = 'inquiry.toggle_public', // 设置公开/不公开
  INQUIRY_EXPORT = 'inquiry.export',          // 导出咨询台账
  INQUIRY_ROUTING_CONFIG = 'inquiry.routing_config', // 配置分流规则
  INQUIRY_TIMEOUT_CHECK = 'inquiry.timeout_check',   // 手动触发超时检查
}
// 各角色默认权限集
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  editor: [
    // 编辑管理员: 仅文稿采编
    Permission.ARTICLE_CREATE,
    Permission.ARTICLE_DRAFT,
    Permission.ARTICLE_PENDING,
    Permission.ARTICLE_REJECTED,
    Permission.ARTICLE_READONLY,
    Permission.ARTICLE_EDIT_OWN,
    Permission.ARTICLE_DELETE_DRAFT,
    Permission.FILE_UPLOAD,
    Permission.FILE_EDIT,
    Permission.FILE_PREVIEW,
    Permission.FILE_CONFIG_PERMISSION,
    Permission.FILE_VIEW_STATS,
    Permission.MESSAGE_VIEW,
    Permission.MESSAGE_ARCHIVE,
    Permission.AUDIT_VIEW_OWN,
    Permission.INQUIRY_REPLY,
  ],
  reviewer: [
    // 审核管理员: 编辑权限 + 初审 + 本栏目管理
    Permission.ARTICLE_CREATE,
    Permission.ARTICLE_DRAFT,
    Permission.ARTICLE_PENDING,
    Permission.ARTICLE_REJECTED,
    Permission.ARTICLE_READONLY,
    Permission.ARTICLE_EDIT_OWN,
    Permission.ARTICLE_DELETE_DRAFT,
    Permission.ARTICLE_REVIEW,
    Permission.ARTICLE_REVIEW_PUBLISH,
    Permission.ARTICLE_REVIEW_TO_FINAL,
    Permission.ARTICLE_REJECT,
    Permission.ARTICLE_PUBLISHED_VIEW,
    Permission.ARTICLE_WITHDRAW,
    Permission.ARTICLE_TOP,
    Permission.FILE_UPLOAD,
    Permission.FILE_EDIT,
    Permission.FILE_PREVIEW,
    Permission.FILE_CONFIG_PERMISSION,
    Permission.FILE_VIEW_STATS,
    Permission.MESSAGE_VIEW,
    Permission.MESSAGE_ARCHIVE,
    Permission.STATISTICS_VIEW,
    Permission.AUDIT_VIEW_OWN,
    Permission.AUDIT_VIEW_COLUMN,
    Permission.INQUIRY_VIEW,
    Permission.INQUIRY_REPLY,
    Permission.INQUIRY_TOGGLE_PUBLIC,
  ],

  column_admin: [
    // 栏目管理员: 审核 + 终审 + 栏目管理 + 日志导出
    Permission.ARTICLE_CREATE,
    Permission.ARTICLE_DRAFT,
    Permission.ARTICLE_PENDING,
    Permission.ARTICLE_REJECTED,
    Permission.ARTICLE_READONLY,
    Permission.ARTICLE_EDIT_OWN,
    Permission.ARTICLE_DELETE_DRAFT,
    Permission.ARTICLE_REVIEW,
    Permission.ARTICLE_REVIEW_PUBLISH,
    Permission.ARTICLE_REVIEW_TO_FINAL,
    Permission.ARTICLE_REJECT,
    Permission.ARTICLE_PUBLISHED_VIEW,
    Permission.ARTICLE_WITHDRAW,
    Permission.ARTICLE_TOP,
    Permission.ARTICLE_FINAL_REVIEW,
    Permission.ARTICLE_FINAL_PUBLISH,
    Permission.ARTICLE_FINAL_REJECT,
    Permission.ARTICLE_ALL_SEARCH,
    Permission.COLUMN_MANAGE,
    Permission.COLUMN_RECOMMEND,
    Permission.COLUMN_TAGS,
    Permission.COLUMN_SORT,
    Permission.COLUMN_DISABLE,
    Permission.FILE_UPLOAD,
    Permission.FILE_EDIT,
    Permission.FILE_DELETE,
    Permission.FILE_CONFIG_PERMISSION,
    Permission.FILE_PREVIEW,
    Permission.FILE_VIEW_STATS,
    Permission.MESSAGE_VIEW,
    Permission.MESSAGE_ARCHIVE,
    Permission.STATISTICS_VIEW,
    Permission.STATISTICS_EXPORT,
    Permission.AUDIT_VIEW_OWN,
    Permission.AUDIT_VIEW_COLUMN,
    Permission.AUDIT_EXPORT,
    Permission.INQUIRY_VIEW,
    Permission.INQUIRY_REPLY,
    Permission.INQUIRY_ASSIGN,
    Permission.INQUIRY_CLOSE,
    Permission.INQUIRY_TOGGLE_PUBLIC,
    Permission.INQUIRY_EXPORT,
  ],

  system_admin: [
    // 系统管理员: 只负责系统配置/账号/栏目/审计, 不参与内容运营
    //   - 保留: 查看(草稿/待审/驳回/已发布/全站搜索/只读)、栏目管理、文件、消息、统计、审计、敏感词、咨询、系统配置
    //   - 移除: 创建/审核/发布/驳回/撤回/置顶/终审 等内容运营权限(由编辑员/审核员/栏目管理员负责)
    Permission.ARTICLE_DRAFT,
    Permission.ARTICLE_PENDING,
    Permission.ARTICLE_REJECTED,
    Permission.ARTICLE_EDIT_OWN,
    Permission.ARTICLE_PUBLISHED_VIEW,
    Permission.ARTICLE_ALL_SEARCH,
    Permission.ARTICLE_READONLY,
    Permission.COLUMN_MANAGE,
    Permission.COLUMN_RECOMMEND,
    Permission.COLUMN_TAGS,
    Permission.COLUMN_SORT,
    Permission.COLUMN_DISABLE,
    Permission.FILE_UPLOAD,
    Permission.FILE_EDIT,
    Permission.FILE_DELETE,
    Permission.FILE_PHYSICAL_DELETE,
    Permission.FILE_CONFIG_PERMISSION,
    Permission.FILE_PREVIEW,
    Permission.FILE_VIEW_STATS,
    Permission.FILE_SYSTEM_CONFIG,
    Permission.MESSAGE_VIEW,
    Permission.MESSAGE_ARCHIVE,
    Permission.MESSAGE_PUBLISH,
    Permission.MESSAGE_VIEW_ALL,
    Permission.STATISTICS_VIEW,
    Permission.STATISTICS_EXPORT,
    Permission.STATISTICS_VIEW_ALL,
    Permission.AUDIT_VIEW_OWN,
    Permission.AUDIT_VIEW_COLUMN,
    Permission.AUDIT_VIEW_ALL,
    Permission.AUDIT_EXPORT,
    Permission.AUDIT_ARCHIVE,
    Permission.AUDIT_HASH_VERIFY,
    Permission.ADMIN_MANAGE,
    Permission.ADMIN_ROLE_CONFIG,
    Permission.ADMIN_BINDCOLUMN,
    Permission.SYSTEM_SSO_CONFIG,
    Permission.SYSTEM_SENSITIVE,
    Permission.SYSTEM_RATELIMIT,
    Permission.SYSTEM_STATS_FILTER,
    Permission.SYSTEM_TAGS_MANAGE,
    Permission.SENSITIVE_WORD_VIEW,
    Permission.SENSITIVE_WORD_CREATE,
    Permission.SENSITIVE_WORD_UPDATE,
    Permission.SENSITIVE_WORD_DELETE,
    Permission.INQUIRY_VIEW,
    Permission.INQUIRY_REPLY,
    Permission.INQUIRY_ASSIGN,
    Permission.INQUIRY_CLOSE,
    Permission.INQUIRY_TOGGLE_PUBLIC,
    Permission.INQUIRY_EXPORT,
    Permission.INQUIRY_ROUTING_CONFIG,
    Permission.INQUIRY_TIMEOUT_CHECK,
  ],
};

// 接口路径与权限的映射(用于守卫校验)
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  'POST /article': Permission.ARTICLE_CREATE,
  'GET /article': Permission.ARTICLE_READONLY,
  'GET /article/draft': Permission.ARTICLE_DRAFT,
  'GET /article/pending': Permission.ARTICLE_PENDING,
  'GET /article/final-pending': Permission.ARTICLE_FINAL_REVIEW,
  'GET /article/published': Permission.ARTICLE_PUBLISHED_VIEW,
  'GET /article/rejected': Permission.ARTICLE_REJECTED,
  'GET /article/:id': Permission.ARTICLE_READONLY,
  'PUT /article/:id': Permission.ARTICLE_EDIT_OWN,
  'DELETE /article/:id': Permission.ARTICLE_DELETE_DRAFT,
  'POST /article/:id/submit': Permission.ARTICLE_CREATE,
  'POST /article/:id/review': Permission.ARTICLE_REVIEW,
  'POST /article/:id/final-review': Permission.ARTICLE_FINAL_REVIEW,
  'POST /article/:id/resubmit': Permission.ARTICLE_EDIT_OWN,
  'POST /article/:id/withdraw': Permission.ARTICLE_WITHDRAW,
  'POST /article/:id/top': Permission.ARTICLE_TOP,
  'POST /article/:id/unpin': Permission.ARTICLE_TOP,
  'GET /article/all': Permission.ARTICLE_ALL_SEARCH,
  'GET /article/readonly': Permission.ARTICLE_READONLY,
  'POST /column': Permission.COLUMN_MANAGE,
  'PUT /column/:id': Permission.COLUMN_MANAGE,
  'DELETE /column/:id': Permission.COLUMN_MANAGE,
  'POST /column/recommend': Permission.COLUMN_RECOMMEND,
  'POST /homepage/carousel': Permission.COLUMN_RECOMMEND,
  'DELETE /homepage/carousel/:positionCode': Permission.COLUMN_RECOMMEND,
  'PUT /column/sort': Permission.COLUMN_SORT,
  'PUT /column/:id/disable': Permission.COLUMN_DISABLE,
  'PUT /column/:id/enable': Permission.COLUMN_DISABLE,
  'GET /column/tree': Permission.ARTICLE_CREATE,
  'GET /column/mapping/slug-to-id': Permission.COLUMN_MANAGE,
  'GET /column/mapping/id-to-slug': Permission.COLUMN_MANAGE,
  'POST /column/mapping/batch': Permission.COLUMN_MANAGE,
  'GET /statistics': Permission.STATISTICS_VIEW,
  'GET /statistics/all': Permission.STATISTICS_VIEW_ALL,
  'POST /statistics/export': Permission.STATISTICS_EXPORT,
  'GET /audit': Permission.AUDIT_VIEW_OWN,
  'GET /audit/column': Permission.AUDIT_VIEW_COLUMN,
  'GET /audit/all': Permission.AUDIT_VIEW_ALL,
  'POST /audit/export': Permission.AUDIT_EXPORT,
  'POST /audit/archive': Permission.AUDIT_ARCHIVE,
  'POST /audit/hash-verify': Permission.AUDIT_HASH_VERIFY,
  'POST /admin': Permission.ADMIN_MANAGE,
  'GET /admin': Permission.ADMIN_MANAGE,
  'GET /admin/:id': Permission.ADMIN_MANAGE,
  'PUT /admin/:id': Permission.ADMIN_MANAGE,
  'PUT /admin/:id/role': Permission.ADMIN_ROLE_CONFIG,
  'PUT /admin/:id/bind-column': Permission.ADMIN_BINDCOLUMN,
  'POST /admin/batch-bind-columns': Permission.ADMIN_BINDCOLUMN,
  'POST /admin/:id/freeze': Permission.ADMIN_MANAGE,
  'POST /admin/:id/reset-password': Permission.ADMIN_MANAGE,
  'GET /message': Permission.MESSAGE_VIEW,
  'GET /message/all': Permission.MESSAGE_VIEW_ALL,
  'POST /message/publish': Permission.MESSAGE_PUBLISH,
  'POST /system/sso': Permission.SYSTEM_SSO_CONFIG,
  'GET /system/sensitive': Permission.SYSTEM_SENSITIVE,
  'POST /system/sensitive': Permission.SYSTEM_SENSITIVE,
  'GET /system/ratelimit': Permission.SYSTEM_RATELIMIT,
  'PUT /system/ratelimit': Permission.SYSTEM_RATELIMIT,
  'GET /admin/sensitive-words': Permission.SENSITIVE_WORD_VIEW,
  'POST /admin/sensitive-words': Permission.SENSITIVE_WORD_CREATE,
  'POST /admin/sensitive-words/import': Permission.SENSITIVE_WORD_CREATE,
  'POST /admin/sensitive-words/:id': Permission.SENSITIVE_WORD_UPDATE,
  'DELETE /admin/sensitive-words/:id': Permission.SENSITIVE_WORD_DELETE,
  'POST /admin/sensitive-words/:id/toggle': Permission.SENSITIVE_WORD_UPDATE,

  // 文件资源管理
  'POST /files': Permission.FILE_UPLOAD,
  'GET /files': Permission.FILE_VIEW_STATS,
  'GET /files/:id': Permission.FILE_VIEW_STATS,
  'PUT /files/:id': Permission.FILE_EDIT,
  'DELETE /files/:id': Permission.FILE_DELETE,
  'POST /files/:id/physical-delete': Permission.FILE_PHYSICAL_DELETE,
  'PUT /files/:id/permission': Permission.FILE_CONFIG_PERMISSION,
  'GET /files/:id/preview': Permission.FILE_PREVIEW,
  'GET /files/:id/thumbnail': Permission.FILE_PREVIEW,
  'GET /files/:id/download': Permission.FILE_UPLOAD,
  'GET /files/stats': Permission.FILE_VIEW_STATS,
  'PUT /files/system-config': Permission.FILE_SYSTEM_CONFIG,

  // 留言咨询管理 (V2.0 模块十三)
  'GET /inquiries/public': Permission.INQUIRY_VIEW,  // 公开接口无需鉴权，此处仅配置不实际拦截
  'PUT /inquiries/:id/reply': Permission.INQUIRY_REPLY,
  'GET /admin/inquiries': Permission.INQUIRY_VIEW,
  'GET /admin/inquiries/:id': Permission.INQUIRY_VIEW,
  'POST /admin/inquiries/:id/assign': Permission.INQUIRY_ASSIGN,
  'POST /admin/inquiries/:id/close': Permission.INQUIRY_CLOSE,
  'PUT /admin/inquiries/:id/public': Permission.INQUIRY_TOGGLE_PUBLIC,
  'PUT /admin/inquiries/routing-config': Permission.INQUIRY_ROUTING_CONFIG,
  'GET /admin/inquiries/routing-config': Permission.INQUIRY_ROUTING_CONFIG,
  'POST /admin/inquiries/export': Permission.INQUIRY_EXPORT,
  'POST /admin/inquiries/timeout-check': Permission.INQUIRY_TIMEOUT_CHECK,
};
