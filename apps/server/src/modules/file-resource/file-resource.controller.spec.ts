import { Test } from '@nestjs/testing'
import { HttpStatus } from '@nestjs/common'
import { FileResourceController } from './file-resource.controller.js'
import { FileResourceService } from './file-resource.service.js'
import {
  AccessLevel,
  SecretLevel,
  FileStatus,
  FileCategory,
} from './file-resource.constants.js'

jest.mock('../../common/dto/api-response.js', () => ({
  ApiResponseHelper: {
    success: jest.fn((data: any, message = 'ok') => ({
      code: 0,
      message,
      data,
      timestamp: Date.now(),
    })),
    paginated: jest.fn((list: any[], total: number, page: number, pageSize: number) => ({
      code: 0,
      message: 'ok',
      data: { list, total, page, pageSize },
      timestamp: Date.now(),
    })),
    error: jest.fn((code: number, message: string) => ({
      code,
      message,
      data: null,
      timestamp: Date.now(),
    })),
  },
}))

jest.mock('../../common/guards/auth.guard.js', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockResolvedValue(true),
  })),
}))

describe('FileResourceController', () => {
  let controller: FileResourceController
  let mockService: any

  const mockUser = {
    id: 1,
    role: 'editor',
    bindColumnIds: [1, 2],
  }

  const mockReq = { ip: '127.0.0.1' }

  const mockFile = {
    id: 1,
    fileName: 'test.pdf',
    storagePath: '/file_resources/test.pdf',
    fileSize: 1024000,
    fileFormat: 'pdf',
    mimeType: 'application/pdf',
    columnId: 1,
    articleId: null,
    category: FileCategory.NOTICE,
    uploaderId: 1,
    accessLevel: AccessLevel.PUBLIC,
    secretLevel: SecretLevel.NORMAL,
    internalTags: null,
    riskNote: null,
    downloadCount: 0,
    previewCount: 0,
    status: FileStatus.ACTIVE,
    previewEnabled: true,
    previewCacheKey: null,
    createdAt: new Date('2026-07-27'),
    updatedAt: new Date('2026-07-27'),
  }

  const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnValue({ ok: true }),
  })

  beforeEach(async () => {
    mockService = {
      uploadFile: jest.fn().mockResolvedValue(mockFile),
      findAll: jest.fn().mockResolvedValue({
        list: [mockFile],
        total: 1,
        page: 1,
        pageSize: 10,
      }),
      findMyUploads: jest.fn().mockResolvedValue({
        list: [mockFile],
        total: 1,
        page: 1,
        pageSize: 10,
      }),
      findByArticleId: jest.fn().mockResolvedValue([mockFile]),
      getStats: jest.fn().mockResolvedValue({
        totalFiles: 10,
        totalDownloads: 100,
        totalPreviews: 50,
        byFormat: [{ format: 'pdf', count: 5, totalSize: 5000 }],
      }),
      getSystemConfig: jest.fn().mockResolvedValue({
        maxFileSize: 104857600,
        dailyDownloadLimit: 100,
        anonymousRateLimit: 10,
        autoArchiveDays: 180,
      }),
      findById: jest.fn().mockResolvedValue(mockFile),
      updateFile: jest.fn().mockResolvedValue({ ...mockFile, fileName: 'updated.pdf' }),
      updateFilePermission: jest.fn().mockResolvedValue({ ...mockFile, accessLevel: 'INTERNAL' }),
      archiveFile: jest.fn().mockResolvedValue({ ...mockFile, status: FileStatus.ARCHIVED }),
      physicalDelete: jest.fn().mockResolvedValue({ success: true, message: '文件已物理删除' }),
      getPreview: jest.fn().mockResolvedValue({
        file: mockFile,
        mode: 'full',
        device: 'desktop',
        previewPath: '/preview_cache/1/full/cache-key',
      }),
      getThumbnail: jest.fn().mockResolvedValue({
        file: mockFile,
        thumbnailPath: '/preview_cache/1/thumbnail.jpg',
      }),
      downloadFile: jest.fn().mockResolvedValue(mockFile),
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [FileResourceController],
      providers: [{ provide: FileResourceService, useValue: mockService }],
    }).compile()

    controller = moduleRef.get<FileResourceController>(FileResourceController)
  })

  // ==================== POST /files — 上传文件 ====================

  describe('POST /files', () => {
    const uploadDto = {
      fileName: 'test.pdf',
      storagePath: '/file_resources/test.pdf',
      fileSize: 1024000,
      fileFormat: 'pdf',
      mimeType: 'application/pdf',
      columnId: 1,
      category: FileCategory.NOTICE,
      accessLevel: AccessLevel.PUBLIC,
      secretLevel: SecretLevel.NORMAL,
      previewEnabled: true,
    }

    it('应调用 uploadFile 服务并返回成功响应', async () => {
      const result = await controller.uploadFile(uploadDto as any, mockUser, mockReq)

      expect(mockService.uploadFile).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.role,
        mockUser.bindColumnIds,
        uploadDto,
        mockReq.ip,
      )
      expect(result.code).toBe(0)
      expect(result.data).toEqual(mockFile)
      expect(result.message).toBe('文件上传成功')
    })

    it('应传递请求 IP 到服务层', async () => {
      await controller.uploadFile(uploadDto as any, mockUser, mockReq)
      expect(mockService.uploadFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        '127.0.0.1',
      )
    })
  })

  // ==================== GET /files — 查询文件列表 ====================

  describe('GET /files', () => {
    it('应调用 findAll 并返回分页响应', async () => {
      const query = { page: 1, pageSize: 10, keyword: 'test' } as any
      const result = await controller.listFiles(mockUser, query)

      expect(mockService.findAll).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.role,
        mockUser.bindColumnIds,
        query,
      )
      expect(result.data.list).toEqual([mockFile])
      expect(result.data.total).toBe(1)
      expect(result.data.page).toBe(1)
    })
  })

  // ==================== GET /files/mine — 个人上传 ====================

  describe('GET /files/mine', () => {
    it('应调用 findMyUploads 并返回分页响应', async () => {
      const query = { page: 1, pageSize: 10 } as any
      const result = await controller.listMyUploads(mockUser, query)

      expect(mockService.findMyUploads).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.role,
        mockUser.bindColumnIds,
        query,
      )
      expect(result.data.list).toHaveLength(1)
    })
  })

  // ==================== GET /files/article/:articleId — 稿件附件 ====================

  describe('GET /files/article/:articleId', () => {
    it('应调用 findByArticleId 并返回文件列表', async () => {
      const result = await controller.listByArticle(42, mockUser)

      expect(mockService.findByArticleId).toHaveBeenCalledWith(
        42,
        mockUser.role,
        mockUser.bindColumnIds,
      )
      expect(result.data).toEqual([mockFile])
    })
  })

  // ==================== GET /files/stats — 统计 ====================

  describe('GET /files/stats', () => {
    it('应调用 getStats 并返回统计数据', async () => {
      const result = await controller.getStats(mockUser, '2026-01-01', '2026-07-27')

      expect(mockService.getStats).toHaveBeenCalledWith(
        mockUser.role,
        mockUser.bindColumnIds,
        '2026-01-01',
        '2026-07-27',
      )
      expect(result.data.totalFiles).toBe(10)
      expect(result.data.totalDownloads).toBe(100)
      expect(result.data.byFormat).toHaveLength(1)
    })

    it('无日期参数时应正常调用', async () => {
      await controller.getStats(mockUser)

      expect(mockService.getStats).toHaveBeenCalledWith(
        mockUser.role,
        mockUser.bindColumnIds,
        undefined,
        undefined,
      )
    })
  })

  // ==================== GET /files/system-config — 系统配置 ====================

  describe('GET /files/system-config', () => {
    it('应返回系统配置', async () => {
      const result = await controller.getSystemConfig()

      expect(mockService.getSystemConfig).toHaveBeenCalled()
      expect(result.data.maxFileSize).toBe(104857600)
      expect(result.data.autoArchiveDays).toBe(180)
    })
  })

  // ==================== GET /files/:id — 文件详情 ====================

  describe('GET /files/:id', () => {
    it('应调用 findById 并返回文件详情', async () => {
      const result = await controller.getById(1, mockUser)

      expect(mockService.findById).toHaveBeenCalledWith(
        1,
        mockUser.role,
        mockUser.bindColumnIds,
      )
      expect(result.data).toEqual(mockFile)
    })
  })

  // ==================== PUT /files/:id — 编辑文件 ====================

  describe('PUT /files/:id', () => {
    const updateDto = { fileName: 'updated.pdf' } as any

    it('应调用 updateFile 并返回成功响应', async () => {
      const result = await controller.updateFile(1, updateDto, mockUser, mockReq)

      expect(mockService.updateFile).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
        updateDto,
        mockReq.ip,
      )
      expect(result.message).toBe('文件信息更新成功')
    })
  })

  // ==================== PUT /files/:id/permission — 更新权限 ====================

  describe('PUT /files/:id/permission', () => {
    const permDto = { accessLevel: AccessLevel.INTERNAL } as any

    it('应调用 updateFilePermission 并返回成功响应', async () => {
      const result = await controller.updateFilePermission(1, permDto, mockUser, mockReq)

      expect(mockService.updateFilePermission).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
        permDto,
        mockReq.ip,
      )
      expect(result.message).toBe('文件权限更新成功')
    })
  })

  // ==================== PUT /files/system-config — 更新系统配置 ====================

  describe('PUT /files/system-config', () => {
    it('应返回配置已更新响应', async () => {
      const result = await controller.updateSystemConfig(mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('系统配置已更新')
    })
  })

  // ==================== DELETE /files/:id — 归档文件 ====================

  describe('DELETE /files/:id', () => {
    it('应调用 archiveFile 并返回成功响应', async () => {
      const result = await controller.archiveFile(1, mockUser, mockReq)

      expect(mockService.archiveFile).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
        mockReq.ip,
      )
      expect(result.message).toBe('文件已归档')
    })
  })

  // ==================== POST /files/:id/physical-delete — 物理删除 ====================

  describe('POST /files/:id/physical-delete', () => {
    it('应调用 physicalDelete 并返回成功响应', async () => {
      const result = await controller.physicalDelete(1, mockUser, mockReq)

      expect(mockService.physicalDelete).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
        mockReq.ip,
      )
      expect(result.data.success).toBe(true)
    })
  })

  // ==================== GET /files/:id/preview — 文件预览 ====================

  describe('GET /files/:id/preview', () => {
    it('预览缓存就绪时应返回成功响应', async () => {
      const query = { mode: 'full', device: 'desktop' } as any
      const mockRes = createMockRes()
      const result = await controller.getPreview(1, query, mockUser, mockReq, mockRes)

      expect(mockService.getPreview).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
        'full',
        'desktop',
        mockReq.ip,
      )
      expect(result.code).toBe(0)
      expect(result.data.previewPath).toContain('/preview_cache/')
    })

    it('预览缓存未就绪时应返回 202', async () => {
      mockService.getPreview.mockResolvedValueOnce({
        status: 202,
        message: '预览正在生成, 请稍后重试',
        estimatedSeconds: 30,
      })

      const query = { mode: 'full', device: 'desktop' } as any
      const mockRes = createMockRes()
      const result = await controller.getPreview(1, query, mockUser, mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.ACCEPTED)
      expect(mockRes.json).toHaveBeenCalled()
    })

    it('应传递默认 mode 和 device', async () => {
      await controller.getPreview(1, {} as any, mockUser, mockReq, createMockRes())

      expect(mockService.getPreview).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
        undefined,
        undefined,
        mockReq.ip,
      )
    })
  })

  // ==================== GET /files/:id/thumbnail — 缩略图 ====================

  describe('GET /files/:id/thumbnail', () => {
    it('应调用 getThumbnail 并返回成功响应', async () => {
      const result = await controller.getThumbnail(1, mockUser, mockReq)

      expect(mockService.getThumbnail).toHaveBeenCalledWith(
        1,
        mockUser.role,
        mockReq.ip,
      )
      expect(result.data.thumbnailPath).toBeDefined()
    })
  })

  // ==================== GET /files/:id/download — 文件下载 ====================

  describe('GET /files/:id/download', () => {
    it('应调用 downloadFile 并返回成功响应', async () => {
      const result = await controller.downloadFile(1, mockUser, mockReq)

      expect(mockService.downloadFile).toHaveBeenCalledWith(
        1,
        mockUser.id,
        mockUser.role,
        mockReq.ip,
        false,
      )
      expect(result.data).toEqual(mockFile)
    })
  })

  // ==================== 错误传递测试 ====================

  describe('错误处理', () => {
    it('服务层抛出的异常应被传递', async () => {
      const { ForbiddenException } = require('@nestjs/common')
      mockService.uploadFile.mockRejectedValueOnce(new ForbiddenException('无权上传'))

      await expect(
        controller.uploadFile({} as any, mockUser, mockReq),
      ).rejects.toThrow(ForbiddenException)
    })

    it('服务层 NotFoundException 应被传递', async () => {
      const { NotFoundException } = require('@nestjs/common')
      mockService.findById.mockRejectedValueOnce(new NotFoundException('文件不存在'))

      await expect(
        controller.getById(999, mockUser),
      ).rejects.toThrow(NotFoundException)
    })
  })
})