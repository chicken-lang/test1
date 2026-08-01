<template>
  <div class="page-container">
    <h3 class="section-title">发布全局公告</h3>

    <!-- 发布公告表单 -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      style="max-width: 720px"
    >
      <el-form-item label="公告标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入公告标题" maxlength="100" show-word-limit />
      </el-form-item>
      <el-form-item label="公告内容" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="6"
          placeholder="请输入公告内容"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="推送范围" prop="scope">
        <el-radio-group v-model="form.scope">
          <el-radio value="all">全站所有角色</el-radio>
          <el-radio value="column_admin">仅栏目管理员</el-radio>
          <el-radio value="reviewer">仅审核管理员</el-radio>
          <el-radio value="editor">仅编辑管理员</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-radio-group v-model="form.priority">
          <el-radio value="normal">普通</el-radio>
          <el-radio value="urgent">紧急</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Promotion" @click="handlePublish">发布公告</el-button>
      </el-form-item>
    </el-form>

    <!-- 历史公告 -->
    <el-divider content-position="left">历史公告记录</el-divider>

    <el-table :data="historyData" stripe style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
      <el-table-column label="推送范围" width="160" align="center">
        <template #default="{ row }">
          {{ getScopeLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="170" align="center">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewHistory(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 历史详情弹窗 -->
    <el-dialog v-model="historyDetailVisible" title="公告详情" width="520px">
      <template v-if="currentHistory">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="公告标题">{{ currentHistory.title }}</el-descriptions-item>
          <el-descriptions-item label="推送范围">{{ getScopeLabel(currentHistory) }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="currentHistory.priority === 'urgent' ? 'danger' : 'info'" size="small">
              {{ currentHistory.priority === 'urgent' ? '紧急' : '普通' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ formatDateTime(currentHistory.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="内容">{{ currentHistory.content }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="historyDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { formatDateTime } from '~/utils/format'

const api = useApi()

const scopeLabelMap: Record<string, string> = {
  all: '全站所有角色',
  column_admin: '仅栏目管理员',
  reviewer: '仅审核管理员',
  editor: '仅编辑管理员',
}

const formRef = ref<FormInstance>()
const form = reactive({
  title: '',
  content: '',
  scope: 'all',
  priority: 'normal',
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
  scope: [{ required: true, message: '请选择推送范围', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
}

const historyData = ref<any[]>([])

/** 从消息记录中推导推送范围标签 */
function getScopeLabel(row: any): string {
  if (!row) return '-'
  // 优先使用 receiverRole 字段
  if (row.receiverRole && scopeLabelMap[row.receiverRole]) {
    return scopeLabelMap[row.receiverRole]
  }
  // 兜底：sendMode=all → 全站
  if (row.sendMode === 'all' || row.receiverRole === 'all') {
    return '全站所有角色'
  }
  if (row.receiverRole && scopeLabelMap[row.receiverRole]) {
    return scopeLabelMap[row.receiverRole]
  }
  return '全站所有角色'
}

async function loadHistory() {
  try {
    const res = await api.get<any>('/admin/messages', { type: 'notice', pageSize: 50 })
    const rawList = res?.list || []
    // 后端为每个接收人创建独立记录，按标题去重，只保留每个公告的第一条
    const seen = new Set<string>()
    historyData.value = rawList.filter((item: any) => {
      const key = item.title + '|' + (item.createdAt || '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (err: any) {
    console.error('[publish.vue] loadHistory failed:', err?.message || err)
    historyData.value = []
  }
}

onMounted(() => {
  loadHistory()
})

const historyDetailVisible = ref(false)
const currentHistory = ref<any>(null)

async function handlePublish() {
  try {
    await formRef.value?.validate()
    const sendModeMap: Record<string, string> = {
      all: 'all',
      column_admin: 'role',
      reviewer: 'role',
      editor: 'role',
    }
    const receiverRoleMap: Record<string, string> = {
      column_admin: 'column_admin',
      reviewer: 'reviewer',
      editor: 'editor',
    }

    await api.post('/admin/messages/notice', {
      title: form.title,
      content: form.content,
      sendMode: sendModeMap[form.scope] || 'all',
      receiverRole: receiverRoleMap[form.scope],
      priority: form.priority,
    })
    ElMessage.success('公告发布成功')
    // 手动重置，避免 resetFields 触发验证
    form.title = ''
    form.content = ''
    form.scope = 'all'
    form.priority = 'normal'
    formRef.value?.clearValidate()
    await loadHistory()
  } catch (err: any) {
    // validate() 失败时 err 是 { errors, fields } 对象，无 message
    // 表单上已自动显示错误提示，无需额外弹窗
    if (err?.message) ElMessage.error(err.message)
  }
}

function handleViewHistory(row: any) {
  currentHistory.value = row
  historyDetailVisible.value = true
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}
</style>
