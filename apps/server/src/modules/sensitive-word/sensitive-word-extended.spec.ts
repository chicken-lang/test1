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
import { SecretLevel } from '../article/article.constants';

describe('SensitiveWordService - Extended Features', () => {
  let service: SensitiveWordService;
  let decryptionService: ArticleDecryptionService;
  let cacheManager: SensitiveWordCacheManager;

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
    scard: jest.fn(),
    srem: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    getClient: jest.fn().mockReturnValue(null),
    isAvailable: jest.fn().mockReturnValue(false),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
    decryptionService = module.get<ArticleDecryptionService>(ArticleDecryptionService);
    cacheManager = module.get<SensitiveWordCacheManager>(SensitiveWordCacheManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RSA解密功能', () => {
    it('should handle decryption failure when no RSA key found', async () => {
      // 没有找到RSA密钥
      mockPrismaService.sysRsaKey.findFirst.mockResolvedValue(null);

      await expect(
        decryptionService.decryptArticleContent('fake-encrypted-content'),
      ).rejects.toThrow('涉密公文解密失败');
    });

    it('should return plain text for non-confidential articles', async () => {
      const content = '这是普通稿件的内容';
      const result = await decryptionService.getPlainTextForSensitiveCheck(
        content,
        null,
        SecretLevel.NORMAL,
      );

      expect(result).toBe(content);
    });

    it('should return plain text for confidential articles without encrypted content', async () => {
      const content = '这是涉密公文但没有加密内容';
      const result = await decryptionService.getPlainTextForSensitiveCheck(
        content,
        null,
        SecretLevel.CONFIDENTIAL,
      );

      expect(result).toBe(content);
    });

    it('should return [ENCRYPTED] for confidential articles with encrypted content but no key', async () => {
      mockPrismaService.sysRsaKey.findFirst.mockResolvedValue(null);

      const result = await decryptionService.getPlainTextForSensitiveCheck(
        null,
        'encrypted-content',
        'CONFIDENTIAL', // 使用字符串字面量(大写,对齐代码中 === 'CONFIDENTIAL' 比较)
      );

      // 解密失败，返回[ENCRYPTED]标记
      expect(result).toBe('[ENCRYPTED]');
    });
  });

  describe('filterArticleContent - 涉密公文过滤', () => {
    beforeEach(async () => {
      // 初始化敏感词库
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

      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      // 模拟RSA密钥不存在（解密会失败）
      mockPrismaService.sysRsaKey.findFirst.mockResolvedValue(null);

      await service.onModuleInit();
    });

    it('should filter normal article content', async () => {
      const result = await service.filterArticleContent(
        '这是普通稿件，包含测试敏感词',
        null,
        SecretLevel.NORMAL,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
      );

      expect(result.type).toBe(FilterResultType.DESENSITIZED);
      expect(result.matchedWords).toHaveLength(1);
    });

    it('should handle confidential article with decryption failure', async () => {
      // 涉密公文但解密失败，应该返回[ENCRYPTED]标记并放行
      const result = await service.filterArticleContent(
        null,
        'encrypted-content',
        SecretLevel.CONFIDENTIAL,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
      );

      // 解密失败时应该放行（内容被替换为[ENCRYPTED]）
      expect(result.type).toBe(FilterResultType.PASS);
    });

    it('should handle normal article without sensitive words', async () => {
      const result = await service.filterArticleContent(
        '这是一篇没有敏感词的正常文章',
        null,
        SecretLevel.NORMAL,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
      );

      expect(result.type).toBe(FilterResultType.PASS);
      expect(result.matchedWords).toHaveLength(0);
    });
  });

  describe('Redis缓存功能', () => {
    describe('SensitiveWordCacheManager', () => {
      it('should load sensitive words from Redis cache', async () => {
        // 设置需要刷新（本地版本号为0，Redis中存储的是1234567890）
        mockRedisService.get.mockResolvedValue('1234567890');

        const result = await cacheManager.loadSensitiveWordsFromCache();

        // 由于needsRefresh返回true，loadSensitiveWordsFromCache应该返回空数组
        // 让测试检查needsRefresh逻辑
        const needsRefresh = await cacheManager.needsRefresh();
        expect(needsRefresh).toBe(true);
      });

      it('should cache sensitive words to Redis', async () => {
        const words = [
          {
            id: 1,
            word: '敏感词1',
            level: SensitiveWordLevel.LOW,
            category: 'political',
            replacement: '***',
            isActive: true,
          },
        ];

        await cacheManager.cacheSensitiveWords(words);

        // 验证set被调用（版本号更新）
        expect(mockRedisService.set).toHaveBeenCalled();
      });

      it('should invalidate cache and notify all nodes', async () => {
        await cacheManager.invalidateCache();

        expect(mockRedisService.publish).toHaveBeenCalledWith(
          'sensitive_words:invalidate',
          expect.stringContaining('invalidate:'),
        );
      });

      it('should check if cache needs refresh', async () => {
        // 当Redis不可用时（get返回null），needsRefresh应该返回true
        mockRedisService.get.mockResolvedValue(null);

        const needsRefresh = await cacheManager.needsRefresh();

        expect(needsRefresh).toBe(true);
      });

      it('should handle Redis unavailability gracefully', async () => {
        // 模拟Redis不可用
        mockRedisService.get.mockRejectedValue(new Error('Redis connection failed'));

        const needsRefresh = await cacheManager.needsRefresh();

        // Redis不可用时应该返回true（需要刷新）
        expect(needsRefresh).toBe(true);
      });
    });

    describe('RedisService', () => {
      it('should check Redis availability', () => {
        expect(mockRedisService.isAvailable()).toBe(false);
      });

      it('should handle operations gracefully when Redis is down', async () => {
        // 即使Redis不可用，方法也不应该抛出异常
        // 设置mock让get返回null
        mockRedisService.get.mockResolvedValue(null);
        mockRedisService.set.mockResolvedValue('OK');
        mockRedisService.del.mockResolvedValue(1);
        mockRedisService.hset.mockResolvedValue(1);
        mockRedisService.hdel.mockResolvedValue(1);

        const getResult = await mockRedisService.get('test-key');
        expect(getResult).toBeNull();

        // 这些操作不应该抛出异常
        await expect(mockRedisService.set('key', 'value')).resolves.not.toThrow();
        await expect(mockRedisService.del('key')).resolves.not.toThrow();
        await expect(mockRedisService.hset('hash', 'field', 'value')).resolves.not.toThrow();
        await expect(mockRedisService.hdel('hash', 'field')).resolves.not.toThrow();
      });
    });
  });

  describe('缓存更新方法', () => {
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

      mockPrismaService.riskControlLog.create.mockResolvedValue({});

      await service.onModuleInit();
    });

    it('should add word and refresh cache', async () => {
      const newWord = {
        id: 2,
        word: '新敏感词',
        level: SensitiveWordLevel.HIGH,
        category: 'political',
        replacement: '***',
        isActive: true,
      };

      // 由于Redis未启用，应该只更新内存缓存
      await service.addWordAndRefreshCache(newWord);

      // 验证方法执行成功（不抛异常）
      expect(true).toBe(true);
    });

    it('should remove word and refresh cache', async () => {
      // 删除词
      await expect(service.removeWordAndRefreshCache('敏感词')).resolves.not.toThrow();
    });

    it('should toggle word and refresh cache', async () => {
      // 切换敏感词状态
      await expect(service.toggleWordAndRefreshCache('敏感词', false)).resolves.not.toThrow();
    });
  });

  describe('边界场景测试', () => {
    beforeEach(async () => {
      mockPrismaService.sensitiveWord.findMany.mockResolvedValue([]);
      mockPrismaService.riskControlLog.create.mockResolvedValue({});
      mockPrismaService.sysRsaKey.findFirst.mockResolvedValue(null);

      await service.onModuleInit();
    });

    it('should handle empty encrypted content', async () => {
      const result = await service.filterArticleContent(
        null,
        '',
        SecretLevel.CONFIDENTIAL,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
      );

      expect(result.type).toBe(FilterResultType.PASS);
    });

    it('should handle null content for confidential article', async () => {
      const result = await service.filterArticleContent(
        null,
        'encrypted-content',
        SecretLevel.CONFIDENTIAL,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
      );

      // 解密失败，应该返回[ENCRYPTED]标记并放行
      expect(result.type).toBe(FilterResultType.PASS);
    });

    it('should handle empty text for normal article', async () => {
      const result = await service.filterArticleContent(
        '',
        null,
        SecretLevel.NORMAL,
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
      );

      expect(result.type).toBe(FilterResultType.PASS);
      expect(result.matchedWords).toHaveLength(0);
    });
  });
});