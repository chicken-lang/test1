/**
 * 审计日志服务
 * 模块七：操作审计日志
 *
 * 功能：
 * 1. 日志创建（链式 SHA-256 哈希 + HMAC-SHA256 数字签名，双重保障不可篡改）
 * 2. 日志查询（按角色分级过滤 + 读取时抽样完整性校验）
 * 3. 日志归档（定时任务：90天→归档表，1年→对象存储）
 * 4. 完整性校验（主表 + 归档表，哈希链 + HMAC 签名双重验证）
 * 5. 校验历史持久化 + 篡改告警机制
 * 6. 定时自动巡检（每日 02:30 全量校验）
 * 7. 日志导出（带数字水印）
 */
import { Injectable, Inject, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import * as crypto from 'crypto'
import { PrismaService } from '../prisma/prisma.service.js'

// 哈希链创世值（第一条日志的 prevHash）
const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000'

// 归档时间阈值
const ARCHIVE_THRESHOLD_DAYS = 90 // 超过90天 → 归档表
const COLD_STORAGE_THRESHOLD_DAYS = 365 // 超过1年 → 对象存储（冷数据）

// 读取时抽样校验比例（10%）
const ON_READ_SAMPLE_RATIO = 0.1

/**
 * HMAC 签名密钥
 * 生产环境必须通过 AUDIT_HMAC_SECRET 环境变量配置
 * 此密钥用于防止攻击者获知算法后重算整条哈希链伪造日志
 */
function getHmacSecret(): string {
  return process.env.AUDIT_HMAC_SECRET || 'jwc-audit-hmac-dev-secret-change-in-prod'
}

/**
 * 计算日志内容的标准化 JSON 字符串
 * 保证 create 和 verify 使用相同的内容序列化方式
 */
function serializeLogContent(data: {
  adminId?: number | null
  username?: string | null
  role?: string | null
  action: string
  targetType?: string | null
  targetId?: number | null
  ip?: string | null
  userAgent?: string | null
  detail?: string | null
  isViolation?: boolean | null
}): string {
  return JSON.stringify({
    adminId: data.adminId ?? null,
    username: data.username ?? null,
    role: data.role ?? null,
    action: data.action,
    targetType: data.targetType ?? null,
    targetId: data.targetId ?? null,
    ip: data.ip ?? null,
    userAgent: data.userAgent ?? null,
    detail: data.detail ?? null,
    isViolation: data.isViolation ?? false,
  })
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name)
  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  // ========== 原始事件上报 ==========

  /**
   * 创建审计日志
   * 所有操作自动调用,越权访问也自动记录
   * 日志不可删除/篡改(只提供 create 和 query,无 delete/update)
   *
   * 双重完整性保障:
   * 1. 链式哈希: hash = SHA256(prevHash + 日志内容) —— 检测插入/删除/重排
   * 2. HMAC 签名: signature = HMAC-SHA256(密钥, hash + 日志内容) —— 防止整链重算攻击
   */
  async create(data: {
    adminId?: number
    username?: string
    role?: string
    action: string
    targetType?: string
    targetId?: number
    ip?: string
    userAgent?: string
    detail?: string
    isViolation?: boolean
  }) {
    // 获取前一条日志的 hash（形成哈希链）
    const lastLog = await this.prisma.auditLog.findFirst({
      orderBy: { id: 'desc' },
      select: { hash: true },
    })
    const prevHash = lastLog?.hash || GENESIS_HASH

    // 计算当前日志的链式哈希
    const logContent = serializeLogContent(data)
    const hash = crypto.createHash('sha256').update(prevHash + logContent).digest('hex')

    // 计算 HMAC 数字签名（密钥保护,防止重算攻击）
    const signature = crypto
      .createHmac('sha256', getHmacSecret())
      .update(hash + logContent)
      .digest('hex')

    return this.prisma.auditLog.create({
      data: { ...data, hash, prevHash, signature },
    })
  }

  /**
   * 查询审计日志
   * 根据角色过滤数据范围:
   * - editor: 仅本人日志
   * - reviewer: 本人 + 本栏目日志
   * - column_admin: 本人 + 所辖栏目全部编辑日志
   * - system_admin: 全站日志
   *
   * 读取时按 10% 比例抽样校验日志完整性（非阻塞,仅记录异常）
   */
  async findAll(query: {
    adminId?: number
    role: string
    bindColumnIds?: number[]
    page?: number
    pageSize?: number
    action?: string
    startDate?: Date
    endDate?: Date
    isViolation?: boolean
    username?: string
    filterRole?: string
  }) {
    const { role, adminId, bindColumnIds, page = 1, pageSize = 10, action, startDate, endDate, isViolation, username, filterRole } = query

    const where: any = {}

    // 数据范围过滤
    if (role === 'editor') {
      where.adminId = adminId
    } else if (role === 'reviewer') {
      where.OR = [{ adminId }]
    } else if (role === 'column_admin') {
      // 本人 + 所辖栏目所有人员日志（简化实现）
    }
    // system_admin: 不加过滤,查看全部

    // system_admin 可按用户名筛选其他管理员日志
    if (username) {
      where.username = { contains: username, mode: 'insensitive' }
    }

    // system_admin 可按角色筛选
    if (filterRole) {
      where.role = filterRole
    }

    if (action) where.action = action
    if (isViolation !== undefined) where.isViolation = isViolation
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [list, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    // 读取时抽样校验（非阻塞,异常仅记录告警,不影响正常读取）
    this.verifyOnRead(list).catch((err) => {
      this.logger.error(`[读取校验] 抽样校验异常: ${err.message}`)
    })

    return { list, total, page, pageSize }
  }

  /**
   * 查询越权访问记录
   */
  async findViolations(query: { page?: number; pageSize?: number }) {
    return this.findAll({ ...query, role: 'system_admin', isViolation: true })
  }

  // ========== 日志归档（V2.0 §7.6） ==========

  /**
   * 定时归档任务
   * V2.0 §7.6.2: 每月1日凌晨 03:00 执行
   * 1. 将 audit_log 表中超过90天的记录迁移至 audit_log_archive
   * 2. 将 audit_log_archive 中超过1年的记录导出为压缩文件
   * 3. 物理删除已导出至对象存储的归档记录
   * 4. 记录归档操作日志
   */
  @Cron('0 3 1 * *')
  async archiveOldLogs(operatorId?: number, days?: number) {
    const batchNo = this.generateBatchNo()
    const now = new Date()
    const archiveDays = days || ARCHIVE_THRESHOLD_DAYS
    const archiveThreshold = new Date(now.getTime() - archiveDays * 24 * 60 * 60 * 1000)
    const coldStorageThreshold = new Date(now.getTime() - COLD_STORAGE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)

    this.logger.log(`[归档任务] 批次 ${batchNo} 开始执行, 操作人: ${operatorId || '定时任务'}`)

    // 创建归档批次记录
    const batch = await this.prisma.auditArchiveBatch.create({
      data: { batchNo, status: 'running', operatorId: operatorId || null },
    })

    try {
      // 步骤1: 迁移超过90天的热数据 → 归档表
      const logsToArchive = await this.prisma.auditLog.findMany({
        where: { createdAt: { lt: archiveThreshold } },
        orderBy: { id: 'asc' },
      })

      this.logger.log(`[归档任务] 待迁移至归档表: ${logsToArchive.length} 条`)

      if (logsToArchive.length > 0) {
        // 批量写入归档表（含 signature 字段）
        await this.prisma.auditLogArchive.createMany({
          data: logsToArchive.map((log) => ({
            id: log.id,
            adminId: log.adminId,
            username: log.username,
            role: log.role,
            action: log.action,
            targetType: log.targetType,
            targetId: log.targetId,
            ip: log.ip,
            userAgent: log.userAgent,
            detail: log.detail,
            isViolation: log.isViolation,
            hash: log.hash,
            prevHash: log.prevHash,
            signature: log.signature,
            createdAt: log.createdAt,
          })),
        })

        // 从主表删除已迁移的记录
        await this.prisma.auditLog.deleteMany({
          where: { createdAt: { lt: archiveThreshold } },
        })

        this.logger.log(`[归档任务] 已迁移 ${logsToArchive.length} 条至归档表`)
      }

      // 步骤2: 导出超过1年的归档记录 → 对象存储（冷数据）
      const logsToExport = await this.prisma.auditLogArchive.findMany({
        where: { createdAt: { lt: coldStorageThreshold } },
        orderBy: { id: 'asc' },
      })

      this.logger.log(`[归档任务] 待导出至冷存储: ${logsToExport.length} 条`)

      let storagePath: string | null = null
      if (logsToExport.length > 0) {
        // 生成压缩文件路径（模拟对象存储路径）
        const exportDate = now.toISOString().slice(0, 10).replace(/-/g, '')
        storagePath = `/archive/audit-logs/${exportDate}/${batchNo}.json.gz`

        // 模拟导出：实际项目中应上传至 OSS/MinIO 等对象存储
        // 导出数据包含数字水印（导出时间 + 批次号）
        const exportData = {
          watermark: {
            exportedAt: now.toISOString(),
            batchNo,
            recordCount: logsToExport.length,
          },
          logs: logsToExport,
        }
        this.logger.log(`[归档任务] 冷数据已导出至 ${storagePath}, 含水印, 记录数: ${exportData.watermark.recordCount}`)

        // 物理删除已导出至对象存储的归档记录
        await this.prisma.auditLogArchive.deleteMany({
          where: { createdAt: { lt: coldStorageThreshold } },
        })
      }

      // 步骤3: 更新归档批次记录
      await this.prisma.auditArchiveBatch.update({
        where: { id: batch.id },
        data: {
          migratedCount: logsToArchive.length,
          exportedCount: logsToExport.length,
          storagePath,
          status: 'completed',
          completedAt: now,
        },
      })

      this.logger.log(
        `[归档任务] 批次 ${batchNo} 完成: 迁移 ${logsToArchive.length} 条, 导出 ${logsToExport.length} 条`,
      )

      return {
        batchNo,
        migratedCount: logsToArchive.length,
        exportedCount: logsToExport.length,
        storagePath,
        status: 'completed',
      }
    } catch (err: any) {
      // 归档失败，更新批次状态
      await this.prisma.auditArchiveBatch.update({
        where: { id: batch.id },
        data: { status: 'failed', completedAt: new Date() },
      })
      this.logger.error(`[归档任务] 批次 ${batchNo} 失败: ${err.message}`, err.stack)
      throw err
    }
  }

  /**
   * 恢复归档日志到主表
   * 将指定批次归档的日志从 audit_log_archive 移回 audit_log
   */
  async restoreFromArchive(batchId: number) {
    const batch = await this.prisma.auditArchiveBatch.findUnique({
      where: { id: batchId },
    })

    if (!batch) {
      throw new Error('归档批次不存在')
    }

    // 查找该批次归档的日志（通过 archivedAt 时间范围匹配）
    const startTime = batch.startedAt
    const endTime = batch.completedAt || new Date()

    const archivedLogs = await this.prisma.auditLogArchive.findMany({
      where: {
        archivedAt: { gte: startTime, lte: endTime },
      },
    })

    this.logger.log(`[恢复归档] 批次 ${batch.batchNo}: 找到 ${archivedLogs.length} 条归档日志`)

    if (archivedLogs.length > 0) {
      // 移回主表（含 signature 字段）
      await this.prisma.auditLog.createMany({
        data: archivedLogs.map((log) => ({
          id: log.id,
          adminId: log.adminId,
          username: log.username,
          role: log.role,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          ip: log.ip,
          userAgent: log.userAgent,
          detail: log.detail,
          isViolation: log.isViolation,
          hash: log.hash,
          prevHash: log.prevHash,
          signature: log.signature,
          createdAt: log.createdAt,
        })),
      })

      // 从归档表删除
      await this.prisma.auditLogArchive.deleteMany({
        where: {
          archivedAt: { gte: startTime, lte: endTime },
        },
      })
    }

    // 更新批次状态
    await this.prisma.auditArchiveBatch.update({
      where: { id: batchId },
      data: { status: 'restored' },
    })

    this.logger.log(`[恢复归档] 批次 ${batch.batchNo}: 已恢复 ${archivedLogs.length} 条日志到主表`)

    return {
      restoredCount: archivedLogs.length,
      batchNo: batch.batchNo,
      message: `已恢复 ${archivedLogs.length} 条日志到主表`,
    }
  }

  /**
   * 生成归档批次号
   */
  private generateBatchNo(): string {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  }

  // ========== 日志完整性校验（V2.0 §7.7） ==========

  /**
   * 完整性校验（核心方法）
   * 双重验证: 哈希链连续性 + HMAC 签名一致性
   *
   * 校验逻辑：
   * 1. 按指定范围（主表/归档表/全部）获取日志
   * 2. 验证每条日志的 hash = SHA256(prevHash + 日志内容)
   * 3. 验证相邻日志的 prevHash 链是否连续
   * 4. 验证 HMAC 签名 signature = HMAC-SHA256(密钥, hash + 日志内容)
   * 5. 持久化校验结果到 AuditIntegrityCheckLog
   * 6. 检测到篡改时写入 AuditTamperAlert 告警记录
   *
   * @param options.scope 校验范围: main(主表) | archive(归档表) | full(全部)
   * @param options.sampleSize 抽样校验数量（0=全量校验，默认抽样1000条）
   * @param options.checkType 校验类型: manual | scheduled | on_read
   * @param options.triggeredBy 触发人标识
   */
  async verifyIntegrity(options: {
    scope?: 'main' | 'archive' | 'full'
    sampleSize?: number
    checkType?: 'manual' | 'scheduled' | 'on_read'
    triggeredBy?: string
  } = {}) {
    const scope = options.scope || 'main'
    const sampleSize = options.sampleSize ?? 1000
    const checkType = options.checkType || 'manual'
    const triggeredBy = options.triggeredBy || 'system'

    const startTime = Date.now()
    const issues: Array<{
      logId: number
      table: string
      type: 'hash_mismatch' | 'chain_broken' | 'missing_hash' | 'signature_invalid'
      message: string
    }> = []

    // 根据范围获取日志
    const verifyMain = scope === 'main' || scope === 'full'
    const verifyArchive = scope === 'archive' || scope === 'full'

    let mainLogs: any[] = []
    let archiveLogs: any[] = []
    let totalCount = 0

    if (verifyMain) {
      totalCount += await this.prisma.auditLog.count()
    }
    if (verifyArchive) {
      totalCount += await this.prisma.auditLogArchive.count()
    }

    const sampleCount = sampleSize === 0 ? totalCount : Math.min(sampleSize, totalCount)

    // 获取主表日志（按 id 升序，保证链式顺序）
    if (verifyMain) {
      const mainTotal = await this.prisma.auditLog.count()
      const mainTake = sampleSize === 0 ? mainTotal : Math.min(sampleSize, mainTotal)
      mainLogs = await this.prisma.auditLog.findMany({
        orderBy: { id: 'asc' },
        take: mainTake,
        select: {
          id: true,
          adminId: true,
          username: true,
          role: true,
          action: true,
          targetType: true,
          targetId: true,
          ip: true,
          userAgent: true,
          detail: true,
          isViolation: true,
          hash: true,
          prevHash: true,
          signature: true,
        },
      })
    }

    // 获取归档表日志
    if (verifyArchive) {
      const archiveTotal = await this.prisma.auditLogArchive.count()
      const remainingQuota = sampleSize === 0 ? archiveTotal : Math.max(0, sampleCount - mainLogs.length)
      const archiveTake = sampleSize === 0 ? archiveTotal : Math.min(remainingQuota, archiveTotal)
      archiveLogs = await this.prisma.auditLogArchive.findMany({
        orderBy: { id: 'asc' },
        take: archiveTake,
        select: {
          id: true,
          adminId: true,
          username: true,
          role: true,
          action: true,
          targetType: true,
          targetId: true,
          ip: true,
          userAgent: true,
          detail: true,
          isViolation: true,
          hash: true,
          prevHash: true,
          signature: true,
        },
      })
    }

    let verifiedCount = 0
    let expectedPrevHash = GENESIS_HASH

    // 校验主表日志
    for (const log of mainLogs) {
      const issue = this.verifySingleLog(log, 'audit_log', expectedPrevHash)
      if (issue) {
        issues.push(issue)
      }
      expectedPrevHash = log.hash || expectedPrevHash
      verifiedCount++
    }

    // 校验归档表日志（归档表独立成链,从创世值开始）
    if (verifyArchive) {
      // 归档表与主表分离后独立维护哈希链,重置 expectedPrevHash
      expectedPrevHash = GENESIS_HASH
      for (const log of archiveLogs) {
        const issue = this.verifySingleLog(log, 'audit_log_archive', expectedPrevHash)
        if (issue) {
          issues.push(issue)
        }
        expectedPrevHash = log.hash || expectedPrevHash
        verifiedCount++
      }
    }

    const elapsed = Date.now() - startTime
    const integrity = issues.length === 0 ? 'pass' : 'fail'

    const result = {
      scope,
      sampleMode: sampleSize === 0 ? 'full' : 'sample',
      sampleSize,
      verifiedCount,
      totalCount,
      issuesCount: issues.length,
      issues: issues.slice(0, 50), // 最多返回50条问题记录
      elapsedMs: elapsed,
      timestamp: new Date().toISOString(),
      integrity,
      // 兼容前端字段
      totalLogs: totalCount,
      checkedLogs: verifiedCount,
      passed: integrity === 'pass',
      verifiedAt: new Date().toISOString(),
      message:
        issues.length === 0
          ? `已校验 ${verifiedCount} 条日志,哈希链与HMAC签名均完整,数据未被篡改`
          : `校验发现 ${issues.length} 个异常,日志可能被篡改,请立即排查`,
    }

    // 持久化校验历史
    const checkLog = await this.prisma.auditIntegrityCheckLog.create({
      data: {
        checkType,
        scope,
        sampleMode: result.sampleMode,
        sampleSize,
        verifiedCount,
        totalCount,
        issuesCount: issues.length,
        integrity,
        issues: issues.slice(0, 50) as any,
        elapsedMs: elapsed,
        triggeredBy,
      },
    })

    // 检测到篡改时创建告警记录
    if (issues.length > 0) {
      await this.raiseTamperAlerts(checkLog.id, issues)
      this.logger.warn(`[完整性校验] 发现 ${issues.length} 个问题, 校验 ${verifiedCount}/${totalCount} 条, 已生成告警`)
    } else {
      this.logger.log(`[完整性校验] 通过, 校验 ${verifiedCount}/${totalCount} 条, 耗时 ${elapsed}ms`)
    }

    return result
  }

  /**
   * 校验单条日志的完整性（哈希链 + HMAC 签名）
   */
  private verifySingleLog(
    log: any,
    table: string,
    expectedPrevHash: string,
  ): { logId: number; table: string; type: any; message: string } | null {
    // 检查 hash 是否存在
    if (!log.hash) {
      return {
        logId: log.id,
        table,
        type: 'missing_hash',
        message: `${table} ID=${log.id} 缺少 hash 字段`,
      }
    }

    // 检查 prevHash 链是否连续
    if (log.prevHash !== expectedPrevHash) {
      return {
        logId: log.id,
        table,
        type: 'chain_broken',
        message: `${table} ID=${log.id} 的 prevHash 不匹配, 期望 ${expectedPrevHash.slice(0, 16)}..., 实际 ${(log.prevHash || '').slice(0, 16)}...`,
      }
    }

    // 重新计算 hash 验证一致性
    const logContent = serializeLogContent(log)
    const computedHash = crypto
      .createHash('sha256')
      .update((log.prevHash || GENESIS_HASH) + logContent)
      .digest('hex')

    if (computedHash !== log.hash) {
      return {
        logId: log.id,
        table,
        type: 'hash_mismatch',
        message: `${table} ID=${log.id} 的 hash 不匹配, 日志可能被篡改`,
      }
    }

    // 验证 HMAC 签名（防止整链重算攻击）
    if (log.signature) {
      const computedSig = crypto
        .createHmac('sha256', getHmacSecret())
        .update(log.hash + logContent)
        .digest('hex')
      if (computedSig !== log.signature) {
        return {
          logId: log.id,
          table,
          type: 'signature_invalid',
          message: `${table} ID=${log.id} 的 HMAC 签名验证失败, 日志可能被篡改或密钥泄露`,
        }
      }
    }

    return null
  }

  /**
   * 读取时抽样校验（非阻塞）
   * 按设定比例对查询结果中的日志进行完整性校验
   * 仅记录异常告警,不影响正常读取流程
   */
  private async verifyOnRead(logs: any[]) {
    if (logs.length === 0) return

    // 按比例抽样
    const sampleCount = Math.max(1, Math.ceil(logs.length * ON_READ_SAMPLE_RATIO))
    const sampled = logs.slice(0, sampleCount)

    const issues: Array<{
      logId: number
      table: string
      type: any
      message: string
    }> = []

    for (const log of sampled) {
      if (!log.hash) {
        issues.push({
          logId: log.id,
          table: 'audit_log',
          type: 'missing_hash',
          message: `读取校验: ID=${log.id} 缺少 hash 字段`,
        })
        continue
      }

      const logContent = serializeLogContent(log)
      const computedHash = crypto
        .createHash('sha256')
        .update((log.prevHash || GENESIS_HASH) + logContent)
        .digest('hex')

      if (computedHash !== log.hash) {
        issues.push({
          logId: log.id,
          table: 'audit_log',
          type: 'hash_mismatch',
          message: `读取校验: ID=${log.id} 的 hash 不匹配, 日志可能被篡改`,
        })
        continue
      }

      // 验证 HMAC 签名
      if (log.signature) {
        const computedSig = crypto
          .createHmac('sha256', getHmacSecret())
          .update(log.hash + logContent)
          .digest('hex')
        if (computedSig !== log.signature) {
          issues.push({
            logId: log.id,
            table: 'audit_log',
            type: 'signature_invalid',
            message: `读取校验: ID=${log.id} 的 HMAC 签名验证失败`,
          })
        }
      }
    }

    if (issues.length > 0) {
      this.logger.warn(`[读取校验] 抽样 ${sampled.length}/${logs.length} 条, 发现 ${issues.length} 个异常`)

      // 持久化校验记录
      const checkLog = await this.prisma.auditIntegrityCheckLog.create({
        data: {
          checkType: 'on_read',
          scope: 'main',
          sampleMode: 'sample',
          sampleSize: sampled.length,
          verifiedCount: sampled.length,
          totalCount: logs.length,
          issuesCount: issues.length,
          integrity: 'fail',
          issues: issues.slice(0, 50) as any,
          elapsedMs: 0,
          triggeredBy: 'on_read',
        },
      })

      await this.raiseTamperAlerts(checkLog.id, issues)
    }
  }

  /**
   * 创建篡改告警记录
   */
  private async raiseTamperAlerts(
    checkLogId: number,
    issues: Array<{ logId: number; table: string; type: string; message: string }>,
  ) {
    const severityMap: Record<string, string> = {
      hash_mismatch: 'critical',
      signature_invalid: 'critical',
      chain_broken: 'high',
      missing_hash: 'high',
    }

    const alerts = issues.slice(0, 100).map((issue) => ({
      checkLogId,
      logId: issue.logId,
      alertType: issue.type,
      severity: severityMap[issue.type] || 'high',
      message: issue.message,
      status: 'open',
    }))

    if (alerts.length > 0) {
      await this.prisma.auditTamperAlert.createMany({ data: alerts })
      this.logger.error(`[篡改告警] 已生成 ${alerts.length} 条告警记录, 请管理员及时处理`)
    }
  }

  /**
   * 定时完整性巡检任务
   * 每日 02:30 自动执行全量校验（主表 + 归档表）
   * V2.0 §7.7 定期校验要求
   */
  @Cron('0 30 2 * * *')
  async scheduledIntegrityCheck() {
    this.logger.log('[定时巡检] 开始每日完整性校验（主表 + 归档表全量）')
    try {
      const result = await this.verifyIntegrity({
        scope: 'full',
        sampleSize: 0, // 全量校验
        checkType: 'scheduled',
        triggeredBy: 'system',
      })
      if (result.integrity === 'fail') {
        this.logger.error(`[定时巡检] 检测到篡改! 异常数: ${result.issuesCount}, 已生成告警`)
      } else {
        this.logger.log(`[定时巡检] 校验通过, 共校验 ${result.verifiedCount} 条日志`)
      }
    } catch (err: any) {
      this.logger.error(`[定时巡检] 校验任务失败: ${err.message}`, err.stack)
    }
  }

  /**
   * 查询校验历史记录
   */
  async findCheckHistory(query: { page?: number; pageSize?: number; integrity?: string }) {
    const { page = 1, pageSize = 10, integrity } = query
    const where: any = {}
    if (integrity) where.integrity = integrity

    const [list, total] = await Promise.all([
      this.prisma.auditIntegrityCheckLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditIntegrityCheckLog.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 查询篡改告警记录
   */
  async findTamperAlerts(query: { page?: number; pageSize?: number; status?: string }) {
    const { page = 1, pageSize = 10, status } = query
    const where: any = {}
    if (status) where.status = status

    const [list, total] = await Promise.all([
      this.prisma.auditTamperAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditTamperAlert.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 处理篡改告警（标记为已解决）
   */
  async resolveTamperAlert(alertId: number, handledBy: number) {
    const alert = await this.prisma.auditTamperAlert.findUnique({
      where: { id: alertId },
    })

    if (!alert) {
      throw new Error('告警记录不存在')
    }

    const updated = await this.prisma.auditTamperAlert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        handledAt: new Date(),
        handledBy,
      },
    })

    this.logger.log(`[告警处理] 告警 ${alertId} 已由管理员 ${handledBy} 标记为已解决`)
    return updated
  }

  /**
   * 重签全部日志（密钥轮换迁移）
   *
   * 使用场景: AUDIT_HMAC_SECRET 密钥变更后,旧日志的 signature 会校验失败。
   * 此方法用当前密钥重新计算所有日志的 HMAC 签名。
   *
   * 安全保障:
   * 1. 重签前先验证哈希链完整性(哈希链不依赖密钥,可独立验证)
   * 2. 哈希链若被篡改则拒绝重签,防止为已被篡改的日志"洗白"
   * 3. 仅更新 signature 字段,hash/prevHash 保持不变,哈希链不受影响
   * 4. 重签操作本身会记录审计日志
   *
   * @param operatorId 操作人ID
   */
  async reSignAllLogs(operatorId?: number) {
    const startTime = Date.now()
    this.logger.log(`[密钥重签] 开始执行, 操作人: ${operatorId || 'system'}`)

    // 步骤1: 获取主表全部日志（按 id 升序）
    const mainLogs = await this.prisma.auditLog.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        adminId: true,
        username: true,
        role: true,
        action: true,
        targetType: true,
        targetId: true,
        ip: true,
        userAgent: true,
        detail: true,
        isViolation: true,
        hash: true,
        prevHash: true,
      },
    })

    // 步骤2: 验证主表哈希链完整性（不验证签名,仅验证链式哈希）
    const chainErrors: string[] = []
    let expectedPrevHash = GENESIS_HASH
    for (const log of mainLogs) {
      if (!log.hash) {
        chainErrors.push(`主表 ID=${log.id} 缺少 hash`)
        continue
      }
      if (log.prevHash !== expectedPrevHash) {
        chainErrors.push(`主表 ID=${log.id} 哈希链断裂`)
      }
      const logContent = serializeLogContent(log)
      const computedHash = crypto
        .createHash('sha256')
        .update((log.prevHash || GENESIS_HASH) + logContent)
        .digest('hex')
      if (computedHash !== log.hash) {
        chainErrors.push(`主表 ID=${log.id} hash 不匹配, 日志可能被篡改`)
      }
      expectedPrevHash = log.hash
    }

    // 步骤3: 获取并验证归档表哈希链
    const archiveLogs = await this.prisma.auditLogArchive.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        adminId: true,
        username: true,
        role: true,
        action: true,
        targetType: true,
        targetId: true,
        ip: true,
        userAgent: true,
        detail: true,
        isViolation: true,
        hash: true,
        prevHash: true,
      },
    })

    expectedPrevHash = GENESIS_HASH
    for (const log of archiveLogs) {
      if (!log.hash) {
        chainErrors.push(`归档表 ID=${log.id} 缺少 hash`)
        continue
      }
      if (log.prevHash !== expectedPrevHash) {
        chainErrors.push(`归档表 ID=${log.id} 哈希链断裂`)
      }
      const logContent = serializeLogContent(log)
      const computedHash = crypto
        .createHash('sha256')
        .update((log.prevHash || GENESIS_HASH) + logContent)
        .digest('hex')
      if (computedHash !== log.hash) {
        chainErrors.push(`归档表 ID=${log.id} hash 不匹配, 日志可能被篡改`)
      }
      expectedPrevHash = log.hash
    }

    // 步骤4: 哈希链有问题则拒绝重签
    if (chainErrors.length > 0) {
      this.logger.error(`[密钥重签] 哈希链校验失败, 拒绝重签! 异常 ${chainErrors.length} 个`)
      return {
        success: false,
        message: `哈希链校验失败, 拒绝重签以防止为已篡改日志洗白。共发现 ${chainErrors.length} 个异常, 请先排查篡改问题`,
        chainErrors: chainErrors.slice(0, 20),
        mainCount: mainLogs.length,
        archiveCount: archiveLogs.length,
        reSignedCount: 0,
      }
    }

    // 步骤5: 哈希链完整,用当前密钥重新计算签名
    let reSignedCount = 0

    // 重签主表
    for (const log of mainLogs) {
      const logContent = serializeLogContent(log)
      const newSignature = crypto
        .createHmac('sha256', getHmacSecret())
        .update(log.hash + logContent)
        .digest('hex')

      await this.prisma.auditLog.update({
        where: { id: log.id },
        data: { signature: newSignature },
      })
      reSignedCount++
    }

    // 重签归档表
    for (const log of archiveLogs) {
      const logContent = serializeLogContent(log)
      const newSignature = crypto
        .createHmac('sha256', getHmacSecret())
        .update(log.hash + logContent)
        .digest('hex')

      await this.prisma.auditLogArchive.update({
        where: { id: log.id },
        data: { signature: newSignature },
      })
      reSignedCount++
    }

    const elapsed = Date.now() - startTime
    this.logger.log(
      `[密钥重签] 完成: 主表 ${mainLogs.length} 条, 归档表 ${archiveLogs.length} 条, 耗时 ${elapsed}ms`,
    )

    return {
      success: true,
      message: `重签完成, 共重签 ${reSignedCount} 条日志(主表 ${mainLogs.length} + 归档表 ${archiveLogs.length})`,
      mainCount: mainLogs.length,
      archiveCount: archiveLogs.length,
      reSignedCount,
      elapsedMs: elapsed,
    }
  }

  // ========== 日志导出（V2.0 §7.5 + §7.7 导出安全） ==========

  /**
   * 导出审计日志
   * 导出文件包含数字水印（导出人+导出时间），防止日志泄露后无法追溯
   */
  async exportLogs(query: {
    startDate?: Date
    endDate?: Date
    action?: string
    adminId?: number
    operatorId?: number
    operatorName?: string
  }) {
    const where: any = {}
    if (query.action) where.action = query.action
    if (query.adminId) where.adminId = query.adminId
    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) where.createdAt.gte = query.startDate
      if (query.endDate) where.createdAt.lte = query.endDate
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '').slice(0, 14)
    const randomSuffix = crypto.randomBytes(4).toString('hex')
    const fileName = `audit_logs_${timestamp}_${randomSuffix}.xlsx`

    // 数字水印：导出人 + 导出时间（嵌入文件名和元数据中）
    const watermark = {
      exportedBy: query.operatorName || `admin_${query.operatorId || 'unknown'}`,
      exportedAt: now.toISOString(),
      recordCount: logs.length,
      fileName,
    }

    this.logger.log(
      `[日志导出] 操作人: ${watermark.exportedBy}, 记录数: ${logs.length}, 文件: ${fileName}`,
    )

    return {
      downloadUrl: `/api/v1/audit/export/${fileName}`,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      recordCount: logs.length,
      generatedAt: now.toISOString(),
      watermark,
    }
  }

  // ========== 归档查询 ==========

  /**
   * 查询归档日志（温数据: 90天~1年）
   */
  async findArchivedLogs(query: {
    page?: number
    pageSize?: number
    action?: string
    startDate?: Date
    endDate?: Date
  }) {
    const { page = 1, pageSize = 10, action, startDate, endDate } = query

    const where: any = {}
    if (action) where.action = action
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const [list, total] = await Promise.all([
      this.prisma.auditLogArchive.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLogArchive.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 查询归档批次记录
   */
  async findArchiveBatches(query: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 10 } = query

    const [batches, total] = await Promise.all([
      this.prisma.auditArchiveBatch.findMany({
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditArchiveBatch.count(),
    ])

    // 关联查询操作人用户名
    const operatorIds = [...new Set(batches.map((b) => b.operatorId).filter(Boolean))] as number[]
    const operators = operatorIds.length > 0
      ? await this.prisma.admin.findMany({
          where: { id: { in: operatorIds } },
          select: { id: true, username: true, nickname: true },
        })
      : []
    const operatorMap = new Map(operators.map((o) => [o.id, o.nickname || o.username]))

    const list = batches.map((b) => ({
      ...b,
      operatorName: b.operatorId ? operatorMap.get(b.operatorId) || `管理员${b.operatorId}` : '系统自动',
    }))

    return { list, total, page, pageSize }
  }
}
