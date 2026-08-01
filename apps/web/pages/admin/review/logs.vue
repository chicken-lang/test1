<template>
  <div class="page-container">
    <h3 class="section-title">栏目操作日志</h3>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-date-picker
        v-model="search.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 280px"
      />
      <el-select v-model="search.action" placeholder="操作类型" clearable filterable style="width: 180px">
        <el-option
          v-for="item in actionOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
      <el-button icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="createdAt" label="操作时间" width="170" />
      <el-table-column prop="username" label="操作人" width="120" />
      <el-table-column label="操作类型" width="160">
        <template #default="{ row }">
          <el-tag :type="actionTagType(row.action)" size="small">
            {{ AuditActionLabels[row.action] || row.action }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联目标" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.targetType ? `${row.targetType}${row.targetId ? ` #${row.targetId}` : ''}` : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="操作IP" width="140" />
      <el-table-column label="操作详情" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          {{ formatAuditDetail(row.action, row.detail) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showDetail(row)">查看</el-button>
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
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="操作日志详情" width="600px">
      <el-descriptions :column="1" border v-if="currentDetail">
        <el-descriptions-item
          v-for="field in currentDetailFields"
          :key="field.label"
          :label="field.label"
        >
          <span :class="{ 'raw-data': field.label === '原始数据' }">{{ field.value }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { AuditActionLabels, formatAuditDetail, buildDetailFields } from '~/utils/auditLog'
import { fetchMyAuditLogs } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

const loading = ref(false)

/** 搜索条件 */
const search = reactive({
  dateRange: null as string[] | null,
  action: '' as string,
})

// 操作类型选项（从共享映射生成，筛选栏目相关操作）
const actionOptions = computed(() => {
  const relevantActions = [
    'article_create_draft', 'article_update_draft', 'article_delete_draft',
    'article_submit_review', 'article_first_review_approve', 'article_first_review_reject',
    'article_first_review_publish', 'article_first_review_to_final',
    'article_publish', 'article_withdraw', 'article_pin', 'article_unpin',
    'column_create', 'column_update', 'column_sort', 'column_delete',
  ]
  return relevantActions
    .map(action => ({ value: action, label: AuditActionLabels[action] || action }))
    .filter(item => item.label)
})

function actionTagType(action: string): 'success' | 'warning' | 'info' | 'danger' | undefined {
  if (action.includes('reject') || action.includes('denied')) return 'danger'
  if (action.includes('create') || action.includes('publish') || action.includes('approve')) return 'success'
  if (action.includes('delete') || action.includes('withdraw')) return 'warning'
  return 'info'
}

const tableData = ref<any[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 详情弹窗
const detailVisible = ref(false)
const currentDetail = ref<any>(null)
const currentDetailFields = computed(() => {
  if (!currentDetail.value) return []
  return buildDetailFields(currentDetail.value)
})

function showDetail(row: any) {
  currentDetail.value = row
  detailVisible.value = true
}

async function loadLogs() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (search.action) params.action = search.action
    if (search.dateRange && search.dateRange.length === 2) {
      params.startDate = search.dateRange[0]
      params.endDate = search.dateRange[1]
    }

    const res = await fetchMyAuditLogs(params)
    if (res.code === 0 && res.data) {
      tableData.value = (res.data.list || []).map((item: any) => ({
        ...item,
        createdAt: formatDateTime(item.createdAt || item.created_at),
      }))
      pagination.total = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载日志失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadLogs()
}

function handleReset() {
  search.dateRange = null
  search.action = ''
  pagination.page = 1
  loadLogs()
}

function handleSizeChange() {
  pagination.page = 1
  loadLogs()
}

function handlePageChange() {
  loadLogs()
}

onMounted(() => {
  loadLogs()
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

.raw-data {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #909399;
  word-break: break-all;
}
</style>
