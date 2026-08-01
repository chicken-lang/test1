import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HomepageRecommendationService } from './homepage-recommendation.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../cache/redis.service.js';
import {
  RoleTag,
  RecommendSection,
  ROLE_LABELS,
  RECOMMEND_DEFAULTS,
  ROLE_BUSINESS_WEIGHTS,
  QUICK_LINKS,
  RecommendErrorCode,
  ROLE_TAG_VALUES,
} from './homepage-recommendation.constants.js';

// ==================== Mock 数据 ====================

const mockArticles = [
  {
    id: 1, title: '2024-2025学年第一学期选课通知', summary: '选课系统开放时间',
    coverImageUrl: null, articleSlug: 'article-1', publishedAt: new Date('2024-09-01'),
    viewCount: 1200, isTop: true, responsibleBusiness: 'teaching-operation',
    source: '教务处', column: { columnName: '教学通知', columnSlug: 'notice-teaching' },
  },
  {
    id: 2, title: '期末考试安排通知', summary: '期末考试时间表发布',
    coverImageUrl: null, articleSlug: 'article-2', publishedAt: new Date('2024-12-01'),
    viewCount: 800, isTop: false, responsibleBusiness: 'exam-textbook',
    source: '教务处', column: { columnName: '教学通知', columnSlug: 'notice-teaching' },
  },
  {
    id: 3, title: '教学成果奖评选结果公示', summary: '2024年教学成果奖',
    coverImageUrl: null, articleSlug: 'article-3', publishedAt: new Date('2024-10-15'),
    viewCount: 500, isTop: true, responsibleBusiness: 'teaching-project',
    source: '教务处', column: { columnName: '公示公告', columnSlug: 'notice-public' },
  },
];

const mockGuideItems = [
  {
    id: 1, title: '学生证补办', slug: 'student-card-reissue', targetAudience: 'student',
    businessTag: 'general-affairs', timeLimit: '5个工作日', hallCode: 'HALL-001',
    hallLink: '/hall/reissue', contactDept: '学籍科', viewCount: 300, sortOrder: 0,
  },
  {
    id: 2, title: '成绩复议', slug: 'grade-review', targetAudience: 'student',
    businessTag: 'teaching-operation', timeLimit: '3个工作日', hallCode: 'HALL-002',
    hallLink: '/hall/grade-review', contactDept: '考务科', viewCount: 150, sortOrder: 1,
  },
  {
    id: 3, title: '开课申请', slug: 'course-apply', targetAudience: 'teacher',
    businessTag: 'teaching-project', timeLimit: '10个工作日', hallCode: 'HALL-003',
    hallLink: '/hall/course-apply', contactDept: '教务科', viewCount: 80, sortOrder: 0,
  },
  {
    id: 4, title: '教学评估', slug: 'teaching-eval', targetAudience: 'teacher',
    businessTag: 'teaching-quality', timeLimit: '即时办理', hallCode: 'HALL-004',
    hallLink: '/hall/teaching-eval', contactDept: '质量监控科', viewCount: 120, sortOrder: 1,
  },
];

// ==================== 测试用例 ====================

describe('HomepageRecommendationService', () => {
  let service: HomepageRecommendationService;
  let prismaService: any;
  let redisService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomepageRecommendationService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            guideItem: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
            del: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<HomepageRecommendationService>(HomepageRecommendationService);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);
  });

  // ==================== 角色标准化 ====================

  describe('normalizeRole', () => {
    it('应将 student 映射为 RoleTag.STUDENT', () => {
      expect(service.normalizeRole('student')).toBe(RoleTag.STUDENT);
    });

    it('应将 学生 映射为 RoleTag.STUDENT', () => {
      expect(service.normalizeRole('学生')).toBe(RoleTag.STUDENT);
    });

    it('应将 teacher 映射为 RoleTag.TEACHER', () => {
      expect(service.normalizeRole('teacher')).toBe(RoleTag.TEACHER);
    });

    it('应将 教师 映射为 RoleTag.TEACHER', () => {
      expect(service.normalizeRole('教师')).toBe(RoleTag.TEACHER);
    });

    it('应将 visitor 映射为 RoleTag.VISITOR', () => {
      expect(service.normalizeRole('visitor')).toBe(RoleTag.VISITOR);
    });

    it('应将 访客 映射为 RoleTag.VISITOR', () => {
      expect(service.normalizeRole('访客')).toBe(RoleTag.VISITOR);
    });

    it('未传角色应默认为 VISITOR', () => {
      expect(service.normalizeRole(undefined)).toBe(RoleTag.VISITOR);
    });

    it('未知角色应默认为 VISITOR', () => {
      expect(service.normalizeRole('unknown')).toBe(RoleTag.VISITOR);
    });
  });

  // ==================== 通知推荐 ====================

  describe('recommendNotices', () => {
    it('学生角色应返回教学运行和考务相关通知', async () => {
      prismaService.article.findMany
        .mockResolvedValueOnce(mockArticles.filter(a => a.responsibleBusiness === 'teaching-operation'))
        .mockResolvedValueOnce(mockArticles);

      const result = await service.recommendNotices(RoleTag.STUDENT, 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('recommendReason');
    });

    it('教师角色应返回教学项目和教学质量相关通知', async () => {
      prismaService.article.findMany
        .mockResolvedValueOnce(mockArticles.filter(a => a.responsibleBusiness === 'teaching-project'))
        .mockResolvedValueOnce(mockArticles);

      const result = await service.recommendNotices(RoleTag.TEACHER, 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('访客角色应返回综合事务和教学项目通知', async () => {
      prismaService.article.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockArticles);

      const result = await service.recommendNotices(RoleTag.VISITOR, 5);

      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  // ==================== 办事指南推荐（双维度索引）====================

  describe('recommendGuides', () => {
    it('学生角色应返回学生相关指南', async () => {
      prismaService.guideItem.findMany
        .mockResolvedValueOnce(mockGuideItems.filter(g => g.targetAudience === 'student'))
        .mockResolvedValueOnce([]);

      const result = await service.recommendGuides(RoleTag.STUDENT, 8);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].targetAudience).toBe('student');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('slug');
      expect(result[0]).toHaveProperty('businessTag');
    });

    it('教师角色应返回教师相关指南', async () => {
      prismaService.guideItem.findMany
        .mockResolvedValueOnce(mockGuideItems.filter(g => g.targetAudience === 'teacher'))
        .mockResolvedValueOnce([]);

      const result = await service.recommendGuides(RoleTag.TEACHER, 8);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].targetAudience).toBe('teacher');
    });

    it('访客角色应返回全部指南（包含所有受众）', async () => {
      prismaService.guideItem.findMany
        .mockResolvedValueOnce(mockGuideItems)
        .mockResolvedValueOnce([]);

      const result = await service.recommendGuides(RoleTag.VISITOR, 8);

      expect(result.length).toBeGreaterThan(0);
    });

    it('高优先级不足时应补充其他指南', async () => {
      prismaService.guideItem.findMany
        .mockResolvedValueOnce(mockGuideItems.slice(0, 1)) // 仅1条高优先级
        .mockResolvedValueOnce(mockGuideItems.slice(1)); // 补充剩余

      const result = await service.recommendGuides(RoleTag.STUDENT, 4);

      expect(result.length).toBeGreaterThan(1);
    });

    it('应限制返回数量不超过 limit', async () => {
      prismaService.guideItem.findMany
        .mockImplementation(({ take }: any) =>
          Promise.resolve(mockGuideItems.slice(0, take ?? mockGuideItems.length)),
        )
        .mockResolvedValueOnce([]);

      const result = await service.recommendGuides(RoleTag.STUDENT, 2);

      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  // ==================== 快捷入口推荐 ====================

  describe('recommendQuickLinks', () => {
    it('学生角色应返回学生专属入口', async () => {
      const result = await service.recommendQuickLinks(RoleTag.STUDENT, 6);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // 验证所有入口都是学生可用的
      for (const link of result) {
        const original = QUICK_LINKS.find(l => l.id === link.id);
        expect(original?.roles).toContain(RoleTag.STUDENT);
      }
    });

    it('教师角色应返回教师专属入口', async () => {
      const result = await service.recommendQuickLinks(RoleTag.TEACHER, 6);

      expect(result.length).toBeGreaterThan(0);
      for (const link of result) {
        const original = QUICK_LINKS.find(l => l.id === link.id);
        expect(original?.roles).toContain(RoleTag.TEACHER);
      }
    });

    it('访客角色应返回公共入口', async () => {
      const result = await service.recommendQuickLinks(RoleTag.VISITOR, 6);

      expect(result.length).toBeGreaterThan(0);
      for (const link of result) {
        const original = QUICK_LINKS.find(l => l.id === link.id);
        expect(original?.roles).toContain(RoleTag.VISITOR);
      }
    });

    it('应按 sortOrder 排序', async () => {
      const result = await service.recommendQuickLinks(RoleTag.STUDENT, 10);

      for (let i = 1; i < result.length; i++) {
        const prev = QUICK_LINKS.find(l => l.id === result[i - 1].id);
        const curr = QUICK_LINKS.find(l => l.id === result[i].id);
        expect(prev!.sortOrder).toBeLessThanOrEqual(curr!.sortOrder);
      }
    });

    it('应限制返回数量', async () => {
      const result = await service.recommendQuickLinks(RoleTag.STUDENT, 2);

      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  // ==================== 首页聚合 ====================

  describe('getHomepageRecommendations', () => {
    it('应返回完整首页推荐数据结构', async () => {
      // Mock 所有数据源
      prismaService.article.findMany
        .mockResolvedValue([])
        .mockResolvedValue([]);
      prismaService.guideItem.findMany
        .mockResolvedValue([])
        .mockResolvedValue([]);
      redisService.get.mockResolvedValue(null);

      const result = await service.getHomepageRecommendations('student');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('roleLabel');
      expect(result).toHaveProperty('notices');
      expect(result).toHaveProperty('guides');
      expect(result).toHaveProperty('quickLinks');
      expect(result).toHaveProperty('topics');
      expect(result).toHaveProperty('timestamp');
    });

    it('未传角色应默认为访客', async () => {
      prismaService.article.findMany
        .mockResolvedValue([])
        .mockResolvedValue([]);
      prismaService.guideItem.findMany
        .mockResolvedValue([])
        .mockResolvedValue([]);

      const result = await service.getHomepageRecommendations();

      expect(result.role).toBe(RoleTag.VISITOR);
      expect(result.roleLabel).toBe(ROLE_LABELS[RoleTag.VISITOR]);
    });

    it('有缓存时应返回缓存数据', async () => {
      const cachedData = {
        role: 'student',
        roleLabel: '学生',
        notices: [],
        guides: [],
        quickLinks: [],
        topics: [],
        timestamp: Date.now(),
      };
      redisService.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getHomepageRecommendations('student');

      expect(result.role).toBe('student');
    });

    it('同角色不同 limit 应使用不同缓存键，不命中错误缓存', async () => {
      // 模拟真实 Redis：按完整 key 存取
      const store = new Map<string, string>();
      redisService.get.mockImplementation((key: string) =>
        Promise.resolve(store.get(key) ?? null),
      );
      redisService.set.mockImplementation((key: string, val: string) => {
        store.set(key, val);
        return Promise.resolve('OK');
      });
      prismaService.article.findMany.mockResolvedValue([]);
      prismaService.guideItem.findMany.mockResolvedValue([]);

      await service.getHomepageRecommendations('student', { noticeLimit: 5 });
      await service.getHomepageRecommendations('student', { noticeLimit: 10 });

      // 旧实现仅按 role 缓存 → 两次写入同一 key，store.size===1（错误命中）
      // 修复后缓存键含 limit → 两个不同 key，store.size===2
      expect(store.size).toBe(2);
      const keys = [...store.keys()];
      expect(keys[0]).not.toBe(keys[1]);
      expect(keys.some(k => k.includes(':5:'))).toBe(true);
      expect(keys.some(k => k.includes(':10:'))).toBe(true);
    });
  });

  // ==================== 单区域推荐 ====================

  describe('getSectionRecommendations', () => {
    it('应支持 notice 区域', async () => {
      prismaService.article.findMany
        .mockResolvedValue([])
        .mockResolvedValue([]);

      const result = await service.getSectionRecommendations(RecommendSection.NOTICE, 'student');
      expect(Array.isArray(result)).toBe(true);
    });

    it('应支持 guide 区域', async () => {
      prismaService.guideItem.findMany
        .mockResolvedValue([])
        .mockResolvedValue([]);

      const result = await service.getSectionRecommendations(RecommendSection.GUIDE, 'student');
      expect(Array.isArray(result)).toBe(true);
    });

    it('无效区域应抛出异常', async () => {
      await expect(
        service.getSectionRecommendations('invalid' as RecommendSection, 'student'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== 缓存管理 ====================

  describe('invalidateCache', () => {
    it('应清除指定角色缓存', async () => {
      await service.invalidateCache('student');

      expect(redisService.del).toHaveBeenCalledWith(
        expect.stringContaining(RoleTag.STUDENT),
      );
    });

    it('未指定角色时应清除所有角色缓存', async () => {
      await service.invalidateCache();

      expect(redisService.del).toHaveBeenCalledTimes(ROLE_TAG_VALUES.length);
    });
  });

  // ==================== 角色标签查询 ====================

  describe('getSupportedRoles', () => {
    it('应返回所有支持的角色标签', () => {
      const roles = service.getSupportedRoles();

      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBe(3);
      expect(roles.map(r => r.role)).toEqual(
        expect.arrayContaining([RoleTag.STUDENT, RoleTag.TEACHER, RoleTag.VISITOR]),
      );
    });

    it('每个角色应包含标签和描述', () => {
      const roles = service.getSupportedRoles();

      for (const role of roles) {
        expect(role).toHaveProperty('role');
        expect(role).toHaveProperty('label');
        expect(role).toHaveProperty('description');
      }
    });
  });

  // ==================== 专题推荐 ====================

  describe('recommendTopics', () => {
    it('应返回专题内容列表', async () => {
      prismaService.article.findMany.mockResolvedValue(mockArticles);

      const result = await service.recommendTopics(RoleTag.STUDENT, 4);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('tag');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('articles');
    });
  });
});
