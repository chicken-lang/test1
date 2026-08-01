// ====================================================================
// 媒体资源库 Store: 图片+附件统一管理
// 覆盖: 分类目录/存储统计/权限隔离/去重/溯源/AI安全检查
// ====================================================================
import { defineStore } from 'pinia'
import {
  type MediaItem,
  type MediaFolder,
  type MediaFilter,
  type StorageStats,
  MediaCategory,
  AttachmentRules,
  ImageRule,
} from '~/utils/types'

interface MediaLibraryState {
  items: MediaItem[]
  folders: MediaFolder[]
  loading: boolean
}

// ===== Mock 数据 =====
const mockFolders: MediaFolder[] = [
  { id: 1, name: '2026年活动照片', category: MediaCategory.ACTIVITY, year: 2026, parentId: null, fileCount: 24, totalSize: 48 * 1024 * 1024, createdBy: 1, createdAt: '2026-01-15' },
  { id: 2, name: '2026年公示配图', category: MediaCategory.NOTICE_IMAGE, year: 2026, parentId: null, fileCount: 12, totalSize: 18 * 1024 * 1024, createdBy: 1, createdAt: '2026-03-01' },
  { id: 3, name: '2026年文档封面', category: MediaCategory.DOC_COVER, year: 2026, parentId: null, fileCount: 8, totalSize: 5 * 1024 * 1024, createdBy: 99, createdAt: '2026-02-01' },
  { id: 4, name: '2026年附件文档', category: MediaCategory.ATTACHMENT, year: 2026, parentId: null, fileCount: 35, totalSize: 120 * 1024 * 1024, createdBy: 1, createdAt: '2026-01-01' },
]

const mockItems: MediaItem[] = [
  {
    id: 1, filename: 'exam_schedule_2026.jpg', originalName: '2026春季期末考试安排.jpg',
    type: 'image', mimeType: 'image/jpeg', size: 450 * 1024, width: 1200, height: 800,
    alt: '2026年春季学期期末考试安排通知配图',
    url: '/mock/media/exam_schedule.jpg', thumbnailUrl: '/mock/media/exam_schedule_thumb.jpg',
    folderId: 2, category: MediaCategory.NOTICE_IMAGE,
    uploadedBy: 1, uploadedByName: '张三', uploadedByDepartment: '教务科',
    linkedArticleIds: [1001], securityChecked: true, createdAt: '2026-06-15', updatedAt: '2026-06-15',
  },
  {
    id: 2, filename: 'teaching_competition_2026.jpg', originalName: '教学技能大赛现场.jpg',
    type: 'image', mimeType: 'image/jpeg', size: 680 * 1024, width: 1400, height: 900,
    alt: '第十二届教学技能大赛现场照片',
    url: '/mock/media/teaching_comp.jpg', thumbnailUrl: '/mock/media/teaching_comp_thumb.jpg',
    folderId: 1, category: MediaCategory.ACTIVITY,
    uploadedBy: 1, uploadedByName: '张三', uploadedByDepartment: '教务科',
    linkedArticleIds: [1002], securityChecked: true, createdAt: '2026-07-01', updatedAt: '2026-07-01',
  },
  {
    id: 3, filename: 'notice_cover_scholarship.png', originalName: '奖学金公示封面.png',
    type: 'image', mimeType: 'image/png', size: 320 * 1024, width: 800, height: 400,
    alt: '国家奖学金公示封面图',
    url: '/mock/media/scholarship_cover.png', thumbnailUrl: '/mock/media/scholarship_cover_thumb.png',
    folderId: 3, category: MediaCategory.DOC_COVER,
    uploadedBy: 99, uploadedByName: '超级管理员', uploadedByDepartment: '信息中心',
    linkedArticleIds: [1004], securityChecked: true, createdAt: '2026-07-04', updatedAt: '2026-07-04',
  },
  {
    id: 4, filename: 'exam_arrangement_2026.pdf', originalName: '深信息教〔2026〕18号-期末考试安排.pdf',
    type: 'attachment', mimeType: 'application/pdf', size: 2 * 1024 * 1024,
    url: '/mock/media/exam_arrangement.pdf',
    folderId: 4, category: MediaCategory.ATTACHMENT,
    uploadedBy: 1, uploadedByName: '张三', uploadedByDepartment: '教务科',
    linkedArticleIds: [1001], securityChecked: true, createdAt: '2026-06-19', updatedAt: '2026-06-19',
  },
  {
    id: 5, filename: 'training_plan_2026.docx', originalName: '2026暑期实训安排.docx',
    type: 'attachment', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 800 * 1024,
    url: '/mock/media/training_plan.docx',
    folderId: 4, category: MediaCategory.ATTACHMENT,
    uploadedBy: 1, uploadedByName: '张三', uploadedByDepartment: '教务科',
    linkedArticleIds: [1003], securityChecked: true, createdAt: '2026-07-03', updatedAt: '2026-07-03',
  },
]

export const useMediaLibraryStore = defineStore('media-library', {
  state: (): MediaLibraryState => ({
    items: mockItems,
    folders: mockFolders,
    loading: false,
  }),

  getters: {
    /** 按类型筛选 */
    images: (state): MediaItem[] => state.items.filter(i => i.type === 'image'),
    attachments: (state): MediaItem[] => state.items.filter(i => i.type === 'attachment'),

    /** 按目录筛选 */
    itemsByFolder: (state) => {
      return (folderId: number): MediaItem[] => state.items.filter(i => i.folderId === folderId)
    },

    /** 按分类筛选 */
    itemsByCategory: (state) => {
      return (category: MediaCategory): MediaItem[] => state.items.filter(i => i.category === category)
    },

    /** 按上传人筛选(权限隔离) */
    itemsByUploader: (state) => {
      return (userId: number): MediaItem[] => state.items.filter(i => i.uploadedBy === userId)
    },

    /** 搜索 */
    search: (state) => {
      return (keyword: string): MediaItem[] => {
        if (!keyword) return state.items
        const kw = keyword.toLowerCase()
        return state.items.filter(i =>
          i.originalName.toLowerCase().includes(kw) ||
          i.filename.toLowerCase().includes(kw) ||
          (i.alt || '').toLowerCase().includes(kw)
        )
      }
    },

    /** 存储统计 */
    storageStats: (state): StorageStats => {
      let totalSize = 0
      let imageCount = 0
      let attachmentCount = 0
      const byCategory: Record<string, { count: number; size: number }> = {}

      for (const item of state.items) {
        totalSize += item.size
        if (item.type === 'image') imageCount++
        else attachmentCount++

        if (!byCategory[item.category]) {
          byCategory[item.category] = { count: 0, size: 0 }
        }
        byCategory[item.category].count++
        byCategory[item.category].size += item.size
      }

      const warningThreshold = 5 * 1024 * 1024 * 1024 // 5GB
      return {
        totalSize,
        imageCount,
        attachmentCount,
        byCategory: byCategory as Record<MediaCategory, { count: number; size: number }>,
        warningThreshold,
        isNearLimit: totalSize > warningThreshold * 0.8,
      }
    },

    /** 附件溯源: 查看被哪些稿件引用 */
    attachmentReferences: (state) => {
      return (itemId: number): number[] => {
        const item = state.items.find(i => i.id === itemId)
        return item?.linkedArticleIds || []
      }
    },
  },

  actions: {
    /** 上传图片(Mock) */
    uploadImage(file: File, category: MediaCategory, folderId: number | null, userId: number, userName: string, dept: string): MediaItem | null {
      // 校验格式
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const allowedExts = [...ImageRule.allowedFormats]
      if (!allowedExts.includes(ext as any)) {
        throw new Error(`不支持的图片格式: .${ext}，仅允许 ${allowedExts.join('/')}`)
      }
      if (file.size > ImageRule.maxSize) {
        throw new Error(`图片大小超过${(ImageRule.maxSize / 1024 / 1024)}MB限制`)
      }

      // 去重: 同名文件自动重命名
      let filename = file.name
      const existing = this.items.find(i => i.filename === filename)
      if (existing) {
        const name = filename.replace(/\.[^.]+$/, '')
        const ext2 = filename.match(/\.[^.]+$/)?.[0] || ''
        filename = `${name}_${Date.now()}${ext2}`
      }

      const newItem: MediaItem = {
        id: Date.now(),
        filename,
        originalName: file.name,
        type: 'image',
        mimeType: file.type,
        size: file.size,
        alt: '',
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        folderId,
        category,
        uploadedBy: userId,
        uploadedByName: userName,
        uploadedByDepartment: dept,
        linkedArticleIds: [],
        securityChecked: false,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }

      this.items.unshift(newItem)
      return newItem
    },

    /** 上传附件(Mock) */
    uploadAttachment(file: File, category: MediaCategory, folderId: number | null, userId: number, userName: string, dept: string): MediaItem | null {
      // 校验格式
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const blockedExts = [...AttachmentRules.blockedTypes]
      if (blockedExts.includes(ext as any)) {
        throw new Error(`禁止上传 .${ext} 格式文件`)
      }
      const allowedDocExts = [...AttachmentRules.allowedDocTypes, ...AttachmentRules.allowedImageTypes]
      if (!allowedDocExts.includes(ext as any)) {
        throw new Error(`不支持的文件格式: .${ext}，仅允许 ${allowedDocExts.join('/')}`)
      }
      if (file.size > AttachmentRules.maxSize) {
        throw new Error(`文件大小超过${(AttachmentRules.maxSize / 1024 / 1024)}MB限制`)
      }

      // 文件名合规检查
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
      const nameCompliant = AttachmentRules.namePattern.test(nameWithoutExt)

      let filename = file.name
      const existing = this.items.find(i => i.filename === filename)
      if (existing) {
        const name = filename.replace(/\.[^.]+$/, '')
        const ext2 = filename.match(/\.[^.]+$/)?.[0] || ''
        filename = `${name}_${Date.now()}${ext2}`
      }

      const newItem: MediaItem = {
        id: Date.now(),
        filename,
        originalName: file.name,
        type: 'attachment',
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        folderId,
        category,
        uploadedBy: userId,
        uploadedByName: userName,
        uploadedByDepartment: dept,
        linkedArticleIds: [],
        securityChecked: true,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }

      this.items.unshift(newItem)
      return newItem
    },

    /** 删除媒体(仅管理员) */
    deleteItem(itemId: number) {
      const idx = this.items.findIndex(i => i.id === itemId)
      if (idx >= 0) {
        this.items.splice(idx, 1)
      }
    },

    /** 关联稿件(溯源) */
    linkToArticle(itemId: number, articleId: number) {
      const item = this.items.find(i => i.id === itemId)
      if (item && !item.linkedArticleIds.includes(articleId)) {
        item.linkedArticleIds.push(articleId)
      }
    },

    /** 新建目录 */
    createFolder(name: string, category: MediaCategory, userId: number): MediaFolder {
      const folder: MediaFolder = {
        id: Date.now(),
        name,
        category,
        year: new Date().getFullYear(),
        parentId: null,
        fileCount: 0,
        totalSize: 0,
        createdBy: userId,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      this.folders.push(folder)
      return folder
    },
  },
})
