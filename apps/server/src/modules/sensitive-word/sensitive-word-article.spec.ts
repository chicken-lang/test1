import { Test, TestingModule } from '@nestjs/testing';
import { SensitiveWordService } from './sensitive-word.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SensitiveWordCacheManager } from '../cache/sensitive-word-cache.manager.js';
import { ArticleDecryptionService } from './article-decryption.service.js';
import {
  SensitiveWordLevel,
  RiskControlSourceType,
  RiskControlAction,
  FilterResultType,
  FILTER_TIMEOUT_MS,
} from './sensitive-word.constants.js';

// ==================== 测试辅助 ====================

const baseSensitiveWord = {
  id: 1,
  word: '敏感词',
  level: SensitiveWordLevel.LOW,
  category: 'advertising',
  replacement: '[已脱敏]',
  isActive: true,
};

function createMockSensitiveWord(overrides: Partial<typeof baseSensitiveWord> = {}) {
  return { ...baseSensitiveWord, ...overrides };
}

// ==================== Mock 依赖 ====================

function createMockPrismaService() {
  let riskControlLogStore: Record<number, any> = {};
  let _logIdCounter = 0;

  return {
    sensitiveWord: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    riskControlLog: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = ++_logIdCounter;
        const record = { id, ...data };
        riskControlLogStore[id] = record;
        return Promise.resolve(record);
      }),
    },
    _getRiskControlLogStore: () => riskControlLogStore,
    _resetLogStore: () => {
      riskControlLogStore = {};
      _logIdCounter = 0;
    },
  };
}

function createMockCacheManager() {
  return {
    needsRefresh: jest.fn().mockResolvedValue(true),
    loadSensitiveWordsFromCache: jest.fn().mockResolvedValue([]),
    cacheSensitiveWords: jest.fn().mockResolvedValue(undefined),
    invalidateCache: jest.fn().mockResolvedValue(undefined),
    addWordToCache: jest.fn().mockResolvedValue(undefined),
    removeWordFromCache: jest.fn().mockResolvedValue(undefined),
    toggleWordActiveInCache: jest.fn().mockResolvedValue(undefined),
  };
}

function createMockDecryptionService() {
  return {
    decryptArticleContent: jest.fn(),
    getPlainTextForSensitiveCheck: jest.fn(),
  };
}

// ==================== 测试主体 ====================

describe('SensitiveWordService - 文章内容校验', () => {
  let service: SensitiveWordService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let cacheManager: ReturnType<typeof createMockCacheManager>;
  let decryptionService: ReturnType<typeof createMockDecryptionService>;

  // 预定义的敏感词库
  const highRiskWord = createMockSensitiveWord({
    id: 1,
    word: '高危敏感词',
    level: SensitiveWordLevel.HIGH,
    category: 'political',
    replacement: '***',
  });

  const lowRiskWord = createMockSensitiveWord({
    id: 2,
    word: '低级敏感词',
    level: SensitiveWordLevel.LOW,
    category: 'advertising',
    replacement: '[广告]',
  });

  async function initServiceWithWords(words: any[] = [highRiskWord, lowRiskWord]) {
    prisma.sensitiveWord.findMany.mockResolvedValue(words);
    await service.onModuleInit();
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createMockPrismaService();
    cacheManager = createMockCacheManager();
    decryptionService = createMockDecryptionService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensitiveWordService,
        { provide: PrismaService, useValue: prisma },
        { provide: SensitiveWordCacheManager, useValue: cacheManager },
        { provide: ArticleDecryptionService, useValue: decryptionService },
      ],
    }).compile();

    service = module.get<SensitiveWordService>(SensitiveWordService);
  });

  afterEach(() => {
    // 清理 onModuleInit 中启动的 setInterval 定时器
    service.onModuleDestroy();
    jest.clearAllMocks();
  });

  // ==================== filterArticleContent() - 稿件内容过滤 ====================

  describe('filterArticleContent() - 稿件内容过滤', () => {
    beforeEach(async () => {
      await initServiceWithWords();
    });

    it('普通稿件内容包含高危敏感词时应拦截(BLOCKED)', async () => {
      const result = await service.filterArticleContent(
        '这篇文章包含高危敏感词的内容',
        null,
        'PUBLIC',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        100,
      );

      expect(result.type).toBe(FilterResultType.BLOCKED);
      expect(result.matchedWords).toHaveLength(1);
      expect(result.matchedWords[0].word).toBe('高危敏感词');
      expect(result.matchedWords[0].level).toBe(SensitiveWordLevel.HIGH);
    });

    it('普通稿件内容包含低级敏感词时应脱敏(DESENSITIZED)', async () => {
      const result = await service.filterArticleContent(
        '这篇文章包含低级敏感词的内容',
        null,
        'PUBLIC',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        101,
      );

      expect(result.type).toBe(FilterResultType.DESENSITIZED);
      expect(result.matchedWords).toHaveLength(1);
      expect(result.matchedWords[0].word).toBe('低级敏感词');
      expect(result.matchedWords[0].level).toBe(SensitiveWordLevel.LOW);
      expect(result.desensitizedText).toBe('这篇文章包含[广告]的内容');
    });

    it('普通稿件无敏感词时应放行(PASS)', async () => {
      const result = await service.filterArticleContent(
        '这是一篇完全正常的文章内容',
        null,
        'PUBLIC',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        102,
      );

      expect(result.type).toBe(FilterResultType.PASS);
      expect(result.matchedWords).toHaveLength(0);
    });

    it('content 为 null 时直接放行', async () => {
      const result = await service.filterArticleContent(
        null,
        null,
        'PUBLIC',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        103,
      );

      expect(result.type).toBe(FilterResultType.PASS);
      expect(result.matchedWords).toHaveLength(0);
    });

    it('返回结果包含 matchedWords 列表', async () => {
      const result = await service.filterArticleContent(
        '包含高危敏感词和低级敏感词',
        null,
        'PUBLIC',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        104,
      );

      expect(result.matchedWords).toBeDefined();
      expect(Array.isArray(result.matchedWords)).toBe(true);
      expect(result.matchedWords.length).toBe(2);
      expect(result.matchedWords[0]).toHaveProperty('word');
      expect(result.matchedWords[0]).toHaveProperty('level');
      expect(result.matchedWords[0]).toHaveProperty('category');
      expect(result.matchedWords[0]).toHaveProperty('replacement');
      expect(result.matchedWords[0]).toHaveProperty('startIndex');
      expect(result.matchedWords[0]).toHaveProperty('endIndex');
    });

    it('返回结果包含 action 字段(PASS/DESENSITIZED/BLOCKED)', async () => {
      // PASS 场景
      const passResult = await service.filterArticleContent(
        '正常内容',
        null,
        'PUBLIC',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        105,
      );
      expect(passResult.type).toBe(FilterResultType.PASS);

      // DESENSITIZED 场景
      const desensitizedResult = await service.filterArticleContent(
        '包含低级敏感词',
        null,
        'PUBLIC',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        106,
      );
      expect(desensitizedResult.type).toBe(FilterResultType.DESENSITIZED);

      // BLOCKED 场景
      const blockedResult = await service.filterArticleContent(
        '包含高危敏感词',
        null,
        'PUBLIC',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        107,
      );
      expect(blockedResult.type).toBe(FilterResultType.BLOCKED);
    });
  });

  // ==================== filterArticleContent() - 涉密公文处理 ====================

  describe('filterArticleContent() - 涉密公文处理', () => {
    beforeEach(async () => {
      await initServiceWithWords();
    });

    it('涉密公文(CONFIDENTIAL)应先解密再过滤', async () => {
      const decryptedText = '解密后的内容包含高危敏感词';
      decryptionService.getPlainTextForSensitiveCheck.mockResolvedValue(decryptedText);

      const result = await service.filterArticleContent(
        null,
        'encrypted-base64-content',
        'CONFIDENTIAL',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        200,
      );

      expect(decryptionService.getPlainTextForSensitiveCheck).toHaveBeenCalledWith(
        null,
        'encrypted-base64-content',
        'CONFIDENTIAL',
      );
      expect(result.type).toBe(FilterResultType.BLOCKED);
      expect(result.matchedWords).toHaveLength(1);
      expect(result.matchedWords[0].word).toBe('高危敏感词');
    });

    it('解密失败时返回 [ENCRYPTED] 放行', async () => {
      // 解密服务抛出异常时, filterArticleContent 内部会将 textToFilter 设为 '[ENCRYPTED]'
      // 然后检测到 '[ENCRYPTED]' 后直接放行
      decryptionService.getPlainTextForSensitiveCheck.mockRejectedValue(
        new Error('解密失败'),
      );

      const result = await service.filterArticleContent(
        null,
        'encrypted-base64-content',
        'CONFIDENTIAL',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        201,
      );

      expect(result.type).toBe(FilterResultType.PASS);
      expect(result.matchedWords).toHaveLength(0);
    });

    it('加密内容为空时按普通稿件处理', async () => {
      // encryptedContent 为空字符串时, 条件 secretLevel === 'CONFIDENTIAL' && encryptedContent 为 false
      // 因此走普通稿件逻辑, 使用 content 字段
      const result = await service.filterArticleContent(
        '普通稿件内容包含低级敏感词',
        '',
        'CONFIDENTIAL',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        202,
      );

      // 走普通稿件逻辑, 应检测到低级敏感词并脱敏
      expect(result.type).toBe(FilterResultType.DESENSITIZED);
      expect(result.matchedWords).toHaveLength(1);
      expect(result.matchedWords[0].word).toBe('低级敏感词');
      expect(decryptionService.getPlainTextForSensitiveCheck).not.toHaveBeenCalled();
    });
  });

  // ==================== filterText() - 风控日志记录 ====================

  describe('filterText() - 风控日志记录', () => {
    beforeEach(async () => {
      await initServiceWithWords();
    });

    it('ADMIN_SUBMIT 来源应记录风控日志', async () => {
      await service.filterText(
        '正常内容',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        300,
      );

      expect(prisma.riskControlLog.create).toHaveBeenCalledTimes(1);
      expect(prisma.riskControlLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceType: RiskControlSourceType.ADMIN_SUBMIT,
          userId: 1,
          ipAddress: '127.0.0.1',
          articleId: 300,
        }),
      });
    });

    it('BLOCKED 操作应写入 RiskControlLog', async () => {
      await service.filterText(
        '包含高危敏感词的内容',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        301,
      );

      expect(prisma.riskControlLog.create).toHaveBeenCalledTimes(1);
      const createCall = (prisma.riskControlLog.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.action).toBe(RiskControlAction.BLOCKED);
      expect(createCall.data.matchedWords).toContain('高危敏感词');
      expect(createCall.data.articleId).toBe(301);
    });

    it('DESENSITIZED 操作应记录被替换的词', async () => {
      await service.filterText(
        '包含低级敏感词的内容',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        302,
      );

      expect(prisma.riskControlLog.create).toHaveBeenCalledTimes(1);
      const createCall = (prisma.riskControlLog.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.action).toBe(RiskControlAction.DESENSITIZED);
      // contentSnapshot 应为脱敏后的文本
      expect(createCall.data.contentSnapshot).toBe('包含[广告]的内容');
      // matchedWords 应包含被替换的词信息
      const matchedWords = JSON.parse(createCall.data.matchedWords);
      expect(matchedWords).toHaveLength(1);
      expect(matchedWords[0].word).toBe('低级敏感词');
    });

    it('PASS 操作不记录日志(或记录为 PASS)', async () => {
      await service.filterText(
        '完全正常的内容',
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        303,
      );

      // 源码中 PASS 也会记录日志, action 为 PASS
      expect(prisma.riskControlLog.create).toHaveBeenCalledTimes(1);
      const createCall = (prisma.riskControlLog.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.action).toBe(RiskControlAction.PASS);
      expect(createCall.data.matchedWords).toBe('[]');
    });
  });

  // ==================== checkText() - 前端预检 ====================

  describe('checkText() - 前端预检', () => {
    beforeEach(async () => {
      await initServiceWithWords();
    });

    it('同步检测返回 hasSensitiveWord 和 words', () => {
      const result = service.checkText('包含高危敏感词的文本');

      expect(result).toHaveProperty('hasSensitiveWord');
      expect(result).toHaveProperty('words');
      expect(typeof result.hasSensitiveWord).toBe('boolean');
      expect(Array.isArray(result.words)).toBe(true);
    });

    it('不包含敏感词时 hasSensitiveWord 为 false', () => {
      const result = service.checkText('这是完全正常的文本内容');

      expect(result.hasSensitiveWord).toBe(false);
      expect(result.words).toHaveLength(0);
    });

    it('包含敏感词时 words 列表非空', () => {
      const result = service.checkText('包含高危敏感词和低级敏感词');

      expect(result.hasSensitiveWord).toBe(true);
      expect(result.words.length).toBeGreaterThan(0);
      expect(result.words).toContain('高危敏感词');
      expect(result.words).toContain('低级敏感词');
    });
  });

  // ==================== filterText() - 超时降级 ====================

  describe('filterText() - 超时降级', () => {
    beforeEach(async () => {
      await initServiceWithWords();
    });

    it('DFA 匹配超时应降级放行(50ms)', async () => {
      // 使用 jest.spyOn 拦截 DFA 匹配, 模拟超时场景
      const originalMatchAll = (service as any).matchAll.bind(service);
      const matchAllSpy = jest.spyOn(service as any, 'matchAll')
        .mockImplementation((text: string) => {
          // 同步阻塞超过 FILTER_TIMEOUT_MS (50ms)
          const start = Date.now();
          while (Date.now() - start < FILTER_TIMEOUT_MS + 20) {
            // 忙等待模拟超时
          }
          return [];
        });

      const result = await service.filterText(
        '一段较长的测试文本'.repeat(100),
        RiskControlSourceType.ADMIN_SUBMIT,
        1,
        '127.0.0.1',
        400,
      );

      // 超时降级为放行
      expect(result.type).toBe(FilterResultType.PASS);
      expect(result.matchedWords).toHaveLength(0);

      matchAllSpy.mockRestore();
    });
  });

  // ==================== isReady() ====================

  describe('isReady()', () => {
    it('未初始化时返回 false', () => {
      // beforeEach 中创建的 service 尚未调用 onModuleInit
      expect(service.isReady()).toBe(false);
    });

    it('初始化后返回 true', async () => {
      prisma.sensitiveWord.findMany.mockResolvedValue([]);
      await service.onModuleInit();

      expect(service.isReady()).toBe(true);
    });
  });
});
