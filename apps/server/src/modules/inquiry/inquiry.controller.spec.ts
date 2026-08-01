import { Test, TestingModule } from '@nestjs/testing'
import { InquiryController, AdminInquiryController } from './inquiry.controller.js'
import { InquiryService } from './inquiry.service.js'
import { InquiryStatus, BusinessTag, SubmitterType } from './inquiry.constants.js'

// Mock ApiResponseHelper to avoid @jwc/shared module resolution
jest.mock('../../common/dto/api-response.js', () => ({
  ApiResponseHelper: {
    success: jest.fn((data: any, message = 'ok') => ({
      code: 0,
      message,
      data,
      timestamp: Date.now(),
    })),
    error: jest.fn((code: number, message: string) => ({
      code,
      message,
      data: null,
      timestamp: Date.now(),
    })),
    paginated: jest.fn((list: any[], total: number, page: number, pageSize: number) => ({
      code: 0,
      message: 'ok',
      data: { list, total, page, pageSize },
      timestamp: Date.now(),
    })),
  },
}))

// Mock AuthGuard to bypass authentication in tests
jest.mock('../../common/guards/auth.guard.js', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}))

describe('InquiryController', () => {
  let controller: InquiryController
  let mockInquiryService: any

  beforeEach(async () => {
    mockInquiryService = {
      submitInquiry: jest.fn(),
      findPublic: jest.fn(),
      replyInquiry: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InquiryController],
      providers: [{ provide: InquiryService, useValue: mockInquiryService }],
    }).compile()

    controller = module.get<InquiryController>(InquiryController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ==================== POST /inquiries ====================

  describe('POST /api/v1/inquiries (提交咨询)', () => {
    const validBody = {
      title: '关于缓考申请的咨询',
      content: '您好，我想了解缓考申请的具体流程和所需材料。',
      businessTag: BusinessTag.EXAM,
      submitterName: '张三',
      submitterContact: 'zhangsan@stu.edu.cn',
      submitterType: SubmitterType.STUDENT,
    }

    const createMockReq = () => ({
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      headers: {},
    })

    it('应成功提交咨询并返回成功响应', async () => {
      const mockResult = {
        inquiryId: 10001,
        inquiryNo: 'INQ20260727000001',
        status: 'pending',
        deadlineAt: new Date(),
        createdAt: new Date(),
      }
      mockInquiryService.submitInquiry.mockResolvedValue(mockResult)

      const result = await controller.submitInquiry(validBody as any, createMockReq())

      expect(mockInquiryService.submitInquiry).toHaveBeenCalledWith(
        validBody,
        '127.0.0.1',
        undefined,
      )
      expect(result.code).toBe(0)
      expect(result.data.inquiryId).toBe(10001)
      expect(result.data.inquiryNo).toBe('INQ20260727000001')
      expect(result.message).toBe('咨询提交成功')
    })

    it('应从 x-sso-user-id 头获取提交人用户 ID', async () => {
      mockInquiryService.submitInquiry.mockResolvedValue({
        inquiryId: 1,
        inquiryNo: 'INQ20260727000001',
        status: 'pending',
        deadlineAt: new Date(),
        createdAt: new Date(),
      })

      const req = {
        ...createMockReq(),
        headers: { 'x-sso-user-id': '5001' },
      }

      await controller.submitInquiry(validBody as any, req)

      expect(mockInquiryService.submitInquiry).toHaveBeenCalledWith(
        validBody,
        '127.0.0.1',
        5001,
      )
    })
  })

  // ==================== GET /inquiries/public ====================

  describe('GET /api/v1/inquiries/public (公开咨询展示)', () => {
    it('应返回公开咨询列表', async () => {
      const mockResult = {
        list: [
          {
            id: 1,
            inquiryNo: 'INQ20260727000001',
            title: '公开咨询标题',
            content: '公开咨询内容摘要...',
            businessTag: 'exam',
            replyContent: '答复内容',
            replyAt: new Date(),
            submitterName: '张**',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      }
      mockInquiryService.findPublic.mockResolvedValue(mockResult)

      const result = await controller.getPublicInquiries({
        page: 1,
        pageSize: 10,
      } as any)

      expect(mockInquiryService.findPublic).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
      expect(result.code).toBe(0)
      expect(result.data.list.length).toBe(1)
      expect(result.data.total).toBe(1)
    })

    it('应支持业务标签和关键字筛选', async () => {
      mockInquiryService.findPublic.mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 })

      await controller.getPublicInquiries({
        businessTag: 'exam',
        keyword: '缓考',
        page: 1,
        pageSize: 10,
      } as any)

      expect(mockInquiryService.findPublic).toHaveBeenCalledWith({
        businessTag: 'exam',
        keyword: '缓考',
        page: 1,
        pageSize: 10,
      })
    })
  })

  // ==================== PUT /inquiries/:id/reply ====================

  describe('PUT /api/v1/inquiries/:id/reply (答复咨询)', () => {
    const mockUser = { id: 100, role: 'system_admin' }
    const mockReq = { ip: '127.0.0.1' }

    it('应成功答复咨询', async () => {
      const mockResult = {
        inquiryId: 10001,
        status: 'replied',
        isPublic: true,
        repliedAt: new Date(),
      }
      mockInquiryService.replyInquiry.mockResolvedValue(mockResult)

      const result = await controller.replyInquiry(
        10001,
        { replyContent: '答复内容数据数据数据数据', isPublic: true } as any,
        mockUser,
        mockReq,
      )

      expect(mockInquiryService.replyInquiry).toHaveBeenCalledWith(
        10001,
        100,
        'system_admin',
        { replyContent: '答复内容数据数据数据数据', isPublic: true },
        '127.0.0.1',
      )
      expect(result.code).toBe(0)
      expect(result.data.status).toBe('replied')
      expect(result.data.isPublic).toBe(true)
      expect(result.message).toBe('答复成功')
    })
  })
})

// ==================== AdminInquiryController 测试 ====================

describe('AdminInquiryController', () => {
  let controller: AdminInquiryController
  let mockInquiryService: any

  beforeEach(async () => {
    mockInquiryService = {
      findByAdmin: jest.fn(),
      getDetail: jest.fn(),
      assignInquiry: jest.fn(),
      closeInquiry: jest.fn(),
      togglePublic: jest.fn(),
      updateRoutingConfig: jest.fn(),
      getRoutingConfigs: jest.fn(),
      exportInquiries: jest.fn(),
      checkTimeout: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminInquiryController],
      providers: [{ provide: InquiryService, useValue: mockInquiryService }],
    }).compile()

    controller = module.get<AdminInquiryController>(AdminInquiryController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const mockUser = { id: 1, role: 'system_admin' }
  const mockReq = { ip: '127.0.0.1' }

  // ==================== GET /admin/inquiries ====================

  describe('GET /admin/inquiries (台账查询)', () => {
    it('应返回咨询台账列表', async () => {
      const mockResult = {
        list: [
          { id: 1, inquiryNo: 'INQ001', title: '咨询1', status: 'pending' },
          { id: 2, inquiryNo: 'INQ002', title: '咨询2', status: 'processing' },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      }
      mockInquiryService.findByAdmin.mockResolvedValue(mockResult)

      const result = await controller.listInquiries(
        { page: 1, pageSize: 20 } as any,
        mockUser,
      )

      expect(mockInquiryService.findByAdmin).toHaveBeenCalledWith(1, 'system_admin', { page: 1, pageSize: 20 })
      expect(result.code).toBe(0)
      expect(result.data.list.length).toBe(2)
      expect(result.data.total).toBe(2)
    })

    it('应传递所有筛选参数', async () => {
      mockInquiryService.findByAdmin.mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 20 })

      const query = {
        status: InquiryStatus.PROCESSING,
        businessTag: BusinessTag.EXAM,
        keyword: '缓考',
        submitterType: SubmitterType.STUDENT,
        isTimeout: false,
        page: 1,
        pageSize: 10,
      }

      await controller.listInquiries(query as any, mockUser)

      expect(mockInquiryService.findByAdmin).toHaveBeenCalledWith(1, 'system_admin', query)
    })
  })

  // ==================== GET /admin/inquiries/routing-config ====================

  describe('GET /admin/inquiries/routing-config (获取分流配置)', () => {
    it('应返回分流配置列表', async () => {
      const mockConfigs = [
        { businessTag: 'academic', businessTagName: '学术事务', assigneeId: null, assigneeDeptId: null, timeoutHours: 72 },
        { businessTag: 'exam', businessTagName: '考试管理', assigneeId: 1005, assigneeDeptId: 3, timeoutHours: 48 },
      ]
      mockInquiryService.getRoutingConfigs.mockResolvedValue(mockConfigs)

      const result = await controller.getRoutingConfigs(mockUser)

      expect(mockInquiryService.getRoutingConfigs).toHaveBeenCalledWith('system_admin')
      expect(result.code).toBe(0)
      expect(result.data.length).toBe(2)
      expect(result.data[0].businessTag).toBe('academic')
      expect(result.data[1].timeoutHours).toBe(48)
    })
  })

  // ==================== GET /admin/inquiries/:id ====================

  describe('GET /admin/inquiries/:id (咨询详情)', () => {
    it('应返回咨询详情', async () => {
      const mockDetail = {
        id: 10001,
        inquiryNo: 'INQ20260727000001',
        title: '测试咨询',
        content: '测试内容',
        status: 'processing',
      }
      mockInquiryService.getDetail.mockResolvedValue(mockDetail)

      const result = await controller.getDetail(10001, mockUser)

      expect(mockInquiryService.getDetail).toHaveBeenCalledWith(10001, 1, 'system_admin')
      expect(result.code).toBe(0)
      expect(result.data.id).toBe(10001)
      expect(result.data.title).toBe('测试咨询')
    })
  })

  // ==================== POST /admin/inquiries/:id/assign ====================

  describe('POST /admin/inquiries/:id/assign (指派处理人)', () => {
    it('应成功指派处理人', async () => {
      const mockResult = { inquiryId: 10001, assigneeId: 200, status: 'processing' }
      mockInquiryService.assignInquiry.mockResolvedValue(mockResult)

      const result = await controller.assignInquiry(
        10001,
        { assigneeId: 200 } as any,
        mockUser,
        mockReq,
      )

      expect(mockInquiryService.assignInquiry).toHaveBeenCalledWith(
        10001,
        1,
        'system_admin',
        { assigneeId: 200 },
        '127.0.0.1',
      )
      expect(result.code).toBe(0)
      expect(result.data.assigneeId).toBe(200)
      expect(result.message).toBe('指派成功')
    })
  })

  // ==================== POST /admin/inquiries/:id/close ====================

  describe('POST /admin/inquiries/:id/close (关闭咨询)', () => {
    it('应成功关闭咨询', async () => {
      const mockResult = { inquiryId: 10001, status: 'closed' }
      mockInquiryService.closeInquiry.mockResolvedValue(mockResult)

      const result = await controller.closeInquiry(10001, mockUser, mockReq)

      expect(mockInquiryService.closeInquiry).toHaveBeenCalledWith(10001, 1, 'system_admin', '127.0.0.1')
      expect(result.code).toBe(0)
      expect(result.data.status).toBe('closed')
      expect(result.message).toBe('咨询已关闭')
    })
  })

  // ==================== PUT /admin/inquiries/:id/public ====================

  describe('PUT /admin/inquiries/:id/public (切换公开状态)', () => {
    it('应成功切换公开状态', async () => {
      const mockResult = { inquiryId: 10001, isPublic: true }
      mockInquiryService.togglePublic.mockResolvedValue(mockResult)

      const result = await controller.togglePublic(
        10001,
        { isPublic: true },
        mockUser,
        mockReq,
      )

      expect(mockInquiryService.togglePublic).toHaveBeenCalledWith(10001, 1, 'system_admin', true, '127.0.0.1')
      expect(result.code).toBe(0)
      expect(result.data.isPublic).toBe(true)
      expect(result.message).toBe('公开状态已更新')
    })
  })

  // ==================== PUT /admin/inquiries/routing-config ====================

  describe('PUT /admin/inquiries/routing-config (更新分流配置)', () => {
    it('应成功更新分流配置', async () => {
      const mockConfig = {
        id: 1,
        businessTag: 'exam',
        assigneeId: 1005,
        assigneeDeptId: 3,
        timeoutHours: 48,
      }
      mockInquiryService.updateRoutingConfig.mockResolvedValue(mockConfig)

      const dto = { businessTag: 'exam', assigneeId: 1005, assigneeDeptId: 3, timeoutHours: 48 }

      const result = await controller.updateRoutingConfig(dto as any, mockUser, mockReq)

      expect(mockInquiryService.updateRoutingConfig).toHaveBeenCalledWith(1, 'system_admin', dto, '127.0.0.1')
      expect(result.code).toBe(0)
      expect(result.data.businessTag).toBe('exam')
      expect(result.message).toBe('分流配置已更新')
    })
  })

  // ==================== POST /admin/inquiries/export ====================

  describe('POST /admin/inquiries/export (导出台账)', () => {
    it('应成功导出咨询台账', async () => {
      const mockExport = {
        data: [
          { inquiryNo: 'INQ001', title: '咨询1', submitterName: '张**' },
          { inquiryNo: 'INQ002', title: '咨询2', submitterName: '李**' },
        ],
        format: 'xlsx',
        total: 2,
      }
      mockInquiryService.exportInquiries.mockResolvedValue(mockExport)

      const result = await controller.exportInquiries(
        { format: 'xlsx' } as any,
        mockUser,
        mockReq,
      )

      expect(mockInquiryService.exportInquiries).toHaveBeenCalledWith(1, 'system_admin', { format: 'xlsx' }, '127.0.0.1')
      expect(result.code).toBe(0)
      expect(result.data.total).toBe(2)
      expect(result.data.format).toBe('xlsx')
      expect(result.message).toBe('导出成功')
    })
  })

  // ==================== POST /admin/inquiries/timeout-check ====================

  describe('POST /admin/inquiries/timeout-check (手动超时检查)', () => {
    it('系统管理员应能触发超时检查', async () => {
      const mockResult = { warningCount: 2, timeoutCount: 1 }
      mockInquiryService.checkTimeout.mockResolvedValue(mockResult)

      const result = await controller.triggerTimeoutCheck(mockUser)

      expect(mockInquiryService.checkTimeout).toHaveBeenCalled()
      expect(result.code).toBe(0)
      expect(result.data!.warningCount).toBe(2)
      expect(result.data!.timeoutCount).toBe(1)
      expect(result.message).toBe('超时检查完成')
    })

    it('非系统管理员应被拒绝', async () => {
      const result = await controller.triggerTimeoutCheck({ id: 100, role: 'editor' }) as any

      expect(mockInquiryService.checkTimeout).not.toHaveBeenCalled()
      expect(result.code).toBe(403)
    })
  })
})
