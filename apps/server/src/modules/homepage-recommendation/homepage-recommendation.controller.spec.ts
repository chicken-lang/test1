import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HomepageRecommendationController } from './homepage-recommendation.controller.js';
import { HomepageRecommendationService } from './homepage-recommendation.service.js';
import { RoleTag, ROLE_LABELS } from './homepage-recommendation.constants.js';

describe('HomepageRecommendationController', () => {
  let controller: HomepageRecommendationController;
  let service: any;

  beforeEach(async () => {
    const mockService = {
      getHomepageRecommendations: jest.fn(),
      getSectionRecommendations: jest.fn(),
      getSupportedRoles: jest.fn(),
      normalizeRole: jest.fn().mockImplementation((r?: string) => r || 'visitor'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomepageRecommendationController],
      providers: [
        {
          provide: HomepageRecommendationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<HomepageRecommendationController>(HomepageRecommendationController);
    service = module.get(HomepageRecommendationService);
  });

  describe('getHomepageRecommendations', () => {
    it('应返回首页完整推荐数据', async () => {
      const mockResult = {
        role: RoleTag.STUDENT,
        roleLabel: ROLE_LABELS[RoleTag.STUDENT],
        notices: [],
        guides: [],
        quickLinks: [],
        topics: [],
        timestamp: Date.now(),
      };

      service.getHomepageRecommendations.mockResolvedValue(mockResult);

      const result = await controller.getHomepageRecommendations('student');

      expect(result.code).toBe(0);
      expect(result.data).toBeDefined();
      expect(result.data.role).toBe(RoleTag.STUDENT);
    });

    it('未传角色时应使用默认角色', async () => {
      const mockResult = {
        role: RoleTag.VISITOR,
        roleLabel: ROLE_LABELS[RoleTag.VISITOR],
        notices: [],
        guides: [],
        quickLinks: [],
        topics: [],
        timestamp: Date.now(),
      };

      service.getHomepageRecommendations.mockResolvedValue(mockResult);

      const result = await controller.getHomepageRecommendations(undefined);

      expect(result.code).toBe(0);
      expect(result.data.role).toBe(RoleTag.VISITOR);
    });

    it('应透传可选参数', async () => {
      const mockResult = {
        role: RoleTag.STUDENT,
        roleLabel: ROLE_LABELS[RoleTag.STUDENT],
        notices: [],
        guides: [],
        quickLinks: [],
        topics: [],
        timestamp: Date.now(),
      };

      service.getHomepageRecommendations.mockResolvedValue(mockResult);

      await controller.getHomepageRecommendations(
        'student', '5', '3', '2', '2',
      );

      expect(service.getHomepageRecommendations).toHaveBeenCalledWith('student', {
        noticeLimit: 5,
        guideLimit: 3,
        quickLinkLimit: 2,
        topicLimit: 2,
      });
    });

    it('SSO 头信息应推断角色', async () => {
      const mockResult = {
        role: RoleTag.STUDENT,
        roleLabel: ROLE_LABELS[RoleTag.STUDENT],
        notices: [],
        guides: [],
        quickLinks: [],
        topics: [],
        timestamp: Date.now(),
      };

      service.getHomepageRecommendations.mockResolvedValue(mockResult);

      // role 未传，但 SSO 头提供了学生信息
      await controller.getHomepageRecommendations(
        undefined, undefined, undefined, undefined, undefined,
        {} as any,
        JSON.stringify({ type: 'student' }),
      );

      // 应使用推断的角色
      expect(service.getHomepageRecommendations).toHaveBeenCalledWith(
        RoleTag.STUDENT,
        expect.anything(),
      );
    });
  });

  describe('getSectionRecommendations', () => {
    it('应支持 notice 区域查询', async () => {
      service.getSectionRecommendations.mockResolvedValue([]);

      const result = await controller.getSectionRecommendations(
        'notice', 'student', '10',
      );

      expect(result.code).toBe(0);
      expect(service.getSectionRecommendations).toHaveBeenCalledWith(
        'notice', 'student', 10,
      );
    });

    it('应支持 guide 区域查询', async () => {
      service.getSectionRecommendations.mockResolvedValue([]);

      const result = await controller.getSectionRecommendations(
        'guide', 'teacher', '5',
      );

      expect(result.code).toBe(0);
    });

    it('无效 section 应抛出 BadRequestException', async () => {
      await expect(
        controller.getSectionRecommendations('invalid', 'student'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSupportedRoles', () => {
    it('应返回角色列表', async () => {
      const mockRoles = [
        { role: 'student', label: '学生', description: '学生角色' },
        { role: 'teacher', label: '教师', description: '教师角色' },
        { role: 'visitor', label: '访客', description: '访客角色' },
      ];

      service.getSupportedRoles.mockReturnValue(mockRoles);

      const result = await controller.getSupportedRoles();

      expect(result.code).toBe(0);
      expect(result.data.roles).toEqual(mockRoles);
      expect(result.data.defaultRole).toBe(RoleTag.VISITOR);
      expect(result.data.total).toBe(3);
    });
  });
});
