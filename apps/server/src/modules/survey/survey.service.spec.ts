import { Test, TestingModule } from '@nestjs/testing';
import { SurveyService } from './survey.service';
import { PrismaService } from '../prisma/prisma.service';
import { SurveyStatus, SurveyType, QuestionType } from './survey.constants';
import { CreateSurveyDto } from './survey.dto';

describe('SurveyService', () => {
  let service: SurveyService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyService,
        {
          provide: PrismaService,
          useValue: {
            survey: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            surveyQuestion: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            surveyDistribution: {
              findFirst: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
            },
            surveyResponse: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              aggregate: jest.fn(),
            },
            surveyAnswer: {
              create: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SurveyService>(SurveyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a survey with questions', async () => {
      const dto: CreateSurveyDto = {
        title: '测试问卷',
        description: '测试描述',
        surveyType: SurveyType.GENERAL,
        isAnonymous: false,
        allowSave: true,
        maxSubmit: 1,
        questions: [
          {
            questionType: QuestionType.RADIO,
            title: '您的性别',
            sortOrder: 0,
            isRequired: true,
            options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }],
          },
        ],
      };

      const mockResult = {
        id: 1,
        ...dto,
        status: SurveyStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
      };

      (prismaService.survey.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.create(dto, 1);

      expect(result).toEqual(mockResult);
      expect(prismaService.survey.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return survey when exists', async () => {
      const mockSurvey = {
        id: 1,
        title: '测试问卷',
        status: SurveyStatus.PUBLISHED,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        distributions: [],
      };

      (prismaService.survey.findUnique as jest.Mock).mockResolvedValue(mockSurvey);

      const result = await service.findById(1);

      expect(result).toEqual(mockSurvey);
      expect(prismaService.survey.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { questions: { orderBy: { sortOrder: 'asc' } }, distributions: true },
      });
    });

    it('should throw NotFoundException when survey not found', async () => {
      (prismaService.survey.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById(1)).rejects.toThrow('问卷不存在');
    });
  });

  describe('publish', () => {
    it('should publish a survey', async () => {
      const mockSurvey = {
        id: 1,
        title: '测试问卷',
        status: SurveyStatus.DRAFT,
        startTime: null,
        endTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        distributions: [],
      };

      (prismaService.survey.findUnique as jest.Mock).mockResolvedValue(mockSurvey);
      (prismaService.survey.update as jest.Mock).mockResolvedValue({
        ...mockSurvey,
        status: SurveyStatus.PUBLISHED,
        startTime: new Date(),
      });

      const result = await service.publish(1, {});

      expect(result.status).toEqual(SurveyStatus.PUBLISHED);
      expect(prismaService.survey.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when survey is not draft', async () => {
      const mockSurvey = {
        id: 1,
        title: '测试问卷',
        status: SurveyStatus.PUBLISHED,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        distributions: [],
      };

      (prismaService.survey.findUnique as jest.Mock).mockResolvedValue(mockSurvey);

      await expect(service.publish(1, {})).rejects.toThrow('只能发布草稿状态的问卷');
    });
  });

  describe('submitResponse', () => {
    it('should submit a response', async () => {
      const mockSurvey = {
        id: 1,
        title: '测试问卷',
        status: SurveyStatus.PUBLISHED,
        isAnonymous: false,
        maxSubmit: 1,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(Date.now() + 100000),
        questions: [
          { id: 1, questionType: QuestionType.RADIO, title: '问题1', isRequired: true, options: JSON.stringify([{ label: 'A', value: 'A' }]) },
        ],
        distributions: [],
      };

      (prismaService.survey.findUnique as jest.Mock).mockResolvedValue(mockSurvey);
      (prismaService.surveyDistribution.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.surveyResponse.count as jest.Mock).mockResolvedValue(0);
      (prismaService.surveyResponse.create as jest.Mock).mockResolvedValue({
        id: 1,
        surveyId: 1,
        respondentId: 1,
        submitTime: new Date(),
        status: 'SUBMITTED',
        answers: [],
      });

      const result = await service.submitResponse(1, {
        answers: [{ questionId: 1, answerValue: 'A' }],
      }, 1, '测试用户', '127.0.0.1');

      expect(result.status).toEqual('SUBMITTED');
      expect(prismaService.surveyResponse.create).toHaveBeenCalled();
    });
  });

  describe('statisticsOverview', () => {
    it('should return statistics overview', async () => {
      const mockSurvey = {
        id: 1,
        title: '测试问卷',
        status: SurveyStatus.PUBLISHED,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        distributions: [],
      };

      (prismaService.survey.findUnique as jest.Mock).mockResolvedValue(mockSurvey);
      (prismaService.surveyResponse.count as jest.Mock).mockResolvedValue(50);
      (prismaService.surveyDistribution.findMany as jest.Mock).mockResolvedValue([{ targetType: 'ALL', targetId: null }]);
      (prismaService.surveyResponse.aggregate as jest.Mock).mockResolvedValue({ _avg: { durationSeconds: 120 } });
      (prismaService.surveyResponse.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.statisticsOverview(1);

      expect(result.totalCollected).toEqual(50);
      expect(result.responseRate).toBeGreaterThan(0);
    });
  });
});
