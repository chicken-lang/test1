<template>
  <div class="page-container">
    <h3 class="section-title">全站操作日志</h3>

    <!-- 搜索区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="操作人">
        <el-input
          v-model="searchForm.username"
          placeholder="请输入操作人"
          clearable
          style="width: 150px"
        />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="searchForm.role" placeholder="全部角色" clearable style="width: 150px">
          <el-option
            v-for="(label, key) in AdminRoleLabels"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作类型">
        <el-select v-model="searchForm.actionType" placeholder="全部类型" clearable filterable style="width: 180px">
          <el-option
            v-for="label in actionSelectOptions"
            :key="label"
            :label="label"
            :value="label"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
        <el-button icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="createdAt" label="操作时间" width="170" />
      <el-table-column prop="username" label="操作人" width="110" />
      <el-table-column label="角色" width="130" align="center">
        <template #default="{ row }">
          <el-tag :type="roleTagMap[row.role]" size="small">
            {{ AdminRoleLabels[row.role as RoleType] || row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作类型" width="160">
        <template #default="{ row }">
          {{ AuditActionLabels[row.action] || row.action }}
        </template>
      </el-table-column>
      <el-table-column label="关联目标" min-width="180" show-overflow-tooltip>
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
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
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
import { AdminRoleLabels } from '~/utils/adminTypes'
import type { RoleType } from '~/utils/adminTypes'
import { AuditActionLabels, formatAuditDetail, buildDetailFields } from '~/utils/auditLog'
import { fetchMyAuditLogs } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

// 操作类型下拉选项（按标签显示）
const actionSelectOptions = computed(() => {
  return [...new Set(Object.values(AuditActionLabels))].sort()
})

/** 角色 -> el-tag type 映射 */
const roleTagMap: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
  system_admin: 'danger',
  column_admin: 'warning',
  reviewer: undefined,
  editor: 'info',
}

// 搜索表单
const searchForm = reactive({
  username: '',
  role: '' as RoleType | '',
  actionType: '',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
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

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    // 搜索条件传后端（system_admin 可按用户名/角色筛选其他管理员日志）
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.role) params.filterRole = searchForm.role
    if (searchForm.actionType) {
      // actionType 存的是中文标签，需反查 action code
      const actionCode = Object.entries(AuditActionLabels).find(([, label]) => label === searchForm.actionType)?.[0]
      if (actionCode) params.action = actionCode
    }

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
  searchForm.username = ''
  searchForm.role = ''
  searchForm.actionType = ''
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
  margin-bottom: 16px;
}

.search-form {
  margin-bottom: 16px;
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
