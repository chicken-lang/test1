import { AuditLogController } from './audit-log.controller.js'
import { AuditLogService } from './audit-log.service.js'

function createMockAuditLogService() {
  return {
    findAll: jest.fn().mockResolvedValue({
      list: [
        { id: 1, action: 'login', username: 'admin', createdAt: new Date() },
        { id: 2, action: 'article_create_draft', username: 'editor', createdAt: new Date() },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
    }),
    findViolations: jest.fn().mockResolvedValue({
      list: [{ id: 1, action: 'access_denied', isViolation: true }],
      total: 1,
      page: 1,
      pageSize: 10,
    }),
  }
}

describe('AuditLogController', () => {
  let controller: AuditLogController
  let auditLogService: ReturnType<typeof createMockAuditLogService>

  beforeEach(() => {
    jest.clearAllMocks()
    auditLogService = createMockAuditLogService()
    controller = new AuditLogController(auditLogService as any)
  })

  describe('getMyLogs', () => {
    it('应返回当前用户的审计日志', async () => {
      const mockUser = { id: 1, role: 'system_admin', bindColumnIds: [] }
      const result = await controller.getMyLogs(mockUser, { page: 1, pageSize: 10 })

      expect(result.code).toBe(0)
      expect(result.data.list.length).toBe(2)
      expect(auditLogService.findAll).toHaveBeenCalled()
    })
  })

  describe('getViolations', () => {
    it('应返回违规操作记录', async () => {
      const result = await controller.getViolations({ page: 1, pageSize: 10 })

      expect(result.code).toBe(0)
      expect(result.data.list.length).toBe(1)
      expect(auditLogService.findViolations).toHaveBeenCalled()
    })
  })
})
