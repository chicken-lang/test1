<template>
  <div class="page-container">
    <h3 class="section-title">留言咨询台账</h3>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="search.keyword"
        placeholder="标题/内容/编号"
        clearable
        style="width: 220px"
      />
      <el-select v-model="search.status" placeholder="咨询状态" clearable style="width: 140px">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已答复" value="replied" />
        <el-option label="已关闭" value="closed" />
      </el-select>
      <el-select v-model="search.businessTag" placeholder="业务标签" clearable style="width: 140px">
        <el-option label="学术事务" value="academic" />
        <el-option label="考试管理" value="exam" />
        <el-option label="培养方案" value="training" />
        <el-option label="学生事务" value="student" />
        <el-option label="教学质量" value="teaching" />
        <el-option label="综合咨询" value="general" />
      </el-select>
      <el-select v-model="search.submitterType" placeholder="提交人身份" clearable style="width: 120px">
        <el-option label="学生" value="student" />
        <el-option label="教师" value="teacher" />
        <el-option label="访客" value="visitor" />
      </el-select>
      <el-select v-model="search.isTimeout" placeholder="超时筛选" clearable style="width: 120px">
        <el-option label="正常" :value="false" />
        <el-option label="已超时" :value="true" />
      </el-select>
      <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
      <el-button icon="Refresh" @click="handleReset">重置</el-button>
      <el-button
        v-if="canExport"
        type="success"
        icon="Download"
        @click="handleExport"
      >导出台账</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="inquiryNo" label="咨询编号" width="180" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column label="业务标签" width="120">
        <template #default="{ row }">
          <el-tag>{{ businessTagNames[row.businessTag] || row.businessTag }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submitterName" label="提交人" width="100" />
      <el-table-column prop="submitterType" label="身份" width="80">
        <template #default="{ row }">
          {{ submitterTypeNames[row.submitterType] || row.submitterType }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">
            {{ statusNames[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="超时" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isTimeout" type="danger" size="small">超时</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="deadlineAt" label="截止时间" width="170">
        <template #default="{ row }">
          {{ formatDate(row.deadlineAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="提交时间" width="170">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">详情</el-button>
          <el-button
            v-if="canReply && (row.status === 'pending' || row.status === 'processing')"
            type="success"
            link
            @click="handleReply(row)"
          >答复</el-button>
          <el-button
            v-if="canAssign && row.status === 'pending'"
            type="warning"
            link
            @click="handleAssign(row)"
          >指派</el-button>
          <el-button
            v-if="canClose && row.status !== 'closed'"
            type="danger"
            link
            @click="handleClose(row)"
          >关闭</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="fetchData"
        @size-change="fetchData"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="咨询详情" width="700px">
      <div v-if="currentInquiry" class="inquiry-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="咨询编号">{{ currentInquiry.inquiryNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusNames[currentInquiry.status] }}</el-descriptions-item>
          <el-descriptions-item label="业务标签">{{ businessTagNames[currentInquiry.businessTag] }}</el-descriptions-item>
          <el-descriptions-item label="提交人">{{ currentInquiry.submitterName }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ currentInquiry.submitterContact }}</el-descriptions-item>
          <el-descriptions-item label="身份">{{ submitterTypeNames[currentInquiry.submitterType] }}</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ formatDate(currentInquiry.deadlineAt) }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(currentInquiry.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="是否超时">
            <el-tag v-if="currentInquiry.isTimeout" type="danger">已超时</el-tag>
            <span v-else>正常</span>
          </el-descriptions-item>
          <el-descriptions-item label="是否公开">
            <el-tag v-if="currentInquiry.isPublic" type="success">已公开</el-tag>
            <span v-else>未公开</span>
          </el-descriptions-item>
        </el-descriptions>
        <div class="detail-section">
          <h4>咨询标题</h4>
          <p>{{ currentInquiry.title }}</p>
        </div>
        <div class="detail-section">
          <h4>咨询内容</h4>
          <div class="content-box">{{ currentInquiry.content }}</div>
        </div>
        <div v-if="currentInquiry.replyContent" class="detail-section">
          <h4>答复内容</h4>
          <div class="content-box reply-box">{{ currentInquiry.replyContent }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 答复对话框 -->
    <el-dialog v-model="replyVisible" title="答复咨询" width="600px">
      <el-form :model="replyForm" label-width="100px">
        <el-form-item label="咨询标题">
          <span>{{ replyForm.title }}</span>
        </el-form-item>
        <el-form-item label="答复内容" required>
          <el-input
            v-model="replyForm.replyContent"
            type="textarea"
            :rows="6"
            placeholder="请输入答复内容（10-5000字符）"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="replyForm.isPublic" />
          <span style="margin-left: 8px; color: #909399;">
            公开后将在前台公开展示区展示（提交人信息脱敏）
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply" :loading="replyLoading">提交答复</el-button>
      </template>
    </el-dialog>

    <!-- 指派对话框 -->
    <el-dialog v-model="assignVisible" title="指派处理人" width="400px">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="咨询标题">
          <span>{{ assignForm.title }}</span>
        </el-form-item>
        <el-form-item label="处理人ID" required>
          <el-input-number v-model="assignForm.assigneeId" :min="1" placeholder="请输入管理员ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign" :loading="assignLoading">确认指派</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '~/stores/cmsAuth'
import { AdminRole } from '~/utils/types'

const authStore = useAuthStore()
const role = computed(() => authStore.user?.role ?? AdminRole.EDITOR)

const loading = ref(false)
const tableData = ref<any[]>([])

const search = reactive({
  keyword: '',
  status: '' as string,
  businessTag: '' as string,
  submitterType: '' as string,
  isTimeout: undefined as boolean | undefined,
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const detailVisible = ref(false)
const currentInquiry = ref<any>(null)

const replyVisible = ref(false)
const replyLoading = ref(false)
const replyForm = reactive({
  id: 0,
  title: '',
  replyContent: '',
  isPublic: false,
})

const assignVisible = ref(false)
const assignLoading = ref(false)
const assignForm = reactive({
  id: 0,
  title: '',
  assigneeId: 1,
})

const businessTagNames: Record<string, string> = {
  academic: '学术事务',
  exam: '考试管理',
  training: '培养方案',
  student: '学生事务',
  teaching: '教学质量',
  general: '综合咨询',
}

const submitterTypeNames: Record<string, string> = {
  student: '学生',
  teacher: '教师',
  visitor: '访客',
}

const statusNames: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  replied: '已答复',
  closed: '已关闭',
}

function statusTagType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    replied: 'success',
    closed: 'info',
  }
  return map[status] || ''
}

import { formatDateTime as formatDate } from '~/utils/format'

const canReply = computed(() => true) // 所有后台角色均可答复
const canAssign = computed(() => role.value === AdminRole.COLUMN_ADMIN || role.value === AdminRole.SYSTEM_ADMIN)
const canClose = computed(() => role.value === AdminRole.COLUMN_ADMIN || role.value === AdminRole.SYSTEM_ADMIN)
const canExport = computed(() => role.value === AdminRole.COLUMN_ADMIN || role.value === AdminRole.SYSTEM_ADMIN)

async function fetchData() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(pagination.page))
    params.set('pageSize', String(pagination.pageSize))
    if (search.keyword) params.set('keyword', search.keyword)
    if (search.status) params.set('status', search.status)
    if (search.businessTag) params.set('businessTag', search.businessTag)
    if (search.submitterType) params.set('submitterType', search.submitterType)
    if (search.isTimeout !== undefined) params.set('isTimeout', String(search.isTimeout))

    const res = await $fetch(`/api/admin/inquiries?${params.toString()}`)
    const data = res.data || res
    tableData.value = data.list || []
    pagination.total = data.total || 0
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || '获取咨询列表失败')
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleReset() {
  search.keyword = ''
  search.status = ''
  search.businessTag = ''
  search.submitterType = ''
  search.isTimeout = undefined
  pagination.page = 1
  fetchData()
}

async function handleView(row: any) {
  try {
    const res = await $fetch(`/api/admin/inquiries/${row.id}`)
    currentInquiry.value = res.data || res
    detailVisible.value = true
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || '获取详情失败')
  }
}

function handleReply(row: any) {
  replyForm.id = row.id
  replyForm.title = row.title
  replyForm.replyContent = ''
  replyForm.isPublic = false
  replyVisible.value = true
}

async function submitReply() {
  if (replyForm.replyContent.length < 10) {
    ElMessage.warning('答复内容至少10个字符')
    return
  }
  replyLoading.value = true
  try {
    await $fetch(`/api/inquiries/${replyForm.id}/reply`, {
      method: 'PUT',
      body: JSON.stringify({
        replyContent: replyForm.replyContent,
        isPublic: replyForm.isPublic,
      }),
    })
    ElMessage.success('答复成功')
    replyVisible.value = false
    fetchData()
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || '答复失败')
  } finally {
    replyLoading.value = false
  }
}

function handleAssign(row: any) {
  assignForm.id = row.id
  assignForm.title = row.title
  assignForm.assigneeId = 1
  assignVisible.value = true
}

async function submitAssign() {
  assignLoading.value = true
  try {
    await $fetch(`/api/admin/inquiries/${assignForm.id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigneeId: assignForm.assigneeId }),
    })
    ElMessage.success('指派成功')
    assignVisible.value = false
    fetchData()
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || '指派失败')
  } finally {
    assignLoading.value = false
  }
}

async function handleClose(row: any) {
  try {
    await ElMessageBox.confirm(`确认关闭咨询《${row.title}》？`, '提示', {
      type: 'warning',
    })
    await $fetch(`/api/admin/inquiries/${row.id}/close`, {
      method: 'POST',
    })
    ElMessage.success('咨询已关闭')
    fetchData()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err?.statusMessage || '关闭失败')
    }
  }
}

async function handleExport() {
  try {
    const body: any = { format: 'xlsx' }
    if (search.businessTag) body.businessTag = search.businessTag
    if (search.status) body.status = search.status

    const res = await $fetch(`/api/admin/inquiries/export`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const data = (res.data || res) as any

    // 生成 CSV 文件
    if (data.data && data.data.length > 0) {
      const headers = ['咨询编号', '标题', '业务标签', '提交人(脱敏)', '联系方式(脱敏)', '状态', '答复内容', '是否超时', '提交时间', '截止时间']
      const rows = data.data.map((item: any) => [
        item.inquiryNo,
        item.title,
        item.businessTagName || item.businessTag,
        item.submitterName,
        item.submitterContact,
        statusNames[item.status] || item.status,
        item.replyContent || '',
        item.isTimeout ? '是' : '否',
        formatDate(item.createdAt),
        formatDate(item.deadlineAt),
      ])
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `咨询台账_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success(`已导出 ${data.total} 条记录`)
    } else {
      ElMessage.info('没有可导出的数据')
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || '导出失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.inquiry-detail {
  .detail-section {
    margin-top: 16px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #606266;
      margin-bottom: 8px;
    }

    p {
      margin: 0;
      color: #303133;
    }
  }

  .content-box {
    background: #f5f7fa;
    border-radius: 4px;
    padding: 12px;
    line-height: 1.6;
    color: #303133;
    white-space: pre-wrap;
  }

  .reply-box {
    background: #f0f9ff;
    border: 1px solid #d0e8ff;
  }
}
</style>
