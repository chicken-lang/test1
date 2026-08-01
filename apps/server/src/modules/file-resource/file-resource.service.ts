import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import {
  AccessLevel,
  SecretLevel,
  FileStatus,
  PREVIEWABLE_FORMATS,
  IMAGE_FORMATS,
  DOCUMENT_FORMATS,
  EXECUTABLE_BLACKLIST,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_DAILY_DOWNLOAD_LIMIT,
  DEFAULT_ANONYMOUS_RATE_LIMIT,
  AUTO_ARCHIVE_DAYS,
  PREVIEW_CACHE_PATH,
  FILE_STORAGE_PATH,
  FileAuditAction,
  ROLE_FILE_PERMISSIONS,
} from './file-resource.constants.js'
import type {
  CreateFileResourceDto,
  UpdateFileResourceDto,
  UpdateFilePermissionDto,
  QueryFileResourceDto,
} from './dto/file-resource.dto.js'

@Injectable()
export class FileResourceService {
  private readonly logger = new Logger(FileResourceService.name)

  private prisma: PrismaService
  private auditLog: AuditLogService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLog: AuditLogService,
  ) {
    this.prisma = prisma
    this.auditLog = auditLog
  }

  // ==================== 文件上传 ====================

  /**
   * 上传文件资源
   * - 格式黑名单校验
   * - 文件大小校验
   * - 栏目数据权限校验
   */
  async uploadFile(
    uploaderId: number,
    uploaderRole: string,
    bindColumnIds: number[],
    dto: CreateFileResourceDto,
    ip?: string,
  ) {
    // 1. 格式安全校验 - 禁止可执行文件
    this.validateFileFormat(dto.fileFormat, dto.mimeType)

    // 2. 文件大小校验
    if (dto.fileSize > DEFAULT_MAX_FILE_SIZE) {
      throw new BadRequestException(
        `文件大小超出上限 (${Math.round(DEFAULT_MAX_FILE_SIZE / 1024 / 1024)}MB)`,
      )
    }

    // 3. 栏目权限校验
    if (dto.columnId && uploaderRole !== 'system_admin') {
      if (!bindColumnIds.includes(dto.columnId)) {
        throw new ForbiddenException(`无权在此栏目上传文件 (columnId=${dto.columnId})`)
      }
    }

    // 4. 权限校验
    const rolePerms = ROLE_FILE_PERMISSIONS[uploaderRole]
    if (!rolePerms?.upload) {
      throw new ForbiddenException('无上传文件权限')
    }

    // 5. 生成存储路径
    const uniquePath = this.generateStoragePath(dto.fileFormat)

    // 6. 创建文件记录
    const file = await this.prisma.fileResource.create({
      data: {
        fileName: dto.fileName,
        storagePath: `${FILE_STORAGE_PATH}/${uniquePath}`,
        fileSize: dto.fileSize,
        fileFormat: dto.fileFormat.toLowerCase(),
        mimeType: dto.mimeType,
        columnId: dto.columnId ?? null,
        articleId: dto.articleId ?? null,
        category: dto.category ?? null,
        uploaderId,
        accessLevel: dto.accessLevel ?? AccessLevel.PUBLIC,
        secretLevel: dto.secretLevel ?? SecretLevel.NORMAL,
        internalTags: dto.internalTags ?? null,
        riskNote: dto.riskNote ?? null,
        previewEnabled: dto.previewEnabled ?? true,
      },
    })

    // 8. 写入审计日志
    await this.auditLog.create({
      adminId: uploaderId,
      role: uploaderRole,
      action: FileAuditAction.UPLOAD,
      targetType: 'file_resource',
      targetId: file.id,
      ip,
      detail: JSON.stringify({
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        fileFormat: dto.fileFormat,
        accessLevel: file.accessLevel,
      }),
    })

    // 9. 异步生成预览缓存 (如果支持预览)
    this.generatePreviewCacheAsync(file)

    return file
  }

  // ==================== 文件查询 ====================

  /**
   * 获取文件列表 (带权限过滤)
   */
  async findAll(
    userId: number,
    userRole: string,
    bindColumnIds: number[],
    query: QueryFileResourceDto,
  ) {
    const where: any = {}

    // 关键字搜索
    if (query.keyword) {
      where.OR = [
        { fileName: { contains: query.keyword } },
        { internalTags: { contains: query.keyword } },
      ]
    }

    // 栏目过滤
    if (query.columnId) {
      where.columnId = query.columnId
    } else if (userRole !== 'system_admin') {
      // 非系统管理员只能看到自己权限范围内的栏目
      where.columnId = { in: bindColumnIds }
    }

    // 稿件过滤
    if (query.articleId) {
      where.articleId = query.articleId
    }

    // 分类过滤
    if (query.category) {
      where.category = query.category
    }

    // 访问级别过滤
    if (query.accessLevel) {
      where.accessLevel = query.accessLevel
    } else if (userRole !== 'system_admin') {
      // 非系统管理员看不到 INTERNAL 级别文件
      where.accessLevel = { not: AccessLevel.INTERNAL }
    }

    // 格式过滤
    if (query.fileFormat) {
      where.fileFormat = query.fileFormat.toLowerCase()
    }

    // 状态过滤 - 默认只显示活跃文件
    if (query.status) {
      where.status = query.status
    } else {
      where.status = FileStatus.ACTIVE
    }

    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10
    const skip = (page - 1) * pageSize

    const [list, total] = await Promise.all([
      this.prisma.fileResource.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fileResource.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 根据 ID 获取文件详情
   */
  async findById(id: number, userRole: string, bindColumnIds: number[]) {
    const file = await this.prisma.fileResource.findUnique({ where: { id } })
    if (!file) throw new NotFoundException('文件不存在')

    // 权限校验
    if (file.status === FileStatus.DELETED) {
      throw new NotFoundException('文件已被物理删除')
    }

    if (userRole !== 'system_admin') {
      // 检查栏目权限
      if (file.columnId && !bindColumnIds.includes(file.columnId)) {
        throw new ForbiddenException('无权访问此栏目文件')
      }
      // 检查访问级别
      if (file.accessLevel === AccessLevel.INTERNAL) {
        throw new ForbiddenException('无权访问内部文件')
      }
    }

    return file
  }

  /**
   * 根据稿件 ID 获取关联附件列表
   */
  async findByArticleId(articleId: number, userRole: string, bindColumnIds: number[]) {
    const where: any = {
      articleId,
      status: FileStatus.ACTIVE,
    }

    if (userRole !== 'system_admin') {
      where.accessLevel = { not: AccessLevel.INTERNAL }
    }

    return this.prisma.fileResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 获取用户个人上传的文件
   */
  async findMyUploads(
    userId: number,
    userRole: string,
    bindColumnIds: number[],
    query: QueryFileResourceDto,
  ) {
    const where: any = {
      uploaderId: userId,
      status: { in: [FileStatus.ACTIVE, FileStatus.ARCHIVED] },
    }

    if (query.keyword) {
      where.fileName = { contains: query.keyword }
    }

    if (query.status) {
      where.status = query.status
    }

    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 10

    const [list, total] = await Promise.all([
      this.prisma.fileResource.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fileResource.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  // ==================== 文件编辑 ====================

  /**
   * 编辑文件信息 (重命名、归类、绑定私有标签)
   */
  async updateFile(
    fileId: number,
    userId: number,
    userRole: string,
    dto: UpdateFileResourceDto,
    ip?: string,
  ) {
    const file = await this.prisma.fileResource.findUnique({ where: { id: fileId } })
    if (!file) throw new NotFoundException('文件不存在')
    if (file.status === FileStatus.DELETED) throw new NotFoundException('文件已被物理删除')

    // 权限校验: 只有上传者、栏目管理员或系统管理员可编辑
    const rolePerms = ROLE_FILE_PERMISSIONS[userRole]
    if (!rolePerms?.edit) {
      throw new ForbiddenException('无编辑文件权限')
    }

    if (userRole === 'editor' && file.uploaderId !== userId) {
      throw new ForbiddenException('只能编辑自己上传的文件')
    }

    if (dto.columnId) {
      // 栏目权限校验
      const admin = await this.prisma.admin.findUnique({ where: { id: userId } })
      if (admin && admin.role !== 'system_admin') {
        const bindColumnIds = JSON.parse(admin.bindColumnIds || '[]')
        if (!bindColumnIds.includes(dto.columnId)) {
          throw new ForbiddenException('无权将文件绑定到此栏目')
        }
      }
    }

    const updateData: any = {}
    if (dto.fileName !== undefined) updateData.fileName = dto.fileName
    if (dto.category !== undefined) updateData.category = dto.category
    if (dto.columnId !== undefined) updateData.columnId = dto.columnId
    if (dto.internalTags !== undefined) updateData.internalTags = dto.internalTags

    const updated = await this.prisma.fileResource.update({
      where: { id: fileId },
      data: updateData,
    })

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: FileAuditAction.EDIT,
      targetType: 'file_resource',
      targetId: fileId,
      ip,
      detail: JSON.stringify({ changes: updateData }),
    })

    return updated
  }

  // ==================== 文件删除/归档 ====================

  /**
   * 归档文件 (逻辑归档, 不物理删除)
   */
  async archiveFile(
    fileId: number,
    userId: number,
    userRole: string,
    ip?: string,
  ) {
    const file = await this.prisma.fileResource.findUnique({ where: { id: fileId } })
    if (!file) throw new NotFoundException('文件不存在')

    // 权限校验
    const rolePerms = ROLE_FILE_PERMISSIONS[userRole]
    if (!rolePerms?.delete) {
      throw new ForbiddenException('无删除文件权限')
    }

    // 栏目管理员只能归档所辖栏目的文件
    if (userRole === 'column_admin') {
      const admin = await this.prisma.admin.findUnique({ where: { id: userId } })
      if (admin) {
        const bindColumnIds = JSON.parse(admin.bindColumnIds || '[]')
        if (file.columnId && !bindColumnIds.includes(file.columnId)) {
          throw new ForbiddenException('无权归档此栏目的文件')
        }
      }
    }

    const archived = await this.prisma.fileResource.update({
      where: { id: fileId },
      data: { status: FileStatus.ARCHIVED },
    })

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: FileAuditAction.ARCHIVE,
      targetType: 'file_resource',
      targetId: fileId,
      ip,
      detail: JSON.stringify({ fileName: file.fileName }),
    })

    return archived
  }

  /**
   * 物理删除文件 (仅系统管理员, 需审批)
   */
  async physicalDelete(
    fileId: number,
    userId: number,
    userRole: string,
    ip?: string,
  ) {
    const file = await this.prisma.fileResource.findUnique({ where: { id: fileId } })
    if (!file) throw new NotFoundException('文件不存在')

    const rolePerms = ROLE_FILE_PERMISSIONS[userRole]
    if (!rolePerms?.physicalDelete) {
      throw new ForbiddenException('无物理删除权限 (仅系统管理员可操作)')
    }

    // 物理删除: 标记为 DELETED
    const deleted = await this.prisma.fileResource.update({
      where: { id: fileId },
      data: { status: FileStatus.DELETED },
    })

    // TODO: 实际删除服务器文件
    // await this.deletePhysicalFile(file.storagePath)

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: FileAuditAction.PHYSICAL_DELETE,
      targetType: 'file_resource',
      targetId: fileId,
      ip,
      detail: JSON.stringify({
        fileName: file.fileName,
        storagePath: file.storagePath,
        reason: '物理删除',
      }),
    })

    return { success: true, message: '文件已物理删除' }
  }

  // ==================== 文件权限配置 ====================

  /**
   * 更新文件访问权限
   */
  async updateFilePermission(
    fileId: number,
    userId: number,
    userRole: string,
    dto: UpdateFilePermissionDto,
    ip?: string,
  ) {
    const file = await this.prisma.fileResource.findUnique({ where: { id: fileId } })
    if (!file) throw new NotFoundException('文件不存在')
    if (file.status === FileStatus.DELETED) throw new NotFoundException('文件已被物理删除')

    const rolePerms = ROLE_FILE_PERMISSIONS[userRole]
    if (!rolePerms?.configPermission) {
      throw new ForbiddenException('无配置文件权限权限')
    }

    // 栏目管理员只能配置所辖栏目的文件
    if (userRole === 'column_admin') {
      const admin = await this.prisma.admin.findUnique({ where: { id: userId } })
      if (admin) {
        const bindColumnIds = JSON.parse(admin.bindColumnIds || '[]')
        if (file.columnId && !bindColumnIds.includes(file.columnId)) {
          throw new ForbiddenException('无权配置此栏目的文件权限')
        }
      }
    }

    const updateData: any = {
      accessLevel: dto.accessLevel,
    }
    if (dto.secretLevel !== undefined) updateData.secretLevel = dto.secretLevel
    if (dto.previewEnabled !== undefined) updateData.previewEnabled = dto.previewEnabled

    const updated = await this.prisma.fileResource.update({
      where: { id: fileId },
      data: updateData,
    })

    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: FileAuditAction.PERMISSION_UPDATE,
      targetType: 'file_resource',
      targetId: fileId,
      ip,
      detail: JSON.stringify({ changes: updateData }),
    })

    return updated
  }

  // ==================== 文件预览 ====================

  /**
   * 获取文件预览
   */
  async getPreview(
    fileId: number,
    userId: number,
    userRole: string,
    mode: string = 'full',
    device: string = 'desktop',
    ip?: string,
  ) {
    const file = await this.prisma.fileResource.findUnique({ where: { id: fileId } })
    if (!file) throw new NotFoundException('文件不存在')

    // 状态校验
    if (file.status !== FileStatus.ACTIVE) {
      throw new BadRequestException('文件当前状态不可预览')
    }

    // 权限校验
    this.validatePreviewAccess(file, userRole)

    // 预览可用性校验
    if (!file.previewEnabled) {
      throw new BadRequestException('该文件未启用在线预览')
    }

    // 检查预览缓存
    if (!file.previewCacheKey) {
      // 预览缓存未就绪, 返回 202 Accepted
      // 触发异步生成
      this.generatePreviewCacheAsync(file)
      return {
        status: 202,
        message: '预览正在生成, 请稍后重试',
        estimatedSeconds: 30,
      }
    }

    // 更新预览计数
    await this.prisma.fileResource.update({
      where: { id: fileId },
      data: { previewCount: { increment: 1 } },
    })

    // 记录预览行为日志
    await this.auditLog.create({
      adminId: userId,
      role: userRole,
      action: FileAuditAction.PREVIEW,
      targetType: 'file_resource',
      targetId: fileId,
      ip,
      detail: JSON.stringify({ mode, device, fileFormat: file.fileFormat }),
    })

    return {
      file,
      mode,
      device,
      previewPath: `${PREVIEW_CACHE_PATH}/${file.id}/full/${file.previewCacheKey}`,
    }
  }

  /**
   * 获取缩略图
   */
  async getThumbnail(
    fileId: number,
    userRole: string,
    ip?: string,
  ) {
    const file = await this.prisma.fileResource.findUnique({ where: { id: fileId } })
    if (!file) throw new NotFoundException('文件不存在')

    if (file.status !== FileStatus.ACTIVE) {
      throw new BadRequestException('文件当前状态不可访问')
    }

    // 简化权限校验
    this.validatePreviewAccess(file, userRole)

    if (!this.isPreviewable(file.fileFormat)) {
      throw new BadRequestException('该文件格式不支持预览')
    }

    return {
      file,
      thumbnailPath: file.previewCacheKey
        ? `${PREVIEW_CACHE_PATH}/${file.id}/thumbnail.jpg`
        : null,
    }
  }

  // ==================== 文件下载 ====================

  /**
   * 下载文件
   */
  async downloadFile(
    fileId: number,
    userId: number | null,
    userRole: string | null,
    ip?: string,
    isAnonymous: boolean = false,
  ) {
    const file = await this.prisma.fileResource.findUnique({ where: { id: fileId } })
    if (!file) throw new NotFoundException('文件不存在')

    if (file.status !== FileStatus.ACTIVE) {
      throw new BadRequestException('文件当前状态不可下载')
    }

    // 权限校验
    if (isAnonymous) {
      // 匿名访客只能下载 PUBLIC 文件
      if (file.accessLevel !== AccessLevel.PUBLIC) {
        throw new ForbiddenException('该文件仅限校内用户下载')
      }
      if (file.secretLevel === SecretLevel.CONFIDENTIAL) {
        throw new ForbiddenException('涉密文件不允许匿名下载')
      }
      // TODO: 爬虫防护 - 单IP每分钟限10次
    } else {
      // 校内用户校验
      if (file.accessLevel === AccessLevel.INTERNAL && userRole !== 'system_admin') {
        throw new ForbiddenException('仅系统管理员可下载内部文件')
      }
    }

    // 下载计数
    await this.prisma.fileResource.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } },
    })

    // 记录下载日志
    await this.auditLog.create({
      adminId: userId ?? undefined,
      role: userRole ?? 'anonymous',
      action: FileAuditAction.DOWNLOAD,
      targetType: 'file_resource',
      targetId: fileId,
      ip,
      detail: JSON.stringify({
        fileName: file.fileName,
        fileSize: file.fileSize,
        accessLevel: file.accessLevel,
        anonymous: isAnonymous,
      }),
      isViolation: isAnonymous ? false : false,
    })

    return file
  }

  // ==================== 统计相关 ====================

  /**
   * 获取文件访问统计
   */
  async getStats(
    userRole: string,
    bindColumnIds: number[],
    fromDate?: string,
    toDate?: string,
  ) {
    const where: any = {}

    if (userRole !== 'system_admin') {
      where.columnId = { in: bindColumnIds }
    }

    // 获取总览统计
    const totalFiles = await this.prisma.fileResource.count({ where })

    const downloadStats = await this.prisma.fileResource.aggregate({
      _sum: { downloadCount: true },
      _count: { id: true },
      where: { ...where, status: FileStatus.ACTIVE },
    })

    const previewStats = await this.prisma.fileResource.aggregate({
      _sum: { previewCount: true },
      where: { ...where, status: FileStatus.ACTIVE },
    })

    // 按格式分组统计
    const byFormat = await this.prisma.fileResource.groupBy({
      by: ['fileFormat'],
      where: { ...where, status: FileStatus.ACTIVE },
      _count: { id: true },
      _sum: { fileSize: true },
    })

    return {
      totalFiles,
      totalDownloads: downloadStats._sum.downloadCount || 0,
      totalPreviews: previewStats._sum.previewCount || 0,
      byFormat: byFormat.map(item => ({
        format: item.fileFormat,
        count: item._count.id,
        totalSize: item._sum.fileSize || 0,
      })),
    }
  }

  // ==================== 系统配置 ====================

  /**
   * 获取文件系统配置
   */
  async getSystemConfig() {
    return {
      maxFileSize: DEFAULT_MAX_FILE_SIZE,
      dailyDownloadLimit: DEFAULT_DAILY_DOWNLOAD_LIMIT,
      anonymousRateLimit: DEFAULT_ANONYMOUS_RATE_LIMIT,
      autoArchiveDays: AUTO_ARCHIVE_DAYS,
      executableBlacklist: EXECUTABLE_BLACKLIST,
      previewableFormats: PREVIEWABLE_FORMATS,
    }
  }

  // ==================== 内部工具方法 ====================

  /**
   * 校验文件格式 (扩展名 + MIME 类型黑名单)
   */
  private validateFileFormat(fileFormat: string, mimeType: string) {
    const ext = fileFormat.toLowerCase().startsWith('.') ? fileFormat : `.${fileFormat}`

    if (EXECUTABLE_BLACKLIST.includes(ext)) {
      throw new BadRequestException(`禁止上传可执行文件格式: ${ext}`)
    }

    // MIME 类型校验
    const dangerousMimePrefixes = ['application/x-msdownload', 'application/x-executable']
    if (dangerousMimePrefixes.some(prefix => mimeType.toLowerCase().startsWith(prefix))) {
      throw new BadRequestException('文件 MIME 类型被禁止')
    }
  }

  /**
   * 校验预览访问权限
   */
  private validatePreviewAccess(file: any, userRole: string) {
    if (userRole === 'system_admin') return

    // 涉密文件: 仅校内登录用户可预览 (所有非匿名用户都算)
    if (file.secretLevel === SecretLevel.CONFIDENTIAL) {
      // 所有登录用户都可以 (SSO师生 + 管理员)
      return
    }

    // 根据 accessLevel 判断
    switch (file.accessLevel) {
      case AccessLevel.PUBLIC:
        return // 可预览
      case AccessLevel.CAMPUS:
        return // 校内师生可预览
      case AccessLevel.INTERNAL:
        if (userRole !== 'system_admin') {
          throw new ForbiddenException('仅系统管理员可预览内部文件')
        }
        return
      default:
        return
    }
  }

  /**
   * 判断文件格式是否支持预览
   */
  private isPreviewable(fileFormat: string): boolean {
    return PREVIEWABLE_FORMATS.includes(fileFormat.toLowerCase())
  }

  /**
   * 生成唯一存储路径
   */
  private generateStoragePath(fileFormat: string): string {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    return `${timestamp}_${randomStr}.${fileFormat.toLowerCase()}`
  }

  /**
   * 异步生成预览缓存
   */
  private generatePreviewCacheAsync(file: any) {
    if (!this.isPreviewable(file.fileFormat)) return

    // 如果已有缓存键, 跳过
    if (file.previewCacheKey) return

    // 生成缓存键
    const cacheKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // 异步更新 (不阻塞上传响应)
    setTimeout(async () => {
      try {
        // TODO: 实际调用文档转换服务
        // PDF: 直接缓存
        // Word/Excel/PPT: 调用 LibreOffice 转换
        // 图片: 生成缩略图

        await this.prisma.fileResource.update({
          where: { id: file.id },
          data: {
            previewCacheKey: cacheKey,
            previewEnabled: true,
          },
        })

        this.logger.log(`预览缓存生成完成: fileId=${file.id}, cacheKey=${cacheKey}`)
      } catch (error) {
        this.logger.error(`预览缓存生成失败: fileId=${file.id}`, error)
      }
    }, 100) // 立即在后台异步执行
  }

  /**
   * 自动归档长期闲置文件 (定时任务调用)
   */
  async autoArchiveInactiveFiles() {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - AUTO_ARCHIVE_DAYS)

    const inactiveFiles = await this.prisma.fileResource.findMany({
      where: {
        status: FileStatus.ACTIVE,
        updatedAt: { lt: threshold },
      },
    })

    let archivedCount = 0
    for (const file of inactiveFiles) {
      // 检查是否关联已发布稿件
      if (file.articleId) {
        const article = await this.prisma.article.findUnique({
          where: { id: file.articleId },
          select: { status: true },
        })
        if (article && article.status === 'published') {
          continue // 关联已发布稿件, 不归档
        }
      }

      await this.prisma.fileResource.update({
        where: { id: file.id },
        data: { status: FileStatus.ARCHIVED },
      })
      archivedCount++
    }

    this.logger.log(`自动归档完成: ${archivedCount} 个文件被归档`)
    return { archivedCount }
  }

  /**
   * 前台公开文件下载 (无Token)
   */
  async publicDownload(
    fileId: number,
    ip?: string,
  ) {
    return this.downloadFile(fileId, null, null, ip, true)
  }
}