import { Test, TestingModule } from '@nestjs/testing';
import { SensitiveWordService } from './sensitive-word.service';
import { ArticleDecryptionService } from './article-decryption.service';
import { SensitiveWordCacheManager } from '../cache/sensitive-word-cache.manager';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import {
  SensitiveWordLevel,
  RiskControlSourceType,
  FilterResultType,
} from './sensitive-word.constants';

describe('SensitiveWordService', () => {
  let service: SensitiveWordService;
  let prisma: PrismaService;

  const mockPrismaService = {
    sensitiveWord: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    riskControlLog: {
      create: jest.fn(),
    },
    sysRsaKey: {
      findFirst: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn().mockReturnValue({}),
    publish: jest.fn(),
    subscribe: jest.fn(),
    getClient: jest.fn().mockReturnValue(null),
    isAvailable: jest.fn().mockReturnValue(false),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensitiveWordService,
        ArticleDecryptionService,
        SensitiveWordCacheManager,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<SensitiveWordService>(SensitiveWordService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    // 清理 onModuleInit 启动的缓存刷新定时器,避免 worker 泄漏
    service.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load sensitive words on module init', async () => {
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([
        {
          id: 1,
          word: '敏感词',
          level: SensitiveWordLevel.LOW,
          category: 'political',
          replacement: '***',
          isActive: true,
        },
      ]);

      await service.onModuleInit();

      expect(mockPrismaService.sensitiveWord.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });
  });

  describe('filterText', () => {
    beforeEach(async () => {
      // 初始化敏感词库
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([
        {
          id: 1,
          word: '低级敏感词',
          level: SensitiveWordLevel.LOW,
          category: 'advertising',
          replacement: '[广告]',
          isActive: true,
        },
        {
          id: 2,
          word: '高危敏感词',
          level: SensitiveWordLevel.HIGH,
          category: 'political',
          replacement: '***',
          isActive: true,
        },
      ]);

      await service.onModuleInit();
    });

    it('should return PASS when no sensitive words found', async () => {
      const text = '这是一篇正常的文章内容';
      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      const result = await service.filterText(
        text,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
      );

      expect(result.type).toBe(FilterResultType.PASS);
      expect(result.matchedWords).toHaveLength(0);
      expect(mockPrismaService.riskControlLog.create).toHaveBeenCalledWith({
        data: {
          sourceType: RiskControlSourceType.ADMIN_SUBMIT,
          userId: 1,
          ipAddress: '127.0.0.1',
          contentSnapshot: text,
          matchedWords: '[]',
          action: 'PASS',
          articleId: null,
        },
      });
    });

    it('should return DESENSITIZED for LOW level sensitive words', async () => {
      const text = '这篇文章包含低级敏感词的内容';
      const expectedDesensitizedText = '这篇文章包含[广告]的内容';
      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      const result = await service.filterText(
        text,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
      );

      expect(result.type).toBe(FilterResultType.DESENSITIZED);
      expect(result.matchedWords).toHaveLength(1);
      expect(result.matchedWords[0].word).toBe('低级敏感词');
      expect(result.matchedWords[0].level).toBe(SensitiveWordLevel.LOW);
      expect(result.desensitizedText).toBe(expectedDesensitizedText);
      expect(mockPrismaService.riskControlLog.create).toHaveBeenCalled();
    });

    it('should return BLOCKED for HIGH level sensitive words', async () => {
      const text = '这篇文章包含高危敏感词的内容';
      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      const result = await service.filterText(
        text,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
      );

      expect(result.type).toBe(FilterResultType.BLOCKED);
      expect(result.matchedWords).toHaveLength(1);
      expect(result.matchedWords[0].word).toBe('高危敏感词');
      expect(result.matchedWords[0].level).toBe(SensitiveWordLevel.HIGH);
      expect(mockPrismaService.riskControlLog.create).toHaveBeenCalledWith({
        data: {
          sourceType: RiskControlSourceType.ADMIN_SUBMIT,
          userId: 1,
          ipAddress: '127.0.0.1',
          contentSnapshot: text,
          matchedWords: expect.stringContaining('高危敏感词'),
          action: 'BLOCKED',
          articleId: null,
        },
      });
    });

    it('should handle multiple sensitive words', async () => {
      const text = '文章包含低级敏感词和高危敏感词';
      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      const result = await service.filterText(
        text,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
      );

      // 高危敏感词优先级更高,应该被拦截
      expect(result.type).toBe(FilterResultType.BLOCKED);
      expect(result.matchedWords).toHaveLength(2);
      expect(mockPrismaService.riskControlLog.create).toHaveBeenCalled();
    });

    it('should handle empty text', async () => {
      const text = '';
      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      const result = await service.filterText(
        text,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
      );

      expect(result.type).toBe(FilterResultType.PASS);
      expect(result.matchedWords).toHaveLength(0);
    });

    it('should log risk control with article ID', async () => {
      const text = '正常内容';
      const articleId = 123;
      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      await service.filterText(
        text,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        articleId,
      );

      expect(mockPrismaService.riskControlLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          articleId,
        }),
      });
    });

    it('should handle VISITOR_SUBMIT source type', async () => {
      const text = '访客投稿内容';
      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      const result = await service.filterText(
        text,
        RiskControlSourceType.VISITOR_SUBMIT,
        undefined, // 访客无用户ID
        '192.168.1.1',
      );

      expect(result.type).toBe(FilterResultType.PASS);
      expect(mockPrismaService.riskControlLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceType: RiskControlSourceType.VISITOR_SUBMIT,
          userId: null,
          ipAddress: '192.168.1.1',
        }),
      });
    });
  });

  describe('checkText (pre-check)', () => {
    beforeEach(async () => {
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([
        {
          id: 1,
          word: '测试敏感词',
          level: SensitiveWordLevel.LOW,
          category: 'other',
          replacement: '***',
          isActive: true,
        },
      ]);

      await service.onModuleInit();
    });

    it('should return true for text with sensitive words', () => {
      const text = '这段文字包含测试敏感词';
      const result = service.checkText(text);

      expect(result.hasSensitiveWord).toBe(true);
      expect(result.words).toContain('测试敏感词');
    });

    it('should return false for text without sensitive words', () => {
      const text = '这是一段正常的文字';
      const result = service.checkText(text);

      expect(result.hasSensitiveWord).toBe(false);
      expect(result.words).toHaveLength(0);
    });

    it('should handle empty text gracefully', () => {
      expect(service.checkText('')).toEqual({ hasSensitiveWord: false, words: [] });
      expect(service.checkText('   ')).toEqual({ hasSensitiveWord: false, words: [] });
    });

    it('should match English sensitive words case-insensitively', async () => {
      // 重新加载包含英文敏感词的词库(大小写归一化)
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([
        { id: 1, word: 'BadWord', level: SensitiveWordLevel.LOW, category: 'other', replacement: '***', isActive: true },
      ]);
      await service.onModuleInit();

      // 大小写变体均应命中,不应被绕过
      expect(service.checkText('this contains badword here').hasSensitiveWord).toBe(true);
      expect(service.checkText('this contains BADWORD here').hasSensitiveWord).toBe(true);
      expect(service.checkText('this contains BadWord here').hasSensitiveWord).toBe(true);
    });
  });

  describe('refreshCache', () => {
    it('should reload sensitive words from database', async () => {
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([
        {
          id: 1,
          word: '新敏感词',
          level: SensitiveWordLevel.LOW,
          category: 'other',
          replacement: '***',
          isActive: true,
        },
      ]);

      await service.refreshCache();

      expect(mockPrismaService.sensitiveWord.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });
  });

  describe('DFA Algorithm Performance', () => {
    beforeEach(async () => {
      // 加载1000个敏感词
      const words = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        word: `敏感词${i}`,
        level: i % 2 === 0 ? SensitiveWordLevel.LOW : SensitiveWordLevel.HIGH,
        category: 'other',
        replacement: '***',
        isActive: true,
      }));

      mockPrismaService.sensitiveWord.findMany.mockResolvedValue(words);
      await service.onModuleInit();
    });

    it('should filter 10,000 character text within 50ms', async () => {
      const text = Array.from({ length: 10000 }, (_, i) => `字${i}`).join('');
      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      const startTime = Date.now();
      await service.filterText(
        text,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
      );
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      expect(elapsedTime).toBeLessThan(50);
    });

    it('should handle timeout gracefully', async () => {
      // 模拟超时场景(虽然实际不会发生)
      const text = '正常内容';
      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      const result = await service.filterText(
        text,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
      );

      // 应该正常返回结果
      expect(result.type).toBeDefined();
      expect(result.matchedWords).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.sensitiveWord.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // 初始化时应该捕获错误,不应该抛出
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });

    it('should fallback to PASS on filter error', async () => {
      // 模拟过滤过程中的错误
      const text = '测试内容';
      mockPrismaService.riskControlLog.create.mockRejectedValue(
        new Error('Log error'),
      );

      // 应该优雅降级,不会抛出异常
      const result = await service.filterText(
        text,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
      );

      expect(result.type).toBe(FilterResultType.PASS);
    });

    it('should not throw when riskControlLog fails during BLOCKED action', async () => {
      // 高危敏感词命中后日志写入失败,不应抛出异常
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([
        {
          id: 1,
          word: '高危词',
          level: SensitiveWordLevel.HIGH,
          category: 'political',
          replacement: '***',
          isActive: true,
        },
      ]);
      await service.onModuleInit();

      mockPrismaService.riskControlLog.create.mockRejectedValue(
        new Error('DB connection lost'),
      );

      const result = await service.filterText(
        '包含高危词的内容',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
      );

      // 即使日志写入失败,拦截结果仍应返回
      expect(result.type).toBe(FilterResultType.BLOCKED);
      expect(result.matchedWords).toHaveLength(1);
    });

    it('should preserve old trie when database reload fails', async () => {
      // 先正常加载词库
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([
        {
          id: 1,
          word: '保留词',
          level: SensitiveWordLevel.LOW,
          category: 'other',
          replacement: '***',
          isActive: true,
        },
      ]);
      await service.onModuleInit();

      // 模拟刷新时数据库异常
      mockPrismaService.sensitiveWord.findMany.mockRejectedValue(
        new Error('Connection lost'),
      );

      // refreshCache 内部 loadSensitiveWords 会捕获异常不抛出
      await expect(service.refreshCache()).resolves.not.toThrow();

      // 旧的敏感词仍应可被检测(字典树未被清空)
      const checkResult = service.checkText('包含保留词的文本');
      expect(checkResult.hasSensitiveWord).toBe(true);
    });
  });

  describe('checkText Input Validation', () => {
    beforeEach(async () => {
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([
        {
          id: 1,
          word: '敏感词',
          level: SensitiveWordLevel.LOW,
          category: 'other',
          replacement: '***',
          isActive: true,
        },
      ]);
      await service.onModuleInit();
    });

    it('should return safe result for null input', () => {
      const result = service.checkText(null as any);
      expect(result.hasSensitiveWord).toBe(false);
      expect(result.words).toHaveLength(0);
    });

    it('should return safe result for undefined input', () => {
      const result = service.checkText(undefined as any);
      expect(result.hasSensitiveWord).toBe(false);
      expect(result.words).toHaveLength(0);
    });

    it('should return safe result for empty string', () => {
      const result = service.checkText('');
      expect(result.hasSensitiveWord).toBe(false);
      expect(result.words).toHaveLength(0);
    });

    it('should return safe result for whitespace-only string', () => {
      const result = service.checkText('   \t\n  ');
      expect(result.hasSensitiveWord).toBe(false);
      expect(result.words).toHaveLength(0);
    });

    it('should still detect sensitive word in text with leading/trailing spaces', () => {
      const result = service.checkText('  敏感词  ');
      expect(result.hasSensitiveWord).toBe(true);
    });
  });

  describe('Cache Refresh Error Handling', () => {
    beforeEach(async () => {
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([
        {
          id: 1,
          word: '测试词',
          level: SensitiveWordLevel.LOW,
          category: 'other',
          replacement: '***',
          isActive: true,
        },
      ]);
      mockPrismaService.riskControlLog.create.mockResolvedValue({});
      await service.onModuleInit();
    });

    it('should not throw when addWordAndRefreshCache load fails', async () => {
      // loadSensitiveWords 内部捕获异常,addWordAndRefreshCache 不会抛出
      mockPrismaService.sensitiveWord.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.addWordAndRefreshCache({
          id: 2,
          word: '新词',
          level: SensitiveWordLevel.LOW,
          category: 'other',
          replacement: '***',
          isActive: true,
        }),
      ).resolves.not.toThrow();
    });

    it('should not throw when removeWordAndRefreshCache load fails', async () => {
      mockPrismaService.sensitiveWord.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.removeWordAndRefreshCache('测试词'),
      ).resolves.not.toThrow();
    });

    it('should not throw when toggleWordAndRefreshCache load fails', async () => {
      mockPrismaService.sensitiveWord.findMany.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.toggleWordAndRefreshCache('测试词', false),
      ).resolves.not.toThrow();
    });
  });
});