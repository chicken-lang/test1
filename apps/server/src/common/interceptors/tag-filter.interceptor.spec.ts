import { TagFilterInterceptor } from './tag-filter.interceptor.js';
import {
  TagVisibility,
  getTagType,
  isPublicTag,
  isColumnTag,
  isAdminTag,
  API_PATH_PATTERNS,
  UserRole,
} from '../constants/tag.constants.js';

// ==================== 测试数据 ====================

const mockPublicTags = [
  { tagId: 101, tagName: '学术事务', tagCode: 'PUBLIC_ACADEMIC', type: 'public' },
  { tagId: 102, tagName: '考试管理', tagCode: 'PUBLIC_EXAM', type: 'public' },
];

const mockColumnTags = [
  { tagId: 201, tagName: '需复审', tagCode: 'COLUMN_NEED_REVIEW', type: 'column' },
  { tagId: 202, tagName: '紧急稿件', tagCode: 'COLUMN_URGENT', type: 'column' },
];

const mockAdminTags = [
  { tagId: 301, tagName: '涉密标记', tagCode: 'ADMIN_CLASSIFIED', type: 'admin' },
  { tagId: 302, tagName: '最高优先级', tagCode: 'ADMIN_TOP_PRIORITY', type: 'admin' },
];

const mockAllTags = [...mockPublicTags, ...mockColumnTags, ...mockAdminTags];

const createMockArticle = (tags: any[] = mockAllTags) => ({
  id: 1,
  title: '2026年秋季学期教学安排通知',
  summary: '测试摘要',
  tags,
  businessTags: tags.map(t => t.tagCode),
  roleTags: tags.map(t => t.tagCode),
  timeTags: tags.map(t => t.tagCode),
  publishedAt: '2026-07-27',
  viewCount: 100,
});

const createMockApiResponse = (data: any) => ({
  code: 0,
  message: 'ok',
  data,
  timestamp: Date.now(),
});

const createMockPaginatedResponse = (items: any[]) => ({
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

// ==================== 常量测试 ====================

describe('Tag Constants', () => {
  describe('TagVisibility', () => {
    it('should have correct values', () => {
      expect(TagVisibility.NONE).toBe('NONE');
      expect(TagVisibility.PUBLIC_ONLY).toBe('PUBLIC_ONLY');
      expect(TagVisibility.PUBLIC_PLUS_COLUMN).toBe('PUBLIC_PLUS_COLUMN');
      expect(TagVisibility.PUBLIC_PLUS_ALL_COLUMN).toBe('PUBLIC_PLUS_ALL_COLUMN');
      expect(TagVisibility.ALL).toBe('ALL');
    });
  });

  describe('getTagType', () => {
    it('should identify public tags', () => {
      expect(getTagType('PUBLIC_ACADEMIC')).toBe('public');
      expect(getTagType('PUBLIC_EXAM')).toBe('public');
    });

    it('should identify column tags', () => {
      expect(getTagType('COLUMN_NEED_REVIEW')).toBe('column');
      expect(getTagType('COLUMN_URGENT')).toBe('column');
    });

    it('should identify admin tags', () => {
      expect(getTagType('ADMIN_CLASSIFIED')).toBe('admin');
      expect(getTagType('ADMIN_TOP_PRIORITY')).toBe('admin');
    });

    it('should return null for unknown tag codes', () => {
      expect(getTagType('')).toBeNull();
      expect(getTagType('UNKNOWN_CODE')).toBeNull();
      expect(getTagType(null as any)).toBeNull();
    });
  });

  describe('isPublicTag / isColumnTag / isAdminTag', () => {
    it('should correctly identify tag types', () => {
      expect(isPublicTag('PUBLIC_ACADEMIC')).toBe(true);
      expect(isPublicTag('COLUMN_NEED_REVIEW')).toBe(false);
      expect(isPublicTag('ADMIN_CLASSIFIED')).toBe(false);

      expect(isColumnTag('COLUMN_NEED_REVIEW')).toBe(true);
      expect(isColumnTag('PUBLIC_ACADEMIC')).toBe(false);
      expect(isColumnTag('ADMIN_CLASSIFIED')).toBe(false);

      expect(isAdminTag('ADMIN_CLASSIFIED')).toBe(true);
      expect(isAdminTag('PUBLIC_ACADEMIC')).toBe(false);
      expect(isAdminTag('COLUMN_NEED_REVIEW')).toBe(false);
    });
  });

  describe('UserRole', () => {
    it('should have all defined roles', () => {
      expect(UserRole.EDITOR).toBe('editor');
      expect(UserRole.REVIEWER).toBe('reviewer');
      expect(UserRole.COLUMN_ADMIN).toBe('column_admin');
      expect(UserRole.SYSTEM_ADMIN).toBe('system_admin');
    });
  });

  describe('API_PATH_PATTERNS', () => {
    it('should match article detail URLs', () => {
      const detailPattern = API_PATH_PATTERNS.ARTICLE_DETAIL[0];
      expect(detailPattern.test('/api/v1/public/articles/1057')).toBe(true);
      expect(detailPattern.test('/api/v1/public/articles/academic-notice')).toBe(true);
    });

    it('should match admin article edit URLs', () => {
      const editPattern = API_PATH_PATTERNS.ADMIN_ARTICLE_EDIT[0];
      expect(editPattern.test('/api/v1/article/1')).toBe(true);
      expect(editPattern.test('/api/v1/article/123')).toBe(true);
    });

    it('should match column list URLs', () => {
      const pattern = API_PATH_PATTERNS.COLUMN_LIST[0];
      expect(pattern.test('/api/v1/public/columns/academic/articles')).toBe(true);
      expect(pattern.test('/api/v1/public/columns/exam/articles')).toBe(true);
    });

    it('should match search URLs', () => {
      const pattern = API_PATH_PATTERNS.SEARCH[0];
      expect(pattern.test('/api/v1/public/search')).toBe(true);
      expect(pattern.test('/api/v1/public/search?q=test')).toBe(true);
    });

    it('should match admin article list URLs', () => {
      const pattern = API_PATH_PATTERNS.ADMIN_ARTICLE_LIST[0];
      expect(pattern.test('/api/v1/article/published')).toBe(true);
      expect(pattern.test('/api/v1/article/draft')).toBe(true);
      expect(pattern.test('/api/v1/article/pending')).toBe(true);
      expect(pattern.test('/api/v1/article/final-pending')).toBe(true);
      expect(pattern.test('/api/v1/article/rejected')).toBe(true);
    });
  });
});

// ==================== 拦截器测试 ====================

describe('TagFilterInterceptor', () => {
  let interceptor: TagFilterInterceptor;

  beforeEach(() => {
    interceptor = new TagFilterInterceptor();
  });

  // ========== 文章详情接口测试 (NONE - 不返回标签) ==========

  describe('文章详情接口 - 不返回任何标签', () => {
    const testCases = [
      { role: undefined, desc: '匿名访客' },
      { role: 'student', desc: 'SSO师生' },
      { role: 'editor', desc: '编辑(R1)' },
      { role: 'reviewer', desc: '审核(R2)' },
      { role: 'column_admin', desc: '栏目管理员(R3)' },
      { role: 'system_admin', desc: '系统管理员(R4)' },
    ];

    testCases.forEach(({ role, desc }) => {
      it(`${desc} 访问文章详情接口应返回空标签`, () => {
        const response = createMockApiResponse(createMockArticle());
        const request = {
          originalUrl: '/api/v1/public/articles/1057',
          user: role ? { role, bindColumnIds: [1] } : undefined,
        };

        const result = interceptor.intercept(
          {
            switchToHttp: () => ({ getRequest: () => request }),
          } as any,
          { handle: () => ({ pipe: () => ({ subscribe: (cb: any) => cb(response) }) }) } as any,
        );

        // 由于 intercept 返回 Observable, 需要直接测试内部方法
        const filtered = (interceptor as any).removeAllTags(response);
        expect(filtered.data.tags).toEqual([]);
        expect(filtered.data.businessTags).toEqual([]);
        expect(filtered.data.roleTags).toEqual([]);
        expect(filtered.data.timeTags).toEqual([]);
      });
    });
  });

  // ========== 公开列表接口测试 (PUBLIC_ONLY - 仅公开标签) ==========

  describe('公开列表接口 - 仅返回公开标签', () => {
    it('匿名访客访问公开列表仅看到公开标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);
      const user = undefined;

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_ONLY,
        user,
      );

      const article = filtered.data.list[0];
      // mockPublicTags 有 2 个标签
      expect(article.tags.length).toBe(2);
      expect(article.tags.every((t: any) => isPublicTag(t.tagCode))).toBe(true);
      expect(article.businessTags.length).toBe(2);
      expect(article.businessTags.every((code: string) => isPublicTag(code))).toBe(true);
    });

    it('SSO师生访问公开列表仅看到公开标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);
      const user = { role: 'student' };

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_ONLY,
        user,
      );

      const article = filtered.data.list[0];
      expect(article.tags.length).toBe(2);
      expect(article.tags.every((t: any) => t.tagCode.startsWith('PUBLIC_'))).toBe(true);
    });
  });

  // ========== 角色权限测试 ==========

  describe('角色权限 - 公开列表接口', () => {
    it('编辑(editor) 可看到公开标签 + 本栏目私有标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);
      const user = { role: 'editor', bindColumnIds: [1] };

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_PLUS_COLUMN,
        user,
      );

      const article = filtered.data.list[0];
      // 2 public + 2 column = 4
      expect(article.tags.length).toBe(4);
      expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true);
      expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true);
      // 不应该有 admin 标签
      expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);
    });

    it('审核(reviewer) 可看到公开标签 + 本栏目私有标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);
      const user = { role: 'reviewer', bindColumnIds: [1] };

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_PLUS_COLUMN,
        user,
      );

      const article = filtered.data.list[0];
      expect(article.tags.length).toBe(4);
      expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true);
      expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true);
    });

    it('栏目管理员(column_admin) 可看到公开标签 + 所有栏目私有标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);
      const user = { role: 'column_admin', bindColumnIds: [1, 2, 3] };

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_PLUS_ALL_COLUMN,
        user,
      );

      const article = filtered.data.list[0];
      // 2 public + 2 column = 4
      expect(article.tags.length).toBe(4);
      expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true);
      expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true);
      expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);
    });

    it('系统管理员(system_admin) 可看到全量标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);
      const user = { role: 'system_admin', bindColumnIds: [] };

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.ALL,
        user,
      );

      const article = filtered.data.list[0];
      // 2 public + 2 column + 2 admin = 6
      expect(article.tags.length).toBe(6);
      expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true);
      expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true);
      expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(true);
    });
  });

  // ========== 后台管理接口测试 ==========

  describe('后台管理接口 - 根据角色返回标签', () => {
    it('后台列表接口对编辑返回 PUBLIC_PLUS_COLUMN', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);
      const user = { role: 'editor', bindColumnIds: [1] };

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_PLUS_COLUMN,
        user,
      );

      const article = filtered.data.list[0];
      expect(article.tags.length).toBeGreaterThanOrEqual(2);
      expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);
    });

    it('后台列表接口对系统管理员返回全量标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);
      const user = { role: 'system_admin', bindColumnIds: [] };

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.ALL,
        user,
      );

      const article = filtered.data.list[0];
      // 2 public + 2 column + 2 admin = 6
      expect(article.tags.length).toBe(6);
      expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(true);
    });
  });

  // ========== 安全基线测试 ==========

  describe('安全基线', () => {
    it('管控标签在前台接口中不可见', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);
      const user = undefined;

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_ONLY,
        user,
      );

      const article = filtered.data.list[0];
      expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);
    });

    it('系统管理员是唯一能看到管控标签的角色', () => {
      const response = createMockPaginatedResponse([createMockArticle()]);

      // 编辑看不到
      const editorResult = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_PLUS_COLUMN,
        { role: 'editor' },
      );
      expect(editorResult.data.list[0].tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);

      // 审核看不到
      const reviewerResult = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_PLUS_COLUMN,
        { role: 'reviewer' },
      );
      expect(reviewerResult.data.list[0].tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);

      // 栏目管理员看不到
      const columnAdminResult = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.PUBLIC_PLUS_ALL_COLUMN,
        { role: 'column_admin' },
      );
      expect(columnAdminResult.data.list[0].tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false);

      // 系统管理员能看到
      const systemAdminResult = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.ALL,
        { role: 'system_admin' },
      );
      expect(systemAdminResult.data.list[0].tags.some((t: any) => isAdminTag(t.tagCode))).toBe(true);
    });

    it('文章详情接口对所有角色不返回标签', () => {
      const testRoles = ['editor', 'reviewer', 'column_admin', 'system_admin', undefined];

      testRoles.forEach((role) => {
        const response = createMockApiResponse(createMockArticle());

        const filtered = (interceptor as any).removeAllTags(response);
        expect(filtered.data.tags).toEqual([]);
      });
    });
  });

  // ========== 边界场景测试 ==========

  describe('边界场景', () => {
    it('处理空标签数组', () => {
      const response = createMockPaginatedResponse([createMockArticle([])]);

      const filtered = (interceptor as any).filterTagsByVisibility(
        response,
        TagVisibility.ALL,
        undefined,
      );

      expect(filtered.data.list[0].tags).toEqual([]);
    });

    it('处理 undefined/null 响应', () => {
      const result1 = (interceptor as any).removeAllTags(undefined);
      expect(result1).toBeUndefined();

      const result2 = (interceptor as any).removeAllTags(null);
      expect(result2).toBeNull();
    });

    it('处理非对象响应', () => {
      const result = (interceptor as any).removeAllTags('string response');
      expect(result).toBe('string response');
    });

    it('处理空响应对象', () => {
      const result = (interceptor as any).removeAllTags({});
      expect(result).toEqual({});
    });

    it('处理无 data 字段的响应', () => {
      const response = { code: 0, message: 'ok' };
      const result = (interceptor as any).removeAllTags(response);
      expect(result).toEqual(response);
    });

    it('处理纯标签字符串数组', () => {
      const tags = ['PUBLIC_ACADEMIC', 'COLUMN_URGENT', 'ADMIN_CLASSIFIED'];

      const result = (interceptor as any).filterTagArray(tags, TagVisibility.PUBLIC_ONLY);
      expect(result.length).toBe(1);
      expect(result[0]).toBe('PUBLIC_ACADEMIC');
    });
  });

  // ========== 多接口类型测试 ==========

  describe('接口类型识别', () => {
    it('正确识别文章详情接口', () => {
      const cases = [
        '/api/v1/public/articles/1057',
        '/api/v1/public/articles/academic-notice',
      ];

      cases.forEach((url) => {
        const request = { originalUrl: url, user: { role: 'system_admin' } };
        // 测试内部方法的行为
        const visibility = (interceptor as any).determineVisibility(url, request.user);
        expect(visibility).toBe(TagVisibility.NONE);
      });
    });

    it('正确识别后台编辑接口', () => {
      const url = '/api/v1/article/1';
      const request = { originalUrl: url, user: { role: 'editor', bindColumnIds: [1] } };
      const visibility = (interceptor as any).determineVisibility(url, request.user);
      expect(visibility).toBe(TagVisibility.PUBLIC_PLUS_COLUMN);
    });

    it('正确识别公开列表接口', () => {
      const url = '/api/v1/public/columns/academic/articles';
      const request = { originalUrl: url, user: undefined };
      const visibility = (interceptor as any).determineVisibility(url, request.user);
      expect(visibility).toBe(TagVisibility.PUBLIC_ONLY);
    });

    it('正确识别搜索接口', () => {
      const url = '/api/v1/public/search';
      const request = { originalUrl: url, user: undefined };
      const visibility = (interceptor as any).determineVisibility(url, request.user);
      expect(visibility).toBe(TagVisibility.PUBLIC_ONLY);
    });

    it('正确识别后台列表接口', () => {
      const url = '/api/v1/article/published';
      const request = { originalUrl: url, user: { role: 'editor', bindColumnIds: [1] } };
      const visibility = (interceptor as any).determineVisibility(url, request.user);
      expect(visibility).toBe(TagVisibility.PUBLIC_PLUS_COLUMN);
    });

    it('后台列表接口对匿名用户返回 NONE', () => {
      const url = '/api/v1/article/published';
      const request = { originalUrl: url, user: undefined };
      const visibility = (interceptor as any).determineVisibility(url, request.user);
      expect(visibility).toBe(TagVisibility.NONE);
    });
  });
});
