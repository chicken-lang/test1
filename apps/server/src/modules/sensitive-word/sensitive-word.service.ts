import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  SensitiveWordLevel,
  RiskControlSourceType,
  RiskControlAction,
  FilterResultType,
  DEFAULT_REPLACEMENT,
  FILTER_TIMEOUT_MS,
} from './sensitive-word.constants.js';
import { MatchedWord, FilterResult } from './dto/sensitive-word.dto.js';
import { SensitiveWordCacheManager } from '../cache/sensitive-word-cache.manager.js';
import { ArticleDecryptionService } from './article-decryption.service.js';

/**
 * DFA字典树节点
 */
interface TrieNode {
  isEnd: boolean;
  word?: string;
  level?: SensitiveWordLevel;
  category?: string;
  replacement?: string;
  children: Map<string, TrieNode>;
}

/**
 * 敏感词过滤服务
 * 核心功能:
 * 1. DFA算法实现敏感词匹配
 * 2. 分级处置(放行/脱敏/拦截)
 * 3. 风控日志记录
 * 4. 内存缓存机制
 * 5. Redis分布式缓存(可选)
 * 6. 涉密公文RSA解密
 */
@Injectable()
export class SensitiveWordService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SensitiveWordService.name);
  private trieRoot: TrieNode;
  private cacheUpdateTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  // Redis缓存开关（通过环境变量控制）
  private readonly useRedisCache: boolean;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SensitiveWordCacheManager) private readonly cacheManager: SensitiveWordCacheManager,
    @Inject(ArticleDecryptionService) private readonly decryptionService: ArticleDecryptionService,
  ) {
    this.trieRoot = this.createTrieNode();

    // 从环境变量读取Redis缓存配置
    this.useRedisCache = process.env.USE_REDIS_CACHE === 'true';
  }

  /**
   * 模块初始化时加载敏感词库
   */
  async onModuleInit() {
    await this.loadSensitiveWords();
    this.startCacheRefreshTimer();
    this.isInitialized = true;
    this.logger.log(
      `敏感词服务初始化完成，Redis缓存: ${this.useRedisCache ? '开启' : '关闭'}`,
    );
  }

  /**
   * 模块销毁时清理定时器
   */
  onModuleDestroy() {
    if (this.cacheUpdateTimer) {
      clearInterval(this.cacheUpdateTimer);
      this.cacheUpdateTimer = null;
    }
  }

  /**
   * 创建字典树节点
   */
  private createTrieNode(): TrieNode {
    return {
      isEnd: false,
      children: new Map<string, TrieNode>(),
    };
  }

  /**
   * 从数据源加载敏感词到内存
   * 优先使用Redis缓存，Redis不可用时回退到数据库
   */
  private async loadSensitiveWords(): Promise<void> {
    let words: any[] = [];
    let loadSource: 'redis' | 'database' | 'empty' = 'empty';

    try {
      // 1. 如果启用了Redis缓存，尝试从Redis读取
      if (this.useRedisCache) {
        try {
          const needsRefresh = await this.cacheManager.needsRefresh();
          if (!needsRefresh) {
            const cachedWords = await this.cacheManager.loadSensitiveWordsFromCache();
            if (cachedWords.length > 0) {
              words = cachedWords;
              loadSource = 'redis';
              this.logger.debug(`从Redis缓存加载${words.length}条敏感词`);
            }
          }
        } catch (redisError) {
          // Redis读取异常不应阻塞词库加载，降级到数据库
          this.logger.warn(
            `Redis缓存读取失败，降级到数据库加载: ${redisError instanceof Error ? redisError.message : String(redisError)}`,
          );
        }
      }

      // 2. Redis缓存不可用或需要刷新，从数据库加载
      if (words.length === 0) {
        words = await this.prisma.sensitiveWord.findMany({
          where: { isActive: true },
        });
        loadSource = 'database';

        // 3. 如果启用了Redis缓存，将数据库结果写入Redis（失败不影响主流程）
        if (this.useRedisCache && words.length > 0) {
          try {
            await this.cacheManager.cacheSensitiveWords(words);
          } catch (cacheWriteError) {
            this.logger.warn(
              `写入Redis缓存失败，不影响本次加载: ${cacheWriteError instanceof Error ? cacheWriteError.message : String(cacheWriteError)}`,
            );
          }
        }

        this.logger.debug(`从数据库加载${words.length}条敏感词`);
      }

      // 4. 重建DFA字典树
      this.trieRoot = this.createTrieNode();
      for (const word of words) {
        this.insertWord(word.word, word.level, word.category, word.replacement);
      }

      this.logger.log(`敏感词加载完成（来源: ${loadSource}），共${words.length}条`);
    } catch (error) {
      // 数据库加载失败属于严重错误，保留旧字典树以保证服务可用
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `加载敏感词失败（来源: ${loadSource}）: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      // 不抛出异常，保留已加载的旧字典树继续提供服务
    }
  }

  /**
   * 向字典树插入敏感词
   * 入库时大小写归一化(英文统一小写),避免 "Word"/"WORD" 大小写变体绕过检测
   */
  private insertWord(
    word: string,
    level: string,
    category: string,
    replacement: string,
  ): void {
    let node = this.trieRoot;

    const normalized = word.toLowerCase();
    for (const char of normalized) {
      if (!node.children.has(char)) {
        node.children.set(char, this.createTrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEnd = true;
    node.word = word; // 保留原始词用于日志/展示
    node.level = level as SensitiveWordLevel;
    node.category = category;
    node.replacement = replacement || DEFAULT_REPLACEMENT;
  }

  /**
   * 启动定时器定期刷新缓存
   */
  private startCacheRefreshTimer(): void {
    this.cacheUpdateTimer = setInterval(async () => {
      await this.loadSensitiveWords();
    }, 60_000);
  }

  /**
   * 核心方法: 过滤涉密公文文本内容
   * @param content 普通内容
   * @param encryptedContent 加密内容
   * @param secretLevel 保密级别
   * @param sourceType 触发来源
   * @param userId 操作用户ID
   * @param ipAddress 操作IP地址
   * @param articleId 关联稿件ID
   * @returns 过滤结果
   */
  async filterArticleContent(
    content: string | null,
    encryptedContent: string | null,
    secretLevel: string,
    sourceType: RiskControlSourceType,
    userId?: number,
    ipAddress?: string,
    articleId?: number,
  ): Promise<FilterResult> {
    // 1. 获取明文内容（涉密公文先解密）
    let textToFilter = '';

    if (secretLevel === 'CONFIDENTIAL' && encryptedContent) {
      this.logger.debug('检测到涉密公文，开始RSA解密...');
      try {
        textToFilter = await this.decryptionService.getPlainTextForSensitiveCheck(
          content,
          encryptedContent,
          secretLevel,
        );

        // 解密后的明文立即从内存清除（安全基线要求）
        // 这里通过不再保存明文引用来实现
        this.logger.debug('涉密公文解密成功，开始敏感词检测');
      } catch (error) {
        this.logger.error('涉密公文解密失败，将使用脱敏标记');
        textToFilter = '[ENCRYPTED]';
      }
    } else {
      // 普通稿件直接使用原文
      textToFilter = content || '';
    }

    // 2. 如果是加密失败的涉密公文，直接放行（不记录原文）
    if (textToFilter === '[ENCRYPTED]') {
      await this.logRiskControl(
        '[ENCRYPTED]',
        [],
        RiskControlAction.PASS,
        sourceType,
        userId,
        ipAddress,
        articleId,
      );
      return {
        type: FilterResultType.PASS,
        matchedWords: [],
      };
    }

    // 3. 执行敏感词过滤
    return this.filterText(textToFilter, sourceType, userId, ipAddress, articleId);
  }

  /**
   * 核心方法: 过滤文本内容
   * @param text 待过滤的文本
   * @param sourceType 触发来源
   * @param userId 操作用户ID
   * @param ipAddress 操作IP地址
   * @param articleId 关联稿件ID
   * @returns 过滤结果
   */
  async filterText(
    text: string,
    sourceType: RiskControlSourceType,
    userId?: number,
    ipAddress?: string,
    articleId?: number,
  ): Promise<FilterResult> {
    const startTime = Date.now();

    try {
      // 1. 执行敏感词匹配
      const matchedWords = this.matchAll(text);

      // 2. 检查是否超时
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > FILTER_TIMEOUT_MS) {
        this.logger.warn(
          `过滤超时: ${elapsedTime}ms，文本长度: ${text.length}`,
        );
        // 超时降级为放行
        await this.logRiskControl(
          text,
          [],
          RiskControlAction.PASS,
          sourceType,
          userId,
          ipAddress,
          articleId,
        );
        return {
          type: FilterResultType.PASS,
          matchedWords: [],
        };
      }

      // 3. 未匹配到敏感词，放行
      if (matchedWords.length === 0) {
        await this.logRiskControl(
          text,
          [],
          RiskControlAction.PASS,
          sourceType,
          userId,
          ipAddress,
          articleId,
        );
        return {
          type: FilterResultType.PASS,
          matchedWords: [],
        };
      }

      // 4. 检查是否包含高危敏感词
      const hasHighRisk = matchedWords.some(
        (w) => w.level === SensitiveWordLevel.HIGH,
      );

      if (hasHighRisk) {
        // 高危敏感词:直接拦截
        await this.logRiskControl(
          text,
          matchedWords,
          RiskControlAction.BLOCKED,
          sourceType,
          userId,
          ipAddress,
          articleId,
        );
        return {
          type: FilterResultType.BLOCKED,
          matchedWords,
        };
      }

      // 5. 低级敏感词:自动脱敏
      const desensitizedText = this.desensitizeText(text, matchedWords);
      await this.logRiskControl(
        desensitizedText,
        matchedWords,
        RiskControlAction.DESENSITIZED,
        sourceType,
        userId,
        ipAddress,
        articleId,
      );
      return {
        type: FilterResultType.DESENSITIZED,
        matchedWords,
        desensitizedText,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `过滤过程异常 - sourceType=${sourceType}, userId=${userId ?? 'anonymous'}, ` +
          `textLength=${text.length}, articleId=${articleId ?? 'none'}: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      // 异常情况降级为放行，避免阻断业务主流程
      await this.logRiskControl(
        text,
        [],
        RiskControlAction.PASS,
        sourceType,
        userId,
        ipAddress,
        articleId,
      );
      return {
        type: FilterResultType.PASS,
        matchedWords: [],
      };
    }
  }

  /**
   * DFA算法: 匹配所有敏感词
   * 匹配时与入库保持相同的大小写归一化,使英文敏感词匹配不区分大小写
   * (toLowerCase 不改变字符长度,startIndex/endIndex 在原文中位置一致)
   */
  private matchAll(text: string): MatchedWord[] {
    const matchedWords: MatchedWord[] = [];
    const normalizedText = text.toLowerCase();
    const n = normalizedText.length;

    for (let i = 0; i < n; i++) {
      let node = this.trieRoot;
      let j = i;

      while (j < n && node.children.has(normalizedText[j])) {
        node = node.children.get(normalizedText[j])!;
        j++;

        if (node.isEnd) {
          matchedWords.push({
            word: node.word!,
            level: node.level!,
            category: node.category!,
            replacement: node.replacement!,
            startIndex: i,
            endIndex: j,
          });
        }
      }
    }

    // 去重(同一个词可能被多次匹配)
    const uniqueWords = new Map<string, MatchedWord>();
    for (const match of matchedWords) {
      const key = `${match.word}_${match.startIndex}`;
      if (!uniqueWords.has(key)) {
        uniqueWords.set(key, match);
      }
    }

    return Array.from(uniqueWords.values());
  }

  /**
   * 脱敏处理:替换敏感词
   */
  private desensitizeText(text: string, matchedWords: MatchedWord[]): string {
    // 按起始位置倒序排列,避免替换时位置偏移
    const sortedMatches = matchedWords.sort((a, b) => b.startIndex - a.startIndex);

    let result = text;
    for (const match of sortedMatches) {
      result =
        result.substring(0, match.startIndex) +
        match.replacement +
        result.substring(match.endIndex);
    }

    return result;
  }

  /**
   * 记录风控日志
   */
  private async logRiskControl(
    content: string,
    matchedWords: MatchedWord[],
    action: RiskControlAction,
    sourceType: RiskControlSourceType,
    userId?: number,
    ipAddress?: string,
    articleId?: number,
  ): Promise<void> {
    try {
      await this.prisma.riskControlLog.create({
        data: {
          sourceType,
          userId: userId || null,
          ipAddress: ipAddress || null,
          contentSnapshot: content, // TODO: 加密存储
          matchedWords: JSON.stringify(matchedWords),
          action,
          articleId: articleId || null,
        },
      });
    } catch (error) {
      // 风控日志写入失败不应影响主业务流程，但要记录足够上下文便于排查
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `记录风控日志失败 - action=${action}, sourceType=${sourceType}, ` +
          `userId=${userId ?? 'anonymous'}, articleId=${articleId ?? 'none'}, ` +
          `matchedCount=${matchedWords.length}: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * 手动刷新缓存(供管理接口调用)
   * 同时通知Redis缓存失效
   */
  async refreshCache(): Promise<void> {
    try {
      // 如果启用了Redis缓存，先通知所有节点缓存失效
      if (this.useRedisCache) {
        try {
          await this.cacheManager.invalidateCache();
        } catch (error) {
          // 缓存失效通知失败不应阻塞本地重载
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Redis缓存失效通知失败，继续本地重载: ${errMsg}`);
        }
      }

      // 重新加载敏感词
      await this.loadSensitiveWords();

      this.logger.log('敏感词缓存已刷新');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `刷新敏感词缓存失败: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error; // 管理操作需要感知失败
    }
  }

  /**
   * 添加敏感词后更新缓存
   */
  async addWordAndRefreshCache(word: any): Promise<void> {
    try {
      if (this.useRedisCache) {
        try {
          await this.cacheManager.addWordToCache(word);
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Redis缓存添加敏感词失败，降级本地重载: ${errMsg}`);
        }
      }
      // 重新加载以更新DFA字典树
      await this.loadSensitiveWords();
      this.logger.debug(`已添加敏感词并刷新缓存: word="${word?.word ?? ''}"`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`添加敏感词后刷新缓存失败: ${errMsg}`);
      throw error;
    }
  }

  /**
   * 删除敏感词后更新缓存
   */
  async removeWordAndRefreshCache(word: string): Promise<void> {
    try {
      if (this.useRedisCache) {
        try {
          await this.cacheManager.removeWordFromCache(word);
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Redis缓存删除敏感词失败，降级本地重载: ${errMsg}`);
        }
      }
      await this.loadSensitiveWords();
      this.logger.debug(`已删除敏感词并刷新缓存: word="${word}"`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`删除敏感词后刷新缓存失败: ${errMsg}`);
      throw error;
    }
  }

  /**
   * 切换敏感词启用状态后更新缓存
   */
  async toggleWordAndRefreshCache(word: string, isActive: boolean): Promise<void> {
    try {
      if (this.useRedisCache) {
        try {
          await this.cacheManager.toggleWordActiveInCache(word, isActive);
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Redis缓存切换敏感词状态失败，降级本地重载: ${errMsg}`);
        }
      }
      await this.loadSensitiveWords();
      this.logger.debug(
        `已切换敏感词状态并刷新缓存: word="${word}", isActive=${isActive}`,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`切换敏感词状态后刷新缓存失败: ${errMsg}`);
      throw error;
    }
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 检测文本中是否包含敏感词(不记录日志,仅供前端预检测)
   */
  checkText(text: string): { hasSensitiveWord: boolean; words: string[] } {
    // 入参校验:空字符串、非字符串输入均直接返回未命中
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return { hasSensitiveWord: false, words: [] };
    }

    const matchedWords = this.matchAll(text);
    return {
      hasSensitiveWord: matchedWords.length > 0,
      words: matchedWords.map((w) => w.word),
    };
  }
}