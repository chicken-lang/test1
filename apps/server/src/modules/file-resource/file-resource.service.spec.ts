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
  PREVIEWABLE_FORMATS,
  DEFAULT_MAX_FILE_SIZE,
  ROLE_FILE_PERMISSIONS,
  FileAuditAction,
} from './file-resource.constants.js'
import type {
  CreateFileResourceDto,
  UpdateFileResourceDto,
  UpdateFilePermissionDto,
} from './dto/file-resource.dto.js'

// ==================== 测试辅助 ====================

const baseFile = {
  id: 1,
  fileName: 'test.pdf',
  storagePath: '/file_resources/test.pdf',
  fileSize: 1024000,
  fileFormat: 'pdf',
  mimeType: 'application/pdf',
  columnId: 1,
  articleId: null as number | null,
  category: FileCategory.NOTICE,
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
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

// ==================== Mock 工具 ====================

let _idCounter = 1000

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
      if (where?.fileName?.contains) results = results.filter((r) => r.fileName.includes(where.fileName.contains))
      if (where?.OR) {
        results = results.filter((r: any) => {
          return where.OR.some((cond: any) => {
            if (cond.fileName?.contains) return r.fileName.includes(cond.fileName.contains)
            if (cond.internalTags?.contains) return r.internalTags?.includes(cond.internalTags.contains)
            return false
          })
        })
      }
      if (where?.updatedAt?.lt) results = results.filter((r) => r.updatedAt < where.updatedAt.lt)

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
      if (where?.fileName?.contains) results = results.filter((r) => r.fileName.includes(where.fileName.contains))
      if (where?.internalTags?.contains) results = results.filter((r) => r.internalTags?.includes(where.internalTags.contains))
      if (where?.OR) {
        results = results.filter((r: any) => {
          return where.OR.some((cond: any) => {
            if (cond.fileName?.contains) return r.fileName.includes(cond.fileName.contains)
            if (cond.internalTags?.contains) return r.internalTags?.includes(cond.internalTags.contains)
            return false
          })
        })
      }
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
        return Promise.resolve({ id: where?.id, bindColumnIds: '[1,2,3]' })
      }),
    },
    _getFileStore: () => fileStore,
    _resetStore: () => { fileStore = {} },
  }

  return {
    prisma,
    reset: () => {
      _idCounter = 1000
      prisma._resetStore()
    },
  }
}

// ==================== 测试套件 ====================

describe('FileResourceService', () => {
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

  // ==================== 文件上传测试 ====================

  describe('uploadFile', () => {
    const validDto: CreateFileResourceDto = {
      fileName: '测试文件.pdf',
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

    it('应该成功上传文件', async () => {
      const result = await service.uploadFile(1, 'editor', [1], validDto, '127.0.0.1')
      expect(result).toBeDefined()
      expect(result.fileName).toBe('测试文件.pdf')
      expect(result.fileFormat).toBe('pdf')
      expect(result.accessLevel).toBe(AccessLevel.PUBLIC)
      expect(result.status).toBe(FileStatus.ACTIVE)
      expect(result.uploaderId).toBe(1)
      expect(result.id).toBeGreaterThan(1000)
    })

    it('应该写入审计日志', async () => {
      await service.uploadFile(1, 'editor', [1], validDto, '127.0.0.1')
      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: FileAuditAction.UPLOAD,
          targetType: 'file_resource',
          adminId: 1,
          role: 'editor',
          ip: '127.0.0.1',
        })
      )
    })

    it('非系统管理员上传到无权限栏目应抛出 403', async () => {
      await expect(
        service.uploadFile(1, 'editor', [2], { ...validDto, columnId: 1 }, '127.0.0.1')
      ).rejects.toThrow(ForbiddenException)
    })

    it('系统管理员应该拥有全部栏目上传权限', async () => {
      const result = await service.uploadFile(1, 'system_admin', [], { ...validDto, columnId: 999 }, '127.0.0.1')
      expect(result).toBeDefined()
    })

    it('上传 .exe 文件应被拒绝', async () => {
      await expect(
        service.uploadFile(1, 'editor', [1], { ...validDto, fileFormat: 'exe', fileName: 'test.exe' }, '127.0.0.1')
      ).rejects.toThrow(BadRequestException)
    })

    it('上传 .bat 文件应被拒绝', async () => {
      await expect(
        service.uploadFile(1, 'editor', [1], { ...validDto, fileFormat: 'bat', fileName: 'test.bat' }, '127.0.0.1')
      ).rejects.toThrow(BadRequestException)
    })

    it('超过大小限制应抛出异常', async () => {
      await expect(
        service.uploadFile(1, 'editor', [1], { ...validDto, fileSize: DEFAULT_MAX_FILE_SIZE + 1 }, '127.0.0.1')
      ).rejects.toThrow(BadRequestException)
    })

    it('默认访问级别为 PUBLIC', async () => {
      const result = await service.uploadFile(1, 'editor', [1], { ...validDto, accessLevel: undefined }, '127.0.0.1')
      expect(result.accessLevel).toBe(AccessLevel.PUBLIC)
    })

    it('默认密级为 NORMAL', async () => {
      const result = await service.uploadFile(1, 'editor', [1], { ...validDto, secretLevel: undefined }, '127.0.0.1')
      expect(result.secretLevel).toBe(SecretLevel.NORMAL)
    })
  })

  // ==================== 文件查询测试 ====================

  describe('findAll', () => {
    beforeEach(async () => {
      await service.uploadFile(1, 'editor', [1], {
        ...baseFile as any,
        fileName: '文件1.pdf',
        fileFormat: 'pdf',
        category: FileCategory.NOTICE,
        accessLevel: AccessLevel.PUBLIC,
        columnId: 1,
      } as any)
      await service.uploadFile(2, 'column_admin', [2], {
        ...baseFile as any,
        fileName: '文件2.docx',
        fileFormat: 'docx',
        category: FileCategory.MATERIAL,
        accessLevel: AccessLevel.CAMPUS,
        columnId: 2,
      } as any)
      await service.uploadFile(3, 'system_admin', [], {
        ...baseFile as any,
        fileName: '文件3.xlsx',
        fileFormat: 'xlsx',
        category: FileCategory.TEMPLATE,
        accessLevel: AccessLevel.INTERNAL,
        columnId: 3,
      } as any)
    })

    it('系统管理员应能看到所有文件', async () => {
      const result = await service.findAll(1, 'system_admin', [], { page: 1, pageSize: 10 })
      expect(result.total).toBe(3)
    })

    it('非系统管理员不应看到 INTERNAL 文件', async () => {
      const result = await service.findAll(1, 'editor', [1], { page: 1, pageSize: 10 })
      expect(result.list.every((f: any) => f.accessLevel !== AccessLevel.INTERNAL)).toBe(true)
    })

    it('按栏目过滤', async () => {
      const result = await service.findAll(1, 'system_admin', [], { page: 1, pageSize: 10, columnId: 1 })
      expect(result.list.length).toBe(1)
      expect(result.list[0].columnId).toBe(1)
    })

    it('按分类过滤', async () => {
      const result = await service.findAll(1, 'system_admin', [], { page: 1, pageSize: 10, category: FileCategory.MATERIAL })
      expect(result.list.length).toBe(1)
    })

    it('按格式过滤', async () => {
      const result = await service.findAll(1, 'system_admin', [], { page: 1, pageSize: 10, fileFormat: 'pdf' })
      expect(result.list.length).toBe(1)
      expect(result.list[0].fileFormat).toBe('pdf')
    })

    it('关键字搜索', async () => {
      const result = await service.findAll(1, 'system_admin', [], { page: 1, pageSize: 10, keyword: '文件1' })
      expect(result.total).toBe(1)
    })

    it('分页功能', async () => {
      const result1 = await service.findAll(1, 'system_admin', [], { page: 1, pageSize: 2 })
      expect(result1.list.length).toBe(2)
      expect(result1.total).toBe(3)

      const result2 = await service.findAll(1, 'system_admin', [], { page: 2, pageSize: 2 })
      expect(result2.list.length).toBe(1)
    })
  })

  describe('findById', () => {
    let createdFile: any

    beforeEach(async () => {
      createdFile = await service.uploadFile(1, 'editor', [1], {
        ...baseFile as any,
        fileName: 'find-me.pdf',
      } as any)
    })

    it('应该根据ID找到文件', async () => {
      const result = await service.findById(createdFile.id, 'editor', [1])
      expect(result.fileName).toBe('find-me.pdf')
    })

    it('不存在的文件应抛出 404', async () => {
      await expect(
        service.findById(9999, 'editor', [1])
      ).rejects.toThrow(NotFoundException)
    })

    it('非系统管理员访问无权限栏目文件应抛出 403', async () => {
      await expect(
        service.findById(createdFile.id, 'editor', [99])
      ).rejects.toThrow(ForbiddenException)
    })

    it('访问 INTERNAL 级别文件应抛出 403', async () => {
      const internalFile = await service.uploadFile(1, 'system_admin', [], {
        ...baseFile as any,
        accessLevel: AccessLevel.INTERNAL,
        columnId: null,
      } as any)
      await expect(
        service.findById(internalFile.id, 'editor', [])
      ).rejects.toThrow(ForbiddenException)
    })

    it('系统管理员应能访问任何文件', async () => {
      const internalFile = await service.uploadFile(1, 'system_admin', [], {
        ...baseFile as any,
        accessLevel: AccessLevel.INTERNAL,
      } as any)
      const result = await service.findById(internalFile.id, 'system_admin', [])
      expect(result.accessLevel).toBe(AccessLevel.INTERNAL)
    })
  })

  // ==================== 文件编辑测试 ====================

  describe('updateFile', () => {
    let createdFile: any

    beforeEach(async () => {
      createdFile = await service.uploadFile(1, 'editor', [1], {
        ...baseFile as any,
        fileName: 'original.pdf',
      } as any)
    })

    it('编辑自己的文件应成功', async () => {
      const result = await service.updateFile(createdFile.id, 1, 'editor', { fileName: 'renamed.pdf' } as UpdateFileResourceDto)
      expect(result.fileName).toBe('renamed.pdf')
    })

    it('编辑他人文件 (editor) 应抛出 403', async () => {
      await expect(
        service.updateFile(createdFile.id, 2, 'editor', { fileName: 'stolen.pdf' } as UpdateFileResourceDto)
      ).rejects.toThrow(ForbiddenException)
    })

    it('栏目管理员应能编辑本栏目文件', async () => {
      const result = await service.updateFile(createdFile.id, 2, 'column_admin', { fileName: 'edited.pdf' } as UpdateFileResourceDto)
      expect(result.fileName).toBe('edited.pdf')
    })

    it('系统管理员应能编辑任何文件', async () => {
      const result = await service.updateFile(createdFile.id, 99, 'system_admin', { fileName: 'admin-edit.pdf' } as UpdateFileResourceDto)
      expect(result.fileName).toBe('admin-edit.pdf')
    })

    it('编辑不存在的文件应抛出 404', async () => {
      await expect(
        service.updateFile(9999, 1, 'system_admin', { fileName: 'ghost.pdf' } as UpdateFileResourceDto)
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ==================== 文件归档/删除测试 ====================

  describe('archiveFile', () => {
    let createdFile: any

    beforeEach(async () => {
      createdFile = await service.uploadFile(1, 'column_admin', [1], {
        ...baseFile as any,
        fileName: 'to-archive.pdf',
      } as any)
    })

    it('归档后状态应变为 ARCHIVED', async () => {
      const result = await service.archiveFile(createdFile.id, 1, 'column_admin', '127.0.0.1')
      expect(result.status).toBe(FileStatus.ARCHIVED)
    })

    it('editor 不能归档文件', async () => {
      await expect(
        service.archiveFile(createdFile.id, 1, 'editor', '127.0.0.1')
      ).rejects.toThrow(ForbiddenException)
    })

    it('system_admin 可以归档任何文件', async () => {
      const result = await service.archiveFile(createdFile.id, 99, 'system_admin', '127.0.0.1')
      expect(result.status).toBe(FileStatus.ARCHIVED)
    })

    it('归档应写入审计日志', async () => {
      await service.archiveFile(createdFile.id, 1, 'column_admin', '127.0.0.1')
      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: FileAuditAction.ARCHIVE,
          targetType: 'file_resource',
          targetId: createdFile.id,
        })
      )
    })
  })

  describe('physicalDelete', () => {
    let createdFile: any

    beforeEach(async () => {
      createdFile = await service.uploadFile(1, 'system_admin', [], {
        ...baseFile as any,
        fileName: 'to-delete.pdf',
      } as any)
    })

    it('physicalDelete 应将状态标记为 DELETED', async () => {
      const result = await service.physicalDelete(createdFile.id, 1, 'system_admin', '127.0.0.1')
      expect(result.success).toBe(true)
    })

    it('非 system_admin 物理删除应抛出 403', async () => {
      await expect(
        service.physicalDelete(createdFile.id, 1, 'editor', '127.0.0.1')
      ).rejects.toThrow(ForbiddenException)
    })

    it('物理删除应写入审计日志', async () => {
      await service.physicalDelete(createdFile.id, 1, 'system_admin', '127.0.0.1')
      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: FileAuditAction.PHYSICAL_DELETE,
        })
      )
    })
  })

  // ==================== 文件权限配置测试 ====================

  describe('updateFilePermission', () => {
    let createdFile: any

    beforeEach(async () => {
      createdFile = await service.uploadFile(1, 'column_admin', [1], {
        ...baseFile as any,
        fileName: 'perm-file.pdf',
        accessLevel: AccessLevel.PUBLIC,
      } as any)
    })

    it('更新访问级别应成功', async () => {
      const result = await service.updateFilePermission(
        createdFile.id, 1, 'column_admin',
        { accessLevel: AccessLevel.CAMPUS } as UpdateFilePermissionDto,
        '127.0.0.1'
      )
      expect(result.accessLevel).toBe(AccessLevel.CAMPUS)
    })

    it('reviewer 无权配置权限', async () => {
      await expect(
        service.updateFilePermission(
          createdFile.id, 1, 'reviewer',
          { accessLevel: AccessLevel.CAMPUS } as UpdateFilePermissionDto,
          '127.0.0.1'
        )
      ).rejects.toThrow(ForbiddenException)
    })

    it('更新密级应成功', async () => {
      const result = await service.updateFilePermission(
        createdFile.id, 1, 'column_admin',
        { accessLevel: AccessLevel.PUBLIC, secretLevel: SecretLevel.CONFIDENTIAL } as UpdateFilePermissionDto,
        '127.0.0.1'
      )
      expect(result.secretLevel).toBe(SecretLevel.CONFIDENTIAL)
    })

    it('更新预览启用状态应成功', async () => {
      const result = await service.updateFilePermission(
        createdFile.id, 1, 'column_admin',
        { accessLevel: AccessLevel.PUBLIC, previewEnabled: false } as UpdateFilePermissionDto,
        '127.0.0.1'
      )
      expect(result.previewEnabled).toBe(false)
    })

    it('system_admin 应能配置任何文件', async () => {
      const result = await service.updateFilePermission(
        createdFile.id, 99, 'system_admin',
        { accessLevel: AccessLevel.INTERNAL } as UpdateFilePermissionDto,
        '127.0.0.1'
      )
      expect(result.accessLevel).toBe(AccessLevel.INTERNAL)
    })
  })

  // ==================== 预览功能测试 ====================

  describe('getPreview', () => {
    let createdFile: any

    beforeEach(async () => {
      createdFile = await service.uploadFile(1, 'editor', [1], {
        ...baseFile as any,
        fileName: 'previewable.pdf',
        fileFormat: 'pdf',
        accessLevel: AccessLevel.PUBLIC,
        previewEnabled: true,
      } as any)

      // 模拟预览缓存已生成
      await mockPrisma.prisma.fileResource.update({
        where: { id: createdFile.id },
        data: { previewCacheKey: 'cached-key-001' },
      })
    })

    it('获取预览应成功', async () => {
      const result = await service.getPreview(createdFile.id, 1, 'editor', 'full', 'desktop', '127.0.0.1')
      expect(result.file).toBeDefined()
      expect(result.mode).toBe('full')
    })

    it('归档文件不可预览', async () => {
      await mockPrisma.prisma.fileResource.update({
        where: { id: createdFile.id },
        data: { status: FileStatus.ARCHIVED },
      })
      await expect(
        service.getPreview(createdFile.id, 1, 'editor', 'full', 'desktop')
      ).rejects.toThrow(BadRequestException)
    })

    it('预览计数应增加', async () => {
      await service.getPreview(createdFile.id, 1, 'editor', 'full', 'desktop', '127.0.0.1')
      const updated = await mockPrisma.prisma.fileResource.findUnique({ where: { id: createdFile.id } })
      expect(updated.previewCount).toBeGreaterThan(0)
    })
  })

  describe('getThumbnail', () => {
    let createdFile: any

    beforeEach(async () => {
      createdFile = await service.uploadFile(1, 'editor', [1], {
        ...baseFile as any,
        fileName: 'thumb.pdf',
        fileFormat: 'pdf',
      } as any)
    })

    it('获取缩略图应成功', async () => {
      const result = await service.getThumbnail(createdFile.id, 'editor', '127.0.0.1')
      expect(result.file).toBeDefined()
    })

    it('不存在的文件应抛出 404', async () => {
      await expect(
        service.getThumbnail(9999, 'editor', '127.0.0.1')
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ==================== 下载功能测试 ====================

  describe('downloadFile', () => {
    let publicFile: any
    let campusFile: any

    beforeEach(async () => {
      publicFile = await service.uploadFile(1, 'editor', [1], {
        ...baseFile as any,
        fileName: 'public.pdf',
        accessLevel: AccessLevel.PUBLIC,
        secretLevel: SecretLevel.NORMAL,
      } as any)

      campusFile = await service.uploadFile(1, 'editor', [1], {
        ...baseFile as any,
        fileName: 'campus.pdf',
        accessLevel: AccessLevel.CAMPUS,
        secretLevel: SecretLevel.NORMAL,
      } as any)
    })

    it('匿名下载公开文件应成功', async () => {
      const result = await service.downloadFile(publicFile.id, null, null, '127.0.0.1', true)
      expect(result).toBeDefined()
    })

    it('匿名下载非公开文件应抛出 403', async () => {
      await expect(
        service.downloadFile(campusFile.id, null, null, '127.0.0.1', true)
      ).rejects.toThrow(ForbiddenException)
    })

    it('匿名下载涉密文件应抛出 403', async () => {
      const confidentialFile = await service.uploadFile(1, 'system_admin', [], {
        ...baseFile as any,
        accessLevel: AccessLevel.PUBLIC,
        secretLevel: SecretLevel.CONFIDENTIAL,
      } as any)
      await expect(
        service.downloadFile(confidentialFile.id, null, null, '127.0.0.1', true)
      ).rejects.toThrow(ForbiddenException)
    })

    it('校内用户下载 PUBLIC 文件应成功', async () => {
      const result = await service.downloadFile(publicFile.id, 1, 'editor', '127.0.0.1', false)
      expect(result).toBeDefined()
    })

    it('下载计数应增加', async () => {
      const before = (await mockPrisma.prisma.fileResource.findUnique({ where: { id: publicFile.id } })).downloadCount
      await service.downloadFile(publicFile.id, null, null, '127.0.0.1', true)
      const after = (await mockPrisma.prisma.fileResource.findUnique({ where: { id: publicFile.id } })).downloadCount
      expect(after).toBeGreaterThan(before)
    })

    it('下载应写入审计日志', async () => {
      await service.downloadFile(publicFile.id, null, null, '127.0.0.1', true)
      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: FileAuditAction.DOWNLOAD,
          targetType: 'file_resource',
        })
      )
    })
  })

  // ==================== 统计功能测试 ====================

  describe('getStats', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await service.uploadFile(1, 'system_admin', [], {
          ...baseFile as any,
          fileName: `stats-file-${i}.pdf`,
          fileFormat: 'pdf',
          downloadCount: i * 10,
          previewCount: i * 5,
        } as any)
      }
    })

    it('应返回正确的统计数据', async () => {
      const files = mockPrisma.prisma._getFileStore()
      const firstFileId = Object.values(files)[0].id
      await service.downloadFile(firstFileId, 1, 'student', '127.0.0.1')
      await service.downloadFile(firstFileId, 1, 'student', '127.0.0.1')
      const store = mockPrisma.prisma._getFileStore()
      store[firstFileId].previewCacheKey = 'cached-key-1'
      await service.getPreview(firstFileId, 1, 'system_admin')
      const stats = await service.getStats('system_admin', [])
      expect(stats).toBeDefined()
      expect(stats.totalFiles).toBeGreaterThan(0)
      expect(stats.totalDownloads).toBeGreaterThan(0)
      expect(stats.totalPreviews).toBeGreaterThan(0)
      expect(Array.isArray(stats.byFormat)).toBe(true)
    })

    it('非系统管理员应按栏目过滤', async () => {
      const stats = await service.getStats('editor', [1])
      expect(stats).toBeDefined()
    })
  })

  // ==================== 系统配置测试 ====================

  describe('getSystemConfig', () => {
    it('应返回默认配置', async () => {
      const config = await service.getSystemConfig()
      expect(config.maxFileSize).toBe(DEFAULT_MAX_FILE_SIZE)
      expect(config.anonymousRateLimit).toBe(10)
      expect(config.executableBlacklist).toEqual(EXECUTABLE_BLACKLIST)
      expect(config.previewableFormats).toEqual(PREVIEWABLE_FORMATS)
    })
  })

  // ==================== 按稿件查询附件 ====================

  describe('findByArticleId', () => {
    beforeEach(async () => {
      await service.uploadFile(1, 'editor', [1], {
        ...baseFile as any,
        fileName: 'attached-to-article.pdf',
        articleId: 100,
      } as any)
      await service.uploadFile(1, 'editor', [1], {
        ...baseFile as any,
        fileName: 'standalone.pdf',
        articleId: null,
      } as any)
    })

    it('应只返回指定稿件的附件', async () => {
      const files = await service.findByArticleId(100, 'editor', [1])
      expect(files.length).toBe(1)
      expect(files[0].articleId).toBe(100)
    })

    it('无附件的稿件应返回空列表', async () => {
      const files = await service.findByArticleId(999, 'editor', [1])
      expect(files.length).toBe(0)
    })
  })

  // ==================== 自动归档测试 ====================

  describe('autoArchiveInactiveFiles', () => {
    it('应归档超过180天未更新的活跃文件', async () => {
      const result = await service.autoArchiveInactiveFiles()
      expect(result).toBeDefined()
      expect(typeof result.archivedCount).toBe('number')
    })
  })

  // ==================== 边界测试 ====================

  describe('边界场景', () => {
    it('创建文件时可选字段为空应正常处理', async () => {
      const dto = {
        fileName: 'minimal.pdf',
        storagePath: '/files/minimal.pdf',
        fileSize: 100,
        fileFormat: 'pdf',
        mimeType: 'application/pdf',
      } as any
      const result = await service.uploadFile(1, 'editor', [1], dto, '127.0.0.1')
      expect(result).toBeDefined()
      expect(result.columnId).toBeNull()
      expect(result.articleId).toBeNull()
      expect(result.accessLevel).toBe(AccessLevel.PUBLIC)
    })

    it('文件名特殊字符应能正常保存', async () => {
      const dto = {
        fileName: '测试 (2024) [最终版].pdf',
        storagePath: '/files/special.pdf',
        fileSize: 100,
        fileFormat: 'pdf',
        mimeType: 'application/pdf',
      } as any
      const result = await service.uploadFile(1, 'system_admin', [], dto, '127.0.0.1')
      expect(result.fileName).toBe('测试 (2024) [最终版].pdf')
    })

    it('批量操作 - 多文件上传后列表正确', async () => {
      for (let i = 0; i < 3; i++) {
        await service.uploadFile(1, 'system_admin', [], {
          ...baseFile as any,
          fileName: `batch-${i}.pdf`,
        } as any)
      }
      const list = await service.findAll(1, 'system_admin', [], { page: 1, pageSize: 10 })
      expect(list.total).toBe(3)
    })
  })
})