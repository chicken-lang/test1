import { Test, TestingModule } from '@nestjs/testing';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { SurveyStatus, SurveyType } from './survey.constants';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../../common/guards/auth.guard';

describe('SurveyController', () => {
  let controller: SurveyController;
  let service: SurveyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SurveyController],
      providers: [
        {
          provide: SurveyService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            addQuestion: jest.fn(),
            updateQuestion: jest.fn(),
            deleteQuestion: jest.fn(),
            publish: jest.fn(),
            close: jest.fn(),
            archive: jest.fn(),
            validateAccess: jest.fn(),
            submitResponse: jest.fn(),
            saveResponse: jest.fn(),
            getSavedResponse: jest.fn(),
            getResponses: jest.fn(),
            getResponseById: jest.fn(),
            statisticsOverview: jest.fn(),
            questionStatistics: jest.fn(),
            trendStatistics: jest.fn(),
            exportToExcel: jest.fn(),
          },
        },
        AuthGuard,
        Reflector,
        { provide: PrismaService, useValue: {} },
        { provide: AuditLogService, useValue: { create: jest.fn() } },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SurveyController>(SurveyController);
    service = module.get<SurveyService>(SurveyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a survey', async () => {
      const mockResult = {
        id: 1,
        title: '测试问卷',
        status: SurveyStatus.DRAFT,
      };

      (service.create as jest.Mock).mockResolvedValue(mockResult);

      const req = { user: { id: 1 } };
      const result = await controller.create({ title: '测试问卷', surveyType: SurveyType.GENERAL, isAnonymous: false, allowSave: true, maxSubmit: 1 }, req);

      expect(result).toEqual({ message: '问卷创建成功', data: mockResult });
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return survey list', async () => {
      const mockResult = {
        data: [{ id: 1, title: '测试问卷' }],
        total: 1,
      };

      (service.findAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.findAll({});

      expect(result).toEqual({ data: mockResult.data, total: mockResult.total });
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should publish a survey', async () => {
      const mockResult = {
        id: 1,
        title: '测试问卷',
        status: SurveyStatus.PUBLISHED,
      };

      (service.publish as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.publish('1', {});

      expect(result).toEqual({ message: '问卷发布成功', data: mockResult });
      expect(service.publish).toHaveBeenCalledWith(1, {});
    });
  });

  describe('submitResponse', () => {
    it('should submit a response', async () => {
      const mockResult = {
        id: 1,
        surveyId: 1,
        status: 'SUBMITTED',
      };

      (service.submitResponse as jest.Mock).mockResolvedValue(mockResult);

      const req = { user: { id: 1, username: 'test' }, ip: '127.0.0.1' };
      const result = await controller.submitResponse('1', { answers: [] }, req);

      expect(result).toEqual({ message: '答卷提交成功', data: mockResult });
      expect(service.submitResponse).toHaveBeenCalled();
    });
  });

  describe('statisticsOverview', () => {
    it('should return statistics overview', async () => {
      const mockResult = {
        totalDistributed: 1000,
        totalCollected: 50,
        responseRate: 5.0,
        avgDurationSeconds: 120,
        validCount: 48,
        invalidCount: 2,
      };

      (service.statisticsOverview as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.statisticsOverview('1');

      expect(result).toEqual({ data: mockResult });
      expect(service.statisticsOverview).toHaveBeenCalledWith(1);
    });
  });
});
