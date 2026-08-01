<template>
  <div class="page-container">
    <h3 class="section-title">{{ pageTitle }}</h3>

    <!-- 不可编辑时显示提示 -->
    <el-alert
      v-if="isEdit && !canEdit"
      title="当前稿件状态不允许编辑，仅可查看"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    />

    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="100px"
      style="max-width: 800px"
      :disabled="isEdit && !canEdit"
    >
      <!-- 归属栏目 -->
      <el-form-item label="归属栏目" prop="column_id" for="">
        <el-tree-select
          v-model="form.column_id"
          :data="columnTree"
          :props="{ label: 'label', value: 'value', children: 'children' }"
          :render-after-expand="false"
          check-strictly
          placeholder="请选择归属栏目"
          style="width: 100%"
        />
      </el-form-item>

      <!-- 稿件标题 -->
      <el-form-item label="稿件标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入稿件标题" maxlength="100" show-word-limit />
      </el-form-item>

      <!-- 稿件类型 -->
      <el-form-item label="稿件类型" prop="type" for="">
        <el-radio-group v-model="form.type" name="article-type">
        <el-radio value="normal">普通校园资讯</el-radio>
        <el-radio value="confidential">涉密公文</el-radio>
      </el-radio-group>
      </el-form-item>

      <!-- 正文 -->
      <el-form-item label="正文" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="10"
          placeholder="请输入正文内容（后续接入富文本编辑器）"
        />
      </el-form-item>

      <!-- 配图上传 -->
      <el-form-item label="配图上传" for="">
        <el-upload
          :http-request="customImageUpload"
          list-type="picture-card"
          :auto-upload="true"
          :limit="5"
          accept="image/*"
          :file-list="imageList"
          :on-success="handleImageSuccess"
          :on-error="handleUploadError"
          :on-exceed="handleExceed"
          :on-remove="handleImageRemove"
          :disabled="isEdit && !canEdit"
        >
          <el-icon><PlusIcon /></el-icon>
          <template #tip>
            <div class="upload-tip">支持 jpg/png 格式，单张不超过 5MB，最多 5 张</div>
          </template>
        </el-upload>
      </el-form-item>

      <!-- 附件上传 -->
      <el-form-item label="附件上传" for="">
        <el-upload
          :http-request="customAttachmentUpload"
          :auto-upload="true"
          :limit="3"
          :file-list="attachmentList"
          :on-success="handleAttachmentSuccess"
          :on-error="handleUploadError"
          :on-exceed="handleExceed"
          :on-remove="handleAttachmentRemove"
          :disabled="isEdit && !canEdit"
          drag
        >
          <el-icon class="el-icon--upload"><UploadIcon /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="upload-tip">支持 doc/pdf/xls 等格式，单个文件不超过 20MB，最多 3 个</div>
          </template>
        </el-upload>
      </el-form-item>

      <!-- 业务标签 -->
      <el-form-item label="业务标签" prop="business_tags">
        <el-select
          v-model="form.business_tags"
          multiple
          placeholder="请选择业务标签"
          style="width: 100%"
        >
          <el-option v-for="tag in BusinessTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>

      <!-- 角色标签 -->
      <el-form-item label="角色标签" prop="role_tags">
        <el-select
          v-model="form.role_tags"
          multiple
          placeholder="请选择角色标签"
          style="width: 100%"
        >
          <el-option v-for="tag in RoleTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>

      <!-- 时效标签 -->
      <el-form-item label="时效标签" prop="time_tag">
        <el-select v-model="form.time_tag" placeholder="请选择时效标签" style="width: 100%">
          <el-option v-for="tag in TimeTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>

      <!-- 过期日期（仅即时办理时显示） -->
      <el-form-item v-if="form.time_tag === '即时办理'" label="过期日期" prop="expire_date">
        <el-date-picker
          v-model="form.expire_date"
          type="date"
          placeholder="选择过期日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button @click="handleGoBack">返回</el-button>
        <template v-if="canEdit">
          <el-button :loading="saving" @click="handleSaveDraft">保存草稿</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交送审</el-button>
        </template>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from '#app'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { Plus as PlusIcon, Upload as UploadIcon } from '@element-plus/icons-vue'
import { BusinessTags, RoleTags, TimeTags } from '~/utils/adminTypes'
import { createDraft, updateDraft, submitForReview, fetchColumnTree, fetchArticleDetail } from '~/composables/adminApi'
import { useAuthStore } from '~/stores/cmsAuth'
const authStore = useAuthStore()

const route = useRoute()
const router = useRouter()
const editingId = computed(() => {
  const id = route.query.id
  if (typeof id === 'string') return parseInt(id, 10)
  if (Array.isArray(id) && typeof id[0] === 'string') return parseInt(id[0], 10)
  return null
})
const isEdit = computed(() => editingId.value !== null && !isNaN(editingId.value!))

// 文章状态（加载详情后设置）
const articleStatus = ref<string>('')

// 是否可编辑（只有草稿和被驳回状态可编辑, 且系统管理员无内容运营权）
const canEdit = computed(() => {
  const s = articleStatus.value
  if (authStore.user?.role === 'system_admin') return false
  return !s || s === 'draft' || s === 'review_rejected'
})

// 页面标题
const pageTitle = computed(() => {
  if (!isEdit.value) return '新建稿件'
  if (!canEdit.value) return '稿件详情'
  if (articleStatus.value === 'review_rejected') return '编辑驳回稿件'
  return '编辑草稿'
})

const formRef = ref<FormInstance>()

// 提交状态（防重复点击）
const saving = ref(false)
const submitting = ref(false)

const form = reactive({
  column_id: undefined as number | undefined,
  title: '',
  type: 'normal' as 'normal' | 'confidential',
  content: '',
  business_tags: [] as string[],
  role_tags: [] as string[],
  time_tag: '',
  expire_date: '' as string,
  images: [] as string[],
  attachments: [] as { url: string; name: string }[],
})

const imageList = ref<any[]>([])
const attachmentList = ref<any[]>([])

const formRules: FormRules = {
  column_id: [{ required: true, message: '请选择归属栏目', trigger: 'change' }],
  title: [{ required: true, message: '请输入稿件标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择稿件类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }],
}

const columnTree = ref<any[]>([])

function mapColumnTree(nodes: any[]): any[] {
  return nodes.map(node => ({
    value: node.columnId ?? node.id,
    label: node.columnName ?? node.name,
    children: node.children ? mapColumnTree(node.children) : undefined,
  }))
}

onMounted(async () => {
  await loadColumnTree()
  if (isEdit.value) {
    await loadDraftForEdit()
  }
})

function filterTreeByPermission(nodes: any[], bindColumnIds: number[], isSystemAdmin: boolean): any[] {
  if (isSystemAdmin || !bindColumnIds.length) return nodes
  const allowed = new Set(bindColumnIds)
  function filter(list: any[]): any[] {
    return list.reduce((acc: any[], node) => {
      if (allowed.has(node.value)) {
        acc.push(node)
      } else if (node.children) {
        const filtered = filter(node.children)
        if (filtered.length > 0) {
          acc.push({ ...node, children: filtered, disabled: true })
        }
      }
      return acc
    }, [])
  }
  return filter(nodes)
}

async function loadColumnTree() {
  try {
    const res = await fetchColumnTree()
    if (res.code === 0 && res.data) {
      let tree = mapColumnTree(res.data)
      const isSystemAdmin = authStore.user?.role === 'system_admin'
      const bindColumnIds = authStore.user?.bindColumnIds || []
      tree = filterTreeByPermission(tree, bindColumnIds, isSystemAdmin)
      columnTree.value = tree
    }
  } catch {
    columnTree.value = []
  }
}

async function loadDraftForEdit() {
  try {
    const res = await fetchArticleDetail(editingId.value!)
    if (res.code === 0 && res.data) {
      const a = res.data
      articleStatus.value = a.status || ''
      form.column_id = a.columnId ?? a.column_id
      form.title = a.title ?? ''
      form.type = a.type ?? 'normal'
      form.content = a.content ?? ''
      // 解析 JSON 字符串字段
      form.business_tags = parseArray(a.businessTags || a.business_tags)
      form.role_tags = parseArray(a.roleTags || a.role_tags)
      const timeArr = parseArray(a.timeTags || a.time_tag)
      form.time_tag = timeArr[0] ?? ''
      // 回显过期日期
      if (a.expireDate) {
        form.expire_date = String(a.expireDate).slice(0, 10)
      }
      // 加载已有图片
      form.images = parseArray(a.images || a.imageUrls)
      imageList.value = form.images.map((url: string, idx: number) => ({
        uid: `img-${idx}`,
        name: url.split('/').pop() || 'image',
        url,
        status: 'success',
      }))
      // 加载已有附件
      const existingAttachments = parseArray(a.attachments || a.attachmentUrls)
      form.attachments = existingAttachments.map((item: any) => {
        if (typeof item === 'string') {
          return { url: item, name: item.split('/').pop() || 'file' }
        }
        return item
      })
      attachmentList.value = form.attachments.map((att: any, idx: number) => ({
        uid: `att-${idx}`,
        name: att.name,
        url: att.url,
        status: 'success',
      }))
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载草稿失败')
  }
}

function parseArray(val: any): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return val ? [val] : [] }
  }
  return []
}

function handleGoBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/admin/article/draft')
  }
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('超出上传数量限制')
}

async function customImageUpload(options: any) {
  const { file, onSuccess, onError } = options
  const formData = new FormData()
  formData.append('file', file)
  try {
    const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('admin_token') : ''
    const res = await $fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
      body: formData,
    })
    onSuccess(res)
  } catch (e) {
    onError(e)
  }
}

async function customAttachmentUpload(options: any) {
  const { file, onSuccess, onError } = options
  const formData = new FormData()
  formData.append('file', file)
  try {
    const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('admin_token') : ''
    const res = await $fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
      body: formData,
    })
    onSuccess(res)
  } catch (e) {
    onError(e)
  }
}

function buildDraftBody() {
  return {
    title: form.title,
    columnId: form.column_id,
    content: form.content,
    type: form.type,
    businessTags: JSON.stringify(form.business_tags || []),
    roleTags: JSON.stringify(form.role_tags || []),
    timeTags: JSON.stringify(form.time_tag ? [form.time_tag] : []),
    expireDate: form.time_tag === '即时办理' && form.expire_date ? form.expire_date : undefined,
    images: JSON.stringify(form.images || []),
    attachments: JSON.stringify(form.attachments || []),
  }
}

function handleImageSuccess(response: any, uploadFile: any, uploadItems: any[]) {
  if (response?.code === 0 && response.data) {
    const item = response.data[0]
    if (item) {
      form.images.push(item.url)
    }
    imageList.value = uploadItems
  } else {
    ElMessage.error(response?.message || '上传失败')
  }
}

function handleAttachmentSuccess(response: any, uploadFile: any, uploadItems: any[]) {
  if (response?.code === 0 && response.data) {
    for (const item of response.data) {
      form.attachments.push({ url: item.url, name: item.name })
    }
    attachmentList.value = uploadItems
  } else {
    ElMessage.error(response?.message || '上传失败')
  }
}

function handleUploadError(err: any) {
  ElMessage.error('上传失败：' + (err?.message || '请检查文件大小或网络连接'))
}

function handleImageRemove(uploadFile: any, uploadItems: any[]) {
  // 从 form.images 中移除对应 URL
  const removedUrl = uploadFile.response?.data?.[0]?.url || uploadFile.url
  if (removedUrl) {
    form.images = form.images.filter((u: string) => u !== removedUrl)
  }
  imageList.value = uploadItems
}

function handleAttachmentRemove(uploadFile: any, uploadItems: any[]) {
  const removedUrl = uploadFile.response?.data?.[0]?.url || uploadFile.url
  if (removedUrl) {
    form.attachments = form.attachments.filter((a: any) => a.url !== removedUrl)
  }
  attachmentList.value = uploadItems
}

async function handleSaveDraft() {
  if (saving.value) return
  saving.value = true
  try {
    if (isEdit.value) {
      const res = await updateDraft(editingId.value!, buildDraftBody())
      if (res.code !== 0) throw new Error(res.message || '更新草稿失败')
      ElMessage.success('草稿已更新')
    } else {
      const res = await createDraft(buildDraftBody())
      if (res.code !== 0) throw new Error(res.message || '保存草稿失败')
      ElMessage.success('草稿已保存')
    }
    navigateTo('/admin/article/draft')
  } catch (e: any) {
    ElMessage.error(e?.message || (isEdit.value ? '更新草稿失败' : '保存草稿失败'))
  } finally {
    saving.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  if (submitting.value) return
  try {
    await formRef.value.validate()
  } catch {
    // 表单校验不通过，Element Plus 会自动提示
    return
  }
  submitting.value = true
  try {
    let id: number | null = editingId.value
    if (isEdit.value) {
      const updateRes = await updateDraft(editingId.value!, buildDraftBody())
      if (updateRes.code !== 0) throw new Error(updateRes.message || '更新草稿失败')
    } else {
      const createRes = await createDraft(buildDraftBody())
      if (createRes.code !== 0) throw new Error(createRes.message || '创建草稿失败')
      // 兼容后端不同返回格式：articleId / id / 直接返回数字
      const rawData = createRes.data
      id = typeof rawData === 'number' ? rawData
        : (rawData?.articleId ?? rawData?.id ?? null)
    }
    if (!id) {
      ElMessage.error('创建草稿失败：未获取到稿件 ID')
      return
    }
    const submitRes = await submitForReview(id, {})
    if (submitRes.code !== 0) throw new Error(submitRes.message || '提交送审失败')
    ElMessage.success('稿件已提交送审')
    // 跳转到作者自己的已提交待审列表（审核员在菜单中进入 /admin/review/pending 查看）
    await navigateTo('/admin/article/pending')
  } catch (e: any) {
    // 敏感词拦截优先识别：后端命中高危敏感词时返回 400 + message 含"敏感词"
    // ofetch 抛出的 error 对象中, e.data.message 才是后端业务消息, e.message 是通用 HTTP 文案
    const backendMsg = e?.data?.message || e?.response?._data?.message || ''
    if (backendMsg.includes('敏感词') || backendMsg.includes('敏感信息')) {
      ElMessage.error('有敏感信息，请重新编辑')
    } else {
      ElMessage.error(backendMsg || e?.message || '提交送审失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
