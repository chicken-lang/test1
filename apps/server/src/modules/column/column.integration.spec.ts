import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ColumnService } from './column.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import {
  ColumnStatus,
  ResponsibleBusiness,
  ColumnErrorCode,
} from './column.constants.js';

// ==================== 测试辅助 ====================

const baseColumn = {
  id: 1,
  parentId: null as number | null,
  columnName: '测试栏目',
  columnSlug: 'test-column',
  responsibleBusiness: null as string | null,
  sortOrder: 0,
  status: ColumnStatus.ACTIVE,
  description: null as string | null,
  version: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const baseArticle = {
  id: 1,
  columnId: 1,
  title: '测试稿件',
  status: 'draft',
  secretLevel: 'PUBLIC',
  content: null as string | null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

function createMockArticle(overrides: Partial<typeof baseArticle> = {}) {
  return { ...baseArticle, ...overrides };
}

// ==================== Mock Prisma ====================

let _idCounter = 1000;

function flattenUpdateData(data: any, currentRecord?: any): any {
  const result: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === 'object' && 'increment' in val) {
      const incValue = (val as any).increment;
      const currentVal = currentRecord?.[key] ?? 0;
      result[key] = currentVal + incValue;
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

function createMockPrismaService() {
  let columnStore: Record<number, any> = {};
  let articleStore: Record<number, any> = {};

  const column = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_idCounter;
      const record = { ...baseColumn, ...data, id };
      columnStore[id] = record;
      return Promise.resolve(record);
    }),

    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where?.id !== undefined) {
        return Promise.resolve(columnStore[where.id] ?? null);
      }
      if (where?.columnSlug !== undefined) {
        const found = Object.values(columnStore).find(
          (c) => c.columnSlug === where.columnSlug,
        );
        return Promise.resolve(found ?? null);
      }
      return Promise.resolve(null);
    }),

    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const record = columnStore[where.id];
      if (!record) return Promise.reject(new Error('Not found'));
      const merged = { ...record, ...flattenUpdateData(data, record) };
      columnStore[where.id] = merged;
      return Promise.resolve(merged);
    }),

    findMany: jest.fn().mockImplementation(({ where, orderBy, select }: any) => {
      let results = Object.values(columnStore);

      if (where?.status) results = results.filter((r) => r.status === where.status);
      if (where?.parentId !== undefined) results = results.filter((r) => r.parentId === where.parentId);
      if (where?.columnSlug?.in)
        results = results.filter((r) => where.columnSlug.in.includes(r.columnSlug));
      if (where?.id?.in) results = results.filter((r) => where.id.in.includes(r.id));

      if (orderBy) {
        for (const clause of [...orderBy].reverse()) {
          const key = Object.keys(clause)[0];
          const dir = clause[key];
          results.sort((a, b) => {
            if (a[key] === b[key]) return 0;
            return dir === 'asc' ? (a[key] > b[key] ? 1 : -1) : a[key] > b[key] ? -1 : 1;
          });
        }
      }

      if (select) {
        results = results.map((r) => {
          const picked: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) picked[key] = r[key];
          }
          return picked;
        });
      }

      return Promise.resolve(results);
    }),

    count: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(columnStore);
      if (where?.parentId !== undefined) results = results.filter((r) => r.parentId === where.parentId);
      if (where?.status) results = results.filter((r) => r.status === where.status);
      return Promise.resolve(results.length);
    }),
  };

  const article = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_idCounter;
      const record = { ...baseArticle, ...data, id };
      articleStore[id] = record;
      return Promise.resolve(record);
    }),

    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(articleStore[where.id] ?? null);
    }),

    count: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(articleStore);
      if (where?.columnId !== undefined) results = results.filter((r) => r.columnId === where.columnId);
      if (where?.status) {
        if (typeof where.status === 'string') {
          results = results.filter((r) => r.status === where.status);
        } else if (where.status?.in) {
          results = results.filter((r) => where.status.in.includes(r.status));
        } else if (where.status?.not !== undefined) {
          results = results.filter((r) => r.status !== where.status.not);
        }
      }
      return Promise.resolve(results.length);
    }),

    findMany: jest.fn().mockImplementation(() => {
      return Promise.resolve(Object.values(articleStore));
    }),

    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const record = articleStore[where.id];
      if (!record) return Promise.reject(new Error('Not found'));
      const merged = { ...record, ...flattenUpdateData(data, record) };
      articleStore[where.id] = merged;
      return Promise.resolve(merged);
    }),
  };

  const auditLog = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      return Promise.resolve({ id: Date.now(), ...data });
    }),
  };

  return {
    column,
    article,
    auditLog,
    _resetStore: () => {
      columnStore = {};
      articleStore = {};
    },
    _getColumnStore: () => columnStore,
    _getArticleStore: () => articleStore,
  };
}

function createMockAuditLogService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  };
}

// ==================== 测试主体 ====================

describe('ColumnService - 跨模块引用完整性', () => {
  let service: ColumnService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let auditLog: ReturnType<typeof createMockAuditLogService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    _idCounter = 1000;
    prisma = createMockPrismaService();
    auditLog = createMockAuditLogService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColumnService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile();

    service = module.get(ColumnService);
  });

  // ==================== disable() - 稿件关联校验 ====================

  describe('disable() - 稿件关联校验', () => {
    let activeCol: any;

    beforeEach(async () => {
      activeCol = await prisma.column.create({
        data: {
          columnName: '稿件关联栏目',
          columnSlug: 'article-ref-col',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
    });

    it('栏目下有已发布稿件时应拒绝停用', async () => {
      await prisma.article.create({
        data: { columnId: activeCol.id, status: 'published', title: '已发布稿件' },
      });

      await expect(
        service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.DISABLE_HAS_PUBLISHED);
        expect(e?.response?.details?.publishedArticleCount).toBe(1);
      }
    });

    it('栏目下有审批中稿件(pending_review)时应拒绝停用', async () => {
      await prisma.article.create({
        data: { columnId: activeCol.id, status: 'pending_review', title: '审批中稿件' },
      });

      await expect(
        service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.DISABLE_HAS_PENDING);
        expect(e?.response?.details?.pendingArticleCount).toBe(1);
      }
    });

    it('栏目下有终审中稿件(final_pending)时应拒绝停用', async () => {
      await prisma.article.create({
        data: { columnId: activeCol.id, status: 'final_pending', title: '终审中稿件' },
      });

      await expect(
        service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.DISABLE_HAS_PENDING);
        expect(e?.response?.details?.pendingArticleCount).toBe(1);
      }
    });

    it('栏目下无稿件时应允许停用', async () => {
      const result: any = await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');

      expect(result.status).toBe(ColumnStatus.DISABLED);
      expect(result.version).toBe(1);
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'column_disable' }),
      );
    });

    it('停用后关联文章的 columnId 指向一个 DISABLED 栏目', async () => {
      await prisma.article.create({
        data: { columnId: activeCol.id, status: 'draft', title: '草稿稿件' },
      });

      const result: any = await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');
      expect(result.status).toBe(ColumnStatus.DISABLED);

      // 验证文章仍然存在且 columnId 指向的栏目已停用
      const articleStore = prisma._getArticleStore();
      const articles = Object.values(articleStore).filter(
        (a: any) => a.columnId === activeCol.id,
      );
      expect(articles.length).toBe(1);

      const columnStore = prisma._getColumnStore();
      const col = columnStore[activeCol.id];
      expect(col.status).toBe(ColumnStatus.DISABLED);
    });
  });

  // ==================== findAllActive() - 文章查询可用栏目 ====================

  describe('findAllActive() - 文章查询可用栏目', () => {
    beforeEach(async () => {
      await prisma.column.create({
        data: {
          columnName: '活跃栏目C',
          columnSlug: 'active-col-c',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 3,
        },
      });
      await prisma.column.create({
        data: {
          columnName: '活跃栏目A',
          columnSlug: 'active-col-a',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 1,
        },
      });
      await prisma.column.create({
        data: {
          columnName: '活跃栏目B',
          columnSlug: 'active-col-b',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 2,
        },
      });
      await prisma.column.create({
        data: {
          columnName: '停用栏目',
          columnSlug: 'disabled-col',
          parentId: null,
          status: ColumnStatus.DISABLED,
          sortOrder: 0,
        },
      });
    });

    it('只返回 ACTIVE 状态的栏目', async () => {
      const result = await service.findAllActive();
      expect(result.length).toBe(3);
      for (const col of result) {
        expect(col.status).toBe(ColumnStatus.ACTIVE);
      }
    });

    it('按 sortOrder 升序排列', async () => {
      const result = await service.findAllActive();
      expect(result[0].sortOrder).toBe(1);
      expect(result[1].sortOrder).toBe(2);
      expect(result[2].sortOrder).toBe(3);
      expect(result[0].columnName).toBe('活跃栏目A');
      expect(result[1].columnName).toBe('活跃栏目B');
      expect(result[2].columnName).toBe('活跃栏目C');
    });

    it('DISABLED 栏目不出现在列表中', async () => {
      const result = await service.findAllActive();
      const slugs = result.map((c) => c.columnSlug);
      expect(slugs).not.toContain('disabled-col');
    });
  });

  // ==================== slugToId() / idToSlug() - 文章发布时的栏目映射 ====================

  describe('slugToId() / idToSlug() - 文章发布时的栏目映射', () => {
    let activeCol: any;

    beforeEach(async () => {
      activeCol = await prisma.column.create({
        data: {
          columnName: '发布映射栏目',
          columnSlug: 'publish-mapping',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });
    });

    it('文章发布时通过 slug 获取栏目 ID', async () => {
      const result = await service.slugToId('publish-mapping');
      expect(result.columnId).toBe(activeCol.id);
      expect(result.columnSlug).toBe('publish-mapping');
      expect(result.columnName).toBe('发布映射栏目');
    });

    it('已停用栏目 slugToId 应抛 NotFoundException', async () => {
      await prisma.column.update({
        where: { id: activeCol.id },
        data: { status: ColumnStatus.DISABLED },
      });

      await expect(
        service.slugToId('publish-mapping'),
      ).rejects.toThrow(NotFoundException);
    });

    it('不存在的 slug 应抛 NotFoundException', async () => {
      await expect(
        service.slugToId('nonexistent-slug'),
      ).rejects.toThrow(NotFoundException);

      try {
        await service.slugToId('nonexistent-slug');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SLUG_NOT_FOUND);
      }
    });
  });

  // ==================== batchMapping() - 批量文章栏目映射 ====================

  describe('batchMapping() - 批量文章栏目映射', () => {
    let col1: any;
    let col2: any;
    let col3: any;

    beforeEach(async () => {
      col1 = await prisma.column.create({
        data: {
          columnName: '批量栏目1',
          columnSlug: 'batch-slug-a',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });
      col2 = await prisma.column.create({
        data: {
          columnName: '批量栏目2',
          columnSlug: 'batch-slug-b',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });
      col3 = await prisma.column.create({
        data: {
          columnName: '批量栏目3',
          columnSlug: 'batch-slug-c',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });
    });

    it('批量 SLUG_TO_ID 映射多篇文章的栏目', async () => {
      const result = await service.batchMapping({
        type: 'SLUG_TO_ID',
        values: ['batch-slug-a', 'batch-slug-b', 'batch-slug-c'],
      });

      expect(result['batch-slug-a']).toBe(col1.id);
      expect(result['batch-slug-b']).toBe(col2.id);
      expect(result['batch-slug-c']).toBe(col3.id);
    });

    it('未找到的 slug 返回 id=0', async () => {
      const result = await service.batchMapping({
        type: 'SLUG_TO_ID',
        values: ['batch-slug-a', 'nonexistent-slug'],
      });

      expect(result['batch-slug-a']).toBe(col1.id);
      expect(result['nonexistent-slug']).toBe(0);
    });

    it('批量 ID_TO_SLUG 反向映射', async () => {
      const result = await service.batchMapping({
        type: 'ID_TO_SLUG',
        values: [col1.id, col2.id, col3.id, 99999],
      });

      expect(result[String(col1.id)]).toBe('batch-slug-a');
      expect(result[String(col2.id)]).toBe('batch-slug-b');
      expect(result[String(col3.id)]).toBe('batch-slug-c');
      expect(result['99999']).toBe('');
    });
  });

  // ==================== create() / update() - 栏目层级约束 ====================

  describe('create() / update() - 栏目层级约束', () => {
    it('二级栏目必须设置 responsibleBusiness', async () => {
      const parent = await prisma.column.create({
        data: {
          columnName: '父栏目',
          columnSlug: 'parent-for-level',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      const dto = {
        columnName: '子栏目',
        columnSlug: 'child-no-business',
        parentId: parent.id,
      };

      await expect(
        service.create(999, 'system_admin', dto, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.create(999, 'system_admin', dto, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SECOND_LEVEL_REQUIRES_BUSINESS);
        expect(e?.response?.details?.field).toBe('responsibleBusiness');
        expect(e?.response?.details?.rule).toBe('REQUIRED_FOR_SECOND_LEVEL');
      }
    });

    it('slug 不能与保留字冲突', async () => {
      const reservedSlugs = ['admin', 'system', 'login', 'api', 'public'];

      for (const slug of reservedSlugs) {
        const dto = {
          columnName: `保留字栏目-${slug}`,
          columnSlug: slug,
        };

        await expect(
          service.create(999, 'system_admin', dto, '127.0.0.1'),
        ).rejects.toThrow(BadRequestException);

        try {
          await service.create(999, 'system_admin', dto, '127.0.0.1');
        } catch (e: any) {
          expect(e?.response?.code).toBe(ColumnErrorCode.SLUG_RESERVED);
        }
      }
    });

    it('更新时乐观锁版本校验', async () => {
      const col = await prisma.column.create({
        data: {
          columnName: '乐观锁栏目',
          columnSlug: 'optimistic-lock-col',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          version: 0,
        },
      });

      // 模拟其他操作已修改版本
      await prisma.column.update({
        where: { id: col.id },
        data: { version: 5 },
      });

      // 使用旧版本号更新应失败
      await expect(
        service.update(col.id, 999, 'system_admin', {
          columnName: '新名称',
          version: 0,
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.update(col.id, 999, 'system_admin', {
          columnName: '新名称',
          version: 0,
        }, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.OPTIMISTIC_LOCK);
        expect(e?.response?.message).toContain('请刷新后重试');
      }

      // 使用正确版本号更新应成功
      const result: any = await service.update(col.id, 999, 'system_admin', {
        columnName: '新名称',
        version: 5,
      }, '127.0.0.1');

      expect(result.columnName).toBe('新名称');
      expect(result.version).toBe(6);
    });
  });
});
