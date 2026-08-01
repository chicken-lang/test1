import { Injectable, Inject, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from '../cache/redis.service.js';
import { THROTTLE_KEY_PREFIX } from './throttler.constants.js';

/** ThrottlerStorageRecord 接口（v6 未从主入口导出） */
interface StorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * 基于 Redis 的限流存储
 * 使用滑动窗口算法，支持分布式部署下的精确限流
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(@Inject(RedisService) private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<StorageRecord> {
    const redisKey = `${THROTTLE_KEY_PREFIX}:${throttlerName}:${key}`;
    const now = Date.now();
    const ttlMs = ttl; // ttl 在 v6 中是毫秒
    const windowStart = now - ttlMs;

    try {
      const client = this.redisService.getClient();

      if (!client || !this.redisService.isAvailable()) {
        // Redis 不可用时降级为放行
        return this.buildRecord([], now, ttlMs, limit, blockDuration);
      }

      // 使用 Redis Sorted Set 实现滑动窗口
      // 1. 移除窗口外的记录
      await client.zremrangebyscore(redisKey, 0, windowStart);

      // 2. 添加当前请求时间戳（member 和 score 都用当前时间 + 随机因子避免冲突）
      const member = `${now}:${Math.random().toString(36).slice(2, 6)}`;
      await client.zadd(redisKey, now, member);

      // 3. 获取窗口内的请求数
      const totalHits = await client.zcard(redisKey);

      // 4. 设置 key 过期时间（兜底清理）
      const ttlSeconds = Math.ceil(ttlMs / 1000) + 10;
      await client.expire(redisKey, ttlSeconds);

      // 5. 如果超出限制且有 blockDuration，设置封锁
      const isBlocked = blockDuration > 0 && totalHits > limit;
      let timeToBlockExpire = 0;

      if (isBlocked && blockDuration > 0) {
        const blockKey = `${THROTTLE_KEY_PREFIX}:block:${throttlerName}:${key}`;
        const blockExpireAt = now + blockDuration;
        await client.set(blockKey, '1', 'PX', blockDuration);
        timeToBlockExpire = blockDuration;
      }

      // 6. 获取最早一条记录来计算 timeToExpire
      const oldest = await client.zrange(redisKey, 0, 0, 'WITHSCORES');
      let timeToExpire = Math.ceil(ttlMs / 1000);
      if (oldest && oldest.length >= 2) {
        const oldestScore = Number(oldest[1]);
        timeToExpire = Math.max(1, Math.ceil((oldestScore + ttlMs - now) / 1000));
      }

      return {
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      };
    } catch (error) {
      this.logger.warn(`Redis限流存储操作异常，降级放行: ${error.message}`);
      // 异常时降级放行
      return {
        totalHits: 0,
        timeToExpire: Math.ceil(ttlMs / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }

  private buildRecord(
    _timestamps: number[],
    now: number,
    ttlMs: number,
    limit: number,
    blockDuration: number,
  ): StorageRecord {
    return {
      totalHits: 0,
      timeToExpire: Math.ceil(ttlMs / 1000),
      isBlocked: false,
      timeToBlockExpire: blockDuration > 0 ? blockDuration : 0,
    };
  }
}
