import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { HomepageCarouselService } from './homepage-carousel.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { RedisService } from '../cache/redis.service.js';
import {
  PositionCode,
  CarouselStatus,
  CAROUSEL_MAX_COUNT,
  CAROUSEL_CACHE_KEY_PREFIX,
  CarouselErrorCode,
} from './homepage-carousel.constants.js';

// ==================== Mock 实现 ====================

function createMockPrismaService() {
  let carouselStore: Record<number, any> = {};
  let articleStore: Record<number, any> = {};
  let fileResourceStore: Record<number, any> = {};
  let _idCounter = 1000;

  const homepageCarousel = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_idCounter;
      const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      carouselStore[id] = record;
      return Promise.resolve(record);
    }),

    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where?.id !== undefined) {
        return Promise.resolve(carouselStore[where.id] ?? null);
      }
      return Promise.resolve(null);
    }),

    findMany: jest.fn().mockImplementation(({ where, include, orderBy }: any) => {
      let results = Object.values(carouselStore);

      if (where?.positionCode) {
        results = results.filter((r) => r.positionCode === where.positionCode);
      }
      if (where?.status) {
        results = results.filter((r) => r.status === where.status);
      }

      if (orderBy) {
        const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
        for (const clause of [...clauses].reverse()) {
          const key = Object.keys(clause)[0];
          const dir = clause[key];
          results.sort((a, b) => {
            if (a[key] === b[key]) return 0;
            return dir === 'asc' ? (a[key] > b[key] ? 1 : -1) : a[key] > b[key] ? -1 : 1;
          });
        }
      }

      // 添加关联数据
      if (include) {
        results = results.map((item) => ({
          ...item,
          article: item.articleId ? articleStore[item.articleId] || null : null,
          coverImage: item.coverImageId ? fileResourceStore[item.coverImageId] || null : null,
        }));
      }

      return Promise.resolve(results);
    }),

    deleteMany: jest.fn().mockImplementation(({ where }: any) => {
      let count = 0;
      for (const key of Object.keys(carouselStore)) {
        const item = carouselStore[key];
        if (where.positionCode && item.positionCode === where.positionCode) {
          delete carouselStore[key];
          count++;
        }
      }
      return Promise.resolve({ count });
    }),
  };

  const article = {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(articleStore[where.id] ?? null);
    }),
  };

  const fileResource = {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(fileResourceStore[where.id] ?? null);
    }),
  };

  const $transaction = jest.fn().mockImplementation((callback: any) => {
    return callback({ homepageCarousel, article, fileResource });
  });

  return {
    homepageCarousel,
    article,
    fileResource,
    $transaction,
    _setArticle: (id: number, data: any) => {
      articleStore[id] = data;
    },
    _setFileResource: (id: number, data: any) => {
      fileResourceStore[id] = data;
    },
    _resetStore: () => {
      carouselStore = {};
      articleStore = {};
      fileResourceStore = {};
      _idCounter = 1000;
    },
    _getCarouselStore: () => carouselStore,
  };
}

function createMockAuditLogService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  };
}

function createMockRedisService() {
  const cache: Record<string, string> = {};

  return {
    get: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(cache[key] ?? null);
    }),
    set: jest.fn().mockImplementation((key: string, value: string) => {
      cache[key] = value;
      return Promise.resolve();
    }),
    del: jest.fn().mockImplementation((key: string) => {
      delete cache[key];
      return Promise.resolve();
    }),
    _getCache: () => cache,
    _clearCache: () => {
      Object.keys(cache).forEach((k) => delete cache[k]);
    },
  };
}

// ==================== 测试用例 ====================

describe('HomepageCarouselService', () => {
  let service: HomepageCarouselService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let auditLog: ReturnType<typeof createMockAuditLogService>;
  let redis: ReturnType<typeof createMockRedisService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    auditLog = createMockAuditLogService();
    redis = createMockRedisService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomepageCarouselService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<HomepageCarouselService>(HomepageCarouselService);
  });

  afterEach(() => {
    prisma._resetStore();
    redis._clearCache();
    jest.clearAllMocks();
  });

  // ==================== 保存轮播图配置 ====================

  describe('saveCarousel', () => {
    it('should save carousel config successfully when valid data provided', async () => {
      // 准备测试数据
      prisma._setArticle(20001, {
        id: 20001,
        articleSlug: 'test-article-1',
        title: '测试文章1',
        summary: '测试摘要1',
        coverImageUrl: 'http://example.com/cover1.jpg',
        publishedAt: new Date(),
        viewCount: 100,
        status: 'published',
      });
      prisma._setArticle(20002, {
        id: 20002,
        articleSlug: 'test-article-2',
        title: '测试文章2',
        summary: '测试摘要2',
        coverImageUrl: 'http://example.com/cover2.jpg',
        publishedAt: new Date(),
        viewCount: 200,
        status: 'published',
      });
      // 添加文件资源数据
      prisma._setFileResource(5001, {
        id: 5001,
        fileName: 'cover1.jpg',
        storagePath: 'uploads/cover1.jpg',
        status: 'ACTIVE',
      });
      prisma._setFileResource(5002, {
        id: 5002,
        fileName: 'cover2.jpg',
        storagePath: 'uploads/cover2.jpg',
        status: 'ACTIVE',
      });

      const result = await service.saveCarousel(
        {
          positionCode: PositionCode.CAROUSEL_A,
          items: [
            { articleId: 20001, sortOrder: 1, coverImageId: 5001 },
            { articleId: 20002, sortOrder: 2, coverImageId: 5002 },
          ],
        },
        1,
        'column_admin',
      );

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(auditLog.create).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when role is not column_admin', async () => {
      await expect(
        service.saveCarousel(
          {
            positionCode: PositionCode.CAROUSEL_A,
            items: [{ articleId: 20001, sortOrder: 1 }],
          },
          1,
          'editor', // 非栏目管理员
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when item count exceeds max limit', async () => {
      // 创建6篇已发布文章（超过5张限制）
      for (let i = 1; i <= 6; i++) {
        prisma._setArticle(20000 + i, {
          id: 20000 + i,
          title: `测试文章${i}`,
          status: 'published',
        });
      }

      await expect(
        service.saveCarousel(
          {
            positionCode: PositionCode.CAROUSEL_A,
            items: [
              { articleId: 20001, sortOrder: 1 },
              { articleId: 20002, sortOrder: 2 },
              { articleId: 20003, sortOrder: 3 },
              { articleId: 20004, sortOrder: 4 },
              { articleId: 20005, sortOrder: 5 },
              { articleId: 20006, sortOrder: 6 }, // 第6张，超出限制
            ],
          },
          1,
          'column_admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when positionCode is invalid', async () => {
      await expect(
        service.saveCarousel(
          {
            positionCode: 'INVALID_CODE',
            items: [{ articleId: 20001, sortOrder: 1 }],
          },
          1,
          'column_admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when article does not exist', async () => {
      await expect(
        service.saveCarousel(
          {
            positionCode: PositionCode.CAROUSEL_A,
            items: [{ articleId: 99999, sortOrder: 1 }], // 不存在的文章
          },
          1,
          'column_admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when article is not published', async () => {
      prisma._setArticle(20001, {
        id: 20001,
        title: '未发布文章',
        status: 'draft', // 未发布
      });

      await expect(
        service.saveCarousel(
          {
            positionCode: PositionCode.CAROUSEL_A,
            items: [{ articleId: 20001, sortOrder: 1 }],
          },
          1,
          'column_admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when cover image does not exist', async () => {
      prisma._setArticle(20001, {
        id: 20001,
        title: '测试文章',
        status: 'published',
      });

      await expect(
        service.saveCarousel(
          {
            positionCode: PositionCode.CAROUSEL_A,
            items: [{ articleId: 20001, sortOrder: 1, coverImageId: 99999 }], // 不存在的封面图
          },
          1,
          'column_admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when there are duplicate articles', async () => {
      prisma._setArticle(20001, {
        id: 20001,
        title: '测试文章',
        status: 'published',
      });

      await expect(
        service.saveCarousel(
          {
            positionCode: PositionCode.CAROUSEL_A,
            items: [
              { articleId: 20001, sortOrder: 1 },
              { articleId: 20001, sortOrder: 2 }, // 重复文章
            ],
          },
          1,
          'column_admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== 获取轮播图配置 ====================

  describe('getCarousel', () => {
    it('should return carousel config from database when cache is empty', async () => {
      prisma._setArticle(20001, {
        id: 20001,
        articleSlug: 'test-article',
        title: '测试文章',
        summary: '测试摘要',
        coverImageUrl: 'http://example.com/cover.jpg',
        publishedAt: new Date(),
        viewCount: 100,
      });

      // 预先插入轮播图配置
      prisma._getCarouselStore()[1001] = {
        id: 1001,
        positionCode: PositionCode.CAROUSEL_A,
        articleId: 20001,
        sortOrder: 1,
        coverImageId: null,
        status: CarouselStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.getCarousel(PositionCode.CAROUSEL_A);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].article?.title).toBe('测试文章');
      expect(redis.set).toHaveBeenCalled(); // 验证缓存已写入
    });

    it('should fall back to first image attachment when coverImageUrl is null', async () => {
      // 文章未设置 coverImageUrl,但有图片附件
      prisma._setArticle(20010, {
        id: 20010,
        articleSlug: 'no-cover-article',
        title: '无封面文章',
        summary: '摘要',
        coverImageUrl: null,
        attachments: [{ fileUrl: 'http://example.com/fallback-img.jpg' }],
        publishedAt: new Date(),
        viewCount: 50,
      });

      prisma._getCarouselStore()[1010] = {
        id: 1010,
        positionCode: PositionCode.CAROUSEL_A,
        articleId: 20010,
        sortOrder: 1,
        coverImageId: null,
        status: CarouselStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.getCarousel(PositionCode.CAROUSEL_A);

      expect(result[0].article?.coverImageUrl).toBe('http://example.com/fallback-img.jpg');
    });

    it('should return carousel config from cache when available', async () => {
      const cachedData = JSON.stringify([
        { id: 1001, positionCode: PositionCode.CAROUSEL_A, articleId: 20001, sortOrder: 1 },
      ]);
      redis._getCache()[`${CAROUSEL_CACHE_KEY_PREFIX}${PositionCode.CAROUSEL_A}`] = cachedData;

      const result = await service.getCarousel(PositionCode.CAROUSEL_A);

      expect(result).toEqual([
        { id: 1001, positionCode: PositionCode.CAROUSEL_A, articleId: 20001, sortOrder: 1 },
      ]);
    });

    it('should throw BadRequestException when positionCode is invalid', async () => {
      await expect(service.getCarousel('INVALID_CODE')).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== 获取所有轮播图配置 ====================

  describe('getAllCarousels', () => {
    it('should return all carousel configs', async () => {
      const result = await service.getAllCarousels();

      expect(result).toBeDefined();
      expect(result[PositionCode.CAROUSEL_A]).toBeDefined();
      expect(result[PositionCode.CAROUSEL_B]).toBeDefined();
    });
  });

  // ==================== 删除轮播图配置 ====================

  describe('deleteCarousel', () => {
    it('should delete carousel config successfully', async () => {
      prisma._getCarouselStore()[1001] = {
        id: 1001,
        positionCode: PositionCode.CAROUSEL_A,
        articleId: 20001,
        sortOrder: 1,
        status: CarouselStatus.ACTIVE,
      };

      const result = await service.deleteCarousel(PositionCode.CAROUSEL_A, 1, 'column_admin');

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
      expect(auditLog.create).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when role is not column_admin', async () => {
      await expect(
        service.deleteCarousel(PositionCode.CAROUSEL_A, 1, 'editor'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when positionCode is invalid', async () => {
      await expect(service.deleteCarousel('INVALID_CODE', 1, 'column_admin')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ==================== 边界测试 ====================

  describe('boundary tests', () => {
    it('should accept exactly max count (5 items)', async () => {
      // 创建5篇已发布文章
      for (let i = 1; i <= 5; i++) {
        prisma._setArticle(20000 + i, {
          id: 20000 + i,
          title: `测试文章${i}`,
          summary: `摘要${i}`,
          coverImageUrl: `http://example.com/cover${i}.jpg`,
          publishedAt: new Date(),
          viewCount: 100 + i,
          status: 'published',
        });
      }

      const result = await service.saveCarousel(
        {
          positionCode: PositionCode.CAROUSEL_A,
          items: [
            { articleId: 20001, sortOrder: 1 },
            { articleId: 20002, sortOrder: 2 },
            { articleId: 20003, sortOrder: 3 },
            { articleId: 20004, sortOrder: 4 },
            { articleId: 20005, sortOrder: 5 },
          ],
        },
        1,
        'column_admin',
      );

      expect(result.length).toBe(5);
    });

    it('should accept empty items array', async () => {
      const result = await service.saveCarousel(
        {
          positionCode: PositionCode.CAROUSEL_A,
          items: [],
        },
        1,
        'column_admin',
      );

      expect(result.length).toBe(0);
    });

    it('should handle cache invalidation after save', async () => {
      // 设置缓存
      redis._getCache()[`${CAROUSEL_CACHE_KEY_PREFIX}${PositionCode.CAROUSEL_A}`] = JSON.stringify([
        { id: 1001, positionCode: PositionCode.CAROUSEL_A, articleId: 20000, sortOrder: 1 },
      ]);

      prisma._setArticle(20001, {
        id: 20001,
        title: '新文章',
        status: 'published',
      });

      await service.saveCarousel(
        {
          positionCode: PositionCode.CAROUSEL_A,
          items: [{ articleId: 20001, sortOrder: 1 }],
        },
        1,
        'column_admin',
      );

      // 验证缓存已被删除
      expect(redis.del).toHaveBeenCalledWith(`${CAROUSEL_CACHE_KEY_PREFIX}${PositionCode.CAROUSEL_A}`);
    });
  });
});