import { Test, TestingModule } from '@nestjs/testing'
import { MessageService } from './message.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  MessageType,
  MessagePriority,
  ReceiverRole,
  BizType,
  MessageTemplates,
} from './message.constants.js'

// ==================== Mock 数据模板 ====================

const baseAdmin = {
  id: 0,
  role: 'editor',
  status: 'active' as string,
  nickname: '',
  username: '',
}

function createMockAdmin(
  overrides: Partial<typeof baseAdmin>,
): typeof baseAdmin {
  return { ...baseAdmin, ...overrides }
}

// ==================== Mock PrismaService ====================

let _msgIdCounter = 2000
let _adminIdCounter = 2000

function createMockPrismaService() {
  let messageStore: Record<number, any> = {}
  let adminStore: Record<number, any> = {}

  const message = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_msgIdCounter
      const record = {
        id,
        type: data.type,
        title: data.title,
        content: data.content,
        senderId: data.senderId ?? null,
        receiverId: data.receiverId ?? null,
        receiverRole: data.receiverRole ?? null,
        receiverDeptId: data.receiverDeptId ?? null,
        bizType: data.bizType ?? null,
        bizId: data.bizId ?? null,
        articleId: data.articleId ?? null,
        action: data.action ?? null,
        actorId: data.actorId ?? null,
        priority: data.priority ?? MessagePriority.NORMAL,
        isRead: false,
        readAt: null,
        isArchived: false,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      messageStore[id] = record
      return Promise.resolve(record)
    }),

    createMany: jest.fn().mockImplementation(({ data }: any) => {
      const created = data.map((item: any) => {
        const id = ++_msgIdCounter
        const record = {
          id,
          type: item.type,
          title: item.title,
          content: item.content,
          senderId: item.senderId ?? null,
          receiverId: item.receiverId ?? null,
          receiverRole: item.receiverRole ?? null,
          receiverDeptId: item.receiverDeptId ?? null,
          bizType: item.bizType ?? null,
          bizId: item.bizId ?? null,
          articleId: item.articleId ?? null,
          action: item.action ?? null,
          actorId: item.actorId ?? null,
          priority: item.priority ?? MessagePriority.NORMAL,
          isRead: false,
          readAt: null,
          isArchived: false,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        messageStore[id] = record
        return record
      })
      return Promise.resolve({ count: created.length })
    }),

    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(messageStore[where.id] ?? null)
    }),

    findMany: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(messageStore)
      if (where?.receiverId !== undefined) results = results.filter(r => r.receiverId === where.receiverId)
      if (where?.isRead !== undefined) results = results.filter(r => r.isRead === where.isRead)
      if (where?.isDeleted !== undefined) results = results.filter(r => r.isDeleted === where.isDeleted)
      if (where?.type !== undefined) results = results.filter(r => r.type === where.type)
      return Promise.resolve(results)
    }),

    count: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(messageStore)
      if (where?.receiverId !== undefined) results = results.filter(r => r.receiverId === where.receiverId)
      if (where?.isRead !== undefined) results = results.filter(r => r.isRead === where.isRead)
      if (where?.isDeleted !== undefined) results = results.filter(r => r.isDeleted === where.isDeleted)
      if (where?.type !== undefined) results = results.filter(r => r.type === where.type)
      return Promise.resolve(results.length)
    }),

    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const record = messageStore[where.id]
      if (!record) return Promise.reject(new Error('Not found'))
      const merged = { ...record, ...data }
      messageStore[where.id] = merged
      return Promise.resolve(merged)
    }),

    updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
      let results = Object.values(messageStore)
      if (where?.receiverId !== undefined) results = results.filter(r => r.receiverId === where.receiverId)
      if (where?.isRead !== undefined) results = results.filter(r => r.isRead === where.isRead)
      if (where?.isDeleted !== undefined) results = results.filter(r => r.isDeleted === where.isDeleted)
      if (where?.type !== undefined) results = results.filter(r => r.type === where.type)
      const count = results.length
      for (const r of results) {
        Object.assign(messageStore[r.id], data)
      }
      return Promise.resolve({ count })
    }),
  }

  const admin = {
    findMany: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(adminStore)
      if (where?.status) results = results.filter(r => r.status === where.status)
      if (where?.role?.in) results = results.filter(r => where.role.in.includes(r.role))
      return Promise.resolve(results)
    }),
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(adminStore[where.id] ?? null)
    }),
  }

  function _resetStore() {
    messageStore = {}
    adminStore = {}
  }

  function _setAdmins(list: Array<{ id: number; role: string; status: string; nickname: string; username: string }>) {
    adminStore = {}
    for (const a of list) {
      adminStore[a.id] = { ...a }
    }
  }

  function _getMsgStore() {
    return messageStore
  }

  return {
    message,
    admin,
    _resetStore,
    _setAdmins,
    _getMsgStore,
  }
}

// ==================== 测试套件 ====================

describe('MessageService - 稿件流转通知', () => {
  let service: MessageService
  let prisma: ReturnType<typeof createMockPrismaService>

  // 不同角色的管理员模板数据
  const MOCK_ADMINS = [
    createMockAdmin({ id: 10, role: ReceiverRole.EDITOR, status: 'active', nickname: '编辑张三', username: 'editor_zhang' }),
    createMockAdmin({ id: 11, role: ReceiverRole.REVIEWER, status: 'active', nickname: '审稿人李四', username: 'reviewer_li' }),
    createMockAdmin({ id: 12, role: ReceiverRole.COLUMN_ADMIN, status: 'active', nickname: '栏目管理王五', username: 'column_admin_wang' }),
    createMockAdmin({ id: 13, role: ReceiverRole.SYSTEM_ADMIN, status: 'active', nickname: '系统管理赵六', username: 'system_admin_zhao' }),
    createMockAdmin({ id: 14, role: ReceiverRole.REVIEWER, status: 'disabled', nickname: '已禁用审稿人', username: 'reviewer_disabled' }),
    createMockAdmin({ id: 15, role: ReceiverRole.COLUMN_ADMIN, status: 'disabled', nickname: '已禁用栏目管理', username: 'column_admin_disabled' }),
  ]

  beforeEach(async () => {
    jest.clearAllMocks()
    _msgIdCounter = 2000
    prisma = createMockPrismaService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(MessageService)
  })

  // ==================== sendManuscriptSubmitted ====================

  describe('sendManuscriptSubmitted() - 稿件提交通知', () => {
    beforeEach(() => {
      prisma._setAdmins(MOCK_ADMINS)
    })

    it('稿件提交后应通知 reviewer 和 column_admin 以及 system_admin', async () => {
      const result = await service.sendManuscriptSubmitted(
        100,
        '基于深度学习的教务系统研究',
        1,
        '投稿人A',
      )

      // reviewer(11) + column_admin(12) + system_admin(13) = 3人 (disabled 的 14/15 不应收到)
      expect(result.count).toBe(3)

      const store = prisma._getMsgStore()
      const msgs = Object.values(store)
      expect(msgs).toHaveLength(3)

      const receiverIds = msgs.map((m: any) => m.receiverId).sort()
      expect(receiverIds).toEqual([11, 12, 13])
    })

    it('通知标题应包含稿件标题', async () => {
      await service.sendManuscriptSubmitted(
        101,
        '量子计算在编辑出版中的应用',
        1,
        '投稿人B',
      )

      const store = prisma._getMsgStore()
      const msgs = Object.values(store)
      for (const m of msgs) {
        expect(m.content).toContain('量子计算在编辑出版中的应用')
        expect(m.content).toContain('101')
      }
    })

    it('通知类型为 approval-todo', async () => {
      await service.sendManuscriptSubmitted(102, '稿件C', 1, '投稿人C')

      const store = prisma._getMsgStore()
      const msgs = Object.values(store)
      for (const m of msgs) {
        expect(m.type).toBe(MessageType.APPROVAL_TODO)
      }
    })

    it('优先级为 normal', async () => {
      await service.sendManuscriptSubmitted(103, '稿件D', 1, '投稿人D')

      const store = prisma._getMsgStore()
      const msgs = Object.values(store)
      for (const m of msgs) {
        expect(m.priority).toBe(MessagePriority.NORMAL)
      }
    })

    it('应包含 articleId 和 bizType=manuscript', async () => {
      await service.sendManuscriptSubmitted(104, '稿件E', 1, '投稿人E')

      const store = prisma._getMsgStore()
      const msgs = Object.values(store)
      for (const m of msgs) {
        expect(m.articleId).toBe(104)
        expect(m.bizType).toBe(BizType.MANUSCRIPT)
        expect(m.bizId).toBe(104)
      }
    })

    it('无审核人时应返回 count=0 而不抛异常', async () => {
      prisma._setAdmins([])

      const result = await service.sendManuscriptSubmitted(105, '稿件F', 1, '投稿人F')
      expect(result).toEqual({ count: 0 })
    })
  })

  // ==================== sendManuscriptReviewPassToFinal ====================

  describe('sendManuscriptReviewPassToFinal() - 初审通过通知', () => {
    beforeEach(() => {
      prisma._setAdmins(MOCK_ADMINS)
    })

    it('初审通过后应通知 column_admin 和 system_admin', async () => {
      const result = await service.sendManuscriptReviewPassToFinal(
        200,
        '初审通过稿件',
        11,
        '审稿人李四',
      )

      // column_admin(12) + system_admin(13) = 2人, reviewer 不应收到
      expect(result.count).toBe(2)

      const store = prisma._getMsgStore()
      const msgs = Object.values(store)
      const receiverIds = msgs.map((m: any) => m.receiverId).sort()
      expect(receiverIds).toEqual([12, 13])
    })

    it('通知应包含审核人信息（senderId/actorId 为审核人）', async () => {
      await service.sendManuscriptReviewPassToFinal(
        201,
        '初审通过稿件2',
        11,
        '审稿人李四',
      )

      const store = prisma._getMsgStore()
      const msgs = Object.values(store)
      for (const m of msgs) {
        expect(m.senderId).toBe(11)
        expect(m.actorId).toBe(11)
        expect(m.action).toBe('review_pass_to_final')
        expect(m.title).toBe(MessageTemplates.MANUSCRIPT_REVIEW_PASS_TO_FINAL.title)
        expect(m.content).toContain('初审通过稿件2')
      }
    })

    it('无终审人员时应返回 count=0', async () => {
      prisma._setAdmins([
        createMockAdmin({ id: 11, role: ReceiverRole.REVIEWER, status: 'active', nickname: '仅审稿人', username: 'only_reviewer' }),
      ])

      const result = await service.sendManuscriptReviewPassToFinal(202, '稿件', 11, '审稿人')
      expect(result).toEqual({ count: 0 })
    })
  })

  // ==================== sendManuscriptReviewRejected ====================

  describe('sendManuscriptReviewRejected() - 初审驳回通知', () => {
    beforeEach(() => {
      prisma._setAdmins(MOCK_ADMINS)
    })

    it('初审驳回应通知作者(通过 authorId)', async () => {
      const result = await service.sendManuscriptReviewRejected(
        300,
        '被驳回稿件',
        100,
        '格式不符合要求，请修改后重新提交',
        11,
      )

      expect(result.receiverId).toBe(100)
      expect(result.senderId).toBe(11)
      expect(result.actorId).toBe(11)
    })

    it('优先级应为 high', async () => {
      const result = await service.sendManuscriptReviewRejected(
        301,
        '被驳回稿件2',
        100,
        '内容重复',
        11,
      )

      expect(result.priority).toBe(MessagePriority.HIGH)
    })

    it('内容应包含驳回原因', async () => {
      const rejectReason = '查重率超过30%，不符合发表要求'
      const result = await service.sendManuscriptReviewRejected(
        302,
        '学术不端稿件',
        100,
        rejectReason,
        11,
      )

      expect(result.content).toContain(rejectReason)
      expect(result.content).toContain('学术不端稿件')
      expect(result.title).toBe(MessageTemplates.MANUSCRIPT_REVIEW_REJECT.title)
    })

    it('bizType 应为 manuscript，articleId 应正确关联', async () => {
      const result = await service.sendManuscriptReviewRejected(
        303,
        '关联测试稿件',
        100,
        '原因',
        11,
      )

      expect(result.bizType).toBe(BizType.MANUSCRIPT)
      expect(result.bizId).toBe(303)
      expect(result.articleId).toBe(303)
      expect(result.action).toBe('review_reject')
    })
  })

  // ==================== sendManuscriptFinalRejected ====================

  describe('sendManuscriptFinalRejected() - 终审驳回通知', () => {
    beforeEach(() => {
      prisma._setAdmins(MOCK_ADMINS)
    })

    it('终审驳回应通知作者', async () => {
      const result = await service.sendManuscriptFinalRejected(
        400,
        '终审驳回稿件',
        100,
        '数据论证不充分',
        12,
      )

      expect(result.receiverId).toBe(100)
      expect(result.senderId).toBe(12)
      expect(result.actorId).toBe(12)
      expect(result.action).toBe('final_reject')
    })

    it('优先级应为 high', async () => {
      const result = await service.sendManuscriptFinalRejected(
        401,
        '终审驳回稿件2',
        100,
        '论点不成立',
        12,
      )

      expect(result.priority).toBe(MessagePriority.HIGH)
    })

    it('内容应包含稿件标题和驳回原因', async () => {
      const result = await service.sendManuscriptFinalRejected(
        402,
        '重要稿件',
        100,
        '缺少关键实验数据',
        13,
      )

      expect(result.content).toContain('重要稿件')
      expect(result.content).toContain('缺少关键实验数据')
      expect(result.title).toBe(MessageTemplates.MANUSCRIPT_FINAL_REJECT.title)
      expect(result.bizType).toBe(BizType.MANUSCRIPT)
      expect(result.articleId).toBe(402)
    })
  })

  // ==================== sendManuscriptPublished ====================

  describe('sendManuscriptPublished() - 稿件发布通知', () => {
    beforeEach(() => {
      prisma._setAdmins(MOCK_ADMINS)
    })

    it('发布后应通知作者', async () => {
      const result = await service.sendManuscriptPublished(
        500,
        '已发布稿件',
        100,
        12,
      )

      expect(result.receiverId).toBe(100)
      expect(result.senderId).toBe(12)
      expect(result.actorId).toBe(12)
      expect(result.action).toBe('publish')
    })

    it('通知类型为 approval-todo', async () => {
      const result = await service.sendManuscriptPublished(501, '稿件X', 100, 12)

      expect(result.type).toBe(MessageType.APPROVAL_TODO)
    })

    it('优先级为 normal', async () => {
      const result = await service.sendManuscriptPublished(502, '稿件Y', 100, 13)

      expect(result.priority).toBe(MessagePriority.NORMAL)
    })

    it('内容应包含稿件标题', async () => {
      const result = await service.sendManuscriptPublished(
        503,
        '《教育信息化2.0行动计划》解读',
        100,
        13,
      )

      expect(result.content).toContain('《教育信息化2.0行动计划》解读')
      expect(result.title).toBe(MessageTemplates.MANUSCRIPT_PUBLISHED.title)
      expect(result.bizType).toBe(BizType.MANUSCRIPT)
      expect(result.articleId).toBe(503)
    })
  })

  // ==================== findAdminsByRole ====================

  describe('findAdminsByRole() - 按角色查找通知接收人', () => {
    beforeEach(() => {
      prisma._setAdmins(MOCK_ADMINS)
    })

    it('查找 reviewer 角色的活跃管理员', async () => {
      const result = await service.findAdminsByRole([ReceiverRole.REVIEWER])

      // 只有 id=11 是 active reviewer, id=14 是 disabled
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(11)
      expect(result[0].role).toBe(ReceiverRole.REVIEWER)
    })

    it('只返回 status=active 的管理员', async () => {
      const result = await service.findAdminsByRole([
        ReceiverRole.REVIEWER,
        ReceiverRole.COLUMN_ADMIN,
      ])

      // active reviewer(11) + active column_admin(12) = 2
      // disabled reviewer(14) + disabled column_admin(15) 不应包含
      expect(result).toHaveLength(2)
      const ids = result.map(r => r.id).sort()
      expect(ids).toEqual([11, 12])

      for (const admin of result) {
        expect(admin.status).toBe('active')
      }
    })

    it('传入多个角色时返回所有匹配的管理员', async () => {
      const result = await service.findAdminsByRole([
        ReceiverRole.EDITOR,
        ReceiverRole.REVIEWER,
        ReceiverRole.COLUMN_ADMIN,
        ReceiverRole.SYSTEM_ADMIN,
      ])

      // editor(10) + reviewer(11) + column_admin(12) + system_admin(13) = 4 (仅 active)
      expect(result).toHaveLength(4)
      const ids = result.map(r => r.id).sort()
      expect(ids).toEqual([10, 11, 12, 13])
    })

    it('无匹配角色时返回空数组', async () => {
      const result = await service.findAdminsByRole(['nonexistent_role'])
      expect(result).toEqual([])
    })
  })

  // ==================== batchCreate ====================

  describe('batchCreate() - 批量消息创建', () => {
    it('为多个接收人创建独立消息', async () => {
      const result = await service.batchCreate({
        type: MessageType.APPROVAL_TODO,
        title: '批量通知测试',
        content: '这是批量通知内容',
        senderId: 1,
        receiverIds: [10, 11, 12, 13],
        bizType: BizType.MANUSCRIPT,
        bizId: 600,
        articleId: 600,
        action: 'batch_test',
        actorId: 1,
        priority: MessagePriority.NORMAL,
      })

      expect(result.count).toBe(4)

      const store = prisma._getMsgStore()
      const msgs = Object.values(store)
      expect(msgs).toHaveLength(4)

      // 每个接收人应有独立的消息记录
      const receiverIds = msgs.map((m: any) => m.receiverId).sort()
      expect(receiverIds).toEqual([10, 11, 12, 13])

      // 所有消息应有相同的公共字段
      for (const m of msgs) {
        expect(m.type).toBe(MessageType.APPROVAL_TODO)
        expect(m.title).toBe('批量通知测试')
        expect(m.content).toBe('这是批量通知内容')
        expect(m.senderId).toBe(1)
        expect(m.bizType).toBe(BizType.MANUSCRIPT)
        expect(m.bizId).toBe(600)
        expect(m.articleId).toBe(600)
        expect(m.action).toBe('batch_test')
        expect(m.isRead).toBe(false)
        expect(m.isDeleted).toBe(false)
      }
    })

    it('返回创建的消息数量', async () => {
      const result3 = await service.batchCreate({
        type: MessageType.NOTICE,
        title: '3人通知',
        content: '内容',
        receiverIds: [1, 2, 3],
      })
      expect(result3.count).toBe(3)

      // 清空后测试不同数量
      prisma._resetStore()

      const result1 = await service.batchCreate({
        type: MessageType.SYSTEM,
        title: '1人通知',
        content: '内容',
        receiverIds: [1],
      })
      expect(result1.count).toBe(1)

      const result0 = await service.batchCreate({
        type: MessageType.SYSTEM,
        title: '0人通知',
        content: '内容',
        receiverIds: [],
      })
      expect(result0.count).toBe(0)
    })

    it('每条消息的 ID 应唯一', async () => {
      await service.batchCreate({
        type: MessageType.APPROVAL_TODO,
        title: 'ID唯一性测试',
        content: '内容',
        receiverIds: [10, 11, 12],
      })

      const store = prisma._getMsgStore()
      const ids = Object.keys(store).map(Number)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})
