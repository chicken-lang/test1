import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ArticleService } from './article.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { SensitiveWordService } from '../sensitive-word/sensitive-word.service.js';
import { MessageService } from '../message/message.service.js';
import { ColumnService } from '../column/column.service.js';
import { FileResourceService } from '../file-resource/file-resource.service.js';
import { ArticleIndexService } from '../search/article-index.service.js';
import {
  ArticleStatus,
  ArticleType,
  SecretLevel,
  PinLevel,
  MessageType,
  MessageAction,
} from './article.constants.js';
import { FilterResultType } from '../sensitive-word/sensitive-word.constants.js';

// ==================== 测试辅助 ====================

const baseArticle = {
  id: 1,
  columnId: 10,
  title: '测试稿件',
  content: '测试内容',
  encryptedContent: null as string | null,
  summary: '测试摘要',
  authorId: 100,
  type: ArticleType.NORMAL,
  secretLevel: SecretLevel.NORMAL,
  status: ArticleStatus.DRAFT,
  businessTags: '[]',
  roleTags: '[]',
  timeTags: '[]',
  reviewerId: null as number | null,
  reviewComment: null as string | null,
  reviewedAt: null as Date | null,
  finalReviewerId: null as number | null,
  finalReviewComment: null as string | null,
  finalReviewedAt: null as Date | null,
  rejectCount: 0,
  isTop: false,
  pinLevel: null as string | null,
  pinExpireAt: null as Date | null,
  isRecommended: false,
  viewCount: 0,
  submittedAt: null as Date | null,
  publishedAt: null as Date | null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  attachments: [] as any[],
};

const confidentialArticle: any = {
  ...baseArticle,
  id: 2,
  type: ArticleType.CONFIDENTIAL,
  secretLevel: SecretLevel.CONFIDENTIAL,
  encryptedContent: 'encrypted-base64-content',
};

// ==================== Mock Prisma ====================

let _idCounter = 1000;

function createMockPrismaService() {
  let store: Record<number, any> = {};

  const article = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_idCounter;
      const record = { ...baseArticle, ...data, id };
      store[id] = record;
      return Promise.resolve(record);
    }),

    findUnique: jest.fn().mockImplementation(({ where, include }: any) => {
      const record = store[where.id] ?? null;
      if (record && include?.attachments) {
        return Promise.resolve({ ...record, attachments: record.attachments ?? [] });
      }
      return Promise.resolve(record);
    }),

    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const record = store[where.id];
      if (!record) return Promise.reject(new Error('Not found'));
      const merged = { ...record, ...flattenUpdateData(data, record) };
      store[where.id] = merged;
      return Promise.resolve(merged);
    }),

    delete: jest.fn().mockImplementation(({ where }: any) => {
      const record = store[where.id];
      if (!record) return Promise.reject(new Error('Not found'));
      delete store[where.id];
      return Promise.resolve(record);
    }),

    findMany: jest.fn().mockImplementation(({ where, orderBy, skip = 0, take = 10 }: any) => {
      let results = Object.values(store);
      if (where?.status) results = results.filter(r => r.status === where.status);
      if (where?.authorId) results = results.filter(r => r.authorId === where.authorId);
      if (where?.columnId?.in) results = results.filter(r => where.columnId.in.includes(r.columnId));
      if (where?.columnId && !where.columnId?.in) results = results.filter(r => r.columnId === where.columnId);
      if (where?.title?.contains) results = results.filter(r => r.title.includes(where.title.contains));
      if (where?.OR) {
        results = results.filter(r =>
          where.OR.some((condition: any) => {
            if (condition?.title?.contains) return r.title.includes(condition.title.contains);
            if (condition?.summary?.contains) return r.summary?.includes(condition.summary.contains);
            return false;
          }),
        );
      }
      return Promise.resolve(results.slice(skip, skip + take));
    }),

    count: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(store);
      if (where?.status) results = results.filter(r => r.status === where.status);
      if (where?.authorId) results = results.filter(r => r.authorId === where.authorId);
      if (where?.columnId?.in) results = results.filter(r => where.columnId.in.includes(r.columnId));
      if (where?.columnId && !where.columnId?.in) results = results.filter(r => r.columnId === where.columnId);
      if (where?.OR) {
        results = results.filter(r =>
          where.OR.some((condition: any) => {
            if (condition?.title?.contains) return r.title.includes(condition.title.contains);
            if (condition?.summary?.contains) return r.summary?.includes(condition.summary.contains);
            return false;
          }),
        );
      }
      return Promise.resolve(results.length);
    }),
  };

  const message = {
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
    article,
    admin,
    message,
    _setAdminData: (data: any) => { _adminData = data; },
    _setAdminList: (list: any[]) => { _adminList = list; },
    _clearAdmin: () => { _adminData = null; _adminList = []; },
    // helper to reset store between tests
    _resetStore: () => { store = {}; },
    _getStore: () => store,
  };
}

/** 把 Prisma 的 data 写操作 (如 { status: 'x', rejectCount: { increment: 1 } }) 展平 */
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
    findAll: jest.fn(),
    findViolations: jest.fn(),
  };
}

function createMockSensitiveWordService() {
  return {
    filterContent: jest.fn().mockResolvedValue({ filteredContent: '', matchedWords: [], totalCount: 0, hasHighRisk: false }),
    filterArticleContent: jest.fn().mockResolvedValue({ filteredContent: '', matchedWords: [], totalCount: 0, hasHighRisk: false }),
  };
}

function createMockMessageService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    sendManuscriptSubmitted: jest.fn().mockResolvedValue(undefined),
    sendManuscriptReviewed: jest.fn().mockResolvedValue(undefined),
    sendManuscriptPublished: jest.fn().mockResolvedValue(undefined),
    sendManuscriptRejected: jest.fn().mockResolvedValue(undefined),
    sendManuscriptReviewRejected: jest.fn().mockResolvedValue(undefined),
    sendManuscriptReviewPassToFinal: jest.fn().mockResolvedValue(undefined),
    sendManuscriptFinalPublished: jest.fn().mockResolvedValue(undefined),
    sendManuscriptFinalRejected: jest.fn().mockResolvedValue(undefined),
    sendManuscriptWithdrawn: jest.fn().mockResolvedValue(undefined),
    sendManuscriptResubmitted: jest.fn().mockResolvedValue(undefined),
    sendManuscriptPinned: jest.fn().mockResolvedValue(undefined),
    sendManuscriptUnpinned: jest.fn().mockResolvedValue(undefined),
  };
}

function createMockColumnService() {
  return {
    findById: jest.fn().mockResolvedValue({ id: 1, columnName: '测试栏目', status: 'ACTIVE' }),
    checkColumnExists: jest.fn().mockResolvedValue(true),
    expandToDescendantIds: jest.fn().mockImplementation(async (columnIds: number[]) => {
      return [...columnIds];
    }),
    // 简化实现：仅检查 columnId 是否在允许列表中（测试场景不涉及真实栏目树）
    isColumnInAllowedSet: jest.fn().mockImplementation(async (columnId: number, allowedColumnIds: number[]) => {
      if (!columnId || !Array.isArray(allowedColumnIds)) return false;
      return allowedColumnIds.includes(columnId);
    }),
  };
}

function createMockFileResourceService() {
  return {
    validateResourceAccess: jest.fn().mockResolvedValue(true),
  };
}

function createMockArticleIndexService() {
  return {
    syncArticle: jest.fn().mockResolvedValue(undefined),
    removeArticle: jest.fn().mockResolvedValue(undefined),
  };
}

// ==================== 测试主体 ====================

describe('ArticleService', () => {
  let service: ArticleService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let auditLog: ReturnType<typeof createMockAuditLogService>;
  let messageService: ReturnType<typeof createMockMessageService>;
  let sensitiveWordService: ReturnType<typeof createMockSensitiveWordService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    _idCounter = 1000;
    prisma = createMockPrismaService();
    prisma._clearAdmin();
    auditLog = createMockAuditLogService();
    messageService = createMockMessageService();
    sensitiveWordService = createMockSensitiveWordService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
        { provide: SensitiveWordService, useValue: sensitiveWordService },
        { provide: MessageService, useValue: messageService },
        { provide: ColumnService, useValue: createMockColumnService() },
        { provide: FileResourceService, useValue: createMockFileResourceService() },
        { provide: ArticleIndexService, useValue: createMockArticleIndexService() },
      ],
    }).compile();

    service = module.get(ArticleService);
  });

  // ==================== 草稿管理 ====================

  describe('createDraft', () => {
    it('应成功创建普通稿件草稿', async () => {
      const dto = { columnId: 10, title: '测试稿件', content: '内容' };
      const result: any = await service.createDraft(100, 'editor', [10, 20], dto, '127.0.0.1');

      expect(result.id).toBeDefined();
      expect(result.status).toBe(ArticleStatus.DRAFT);
      expect(result.authorId).toBe(100);
      expect(result.columnId).toBe(10);
      expect(result.type).toBe(ArticleType.NORMAL);
      expect(result.secretLevel).toBe(SecretLevel.NORMAL);
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'article_create_draft' }),
      );
    });

    it('系统管理员可以在任意栏目创建草稿', async () => {
      const dto = { columnId: 99, title: '管理员稿件' };
      const result: any = await service.createDraft(999, 'system_admin', [], dto, '127.0.0.1');

      expect(result.columnId).toBe(99);
      expect(result.authorId).toBe(999);
    });

    it('超出栏目权限应抛出 ForbiddenException', async () => {
      const dto = { columnId: 99, title: '越权稿件' };
      await expect(
        service.createDraft(100, 'editor', [10, 20], dto, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('涉密公文草稿应正确设置 type 和 secretLevel', async () => {
      const dto = {
        columnId: 10,
        title: '涉密公文',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
        encryptedContent: 'enc-content',
      };
      const result: any = await service.createDraft(100, 'editor', [10, 20], dto, '127.0.0.1');

      expect(result.type).toBe(ArticleType.CONFIDENTIAL);
      expect(result.secretLevel).toBe(SecretLevel.CONFIDENTIAL);
      expect(result.encryptedContent).toBe('enc-content');
    });
  });

  describe('updateDraft', () => {
    it('作者本人应能成功修改草稿', async () => {
      prisma._setAdminData({
        id: 100,
        role: 'editor',
        bindColumnIds: JSON.stringify([10]),
      });

      // 先创建一篇稿件
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '旧标题' }, '127.0.0.1');
      const id = created.id;

      const result: any = await service.updateDraft(id, 100, 'editor', { columnId: 10, title: '新标题' }, '127.0.0.1');

      expect(result.title).toBe('新标题');
      expect(result.id).toBe(id);
    });

    it('系统管理员应能修改任意草稿', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '原标题' }, '127.0.0.1');

      const result: any = await service.updateDraft(created.id, 999, 'system_admin', { columnId: 10, title: '管理员修改' }, '127.0.0.1');

      expect(result.title).toBe('管理员修改');
    });

    it('非草稿状态应抛出 BadRequestException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      // 手动改为已发布状态
      await prisma.article.update({ where: { id: created.id }, data: { status: ArticleStatus.PUBLISHED } });

      await expect(
        service.updateDraft(created.id, 100, 'editor', { columnId: 10, title: 'test' }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('非作者非管理员应抛出 ForbiddenException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.updateDraft(created.id, 200, 'reviewer', { columnId: 10, title: 'test' }, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('稿件不存在应抛出 NotFoundException', async () => {
      await expect(
        service.updateDraft(9999, 100, 'editor', { columnId: 10, title: 'test' }, '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDraft', () => {
    it('作者应能删除自己的草稿', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      const result = await service.deleteDraft(created.id, 100, 'editor', '127.0.0.1');
      expect(result).toEqual({ success: true });
    });

    it('系统管理员应能删除任意草稿', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      const result = await service.deleteDraft(created.id, 999, 'system_admin', '127.0.0.1');
      expect(result).toEqual({ success: true });
    });

    it('非草稿状态应抛出 BadRequestException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({ where: { id: created.id }, data: { status: ArticleStatus.PUBLISHED } });

      await expect(
        service.deleteDraft(created.id, 100, 'editor', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('非作者非管理员应抛出 ForbiddenException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.deleteDraft(created.id, 200, 'reviewer', '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== 提交审核 ====================

  describe('submitForReview', () => {
    it('草稿应能成功提交审核', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      const result: any = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      expect(result.status).toBe(ArticleStatus.PENDING_REVIEW);
      expect(result.submittedAt).toBeInstanceOf(Date);
    });

    it('驳回状态的稿件应能重新提交', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({ where: { id: created.id }, data: { status: ArticleStatus.REVIEW_REJECTED } });

      const result: any = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      expect(result.status).toBe(ArticleStatus.PENDING_REVIEW);
    });

    it('非草稿/驳回状态应抛出 BadRequestException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({ where: { id: created.id }, data: { status: ArticleStatus.PUBLISHED } });

      await expect(
        service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('非作者应抛出 ForbiddenException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.submitForReview(created.id, 200, 'reviewer', {}, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('应通知审核人员', async () => {
      prisma._setAdminList([
        { id: 200, role: 'reviewer', status: 'active' },
        { id: 300, role: 'column_admin', status: 'active' },
      ]);

      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '通知测试' }, '127.0.0.1');
      await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      // 验证发送了审核通知
      expect(messageService.sendManuscriptSubmitted).toHaveBeenCalled();
    });
  });

  // ==================== 初审 ====================

  describe('firstReview', () => {
    async function createAndSubmit(dto: any = { columnId: 10, title: 'test' }): Promise<any> {
      const created: any = await service.createDraft(100, 'editor', [10], dto, '127.0.0.1');
      return service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
    }

    describe('普通稿件', () => {
      it('初审通过应直接发布', async () => {
        const submitted: any = await createAndSubmit();

        const result: any = await service.firstReview(submitted.id, 200, 'reviewer', {
          action: ArticleStatus.PUBLISHED,
        }, '127.0.0.1');

        expect(result.status).toBe(ArticleStatus.PUBLISHED);
        expect(result.publishedAt).toBeInstanceOf(Date);
        expect(result.reviewerId).toBe(200);
        expect(auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'article_first_review_publish' }),
        );
      });

      it('初审驳回应正确设置 reviewComment 和 rejectCount', async () => {
        const submitted: any = await createAndSubmit();

        const result: any = await service.firstReview(submitted.id, 200, 'reviewer', {
          action: ArticleStatus.REVIEW_REJECTED,
          reviewComment: '不符合要求',
        }, '127.0.0.1');

        expect(result.status).toBe(ArticleStatus.REVIEW_REJECTED);
        expect(result.reviewComment).toBe('不符合要求');
        expect(result.rejectCount).toBe(1);
        expect(result.reviewedAt).toBeInstanceOf(Date);
      });

      it('普通稿件不应走终审流程', async () => {
        const submitted: any = await createAndSubmit();

        await expect(
          service.firstReview(submitted.id, 200, 'reviewer', {
            action: ArticleStatus.FINAL_PENDING,
          }, '127.0.0.1'),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('涉密公文', () => {
      async function createConfidentialAndSubmit() {
        const created: any = await service.createDraft(100, 'editor', [10], {
          columnId: 10,
          title: '涉密公文',
          type: ArticleType.CONFIDENTIAL,
          secretLevel: SecretLevel.CONFIDENTIAL,
          encryptedContent: 'enc',
        }, '127.0.0.1');
        return service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      }

      it('初审通过应转终审', async () => {
        prisma._setAdminList([{ id: 300, role: 'column_admin', status: 'active' }]);
        const submitted: any = await createConfidentialAndSubmit();

        const result: any = await service.firstReview(submitted.id, 200, 'reviewer', {
          action: ArticleStatus.FINAL_PENDING,
        }, '127.0.0.1');

        expect(result.status).toBe(ArticleStatus.FINAL_PENDING);
        expect(result.reviewerId).toBe(200);
      });

      it('涉密公文不应直接发布', async () => {
        const submitted: any = await createConfidentialAndSubmit();

        await expect(
          service.firstReview(submitted.id, 200, 'reviewer', {
            action: ArticleStatus.PUBLISHED,
          }, '127.0.0.1'),
        ).rejects.toThrow(BadRequestException);
      });

      it('涉密公文初审驳回应通知作者', async () => {
        const submitted: any = await createConfidentialAndSubmit();

        await service.firstReview(submitted.id, 200, 'reviewer', {
          action: ArticleStatus.REVIEW_REJECTED,
          reviewComment: '涉密内容需修改',
        }, '127.0.0.1');

        // 验证发送了驳回通知给作者
        expect(messageService.sendManuscriptReviewRejected).toHaveBeenCalled();
      });
    });

    it('非待初审状态应抛出 BadRequestException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.firstReview(created.id, 200, 'reviewer', {
          action: ArticleStatus.PUBLISHED,
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== 终审 ====================

  describe('finalReview', () => {
    async function createConfidentialAndFinalPending() {
      prisma._setAdminList([{ id: 300, role: 'column_admin', status: 'active' }]);
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
        encryptedContent: 'enc',
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      return service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.FINAL_PENDING,
      }, '127.0.0.1');
    }

    it('终审通过应发布涉密公文', async () => {
      const finalPending: any = await createConfidentialAndFinalPending();

      const result: any = await service.finalReview(finalPending.id, 300, 'column_admin', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      expect(result.status).toBe(ArticleStatus.PUBLISHED);
      expect(result.finalReviewerId).toBe(300);
      expect(result.finalReviewedAt).toBeInstanceOf(Date);
      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it('终审驳回应正确设置 finalReviewComment 和 rejectCount', async () => {
      const finalPending: any = await createConfidentialAndFinalPending();

      const result: any = await service.finalReview(finalPending.id, 300, 'column_admin', {
        action: ArticleStatus.REVIEW_REJECTED,
        finalReviewComment: '终审驳回',
      }, '127.0.0.1');

      expect(result.status).toBe(ArticleStatus.REVIEW_REJECTED);
      expect(result.finalReviewComment).toBe('终审驳回');
      expect(result.rejectCount).toBe(1);
    });

    it('终审驳回应通知作者', async () => {
      const finalPending: any = await createConfidentialAndFinalPending();

      await service.finalReview(finalPending.id, 300, 'column_admin', {
        action: ArticleStatus.REVIEW_REJECTED,
        finalReviewComment: '驳回',
      }, '127.0.0.1');

      // 验证发送了终审驳回通知给作者
      expect(messageService.sendManuscriptFinalRejected).toHaveBeenCalled();
    });

    it('非涉密公文应抛出 BadRequestException', async () => {
      // 普通稿件直接绕过初审发布
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.FINAL_PENDING, type: ArticleType.NORMAL },
      });

      await expect(
        service.finalReview(created.id, 300, 'column_admin', {
          action: ArticleStatus.PUBLISHED,
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('非待终审状态应抛出 BadRequestException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
      }, '127.0.0.1');

      await expect(
        service.finalReview(created.id, 300, 'column_admin', {
          action: ArticleStatus.PUBLISHED,
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== 重新提交 ====================

  describe('resubmit', () => {
    it('驳回状态应能成功重新提交', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.REVIEW_REJECTED, reviewComment: '旧批注' },
      });

      prisma._setAdminList([{ id: 200, role: 'reviewer', status: 'active' }]);

      const result: any = await service.resubmit(created.id, 100, 'editor', {
        content: '修改后的内容',
      }, '127.0.0.1');

      expect(result.status).toBe(ArticleStatus.PENDING_REVIEW);
      expect(result.content).toBe('修改后的内容');
      expect(result.reviewComment).toBeNull();
      expect(result.reviewedAt).toBeNull();
    });

    it('非驳回状态应抛出 BadRequestException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.resubmit(created.id, 100, 'editor', {}, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('非作者应抛出 ForbiddenException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({ where: { id: created.id }, data: { status: ArticleStatus.REVIEW_REJECTED } });

      await expect(
        service.resubmit(created.id, 200, 'reviewer', {}, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('重新提交应通知审核人员', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({ where: { id: created.id }, data: { status: ArticleStatus.REVIEW_REJECTED } });
      prisma._setAdminList([{ id: 200, role: 'reviewer', status: 'active' }]);

      await service.resubmit(created.id, 100, 'editor', {}, '127.0.0.1');

      // 验证发送了重新提交通知（使用 sendManuscriptSubmitted）
      expect(messageService.sendManuscriptSubmitted).toHaveBeenCalled();
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'article_resubmit' }),
      );
    });
  });

  // ==================== 撤回 ====================

  describe('withdraw', () => {
    async function createPublished() {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      return service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');
    }

    it('作者应能撤回自己的已发布稿件', async () => {
      const published: any = await createPublished();

      const result: any = await service.withdraw(published.id, 100, 'editor', { reason: '需要修改' }, '127.0.0.1');

      expect(result.status).toBe(ArticleStatus.WITHDRAWN);
      expect(result.isTop).toBe(false);
      expect(result.pinLevel).toBeNull();
    });

    it('系统管理员撤回应抛出 ForbiddenException(不参与内容运营)', async () => {
      const published: any = await createPublished();

      await expect(
        service.withdraw(published.id, 999, 'system_admin', {}, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('编辑撤回他人稿件应抛出 ForbiddenException', async () => {
      const published: any = await createPublished();

      await expect(
        service.withdraw(published.id, 200, 'editor', {}, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('非已发布状态应抛出 BadRequestException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.withdraw(created.id, 100, 'editor', {}, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== 置顶 ====================

  describe('pinArticle', () => {
    async function createPublished() {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      return service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');
    }

    it('栏目管理员应能设置栏目置顶', async () => {
      const published: any = await createPublished();

      const result: any = await service.pinArticle(published.id, 300, 'column_admin', {
        pinLevel: PinLevel.COLUMN_TOP,
      }, '127.0.0.1');

      expect(result.isTop).toBe(true);
      expect(result.pinLevel).toBe(PinLevel.COLUMN_TOP);
    });

    it('应能设置带过期时间的置顶', async () => {
      const published: any = await createPublished();

      const result: any = await service.pinArticle(published.id, 300, 'column_admin', {
        pinLevel: PinLevel.COLUMN_TOP,
        durationHours: 24,
      }, '127.0.0.1');

      expect(result.pinExpireAt).toBeInstanceOf(Date);
      expect(result.pinExpireAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('系统管理员置顶应抛出 ForbiddenException(不参与内容运营)', async () => {
      const published: any = await createPublished();

      await expect(
        service.pinArticle(published.id, 999, 'system_admin', {
          pinLevel: PinLevel.SITE_TOP,
        }, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('栏目管理员应能设置全站置顶', async () => {
      const published: any = await createPublished();

      const result: any = await service.pinArticle(published.id, 300, 'column_admin', {
        pinLevel: PinLevel.SITE_TOP,
      }, '127.0.0.1');

      expect(result.pinLevel).toBe(PinLevel.SITE_TOP);
    });

    it('编辑员设置全站置顶应抛出 ForbiddenException', async () => {
      const published: any = await createPublished();

      await expect(
        service.pinArticle(published.id, 100, 'editor', {
          pinLevel: PinLevel.SITE_TOP,
        }, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('非已发布状态应抛出 BadRequestException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.pinArticle(created.id, 300, 'column_admin', {
          pinLevel: PinLevel.COLUMN_TOP,
        }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unpinArticle', () => {
    it('应能成功取消置顶', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      const published: any = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      // 先置顶
      await prisma.article.update({
        where: { id: published.id },
        data: { isTop: true, pinLevel: PinLevel.COLUMN_TOP },
      });

      const result: any = await service.unpinArticle(published.id, 300, 'column_admin', '127.0.0.1');

      expect(result.isTop).toBe(false);
      expect(result.pinLevel).toBeNull();
    });
  });

  // ==================== 查询接口 ====================

  describe('findById', () => {
    it('应返回稿件详情', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      const result: any = await service.findById(created.id);
      expect(result.id).toBe(created.id);
      expect(result.title).toBe(created.title);
    });

    it('稿件不存在应抛出 NotFoundException', async () => {
      await expect(service.findById(9999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMyDrafts', () => {
    it('编辑应只能看到自己的草稿', async () => {
      await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'A' }, '127.0.0.1');
      await service.createDraft(200, 'reviewer', [20], { columnId: 20, title: 'B' }, '127.0.0.1');

      const result: any = await service.findMyDrafts(100, 'editor', [10], {});
      expect(result.total).toBe(1);
      expect(result.list[0].title).toBe('A');
    });

    it('关键字搜索应匹配标题', async () => {
      await service.createDraft(100, 'editor', [10], { columnId: 10, title: '重要通知' }, '127.0.0.1');
      await service.createDraft(100, 'editor', [10], { columnId: 10, title: '无关内容' }, '127.0.0.1');

      const result: any = await service.findMyDrafts(100, 'editor', [10], { keyword: '重要' });
      expect(result.total).toBe(1);
      expect(result.list[0].title).toBe('重要通知');
    });
  });

  describe('findPendingReview', () => {
    it('应返回待初审列表', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      const result: any = await service.findPendingReview(200, 'reviewer', [10], {});
      expect(result.total).toBe(1);
    });
  });

  describe('findPendingFinalReview', () => {
    it('应返回待终审列表', async () => {
      prisma._setAdminList([{ id: 300, role: 'column_admin', status: 'active' }]);
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.FINAL_PENDING,
      }, '127.0.0.1');

      const result: any = await service.findPendingFinalReview('column_admin', [10], {});
      expect(result.total).toBe(1);
    });
  });

  describe('findPublished', () => {
    it('应返回已发布列表', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      const result: any = await service.findPublished('editor', [10], {});
      expect(result.total).toBe(1);
      expect(result.list[0].status).toBe(ArticleStatus.PUBLISHED);
    });

    it('支持按栏目过滤', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      // 系统管理员查询不同栏目应无结果
      const result: any = await service.findPublished('system_admin', [], { columnId: 99 });
      expect(result.total).toBe(0);
    });
  });

  describe('findRejected', () => {
    it('编辑应只能看到自己的驳回稿件', async () => {
      const created1: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '我的' }, '127.0.0.1');
      const submitted1 = await service.submitForReview(created1.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted1.id, 200, 'reviewer', {
        action: ArticleStatus.REVIEW_REJECTED,
        reviewComment: '驳回',
      }, '127.0.0.1');

      const created2: any = await service.createDraft(200, 'reviewer', [20], { columnId: 20, title: '别人的' }, '127.0.0.1');
      const submitted2 = await service.submitForReview(created2.id, 200, 'reviewer', {}, '127.0.0.1');
      await service.firstReview(submitted2.id, 200, 'reviewer', {
        action: ArticleStatus.REVIEW_REJECTED,
        reviewComment: '驳回',
      }, '127.0.0.1');

      const result: any = await service.findRejected(100, 'editor', [10], {});
      expect(result.total).toBe(1);
      expect(result.list[0].title).toBe('我的');
    });
  });

  // ==================== updateDraft 栏目权限校验 ====================

  describe('updateDraft 栏目权限校验', () => {
    it('编辑在权限范围内应能修改草稿', async () => {
      prisma._setAdminData({
        id: 100,
        role: 'editor',
        bindColumnIds: JSON.stringify([10, 20]),
      });

      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '原标题' }, '127.0.0.1');

      const result: any = await service.updateDraft(created.id, 100, 'editor', {
        columnId: 20,
        title: '跨栏目修改',
      }, '127.0.0.1');

      expect(result.columnId).toBe(20);
      expect(result.title).toBe('跨栏目修改');
    });

    it('编辑超出栏目权限应抛出 ForbiddenException', async () => {
      prisma._setAdminData({
        id: 100,
        role: 'editor',
        bindColumnIds: JSON.stringify([10]),
      });

      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.updateDraft(created.id, 100, 'editor', { columnId: 99, title: '越权' }, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('系统管理员不受栏目权限限制', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      const result: any = await service.updateDraft(created.id, 999, 'system_admin', {
        columnId: 99,
        title: '管理员跨栏目',
      }, '127.0.0.1');

      expect(result.columnId).toBe(99);
    });

    it('admin 记录不存在时 canAccessColumn 应返回 false', async () => {
      prisma._setAdminData(null);

      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.updateDraft(created.id, 100, 'editor', { columnId: 10, title: 'test' }, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== 状态机校验 ====================

  describe('状态机校验', () => {
    it('已发布稿件不允许提交审核', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({ where: { id: created.id }, data: { status: ArticleStatus.PUBLISHED } });

      await expect(
        service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('草稿不允许初审', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');

      await expect(
        service.firstReview(created.id, 200, 'reviewer', { action: ArticleStatus.PUBLISHED }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('已发布稿件不允许初审', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({ where: { id: created.id }, data: { status: ArticleStatus.PUBLISHED } });

      await expect(
        service.firstReview(created.id, 200, 'reviewer', { action: ArticleStatus.PUBLISHED }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('非终审状态不允许终审操作', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.PENDING_REVIEW, type: ArticleType.CONFIDENTIAL },
      });

      await expect(
        service.finalReview(created.id, 300, 'column_admin', { action: ArticleStatus.PUBLISHED }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('初审传入无效 action 应抛出异常', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      await expect(
        service.firstReview(submitted.id, 200, 'reviewer', { action: 'invalid_action' }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('终审传入无效 action 应抛出异常', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
      }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.FINAL_PENDING, type: ArticleType.CONFIDENTIAL },
      });

      await expect(
        service.finalReview(created.id, 300, 'column_admin', { action: 'invalid_action' }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== 提交审核数据清理 ====================

  describe('提交审核数据清理', () => {
    it('重新提交审核应清除上一轮审核数据', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: {
          status: ArticleStatus.REVIEW_REJECTED,
          reviewerId: 200,
          reviewComment: '旧批注',
          reviewedAt: new Date('2025-01-01'),
          finalReviewerId: 300,
          finalReviewComment: '终审批注',
          finalReviewedAt: new Date('2025-01-01'),
        },
      });

      const result: any = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      expect(result.status).toBe(ArticleStatus.PENDING_REVIEW);
      expect(result.reviewerId).toBeNull();
      expect(result.reviewComment).toBeNull();
      expect(result.reviewedAt).toBeNull();
      expect(result.finalReviewerId).toBeNull();
      expect(result.finalReviewComment).toBeNull();
      expect(result.finalReviewedAt).toBeNull();
      expect(result.submittedAt).toBeInstanceOf(Date);
    });
  });

  // ==================== 通知内容验证 ====================

  describe('通知内容验证', () => {
    it('初审通过应发送正确的通知内容给作者', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '通知测试稿',
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      // 验证发送了发布通知
      expect(messageService.sendManuscriptPublished).toHaveBeenCalled();
    });

    it('终审通过应发送正确通知', async () => {
      prisma._setAdminList([{ id: 300, role: 'column_admin', status: 'active' }]);
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      const finalPending = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.FINAL_PENDING,
      }, '127.0.0.1');

      await service.finalReview(finalPending.id, 300, 'column_admin', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      // 验证发送了终审通过通知
      expect(messageService.sendManuscriptFinalPublished).toHaveBeenCalled();
    });

    it('初审驳回应发送驳回通知并包含批注', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '驳回报测试',
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.REVIEW_REJECTED,
        reviewComment: '内容不符规范',
      }, '127.0.0.1');

      // 验证发送了驳回通知
      expect(messageService.sendManuscriptReviewRejected).toHaveBeenCalled();
    });
  });

  // ==================== 置顶过期时间 ====================

  describe('置顶过期时间', () => {
    it('不设置 durationHours 时 pinExpireAt 应为 null', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      const published = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      const result: any = await service.pinArticle(published.id, 300, 'column_admin', {
        pinLevel: PinLevel.COLUMN_TOP,
      }, '127.0.0.1');

      expect(result.pinExpireAt).toBeNull();
    });

    it('设置 durationHours 为 0 时 pinExpireAt 应为 null (永久置顶)', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      const published = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      const result: any = await service.pinArticle(published.id, 300, 'column_admin', {
        pinLevel: PinLevel.COLUMN_TOP,
        durationHours: 0,
      }, '127.0.0.1');

      // durationHours=0 在 JS 中为 falsy, 不会设置过期时间
      expect(result.pinExpireAt).toBeNull();
    });
  });

  // ==================== 查询过滤增强 ====================

  describe('查询过滤增强', () => {
    it('系统管理员查询草稿应能看到所有草稿', async () => {
      await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'A' }, '127.0.0.1');
      await service.createDraft(200, 'reviewer', [20], { columnId: 20, title: 'B' }, '127.0.0.1');

      const result: any = await service.findMyDrafts(999, 'system_admin', [], {});
      expect(result.total).toBe(2);
    });

    it('非系统管理员且无栏目绑定时不应看到他人草稿（B-4 数据隔离）', async () => {
      await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'A' }, '127.0.0.1');

      const result: any = await service.findMyDrafts(200, 'reviewer', [], {});
      expect(result.total).toBe(0);
    });

    it('findMyDrafts 关键字搜索应匹配摘要', async () => {
      await service.createDraft(100, 'editor', [10], { columnId: 10, title: '标题A', summary: '重要摘要信息' }, '127.0.0.1');
      await service.createDraft(100, 'editor', [10], { columnId: 10, title: '标题B', summary: '普通摘要' }, '127.0.0.1');

      const result: any = await service.findMyDrafts(100, 'editor', [10], { keyword: '重要' });
      expect(result.total).toBe(1);
      expect(result.list[0].summary).toBe('重要摘要信息');
    });

    it('findPublished 应支持关键字搜索', async () => {
      const created1: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '重要公告' }, '127.0.0.1');
      const submitted1 = await service.submitForReview(created1.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted1.id, 200, 'reviewer', { action: ArticleStatus.PUBLISHED }, '127.0.0.1');

      const created2: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '无关文章' }, '127.0.0.1');
      const submitted2 = await service.submitForReview(created2.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted2.id, 200, 'reviewer', { action: ArticleStatus.PUBLISHED }, '127.0.0.1');

      const result: any = await service.findPublished('editor', [10], { keyword: '重要' });
      expect(result.total).toBe(1);
      expect(result.list[0].title).toBe('重要公告');
    });

    it('findPendingReview 应支持关键字搜索', async () => {
      const created1: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '紧急稿件' }, '127.0.0.1');
      await service.submitForReview(created1.id, 100, 'editor', {}, '127.0.0.1');

      const created2: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '普通稿件' }, '127.0.0.1');
      await service.submitForReview(created2.id, 100, 'editor', {}, '127.0.0.1');

      const result: any = await service.findPendingReview(200, 'reviewer', [10], { keyword: '紧急' });
      expect(result.total).toBe(1);
      expect(result.list[0].title).toBe('紧急稿件');
    });
  });

  // ==================== 边界场景 ====================

  describe('边界场景', () => {
    it('同一稿件连续驳回后 rejectCount 应正确累加', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      // 第一次驳回
      const result1: any = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.REVIEW_REJECTED,
        reviewComment: '第一次驳回',
      }, '127.0.0.1');
      expect(result1.rejectCount).toBe(1);

      // 重新提交
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.PENDING_REVIEW },
      });

      // 第二次驳回
      const result2: any = await service.firstReview(created.id, 200, 'reviewer', {
        action: ArticleStatus.REVIEW_REJECTED,
        reviewComment: '第二次驳回',
      }, '127.0.0.1');
      expect(result2.rejectCount).toBe(2);
    });

    it('撤回后稿件应清除所有置顶信息', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      const published: any = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      // 先置顶
      await prisma.article.update({
        where: { id: published.id },
        data: { isTop: true, pinLevel: PinLevel.SITE_TOP, pinExpireAt: new Date() },
      });

      const result: any = await service.withdraw(published.id, 100, 'editor', {}, '127.0.0.1');
      expect(result.isTop).toBe(false);
      expect(result.pinLevel).toBeNull();
      expect(result.pinExpireAt).toBeNull();
    });

    it('初审通过后应正确设置 reviewerId 和 reviewedAt', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: 'test' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      const result: any = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      expect(result.reviewerId).toBe(200);
      expect(result.reviewedAt).toBeInstanceOf(Date);
      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it('终审通过后应正确设置 finalReviewerId 和 finalReviewedAt', async () => {
      prisma._setAdminList([{ id: 300, role: 'column_admin', status: 'active' }]);
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      const finalPending: any = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.FINAL_PENDING,
      }, '127.0.0.1');

      const result: any = await service.finalReview(finalPending.id, 300, 'column_admin', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');

      expect(result.finalReviewerId).toBe(300);
      expect(result.finalReviewedAt).toBeInstanceOf(Date);
      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it('resubmit 时应保留涉密内容 encryptedContent', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
        encryptedContent: 'encrypted-v2',
      }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.REVIEW_REJECTED },
      });

      prisma._setAdminList([{ id: 200, role: 'reviewer', status: 'active' }]);
      const result: any = await service.resubmit(created.id, 100, 'editor', {
        content: '新内容',
      }, '127.0.0.1');

      expect(result.encryptedContent).toBe('encrypted-v2');
      expect(result.content).toBe('新内容');
    });

    it('updateDraft 时未提供的标签字段应保持原值', async () => {
      prisma._setAdminData({
        id: 100,
        role: 'editor',
        bindColumnIds: JSON.stringify([10]),
      });

      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
        businessTags: '["a","b"]',
        roleTags: '["r1"]',
        timeTags: '["t1"]',
      }, '127.0.0.1');

      const result: any = await service.updateDraft(created.id, 100, 'editor', {
        columnId: 10,
        title: '仅修改标题',
      }, '127.0.0.1');

      expect(result.businessTags).toBe('["a","b"]');
      expect(result.roleTags).toBe('["r1"]');
      expect(result.timeTags).toBe('["t1"]');
    });

    it('完整审批流程: 普通稿件从创建到发布', async () => {
      // 1. 创建
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '完整流程测试',
      }, '127.0.0.1');
      expect(created.status).toBe(ArticleStatus.DRAFT);

      // 2. 提交
      const submitted: any = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      expect(submitted.status).toBe(ArticleStatus.PENDING_REVIEW);

      // 3. 初审通过
      const published: any = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');
      expect(published.status).toBe(ArticleStatus.PUBLISHED);

      // 4. 撤回
      const withdrawn: any = await service.withdraw(published.id, 100, 'editor', {}, '127.0.0.1');
      expect(withdrawn.status).toBe(ArticleStatus.WITHDRAWN);
    });

    it('完整审批流程: 涉密公文三级审批', async () => {
      prisma._setAdminList([
        { id: 200, role: 'reviewer', status: 'active' },
        { id: 300, role: 'column_admin', status: 'active' },
      ]);

      // 1. 创建涉密公文
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '涉密公文',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
        encryptedContent: 'enc-data',
      }, '127.0.0.1');
      expect(created.type).toBe(ArticleType.CONFIDENTIAL);

      // 2. 提交
      const submitted: any = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      expect(submitted.status).toBe(ArticleStatus.PENDING_REVIEW);

      // 3. 初审 → 转终审
      const finalPending: any = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.FINAL_PENDING,
      }, '127.0.0.1');
      expect(finalPending.status).toBe(ArticleStatus.FINAL_PENDING);

      // 4. 终审通过 → 发布
      const published: any = await service.finalReview(finalPending.id, 300, 'column_admin', {
        action: ArticleStatus.PUBLISHED,
      }, '127.0.0.1');
      expect(published.status).toBe(ArticleStatus.PUBLISHED);
      expect(published.finalReviewerId).toBe(300);
      expect(published.publishedAt).toBeInstanceOf(Date);
    });

    it('驳回 → 修改 → 重新提交完整流程', async () => {
      // 创建并提交
      const created: any = await service.createDraft(100, 'editor', [10], { columnId: 10, title: '迭代稿件' }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      // 驳回
      const rejected: any = await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.REVIEW_REJECTED,
        reviewComment: '内容不足',
      }, '127.0.0.1');
      expect(rejected.rejectCount).toBe(1);

      // 重新提交
      prisma._setAdminList([{ id: 200, role: 'reviewer', status: 'active' }]);
      const resubmitted: any = await service.resubmit(created.id, 100, 'editor', {
        content: '补充后的内容',
      }, '127.0.0.1');
      expect(resubmitted.status).toBe(ArticleStatus.PENDING_REVIEW);
      expect(resubmitted.content).toBe('补充后的内容');

      // 再次驳回
      const rejected2: any = await service.firstReview(created.id, 200, 'reviewer', {
        action: ArticleStatus.REVIEW_REJECTED,
        reviewComment: '仍需修改',
      }, '127.0.0.1');
      expect(rejected2.rejectCount).toBe(2);
    });
  });

  // ==================== 修复回归测试 ====================

  describe('updateDraft 附件保护（B-2 修复）', () => {
    it('仅修改标题时不应清空附件', async () => {
      // 设置 admin 数据（canAccessColumn 需查询 admin.bindColumnIds）
      prisma._setAdminData({
        id: 100,
        role: 'editor',
        bindColumnIds: JSON.stringify([10]),
      });

      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '原标题',
        content: '内容',
      }, '127.0.0.1');

      // 模拟已有附件
      const store = prisma._getStore();
      store[created.id].attachments = [
        { id: 1, fileType: 'image', fileUrl: '/uploads/test.jpg', name: 'test.jpg' },
      ];

      // 仅更新标题
      await service.updateDraft(created.id, 100, 'editor', {
        columnId: 10,
        title: '新标题',
      }, '127.0.0.1');

      // 验证 update 调用中不包含 attachments 操作
      const updateCall = prisma.article.update.mock.calls.find(
        (c: any[]) => c[0]?.where?.id === created.id,
      );
      expect(updateCall).toBeDefined();
      const updateData = updateCall![0].data;
      expect(updateData.attachments).toBeUndefined();
    });

    it('传入 images 时应更新附件', async () => {
      prisma._setAdminData({
        id: 100,
        role: 'editor',
        bindColumnIds: JSON.stringify([10]),
      });

      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '原标题',
      }, '127.0.0.1');

      await service.updateDraft(created.id, 100, 'editor', {
        columnId: 10,
        title: '新标题',
        images: '[]',
      }, '127.0.0.1');

      const updateCall = prisma.article.update.mock.calls.find(
        (c: any[]) => c[0]?.where?.id === created.id,
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![0].data.attachments).toBeDefined();
    });
  });

  describe('finalReview 定时发布返回路径（B-3 修复）', () => {
    it('定时发布应正常返回而非抛出异常', async () => {
      prisma._setAdminList([{ id: 300, role: 'column_admin', status: 'active' }]);
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '涉密稿件',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.FINAL_PENDING,
      }, '127.0.0.1');

      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result: any = await service.finalReview(created.id, 300, 'column_admin', {
        action: ArticleStatus.PUBLISHED,
        scheduledPublishAt: futureDate,
      }, '127.0.0.1');

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.status).toBe(ArticleStatus.FINAL_PENDING);
      expect(result.scheduledPublishAt).toBeDefined();
    });
  });

  describe('findById 权限校验（B-6 修复）', () => {
    it('非作者非管理员不能查看他人草稿', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '他人草稿',
      }, '127.0.0.1');

      await expect(
        service.findById(created.id, 200, 'reviewer', [20]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('作者可以查看自己的草稿', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '我的草稿',
      }, '127.0.0.1');

      const result: any = await service.findById(created.id, 100, 'editor', [10]);
      expect(result.id).toBe(created.id);
    });

    it('系统管理员可以查看任意草稿', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '草稿',
      }, '127.0.0.1');

      const result: any = await service.findById(created.id, 999, 'system_admin', []);
      expect(result.id).toBe(created.id);
    });

    it('非管理员不能查看无权栏目的已发布稿件', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '已发布',
      }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.PUBLISHED },
      });

      await expect(
        service.findById(created.id, 200, 'reviewer', [99]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('不传用户上下文时跳过权限校验（内部调用兼容）', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '内部调用',
      }, '127.0.0.1');

      const result: any = await service.findById(created.id);
      expect(result.id).toBe(created.id);
    });
  });

  describe('withdraw 权限校验（B-5 修复）', () => {
    it('非作者非管理员不能撤回他人稿件', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '他人稿件',
      }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.PUBLISHED },
      });

      await expect(
        service.withdraw(created.id, 200, 'reviewer', {}, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('作者可以撤回自己的稿件', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '我的稿件',
      }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.PUBLISHED },
      });

      const result: any = await service.withdraw(created.id, 100, 'editor', {}, '127.0.0.1');
      expect(result.status).toBe(ArticleStatus.WITHDRAWN);
    });

    it('系统管理员撤回应被拦截(不参与内容运营)', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '管理员撤回',
      }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.PUBLISHED },
      });

      await expect(
        service.withdraw(created.id, 999, 'system_admin', {}, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findPublished columnId 越权防护（B-7 修复）', () => {
    it('非管理员传入无权栏目 columnId 应抛出 ForbiddenException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
      }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.PUBLISHED },
      });

      await expect(
        service.findPublished('editor', [10], { columnId: 99 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('非管理员传入有权栏目 columnId 应正常返回', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: 'test',
      }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.PUBLISHED },
      });

      const result: any = await service.findPublished('editor', [10], { columnId: 10 });
      expect(result.total).toBe(1);
    });
  });

  describe('空 bindColumnIds 数据隔离（B-4 修复）', () => {
    it('非管理员且无栏目绑定时应返回空列表', async () => {
      // 先创建一条草稿（由其他用户）
      await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '不应被看到',
      }, '127.0.0.1');

      const result: any = await service.findMyDrafts(200, 'editor', [], {});
      expect(result.total).toBe(0);
    });

    it('非管理员且无栏目绑定时待审核列表为空', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '不应被看到',
      }, '127.0.0.1');
      await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      const result: any = await service.findPendingReview(200, 'reviewer', [], {});
      expect(result.total).toBe(0);
    });

    it('非管理员且无栏目绑定时已发布列表为空', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '不应被看到',
      }, '127.0.0.1');
      await prisma.article.update({
        where: { id: created.id },
        data: { status: ArticleStatus.PUBLISHED },
      });

      const result: any = await service.findPublished('editor', [], {});
      expect(result.total).toBe(0);
    });
  });

  // ==================== 敏感词过滤（submitForReview 集成） ====================

  describe('敏感词过滤（submitForReview 集成）', () => {
    it('高危敏感词应拦截提交并抛出 BadRequestException', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '敏感内容稿件',
        content: '包含高危词的内容',
      }, '127.0.0.1');

      // 覆盖 mock 返回 BLOCKED 结果
      sensitiveWordService.filterArticleContent.mockResolvedValueOnce({
        type: FilterResultType.BLOCKED,
        matchedWords: [{ word: '高危词' }],
        desensitizedText: null,
      });

      await expect(
        service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      // 验证稿件状态未变更为 PENDING_REVIEW
      const store = prisma._getStore();
      expect(store[created.id].status).toBe(ArticleStatus.DRAFT);
    });

    it('脱敏词应替换内容后继续提交', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '脱敏稿件',
        content: '原始内容',
      }, '127.0.0.1');

      // 覆盖 mock 返回 DESENSITIZED 结果
      sensitiveWordService.filterArticleContent.mockResolvedValueOnce({
        type: FilterResultType.DESENSITIZED,
        matchedWords: [{ word: '敏感词' }],
        desensitizedText: '脱敏后的内容',
      });

      const result: any = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      expect(result.status).toBe(ArticleStatus.PENDING_REVIEW);
      expect(result.content).toBe('脱敏后的内容');

      // 验证审计日志记录了过滤行为
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'article_submit_review',
          detail: expect.stringContaining('DESENSITIZED'),
        }),
      );
    });

    it('通过审核的内容应正常提交', async () => {
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '正常稿件',
        content: '合规内容',
      }, '127.0.0.1');

      sensitiveWordService.filterArticleContent.mockResolvedValueOnce({
        type: FilterResultType.PASS,
        matchedWords: [],
        desensitizedText: null,
      });

      const result: any = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');

      expect(result.status).toBe(ArticleStatus.PENDING_REVIEW);
      expect(result.content).toBe('合规内容');
    });
  });

  // ==================== 定时发布调度（finalReview） ====================

  describe('定时发布调度（finalReview）', () => {
    it('定时发布应设置 scheduledPublishAt 且状态保持 FINAL_PENDING', async () => {
      prisma._setAdminList([{ id: 300, role: 'column_admin', status: 'active' }]);
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '定时发布稿',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
        encryptedContent: 'enc',
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.FINAL_PENDING,
      }, '127.0.0.1');

      const futureDate = new Date(Date.now() + 86400000); // 明天
      const result: any = await service.finalReview(created.id, 300, 'column_admin', {
        action: ArticleStatus.PUBLISHED,
        scheduledPublishAt: futureDate.toISOString(),
      }, '127.0.0.1');

      expect(result.status).toBe(ArticleStatus.FINAL_PENDING);
      expect(result.scheduledPublishAt).toBeInstanceOf(Date);
      expect(result.finalReviewerId).toBe(300);
      expect(result.finalReviewedAt).toBeInstanceOf(Date);
      // 定时发布不应设置 publishedAt（保持为 null）
      expect(result.publishedAt).toBeNull();
    });

    it('定时发布应记录审计日志 article_final_review_scheduled', async () => {
      prisma._setAdminList([{ id: 300, role: 'column_admin', status: 'active' }]);
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '定时审计稿',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
        encryptedContent: 'enc',
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.FINAL_PENDING,
      }, '127.0.0.1');

      const futureDate = new Date(Date.now() + 86400000).toISOString();
      await service.finalReview(created.id, 300, 'column_admin', {
        action: ArticleStatus.PUBLISHED,
        scheduledPublishAt: futureDate,
      }, '127.0.0.1');

      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'article_final_review_scheduled',
          detail: expect.stringContaining(futureDate),
        }),
      );
    });

    it('过去的 scheduledPublishAt 应立即发布而非定时', async () => {
      prisma._setAdminList([{ id: 300, role: 'column_admin', status: 'active' }]);
      const created: any = await service.createDraft(100, 'editor', [10], {
        columnId: 10,
        title: '过去时间稿',
        type: ArticleType.CONFIDENTIAL,
        secretLevel: SecretLevel.CONFIDENTIAL,
        encryptedContent: 'enc',
      }, '127.0.0.1');
      const submitted = await service.submitForReview(created.id, 100, 'editor', {}, '127.0.0.1');
      await service.firstReview(submitted.id, 200, 'reviewer', {
        action: ArticleStatus.FINAL_PENDING,
      }, '127.0.0.1');

      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 昨天
      const result: any = await service.finalReview(created.id, 300, 'column_admin', {
        action: ArticleStatus.PUBLISHED,
        scheduledPublishAt: pastDate,
      }, '127.0.0.1');

      // 过去时间应走立即发布分支
      expect(result.status).toBe(ArticleStatus.PUBLISHED);
      expect(result.publishedAt).toBeInstanceOf(Date);
    });
  });
});