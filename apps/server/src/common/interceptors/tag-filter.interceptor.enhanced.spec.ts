import { of, throwError } from 'rxjs';
import { TagFilterInterceptor } from './tag-filter.interceptor.js';
import {
  TagVisibility,
  TAG_PREFIX,
  getTagType,
  isPublicTag,
  isColumnTag,
  isAdminTag,
  API_PATH_PATTERNS,
  UserRole,
  type UserRoleType,
} from '../constants/tag.constants.js';

// ==================== Mock 数据 ====================

const makeArticle = (overrides: Record<string, any> = {}) => ({
  id: 1,
  articleId: 10001,
  title: '2026年秋季学期教学安排通知',
  summary: '测试摘要',
  content: '正文内容',
  publishedAt: '2026-07-27',
  viewCount: 100,
  downloadCount: 10,
  ...overrides,
});

const makeTags = (
  publicCount = 2,
  columnCount = 2,
  adminCount = 2,
) => {
  const tags: any[] = [];
  for (let i = 0; i < publicCount; i++) {
    tags.push({
      tagId: 100 + i,
      tagName: `公开标签${i}`,
      tagCode: `PUBLIC_TAG_${i}`,
      type: 'public',
    });
  }
  for (let i = 0; i < columnCount; i++) {
    tags.push({
      tagId: 200 + i,
      tagName: `栏目标签${i}`,
      tagCode: `COLUMN_TAG_${i}`,
      type: 'column',
    });
  }
  for (let i = 0; i < adminCount; i++) {
    tags.push({
      tagId: 300 + i,
      tagName: `管控标签${i}`,
      tagCode: `ADMIN_TAG_${i}`,
      type: 'admin',
    });
  }
  return tags;
};

const makeArticleWithTags = (tags: any[] = makeTags()) =>
  makeArticle({
    tags,
    businessTags: tags.map((t) => t.tagCode),
    roleTags: tags.map((t) => t.tagCode),
    timeTags: tags.map((t) => t.tagCode),
  });

const makeApiResponse = (data: any) => ({
  code: 0,
  message: 'ok',
  data,
  timestamp: Date.now(),
});

const makePaginatedResponse = (items: any[]) => ({
  code: 0,
  message: 'ok',
  data: {
    list: items,
    total: items.length,
    page: 1,
    pageSize: 10,
  },
  timestamp: Date.now(),
});

const makeExecutionContext = (
  url: string,
  user?: { role?: string; bindColumnIds?: number[] },
) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        originalUrl: url,
        url,
        user,
      }),
    }),
    getClass: () => class {},
    getHandler: () => () => {},
  }) as any;

const makeCallHandler = (response: any) =>
  ({
    handle: () => of(response),
  }) as any;

const makeErrorCallHandler = () =>
  ({
    handle: () => throwError(() => new Error('Test error')),
  }) as any;

// ==================== TAG_PREFIX 常量测试 ====================

describe('TAG_PREFIX 常量', () => {
  it('应该定义正确的前缀值', () => {
    expect(TAG_PREFIX.PUBLIC).toBe('PUBLIC_');
    expect(TAG_PREFIX.COLUMN).toBe('COLUMN_');
    expect(TAG_PREFIX.ADMIN).toBe('ADMIN_');
  });

  it('前缀应该是唯一且不重叠的', () => {
    expect(TAG_PREFIX.PUBLIC).not.toBe(TAG_PREFIX.COLUMN);
    expect(TAG_PREFIX.COLUMN).not.toBe(TAG_PREFIX.ADMIN);
    expect(TAG_PREFIX.PUBLIC).not.toBe(TAG_PREFIX.ADMIN);
  });

  it('所有前缀应以下划线结尾', () => {
    expect(TAG_PREFIX.PUBLIC.endsWith('_')).toBe(true);
    expect(TAG_PREFIX.COLUMN.endsWith('_')).toBe(true);
    expect(TAG_PREFIX.ADMIN.endsWith('_')).toBe(true);
  });
});

// ==================== getTagType 辅助函数测试 ====================

describe('getTagType', () => {
  it('应正确识别 PUBLIC_ 前缀', () => {
    expect(getTagType('PUBLIC_ACADEMIC')).toBe('public');
    expect(getTagType('PUBLIC_EXAM')).toBe('public');
    expect(getTagType('PUBLIC_TAG_0')).toBe('public');
  });

  it('应正确识别 COLUMN_ 前缀', () => {
    expect(getTagType('COLUMN_NEED_REVIEW')).toBe('column');
    expect(getTagType('COLUMN_URGENT')).toBe('column');
  });

  it('应正确识别 ADMIN_ 前缀', () => {
    expect(getTagType('ADMIN_CLASSIFIED')).toBe('admin');
    expect(getTagType('ADMIN_TOP_PRIORITY')).toBe('admin');
  });

  it('应拒绝不带下划线的前缀', () => {
    expect(getTagType('PUBLIC')).toBeNull();
    expect(getTagType('COLUMN')).toBeNull();
    expect(getTagType('ADMIN')).toBeNull();
  });

  it('应对空字符串返回 null', () => {
    expect(getTagType('')).toBeNull();
  });

  it('应对 undefined/null 输入返回 null', () => {
    expect(getTagType(undefined as any)).toBeNull();
    expect(getTagType(null as any)).toBeNull();
  });

  it('应对未知前缀返回 null', () => {
    expect(getTagType('PRIVATE_TAG')).toBeNull();
    expect(getTagType('OTHER_PREFIX')).toBeNull();
    expect(getTagType('PUB')).toBeNull(); // 不是 PUBLIC_
    expect(getTagType('COL')).toBeNull(); // 不是 COLUMN_
  });

  it('前缀匹配应区分大小写', () => {
    expect(getTagType('public_tag')).toBeNull();
    expect(getTagType('column_tag')).toBeNull();
    expect(getTagType('admin_tag')).toBeNull();
  });
});

// ==================== isXxxTag 辅助函数测试 ====================

describe('标签类型判断函数', () => {
  describe('isPublicTag', () => {
    it('应正确识别公开标签', () => {
      expect(isPublicTag('PUBLIC_ACADEMIC')).toBe(true);
      expect(isPublicTag('PUBLIC_EXAM')).toBe(true);
    });

    it('应拒绝非公开标签', () => {
      expect(isPublicTag('COLUMN_NEED_REVIEW')).toBe(false);
      expect(isPublicTag('ADMIN_CLASSIFIED')).toBe(false);
    });

    it('应对空值安全返回 false', () => {
      expect(isPublicTag('')).toBe(false);
      expect(isPublicTag(undefined as any)).toBe(false);
      expect(isPublicTag(null as any)).toBe(false);
    });
  });

  describe('isColumnTag', () => {
    it('应正确识别栏目标签', () => {
      expect(isColumnTag('COLUMN_NEED_REVIEW')).toBe(true);
      expect(isColumnTag('COLUMN_URGENT')).toBe(true);
    });

    it('应拒绝非栏目标签', () => {
      expect(isColumnTag('PUBLIC_ACADEMIC')).toBe(false);
      expect(isColumnTag('ADMIN_CLASSIFIED')).toBe(false);
    });

    it('应对空值安全返回 false', () => {
      expect(isColumnTag('')).toBe(false);
      expect(isColumnTag(undefined as any)).toBe(false);
    });
  });

  describe('isAdminTag', () => {
    it('应正确识别管控标签', () => {
      expect(isAdminTag('ADMIN_CLASSIFIED')).toBe(true);
      expect(isAdminTag('ADMIN_TOP_PRIORITY')).toBe(true);
    });

    it('应拒绝非管控标签', () => {
      expect(isAdminTag('PUBLIC_ACADEMIC')).toBe(false);
      expect(isAdminTag('COLUMN_NEED_REVIEW')).toBe(false);
    });

    it('应对空值安全返回 false', () => {
      expect(isAdminTag('')).toBe(false);
      expect(isAdminTag(null as any)).toBe(false);
    });
  });
});

// ==================== 用户角色枚举测试 ====================

describe('UserRole 枚举', () => {
  it('应包含所有定义的角色', () => {
    expect(Object.keys(UserRole)).toEqual([
      'EDITOR',
      'REVIEWER',
      'COLUMN_ADMIN',
      'SYSTEM_ADMIN',
    ]);
  });

  it('角色值应符合预期', () => {
    expect(UserRole.EDITOR).toBe('editor');
    expect(UserRole.REVIEWER).toBe('reviewer');
    expect(UserRole.COLUMN_ADMIN).toBe('column_admin');
    expect(UserRole.SYSTEM_ADMIN).toBe('system_admin');
  });

  it('应支持 UserRoleType 类型断言', () => {
    const role: UserRoleType = UserRole.EDITOR;
    expect(role).toBe('editor');
  });
});

// ==================== RxJS intercept 集成测试 ====================

describe('TagFilterInterceptor - RxJS 集成测试', () => {
  let interceptor: TagFilterInterceptor;

  beforeEach(() => {
    interceptor = new TagFilterInterceptor();
  });

  describe('intercept 方法', () => {
    it('应返回 Observable', () => {
      const response = makeApiResponse(makeArticleWithTags());
      const context = makeExecutionContext(
        '/api/v1/public/articles/1057',
        { role: 'system_admin' },
      );
      const handler = makeCallHandler(response);

      const result = interceptor.intercept(context, handler);
      expect(result).toBeDefined();
      expect(typeof result.subscribe).toBe('function');
    });

    it('文章详情接口应移除所有标签', (done) => {
      const response = makeApiResponse(makeArticleWithTags());
      const context = makeExecutionContext(
        '/api/v1/public/articles/1057',
        { role: 'system_admin' },
      );
      const handler = makeCallHandler(response);

      interceptor.intercept(context, handler).subscribe((filtered: any) => {
        try {
          expect(filtered.data.tags).toEqual([]);
          expect(filtered.data.businessTags).toEqual([]);
          expect(filtered.data.roleTags).toEqual([]);
          expect(filtered.data.timeTags).toEqual([]);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('匿名访客访问公开列表仅看到公开标签', (done) => {
      const response = makePaginatedResponse([makeArticleWithTags()]);
      const context = makeExecutionContext(
        '/api/v1/public/columns/academic/articles',
        undefined,
      );
      const handler = makeCallHandler(response);

      interceptor.intercept(context, handler).subscribe((filtered: any) => {
        try {
          const article = filtered.data.list[0];
          expect(article.tags.length).toBe(2);
          expect(article.tags.every((t: any) => isPublicTag(t.tagCode))).toBe(true);
          expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(false);
          expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('系统管理员访问公开列表看到全量标签', (done) => {
      const response = makePaginatedResponse([makeArticleWithTags()]);
      const context = makeExecutionContext(
        '/api/v1/public/columns/academic/articles',
        { role: 'system_admin', bindColumnIds: [1] },
      );
      const handler = makeCallHandler(response);

      interceptor.intercept(context, handler).subscribe((filtered: any) => {
        try {
          const article = filtered.data.list[0];
          expect(article.tags.length).toBe(6);
          expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true);
          expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true);
          expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(true);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('编辑访问后台列表看到公开+栏目标签', (done) => {
      const response = makePaginatedResponse([makeArticleWithTags()]);
      const context = makeExecutionContext(
        '/api/v1/article/published',
        { role: 'editor', bindColumnIds: [1] },
      );
      const handler = makeCallHandler(response);

      interceptor.intercept(context, handler).subscribe((filtered: any) => {
        try {
          const article = filtered.data.list[0];
          expect(article.tags.length).toBe(4);
          expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true);
          expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true);
          expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('后台列表接口匿名用户应返回空标签', (done) => {
      const response = makePaginatedResponse([makeArticleWithTags()]);
      const context = makeExecutionContext(
        '/api/v1/article/published',
        undefined,
      );
      const handler = makeCallHandler(response);

      interceptor.intercept(context, handler).subscribe((filtered: any) => {
        try {
          const article = filtered.data.list[0];
          expect(article.tags).toEqual([]);
          expect(article.businessTags).toEqual([]);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('搜索接口应正确过滤标签', (done) => {
      const response = makePaginatedResponse([makeArticleWithTags()]);
      const context = makeExecutionContext(
        '/api/v1/public/search?q=test',
        undefined,
      );
      const handler = makeCallHandler(response);

      interceptor.intercept(context, handler).subscribe((filtered: any) => {
        try {
          const article = filtered.data.list[0];
          expect(article.tags.length).toBe(2);
          expect(article.tags.every((t: any) => isPublicTag(t.tagCode))).toBe(true);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('异常容错', () => {
    it('handler 抛出异常时应透传异常', (done) => {
      const context = makeExecutionContext(
        '/api/v1/public/articles/1057',
        { role: 'system_admin' },
      );
      const handler = makeErrorCallHandler();

      interceptor.intercept(context, handler).subscribe({
        error: () => {
          // 异常应被透传
          done();
        },
      });
    });

    it('无效响应结构不应导致崩溃', (done) => {
      const context = makeExecutionContext(
        '/api/v1/public/columns/academic/articles',
        { role: 'editor', bindColumnIds: [1] },
      );

      // 返回非对象结构
      const handler = makeCallHandler(null);

      interceptor.intercept(context, handler).subscribe((result: any) => {
        try {
          expect(result).toBeNull();
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('缺少 user 时应安全处理', (done) => {
      const response = makePaginatedResponse([makeArticleWithTags()]);
      const context = makeExecutionContext(
        '/api/v1/public/columns/academic/articles',
        undefined, // 完全没有 user
      );
      const handler = makeCallHandler(response);

      interceptor.intercept(context, handler).subscribe((filtered: any) => {
        try {
          const article = filtered.data.list[0];
          expect(article.tags.every((t: any) => isPublicTag(t.tagCode))).toBe(true);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});

// ==================== 全权限矩阵测试 ====================

describe('全权限矩阵', () => {
  const interceptor = new TagFilterInterceptor();

  const interfaceTypes = [
    {
      name: '文章详情',
      url: '/api/v1/public/articles/1057',
      adminUrl: '/api/v1/article/1',
    },
    {
      name: '栏目列表',
      url: '/api/v1/public/columns/academic/articles',
      adminUrl: '/api/v1/article/published',
    },
    {
      name: '全站搜索',
      url: '/api/v1/public/search?q=test',
      adminUrl: '/api/v1/article/draft',
    },
    {
      name: '公开文章列表',
      url: '/api/v1/public/articles',
      adminUrl: '/api/v1/article/pending',
    },
  ];

  const roles = [
    { role: undefined, desc: '匿名访客', expected: '仅公开' },
    { role: 'student', desc: 'SSO师生', expected: '仅公开' },
    { role: 'editor', desc: '编辑(R1)', expected: '公开+栏目' },
    { role: 'reviewer', desc: '审核(R2)', expected: '公开+栏目' },
    { role: 'column_admin', desc: '栏目管理员(R3)', expected: '公开+栏目' },
    { role: 'system_admin', desc: '系统管理员(R4)', expected: '全量' },
  ];

  describe('文章详情接口权限矩阵', () => {
    roles.forEach(({ role, desc }) => {
      it(`${desc} 访问文章详情应返回空标签`, () => {
        const response = makeApiResponse(makeArticleWithTags());
        const user = role ? { role, bindColumnIds: [1] } : undefined;

        const result = (interceptor as any).removeAllTags(response);
        expect(result.data.tags).toEqual([]);
        expect(result.data.businessTags).toEqual([]);
        expect(result.data.roleTags).toEqual([]);
        expect(result.data.timeTags).toEqual([]);
      });
    });
  });

  describe('公开接口权限矩阵', () => {
    const testCases: [string, { role?: string; bindColumnIds?: number[] } | undefined, number, boolean, boolean, boolean][] = [
      // [url, user, expectedTagCount, hasPublic, hasColumn, hasAdmin]
      // 匿名访客
      ['/api/v1/public/columns/academic/articles', undefined, 2, true, false, false],
      ['/api/v1/public/search', undefined, 2, true, false, false],
      ['/api/v1/public/articles', undefined, 2, true, false, false],
      // SSO师生
      ['/api/v1/public/columns/academic/articles', { role: 'student' }, 2, true, false, false],
      ['/api/v1/public/search', { role: 'student' }, 2, true, false, false],
      // 编辑
      ['/api/v1/public/columns/academic/articles', { role: 'editor', bindColumnIds: [1] }, 4, true, true, false],
      ['/api/v1/public/search', { role: 'editor', bindColumnIds: [1] }, 4, true, true, false],
      ['/api/v1/public/articles', { role: 'editor', bindColumnIds: [1] }, 4, true, true, false],
      // 审核
      ['/api/v1/public/columns/academic/articles', { role: 'reviewer', bindColumnIds: [1] }, 4, true, true, false],
      ['/api/v1/public/search', { role: 'reviewer', bindColumnIds: [1] }, 4, true, true, false],
      // 栏目管理员
      ['/api/v1/public/columns/academic/articles', { role: 'column_admin', bindColumnIds: [1, 2] }, 4, true, true, false],
      ['/api/v1/public/search', { role: 'column_admin', bindColumnIds: [1, 2] }, 4, true, true, false],
      // 系统管理员
      ['/api/v1/public/columns/academic/articles', { role: 'system_admin', bindColumnIds: [] }, 6, true, true, true],
      ['/api/v1/public/search', { role: 'system_admin', bindColumnIds: [] }, 6, true, true, true],
      ['/api/v1/public/articles', { role: 'system_admin', bindColumnIds: [] }, 6, true, true, true],
    ];

    testCases.forEach(([url, user, expectedCount, hasPublic, hasColumn, hasAdmin]) => {
      it(`${user?.role || '匿名'} 访问 ${url} 应返回 ${expectedCount} 个标签`, () => {
        const response = makePaginatedResponse([makeArticleWithTags()]);

        // 先调用 determineVisibility 确认可见性级别
        const visibility = (interceptor as any).determineVisibility(url, user);
        const filtered = (interceptor as any).filterTagsByVisibility(
          response,
          visibility,
          user,
        );

        const article = filtered.data.list[0];
        expect(article.tags.length).toBe(expectedCount);
        expect(
          article.tags.some((t: any) => isPublicTag(t.tagCode)),
        ).toBe(hasPublic);
        expect(
          article.tags.some((t: any) => isColumnTag(t.tagCode)),
        ).toBe(hasColumn);
        expect(
          article.tags.some((t: any) => isAdminTag(t.tagCode)),
        ).toBe(hasAdmin);
      });
    });
  });

  describe('后台接口权限矩阵', () => {
    const adminTestCases: [string, { role?: string; bindColumnIds?: number[] } | undefined, number, boolean, boolean, boolean][] = [
      // 匿名用户访问后台
      ['/api/v1/article/published', undefined, 0, false, false, false],
      ['/api/v1/article/draft', undefined, 0, false, false, false],
      ['/api/v1/article/pending', undefined, 0, false, false, false],
      // 编辑
      ['/api/v1/article/published', { role: 'editor', bindColumnIds: [1] }, 4, true, true, false],
      ['/api/v1/article/draft', { role: 'editor', bindColumnIds: [1] }, 4, true, true, false],
      ['/api/v1/article/pending', { role: 'editor', bindColumnIds: [1] }, 4, true, true, false],
      ['/api/v1/article/final-pending', { role: 'editor', bindColumnIds: [1] }, 4, true, true, false],
      ['/api/v1/article/rejected', { role: 'editor', bindColumnIds: [1] }, 4, true, true, false],
      // 审核
      ['/api/v1/article/published', { role: 'reviewer', bindColumnIds: [1] }, 4, true, true, false],
      ['/api/v1/article/pending', { role: 'reviewer', bindColumnIds: [1] }, 4, true, true, false],
      // 栏目管理员
      ['/api/v1/article/published', { role: 'column_admin', bindColumnIds: [1, 2] }, 4, true, true, false],
      // 系统管理员
      ['/api/v1/article/published', { role: 'system_admin', bindColumnIds: [] }, 6, true, true, true],
      ['/api/v1/article/draft', { role: 'system_admin', bindColumnIds: [] }, 6, true, true, true],
      ['/api/v1/article/pending', { role: 'system_admin', bindColumnIds: [] }, 6, true, true, true],
      ['/api/v1/article/final-pending', { role: 'system_admin', bindColumnIds: [] }, 6, true, true, true],
      ['/api/v1/article/rejected', { role: 'system_admin', bindColumnIds: [] }, 6, true, true, true],
    ];

    adminTestCases.forEach(([url, user, expectedCount, hasPublic, hasColumn, hasAdmin]) => {
      it(`${user?.role || '匿名'} 访问后台 ${url} 应返回 ${expectedCount} 个标签`, () => {
        const response = makePaginatedResponse([makeArticleWithTags()]);

        const visibility = (interceptor as any).determineVisibility(url, user);
        const filtered = (interceptor as any).filterTagsByVisibility(
          response,
          visibility,
          user,
        );

        const article = filtered.data.list[0];
        if (expectedCount === 0) {
          expect(article.tags).toEqual([]);
        } else {
          expect(article.tags.length).toBe(expectedCount);
          expect(
            article.tags.some((t: any) => isPublicTag(t.tagCode)),
          ).toBe(hasPublic);
          expect(
            article.tags.some((t: any) => isColumnTag(t.tagCode)),
          ).toBe(hasColumn);
          expect(
            article.tags.some((t: any) => isAdminTag(t.tagCode)),
          ).toBe(hasAdmin);
        }
      });
    });
  });
});

// ==================== 嵌套结构测试 ====================

describe('嵌套结构处理', () => {
  let interceptor: TagFilterInterceptor;

  beforeEach(() => {
    interceptor = new TagFilterInterceptor();
  });

  it('应处理嵌套对象中的标签字段', () => {
    const nestedArticle = {
      id: 1,
      meta: {
        title: '嵌套测试',
        tags: makeTags(1, 1, 1),
      },
      children: [
        { tags: makeTags(2, 0, 0) },
        { tags: makeTags(0, 2, 0) },
      ],
    };

    const response = makeApiResponse(nestedArticle);
    const filtered = (interceptor as any).filterTagsByVisibility(
      response,
      TagVisibility.PUBLIC_ONLY,
    );

    // meta.tags 应仅保留公开标签
    expect(filtered.data.meta.tags.length).toBe(1);
    expect(
      filtered.data.meta.tags.every((t: any) => isPublicTag(t.tagCode)),
    ).toBe(true);

    // 第一个子元素应仅保留公开标签
    expect(filtered.data.children[0].tags.length).toBe(2);
    expect(
      filtered.data.children[0].tags.every((t: any) => isPublicTag(t.tagCode)),
    ).toBe(true);

    // 第二个子元素原只有栏目标签，过滤后应为空
    expect(filtered.data.children[1].tags).toEqual([]);
  });

  it('应处理多层嵌套结构', () => {
    const deepNested = {
      level1: {
        level2: {
          level3: {
            tags: makeTags(1, 1, 1),
            businessTags: ['PUBLIC_X', 'COLUMN_Y', 'ADMIN_Z'],
          },
        },
      },
    };

    const response = makeApiResponse(deepNested);
    const filtered = (interceptor as any).filterTagsByVisibility(
      response,
      TagVisibility.PUBLIC_PLUS_COLUMN,
    );

    expect(filtered.data.level1.level2.level3.tags.length).toBe(2);
    expect(
      filtered.data.level1.level2.level3.businessTags.length,
    ).toBe(2);
    expect(
      filtered.data.level1.level2.level3.businessTags.every(
        (c: string) => isPublicTag(c) || isColumnTag(c),
      ),
    ).toBe(true);
    expect(
      filtered.data.level1.level2.level3.businessTags.some((c: string) =>
        isAdminTag(c),
      ),
    ).toBe(false);
  });

  it('应处理数组中的嵌套对象', () => {
    const list = [
      { id: 1, tags: makeTags(1, 0, 0) },
      { id: 2, tags: makeTags(0, 1, 0) },
      { id: 3, tags: makeTags(0, 0, 1) },
    ];

    const response = makePaginatedResponse(list);
    const filtered = (interceptor as any).filterTagsByVisibility(
      response,
      TagVisibility.PUBLIC_ONLY,
    );

    expect(filtered.data.list[0].tags.length).toBe(1);
    expect(filtered.data.list[1].tags).toEqual([]);
    expect(filtered.data.list[2].tags).toEqual([]);
  });

  it('应处理空列表', () => {
    const response = makePaginatedResponse([]);
    const filtered = (interceptor as any).filterTagsByVisibility(
      response,
      TagVisibility.ALL,
    );

    expect(filtered.data.list).toEqual([]);
    expect(filtered.data.total).toBe(0);
  });

  it('应处理单对象响应（非分页结构）', () => {
    const article = makeArticleWithTags();
    const response = makeApiResponse(article);
    const filtered = (interceptor as any).filterTagsByVisibility(
      response,
      TagVisibility.PUBLIC_ONLY,
    );

    expect(filtered.data.tags.length).toBe(2);
    expect(
      filtered.data.tags.every((t: any) => isPublicTag(t.tagCode)),
    ).toBe(true);
  });

  it('应处理数组响应（非分页结构）', () => {
    const articles = [makeArticleWithTags(), makeArticleWithTags()];
    const response = makeApiResponse(articles);
    const filtered = (interceptor as any).filterTagsByVisibility(
      response,
      TagVisibility.PUBLIC_ONLY,
    );

    expect(Array.isArray(filtered.data)).toBe(true);
    expect(filtered.data.length).toBe(2);
    filtered.data.forEach((article: any) => {
      expect(article.tags.length).toBe(2);
      expect(
        article.tags.every((t: any) => isPublicTag(t.tagCode)),
      ).toBe(true);
    });
  });
});

// ==================== 标签字段识别测试 ====================

describe('标签字段识别', () => {
  const interceptor = new TagFilterInterceptor();

  it('应识别 tags 字段', () => {
    expect((interceptor as any).isTagField('tags')).toBe(true);
  });

  it('应识别 businessTags 字段', () => {
    expect((interceptor as any).isTagField('businessTags')).toBe(true);
  });

  it('应识别 roleTags 字段', () => {
    expect((interceptor as any).isTagField('roleTags')).toBe(true);
  });

  it('应识别 timeTags 字段', () => {
    expect((interceptor as any).isTagField('timeTags')).toBe(true);
  });

  it('应拒绝非标签字段', () => {
    expect((interceptor as any).isTagField('title')).toBe(false);
    expect((interceptor as any).isTagField('content')).toBe(false);
    expect((interceptor as any).isTagField('publishedAt')).toBe(false);
    expect((interceptor as any).isTagField('authorId')).toBe(false);
    expect((interceptor as any).isTagField('columnId')).toBe(false);
  });
});

// ==================== 标签编码提取测试 ====================

describe('标签编码提取', () => {
  const interceptor = new TagFilterInterceptor();

  it('应从字符串标签直接返回', () => {
    expect((interceptor as any).extractTagCode('PUBLIC_TEST')).toBe('PUBLIC_TEST');
    expect((interceptor as any).extractTagCode('COLUMN_TEST')).toBe('COLUMN_TEST');
  });

  it('应从对象标签提取 tagCode', () => {
    const tag = { tagCode: 'PUBLIC_FROM_OBJECT', name: '测试' };
    expect((interceptor as any).extractTagCode(tag)).toBe('PUBLIC_FROM_OBJECT');
  });

  it('应从对象标签提取 code 字段', () => {
    const tag = { code: 'PUBLIC_FROM_CODE', name: '测试' };
    expect((interceptor as any).extractTagCode(tag)).toBe('PUBLIC_FROM_CODE');
  });

  it('应从对象标签提取 tag 字段', () => {
    const tag = { tag: 'PUBLIC_FROM_TAG', name: '测试' };
    expect((interceptor as any).extractTagCode(tag)).toBe('PUBLIC_FROM_TAG');
  });

  it('应对无效对象返回空字符串', () => {
    expect((interceptor as any).extractTagCode({})).toBe('');
    expect((interceptor as any).extractTagCode(null)).toBe('');
    expect((interceptor as any).extractTagCode(undefined)).toBe('');
  });
});

// ==================== URL 匹配测试 ====================

describe('URL 匹配规则', () => {
  const interceptor = new TagFilterInterceptor();

  describe('matchesAny', () => {
    it('应匹配第一个命中的模式', () => {
      const patterns = [/^\/api\/v1\/test\/1$/, /^\/api\/v1\/test\/2$/];
      expect((interceptor as any).matchesAny('/api/v1/test/1', patterns)).toBe(true);
      expect((interceptor as any).matchesAny('/api/v1/test/2', patterns)).toBe(true);
      expect((interceptor as any).matchesAny('/api/v1/test/3', patterns)).toBe(false);
    });

    it('空模式数组应返回 false', () => {
      expect((interceptor as any).matchesAny('/api/v1/test', [])).toBe(false);
    });
  });

  describe('API_PATH_PATTERNS 完整覆盖', () => {
    it('ARTICLE_DETAIL 应匹配前台详情路径', () => {
      const tests: [string, boolean][] = [
        ['/api/v1/public/articles/1057', true],
        ['/api/v1/public/articles/academic-notice', true],
        ['/api/v1/public/articles/1057?ref=home', false], // 带查询参数不匹配
        ['/api/v1/article/1', false], // 后台路径不匹配 ARTICLE_DETAIL
        ['/api/v1/article/abc', false],
      ];

      tests.forEach(([url, expected]) => {
        const result = (interceptor as any).matchesAny(
          url,
          API_PATH_PATTERNS.ARTICLE_DETAIL,
        );
        expect(result).toBe(expected);
      });
    });

    it('ADMIN_ARTICLE_EDIT 应匹配后台编辑路径', () => {
      const tests: [string, boolean][] = [
        ['/api/v1/article/1', true],
        ['/api/v1/article/999', true],
        ['/api/v1/article/abc', false], // 非数字ID不匹配
        ['/api/v1/public/articles/1', false], // 公开详情不匹配
      ];

      tests.forEach(([url, expected]) => {
        const result = (interceptor as any).matchesAny(
          url,
          API_PATH_PATTERNS.ADMIN_ARTICLE_EDIT,
        );
        expect(result).toBe(expected);
      });
    });

    it('COLUMN_LIST 应匹配栏目列表路径', () => {
      const tests: [string, boolean][] = [
        ['/api/v1/public/columns/academic/articles', true],
        ['/api/v1/public/columns/exam/articles', true],
        ['/api/v1/public/columns/some-slug/articles', true],
        ['/api/v1/public/columns/academic/articles?page=1', false],
        ['/api/v1/public/columns/articles', false], // 缺少 slug
      ];

      tests.forEach(([url, expected]) => {
        const result = (interceptor as any).matchesAny(
          url,
          API_PATH_PATTERNS.COLUMN_LIST,
        );
        expect(result).toBe(expected);
      });
    });

    it('SEARCH 应匹配搜索路径', () => {
      const tests: [string, boolean][] = [
        ['/api/v1/public/search', true],
        ['/api/v1/public/search?q=test', true], // 带查询参数也匹配
        ['/api/v1/public/search?keyword=教学&page=1', true],
        ['/api/v1/public/search/results', false],
      ];

      tests.forEach(([url, expected]) => {
        const result = (interceptor as any).matchesAny(
          url,
          API_PATH_PATTERNS.SEARCH,
        );
        expect(result).toBe(expected);
      });
    });

    it('ADMIN_ARTICLE_LIST 应匹配所有状态列表', () => {
      const tests = [
        ['/api/v1/article/published', true],
        ['/api/v1/article/draft', true],
        ['/api/v1/article/pending', true],
        ['/api/v1/article/final-pending', true],
        ['/api/v1/article/rejected', true],
        ['/api/v1/article/archived', false], // 不在列表中
        ['/api/v1/article/published/1', false], // 带子路径
      ];

      tests.forEach(([url, expected]) => {
        const result = (interceptor as any).matchesAny(
          url as string,
          API_PATH_PATTERNS.ADMIN_ARTICLE_LIST,
        );
        expect(result).toBe(expected);
      });
    });
  });
});

// ==================== 角色可见性映射测试 ====================

describe('角色-可见性映射', () => {
  const interceptor = new TagFilterInterceptor();

  it('编辑应映射到 PUBLIC_PLUS_COLUMN', () => {
    expect(
      (interceptor as any).getVisibilityByRole(UserRole.EDITOR),
    ).toBe(TagVisibility.PUBLIC_PLUS_COLUMN);
  });

  it('审核应映射到 PUBLIC_PLUS_COLUMN', () => {
    expect(
      (interceptor as any).getVisibilityByRole(UserRole.REVIEWER),
    ).toBe(TagVisibility.PUBLIC_PLUS_COLUMN);
  });

  it('栏目管理员应映射到 PUBLIC_PLUS_ALL_COLUMN', () => {
    expect(
      (interceptor as any).getVisibilityByRole(UserRole.COLUMN_ADMIN),
    ).toBe(TagVisibility.PUBLIC_PLUS_ALL_COLUMN);
  });

  it('系统管理员应映射到 ALL', () => {
    expect(
      (interceptor as any).getVisibilityByRole(UserRole.SYSTEM_ADMIN),
    ).toBe(TagVisibility.ALL);
  });

  it('未知角色应映射到 PUBLIC_ONLY', () => {
    expect(
      (interceptor as any).getVisibilityByRole('unknown_role' as any),
    ).toBe(TagVisibility.PUBLIC_ONLY);
  });

  it('student 角色应映射到 PUBLIC_ONLY', () => {
    expect(
      (interceptor as any).getVisibilityByRole('student' as any),
    ).toBe(TagVisibility.PUBLIC_ONLY);
  });
});

// ==================== 完整端到端场景测试 ====================

describe('端到端场景', () => {
  let interceptor: TagFilterInterceptor;

  beforeEach(() => {
    interceptor = new TagFilterInterceptor();
  });

  it('场景一：匿名访客浏览首页', (done) => {
    const response = makePaginatedResponse([
      makeArticleWithTags(),
      makeArticleWithTags(makeTags(1, 1, 1)),
    ]);
    const context = makeExecutionContext(
      '/api/v1/public/articles',
      undefined,
    );
    const handler = makeCallHandler(response);

    interceptor.intercept(context, handler).subscribe((result: any) => {
      try {
        result.data.list.forEach((article: any) => {
          expect(article.tags.every((t: any) => isPublicTag(t.tagCode))).toBe(
            true,
          );
          expect(
            article.tags.some((t: any) => isAdminTag(t.tagCode)),
          ).toBe(false);
        });
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('场景二：SSO师生查看文章详情', (done) => {
    const response = makeApiResponse(makeArticleWithTags());
    const context = makeExecutionContext(
      '/api/v1/public/articles/1057',
      { role: 'student' },
    );
    const handler = makeCallHandler(response);

    interceptor.intercept(context, handler).subscribe((result: any) => {
      try {
        expect(result.data.tags).toEqual([]);
        expect(result.data.businessTags).toEqual([]);
        expect(result.data.content).toBe('正文内容'); // 正文不受影响
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('场景三：编辑在后台编辑稿件', (done) => {
    const response = makeApiResponse(makeArticleWithTags());
    const context = makeExecutionContext(
      '/api/v1/article/1',
      { role: 'editor', bindColumnIds: [1] },
    );
    const handler = makeCallHandler(response);

    interceptor.intercept(context, handler).subscribe((result: any) => {
      try {
        expect(result.data.tags.length).toBe(4);
        expect(result.data.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(
          true,
        );
        expect(result.data.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(
          true,
        );
        expect(
          result.data.tags.some((t: any) => isAdminTag(t.tagCode)),
        ).toBe(false);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('场景四：系统管理员审核稿件', (done) => {
    const response = makeApiResponse(makeArticleWithTags());
    const context = makeExecutionContext(
      '/api/v1/article/1',
      { role: 'system_admin', bindColumnIds: [] },
    );
    const handler = makeCallHandler(response);

    interceptor.intercept(context, handler).subscribe((result: any) => {
      try {
        expect(result.data.tags.length).toBe(6);
        expect(result.data.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(
          true,
        );
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('场景五：公开搜索结果仅显示公开标签', (done) => {
    const response = makePaginatedResponse([makeArticleWithTags()]);
    const context = makeExecutionContext(
      '/api/v1/public/search?q=教学',
      undefined,
    );
    const handler = makeCallHandler(response);

    interceptor.intercept(context, handler).subscribe((result: any) => {
      try {
        const article = result.data.list[0];
        expect(article.tags.length).toBe(2);
        expect(article.tags.every((t: any) => isPublicTag(t.tagCode))).toBe(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('场景六：搜索接口对编辑返回公开+栏目标签', (done) => {
    const response = makePaginatedResponse([makeArticleWithTags()]);
    const context = makeExecutionContext(
      '/api/v1/public/search?q=教学',
      { role: 'editor', bindColumnIds: [1] },
    );
    const handler = makeCallHandler(response);

    interceptor.intercept(context, handler).subscribe((result: any) => {
      try {
        const article = result.data.list[0];
        expect(article.tags.length).toBe(4);
        expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true);
        expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true);
        expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});
