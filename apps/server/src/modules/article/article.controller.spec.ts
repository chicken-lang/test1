import { ArticleController } from './article.controller.js'
import { ArticleService } from './article.service.js'
import { CreateDraftDto } from './dto/create-draft.dto.js'

function createMockArticleService() {
  return {
    createDraft: jest.fn().mockResolvedValue({ id: 1001, title: '测试稿件', status: 'draft' }),
    findMyDrafts: jest.fn().mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 }),
    findPendingReview: jest.fn().mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 }),
    findPendingFinalReview: jest.fn().mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 }),
    findPublished: jest.fn().mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 }),
    findRejected: jest.fn().mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 }),
    findById: jest.fn().mockResolvedValue({ id: 1, title: '测试稿件' }),
    updateDraft: jest.fn().mockResolvedValue({ id: 1, title: '更新后的稿件' }),
    deleteDraft: jest.fn().mockResolvedValue({ success: true }),
    submitForReview: jest.fn().mockResolvedValue({ id: 1, status: 'pending_review' }),
    firstReview: jest.fn().mockResolvedValue({ id: 1, status: 'published' }),
    finalReview: jest.fn().mockResolvedValue({ id: 1, status: 'published' }),
    resubmit: jest.fn().mockResolvedValue({ id: 1, status: 'pending_review' }),
    withdraw: jest.fn().mockResolvedValue({ id: 1, status: 'withdrawn' }),
    pinArticle: jest.fn().mockResolvedValue({ id: 1, isTop: true, pinLevel: 'column_top' }),
    unpinArticle: jest.fn().mockResolvedValue({ id: 1, isTop: false }),
  }
}

function createMockArticleExpiryService() {
  return {
    scheduleExpiry: jest.fn().mockResolvedValue(undefined),
    cancelExpiry: jest.fn().mockResolvedValue(undefined),
  }
}

describe('ArticleController', () => {
  let controller: ArticleController
  let articleService: ReturnType<typeof createMockArticleService>
  let articleExpiryService: ReturnType<typeof createMockArticleExpiryService>

  beforeEach(() => {
    jest.clearAllMocks()
    articleService = createMockArticleService()
    articleExpiryService = createMockArticleExpiryService()
    controller = new ArticleController(articleService as any, articleExpiryService as any)
  })

  describe('createDraft', () => {
    it('应成功创建草稿', async () => {
      const dto: CreateDraftDto = { columnId: 1, title: '测试稿件', content: '内容' }
      const mockUser = { id: 100, role: 'editor', bindColumnIds: [1, 2] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.createDraft(dto, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('草稿创建成功')
      expect(result.data.id).toBe(1001)
      expect(articleService.createDraft).toHaveBeenCalledWith(100, 'editor', [1, 2], dto, '127.0.0.1')
    })
  })

  describe('listMyDrafts', () => {
    it('应返回草稿列表', async () => {
      const mockUser = { id: 100, role: 'editor', bindColumnIds: [1] }

      const result = await controller.listMyDrafts(mockUser, '1', '10', 'test')

      expect(result.code).toBe(0)
      expect(articleService.findMyDrafts).toHaveBeenCalledWith(100, 'editor', [1], { page: 1, pageSize: 10, keyword: 'test' })
    })
  })

  describe('listPendingReview', () => {
    it('应返回待初审列表', async () => {
      const mockUser = { id: 200, role: 'reviewer', bindColumnIds: [1, 2] }

      const result = await controller.listPendingReview(mockUser, '1', '10', '')

      expect(result.code).toBe(0)
      expect(articleService.findPendingReview).toHaveBeenCalledWith(200, 'reviewer', [1, 2], { page: 1, pageSize: 10, keyword: '' })
    })
  })

  describe('listPendingFinalReview', () => {
    it('应返回待终审列表', async () => {
      const mockUser = { role: 'column_admin', bindColumnIds: [1] }

      const result = await controller.listPendingFinalReview(mockUser, '1', '10', '')

      expect(result.code).toBe(0)
      expect(articleService.findPendingFinalReview).toHaveBeenCalledWith('column_admin', [1], { page: 1, pageSize: 10, keyword: '' })
    })
  })

  describe('listPublished', () => {
    it('应返回已发布列表', async () => {
      const mockUser = { role: 'editor', bindColumnIds: [1] }

      const result = await controller.listPublished(mockUser, '1', '10', '', '1')

      expect(result.code).toBe(0)
      expect(articleService.findPublished).toHaveBeenCalledWith('editor', [1], { page: 1, pageSize: 10, keyword: '', columnId: 1 })
    })
  })

  describe('listRejected', () => {
    it('应返回驳回列表', async () => {
      const mockUser = { id: 100, role: 'editor', bindColumnIds: [1] }

      const result = await controller.listRejected(mockUser, '1', '10', '')

      expect(result.code).toBe(0)
      expect(articleService.findRejected).toHaveBeenCalledWith(100, 'editor', [1], { page: 1, pageSize: 10, keyword: '' })
    })
  })

  describe('getById', () => {
    it('应返回稿件详情', async () => {
      const mockUser = { id: 100, role: 'editor', bindColumnIds: [1] }
      const result = await controller.getById(1, mockUser)

      expect(result.code).toBe(0)
      expect(result.data.id).toBe(1)
      expect(articleService.findById).toHaveBeenCalledWith(1, 100, 'editor', [1])
    })
  })

  describe('updateDraft', () => {
    it('应成功更新草稿', async () => {
      const mockUser = { id: 100, role: 'editor', bindColumnIds: [1] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.updateDraft(1, { columnId: 1, title: '新标题' }, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('草稿更新成功')
      expect(articleService.updateDraft).toHaveBeenCalledWith(1, 100, 'editor', { columnId: 1, title: '新标题' }, '127.0.0.1')
    })
  })

  describe('deleteDraft', () => {
    it('应成功删除草稿', async () => {
      const mockUser = { id: 100, role: 'editor', bindColumnIds: [1] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.deleteDraft(1, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('草稿删除成功')
      expect(articleService.deleteDraft).toHaveBeenCalledWith(1, 100, 'editor', '127.0.0.1')
    })
  })

  describe('submitForReview', () => {
    it('应成功提交审核', async () => {
      const mockUser = { id: 100, role: 'editor', bindColumnIds: [1] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.submitForReview(1, {}, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('已提交审核')
      expect(articleService.submitForReview).toHaveBeenCalledWith(1, 100, 'editor', {}, '127.0.0.1')
    })
  })

  describe('firstReview', () => {
    it('应成功初审', async () => {
      const mockUser = { id: 200, role: 'reviewer', bindColumnIds: [1] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.firstReview(1, { action: 'published' }, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('初审完成')
      expect(articleService.firstReview).toHaveBeenCalledWith(1, 200, 'reviewer', { action: 'published' }, '127.0.0.1')
    })
  })

  describe('finalReview', () => {
    it('应成功终审', async () => {
      const mockUser = { id: 300, role: 'column_admin', bindColumnIds: [1] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.finalReview(1, { action: 'published' }, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('终审完成')
      expect(articleService.finalReview).toHaveBeenCalledWith(1, 300, 'column_admin', { action: 'published' }, '127.0.0.1')
    })
  })

  describe('resubmit', () => {
    it('应成功重新提交', async () => {
      const mockUser = { id: 100, role: 'editor', bindColumnIds: [1] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.resubmit(1, { content: '修改后内容' }, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('已重新提交审核')
      expect(articleService.resubmit).toHaveBeenCalledWith(1, 100, 'editor', { content: '修改后内容' }, '127.0.0.1')
    })
  })

  describe('withdraw', () => {
    it('应成功撤回稿件', async () => {
      const mockUser = { id: 100, role: 'editor', bindColumnIds: [1] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.withdraw(1, { reason: '需要修改' }, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('已撤回')
      expect(articleService.withdraw).toHaveBeenCalledWith(1, 100, 'editor', { reason: '需要修改' }, '127.0.0.1')
    })
  })

  describe('pinArticle', () => {
    it('应成功置顶稿件', async () => {
      const mockUser = { id: 300, role: 'column_admin', bindColumnIds: [1] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.pinArticle(1, { pinLevel: 'column_top' }, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('置顶成功')
      expect(articleService.pinArticle).toHaveBeenCalledWith(1, 300, 'column_admin', { pinLevel: 'column_top' }, '127.0.0.1')
    })
  })

  describe('unpinArticle', () => {
    it('应成功取消置顶', async () => {
      const mockUser = { id: 300, role: 'column_admin', bindColumnIds: [1] }
      const mockReq = { ip: '127.0.0.1' }

      const result = await controller.unpinArticle(1, mockUser, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('取消置顶成功')
      expect(articleService.unpinArticle).toHaveBeenCalledWith(1, 300, 'column_admin', '127.0.0.1')
    })
  })
})
