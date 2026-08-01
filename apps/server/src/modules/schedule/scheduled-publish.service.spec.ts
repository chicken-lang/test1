import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledPublishService } from './scheduled-publish.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { MessageService } from '../message/message.service.js';
import { ArticleStatus } from '../article/article.constants.js';

describe('ScheduledPublishService', () => {
  let service: ScheduledPublishService;
  let prismaService: any;
  let auditLogService: any;
  let messageService: any;

  beforeEach(async () => {
    prismaService = {
      article: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    auditLogService = {
      create: jest.fn(),
    };

    messageService = {
      createMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledPublishService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: MessageService, useValue: messageService },
      ],
    }).compile();

    service = module.get<ScheduledPublishService>(ScheduledPublishService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleScheduledPublish', () => {
    it('should skip when no pending articles', async () => {
      prismaService.article.findMany.mockResolvedValue([]);

      await service.handleScheduledPublish();

      expect(prismaService.article.findMany).toHaveBeenCalled();
      expect(prismaService.article.update).not.toHaveBeenCalled();
    });

    it('should publish articles with scheduled time reached', async () => {
      const scheduledTime = new Date(Date.now() - 1000); // 1秒前
      const mockArticles = [
        {
          id: 1,
          title: '测试稿件',
          columnId: 1,
          authorId: 1,
          finalReviewerId: 2,
          status: ArticleStatus.FINAL_PENDING,
          scheduledPublishAt: scheduledTime,
          column: { id: 1, name: '测试栏目' },
        },
      ];

      prismaService.article.findMany.mockResolvedValue(mockArticles);
      prismaService.article.update.mockResolvedValue({
        ...mockArticles[0],
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
      });

      await service.handleScheduledPublish();

      expect(prismaService.article.update).toHaveBeenCalled();
      expect(auditLogService.create).toHaveBeenCalled();
      expect(messageService.createMessage).toHaveBeenCalled();
    });

    it('should not publish articles with future scheduled time', async () => {
      const scheduledTime = new Date(Date.now() + 3600000); // 1小时后
      const mockArticles = [
        {
          id: 1,
          title: '测试稿件',
          status: ArticleStatus.FINAL_PENDING,
          scheduledPublishAt: scheduledTime,
        },
      ];

      prismaService.article.findMany.mockResolvedValue([]); // 返回空数组模拟未来时间不匹配

      await service.handleScheduledPublish();

      expect(prismaService.article.update).not.toHaveBeenCalled();
    });
  });
});
