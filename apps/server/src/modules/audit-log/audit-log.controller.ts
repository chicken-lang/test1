/**
 * 审计日志控制器
 * 模块七：操作审计日志
 *
 * 接口：
 * - GET    /audit                       查询审计日志（按角色分级过滤）
 * - GET    /audit/violations             查询越权访问记录
 * - POST   /audit/archive                手动触发归档（V2.0 §7.6）
 * - POST   /audit/restore                恢复归档日志
 * - GET    /audit/archived               查询归档日志（温数据）
 * - GET    /audit/batches                查询归档批次记录
 * - GET    /audit/integrity-check        完整性校验（V2.0 §7.7,支持范围+HMAC双重校验）
 * - GET    /audit/integrity-check/history 查询校验历史记录
 * - GET    /audit/integrity-check/alerts  查询篡改告警记录
 * - POST   /audit/integrity-check/alerts/:id/resolve 处理篡改告警
 * - GET    /audit/export                 导出审计日志（带数字水印）
 */
import { Controller, Get, Post, Param, Body, Query, UseGuards, Inject } from '@nestjs/common'
import { AuditLogService } from './audit-log.service.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('audit')
@UseGuards(AuthGuard)
export class AuditLogController {
  private auditLogService: AuditLogService

  constructor(@Inject(AuditLogService) auditLogService: AuditLogService) {
    this.auditLogService = auditLogService
  }

  // ========== 日志查询 ==========

  /**
   * 查询审计日志（按角色分级过滤）
   */
  @Get()
  async getMyLogs(@CurrentUser() user: any, @Query() query: any) {
    const result = await this.auditLogService.findAll({
      adminId: user.id,
      role: user.role,
      bindColumnIds: user.bindColumnIds,
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      action: query.action,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      username: query.username,
      filterRole: query.filterRole,
    })
    return ApiResponseHelper.success(result)
  }

  /**
   * 查询越权访问记录
   */
  @Get('violations')
  async getViolations(@Query() query: any) {
    const result = await this.auditLogService.findViolations({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
    })
    return ApiResponseHelper.success(result)
  }

  // ========== 日志归档（V2.0 §7.6） ==========

  /**
   * 手动触发归档（仅 system_admin）
   * V2.0 §7.6.2: 定时任务每月1日03:00自动执行，也支持手动触发
   */
  @Post('archive')
  async archiveLogs(@CurrentUser() user: any, @Body() body?: { days?: number }) {
    const days = body?.days ? parseInt(String(body.days)) : undefined
    const result = await this.auditLogService.archiveOldLogs(user.id, days)
    return ApiResponseHelper.success(result, '归档任务已完成')
  }

  /**
   * 恢复归档日志到主表
   */
  @Post('restore')
  async restoreArchive(@Body() body: { batchId: number }) {
    const result = await this.auditLogService.restoreFromArchive(body.batchId)
    return ApiResponseHelper.success(result, result.message)
  }

  /**
   * 查询归档日志（温数据: 90天~1年）
   */
  @Get('archived')
  async getArchivedLogs(@Query() query: any) {
    const result = await this.auditLogService.findArchivedLogs({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      action: query.action,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    })
    return ApiResponseHelper.success(result)
  }

  /**
   * 查询归档批次记录
   */
  @Get('batches')
  async getArchiveBatches(@Query() query: any) {
    const result = await this.auditLogService.findArchiveBatches({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
    })
    return ApiResponseHelper.success(result)
  }

  // ========== 完整性校验（V2.0 §7.7） ==========

  /**
   * 日志完整性校验
   * 双重验证: 哈希链连续性 + HMAC-SHA256 签名一致性
   *
   * @param scope 校验范围: main(主表) | archive(归档表) | full(全部), 默认 main
   * @param sampleSize 抽样数量（0=全量校验，默认1000条）
   */
  @Get('integrity-check')
  async verifyIntegrity(
    @CurrentUser() user: any,
    @Query('scope') scope?: string,
    @Query('sampleSize') sampleSize?: string,
  ) {
    const result = await this.auditLogService.verifyIntegrity({
      scope: (scope as 'main' | 'archive' | 'full') || 'main',
      sampleSize: sampleSize ? parseInt(sampleSize) : 1000,
      checkType: 'manual',
      triggeredBy: user?.id ? `admin_${user.id}` : 'manual',
    })
    return ApiResponseHelper.success(result)
  }

  /**
   * 查询校验历史记录
   */
  @Get('integrity-check/history')
  async getCheckHistory(@Query() query: any) {
    const result = await this.auditLogService.findCheckHistory({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      integrity: query.integrity,
    })
    return ApiResponseHelper.success(result)
  }

  /**
   * 查询篡改告警记录
   */
  @Get('integrity-check/alerts')
  async getTamperAlerts(@Query() query: any) {
    const result = await this.auditLogService.findTamperAlerts({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      status: query.status,
    })
    return ApiResponseHelper.success(result)
  }

  /**
   * 处理篡改告警（标记为已解决）
   */
  @Post('integrity-check/alerts/:id/resolve')
  async resolveAlert(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.auditLogService.resolveTamperAlert(parseInt(id), user.id)
    return ApiResponseHelper.success(result, '告警已标记为已解决')
  }

  /**
   * 重签全部日志（密钥轮换迁移）
   * 场景: AUDIT_HMAC_SECRET 变更后,用新密钥重新计算所有日志的 HMAC 签名
   * 安全: 重签前先验证哈希链完整性,哈希链异常则拒绝重签
   */
  @Post('integrity-check/re-sign')
  async reSignLogs(@CurrentUser() user: any) {
    const result = await this.auditLogService.reSignAllLogs(user.id)
    return ApiResponseHelper.success(result, result.message)
  }

  // ========== 日志导出（V2.0 §7.5 + §7.7 导出安全） ==========

  /**
   * 导出审计日志（带数字水印）
   */
  @Get('export')
  async exportLogs(@CurrentUser() user: any, @Query() query: any) {
    const result = await this.auditLogService.exportLogs({
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      action: query.action,
      adminId: query.adminId ? parseInt(query.adminId) : undefined,
      operatorId: user.id,
      operatorName: user.username,
    })
    return ApiResponseHelper.success(result)
  }
}
