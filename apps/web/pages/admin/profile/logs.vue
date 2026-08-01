<template>
  <div class="page-container">
    <h3 class="section-title">我的操作日志</h3>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-select
        v-model="searchForm.action"
        placeholder="操作类型"
        clearable
        filterable
        style="width: 180px"
      >
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

    <!-- 日志表格 -->
    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="createdAt" label="操作时间" width="170" align="center" />
      <el-table-column label="操作类型" width="160" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="actionTagType(row.action)">
            {{ AuditActionLabels[row.action] || row.action }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联目标" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <template v-if="row.targetType && row.targetId">
            {{ row.targetType }} #{{ row.targetId }}
          </template>
          <span v-else style="color: #999">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="操作IP" width="140" align="center" />
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
    <div class="pagination-wrapper">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { AuditActionLabels, formatAuditDetail, buildDetailFields } from '~/utils/auditLog'
import { fetchMyAuditLogs } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

// 操作类型选项（从共享映射生成）
const actionOptions = computed(() => {
  return Object.entries(AuditActionLabels).map(([value, label]) => ({ value, label }))
})

// 操作类型 tag 颜色
function actionTagType(action: string): 'success' | 'warning' | 'info' | 'danger' | undefined {
  if (action.includes('denied') || action.includes('invalid') || action.includes('reject')) return 'danger'
  if (action.includes('create') || action.includes('publish')) return 'success'
  if (action.includes('delete') || action.includes('freeze') || action.includes('withdraw')) return 'warning'
  if (action.includes('login') || action.includes('password')) return undefined
  return 'info'
}

// 搜索
const searchForm = reactive({
  action: '',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const loading = ref(false)
const tableData = ref<any[]>([])

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

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.action) params.action = searchForm.action

    const res = await fetchMyAuditLogs(params)
    if (res.code === 0 && res.data) {
      tableData.value = (res.data.list || []).map((item: any) => ({
        ...item,
        createdAt: formatDateTime(item.createdAt),
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
  loadData()
}

function handleReset() {
  searchForm.action = ''
  pagination.page = 1
  loadData()
}

function handleSizeChange() {
  pagination.page = 1
  loadData()
}

function handlePageChange() {
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pagination-wrapper {
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
