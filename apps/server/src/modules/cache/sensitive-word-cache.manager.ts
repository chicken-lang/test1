import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { RedisService } from './redis.service.js';

/**
 * 敏感词Redis缓存管理器
 * 实现敏感词的分布式缓存和多节点同步
 */
@Injectable()
export class SensitiveWordCacheManager implements OnModuleInit {
  private readonly logger = new Logger(SensitiveWordCacheManager.name);

  // Redis键名常量
  private static readonly SENSITIVE_WORDS_HASH = 'sensitive_words:all';
  private static readonly CACHE_VERSION_KEY = 'sensitive_words:version';
  private static readonly CACHE_INVALIDATE_CHANNEL = 'sensitive_words:invalidate';

  // 本地缓存版本号
  private localVersion = 0;

  constructor(@Inject(RedisService) private readonly redisService: RedisService) {}

  async onModuleInit() {
    // Redis不可用时跳过订阅
    if (!this.redisService?.isAvailable()) {
      this.logger.warn('Redis不可用，敏感词缓存管理器跳过初始化');
      return;
    }

    // 订阅缓存失效通知
    this.redisService.subscribe(
      SensitiveWordCacheManager.CACHE_INVALIDATE_CHANNEL,
      (message) => {
        this.logger.log(`收到缓存失效通知: ${message}`);
        // 更新本地版本号，触发缓存刷新
        this.localVersion = 0;
      },
    );

    this.logger.log('敏感词缓存管理器初始化完成');
  }

  /**
   * 从Redis加载所有敏感词
   * @returns 敏感词记录数组
   */
  async loadSensitiveWordsFromCache(): Promise<any[]> {
    try {
      // 检查缓存版本
      const cachedVersion = await this.redisService.get(
        SensitiveWordCacheManager.CACHE_VERSION_KEY,
      );

      // 如果版本号一致，直接从Redis读取
      if (cachedVersion && parseInt(cachedVersion) === this.localVersion) {
        // 从Redis Hash读取所有敏感词
        const cachedWords = await this.redisService.hgetall(
          SensitiveWordCacheManager.SENSITIVE_WORDS_HASH,
        );

        // 转换为数组格式
        return Object.values(cachedWords).map((value) => JSON.parse(value));
      }

      // 版本不一致或缓存不存在，返回空数组让调用方从数据库加载
      return [];
    } catch (error) {
      this.logger.error('从Redis加载敏感词失败:', error);
      return [];
    }
  }

  /**
   * 将敏感词列表缓存到Redis
   * @param words 敏感词记录数组
   */
  async cacheSensitiveWords(words: any[]): Promise<void> {
    try {
      // 清空旧缓存
      const client = this.redisService.getClient();
      if (client) {
        await client.del(SensitiveWordCacheManager.SENSITIVE_WORDS_HASH);
      }

      // 写入新缓存（使用Hash存储，key为word）
      for (const word of words) {
        const { word: wordText, ...rest } = word;
        await this.redisService.hset(
          SensitiveWordCacheManager.SENSITIVE_WORDS_HASH,
          wordText,
          JSON.stringify({ word: wordText, ...rest }),
        );
      }

      // 更新缓存版本号
      const newVersion = Date.now();
      await this.redisService.set(
        SensitiveWordCacheManager.CACHE_VERSION_KEY,
        newVersion.toString(),
      );

      // 更新本地版本号
      this.localVersion = newVersion;

      this.logger.log(`敏感词缓存更新完成，共${words.length}条`);
    } catch (error) {
      this.logger.error('缓存敏感词到Redis失败:', error);
    }
  }

  /**
   * 使缓存失效（通知所有节点刷新）
   */
  async invalidateCache(): Promise<void> {
    try {
      // 发布缓存失效通知
      await this.redisService.publish(
        SensitiveWordCacheManager.CACHE_INVALIDATE_CHANNEL,
        `invalidate:${Date.now()}`,
      );

      // 更新当前节点的版本号
      this.localVersion = 0;

      this.logger.log('敏感词缓存已失效，通知所有节点');
    } catch (error) {
      this.logger.error('通知缓存失效失败:', error);
      // 即使通知失败，也要清空本地版本号
      this.localVersion = 0;
    }
  }

  /**
   * 添加单个敏感词到缓存
   */
  async addWordToCache(word: any): Promise<void> {
    try {
      await this.redisService.hset(
        SensitiveWordCacheManager.SENSITIVE_WORDS_HASH,
        word.word,
        JSON.stringify(word),
      );

      // 更新缓存版本号
      const newVersion = Date.now();
      await this.redisService.set(
        SensitiveWordCacheManager.CACHE_VERSION_KEY,
        newVersion.toString(),
      );
      this.localVersion = newVersion;

      this.logger.log(`敏感词 "${word.word}" 已添加到缓存`);
    } catch (error) {
      this.logger.error('添加敏感词到缓存失败:', error);
    }
  }

  /**
   * 从缓存移除单个敏感词
   */
  async removeWordFromCache(word: string): Promise<void> {
    try {
      await this.redisService.hdel(
        SensitiveWordCacheManager.SENSITIVE_WORDS_HASH,
        word,
      );

      // 更新缓存版本号
      const newVersion = Date.now();
      await this.redisService.set(
        SensitiveWordCacheManager.CACHE_VERSION_KEY,
        newVersion.toString(),
      );
      this.localVersion = newVersion;

      this.logger.log(`敏感词 "${word}" 已从缓存移除`);
    } catch (error) {
      this.logger.error('从缓存移除敏感词失败:', error);
    }
  }

  /**
   * 切换敏感词启用状态
   */
  async toggleWordActiveInCache(word: string, isActive: boolean): Promise<void> {
    try {
      // 从缓存读取现有数据
      const cachedData = await this.redisService.hget(
        SensitiveWordCacheManager.SENSITIVE_WORDS_HASH,
        word,
      );

      if (cachedData) {
        const wordObj = JSON.parse(cachedData);
        wordObj.isActive = isActive;

        // 更新缓存
        await this.redisService.hset(
          SensitiveWordCacheManager.SENSITIVE_WORDS_HASH,
          word,
          JSON.stringify(wordObj),
        );

        // 更新版本号
        const newVersion = Date.now();
        await this.redisService.set(
          SensitiveWordCacheManager.CACHE_VERSION_KEY,
          newVersion.toString(),
        );
        this.localVersion = newVersion;

        this.logger.log(`敏感词 "${word}" 状态已更新为 ${isActive ? '启用' : '禁用'}`);
      }
    } catch (error) {
      this.logger.error('更新敏感词缓存状态失败:', error);
    }
  }

  /**
   * 检查本地缓存是否需要刷新
   */
  async needsRefresh(): Promise<boolean> {
    try {
      const cachedVersion = await this.redisService.get(
        SensitiveWordCacheManager.CACHE_VERSION_KEY,
      );

      if (!cachedVersion) {
        return true; // 没有缓存，需要刷新
      }

      return parseInt(cachedVersion) !== this.localVersion;
    } catch {
      return true; // Redis不可用时，需要刷新
    }
  }
}