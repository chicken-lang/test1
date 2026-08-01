// ==================== 轮播图位置编码 ====================
export enum PositionCode {
  CAROUSEL_A = 'CAROUSEL_A', // 首页轮播区（A分区）
  CAROUSEL_B = 'CAROUSEL_B', // 备用轮播区
}

export const POSITION_CODE_VALUES = Object.values(PositionCode)

// ==================== 轮播图状态 ====================
export enum CarouselStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// ==================== 轮播图数量约束 ====================
export const CAROUSEL_MAX_COUNT = 5

// ==================== 缓存键前缀 ====================
export const CAROUSEL_CACHE_KEY_PREFIX = 'homepage:carousel:'

// ==================== 缓存过期时间（秒）====================
export const CAROUSEL_CACHE_TTL = 3600 // 1小时

// ==================== 业务错误码 ====================
export const CarouselErrorCode = {
  MAX_COUNT_EXCEEDED: 40001,
  ARTICLE_NOT_FOUND: 40002,
  ARTICLE_NOT_PUBLISHED: 40003,
  COVER_IMAGE_NOT_FOUND: 40004,
  POSITION_CODE_INVALID: 40005,
  DUPLICATE_ARTICLE: 40006,
}

// ==================== 审计动作类型 ====================
export const CAROUSEL_AUDIT_ACTIONS = {
  CONFIG_UPDATE: 'carousel_config_update',
}