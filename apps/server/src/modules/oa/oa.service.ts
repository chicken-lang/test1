import { Injectable, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import {
  OA_CONFIG_KEYS,
  DEFAULT_OA_CONFIG,
  OA_API_ENDPOINTS,
  OaErrorCode,
  OaNoticeStatus,
  OaMessageType,
} from './oa.constants.js'
import type { OaNoticeQueryDto, OaMessageQueryDto, OaSyncDto, OaConfigDto } from './dto/oa.dto.js'

@Injectable()
export class OaService {
  private readonly logger = new Logger(OaService.name)

  private prisma: PrismaService
  private auditLog: AuditLogService

  private configCache: Record<string, string> = {}

  private mockNotices: any[] = [
    {
      id: 1,
      title: '关于2026年秋季学期教学安排的通知',
      content: '各教学单位：\n\n2026年秋季学期即将开始，为确保教学工作顺利进行，现将有关事项通知如下：\n\n一、开学时间：2026年9月1日\n二、选课时间：2026年8月25日-8月31日\n三、教材领取：2026年8月28日-8月30日\n\n请各单位提前做好相关准备工作。',
      category: '教学通知',
      status: OaNoticeStatus.PUBLISHED,
      publishedAt: '2026-07-28T09:00:00Z',
      updatedAt: '2026-07-28T09:00:00Z',
      author: '教务处',
      source: 'OA系统',
      attachments: [
        { id: 1, name: '2026秋季学期教学安排.pdf', size: '1.2 MB', url: '/files/oa/notice1.pdf' },
      ],
      viewCount: 156,
      isTop: true,
    },
    {
      id: 2,
      title: '关于做好2026年暑假期间安全工作的通知',
      content: '全校师生员工：\n\n为确保暑假期间校园安全，现就有关事项通知如下：\n\n1. 各单位做好安全检查工作\n2. 关好门窗，切断不必要的电源\n3. 注意防火、防盗、防事故\n4. 紧急联系电话：保卫处 010-xxxxxxxx\n\n祝大家暑假愉快！',
      category: '安全通知',
      status: OaNoticeStatus.PUBLISHED,
      publishedAt: '2026-07-20T14:30:00Z',
      updatedAt: '2026-07-20T14:30:00Z',
      author: '保卫处',
      source: 'OA系统',
      attachments: [],
      viewCount: 89,
      isTop: false,
    },
    {
      id: 3,
      title: '关于组织2026年度教师教学能力提升培训的通知',
      content: '各教学单位及全体教师：\n\n为提升教师教学能力和水平，学校决定组织2026年度教师教学能力提升培训。\n\n培训时间：2026年8月15日-8月20日\n培训地点：教师发展中心\n参加人员：全体专职教师\n\n请各单位合理安排工作，组织教师按时参加。',
      category: '人事通知',
      status: OaNoticeStatus.PUBLISHED,
      publishedAt: '2026-07-15T10:00:00Z',
      updatedAt: '2026-07-15T10:00:00Z',
      author: '人事处',
      source: 'OA系统',
      attachments: [
        { id: 2, name: '培训报名表.docx', size: '256 KB', url: '/files/oa/notice2.docx' },
      ],
      viewCount: 234,
      isTop: false,
    },
    {
      id: 4,
      title: '关于开展2026年教学质量评估工作的通知',
      content: '各教学单位：\n\n为进一步提高教学质量，学校决定开展2026年教学质量评估工作。\n\n评估范围：全校所有开设课程\n评估方式：学生评教 + 同行评议 + 专家督导\n评估时间：2026年11月-12月\n\n请各单位高度重视，认真组织。',
      category: '教学通知',
      status: OaNoticeStatus.PUBLISHED,
      publishedAt: '2026-07-10T16:00:00Z',
      updatedAt: '2026-07-10T16:00:00Z',
      author: '教务处',
      source: 'OA系统',
      attachments: [],
      viewCount: 67,
      isTop: false,
    },
    {
      id: 5,
      title: '关于校园网络系统升级维护的通知',
      content: '全校师生员工：\n\n为提升校园网络服务质量，信息中心将于近期对校园网络系统进行升级维护。\n\n维护时间：2026年8月10日 00:00 - 06:00\n影响范围：校园内所有网络服务\n\n维护期间网络服务可能中断，请提前做好相关准备。',
      category: '后勤通知',
      status: OaNoticeStatus.DRAFT,
      publishedAt: '2026-07-05T11:00:00Z',
      updatedAt: '2026-07-05T11:00:00Z',
      author: '信息中心',
      source: 'OA系统',
      attachments: [],
      viewCount: 42,
      isTop: false,
    },
  ]

  private mockMessages: any[] = [
    {
      id: 1,
      type: OaMessageType.SYSTEM,
      title: '系统升级通知',
      content: 'OA系统将于本周六凌晨进行升级维护，届时将暂停使用约2小时。',
      sender: '系统管理员',
      senderId: 0,
      isRead: false,
      createdAt: '2026-07-28T08:00:00Z',
      actionUrl: '/oa/system/upgrade',
    },
    {
      id: 2,
      type: OaMessageType.APPROVAL,
      title: '待审批：请假申请',
      content: '张老师提交了2天的年假申请，请尽快审批。',
      sender: '张老师',
      senderId: 101,
      isRead: false,
      createdAt: '2026-07-27T15:30:00Z',
      actionUrl: '/oa/approval/leave/1001',
    },
    {
      id: 3,
      type: OaMessageType.NOTICE,
      title: '部门会议通知',
      content: '定于明天下午3点在行政楼302会议室召开部门例会，请准时参加。',
      sender: '办公室',
      senderId: 102,
      isRead: true,
      createdAt: '2026-07-26T09:00:00Z',
      actionUrl: '/oa/meeting/dept',
    },
    {
      id: 4,
      type: OaMessageType.TODO,
      title: '待办：课程表确认',
      content: '请确认您下学期的课程表安排，如有异议请于7月31日前反馈。',
      sender: '教务处',
      senderId: 103,
      isRead: false,
      createdAt: '2026-07-25T14:00:00Z',
      actionUrl: '/oa/todo/schedule',
    },
    {
      id: 5,
      type: OaMessageType.SYSTEM,
      title: '密码即将过期提醒',
      content: '您的OA密码将于7天后过期，请及时更换。',
      sender: '系统',
      senderId: 0,
      isRead: true,
      createdAt: '2026-07-24T10:00:00Z',
      actionUrl: '/oa/account/password',
    },
  ]

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLog: AuditLogService,
  ) {
    this.prisma = prisma
    this.auditLog = auditLog
    this.initConfigCache()
  }

  private async initConfigCache() {
    try {
      const configs = await this.prisma.oaConfig.findMany()
      if (configs.length === 0) {
        await this.initializeDefaultConfig()
      } else {
        configs.forEach(c => {
          this.configCache[c.configKey] = c.isEncrypted ? '******' : c.configValue
        })
      }
    } catch (e) {
      this.logger.warn('OA配置数据库访问失败，使用内存默认配置:', e.message)
      this.initMemoryConfig()
    }
  }

  private initMemoryConfig() {
    Object.entries(DEFAULT_OA_CONFIG).forEach(([key, value]) => {
      this.configCache[key] = value.isEncrypted ? '' : value.value
    })
  }

  private async initializeDefaultConfig() {
    try {
      const entries = Object.entries(DEFAULT_OA_CONFIG)
      await Promise.all(
        entries.map(([key, value]) =>
          this.prisma.oaConfig.create({
            data: {
              configKey: key,
              configValue: value.value,
              configType: value.type,
              description: value.description,
              isEncrypted: value.isEncrypted,
            },
          }),
        ),
      )
      entries.forEach(([key, value]) => {
        this.configCache[key] = value.isEncrypted ? '******' : value.value
      })
    } catch (e) {
      this.logger.warn('OA默认配置初始化失败:', e.message)
      this.initMemoryConfig()
    }
  }

  private async getConfigValue(key: string): Promise<string> {
    if (this.configCache[key] !== undefined && this.configCache[key] !== '******') {
      return this.configCache[key]
    }
    try {
      const config = await this.prisma.oaConfig.findUnique({
        where: { configKey: key },
      })
      if (!config) {
        return DEFAULT_OA_CONFIG[key]?.value || ''
      }
      return config.configValue
    } catch {
      return DEFAULT_OA_CONFIG[key]?.value || ''
    }
  }

  async isOaEnabled(): Promise<boolean> {
    const value = await this.getConfigValue(OA_CONFIG_KEYS.ENABLED)
    return value === 'true'
  }

  async getConfig(): Promise<Record<string, any>> {
    try {
      const configs = await this.prisma.oaConfig.findMany()
      const result: Record<string, any> = {}
      configs.forEach(c => {
        result[c.configKey] = {
          value: c.isEncrypted ? '******' : c.configValue,
          type: c.configType,
          description: c.description,
        }
      })
      return result
    } catch {
      const result: Record<string, any> = {}
      Object.entries(DEFAULT_OA_CONFIG).forEach(([key, value]) => {
        result[key] = {
          value: value.isEncrypted ? '******' : value.value,
          type: value.type,
          description: value.description,
        }
      })
      return result
    }
  }

  async updateConfig(dto: OaConfigDto, adminId: number, ip?: string): Promise<void> {
    let existing: any
    try {
      existing = await this.prisma.oaConfig.findUnique({
        where: { configKey: dto.configKey },
      })
    } catch {
      existing = null
    }

    if (!existing) {
      await this.prisma.oaConfig.create({
        data: {
          configKey: dto.configKey,
          configValue: dto.configValue,
          configType: 'STRING',
          description: '动态配置项',
          isEncrypted: false,
        },
      })
    } else {
      const prevValue = existing.isEncrypted ? '******' : existing.configValue
      await this.prisma.oaConfig.update({
        where: { configKey: dto.configKey },
        data: {
          configValue: dto.configValue,
          updatedBy: adminId,
        },
      })

      await this.auditLog.create({
        adminId,
        role: 'system_admin',
        action: 'oa_config_update',
        targetType: 'oa_config',
        targetId: existing.id,
        ip,
        detail: JSON.stringify({
          key: dto.configKey,
          prevValue,
          newValue: existing.isEncrypted ? '******' : dto.configValue,
        }),
      })
    }

    this.configCache[dto.configKey] = dto.configValue
  }

  async getNotices(query: OaNoticeQueryDto) {
    const { page = 1, pageSize = 20, keyword, status } = query
    const defaultPageSize = parseInt(await this.getConfigValue(OA_CONFIG_KEYS.DEFAULT_PAGE_SIZE)) || 20
    const maxPageSize = parseInt(await this.getConfigValue(OA_CONFIG_KEYS.MAX_PAGE_SIZE)) || 100
    const effectivePageSize = Math.min(Math.max(pageSize, 1), maxPageSize)

    if (!(await this.isOaEnabled())) {
      return this.getMockNotices(page, effectivePageSize, keyword, status)
    }

    try {
      const result = await this.fetchFromOaPlatform(OA_API_ENDPOINTS.NOTICES, {
        page,
        pageSize: effectivePageSize,
        keyword,
        status,
      })

      if (result && result.data) {
        return result.data
      }
    } catch (e) {
      this.logger.warn(`OA通知获取失败，使用Mock数据: ${e.message}`)
    }

    return this.getMockNotices(page, effectivePageSize, keyword, status)
  }

  async getNoticeDetail(id: string) {
    if (!(await this.isOaEnabled())) {
      return this.getMockNoticeDetail(id)
    }

    try {
      const result = await this.fetchFromOaPlatform(
        OA_API_ENDPOINTS.NOTICE_DETAIL.replace(':id', id),
      )

      if (result && result.data) {
        return result.data
      }
    } catch (e) {
      this.logger.warn(`OA通知详情获取失败，使用Mock数据: ${e.message}`)
    }

    return this.getMockNoticeDetail(id)
  }

  async getMessages(query: OaMessageQueryDto) {
    const { page = 1, pageSize = 20, type, unreadOnly } = query

    if (!(await this.isOaEnabled())) {
      return this.getMockMessages(page, pageSize, type, unreadOnly)
    }

    try {
      const result = await this.fetchFromOaPlatform(OA_API_ENDPOINTS.MESSAGES, {
        page,
        pageSize,
        type,
        unreadOnly: unreadOnly ? 'true' : undefined,
      })

      if (result && result.data) {
        return result.data
      }
    } catch (e) {
      this.logger.warn(`OA消息获取失败，使用Mock数据: ${e.message}`)
    }

    return this.getMockMessages(page, pageSize, type, unreadOnly)
  }

  async syncNotices(dto: OaSyncDto, adminId: number, ip?: string) {
    if (!(await this.isOaEnabled())) {
      throw new BadRequestException({
        code: OaErrorCode.OA_NOT_ENABLED,
        message: 'OA集成未启用，无法同步',
      })
    }

    try {
      const result = await this.fetchFromOaPlatform(OA_API_ENDPOINTS.SYNC, {
        type: dto.type || 'all',
        force: dto.force ? 'true' : undefined,
      })

      await this.auditLog.create({
        adminId,
        role: 'system_admin',
        action: 'oa_sync',
        targetType: 'oa_sync',
        targetId: 0,
        ip,
        detail: JSON.stringify({
          type: dto.type || 'all',
          force: dto.force || false,
          result: result?.data || null,
        }),
      })

      return {
        success: true,
        message: '同步触发成功',
        data: result?.data || null,
      }
    } catch (e: any) {
      this.logger.error(`OA同步失败: ${e.message}`)
      throw new BadRequestException({
        code: OaErrorCode.OA_SYNC_FAILED,
        message: e.message || '同步失败',
      })
    }
  }

  private async fetchFromOaPlatform(path: string, params?: Record<string, any>): Promise<any> {
    const baseUrl = await this.getConfigValue(OA_CONFIG_KEYS.BASE_URL)
    const timeout = parseInt(await this.getConfigValue(OA_CONFIG_KEYS.API_TIMEOUT)) || 5000
    const authToken = await this.getConfigValue(OA_CONFIG_KEYS.AUTH_TOKEN)

    const url = new URL(`${baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value))
        }
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        method: 'GET',
        headers,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`OA平台返回错误: HTTP ${response.status}`)
      }

      return await response.json()
    } catch (e: any) {
      clearTimeout(timeoutId)
      if (e.name === 'AbortError') {
        throw new Error(`OA平台请求超时 (${timeout}ms)`)
      }
      throw e
    }
  }

  private getMockNotices(page: number, pageSize: number, keyword?: string, status?: string) {
    let filtered = [...this.mockNotices]

    if (keyword) {
      const kw = keyword.toLowerCase()
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(kw) ||
          n.content.toLowerCase().includes(kw),
      )
    }

    if (status) {
      filtered = filtered.filter(n => n.status === status)
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return {
      list,
      total,
      page,
      pageSize,
    }
  }

  private getMockNoticeDetail(id: string) {
    const notice = this.mockNotices.find(n => String(n.id) === String(id))
    if (!notice) {
      throw new NotFoundException({
        code: OaErrorCode.OA_NOTICE_NOT_FOUND,
        message: '通知不存在',
      })
    }
    return notice
  }

  private getMockMessages(page: number, pageSize: number, type?: string, unreadOnly?: boolean) {
    let filtered = [...this.mockMessages]

    if (type) {
      filtered = filtered.filter(m => m.type === type)
    }

    if (unreadOnly) {
      filtered = filtered.filter(m => !m.isRead)
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return {
      list,
      total,
      page,
      pageSize,
    }
  }
}