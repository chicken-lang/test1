import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ColumnService } from './column.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import {
  ColumnStatus,
  SLUG_REGEX,
  RESERVED_SLUGS,
  RESPONSIBLE_BUSINESS_VALUES,
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

// ==================== Mock Prisma ====================

let _idCounter = 1000;

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

    findFirst: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(columnStore) as any[];
      if (where?.id !== undefined) {
        results = results.filter((r) => r.id === where.id);
      }
      if (where?.columnSlug !== undefined) {
        results = results.filter((r) => r.columnSlug === where.columnSlug);
      }
      if (where?.status?.not !== undefined) {
        results = results.filter((r) => r.status !== where.status.not);
      }
      if (where?.status !== undefined && typeof where.status === 'string') {
        results = results.filter((r) => r.status === where.status);
      }
      return Promise.resolve(results[0] ?? null);
    }),

    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const record = columnStore[where.id];
      if (!record) return Promise.reject(new Error('Not found'));
      const merged = { ...record, ...flattenUpdateData(data, record) };
      columnStore[where.id] = merged;
      return Promise.resolve(merged);
    }),

    findMany: jest.fn().mockImplementation(({ where, orderBy, skip, take }: any) => {
      let results = Object.values(columnStore);

      if (where?.status) {
        if (typeof where.status === 'string') {
          results = results.filter((r) => r.status === where.status);
        } else if (where.status?.not !== undefined) {
          results = results.filter((r) => r.status !== where.status.not);
        } else if (where.status?.in) {
          results = results.filter((r) => where.status.in.includes(r.status));
        }
      }
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

      return Promise.resolve(results);
    }),

    count: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(columnStore);
      if (where?.parentId !== undefined) results = results.filter((r) => r.parentId === where.parentId);
      if (where?.status) {
        if (typeof where.status === 'string') {
          results = results.filter((r) => r.status === where.status);
        } else if (where.status?.not !== undefined) {
          results = results.filter((r) => r.status !== where.status.not);
        } else if (where.status?.in) {
          results = results.filter((r) => where.status.in.includes(r.status));
        }
      }
      return Promise.resolve(results.length);
    }),
  };

  const article = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_idCounter;
      const record = { id, ...data };
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

  let _adminData: any = null;
  let _adminList: any[] = [];

  const admin = {
    findMany: jest.fn().mockImplementation(() => Promise.resolve(_adminList)),
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (_adminData && _adminData.id === where.id) return Promise.resolve(_adminData);
      return Promise.resolve(null);
    }),
  };

  return {
    column,
    article,
    auditLog,
    admin,
    _setAdminData: (data: any) => {
      _adminData = data;
    },
    _setAdminList: (list: any[]) => {
      _adminList = list;
    },
    _clearAdmin: () => {
      _adminData = null;
      _adminList = [];
    },
    _resetStore: () => {
      columnStore = {};
      articleStore = {};
    },
    _getColumnStore: () => columnStore,
    _getArticleStore: () => articleStore,
  };
}

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

function createMockAuditLogService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  };
}

// ==================== 测试主体 ====================

describe('ColumnService', () => {
  let service: ColumnService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let auditLog: ReturnType<typeof createMockAuditLogService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    _idCounter = 1000;
    prisma = createMockPrismaService();
    prisma._clearAdmin();
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

  // ==================== getTree ====================

  describe('getTree', () => {
    it('空库应返回空数组', async () => {
      const result = await service.getTree();
      expect(result).toEqual([]);
    });

    it('应返回仅根栏目列表', async () => {
      await prisma.column.create({
        data: {
          columnName: '根栏目A',
          columnSlug: 'root-a',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
      await prisma.column.create({
        data: {
          columnName: '根栏目B',
          columnSlug: 'root-b',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 1,
        },
      });

      const result = await service.getTree();
      expect(result.length).toBe(2);
      expect(result[0].columnName).toBe('根栏目A');
      expect(result[0].children).toEqual([]);
      expect(result[1].columnName).toBe('根栏目B');
    });

    it('应正确构建父子关系', async () => {
      const root = await prisma.column.create({
        data: {
          columnName: '根栏目',
          columnSlug: 'root',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
      const child = await prisma.column.create({
        data: {
          columnName: '子栏目',
          columnSlug: 'child',
          parentId: root.id,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
          responsibleBusiness: ResponsibleBusiness.NOTICE,
        },
      });

      const result = await service.getTree();
      expect(result.length).toBe(1);
      expect(result[0].columnName).toBe('根栏目');
      expect(result[0].children.length).toBe(1);
      expect(result[0].children[0].columnName).toBe('子栏目');
      expect(result[0].children[0].parentId).toBe(root.id);
    });

    it('管理端 getTree 应返回所有非删除栏目（含停用，供后台管理）', async () => {
      await prisma.column.create({
        data: {
          columnName: '活跃栏目',
          columnSlug: 'active-col',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
      await prisma.column.create({
        data: {
          columnName: '停用栏目',
          columnSlug: 'disabled-col',
          parentId: null,
          status: ColumnStatus.DISABLED,
          sortOrder: 1,
        },
      });

      const result = await service.getTree();
      // getTree 为管理端接口（AuthGuard 保护），需展示所有非删除栏目（含 DISABLED）供管理员操作
      // 前台过滤停用栏目由 findAllActive 负责
      expect(result.length).toBe(2);
      expect(result[0].columnSlug).toBe('active-col');
      expect(result[1].columnSlug).toBe('disabled-col');
    });

    it('子栏目父节点不存在时应作为根节点', async () => {
      await prisma.column.create({
        data: {
          columnName: '子栏目',
          columnSlug: 'orphan-child',
          parentId: 99999,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
          responsibleBusiness: ResponsibleBusiness.NOTICE,
        },
      });

      const result = await service.getTree();
      expect(result.length).toBe(1);
      expect(result[0].columnName).toBe('子栏目');
    });
  });

  // ==================== create ====================

  describe('create', () => {
    const validDto = {
      columnName: '新栏目',
      columnSlug: 'new-column',
      sortOrder: 1,
      description: '描述',
    };

    it('系统管理员应能成功创建根栏目', async () => {
      const result: any = await service.create(999, 'system_admin', validDto, '127.0.0.1');

      expect(result.columnId).toBeDefined();
      expect(result.columnName).toBe('新栏目');
      expect(result.columnSlug).toBe('new-column');
      expect(result.status).toBe(ColumnStatus.ACTIVE);
      expect(result.parentId).toBeNull();
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'column_create' }),
      );
    });

    it('系统管理员应能成功创建子栏目（含 responsibleBusiness）', async () => {
      const parent = await prisma.column.create({
        data: {
          columnName: '父栏目',
          columnSlug: 'parent-col',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });

      const childDto = {
        columnName: '子栏目',
        columnSlug: 'child-col',
        parentId: parent.id,
        responsibleBusiness: ResponsibleBusiness.NOTICE,
      };

      const result: any = await service.create(999, 'system_admin', childDto, '127.0.0.1');
      expect(result.parentId).toBe(parent.id);
      expect(result.responsibleBusiness).toBe(ResponsibleBusiness.NOTICE);
    });

    it('非 system_admin 应抛出 ForbiddenException', async () => {
      await expect(
        service.create(100, 'editor', validDto, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('slug 格式不合法应抛出 SLUG_INVALID_FORMAT', async () => {
      const dto = { ...validDto, columnSlug: 'Invalid Slug!' };
      await expect(
        service.create(999, 'system_admin', dto, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.create(999, 'system_admin', dto, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SLUG_INVALID_FORMAT);
      }
    });

    it('slug 为系统保留字应抛出 SLUG_RESERVED', async () => {
      const dto = { ...validDto, columnSlug: 'admin' };
      await expect(
        service.create(999, 'system_admin', dto, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.create(999, 'system_admin', dto, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SLUG_RESERVED);
      }
    });

    it('slug 重复应抛出 SLUG_DUPLICATE', async () => {
      await prisma.column.create({
        data: {
          columnName: '已有栏目',
          columnSlug: 'existing-slug',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      const dto = { ...validDto, columnSlug: 'existing-slug' };
      await expect(
        service.create(999, 'system_admin', dto, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.create(999, 'system_admin', dto, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SLUG_DUPLICATE);
      }
    });

    it('父栏目不存在应抛出 PARENT_NOT_FOUND', async () => {
      const dto = { ...validDto, parentId: 99999 };
      await expect(
        service.create(999, 'system_admin', dto, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.create(999, 'system_admin', dto, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.PARENT_NOT_FOUND);
      }
    });

    it('父栏目已停用应抛出 PARENT_DISABLED', async () => {
      const disabledParent = await prisma.column.create({
        data: {
          columnName: '已停用父栏目',
          columnSlug: 'disabled-parent',
          parentId: null,
          status: ColumnStatus.DISABLED,
        },
      });

      const dto = { ...validDto, parentId: disabledParent.id };
      await expect(
        service.create(999, 'system_admin', dto, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.create(999, 'system_admin', dto, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.PARENT_DISABLED);
      }
    });

    it('二级栏目缺少 responsibleBusiness 应抛出 SECOND_LEVEL_REQUIRES_BUSINESS', async () => {
      const parent = await prisma.column.create({
        data: {
          columnName: '父栏目',
          columnSlug: 'parent-for-child',
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
      }
    });

    it('responsibleBusiness 无效应抛出 BUSINESS_INVALID', async () => {
      const dto = { ...validDto, responsibleBusiness: 'invalid-business' };
      await expect(
        service.create(999, 'system_admin', dto, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.create(999, 'system_admin', dto, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.BUSINESS_INVALID);
      }
    });
  });

  // ==================== update ====================

  describe('update', () => {
    let existingCol: any;

    beforeEach(async () => {
      existingCol = await prisma.column.create({
        data: {
          columnName: '原栏目名',
          columnSlug: 'original-slug',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
          description: '原描述',
          version: 0,
        },
      });
    });

    it('系统管理员应能成功更新栏目', async () => {
      const result: any = await service.update(existingCol.id, 999, 'system_admin', {
        columnName: '新栏目名',
        sortOrder: 10,
      }, '127.0.0.1');

      expect(result.columnName).toBe('新栏目名');
      expect(result.sortOrder).toBe(10);
      expect(result.version).toBe(1);
    });

    it('非 system_admin 应抛出 ForbiddenException', async () => {
      await expect(
        service.update(existingCol.id, 100, 'editor', { columnName: 'test' }, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('栏目不存在应抛出 NotFoundException', async () => {
      await expect(
        service.update(99999, 999, 'system_admin', { columnName: 'test' }, '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('乐观锁版本不匹配应抛出 OPTIMISTIC_LOCK', async () => {
      await prisma.column.update({
        where: { id: existingCol.id },
        data: { version: 5 },
      });

      await expect(
        service.update(existingCol.id, 999, 'system_admin', {
          columnName: 'test',
          version: 0,
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.update(existingCol.id, 999, 'system_admin', {
          columnName: 'test',
          version: 0,
        }, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.OPTIMISTIC_LOCK);
      }
    });

    it('乐观锁版本匹配应成功更新', async () => {
      const result: any = await service.update(existingCol.id, 999, 'system_admin', {
        columnName: '乐观锁测试',
        version: 0,
      }, '127.0.0.1');

      expect(result.columnName).toBe('乐观锁测试');
      expect(result.version).toBe(1);
    });

    it('slug 变更且重复应抛出 SLUG_DUPLICATE', async () => {
      await prisma.column.create({
        data: {
          columnName: '另一个栏目',
          columnSlug: 'taken-slug',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      await expect(
        service.update(existingCol.id, 999, 'system_admin', {
          columnSlug: 'taken-slug',
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.update(existingCol.id, 999, 'system_admin', {
          columnSlug: 'taken-slug',
        }, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SLUG_DUPLICATE);
      }
    });

    it('slug 变更格式不合法应抛出 SLUG_INVALID_FORMAT', async () => {
      await expect(
        service.update(existingCol.id, 999, 'system_admin', {
          columnSlug: 'Invalid Slug!',
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.update(existingCol.id, 999, 'system_admin', {
          columnSlug: 'Invalid Slug!',
        }, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SLUG_INVALID_FORMAT);
      }
    });

    it('responsibleBusiness 变更且值无效应抛出 BUSINESS_INVALID', async () => {
      await expect(
        service.update(existingCol.id, 999, 'system_admin', {
          responsibleBusiness: 'invalid-business',
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.update(existingCol.id, 999, 'system_admin', {
          responsibleBusiness: 'invalid-business',
        }, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.BUSINESS_INVALID);
      }
    });

    it('二级栏目清空 responsibleBusiness 应抛出 SECOND_LEVEL_REQUIRES_BUSINESS', async () => {
      const parent = await prisma.column.create({
        data: {
          columnName: '父栏目',
          columnSlug: 'parent-for-update',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });
      const child = await prisma.column.create({
        data: {
          columnName: '子栏目',
          columnSlug: 'child-for-update',
          parentId: parent.id,
          status: ColumnStatus.ACTIVE,
          responsibleBusiness: ResponsibleBusiness.NOTICE,
          version: 0,
        },
      });

      await expect(
        service.update(child.id, 999, 'system_admin', {
          responsibleBusiness: '',
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.update(child.id, 999, 'system_admin', {
          responsibleBusiness: '',
        }, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SECOND_LEVEL_REQUIRES_BUSINESS);
      }
    });

    it('responsibleBusiness 变更应记录审计日志', async () => {
      const result: any = await service.update(existingCol.id, 999, 'system_admin', {
        responsibleBusiness: ResponsibleBusiness.NEWS,
      }, '127.0.0.1');

      expect(result.responsibleBusiness).toBe(ResponsibleBusiness.NEWS);
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'column_business_change' }),
      );
    });
  });

  // ==================== disable ====================

  describe('disable', () => {
    let activeCol: any;

    beforeEach(async () => {
      activeCol = await prisma.column.create({
        data: {
          columnName: '活跃栏目',
          columnSlug: 'active-col',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
    });

    it('系统管理员应能成功停用栏目', async () => {
      const result: any = await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');

      expect(result.status).toBe(ColumnStatus.DISABLED);
      expect(result.version).toBe(1);
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'column_disable' }),
      );
    });

    it('非 system_admin 应抛出 ForbiddenException', async () => {
      await expect(
        service.disable(activeCol.id, 100, 'editor', '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('栏目不存在应抛出 NotFoundException', async () => {
      await expect(
        service.disable(99999, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('已停用的栏目应抛出 BadRequestException', async () => {
      await prisma.column.update({
        where: { id: activeCol.id },
        data: { status: ColumnStatus.DISABLED },
      });

      await expect(
        service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('存在已发布稿件应抛出 DISABLE_HAS_PUBLISHED', async () => {
      await prisma.article.create({
        data: { columnId: activeCol.id, status: 'published' },
      });

      await expect(
        service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.DISABLE_HAS_PUBLISHED);
      }
    });

    it('存在审批中稿件应抛出 DISABLE_HAS_PENDING', async () => {
      await prisma.article.create({
        data: { columnId: activeCol.id, status: 'pending_review' },
      });

      await expect(
        service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.DISABLE_HAS_PENDING);
      }
    });

    it('存在终审中稿件应抛出 DISABLE_HAS_PENDING', async () => {
      await prisma.article.create({
        data: { columnId: activeCol.id, status: 'final_pending' },
      });

      await expect(
        service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.DISABLE_HAS_PENDING);
      }
    });

    it('存在子栏目应抛出 DISABLE_HAS_CHILDREN', async () => {
      await prisma.column.create({
        data: {
          columnName: '子栏目',
          columnSlug: 'child-col',
          parentId: activeCol.id,
          status: ColumnStatus.ACTIVE,
          responsibleBusiness: ResponsibleBusiness.NOTICE,
        },
      });

      await expect(
        service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.disable(activeCol.id, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.DISABLE_HAS_CHILDREN);
      }
    });
  });

  // ==================== enable ====================

  describe('enable', () => {
    it('系统管理员应能成功启用已停用栏目', async () => {
      const disabled = await prisma.column.create({
        data: {
          columnName: '停用栏目',
          columnSlug: 'disabled-col',
          parentId: null,
          status: ColumnStatus.DISABLED,
        },
      });

      const result: any = await service.enable(disabled.id, 999, 'system_admin', '127.0.0.1');

      expect(result.status).toBe(ColumnStatus.ACTIVE);
      expect(result.version).toBe(1);
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'column_enable' }),
      );
    });

    it('非 system_admin 应抛出 ForbiddenException', async () => {
      const disabled = await prisma.column.create({
        data: {
          columnName: '停用栏目',
          columnSlug: 'disabled-for-enable',
          parentId: null,
          status: ColumnStatus.DISABLED,
        },
      });

      await expect(
        service.enable(disabled.id, 100, 'editor', '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('栏目不存在应抛出 NotFoundException', async () => {
      await expect(
        service.enable(99999, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('已启用的栏目应抛出 BadRequestException', async () => {
      const active = await prisma.column.create({
        data: {
          columnName: '活跃栏目',
          columnSlug: 'active-for-enable',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      await expect(
        service.enable(active.id, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== sort ====================

  describe('sort', () => {
    it('系统管理员应能成功排序栏目', async () => {
      const col1 = await prisma.column.create({
        data: {
          columnName: '栏目1',
          columnSlug: 'sort-col-1',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
      const col2 = await prisma.column.create({
        data: {
          columnName: '栏目2',
          columnSlug: 'sort-col-2',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 1,
        },
      });

      const result = await service.sort(
        {
          items: [
            { columnId: col1.id, sortOrder: 10 },
            { columnId: col2.id, sortOrder: 5 },
          ],
        },
        999,
        'system_admin',
        '127.0.0.1',
      );

      expect(result).toEqual({ success: true, message: '排序更新成功' });
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'column_sort' }),
      );
    });

    it('非 system_admin 应抛出 ForbiddenException', async () => {
      await expect(
        service.sort({ items: [] }, 100, 'editor', '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== slugToId ====================

  describe('slugToId', () => {
    it('应成功返回栏目映射', async () => {
      const col = await prisma.column.create({
        data: {
          columnName: 'Slug栏目',
          columnSlug: 'slug-to-id-col',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      const result = await service.slugToId('slug-to-id-col');
      expect(result.columnSlug).toBe('slug-to-id-col');
      expect(result.columnId).toBe(col.id);
      expect(result.columnName).toBe('Slug栏目');
    });

    it('slug 不存在应抛出 NotFoundException', async () => {
      await expect(service.slugToId('nonexistent-slug')).rejects.toThrow(NotFoundException);
    });

    it('slug 对应栏目已停用应抛出 NotFoundException', async () => {
      await prisma.column.create({
        data: {
          columnName: '停用Slug',
          columnSlug: 'disabled-slug',
          parentId: null,
          status: ColumnStatus.DISABLED,
        },
      });

      await expect(service.slugToId('disabled-slug')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== idToSlug ====================

  describe('idToSlug', () => {
    it('应成功返回栏目映射', async () => {
      const col = await prisma.column.create({
        data: {
          columnName: 'Id栏目',
          columnSlug: 'id-to-slug-col',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      const result = await service.idToSlug(col.id);
      expect(result.columnId).toBe(col.id);
      expect(result.columnSlug).toBe('id-to-slug-col');
      expect(result.columnName).toBe('Id栏目');
    });

    it('栏目不存在应抛出 NotFoundException', async () => {
      await expect(service.idToSlug(99999)).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== batchMapping ====================

  describe('batchMapping', () => {
    it('SLUG_TO_ID 应正确批量映射', async () => {
      const col1 = await prisma.column.create({
        data: {
          columnName: '栏目1',
          columnSlug: 'slug-a',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });
      const col2 = await prisma.column.create({
        data: {
          columnName: '栏目2',
          columnSlug: 'slug-b',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      const result = await service.batchMapping({
        type: 'SLUG_TO_ID',
        values: ['slug-a', 'slug-b', 'slug-c'],
      });

      expect(result['slug-a']).toBe(col1.id);
      expect(result['slug-b']).toBe(col2.id);
      expect(result['slug-c']).toBe(0);
    });

    it('ID_TO_SLUG 应正确批量映射', async () => {
      const col1 = await prisma.column.create({
        data: {
          columnName: '栏目1',
          columnSlug: 'slug-for-id-a',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });
      const col2 = await prisma.column.create({
        data: {
          columnName: '栏目2',
          columnSlug: 'slug-for-id-b',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      const result = await service.batchMapping({
        type: 'ID_TO_SLUG',
        values: [col1.id, col2.id, 99999],
      });

      expect(result[String(col1.id)]).toBe('slug-for-id-a');
      expect(result[String(col2.id)]).toBe('slug-for-id-b');
      expect(result['99999']).toBe('');
    });
  });

  // ==================== findById ====================

  describe('findById', () => {
    it('应成功返回栏目', async () => {
      const col = await prisma.column.create({
        data: {
          columnName: 'FindById栏目',
          columnSlug: 'find-by-id',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      const result = await service.findById(col.id);
      expect(result.id).toBe(col.id);
      expect(result.columnName).toBe('FindById栏目');
    });

    it('栏目不存在应抛出 NotFoundException', async () => {
      await expect(service.findById(99999)).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== findBySlug ====================

  describe('findBySlug', () => {
    it('应成功返回栏目', async () => {
      await prisma.column.create({
        data: {
          columnName: 'FindBySlug栏目',
          columnSlug: 'find-by-slug',
          parentId: null,
          status: ColumnStatus.ACTIVE,
        },
      });

      const result = await service.findBySlug('find-by-slug');
      expect(result.columnSlug).toBe('find-by-slug');
      expect(result.columnName).toBe('FindBySlug栏目');
    });

    it('slug 不存在应抛出 NotFoundException', async () => {
      await expect(service.findBySlug('nonexistent-slug')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== findAllActive ====================

  describe('findAllActive', () => {
    it('应返回所有活跃栏目', async () => {
      await prisma.column.create({
        data: {
          columnName: '活跃1',
          columnSlug: 'active-1',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 1,
        },
      });
      await prisma.column.create({
        data: {
          columnName: '活跃2',
          columnSlug: 'active-2',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
      await prisma.column.create({
        data: {
          columnName: '停用1',
          columnSlug: 'disabled-1',
          parentId: null,
          status: ColumnStatus.DISABLED,
          sortOrder: 2,
        },
      });

      const result = await service.findAllActive();
      expect(result.length).toBe(2);
      expect(result[0].sortOrder).toBe(0);
      expect(result[1].sortOrder).toBe(1);
    });
  });

  // ==================== 边界用例补充 ====================

  describe('边界用例补充 - create', () => {
    it('在二级栏目下创建子栏目应抛出 LEVEL_EXCEEDED（仅支持两级结构）', async () => {
      const root = await prisma.column.create({
        data: {
          columnName: '一级栏目',
          columnSlug: 'root-level',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
      const second = await prisma.column.create({
        data: {
          columnName: '二级栏目',
          columnSlug: 'second-level',
          parentId: root.id,
          status: ColumnStatus.ACTIVE,
          responsibleBusiness: ResponsibleBusiness.NOTICE,
          sortOrder: 0,
        },
      });

      const dto = {
        columnName: '三级栏目',
        columnSlug: 'third-level',
        parentId: second.id,
        responsibleBusiness: ResponsibleBusiness.NOTICE,
      };

      await expect(
        service.create(999, 'system_admin', dto, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.create(999, 'system_admin', dto, '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.LEVEL_EXCEEDED);
      }
    });

    it('创建栏目时应正确保存 linkUrl 字段', async () => {
      const result: any = await service.create(999, 'system_admin', {
        columnName: '链接型栏目',
        columnSlug: 'link-column',
        linkUrl: 'https://example.com/platform',
      }, '127.0.0.1');

      expect(result.linkUrl).toBe('https://example.com/platform');
    });
  });

  describe('边界用例补充 - sort', () => {
    it('排序包含不存在的栏目应抛出 SORT_COLUMN_NOT_FOUND', async () => {
      const col = await prisma.column.create({
        data: {
          columnName: '存在栏目',
          columnSlug: 'exists-col',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });

      await expect(
        service.sort({
          items: [
            { columnId: col.id, sortOrder: 0 },
            { columnId: 99998, sortOrder: 1 },
          ],
        }, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.sort({
          items: [
            { columnId: col.id, sortOrder: 0 },
            { columnId: 99998, sortOrder: 1 },
          ],
        }, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SORT_COLUMN_NOT_FOUND);
      }
    });

    it('跨层级排序应抛出 SORT_MIXED_LEVELS（一级与二级混合）', async () => {
      const root = await prisma.column.create({
        data: {
          columnName: '一级A',
          columnSlug: 'mix-root',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
      const child = await prisma.column.create({
        data: {
          columnName: '二级A',
          columnSlug: 'mix-child',
          parentId: root.id,
          status: ColumnStatus.ACTIVE,
          responsibleBusiness: ResponsibleBusiness.NOTICE,
          sortOrder: 0,
        },
      });

      await expect(
        service.sort({
          items: [
            { columnId: root.id, sortOrder: 0 },
            { columnId: child.id, sortOrder: 1 },
          ],
        }, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.sort({
          items: [
            { columnId: root.id, sortOrder: 0 },
            { columnId: child.id, sortOrder: 1 },
          ],
        }, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.SORT_MIXED_LEVELS);
      }
    });

    it('排序包含已删除栏目应抛出 COLUMN_ALREADY_DELETED', async () => {
      const deleted = await prisma.column.create({
        data: {
          columnName: '已删除栏目',
          columnSlug: 'deleted-sort',
          parentId: null,
          status: ColumnStatus.DELETED,
          sortOrder: 0,
        },
      });
      const active = await prisma.column.create({
        data: {
          columnName: '活跃栏目',
          columnSlug: 'active-sort',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 1,
        },
      });

      await expect(
        service.sort({
          items: [
            { columnId: deleted.id, sortOrder: 0 },
            { columnId: active.id, sortOrder: 1 },
          ],
        }, 999, 'system_admin', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.sort({
          items: [
            { columnId: deleted.id, sortOrder: 0 },
            { columnId: active.id, sortOrder: 1 },
          ],
        }, 999, 'system_admin', '127.0.0.1');
      } catch (e: any) {
        expect(e?.response?.code).toBe(ColumnErrorCode.COLUMN_ALREADY_DELETED);
      }
    });

    it('同父级二级栏目排序应成功', async () => {
      const root = await prisma.column.create({
        data: {
          columnName: '父栏目',
          columnSlug: 'sort-parent',
          parentId: null,
          status: ColumnStatus.ACTIVE,
          sortOrder: 0,
        },
      });
      const c1 = await prisma.column.create({
        data: {
          columnName: '子1',
          columnSlug: 'sort-child-1',
          parentId: root.id,
          status: ColumnStatus.ACTIVE,
          responsibleBusiness: ResponsibleBusiness.NOTICE,
          sortOrder: 0,
        },
      });
      const c2 = await prisma.column.create({
        data: {
          columnName: '子2',
          columnSlug: 'sort-child-2',
          parentId: root.id,
          status: ColumnStatus.ACTIVE,
          responsibleBusiness: ResponsibleBusiness.NEWS,
          sortOrder: 1,
        },
      });

      const result = await service.sort({
        items: [
          { columnId: c2.id, sortOrder: 0 },
          { columnId: c1.id, sortOrder: 1 },
        ],
      }, 999, 'system_admin', '127.0.0.1');

      expect(result).toEqual({ success: true, message: '排序更新成功' });
    });
  });
});