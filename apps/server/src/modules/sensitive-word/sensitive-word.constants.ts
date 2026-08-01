/**
 * 敏感词级别常量
 */
export enum SensitiveWordLevel {
  LOW = 'LOW', // 低级敏感词,自动脱敏
  HIGH = 'HIGH', // 高危敏感词,直接拦截
}

/**
 * 敏感词分类常量
 */
export enum SensitiveWordCategory {
  POLITICAL = 'political', // 政治类
  PORNOGRAPHIC = 'pornographic', // 色情类
  VIOLENT = 'violent', // 暴力类
  ADVERTISING = 'advertising', // 广告类
  OTHER = 'other', // 其他
}

/**
 * 风控触发来源
 */
export enum RiskControlSourceType {
  VISITOR_SUBMIT = 'VISITOR_SUBMIT', // 访客投稿
  ADMIN_SUBMIT = 'ADMIN_SUBMIT', // 管理员提交文稿
  COMMENT = 'COMMENT', // 评论
  ANNOUNCEMENT = 'ANNOUNCEMENT', // 公告
  FILE_UPLOAD = 'FILE_UPLOAD', // 文件上传
}

/**
 * 风控处置动作
 */
export enum RiskControlAction {
  PASS = 'PASS', // 放行
  DESENSITIZED = 'DESENSITIZED', // 脱敏处理
  BLOCKED = 'BLOCKED', // 拦截
}

/**
 * 过滤结果类型
 */
export enum FilterResultType {
  PASS = 'PASS',
  DESENSITIZED = 'DESENSITIZED',
  BLOCKED = 'BLOCKED',
}

/**
 * 默认替换文本
 */
export const DEFAULT_REPLACEMENT = '***';

/**
 * 性能指标:单篇文稿检测超时阈值(毫秒)
 */
export const FILTER_TIMEOUT_MS = 50;

/**
 * 词库缓存刷新间隔(毫秒)
 */
export const CACHE_REFRESH_INTERVAL_MS = 5000;

/**
 * 批量导入敏感词上限
 */
export const BATCH_IMPORT_LIMIT = 1000;