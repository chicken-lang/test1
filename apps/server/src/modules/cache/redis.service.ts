import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Redis客户端服务
 * 提供Redis连接管理基础能力
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private hasGivenUp = false;

  constructor() {}

  async onModuleInit() {
    try {
      // 从环境变量读取Redis配置
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      const password = process.env.REDIS_PASSWORD || undefined;
      const db = parseInt(process.env.REDIS_DB || '0', 10);

      this.client = new Redis({
        host,
        port,
        password,
        db,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            if (!this.hasGivenUp) {
              this.hasGivenUp = true;
              this.logger.warn('Redis连接重试次数超过限制，已降级为内存模式');
            }
            return null;
          }
          return Math.min(times * 2000, 10000);
        },
      });

      this.client.on('error', (err) => {
        if (!this.hasGivenUp) {
          this.logger.warn(`Redis连接异常: ${err.message}`);
        }
        // 放弃后清理客户端，避免后续继续触发错误事件
        if (this.hasGivenUp && this.client) {
          this.client.disconnect();
          this.client = null;
        }
      });

      this.client.on('connect', () => {
        this.logger.log('Redis连接成功');
      });

      this.logger.log(`Redis服务初始化: ${host}:${port}`);
    } catch (error) {
      this.logger.warn('Redis初始化失败，将使用内存缓存:', error.message);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.logger.log('Redis连接已关闭');
    }
  }

  /**
   * 获取Redis客户端
   */
  getClient() {
    return this.client;
  }

  /**
   * 检查Redis是否可用
   */
  isAvailable(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  /**
   * 读取字符串
   */
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      return await this.client!.get(key);
    } catch {
      return null;
    }
  }

  /**
   * 设置字符串（带过期时间）
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
    } catch {
      // 静默处理
    }
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await this.client!.del(key);
    } catch {
      // 静默处理
    }
  }

  /**
   * 获取哈希表字段
   */
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      return await this.client!.hget(key, field);
    } catch {
      return null;
    }
  }

  /**
   * 设置哈希表字段
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await this.client!.hset(key, field, value);
    } catch {
      // 静默处理
    }
  }

  /**
   * 删除哈希表字段
   */
  async hdel(key: string, field: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await this.client!.hdel(key, field);
    } catch {
      // 静默处理
    }
  }

  /**
   * 获取哈希表所有字段
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.isAvailable()) return {};
    try {
      return await this.client!.hgetall(key);
    } catch {
      return {};
    }
  }

  /**
   * 获取集合成员数量
   */
  async scard(key: string): Promise<number> {
    if (!this.isAvailable()) return 0;
    try {
      return await this.client!.scard(key);
    } catch {
      return 0;
    }
  }

  /**
   * 移除集合成员
   */
  async srem(key: string, member: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await this.client!.srem(key, member);
    } catch {
      // 静默处理
    }
  }

  /**
   * 发布消息
   */
  async publish(channel: string, message: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await this.client!.publish(channel, message);
    } catch {
      // 静默处理
    }
  }

  /**
   * 订阅频道
   */
  subscribe(channel: string, callback: (message: string) => void): void {
    if (!this.isAvailable()) return;
    try {
      this.client!.subscribe(channel);
      this.client!.on('message', (ch, msg) => {
        if (ch === channel) {
          callback(msg);
        }
      });
    } catch {
      // 静默处理
    }
  }
}