<template>
  <!-- CMS 文章编辑器组件 -->
  <!-- 覆盖: 标题规则/文号校验/正文格式/图片规则/附件规则/敏感词过滤 -->
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑文章' : '新建文章'"
    width="900px"
    top="3vh"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="100px"
      label-position="top"
      class="cms-editor-form"
    >
      <!-- ===== 基础信息 ===== -->
      <div class="form-section">
        <h4 class="section-title">基础信息</h4>
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="文章标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入标题（不超过80字，禁止营销词汇）"
                maxlength="80"
                show-word-limit
                @blur="validateTitle"
              />
              <div v-if="titleErrors.length" class="field-errors">
                <span v-for="(err, i) in titleErrors" :key="i" class="error-text">{{ err }}</span>
              </div>
              <div v-if="titleWarnings.length" class="field-warnings">
                <span v-for="(w, i) in titleWarnings" :key="i" class="warn-text">{{ w }}</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="文号" prop="docNumber">
              <el-input
                v-model="form.docNumber"
                placeholder="深信息教〔2026〕XX号"
                @blur="validateDocNumber"
              />
              <div v-if="docNumberError" class="field-errors">
                <span class="error-text">{{ docNumberError }}</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="栏目" prop="column">
              <el-select v-model="form.column" placeholder="选择栏目" style="width:100%">
                <el-option
                  v-for="(label, key) in ColumnLabels"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="重大事项标记" prop="majorFlag">
              <el-select v-model="form.majorFlag" placeholder="普通稿件" style="width:100%">
                <el-option
                  v-for="(label, key) in MajorFlagLabels"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="来源" prop="source">
              <el-input v-model="form.source" placeholder="稿件来源（转载必须标注）" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="是否为转载">
              <el-switch v-model="form.isReprint" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.isReprint" :span="16">
            <el-form-item label="原文链接" prop="reprintUrl">
              <el-input v-model="form.reprintUrl" placeholder="为转载时请填写原文链接" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="文章摘要">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="2"
            placeholder="简要描述文章内容（选填，不超过200字）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </div>

      <!-- ===== 正文编辑(RichEditor) ===== -->
      <div class="form-section">
        <div class="section-header-row">
          <h4 class="section-title">正文内容</h4>
          <div class="editor-toolbar">
            <el-tag v-if="versions.length > 0" size="small" type="info" @click="showVersionDialog = true" style="cursor:pointer">
              历史版本 ({{ versions.length }})
            </el-tag>
          </div>
        </div>

        <!-- 富文本编辑器 -->
        <div v-show="editorMode === 'edit'">
          <RichEditor
            ref="richEditorRef"
            v-model="form.content"
            :can-source-code="canSourceCode"
            @open-media="openMediaDialog"
            @save-draft="handleQuickSaveDraft"
            @preview="editorMode = 'preview'"
            @content-change="handleContentChange"
          />
        </div>

        <!-- 预览区 -->
        <div v-show="editorMode === 'preview'" class="preview-area">
          <div class="preview-toolbar">
            <el-button size="small" @click="editorMode = 'edit'">返回编辑</el-button>
          </div>
          <div v-if="form.content" class="preview-content" v-html="form.content" />
          <el-empty v-else description="暂无内容" :image-size="60" />
        </div>

        <!-- 正文校验结果 -->
        <div v-if="contentErrors.length" class="field-errors">
          <div v-for="(err, i) in contentErrors" :key="i" class="error-item">
            <Icon icon="mdi:close-circle" :width="14" :height="14" />
            <span>{{ err }}</span>
          </div>
        </div>
        <div v-if="contentWarnings.length" class="field-warnings">
          <div v-for="(w, i) in contentWarnings" :key="i" class="warn-item">
            <Icon icon="mdi:alert" :width="14" :height="14" />
            <span>{{ w }}</span>
          </div>
        </div>
      </div>

      <!-- ===== 图片管理 ===== -->
      <div class="form-section">
        <h4 class="section-title">
          图片管理
          <span class="section-hint">JPG/PNG/GIF/SVG，单张 ≤ 2MB，宽高 ≤ 1500px，自动压缩+去EXIF+水印，alt必填(≥4字)</span>
        </h4>

        <div class="image-upload-area">
          <el-upload
            :auto-upload="false"
            :file-list="imageFileList"
            :on-change="handleImageChange"
            :on-remove="handleImageRemove"
            accept=".jpg,.jpeg,.png,.gif,.svg"
            list-type="picture-card"
            :limit="10"
          >
            <div class="upload-trigger">
              <Icon icon="mdi:plus" :width="24" :height="24" />
              <span>添加图片</span>
            </div>
          </el-upload>
          <el-button plain size="small" @click="openMediaDialog('image')" style="margin-top:8px">
            <Icon icon="mdi:image-multiple" :width="14" :height="14" />
            从媒体库选择
          </el-button>
        </div>

        <!-- 图片 alt 文字编辑 -->
        <div v-if="form.images.length > 0" class="image-alt-list">
          <div v-for="(img, idx) in form.images" :key="idx" class="image-alt-item">
            <span class="image-name">{{ img.alt || `图片${idx + 1}` }}</span>
            <el-input
              v-model="img.alt"
              size="small"
              placeholder="图片描述(alt,≥4字)"
              style="width: 240px"
              :class="{ 'alt-invalid': img.alt.length > 0 && img.alt.length < 4 }"
            />
            <el-tag v-if="img.alt.length < 4 && img.alt.length > 0" type="danger" size="small">描述过短</el-tag>
          </div>
        </div>

        <div v-if="imageErrors.length" class="field-errors">
          <span v-for="(err, i) in imageErrors" :key="i" class="error-text">{{ err }}</span>
        </div>
      </div>

      <!-- ===== 附件管理 ===== -->
      <div class="form-section">
        <h4 class="section-title">
          附件管理
          <span class="section-hint">仅 PDF/Word/Excel，文件命名建议遵循"文号+标题"格式</span>
        </h4>

        <el-upload
          :auto-upload="false"
          :file-list="attachmentFileList"
          :on-change="handleAttachmentChange"
          :on-remove="handleAttachmentRemove"
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          :limit="5"
        >
          <el-button type="primary" plain>
            <Icon icon="mdi:paperclip" :width="16" :height="16" />
            添加附件
          </el-button>
        </el-upload>

        <div v-if="attachmentErrors.length" class="field-errors">
          <span v-for="(err, i) in attachmentErrors" :key="i" class="error-text">{{ err }}</span>
        </div>
      </div>
    </el-form>

    <!-- ===== 底部操作 ===== -->
    <template #footer>
      <div class="editor-footer">
        <div class="footer-left">
          <el-button @click="handleSaveDraft" :loading="saving">
            <Icon icon="mdi:content-save" :width="16" :height="16" />
            保存草稿
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="$emit('update:visible', false)">取消</el-button>
          <el-button type="primary" @click="handleSubmitReview" :loading="saving">
            保存并提交审核
          </el-button>
        </div>
      </div>
    </template>
    <!-- ===== 媒体资源库(图片) ===== -->
    <MediaLibrary
      v-model:visible="showMediaImage"
      mode="image"
      @select="handleMediaImageSelect"
    />

    <!-- ===== 媒体资源库(附件) ===== -->
    <MediaLibrary
      v-model:visible="showMediaAttachment"
      mode="attachment"
      @select="handleMediaAttachmentSelect"
    />

    <!-- ===== 版本历史对话框 ===== -->
    <el-dialog v-model="showVersionDialog" title="版本历史" width="600px" append-to-body>
      <div v-if="versions.length === 0" style="text-align:center;padding:20px 0">
        <el-empty description="暂无历史版本" :image-size="50" />
      </div>
      <el-timeline v-else>
        <el-timeline-item
          v-for="ver in versions"
          :key="ver.id"
          :timestamp="ver.createdAt"
          :type="ver.trigger === 'submit' ? 'success' : 'primary'"
          placement="top"
        >
          <div class="version-item">
            <div class="version-header">
              <span class="version-num">v{{ ver.version }}</span>
              <el-tag size="small" :type="ver.trigger === 'submit' ? 'success' : ver.trigger === 'auto' ? 'info' : ''">
                {{ ver.trigger === 'auto' ? '自动草稿' : ver.trigger === 'submit' ? '提交快照' : '手动保存' }}
              </el-tag>
              <span class="version-author">{{ ver.createdByName }}</span>
            </div>
            <div class="version-title">{{ ver.title || '(无标题)' }}</div>
            <el-button size="small" text type="primary" @click="restoreVersion(ver)">恢复此版本</el-button>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
// CMS 文章编辑器 v2: RichEditor + 媒体库 + 版本快照 + 自动草稿 + 提交前置校验
import {
  ArticleColumn,
  MajorFlag,
  ConfidentialLevel,
  TitleRules,
  type CmsArticle,
  type ArticleImage,
  type Attachment,
  type VersionSnapshot,
  type MediaItem,
  AdminRole,
} from '~/utils/types'
import { ColumnLabels, MajorFlagLabels } from '~/utils/types'
import { useSensitiveCheck } from '~/composables/useSensitiveCheck'
import { useAuthStore } from '~/stores/cmsAuth'
import { useCmsArticleStore } from '~/stores/cmsArticles'
import { useMediaLibraryStore } from '~/stores/mediaLibrary'
import { usePermission } from '~/composables/usePermission'

const props = defineProps<{
  visible: boolean
  editArticle?: CmsArticle | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'saved': []
}>()

const authStore = useAuthStore()
const articleStore = useCmsArticleStore()
const mediaStore = useMediaLibraryStore()
const { checkTitle, checkContent, checkImage, checkAttachment } = useSensitiveCheck()
const { canPublish, canAdmin } = usePermission()

const isEdit = computed(() => !!props.editArticle)
const formRef = ref()
const richEditorRef = ref()
const saving = ref(false)
const editorMode = ref<'edit' | 'preview'>('edit')

// 源码模式仅终审/超管可用
const canSourceCode = computed(() => canPublish.value || canAdmin.value)

// 媒体库对话框
const showMediaImage = ref(false)
const showMediaAttachment = ref(false)

// 版本管理
const showVersionDialog = ref(false)
const versions = ref<VersionSnapshot[]>([])
let versionCounter = 0

// ===== 表单数据 =====
interface EditorForm {
  title: string
  docNumber: string
  column: ArticleColumn
  majorFlag: MajorFlag
  source: string
  isReprint: boolean
  reprintUrl: string
  summary: string
  content: string
  images: ArticleImage[]
  attachments: Attachment[]
}

const defaultForm = (): EditorForm => ({
  title: '',
  docNumber: '',
  column: ArticleColumn.NOTICE,
  majorFlag: MajorFlag.NORMAL,
  source: '',
  isReprint: false,
  reprintUrl: '',
  summary: '',
  content: '',
  images: [],
  attachments: [],
})

const form = ref<EditorForm>(defaultForm())

// ===== 校验结果 =====
const titleErrors = ref<string[]>([])
const titleWarnings = ref<string[]>([])
const docNumberError = ref('')
const contentErrors = ref<string[]>([])
const contentWarnings = ref<string[]>([])
const imageErrors = ref<string[]>([])
const attachmentErrors = ref<string[]>([])

// ===== 表单规则 =====
const formRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  column: [{ required: true, message: '请选择栏目', trigger: 'change' }],
}

// ===== 文件列表(UI展示用) =====
const imageFileList = ref<any[]>([])
const attachmentFileList = ref<any[]>([])

// ===== 初始化/回显 =====
watch(() => props.visible, (val) => {
  if (val && props.editArticle) {
    // 编辑模式: 回填数据
    const a = props.editArticle
    form.value = {
      title: a.title,
      docNumber: a.docNumber || '',
      column: a.column,
      majorFlag: a.majorFlag,
      source: a.source || '',
      isReprint: a.isReprint,
      reprintUrl: a.reprintUrl || '',
      summary: a.summary || '',
      content: a.content,
      images: [...a.images],
      attachments: [...a.attachments],
    }
    imageFileList.value = a.images.map((img, i) => ({
      name: img.alt || `图片${i + 1}`,
      url: img.url,
    }))
    attachmentFileList.value = a.attachments.map(att => ({
      name: att.originalName,
      url: att.filename,
    }))
  } else if (val) {
    // 新建模式: 重置
    form.value = defaultForm()
    imageFileList.value = []
    attachmentFileList.value = []
  }
  // 清空校验
  clearAllErrors()
  editorMode.value = 'edit'
})

const clearAllErrors = () => {
  titleErrors.value = []
  titleWarnings.value = []
  docNumberError.value = ''
  contentErrors.value = []
  contentWarnings.value = []
  imageErrors.value = []
  attachmentErrors.value = []
}

// ===== 标题校验 =====
const validateTitle = () => {
  const result = checkTitle(form.value.title)
  titleErrors.value = result.errors
  titleWarnings.value = result.warnings
}

// ===== 文号校验 =====
const validateDocNumber = () => {
  docNumberError.value = ''
  if (form.value.docNumber && !TitleRules.docNumberPattern.test(form.value.docNumber)) {
    docNumberError.value = '文号格式应为: 深信息教〔2026〕XX号 或 深信息政〔2026〕XX号'
  }
}

// ===== 正文校验 =====
const validateContent = () => {
  const result = checkContent(form.value.content)
  contentErrors.value = result.errors
  contentWarnings.value = result.warnings
}

// ===== 图片处理 =====
const handleImageChange = (file: any) => {
  imageErrors.value = []
  const rawFile = file.raw as File
  if (!rawFile) return

  const validation = checkImage(rawFile)
  if (!validation.valid) {
    imageErrors.value = validation.errors
    // 移除不合规文件
    imageFileList.value = imageFileList.value.filter(f => f.uid !== file.uid)
    return
  }

  // Mock: 添加到图片列表
  const newImage: ArticleImage = {
    id: Date.now(),
    url: URL.createObjectURL(rawFile),
    alt: '',
    width: 0,
    height: 0,
    privacyChecked: false,
  }
  form.value.images.push(newImage)
}

const handleImageRemove = (file: any) => {
  const idx = imageFileList.value.findIndex(f => f.uid === file.uid)
  if (idx >= 0) {
    form.value.images.splice(idx, 1)
  }
}

// ===== 附件处理 =====
const handleAttachmentChange = (file: any) => {
  attachmentErrors.value = []
  const rawFile = file.raw as File
  if (!rawFile) return

  const validation = checkAttachment(rawFile)
  if (!validation.valid) {
    attachmentErrors.value = validation.errors
    attachmentFileList.value = attachmentFileList.value.filter(f => f.uid !== file.uid)
    return
  }

  const newAttachment: Attachment = {
    id: Date.now(),
    filename: `upload_${Date.now()}_${rawFile.name}`,
    originalName: rawFile.name,
    mimeType: rawFile.type,
    size: rawFile.size,
    nameCompliant: false,
    linkedArticleIds: [],
    folderId: null,
    uploadAt: new Date().toISOString(),
    uploadedBy: authStore.user?.id || 0,
    uploadedByName: authStore.user?.realName || '',
  }
  form.value.attachments.push(newAttachment)
}

const handleAttachmentRemove = (file: any) => {
  const idx = attachmentFileList.value.findIndex(f => f.uid === file.uid)
  if (idx >= 0) {
    form.value.attachments.splice(idx, 1)
  }
}

// ===== 全量校验 =====
const validateAll = (): boolean => {
  validateTitle()
  validateDocNumber()
  validateContent()

  // 图片 alt 校验
  const altErrors: string[] = []
  form.value.images.forEach((img, i) => {
    if (!img.alt || img.alt.length < 4) {
      altErrors.push(`第${i + 1}张图片的描述文字需至少4个字`)
    }
  })
  imageErrors.value = altErrors

  const hasErrors =
    titleErrors.value.length > 0 ||
    !!docNumberError.value ||
    contentErrors.value.length > 0 ||
    imageErrors.value.length > 0

  return !hasErrors
}

// ===== 保存草稿 =====
const handleSaveDraft = async () => {
  // 草稿只做最低限度校验
  if (!form.value.title.trim()) {
    titleErrors.value = ['标题不能为空']
    return
  }

  saving.value = true
  try {
    await new Promise(r => setTimeout(r, 500))

    if (isEdit.value && props.editArticle) {
      // 更新已有草稿
      Object.assign(props.editArticle, {
        title: form.value.title,
        docNumber: form.value.docNumber || undefined,
        column: form.value.column,
        majorFlag: form.value.majorFlag,
        source: form.value.source,
        isReprint: form.value.isReprint,
        reprintUrl: form.value.reprintUrl,
        summary: form.value.summary,
        content: form.value.content,
        images: form.value.images,
        attachments: form.value.attachments,
        updatedAt: new Date().toISOString().slice(0, 10),
      })
    } else {
      articleStore.saveDraft({
        title: form.value.title,
        docNumber: form.value.docNumber || undefined,
        column: form.value.column,
        majorFlag: form.value.majorFlag,
        source: form.value.source,
        isReprint: form.value.isReprint,
        reprintUrl: form.value.reprintUrl,
        summary: form.value.summary,
        content: form.value.content,
        images: form.value.images,
        attachments: form.value.attachments,
      }, authStore.user!)
    }

    ElMessage.success('草稿已保存')
    emit('update:visible', false)
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// ===== 保存并提交审核 =====
const handleSubmitReview = async () => {
  if (!validateAll()) {
    ElMessage.warning('请修正表单中的错误后再提交')
    return
  }

  // 提交前创建版本快照
  createVersionSnapshot('submit')

  // 如果有警告，弹出确认
  if (titleWarnings.value.length > 0 || contentWarnings.value.length > 0) {
    const allWarnings = [...titleWarnings.value, ...contentWarnings.value]
    try {
      await ElMessageBox.confirm(
        `检测到以下建议项:\n${allWarnings.map(w => `· ${w}`).join('\n')}\n\n是否仍要提交？`,
        '提交确认',
        { confirmButtonText: '继续提交', cancelButtonText: '返回修改' }
      )
    } catch {
      return
    }
  }

  saving.value = true
  try {
    await new Promise(r => setTimeout(r, 500))

    let articleId: number
    if (isEdit.value && props.editArticle) {
      articleId = props.editArticle.id
      Object.assign(props.editArticle, {
        title: form.value.title,
        docNumber: form.value.docNumber || undefined,
        column: form.value.column,
        majorFlag: form.value.majorFlag,
        source: form.value.source,
        isReprint: form.value.isReprint,
        reprintUrl: form.value.reprintUrl,
        summary: form.value.summary,
        content: form.value.content,
        images: form.value.images,
        attachments: form.value.attachments,
        updatedAt: new Date().toISOString().slice(0, 10),
      })
    } else {
      const newArticle = articleStore.saveDraft({
        title: form.value.title,
        docNumber: form.value.docNumber || undefined,
        column: form.value.column,
        majorFlag: form.value.majorFlag,
        source: form.value.source,
        isReprint: form.value.isReprint,
        reprintUrl: form.value.reprintUrl,
        summary: form.value.summary,
        content: form.value.content,
        images: form.value.images,
        attachments: form.value.attachments,
      }, authStore.user!)
      articleId = newArticle.id
    }

    // 提交审核
    articleStore.submitForReview(articleId, authStore.user!, '内容已一校完成，提交复审')

    ElMessage.success('已保存并提交审核')
    emit('update:visible', false)
    emit('saved')
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    saving.value = false
  }
}

// ===== 关闭 =====
const handleClose = () => {
  // 如果有未保存内容，提示
  if (form.value.title || form.value.content) {
    ElMessageBox.confirm('当前有未保存的内容，确认关闭？', '提示', {
      confirmButtonText: '确认关闭',
      cancelButtonText: '继续编辑',
    }).then(() => {
      emit('update:visible', false)
    }).catch(() => {})
  } else {
    emit('update:visible', false)
  }
}

// ===== 媒体库集成 =====
const openMediaDialog = (type: 'image' | 'attachment') => {
  if (type === 'image') showMediaImage.value = true
  else showMediaAttachment.value = true
}

const handleMediaImageSelect = (item: MediaItem) => {
  // 插入到富文本编辑器
  if (richEditorRef.value) {
    richEditorRef.value.insertImage(item.url, item.alt || item.originalName)
  }
  // 添加到图片列表
  const newImage: ArticleImage = {
    id: item.id,
    url: item.url,
    alt: item.alt || '',
    width: item.width || 0,
    height: item.height || 0,
    privacyChecked: item.securityChecked,
    privacyWarning: item.securityWarning,
    mediaId: item.id,
  }
  form.value.images.push(newImage)
}

const handleMediaAttachmentSelect = (item: MediaItem) => {
  // 插入附件链接到富文本编辑器
  if (richEditorRef.value) {
    richEditorRef.value.insertAttachmentLink(item.url, item.originalName, item.size, item.mimeType)
  }
  // 添加到附件列表
  const newAttachment: Attachment = {
    id: item.id,
    filename: item.filename,
    originalName: item.originalName,
    mimeType: item.mimeType,
    size: item.size,
    nameCompliant: true,
    linkedArticleIds: item.linkedArticleIds,
    folderId: item.folderId,
    uploadAt: item.createdAt,
    uploadedBy: item.uploadedBy,
    uploadedByName: item.uploadedByName,
  }
  form.value.attachments.push(newAttachment)
}

// ===== 内容变化处理 =====
const handleContentChange = (html: string) => {
  form.value.content = html
  validateContent()
}

// ===== 快速保存草稿(RichEditor触发) =====
const handleQuickSaveDraft = () => {
  if (!form.value.title.trim()) return

  // 创建版本快照
  createVersionSnapshot('auto')

  // 保存到 store (不关闭对话框)
  try {
    if (isEdit.value && props.editArticle) {
      Object.assign(props.editArticle, {
        title: form.value.title,
        content: form.value.content,
        updatedAt: new Date().toISOString().slice(0, 10),
      })
    }
  } catch {}
}

// ===== 版本快照管理 =====
const createVersionSnapshot = (trigger: 'auto' | 'submit' | 'manual') => {
  versionCounter++
  const snapshot: VersionSnapshot = {
    id: Date.now(),
    articleId: props.editArticle?.id || 0,
    version: versionCounter,
    content: form.value.content,
    title: form.value.title,
    createdBy: authStore.user?.id || 0,
    createdByName: authStore.user?.realName || '',
    createdAt: new Date().toLocaleString('zh-CN'),
    trigger,
  }
  versions.value.unshift(snapshot)
  // 最多保留 20 个版本
  if (versions.value.length > 20) {
    versions.value = versions.value.slice(0, 20)
  }
}

const restoreVersion = (ver: VersionSnapshot) => {
  ElMessageBox.confirm(
    `确认恢复到 v${ver.version} (${ver.createdAt})？当前内容将被覆盖。`,
    '版本恢复',
    { confirmButtonText: '确认恢复', cancelButtonText: '取消' }
  ).then(() => {
    form.value.content = ver.content
    form.value.title = ver.title
    showVersionDialog.value = false
    ElMessage.success(`已恢复到 v${ver.version}`)
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.cms-editor-form {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid $border-lighter;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 15px;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-hint {
  font-size: 12px;
  font-weight: $fw-regular;
  color: $text-placeholder;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  .section-title { margin-bottom: 0; }
}

// 格式提示
.format-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $text-secondary;
  background: $bg-soft;
  padding: 8px 12px;
  border-radius: $radius-base;
  margin-bottom: 12px;

  :deep(svg) { color: $primary; flex-shrink: 0; }
}

// 编辑器区域
.editor-area {
  :deep(.el-textarea__inner) {
    font-family: $font-mono;
    font-size: 13px;
    line-height: 1.7;
  }
}

// 预览区域
.preview-area {
  border: 1px solid $border-light;
  border-radius: $radius-base;
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.preview-content {
  padding: 20px;
  line-height: 1.8;
  font-size: 15px;
  color: $text-regular;

  :deep(p) {
    margin-bottom: 12px;
    text-indent: 2em;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: $radius-base;
    margin: 12px 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;

    td, th {
      border: 1px solid $border-light;
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: $bg-soft;
      font-weight: $fw-semibold;
    }
  }
}

// 校验错误/警告
.field-errors {
  margin-top: 8px;

  .error-text,
  .error-item {
    color: $danger;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;

    :deep(svg) { flex-shrink: 0; }
  }
}

.field-warnings {
  margin-top: 8px;

  .warn-text,
  .warn-item {
    color: $warning;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;

    :deep(svg) { flex-shrink: 0; }
  }
}

// 图片上传
.image-upload-area {
  :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
    border-color: $border-light;
    border-radius: $radius-base;
  }
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: $text-secondary;
  font-size: 12px;
}

.image-alt-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-alt-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: $text-regular;

  .image-name {
    min-width: 80px;
    color: $text-secondary;
  }

  .alt-invalid {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px $danger inset;
    }
  }
}

// 底部
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 8px;
}

// 预览工具栏
.preview-toolbar {
  padding: 8px 0;
  margin-bottom: 8px;
}

// 版本历史
.version-item {
  padding: 8px 12px;
  background: $bg-soft;
  border-radius: $radius-base;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.version-num {
  font-size: 14px;
  font-weight: $fw-semibold;
  color: $text-primary;
}

.version-author {
  font-size: 12px;
  color: $text-secondary;
}

.version-title {
  font-size: 13px;
  color: $text-regular;
  margin-bottom: 4px;
}
</style>
