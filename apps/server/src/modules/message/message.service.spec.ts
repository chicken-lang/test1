import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { MessageService } from './message.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  MessageType,
  MessagePriority,
  ReceiverRole,
  BizType,
  MessageTemplates,
} from './message.constants.js'
import type {
  CreateMessageDto,
  CreateBatchMessageDto,
  SendNoticeDto,
  QueryMessageDto,
  MarkAllReadDto,
} from './message.dto.js'

// ==================== Mock 数据 ====================

let _msgIdCounter = 1000
let _adminIdCounter = 1000

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

    findMany: jest.fn().mockImplementation(({ where, orderBy, skip, take }: any) => {
      let results = Object.values(messageStore)

      if (where?.receiverId !== undefined) results = results.filter(r => r.receiverId === where.receiverId)
      if (where?.isRead !== undefined) results = results.filter(r => r.isRead === where.isRead)
      if (where?.isDeleted !== undefined) results = results.filter(r => r.isDeleted === where.isDeleted)
      if (where?.type !== undefined) results = results.filter(r => r.type === where.type)

      if (orderBy) {
        for (const clause of [...orderBy].reverse()) {
          const key = Object.keys(clause)[0]
          const dir = clause[key]
          results.sort((a, b) => {
            if (a[key] === b[key]) return 0
            return dir === 'asc' ? (a[key] > b[key] ? 1 : -1) : a[key] > b[key] ? -1 : 1
          })
        }
      }

      if (skip !== undefined) results = results.slice(skip)
      if (take !== undefined) results = results.slice(0, take)

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

// ==================== 测试主体 ====================

describe('MessageService', () => {
  let service: MessageService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(async () => {
    jest.clearAllMocks()
    _msgIdCounter = 1000
    prisma = createMockPrismaService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(MessageService)
  })

  // ==================== createMessage ====================

  describe('createMessage', () => {
    it('应创建单条消息并返回完整记录', async () => {
      const dto: CreateMessageDto = {
        type: MessageType.APPROVAL_TODO,
        title: '测试标题',
        content: '测试内容',
        senderId: 1,
        receiverId: 2,
        priority: MessagePriority.HIGH,
      }
      const result = await service.createMessage(dto)

      expect(result).toBeDefined()
      expect(result.id).toBeGreaterThan(0)
      expect(result.type).toBe('approval-todo')
      expect(result.title).toBe('测试标题')
      expect(result.content).toBe('测试内容')
      expect(result.senderId).toBe(1)
      expect(result.receiverId).toBe(2)
      expect(result.priority).toBe('high')
      expect(result.isRead).toBe(false)
      expect(result.isDeleted).toBe(false)
    })

    it('未指定 priority 时应使用默认 normal', async () => {
      const dto: CreateMessageDto = {
        type: MessageType.SYSTEM,
        title: '系统通知',
        content: '内容',
      }
      const result = await service.createMessage(dto)
      expect(result.priority).toBe('normal')
    })

    it('未指定 receiverId 时应为 null', async () => {
      const dto: CreateMessageDto = {
        type: MessageType.SYSTEM,
        title: '广播',
        content: '全员通知',
      }
      const result = await service.createMessage(dto)
      expect(result.receiverId).toBeNull()
    })
  })

  // ==================== batchCreate ====================

  describe('batchCreate', () => {
    it('应为每个接收人生成独立消息记录', async () => {
      const dto: CreateBatchMessageDto = {
        type: MessageType.APPROVAL_TODO,
        title: '批量通知',
        content: '内容',
        receiverIds: [10, 20, 30],
        senderId: 1,
        bizType: BizType.MANUSCRIPT,
        bizId: 42,
        action: 'submit',
        priority: MessagePriority.NORMAL,
      }
      const result = await service.batchCreate(dto)

      expect(result.count).toBe(3)

      const store = prisma._getMsgStore()
      const messages = Object.values(store)
      expect(messages).toHaveLength(3)

      const receiverIds = messages.map(m => m.receiverId).sort()
      expect(receiverIds).toEqual([10, 20, 30])

      for (const m of messages) {
        expect(m.type).toBe('approval-todo')
        expect(m.title).toBe('批量通知')
        expect(m.senderId).toBe(1)
        expect(m.bizType).toBe('manuscript')
        expect(m.bizId).toBe(42)
        expect(m.action).toBe('submit')
        expect(m.isRead).toBe(false)
      }
    })

    it('空接收人列表应返回 0 条记录', async () => {
      const dto: CreateBatchMessageDto = {
        type: MessageType.NOTICE,
        title: '空通知',
        content: '内容',
        receiverIds: [],
      }
      const result = await service.batchCreate(dto)
      expect(result.count).toBe(0)
    })
  })

  // ==================== findAdminsByRole ====================

  describe('findAdminsByRole', () => {
    it('应返回指定角色且 status=active 的管理员', async () => {
      prisma._setAdmins([
        { id: 1, role: 'reviewer', status: 'active', nickname: 'A', username: 'a' },
        { id: 2, role: 'column_admin', status: 'active', nickname: 'B', username: 'b' },
        { id: 3, role: 'reviewer', status: 'disabled', nickname: 'C', username: 'c' },
        { id: 4, role: 'system_admin', status: 'active', nickname: 'D', username: 'd' },
      ])

      const result = await service.findAdminsByRole(['reviewer', 'system_admin'])

      expect(result).toHaveLength(2)
      expect(result.map(r => r.id).sort()).toEqual([1, 4])
    })

    it('无匹配角色时返回空数组', async () => {
      prisma._setAdmins([
        { id: 5, role: 'editor', status: 'active', nickname: 'E', username: 'e' },
      ])

      const result = await service.findAdminsByRole(['reviewer'])
      expect(result).toEqual([])
    })
  })

  // ==================== 稿件流转通知 ====================

  describe('稿件流转通知', () => {
    const MOCK_REVIEWERS = [
      { id: 10, role: 'reviewer', status: 'active', nickname: '审稿人', username: 'reviewer' },
      { id: 11, role: 'column_admin', status: 'active', nickname: '栏目编辑', username: 'column_admin' },
      { id: 12, role: 'system_admin', status: 'active', nickname: '系统管理员', username: 'system_admin' },
    ]

    beforeEach(() => {
      prisma._setAdmins(MOCK_REVIEWERS)
    })

    // --- sendManuscriptSubmitted ---

    describe('sendManuscriptSubmitted', () => {
      it('应通知所有审稿人、栏目管理员和系统管理员', async () => {
        const result = await service.sendManuscriptSubmitted(
          42,
          '测试稿件',
          1,
          '提交人',
        )

        expect(result.count).toBe(3)

        const store = prisma._getMsgStore()
        const msgs = Object.values(store)
        expect(msgs).toHaveLength(3)

        for (const m of msgs) {
          expect(m.type).toBe('approval-todo')
          expect(m.title).toBe('【待审】新稿件待初审')
          expect(m.content).toContain('测试稿件')
          expect(m.content).toContain('42')
          expect(m.bizType).toBe('manuscript')
          expect(m.bizId).toBe(42)
          expect(m.articleId).toBe(42)
          expect(m.action).toBe('submit')
          expect(m.actorId).toBe(1)
          expect(m.priority).toBe('normal')
        }

        const receiverIds = msgs.map(m => m.receiverId).sort()
        expect(receiverIds).toEqual([10, 11, 12])
      })

      it('无审稿人时应返回 count=0 而不抛异常', async () => {
        prisma._setAdmins([])

        const result = await service.sendManuscriptSubmitted(
          42,
          '测试稿件',
          1,
          '提交人',
        )

        expect(result).toEqual({ count: 0 })
      })

      it('稿件标题应正确填充到模板中', async () => {
        const result = await service.sendManuscriptSubmitted(
          99,
          '《神经网络在教务系统中的应用》',
          1,
          '张三',
        )

        const store = prisma._getMsgStore()
        const msgs = Object.values(store)
        expect(msgs[0].content).toContain('《神经网络在教务系统中的应用》')
        expect(msgs[0].content).toContain('99')
      })
    })

    // --- sendManuscriptReviewPassToFinal ---

    describe('sendManuscriptReviewPassToFinal', () => {
      it('应通知栏目管理员和系统管理员', async () => {
        const result = await service.sendManuscriptReviewPassToFinal(
          42,
          '测试稿件',
          10,
          '初审人',
        )

        expect(result.count).toBe(2) // column_admin + system_admin, reviewer 不应收到

        const store = prisma._getMsgStore()
        const msgs = Object.values(store)
        const receiverIds = msgs.map(m => m.receiverId).sort()
        expect(receiverIds).toEqual([11, 12]) // column_admin(11), system_admin(12)

        for (const m of msgs) {
          expect(m.type).toBe('approval-todo')
          expect(m.title).toBe('【待审】稿件待终审')
          expect(m.content).toContain('测试稿件')
          expect(m.bizType).toBe('manuscript')
          expect(m.action).toBe('review_pass_to_final')
          expect(m.senderId).toBe(10)
          expect(m.actorId).toBe(10)
        }
      })

      it('无终审人员时应返回 count=0', async () => {
        prisma._setAdmins([
          { id: 10, role: 'reviewer', status: 'active', nickname: 'A', username: 'a' },
        ])

        const result = await service.sendManuscriptReviewPassToFinal(
          10, '稿件', 10, '初审人',
        )
        expect(result).toEqual({ count: 0 })
      })
    })

    // --- sendManuscriptReviewRejected ---

    describe('sendManuscriptReviewRejected', () => {
      it('应向作者发送驳回通知，优先级为 high', async () => {
        const result = await service.sendManuscriptReviewRejected(
          42,
          '测试稿件',
          100,
          '内容不符合要求',
          10,
        )

        expect(result.receiverId).toBe(100)
        expect(result.type).toBe('approval-todo')
        expect(result.title).toBe('【通知】稿件已被退回')
        expect(result.content).toContain('测试稿件')
        expect(result.content).toContain('内容不符合要求')
        expect(result.priority).toBe('high')
        expect(result.action).toBe('review_reject')
        expect(result.senderId).toBe(10)
        expect(result.actorId).toBe(10)
        expect(result.bizType).toBe('manuscript')
        expect(result.bizId).toBe(42)
        expect(result.articleId).toBe(42)
      })
    })

    // --- sendManuscriptFinalRejected ---

    describe('sendManuscriptFinalRejected', () => {
      it('应向作者发送终审驳回通知，优先级为 high', async () => {
        const result = await service.sendManuscriptFinalRejected(
          42,
          '涉密公文',
          100,
          '涉密信息未处理',
          11,
        )

        expect(result.receiverId).toBe(100)
        expect(result.title).toBe('【通知】稿件已被终审退回')
        expect(result.content).toContain('涉密公文')
        expect(result.content).toContain('涉密信息未处理')
        expect(result.priority).toBe('high')
        expect(result.action).toBe('final_reject')
        expect(result.senderId).toBe(11)
      })
    })

    // --- sendManuscriptPublished ---

    describe('sendManuscriptPublished', () => {
      it('应向作者发送发布通知，优先级为 normal', async () => {
        const result = await service.sendManuscriptPublished(
          42,
          '测试稿件',
          100,
          11,
        )

        expect(result.receiverId).toBe(100)
        expect(result.title).toBe('【通知】稿件已发布')
        expect(result.content).toContain('测试稿件')
        expect(result.priority).toBe('normal')
        expect(result.action).toBe('publish')
        expect(result.senderId).toBe(11)
      })
    })

    // --- sendManuscriptFinalPublished ---

    describe('sendManuscriptFinalPublished', () => {
      it('应向作者发送终审发布通知', async () => {
        const result = await service.sendManuscriptFinalPublished(
          42,
          '涉密公文',
          100,
          12,
        )

        expect(result.receiverId).toBe(100)
        expect(result.title).toBe('【通知】稿件已发布')
        expect(result.priority).toBe('normal')
        expect(result.action).toBe('final_publish')
        expect(result.senderId).toBe(12)
      })
    })
  })

  // ==================== 反馈消息通知 ====================

  describe('反馈消息通知', () => {
    describe('sendFeedbackReplied', () => {
      it('应通知反馈提交人，携带回复摘要', async () => {
        const result = await service.sendFeedbackReplied(
          200,
          '关于登录的反馈',
          100,
          '已修复，请刷新页面',
          11,
        )

        expect(result.type).toBe('feedback')
        expect(result.receiverId).toBe(100)
        expect(result.title).toBe('【反馈】您的反馈已被回复')
        expect(result.content).toContain('关于登录的反馈')
        expect(result.content).toContain('已修复，请刷新页面')
        expect(result.bizType).toBe('feedback')
        expect(result.bizId).toBe(200)
        expect(result.action).toBe('feedback_reply')
      })
    })

    describe('sendFeedbackReturned', () => {
      it('应通知反馈提交人，优先级为 high', async () => {
        const result = await service.sendFeedbackReturned(
          201,
          '内容建议',
          100,
          '描述不清晰',
          11,
        )

        expect(result.type).toBe('feedback')
        expect(result.receiverId).toBe(100)
        expect(result.title).toBe('【反馈】您的反馈被退回')
        expect(result.content).toContain('内容建议')
        expect(result.content).toContain('描述不清晰')
        expect(result.priority).toBe('high')
        expect(result.action).toBe('feedback_return')
      })
    })

    describe('sendFeedbackStatusChanged', () => {
      it('应通知反馈提交人状态变更', async () => {
        const result = await service.sendFeedbackStatusChanged(
          202,
          '新功能请求',
          100,
          '处理中',
          11,
        )

        expect(result.type).toBe('feedback')
        expect(result.receiverId).toBe(100)
        expect(result.content).toContain('新功能请求')
        expect(result.content).toContain('处理中')
        expect(result.bizType).toBe('feedback')
        expect(result.bizId).toBe(202)
        expect(result.action).toBe('feedback_status_change')
      })
    })
  })

  // ==================== 留言咨询消息通知 ====================

  describe('留言咨询消息通知', () => {
    describe('sendInquiryAssigned', () => {
      it('应通知被分配的处理人', async () => {
        const result = await service.sendInquiryAssigned(
          300,
          '新生咨询',
          50,
          1,
        )

        expect(result.type).toBe('approval-todo')
        expect(result.receiverId).toBe(50)
        expect(result.title).toBe('【待办】新留言待处理')
        expect(result.content).toContain('新生咨询')
        expect(result.bizType).toBe('inquiry')
        expect(result.bizId).toBe(300)
        expect(result.action).toBe('inquiry_assigned')
        expect(result.senderId).toBe(1)
        expect(result.priority).toBe('normal')
      })
    })

    describe('sendInquiryUnassigned', () => {
      beforeEach(() => {
        prisma._setAdmins([
          { id: 1, role: 'super_admin', status: 'active', nickname: '超级管理员', username: 'super_admin' },
          { id: 2, role: 'super_admin', status: 'active', nickname: '超管2', username: 'super_admin2' },
        ])
      })

      it('应通知所有 super_admin', async () => {
        const result = await service.sendInquiryUnassigned(
          300,
          '未指派留言',
          null,
        )

        expect(result!.count).toBe(2)

        const store = prisma._getMsgStore()
        const msgs = Object.values(store)
        for (const m of msgs) {
          expect(m.type).toBe('system')
          expect(m.title).toBe('【系统】未指派留言待处理')
          expect(m.content).toContain('未指派留言')
          expect(m.priority).toBe('high')
          expect(m.action).toBe('inquiry_unassigned')
        }
        const receiverIds = msgs.map(m => m.receiverId).sort()
        expect(receiverIds).toEqual([1, 2])
      })

      it('无 super_admin 时应返回 null', async () => {
        prisma._setAdmins([])
        const result = await service.sendInquiryUnassigned(
          300, '未指派留言', null,
        )
        expect(result).toBeNull()
      })
    })

    describe('sendInquiryReplied', () => {
      it('应通知留言提交人', async () => {
        const result = await service.sendInquiryReplied(
          301,
          '成绩查询咨询',
          100,
          '请到教务系统查询',
          50,
        )

        expect(result.type).toBe('feedback')
        expect(result.receiverId).toBe(100)
        expect(result.title).toBe('【留言回复】您有一条留言已回复')
        expect(result.content).toContain('成绩查询咨询')
        expect(result.content).toContain('请到教务系统查询')
        expect(result.bizType).toBe('inquiry')
        expect(result.bizId).toBe(301)
      })
    })

    describe('sendInquiryTimeoutWarning', () => {
      it('应通知处理人，优先级为 urgent', async () => {
        const result = await service.sendInquiryTimeoutWarning(
          302,
          '选课咨询',
          50,
        )

        expect(result.type).toBe('system')
        expect(result.receiverId).toBe(50)
        expect(result.priority).toBe('urgent')
        expect(result.title).toBe('【超时预警】咨询即将超时')
        expect(result.content).toContain('选课咨询')
        expect(result.action).toBe('inquiry_timeout_warning')
      })
    })

    describe('sendInquiryTimeout', () => {
      beforeEach(() => {
        prisma._setAdmins([
          { id: 11, role: 'column_admin', status: 'active', nickname: '栏目编辑', username: 'col' },
          { id: 12, role: 'system_admin', status: 'active', nickname: '系统管理员', username: 'sys' },
          { id: 10, role: 'reviewer', status: 'active', nickname: '审稿人', username: 'rev' },
        ])
      })

      it('应通知栏目管理员和系统管理员，不通知审稿人', async () => {
        const result = await service.sendInquiryTimeout(
          303,
          '选课咨询超时',
        )

        expect(result!.count).toBe(2)

        const store = prisma._getMsgStore()
        const msgs = Object.values(store)
        const receiverIds = msgs.map(m => m.receiverId).sort()
        expect(receiverIds).toEqual([11, 12])

        for (const m of msgs) {
          expect(m.priority).toBe('urgent')
          expect(m.action).toBe('inquiry_timeout')
          expect(m.bizId).toBe(303)
        }
      })

      it('无匹配管理员时应返回 null', async () => {
        prisma._setAdmins([
          { id: 10, role: 'reviewer', status: 'active', nickname: '审稿人', username: 'rev' },
        ])
        const result = await service.sendInquiryTimeout(
          304, '选课咨询超时',
        )
        expect(result).toBeNull()
      })
    })
  })

  // ==================== 普通通知下发 ====================

  describe('普通通知下发 sendNotice', () => {
    beforeEach(() => {
      prisma._setAdmins([
        { id: 1, role: 'super_admin', status: 'active', nickname: '超管', username: 'super' },
        { id: 2, role: 'column_admin', status: 'active', nickname: '栏管', username: 'column' },
        { id: 3, role: 'dept_admin', status: 'active', nickname: '部门管理员', username: 'dept' },
        { id: 4, role: 'editor', status: 'active', nickname: '编辑', username: 'editor' },
        { id: 5, role: 'viewer', status: 'disabled', nickname: '访客', username: 'viewer' },
      ])
    })

    const baseNotice: SendNoticeDto = {
      title: '系统维护通知',
      content: '本周六凌晨2点系统升级',
      sendMode: 'user',
      receiverIds: [1],
    }

    // --- sendMode: all ---

    describe('sendMode=all', () => {
      it('应向所有 status=active 的管理员下发', async () => {
        const dto: SendNoticeDto = { ...baseNotice, sendMode: 'all' }
        const result = await service.sendNotice(1, 'super_admin', dto)

        expect(result.count).toBe(4) // 只有 active 的 4 个

        const store = prisma._getMsgStore()
        const receiverIds = Object.values(store).map(m => m.receiverId).sort()
        expect(receiverIds).toEqual([1, 2, 3, 4])
      })
    })

    // --- sendMode: role ---

    describe('sendMode=role', () => {
      it('应向指定角色的管理员下发', async () => {
        const dto: SendNoticeDto = { ...baseNotice, sendMode: 'role', receiverRole: 'column_admin' }
        const result = await service.sendNotice(1, 'super_admin', dto)

        expect(result.count).toBe(1)
        const store = prisma._getMsgStore()
        expect(Object.values(store)[0].receiverId).toBe(2)
      })

      it('未指定 receiverRole 时应抛 BadRequestException', async () => {
        const dto: SendNoticeDto = { ...baseNotice, sendMode: 'role' }
        await expect(service.sendNotice(1, 'super_admin', dto))
          .rejects.toThrow(BadRequestException)
      })

      it('无匹配角色时应返回 count=0', async () => {
        const dto: SendNoticeDto = { ...baseNotice, sendMode: 'role', receiverRole: 'nonexistent' }
        const result = await service.sendNotice(1, 'super_admin', dto)
        expect(result).toEqual({ count: 0 })
      })
    })

    // --- sendMode: dept ---

    describe('sendMode=dept', () => {
      it('未指定 receiverDeptId 时应抛 BadRequestException', async () => {
        const dto: SendNoticeDto = { ...baseNotice, sendMode: 'dept' }
        await expect(service.sendNotice(1, 'super_admin', dto))
          .rejects.toThrow(BadRequestException)
      })

      it('应设置 receiverDeptId 到消息记录', async () => {
        const dto: SendNoticeDto = {
          ...baseNotice, sendMode: 'dept', receiverDeptId: 5,
        }
        const result = await service.sendNotice(1, 'dept_admin', dto)
        expect(result.count).toBe(4) // 4 个 active 管理员 (id=5 为 disabled)

        const store = prisma._getMsgStore()
        for (const m of Object.values(store)) {
          expect(m.receiverDeptId).toBe(5)
          expect(m.type).toBe('notice')
          expect(m.senderId).toBe(1)
        }
      })
    })

    // --- sendMode: user ---

    describe('sendMode=user', () => {
      it('应向指定用户下发', async () => {
        const dto: SendNoticeDto = { ...baseNotice, sendMode: 'user', receiverIds: [1, 3] }
        const result = await service.sendNotice(1, 'super_admin', dto)

        expect(result.count).toBe(2)
        const store = prisma._getMsgStore()
        const receiverIds = Object.values(store).map(m => m.receiverId).sort()
        expect(receiverIds).toEqual([1, 3])
      })

      it('receiverIds 为空时应抛 BadRequestException', async () => {
        const dto: SendNoticeDto = { ...baseNotice, sendMode: 'user', receiverIds: [] }
        await expect(service.sendNotice(1, 'super_admin', dto))
          .rejects.toThrow(BadRequestException)
      })

      it('receiverIds 超过 500 时应抛 BadRequestException', async () => {
        const dto: SendNoticeDto = {
          ...baseNotice,
          sendMode: 'user',
          receiverIds: Array.from({ length: 501 }, (_, i) => i + 1),
        }
        await expect(service.sendNotice(1, 'super_admin', dto))
          .rejects.toThrow('单次按人员下发上限为500人，请分批发送')
      })

      it('receiverIds 为 500 时不应报错', async () => {
        const dto: SendNoticeDto = {
          ...baseNotice,
          sendMode: 'user',
          receiverIds: Array.from({ length: 500 }, (_, i) => i + 1),
        }
        await expect(service.sendNotice(1, 'super_admin', dto))
          .resolves.not.toThrow()
      })
    })

    // --- 无效 sendMode ---

    describe('无效 sendMode', () => {
      it('应抛 BadRequestException', async () => {
        const dto = { ...baseNotice, sendMode: 'invalid' as any }
        await expect(service.sendNotice(1, 'super_admin', dto))
          .rejects.toThrow(BadRequestException)
      })
    })

    // --- 自定义优先级 ---

    describe('自定义优先级', () => {
      it('应使用指定的优先级', async () => {
        const dto: SendNoticeDto = {
          ...baseNotice,
          sendMode: 'user',
          receiverIds: [1],
          priority: 'urgent',
        }
        await service.sendNotice(1, 'super_admin', dto)

        const store = prisma._getMsgStore()
        expect(Object.values(store)[0].priority).toBe('urgent')
      })

      it('未指定优先级时应为 normal', async () => {
        const dto: SendNoticeDto = { ...baseNotice, sendMode: 'user', receiverIds: [1] }
        await service.sendNotice(1, 'super_admin', dto)

        const store = prisma._getMsgStore()
        expect(Object.values(store)[0].priority).toBe('normal')
      })
    })
  })

  // ==================== 查询接口 ====================

  describe('查询接口', () => {
    beforeEach(async () => {
      // 创建多条测试消息
      const store = prisma._getMsgStore()
      // 直接通过 create 方法添加
      await service.createMessage({
        type: MessageType.APPROVAL_TODO,
        title: '消息1',
        content: '内容1',
        receiverId: 100,
      })
      await service.createMessage({
        type: MessageType.NOTICE,
        title: '消息2',
        content: '内容2',
        receiverId: 100,
      })
      await service.createMessage({
        type: MessageType.APPROVAL_TODO,
        title: '消息3',
        content: '内容3',
        receiverId: 100,
      })
      await service.createMessage({
        type: MessageType.APPROVAL_TODO,
        title: '其他用户消息',
        content: '不应看到',
        receiverId: 200,
      })
    })

    describe('findByReceiver', () => {
      it('应返回指定接收人的消息列表', async () => {
        const query: QueryMessageDto = { page: 1, pageSize: 20 }
        const result = await service.findByReceiver(100, query)

        expect(result.total).toBe(3)
        expect(result.unreadCount).toBe(3)
        expect(result.page).toBe(1)
        expect(result.pageSize).toBe(20)
        expect(result.list).toHaveLength(3)
        for (const m of result.list) {
          expect(m.receiverId).toBe(100)
        }
      })

      it('应支持按 type 过滤', async () => {
        const query: QueryMessageDto = { type: 'approval-todo', page: 1, pageSize: 20 }
        const result = await service.findByReceiver(100, query)

        expect(result.total).toBe(2)
        // unreadCount 为用户全部未读数，不受 type 过滤
        expect(result.unreadCount).toBe(3)
        for (const m of result.list) {
          expect(m.type).toBe('approval-todo')
        }
      })

      it('分页应正确返回', async () => {
        const query: QueryMessageDto = { page: 1, pageSize: 2 }
        const result = await service.findByReceiver(100, query)

        expect(result.total).toBe(3)
        expect(result.list).toHaveLength(2)
        expect(result.page).toBe(1)
        expect(result.pageSize).toBe(2)
      })

      it('第二页应返回剩余消息', async () => {
        const query: QueryMessageDto = { page: 2, pageSize: 2 }
        const result = await service.findByReceiver(100, query)

        expect(result.total).toBe(3)
        expect(result.list).toHaveLength(1)
      })

      it('每页上限 50 条', async () => {
        const query: QueryMessageDto = { page: 1, pageSize: 100 }
        const result = await service.findByReceiver(100, query)

        expect(result.list.length).toBeLessThanOrEqual(50)
      })

      it('消息应按 isRead asc + priority desc + createdAt desc 排序', async () => {
        // 标记一条为已读
        const allMsgs = Object.values(prisma._getMsgStore()).filter(m => m.receiverId === 100)
        await service.markAllAsRead(100)

        // 再创建一条未读的
        await service.createMessage({
          type: MessageType.APPROVAL_TODO,
          title: '未读高优先级',
          content: '内容',
          receiverId: 100,
          priority: MessagePriority.HIGH,
        })

        const query: QueryMessageDto = { page: 1, pageSize: 20 }
        const result = await service.findByReceiver(100, query)

        // 未读应排在前
        expect(result.list[0].isRead).toBe(false)
      })
    })

    describe('getUnreadCount', () => {
      it('应返回指定用户未读消息数', async () => {
        const count = await service.getUnreadCount(100)
        expect(count).toBe(3)
      })

      it('按类型过滤应返回正确数量', async () => {
        const count = await service.getUnreadCount(100, 'approval-todo')
        expect(count).toBe(2)
      })

      it('其他用户的消息不应计入', async () => {
        const count = await service.getUnreadCount(200)
        expect(count).toBe(1)
      })

      it('不存在用户应返回 0', async () => {
        const count = await service.getUnreadCount(999)
        expect(count).toBe(0)
      })
    })
  })

  // ==================== 状态操作 ====================

  describe('状态操作', () => {
    describe('markAsRead', () => {
      it('应将指定消息标记为已读', async () => {
        const msg = await service.createMessage({
          type: MessageType.SYSTEM,
          title: '测试',
          content: '内容',
          receiverId: 100,
        })

        const result = await service.markAsRead(msg.id, 100)
        expect(result.isRead).toBe(true)
        expect(result.readAt).toBeTruthy()
      })

      it('重复标记已读应返回原消息', async () => {
        const msg = await service.createMessage({
          type: MessageType.SYSTEM,
          title: '测试',
          content: '内容',
          receiverId: 100,
        })

        await service.markAsRead(msg.id, 100)
        const result = await service.markAsRead(msg.id, 100)
        expect(result.isRead).toBe(true)
      })

      it('越权操作应抛 BadRequestException', async () => {
        const msg = await service.createMessage({
          type: MessageType.SYSTEM,
          title: '测试',
          content: '内容',
          receiverId: 100,
        })

        await expect(service.markAsRead(msg.id, 999))
          .rejects.toThrow(BadRequestException)
      })

      it('不存在的消息应抛 NotFoundException', async () => {
        await expect(service.markAsRead(99999, 100))
          .rejects.toThrow(NotFoundException)
      })
    })

    describe('markAllAsRead', () => {
      beforeEach(async () => {
        await service.createMessage({
          type: MessageType.APPROVAL_TODO,
          title: '消息1',
          content: '内容1',
          receiverId: 100,
        })
        await service.createMessage({
          type: MessageType.NOTICE,
          title: '消息2',
          content: '内容2',
          receiverId: 100,
        })
        await service.createMessage({
          type: MessageType.APPROVAL_TODO,
          title: '消息3',
          content: '内容3',
          receiverId: 100,
        })
      })

      it('应将所有未读消息标记为已读', async () => {
        const result = await service.markAllAsRead(100)
        expect(result.count).toBe(3)

        const count = await service.getUnreadCount(100)
        expect(count).toBe(0)
      })

      it('按类型标记已读', async () => {
        const dto: MarkAllReadDto = { type: 'approval-todo' }
        const result = await service.markAllAsRead(100, dto)
        expect(result.count).toBe(2) // 只有 2 条 approval-todo

        // 通知仍未读
        const unreadCount = await service.getUnreadCount(100)
        expect(unreadCount).toBe(1)
      })

      it('已全部标记后再标记应返回 count=0', async () => {
        await service.markAllAsRead(100)
        const result = await service.markAllAsRead(100)
        expect(result.count).toBe(0)
      })
    })

    describe('softDelete', () => {
      it('应软删除指定消息', async () => {
        const msg = await service.createMessage({
          type: MessageType.SYSTEM,
          title: '待删除',
          content: '内容',
          receiverId: 100,
        })

        const result = await service.softDelete(msg.id, 100)
        expect(result.isDeleted).toBe(true)
        expect(result.deletedAt).toBeTruthy()
      })

      it('软删除的消息不应出现在列表中', async () => {
        const msg = await service.createMessage({
          type: MessageType.SYSTEM,
          title: '待删除',
          content: '内容',
          receiverId: 100,
        })

        await service.softDelete(msg.id, 100)

        const query: QueryMessageDto = { page: 1, pageSize: 20 }
        const result = await service.findByReceiver(100, query)
        expect(result.list.find(m => m.id === msg.id)).toBeUndefined()
      })

      it('越权删除应抛 BadRequestException', async () => {
        const msg = await service.createMessage({
          type: MessageType.SYSTEM,
          title: '测试',
          content: '内容',
          receiverId: 100,
        })

        await expect(service.softDelete(msg.id, 999))
          .rejects.toThrow(BadRequestException)
      })

      it('不存在的消息应抛 NotFoundException', async () => {
        await expect(service.softDelete(99999, 100))
          .rejects.toThrow(NotFoundException)
      })
    })
  })

  // ==================== 边界条件 ====================

  describe('边界条件', () => {
    describe('稿件通知 - 空值处理', () => {
      it('sendManuscriptSubmitted 对空 reviewer 列表应优雅降级', async () => {
        prisma._setAdmins([])
        const result = await service.sendManuscriptSubmitted(
          1, '稿件', 1, '提交人',
        )
        expect(result).toEqual({ count: 0 })
      })
    })

    describe('模板变量替换', () => {
      it('应正确替换所有占位符', async () => {
        const msg = await service.sendManuscriptReviewRejected(
          99,
          '《测试标题》',
          100,
          '原因很重要',
          10,
        )

        expect(msg.content).toContain('《测试标题》')
        expect(msg.content).toContain('原因很重要')
        expect(msg.content).not.toContain('{')
        expect(msg.content).not.toContain('}')
      })
    })

    describe('大数量批量消息', () => {
      it('应支持较大批量创建（50 条）', async () => {
        const receiverIds = Array.from({ length: 50 }, (_, i) => i + 1)
        const result = await service.batchCreate({
          type: MessageType.NOTICE,
          title: '批量测试',
          content: '内容',
          receiverIds,
        })

        expect(result.count).toBe(50)
        expect(Object.values(prisma._getMsgStore())).toHaveLength(50)
      })
    })
  })
})