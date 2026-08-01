// ====================================================================
// CMS 文章工作流 Store (三审三校完整流程)
// 覆盖: 撰稿→一校→复审→终审→加审→发布→下架→归档
// ====================================================================
import { defineStore } from 'pinia'
import {
  ArticleStatus,
  ArticleColumn,
  MajorFlag,
  ConfidentialLevel,
  ReviewStep,
  ReviewAction,
  StatusLabels,
  ColumnLabels,
  MajorFlagLabels,
  type CmsArticle,
  type ReviewRecord,
  type AdminUser,
  AdminRole,
} from '~/utils/types'

interface CmsArticleState {
  articles: CmsArticle[]
  loading: boolean
}

// ===== Mock 文章数据 =====
const createMockArticles = (): CmsArticle[] => [
  {
    id: 1001,
    title: '2026年春季学期期末考试安排通知',
    docNumber: '深信息教〔2026〕18号',
    column: ArticleColumn.EXAM_NOTICE,
    content: '<p>各学院、各部门：</p><p>根据学校教学计划安排，现将2026年春季学期期末考试有关事项通知如下...</p>',
    summary: '2026年春季学期期末考试时间和场地安排',
    coverImage: '/mock/exam.jpg',
    source: '教务处教务科',
    isReprint: false,
    status: ArticleStatus.PUBLISHED,
    majorFlag: MajorFlag.MAJOR_TEACHING,
    confidentialLevel: ConfidentialLevel.PUBLIC,
    authorId: 1,
    authorName: '张三',
    authorDepartment: '教务科',
    currentReviewStep: ReviewStep.PUBLISHED,
    reviewHistory: [
      { id: 1, articleId: 1001, step: ReviewStep.DRAFTING, operatorId: 1, operatorName: '张三', operatorRole: AdminRole.EDITOR, action: ReviewAction.SUBMIT, comment: '内容已校对，提交复审', operatedAt: '2026-06-20 09:30:00', operatorIp: '192.168.1.100' },
      { id: 2, articleId: 1001, step: ReviewStep.DEPARTMENT_REVIEW, operatorId: 2, operatorName: '李四', operatorRole: AdminRole.REVIEWER, action: ReviewAction.APPROVE, comment: '考试时间、场地无误，通过', operatedAt: '2026-06-20 14:00:00', operatorIp: '192.168.1.105' },
      { id: 3, articleId: 1001, step: ReviewStep.FINAL_REVIEW, operatorId: 3, operatorName: '王五', operatorRole: AdminRole.COLUMN_ADMIN, action: ReviewAction.PUBLISH, comment: '同意发布', operatedAt: '2026-06-21 10:00:00', operatorIp: '192.168.1.110' },
    ],
    attachments: [],
    images: [],
    views: 356,
    publishDate: '2026-06-21',
    createdAt: '2026-06-19',
    updatedAt: '2026-06-21',
    isArchived: false,
  },
  {
    id: 1002,
    title: '关于举办第十二届教学技能大赛的通知',
    docNumber: '深信息教〔2026〕22号',
    column: ArticleColumn.COMPETITION,
    content: '<p>为进一步提升教师教学能力...</p>',
    source: '教务处教研科',
    isReprint: false,
    status: ArticleStatus.IN_FINAL_REVIEW,
    majorFlag: MajorFlag.NORMAL,
    confidentialLevel: ConfidentialLevel.PUBLIC,
    authorId: 1,
    authorName: '张三',
    authorDepartment: '教务科',
    currentReviewStep: ReviewStep.FINAL_REVIEW,
    reviewHistory: [
      { id: 4, articleId: 1002, step: ReviewStep.DRAFTING, operatorId: 1, operatorName: '张三', operatorRole: AdminRole.EDITOR, action: ReviewAction.SUBMIT, comment: '提交复审', operatedAt: '2026-07-01 10:00:00', operatorIp: '192.168.1.100' },
      { id: 5, articleId: 1002, step: ReviewStep.DEPARTMENT_REVIEW, operatorId: 2, operatorName: '李四', operatorRole: AdminRole.REVIEWER, action: ReviewAction.APPROVE, comment: '竞赛方案完整，通过', operatedAt: '2026-07-02 09:30:00', operatorIp: '192.168.1.105' },
    ],
    attachments: [],
    images: [],
    views: 0,
    createdAt: '2026-06-30',
    updatedAt: '2026-07-02',
    isArchived: false,
  },
  {
    id: 1003,
    title: '2026年暑期实训安排及注意事项',
    column: ArticleColumn.NOTICE,
    content: '<p>根据教学计划，暑期实训安排如下...</p>',
    source: '教务处实践科',
    isReprint: false,
    status: ArticleStatus.REJECTED,
    majorFlag: MajorFlag.NORMAL,
    confidentialLevel: ConfidentialLevel.PUBLIC,
    authorId: 1,
    authorName: '张三',
    authorDepartment: '教务科',
    currentReviewStep: ReviewStep.DEPARTMENT_REVIEW,
    reviewHistory: [
      { id: 6, articleId: 1003, step: ReviewStep.DRAFTING, operatorId: 1, operatorName: '张三', operatorRole: AdminRole.EDITOR, action: ReviewAction.SUBMIT, comment: '提交审核', operatedAt: '2026-07-03 11:00:00', operatorIp: '192.168.1.100' },
      { id: 7, articleId: 1003, step: ReviewStep.DEPARTMENT_REVIEW, operatorId: 2, operatorName: '李四', operatorRole: AdminRole.REVIEWER, action: ReviewAction.REJECT, comment: '实训教室编号有误，请核实B栋301是否已改造为实训室', operatedAt: '2026-07-03 15:00:00', operatorIp: '192.168.1.105' },
    ],
    attachments: [],
    images: [],
    views: 0,
    createdAt: '2026-07-03',
    updatedAt: '2026-07-03',
    isArchived: false,
  },
  {
    id: 1004,
    title: '2025-2026学年第二学期国家奖学金公示',
    docNumber: '深信息教〔2026〕25号',
    column: ArticleColumn.NOTICE,
    content: '<p>根据国家奖学金评审办法...</p>',
    source: '教务处学生科',
    isReprint: false,
    status: ArticleStatus.IN_EXTRA_REVIEW,
    majorFlag: MajorFlag.DISCIPLINE,
    confidentialLevel: ConfidentialLevel.PUBLIC,
    authorId: 1,
    authorName: '张三',
    authorDepartment: '教务科',
    currentReviewStep: ReviewStep.EXTRA_REVIEW,
    autoUnpublishAt: '2026-07-22',
    reviewHistory: [
      { id: 8, articleId: 1004, step: ReviewStep.DRAFTING, operatorId: 1, operatorName: '张三', operatorRole: AdminRole.EDITOR, action: ReviewAction.SUBMIT, comment: '公示材料已脱敏', operatedAt: '2026-07-05 09:00:00', operatorIp: '192.168.1.100' },
      { id: 9, articleId: 1004, step: ReviewStep.DEPARTMENT_REVIEW, operatorId: 2, operatorName: '李四', operatorRole: AdminRole.REVIEWER, action: ReviewAction.APPROVE, comment: '名单无误', operatedAt: '2026-07-05 14:00:00', operatorIp: '192.168.1.105' },
      { id: 10, articleId: 1004, step: ReviewStep.FINAL_REVIEW, operatorId: 3, operatorName: '王五', operatorRole: AdminRole.COLUMN_ADMIN, action: ReviewAction.APPROVE, comment: '重大事项，转党委宣传部加审', operatedAt: '2026-07-06 10:00:00', operatorIp: '192.168.1.110' },
    ],
    attachments: [],
    images: [],
    views: 0,
    createdAt: '2026-07-04',
    updatedAt: '2026-07-06',
    isArchived: false,
  },
  {
    id: 1005,
    title: '教务处关于调整2026级人才培养方案的通知',
    docNumber: '深信息教〔2026〕28号',
    column: ArticleColumn.POLICY,
    content: '<p>为适应产业发展和教学改革需要...</p>',
    source: '教务处教务科',
    isReprint: false,
    status: ArticleStatus.DRAFT,
    majorFlag: MajorFlag.NORMAL,
    confidentialLevel: ConfidentialLevel.INTERNAL,
    authorId: 1,
    authorName: '张三',
    authorDepartment: '教务科',
    currentReviewStep: ReviewStep.DRAFTING,
    reviewHistory: [],
    attachments: [],
    images: [],
    views: 0,
    createdAt: '2026-07-07',
    updatedAt: '2026-07-07',
    isArchived: false,
  },
]

export const useCmsArticleStore = defineStore('cms-articles', {
  state: (): CmsArticleState => ({
    articles: createMockArticles(),
    loading: false,
  }),

  getters: {
    /** 按状态筛选 */
    articlesByStatus: (state) => {
      return (status: ArticleStatus): CmsArticle[] =>
        state.articles.filter(a => a.status === status)
    },

    /** 编辑员: 我的草稿 */
    myDrafts: (state) => {
      return (userId: number): CmsArticle[] =>
        state.articles.filter(a =>
          a.authorId === userId &&
          [ArticleStatus.DRAFT, ArticleStatus.REJECTED, ArticleStatus.FINAL_REJECTED].includes(a.status)
        )
    },

    /** 复审员: 待复审队列(本科室) */
    reviewQueue: (state) => {
      return (department: string): CmsArticle[] =>
        state.articles.filter(a =>
          a.authorDepartment === department &&
          a.status === ArticleStatus.SUBMITTED
        )
    },

    /** 终审员: 待终审队列 */
    finalReviewQueue: (state): CmsArticle[] =>
      state.articles.filter(a => a.status === ArticleStatus.IN_REVIEW),

    /** 加审队列(重大事项) */
    extraReviewQueue: (state): CmsArticle[] =>
      state.articles.filter(a => a.status === ArticleStatus.IN_EXTRA_REVIEW),

    /** 已发布文章 */
    publishedArticles: (state): CmsArticle[] =>
      state.articles.filter(a => a.status === ArticleStatus.PUBLISHED),

    /** 定时发布文章 */
    scheduledArticles: (state): CmsArticle[] =>
      state.articles.filter(a => a.status === ArticleStatus.SCHEDULED),

    /** 统计: 各状态数量 */
    statusCounts: (state): Record<string, number> => {
      const counts: Record<string, number> = {}
      for (const a of state.articles) {
        counts[a.status] = (counts[a.status] || 0) + 1
      }
      return counts
    },
  },

  actions: {
    /** 编辑员: 保存草稿 */
    saveDraft(article: Partial<CmsArticle>, currentUser: AdminUser): CmsArticle {
      const newArticle: CmsArticle = {
        id: Date.now(),
        title: article.title || '未命名稿件',
        column: article.column || ArticleColumn.NOTICE,
        content: article.content || '',
        docNumber: article.docNumber,
        summary: article.summary,
        coverImage: article.coverImage,
        source: article.source || currentUser.department,
        isReprint: article.isReprint || false,
        reprintUrl: article.reprintUrl,
        status: ArticleStatus.DRAFT,
        majorFlag: article.majorFlag || MajorFlag.NORMAL,
        confidentialLevel: article.confidentialLevel || ConfidentialLevel.PUBLIC,
        authorId: currentUser.id,
        authorName: currentUser.realName,
        authorDepartment: currentUser.department,
        currentReviewStep: ReviewStep.DRAFTING,
        reviewHistory: [],
        attachments: article.attachments || [],
        images: article.images || [],
        views: 0,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        isArchived: false,
      }
      this.articles.unshift(newArticle)
      return newArticle
    },

    /** 编辑员: 提交审核(一校完成) */
    submitForReview(articleId: number, currentUser: AdminUser, comment: string) {
      const article = this.articles.find(a => a.id === articleId)
      if (!article) throw new Error('稿件不存在')
      if (![ArticleStatus.DRAFT, ArticleStatus.REJECTED, ArticleStatus.FINAL_REJECTED].includes(article.status)) {
        throw new Error('当前状态不允许提交审核')
      }

      article.status = ArticleStatus.SUBMITTED
      article.currentReviewStep = ReviewStep.DEPARTMENT_REVIEW
      article.updatedAt = new Date().toISOString().slice(0, 10)

      article.reviewHistory.push({
        id: Date.now(),
        articleId,
        step: ReviewStep.DRAFTING,
        operatorId: currentUser.id,
        operatorName: currentUser.realName,
        operatorRole: currentUser.role,
        action: ReviewAction.SUBMIT,
        comment: comment || '内容已校对，提交复审',
        operatedAt: new Date().toLocaleString('zh-CN'),
        operatorIp: '192.168.1.100',
      })
    },

    /** 复审员: 审核通过 */
    approveReview(articleId: number, currentUser: AdminUser, comment: string) {
      const article = this.articles.find(a => a.id === articleId)
      if (!article) throw new Error('稿件不存在')
      if (article.status !== ArticleStatus.SUBMITTED) {
        throw new Error('当前状态不允许复审')
      }

      // 检查是否跨科室
      if (article.authorDepartment !== currentUser.department) {
        throw new Error('不可跨科室审核')
      }

      article.status = ArticleStatus.IN_FINAL_REVIEW
      article.currentReviewStep = ReviewStep.FINAL_REVIEW
      article.updatedAt = new Date().toISOString().slice(0, 10)

      article.reviewHistory.push({
        id: Date.now(),
        articleId,
        step: ReviewStep.DEPARTMENT_REVIEW,
        operatorId: currentUser.id,
        operatorName: currentUser.realName,
        operatorRole: currentUser.role,
        action: ReviewAction.APPROVE,
        comment: comment || '复审通过',
        operatedAt: new Date().toLocaleString('zh-CN'),
        operatorIp: '192.168.1.105',
      })
    },

    /** 复审员: 驳回退回编辑 */
    rejectReview(articleId: number, currentUser: AdminUser, comment: string) {
      const article = this.articles.find(a => a.id === articleId)
      if (!article) throw new Error('稿件不存在')
      if (!comment.trim()) throw new Error('驳回时必须填写修改意见')

      article.status = ArticleStatus.REJECTED
      article.currentReviewStep = ReviewStep.DRAFTING
      article.updatedAt = new Date().toISOString().slice(0, 10)

      article.reviewHistory.push({
        id: Date.now(),
        articleId,
        step: ReviewStep.DEPARTMENT_REVIEW,
        operatorId: currentUser.id,
        operatorName: currentUser.realName,
        operatorRole: currentUser.role,
        action: ReviewAction.REJECT,
        comment,
        operatedAt: new Date().toLocaleString('zh-CN'),
        operatorIp: '192.168.1.105',
      })
    },

    /** 终审员: 终审通过并发布 */
    finalApproveAndPublish(articleId: number, currentUser: AdminUser, comment: string, scheduledAt?: string) {
      const article = this.articles.find(a => a.id === articleId)
      if (!article) throw new Error('稿件不存在')

      // 重大事项需加审
      if (article.majorFlag !== MajorFlag.NORMAL) {
        article.status = ArticleStatus.IN_EXTRA_REVIEW
        article.currentReviewStep = ReviewStep.EXTRA_REVIEW
        article.reviewHistory.push({
          id: Date.now(),
          articleId,
          step: ReviewStep.FINAL_REVIEW,
          operatorId: currentUser.id,
          operatorName: currentUser.realName,
          operatorRole: currentUser.role,
          action: ReviewAction.APPROVE,
          comment: `${comment || '终审通过'}，重大事项转加审`,
          operatedAt: new Date().toLocaleString('zh-CN'),
          operatorIp: '192.168.1.110',
        })
        return
      }

      // 普通稿件直接发布
      if (scheduledAt) {
        article.status = ArticleStatus.SCHEDULED
        article.scheduledPublishAt = scheduledAt
      } else {
        article.status = ArticleStatus.PUBLISHED
        article.publishDate = new Date().toISOString().slice(0, 10)
      }
      article.currentReviewStep = ReviewStep.PUBLISHED
      article.updatedAt = new Date().toISOString().slice(0, 10)

      article.reviewHistory.push({
        id: Date.now(),
        articleId,
        step: ReviewStep.FINAL_REVIEW,
        operatorId: currentUser.id,
        operatorName: currentUser.realName,
        operatorRole: currentUser.role,
        action: scheduledAt ? ReviewAction.SCHEDULE : ReviewAction.PUBLISH,
        comment: comment || '终审通过，已发布',
        operatedAt: new Date().toLocaleString('zh-CN'),
        operatorIp: '192.168.1.110',
      })
    },

    /** 终审员: 终审驳回(退回复审) */
    finalReject(articleId: number, currentUser: AdminUser, comment: string) {
      const article = this.articles.find(a => a.id === articleId)
      if (!article) throw new Error('稿件不存在')
      if (!comment.trim()) throw new Error('驳回时必须填写修改意见')

      article.status = ArticleStatus.FINAL_REJECTED
      article.currentReviewStep = ReviewStep.DEPARTMENT_REVIEW
      article.updatedAt = new Date().toISOString().slice(0, 10)

      article.reviewHistory.push({
        id: Date.now(),
        articleId,
        step: ReviewStep.FINAL_REVIEW,
        operatorId: currentUser.id,
        operatorName: currentUser.realName,
        operatorRole: currentUser.role,
        action: ReviewAction.REJECT,
        comment,
        operatedAt: new Date().toLocaleString('zh-CN'),
        operatorIp: '192.168.1.110',
      })
    },

    /** 下架文章(不可物理删除,仅隐藏) */
    unpublishArticle(articleId: number, currentUser: AdminUser, reason: string) {
      const article = this.articles.find(a => a.id === articleId)
      if (!article || article.status !== ArticleStatus.PUBLISHED) return

      article.status = ArticleStatus.UNPUBLISHED
      article.updatedAt = new Date().toISOString().slice(0, 10)

      article.reviewHistory.push({
        id: Date.now(),
        articleId,
        step: ReviewStep.PUBLISHED,
        operatorId: currentUser.id,
        operatorName: currentUser.realName,
        operatorRole: currentUser.role,
        action: ReviewAction.UNPUBLISH,
        comment: reason,
        operatedAt: new Date().toLocaleString('zh-CN'),
        operatorIp: '192.168.1.110',
      })
    },

    /** 撤稿(发布7日内发现错误,需重新三审) */
    withdrawArticle(articleId: number, currentUser: AdminUser, reason: string) {
      const article = this.articles.find(a => a.id === articleId)
      if (!article) return

      article.status = ArticleStatus.DRAFT
      article.currentReviewStep = ReviewStep.DRAFTING
      article.updatedAt = new Date().toISOString().slice(0, 10)

      article.reviewHistory.push({
        id: Date.now(),
        articleId,
        step: ReviewStep.PUBLISHED,
        operatorId: currentUser.id,
        operatorName: currentUser.realName,
        operatorRole: currentUser.role,
        action: ReviewAction.WITHDRAW,
        comment: reason,
        operatedAt: new Date().toLocaleString('zh-CN'),
        operatorIp: '192.168.1.110',
      })
    },

    /** 标记废止(失效通知保留原文存档) */
    abolishArticle(articleId: number, currentUser: AdminUser) {
      const article = this.articles.find(a => a.id === articleId)
      if (!article) return

      article.status = ArticleStatus.ABOLISHED
      article.updatedAt = new Date().toISOString().slice(0, 10)

      article.reviewHistory.push({
        id: Date.now(),
        articleId,
        step: ReviewStep.PUBLISHED,
        operatorId: currentUser.id,
        operatorName: currentUser.realName,
        operatorRole: currentUser.role,
        action: ReviewAction.ABOLISH,
        comment: '通知已失效，标记废止',
        operatedAt: new Date().toLocaleString('zh-CN'),
        operatorIp: '192.168.1.110',
      })
    },
  },
})
