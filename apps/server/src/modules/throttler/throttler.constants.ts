/**
 * 限流常量配置
 * 定义各业务场景的限流预设
 */

/**
 * 限流预设名称
 */
export const ThrottlerPreset = {
  /** 默认限流（全局） */
  DEFAULT: 'default',
  /** 严格限流（登录、注册等敏感操作） */
  STRICT: 'strict',
  /** 宽松限流（搜索、列表查询等） */
  RELAXED: 'relaxed',
} as const;

export type ThrottlerPresetType = (typeof ThrottlerPreset)[keyof typeof ThrottlerPreset];

/**
 * 各预设对应的限流参数（ttl 单位: 毫秒, limit: 次数）
 */
export const THROTTLER_PRESETS: Record<
  ThrottlerPresetType,
  { ttl: number; limit: number }
> = {
  [ThrottlerPreset.DEFAULT]: {
    ttl: 60_000,   // 1 分钟
    limit: 60,     // 60 次/分钟
  },
  [ThrottlerPreset.STRICT]: {
    ttl: 300_000,  // 5 分钟
    limit: 5,      // 5 次/5分钟
  },
  [ThrottlerPreset.RELAXED]: {
    ttl: 60_000,   // 1 分钟
    limit: 120,    // 120 次/分钟
  },
};

/**
 * Redis key 前缀
 */
export const THROTTLE_KEY_PREFIX = 'throttle';

/**
 * 限流响应消息
 */
export const THROTTLE_MESSAGES: Record<ThrottlerPresetType, string> = {
  [ThrottlerPreset.DEFAULT]: '请求过于频繁，请稍后再试',
  [ThrottlerPreset.STRICT]: '操作过于频繁，请5分钟后再试',
  [ThrottlerPreset.RELAXED]: '查询过于频繁，请稍后再试',
};
