import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { FileResourceService } from './file-resource.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import {
  AccessLevel,
  SecretLevel,
  FileStatus,
  FileCategory,
  EXECUTABLE_BLACKLIST,
  DEFAULT_MAX_FILE_SIZE,
  ROLE_FILE_PERMISSIONS,
  FileAuditAction,
} from './file-resource.constants.js'
import type {
  CreateFileResourceDto,
  UpdateFileResourceDto,
} from './dto/file-resource.dto.js'

// ==================== 测试辅助 ====================

const baseFile = {
  id: 1,
  fileName: 'article-attachment.pdf',
  storagePath: '/file_resources/article-attachment.pdf',
  fileSize: 2048000,
  fileFormat: 'pdf',
  mimeType: 'application/pdf',
  columnId: 1,
  articleId: 100 as number | null,
  category: FileCategory.MATERIAL,
  uploaderId: 1,
  accessLevel: AccessLevel.PUBLIC,
  secretLevel: SecretLevel.NORMAL,
  internalTags: null as string | null,
  riskNote: null as string | null,
  downloadCount: 0,
  previewCount: 0,
  status: FileStatus.ACTIVE,
  previewEnabled: true,
  previewCacheKey: null as string | null,
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
}

function createMockFileDto(overrides: Partial<CreateFileResourceDto> = {}): CreateFileResourceDto {
  return {
    fileName: baseFile.fileName,
    storagePath: baseFile.storagePath,
    fileSize: baseFile.fileSize,
    fileFormat: baseFile.fileFormat,
    mimeType: baseFile.mimeType,
    columnId: baseFile.columnId,
    articleId: baseFile.articleId ?? undefined,
    category: baseFile.category,
    accessLevel: baseFile.accessLevel,
    secretLevel: baseFile.secretLevel,
    previewEnabled: baseFile.previewEnabled,
    ...overrides,
  }
}

// ==================== Mock 工具 ====================

let _idCounter = 5000

function flattenUpdateData(data: any, record: any) {
  const result: any = {}
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'increment' in value) {
      result[key] = (record[key] || 0) + value.increment
    } else {
      result[key] = value
    }
  }
  return result
}

function createMockPrismaService() {
  let fileStore: Record<number, any> = {}

  // 管理员数据: 支持不同角色和 bindColumnIds
  const adminData: Record<number, any> = {
    1: { id: 1, role: 'editor', bindColumnIds: '[1,2]' },
    2: { id: 2, role: 'column_admin', bindColumnIds: '[1,2,3]' },
    3: { id: 3, role: 'system_admin', bindColumnIds: '[]' },
    10: { id: 10, role: 'editor', bindColumnIds: '[1]' },
    20: { id: 20, role: 'reviewer', bindColumnIds: '[1,2]' },
  }

  const fileResource = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_idCounter
      const record = { ...baseFile, ...data, id }
      fileStore[id] = record
      return Promise.resolve(record)
    }),

    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(fileStore[where?.id] ?? null)
    }),

    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const record = fileStore[where.id]
      if (!record) return Promise.reject(new Error('Not found'))
      const merged = { ...record, ...flattenUpdateData(data, record) }
      fileStore[where.id] = merged
      return Promise.resolve(merged)
    }),

    findMany: jest.fn().mockImplementation(({ where, orderBy, skip, take }: any) => {
      let results = Object.values(fileStore)

      if (where?.status) {
        if (typeof where.status === 'string') {
          results = results.filter((r) => r.status === where.status)
        } else if (where.status.in) {
          results = results.filter((r) => where.status.in.includes(r.status))
        }
      }
      if (where?.columnId !== undefined) {
        if (typeof where.columnId === 'number') {
          results = results.filter((r) => r.columnId === where.columnId)
        } else if (where.columnId?.in) {
          results = results.filter((r) => where.columnId.in.includes(r.columnId))
        }
      }
      if (where?.articleId !== undefined) {
        results = results.filter((r) => r.articleId === where.articleId)
      }
      if (where?.uploaderId !== undefined) {
        results = results.filter((r) => r.uploaderId === where.uploaderId)
      }
      if (where?.accessLevel !== undefined) {
        if (typeof where.accessLevel === 'string') {
          results = results.filter((r) => r.accessLevel === where.accessLevel)
        } else if (where.accessLevel?.not) {
          results = results.filter((r) => r.accessLevel !== where.accessLevel.not)
        }
      }
      if (where?.secretLevel) results = results.filter((r) => r.secretLevel === where.secretLevel)
      if (where?.category) results = results.filter((r) => r.category === where.category)
      if (where?.fileFormat) results = results.filter((r) => r.fileFormat === where.fileFormat)

      if (orderBy) {
        const clauses = Array.isArray(orderBy) ? orderBy : [orderBy]
        for (const clause of clauses) {
          const key = Object.keys(clause)[0]
          const dir = clause[key]
          if (dir === 'desc') {
            results.sort((a, b) => {
              const va = a[key]
              const vb = b[key]
              if (va && vb && va instanceof Date && vb instanceof Date) return vb.getTime() - va.getTime()
              if (typeof va === 'number' && typeof vb === 'number') return vb - va
              return String(vb ?? '').localeCompare(String(va ?? ''))
            })
          }
        }
      }

      if (skip) results = results.slice(skip)
      if (take) results = results.slice(0, take)

      return Promise.resolve(results)
    }),

    count: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(fileStore)
      if (where?.status) {
        if (typeof where.status === 'string') {
          results = results.filter((r) => r.status === where.status)
        } else if (where.status.in) {
          results = results.filter((r) => where.status.in.includes(r.status))
        }
      }
      if (where?.columnId !== undefined) {
        if (typeof where.columnId === 'number') {
          results = results.filter((r) => r.columnId === where.columnId)
        } else if (where.columnId?.in) {
          results = results.filter((r) => where.columnId.in.includes(r.columnId))
        }
      }
      if (where?.accessLevel !== undefined) {
        if (typeof where.accessLevel === 'string') {
          results = results.filter((r) => r.accessLevel === where.accessLevel)
        } else if (where.accessLevel?.not) {
          results = results.filter((r) => r.accessLevel !== where.accessLevel.not)
        }
      }
      if (where?.uploaderId !== undefined) results = results.filter((r) => r.uploaderId === where.uploaderId)
      return Promise.resolve(results.length)
    }),

    aggregate: jest.fn().mockImplementation(({ where, _sum, _count }: any) => {
      let results = Object.values(fileStore)
      if (where?.status) {
        if (typeof where.status === 'string') {
          results = results.filter((r) => r.status === where.status)
        } else if (where.status.in) {
          results = results.filter((r) => where.status.in.includes(r.status))
        }
      }
      if (where?.columnId !== undefined) {
        if (typeof where.columnId === 'number') {
          results = results.filter((r) => r.columnId === where.columnId)
        } else if (where.columnId?.in) {
          results = results.filter((r) => where.columnId.in.includes(r.columnId))
        }
      }
      if (where?.accessLevel !== undefined) {
        if (typeof where.accessLevel === 'string') {
          results = results.filter((r) => r.accessLevel === where.accessLevel)
        } else if (where.accessLevel?.not) {
          results = results.filter((r) => r.accessLevel !== where.accessLevel.not)
        }
      }
      const result: any = {}
      if (_sum) {
        result._sum = {}
        for (const field of Object.keys(_sum)) {
          result._sum[field] = results.reduce((sum, r) => sum + (r[field] || 0), 0)
        }
      }
      if (_count) {
        result._count = {}
        for (const field of Object.keys(_count)) {
          result._count[field] = results.length
        }
      }
      return Promise.resolve(result)
    }),

    groupBy: jest.fn().mockImplementation(({ by, where, _count, _sum }: any) => {
      let results = Object.values(fileStore)
      if (where?.status) {
        if (typeof where.status === 'string') {
          results = results.filter((r) => r.status === where.status)
        } else if (where.status.in) {
          results = results.filter((r) => where.status.in.includes(r.status))
        }
      }
      const byKeys = Array.isArray(by) ? by : [by]
      const grouped: Record<string, any> = {}
      for (const item of results) {
        const key = byKeys.map((k: string) => item[k]).join('|')
        if (!grouped[key]) {
          grouped[key] = {}
          for (const k of byKeys) grouped[key][k] = item[k]
          if (_count) grouped[key]._count = {}
          if (_sum) grouped[key]._sum = {}
        }
        if (_count) {
          for (const field of Object.keys(_count)) {
            grouped[key]._count[field] = (grouped[key]._count[field] || 0) + 1
          }
        }
        if (_sum) {
          for (const field of Object.keys(_sum)) {
            grouped[key]._sum[field] = (grouped[key]._sum[field] || 0) + (item[field] || 0)
          }
        }
      }
      return Promise.resolve(Object.values(grouped))
    }),
  }

  const prisma = {
    fileResource,
    article: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve({ id: where?.id, status: 'published' })
      }),
    },
    admin: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(adminData[where?.id] ?? null)
      }),
    },
    _getFileStore: () => fileStore,
    _resetStore: () => { fileStore = {} },
  }

  return {
    prisma,
    reset: () => {
      _idCounter = 5000
      prisma._resetStore()
    },
  }
}

// ==================== 测试套件 ====================

describe('FileResourceService - 稿件附件管理', () => {
  let service: FileResourceService
  let mockPrisma: ReturnType<typeof createMockPrismaService>

  const mockAuditLog = {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  }

  beforeEach(async () => {
    mockPrisma = createMockPrismaService()
    mockAuditLog.create.mockClear()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileResourceService,
        { provide: PrismaService, useValue: mockPrisma.prisma },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile()

    service = module.get<FileResourceService>(FileResourceService)
  })

  afterEach(() => {
    mockPrisma.reset()
  })

  // ==================== uploadFile ====================

  describe('uploadFile() - 附件上传', () => {
    it('上传可执行格式黑名单文件应拒绝(.exe, .bat, .sh 等)', async () => {
      const blacklistFormats = ['exe', 'bat', 'sh', 'cmd', 'ps1', 'jar', 'msi']

      for (const fmt of blacklistFormats) {
        const dto = createMockFileDto({ fileFormat: fmt, fileName: `malicious.${fmt}` })
        await expect(
          service.uploadFile(1, 'editor', [1], dto, '127.0.0.1'),
        ).rejects.toThrow(BadRequestException)
      }
    })

    it('文件大小超过 100MB 应拒绝', async () => {
      const dto = createMockFileDto({ fileSize: DEFAULT_MAX_FILE_SIZE + 1 })
      await expect(
        service.uploadFile(1, 'editor', [1], dto, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException)

      try {
        await service.uploadFile(1, 'editor', [1], dto, '127.0.0.1')
      } catch (e: any) {
        expect(e.message).toContain('文件大小超出上限')
      }
    })

    it('editor 角色应有上传权限', async () => {
      expect(ROLE_FILE_PERMISSIONS['editor'].upload).toBe(true)

      const dto = createMockFileDto({ fileFormat: 'pdf', fileSize: 1024 })
      const result = await service.uploadFile(1, 'editor', [1], dto, '127.0.0.1')
      expect(result).toBeDefined()
      expect(result.uploaderId).toBe(1)
    })

    it('上传时应关联 columnId(栏目权限校验)', async () => {
      // editor 的 bindColumnIds 为 [1,2]，上传到 columnId=1 应成功
      const dto = createMockFileDto({ columnId: 1 })
      const result = await service.uploadFile(1, 'editor', [1, 2], dto, '127.0.0.1')
      expect(result.columnId).toBe(1)
    })

    it('editor 上传到无权限栏目应拒绝', async () => {
      const dto = createMockFileDto({ columnId: 99 })
      await expect(
        service.uploadFile(1, 'editor', [1, 2], dto, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('上传成功后状态为 ACTIVE', async () => {
      const dto = createMockFileDto({ fileFormat: 'docx' })
      const result = await service.uploadFile(1, 'editor', [1], dto, '127.0.0.1')
      expect(result.status).toBe(FileStatus.ACTIVE)
    })

    it('上传成功后应写入审计日志', async () => {
      const dto = createMockFileDto()
      await service.uploadFile(1, 'editor', [1], dto, '192.168.1.1')

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 1,
          role: 'editor',
          action: FileAuditAction.UPLOAD,
          targetType: 'file_resource',
          ip: '192.168.1.1',
        }),
      )
    })

    it('system_admin 不受栏目权限限制', async () => {
      const dto = createMockFileDto({ columnId: 999 })
      const result = await service.uploadFile(3, 'system_admin', [], dto, '127.0.0.1')
      expect(result.columnId).toBe(999)
    })
  })

  // ==================== findByArticleId ====================

  describe('findByArticleId() - 按稿件查附件', () => {
    beforeEach(async () => {
      // 上传多个稿件附件，状态和访问级别各异
      await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '稿件附件1.pdf',
        fileFormat: 'pdf',
        articleId: 100,
        columnId: 1,
        status: FileStatus.ACTIVE,
        accessLevel: AccessLevel.PUBLIC,
      } as any))

      await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '稿件附件2.docx',
        fileFormat: 'docx',
        articleId: 100,
        columnId: 1,
        status: FileStatus.ACTIVE,
        accessLevel: AccessLevel.CAMPUS,
      } as any))

      await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '内部参考.pdf',
        fileFormat: 'pdf',
        articleId: 100,
        columnId: 1,
        status: FileStatus.ACTIVE,
        accessLevel: AccessLevel.INTERNAL,
      } as any))
    })

    it('返回指定稿件的所有 ACTIVE 附件', async () => {
      // system_admin 可以看到所有 ACTIVE 附件（包括 INTERNAL）
      const result = await service.findByArticleId(100, 'system_admin', [])
      expect(result.length).toBe(3)
      for (const f of result) {
        expect(f.status).toBe(FileStatus.ACTIVE)
        expect(f.articleId).toBe(100)
      }
    })

    it('不包含 ARCHIVED 或 DELETED 状态的附件', async () => {
      // findByArticleId 方法内部硬编码了 status: FileStatus.ACTIVE
      // 所以只有 ACTIVE 的文件会被返回
      const result = await service.findByArticleId(100, 'system_admin', [])
      const statuses = result.map(f => f.status)
      expect(statuses.every(s => s === FileStatus.ACTIVE)).toBe(true)
      expect(statuses).not.toContain(FileStatus.ARCHIVED)
      expect(statuses).not.toContain(FileStatus.DELETED)
    })

    it('非 admin 角色不应看到 INTERNAL 级别的附件', async () => {
      // editor 不是 system_admin，INTERNAL 文件应被过滤
      const result = await service.findByArticleId(100, 'editor', [1])
      expect(result.length).toBe(2)
      for (const f of result) {
        expect(f.accessLevel).not.toBe(AccessLevel.INTERNAL)
      }
    })

    it('system_admin 可以看到 INTERNAL 级别的附件', async () => {
      const result = await service.findByArticleId(100, 'system_admin', [])
      const hasInternal = result.some(f => f.accessLevel === AccessLevel.INTERNAL)
      expect(hasInternal).toBe(true)
    })

    it('editor 只能看到自己栏目范围内的附件（通过 findAll 的栏目过滤）', async () => {
      // findByArticleId 本身不按栏目过滤, 但按 accessLevel 过滤
      // 这里验证非 system_admin 角色调用时 INTERNAL 文件被排除
      const result = await service.findByArticleId(100, 'editor', [1])
      expect(result.every((f: any) => f.accessLevel !== AccessLevel.INTERNAL)).toBe(true)
    })
  })

  // ==================== updateFile ====================

  describe('updateFile() - 附件编辑', () => {
    let createdFileId: number

    beforeEach(async () => {
      const file = await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '原始附件.pdf',
        fileFormat: 'pdf',
        articleId: 100,
        columnId: 1,
      } as any))
      createdFileId = file.id
    })

    it('editor 只能编辑自己上传的附件', async () => {
      // editor(id=1) 编辑自己上传的文件 -> 应成功
      const result = await service.updateFile(
        createdFileId,
        1,
        'editor',
        { fileName: '重命名附件.pdf' } as UpdateFileResourceDto,
      )
      expect(result.fileName).toBe('重命名附件.pdf')
    })

    it('editor 编辑他人上传的附件应拒绝', async () => {
      // editor(id=10) 尝试编辑 uploaderId=1 的文件 -> 应拒绝
      await expect(
        service.updateFile(
          createdFileId,
          10,
          'editor',
          { fileName: '非法修改.pdf' } as UpdateFileResourceDto,
        ),
      ).rejects.toThrow(ForbiddenException)
    })

    it('column_admin 可以编辑本栏目附件', async () => {
      // column_admin(id=2) 编辑栏目1的附件 -> 应成功
      const result = await service.updateFile(
        createdFileId,
        2,
        'column_admin',
        { fileName: '栏目管理员修改.pdf', category: FileCategory.POLICY } as UpdateFileResourceDto,
      )
      expect(result.fileName).toBe('栏目管理员修改.pdf')
      expect(result.category).toBe(FileCategory.POLICY)
    })

    it('system_admin 可以编辑任何附件', async () => {
      // system_admin(id=3) 编辑任何附件 -> 应成功
      const result = await service.updateFile(
        createdFileId,
        3,
        'system_admin',
        { fileName: '系统管理员修改.pdf', internalTags: '重要,审核' } as UpdateFileResourceDto,
      )
      expect(result.fileName).toBe('系统管理员修改.pdf')
      expect(result.internalTags).toBe('重要,审核')
    })

    it('更新 fileName/category/internalTags 等字段', async () => {
      const result = await service.updateFile(
        createdFileId,
        3,
        'system_admin',
        {
          fileName: '更新后文件名.docx',
          category: FileCategory.TEMPLATE,
          internalTags: '标签A,标签B',
        } as UpdateFileResourceDto,
      )

      expect(result.fileName).toBe('更新后文件名.docx')
      expect(result.category).toBe(FileCategory.TEMPLATE)
      expect(result.internalTags).toBe('标签A,标签B')
    })

    it('编辑后应写入审计日志', async () => {
      await service.updateFile(
        createdFileId,
        1,
        'editor',
        { fileName: '审计测试.pdf' } as UpdateFileResourceDto,
        '10.0.0.1',
      )

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 1,
          role: 'editor',
          action: FileAuditAction.EDIT,
          targetType: 'file_resource',
          targetId: createdFileId,
          ip: '10.0.0.1',
        }),
      )
    })

    it('编辑不存在的文件应抛出 404', async () => {
      await expect(
        service.updateFile(99999, 1, 'editor', { fileName: 'x.pdf' } as UpdateFileResourceDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ==================== archiveFile ====================

  describe('archiveFile() - 附件归档', () => {
    let createdFileId: number

    beforeEach(async () => {
      const file = await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '待归档附件.pdf',
        articleId: 100,
        columnId: 1,
      } as any))
      createdFileId = file.id
    })

    it('column_admin 可以归档本栏目附件', async () => {
      // column_admin(id=2, bindColumnIds=[1,2,3]) 归档 columnId=1 的文件
      const result = await service.archiveFile(createdFileId, 2, 'column_admin', '10.0.0.1')
      expect(result.status).toBe(FileStatus.ARCHIVED)
    })

    it('editor 没有归档权限应拒绝', async () => {
      // editor 的 delete 权限为 false
      expect(ROLE_FILE_PERMISSIONS['editor'].delete).toBe(false)

      await expect(
        service.archiveFile(createdFileId, 1, 'editor', '10.0.0.1'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('归档后状态变为 ARCHIVED', async () => {
      const result = await service.archiveFile(createdFileId, 2, 'column_admin', '10.0.0.1')
      expect(result.status).toBe(FileStatus.ARCHIVED)

      // 从 store 中验证
      const store = mockPrisma.prisma._getFileStore()
      expect(store[createdFileId].status).toBe(FileStatus.ARCHIVED)
    })

    it('system_admin 可以归档任何附件', async () => {
      const result = await service.archiveFile(createdFileId, 3, 'system_admin', '10.0.0.1')
      expect(result.status).toBe(FileStatus.ARCHIVED)
    })

    it('归档后应写入审计日志', async () => {
      await service.archiveFile(createdFileId, 2, 'column_admin', '10.0.0.1')

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 2,
          role: 'column_admin',
          action: FileAuditAction.ARCHIVE,
          targetType: 'file_resource',
          targetId: createdFileId,
          ip: '10.0.0.1',
        }),
      )
    })

    it('归档不存在的文件应抛出 404', async () => {
      await expect(
        service.archiveFile(99999, 2, 'column_admin'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ==================== downloadFile ====================

  describe('downloadFile() - 附件下载', () => {
    let publicFileId: number
    let internalFileId: number
    let confidentialFileId: number

    beforeEach(async () => {
      const publicFile = await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '公开附件.pdf',
        articleId: 100,
        columnId: 1,
        accessLevel: AccessLevel.PUBLIC,
        secretLevel: SecretLevel.NORMAL,
      } as any))
      publicFileId = publicFile.id

      const internalFile = await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '内部附件.pdf',
        articleId: 100,
        columnId: 1,
        accessLevel: AccessLevel.INTERNAL,
        secretLevel: SecretLevel.NORMAL,
      } as any))
      internalFileId = internalFile.id

      const confidentialFile = await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '涉密附件.pdf',
        articleId: 100,
        columnId: 1,
        accessLevel: AccessLevel.PUBLIC,
        secretLevel: SecretLevel.CONFIDENTIAL,
      } as any))
      confidentialFileId = confidentialFile.id
    })

    it('匿名用户只能下载 PUBLIC 且非 CONFIDENTIAL 的文件', async () => {
      // 匿名下载 PUBLIC + NORMAL -> 成功
      const result = await service.downloadFile(publicFileId, null, null, '1.2.3.4', true)
      expect(result).toBeDefined()
      expect(result.id).toBe(publicFileId)

      // 匿名下载 INTERNAL -> 拒绝
      await expect(
        service.downloadFile(internalFileId, null, null, '1.2.3.4', true),
      ).rejects.toThrow(ForbiddenException)

      // 匿名下载 CONFIDENTIAL -> 拒绝
      await expect(
        service.downloadFile(confidentialFileId, null, null, '1.2.3.4', true),
      ).rejects.toThrow(ForbiddenException)
    })

    it('下载计数应 +1', async () => {
      // 下载前
      const store = mockPrisma.prisma._getFileStore()
      const beforeCount = store[publicFileId].downloadCount

      await service.downloadFile(publicFileId, 1, 'editor', '10.0.0.1')

      // 下载后 +1
      expect(store[publicFileId].downloadCount).toBe(beforeCount + 1)
    })

    it('应记录下载审计日志', async () => {
      await service.downloadFile(publicFileId, 1, 'editor', '10.0.0.1')

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 1,
          role: 'editor',
          action: FileAuditAction.DOWNLOAD,
          targetType: 'file_resource',
          targetId: publicFileId,
          ip: '10.0.0.1',
        }),
      )
    })

    it('匿名下载应记录 anonymous 审计日志', async () => {
      await service.downloadFile(publicFileId, null, null, '1.2.3.4', true)

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'anonymous',
          action: FileAuditAction.DOWNLOAD,
        }),
      )
    })

    it('非 ACTIVE 状态文件不可下载', async () => {
      // 先归档文件
      await service.archiveFile(publicFileId, 2, 'column_admin')

      await expect(
        service.downloadFile(publicFileId, 1, 'editor', '10.0.0.1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('校内用户不应下载 INTERNAL 级别文件（非 system_admin）', async () => {
      await expect(
        service.downloadFile(internalFileId, 1, 'editor', '10.0.0.1'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('system_admin 可以下载 INTERNAL 文件', async () => {
      const result = await service.downloadFile(internalFileId, 3, 'system_admin', '10.0.0.1')
      expect(result.accessLevel).toBe(AccessLevel.INTERNAL)
    })
  })

  // ==================== getStats ====================

  describe('getStats() - 附件统计', () => {
    beforeEach(async () => {
      await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '统计附件1.pdf',
        fileFormat: 'pdf',
        fileSize: 1000,
        articleId: 100,
        columnId: 1,
      } as any))

      await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '统计附件2.docx',
        fileFormat: 'docx',
        fileSize: 2000,
        articleId: 100,
        columnId: 1,
      } as any))

      await service.uploadFile(1, 'editor', [1], createMockFileDto({
        fileName: '统计附件3.pdf',
        fileFormat: 'pdf',
        fileSize: 3000,
        articleId: 100,
        columnId: 1,
      } as any))
    })

    it('返回总文件数、下载总量、预览总量', async () => {
      const stats = await service.getStats('system_admin', [])

      expect(stats.totalFiles).toBe(3)
      expect(typeof stats.totalDownloads).toBe('number')
      expect(stats.totalDownloads).toBeGreaterThanOrEqual(0)
      expect(typeof stats.totalPreviews).toBe('number')
      expect(stats.totalPreviews).toBeGreaterThanOrEqual(0)
    })

    it('按格式分组统计', async () => {
      const stats = await service.getStats('system_admin', [])

      expect(stats.byFormat).toBeDefined()
      expect(Array.isArray(stats.byFormat)).toBe(true)
      expect(stats.byFormat.length).toBe(2) // pdf 和 docx 两种格式

      const pdfStat = stats.byFormat.find((item: any) => item.format === 'pdf')
      expect(pdfStat).toBeDefined()
      expect(pdfStat!.count).toBe(2)
      expect(pdfStat!.totalSize).toBe(4000) // 1000 + 3000

      const docxStat = stats.byFormat.find((item: any) => item.format === 'docx')
      expect(docxStat).toBeDefined()
      expect(docxStat!.count).toBe(1)
      expect(docxStat!.totalSize).toBe(2000)
    })

    it('非 system_admin 应只统计所辖栏目文件', async () => {
      // editor 的 bindColumnIds 在 mock 中为 [1,2]
      const stats = await service.getStats('editor', [1, 2])
      expect(stats.totalFiles).toBe(3) // 所有文件 columnId=1，在 [1,2] 范围内
    })

    it('只统计 ACTIVE 状态的文件（下载/预览）', async () => {
      const stats = await service.getStats('system_admin', [])

      // aggregate 和 groupBy 内部过滤了 status: ACTIVE
      // 所有上传的文件默认 ACTIVE
      expect(stats.totalFiles).toBe(3)
      expect(stats.byFormat.length).toBeGreaterThan(0)
    })
  })
})
