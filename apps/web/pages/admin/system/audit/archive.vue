<template>
  <div class="page-container">
    <h3 class="section-title">历史日志归档</h3>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" icon="FolderAdd" @click="archiveDialogVisible = true">
        手动归档
      </el-button>
      <el-button icon="Refresh" @click="loadBatches">刷新</el-button>
    </div>

    <!-- 归档列表 -->
    <el-table :data="archiveData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="batchNo" label="归档批次" width="200" align="center" />
      <el-table-column prop="migratedCount" label="迁移记录数" width="120" align="center" />
      <el-table-column prop="exportedCount" label="导出记录数" width="120" align="center" />
      <el-table-column label="归档时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.startedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="完成时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.completedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作人" width="120">
        <template #default="{ row }">
          {{ row.operatorName || (row.operatorId ? `管理员${row.operatorId}` : '系统自动') }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusMap[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="warning" link size="small" @click="handleRestore(row)" :disabled="row.status === 'restored'">恢复</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 手动归档弹窗 -->
    <el-dialog v-model="archiveDialogVisible" title="手动归档" width="480px">
      <el-form label-width="100px">
        <el-form-item label="归档天数">
          <el-input-number v-model="archiveDays" :min="1" :max="3650" />
          <span class="archive-tip-inline">天前的日志</span>
        </el-form-item>
        <el-form-item>
          <span class="archive-tip">
            将指定天数之前的操作日志从主表迁移至归档表。归档后的日志可通过"查看"功能查询，也可通过"恢复"功能恢复到主表。
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="archiveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="archiving" @click="handleArchive">确认归档</el-button>
      </template>
    </el-dialog>

    <!-- 归档详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="`归档批次详情 - ${currentBatch?.batchNo || ''}`" width="750px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="批次编号">{{ currentBatch?.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(currentBatch?.status)" size="small">
            {{ statusMap[currentBatch?.status] || currentBatch?.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="迁移记录数">{{ currentBatch?.migratedCount }}</el-descriptions-item>
        <el-descriptions-item label="导出记录数">{{ currentBatch?.exportedCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatDateTime(currentBatch?.startedAt) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDateTime(currentBatch?.completedAt) }}</el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentBatch?.operatorName || (currentBatch?.operatorId ? `管理员${currentBatch.operatorId}` : '系统自动') }}
        </el-descriptions-item>
        <el-descriptions-item label="存储路径">{{ currentBatch?.storagePath || '—' }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="detail-title">归档日志明细</h4>
      <el-table :data="detailLogs" stripe style="width: 100%" v-loading="detailLoading" max-height="300">
        <el-table-column prop="createdAt" label="操作时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="操作人" width="100" />
        <el-table-column prop="action" label="操作类型" width="180" />
        <el-table-column prop="detail" label="操作详情" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '~/utils/format'
import { fetchArchiveBatches, fetchArchivedLogs, triggerArchive, restoreArchive } from '~/composables/adminApi'

const statusMap: Record<string, string> = {
  completed: '已完成',
  running: '执行中',
  failed: '失败',
  exported: '已导出',
  restored: '已恢复',
}

function statusTagType(status: string) {
  if (status === 'completed') return 'success'
  if (status === 'running') return 'warning'
  if (status === 'failed') return 'danger'
  if (status === 'restored') return 'info'
  return 'info'
}

const archiveDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const loading = ref(false)
const archiving = ref(false)
const detailLoading = ref(false)
const archiveDays = ref(30)

const archiveData = ref<any[]>([])
const currentBatch = ref<any>(null)
const detailLogs = ref<any[]>([])

/** 加载归档批次列表 */
async function loadBatches() {
  loading.value = true
  try {
    const res: any = await fetchArchiveBatches({ page: 1, pageSize: 50 })
    if (res?.code === 0 && res?.data?.list) {
      archiveData.value = res.data.list
    } else if (res?.data?.list) {
      archiveData.value = res.data.list
    } else {
      archiveData.value = []
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载归档列表失败')
  } finally {
    loading.value = false
  }
}

/** 查看归档详情 */
async function handleView(row: any) {
  currentBatch.value = row
  detailDialogVisible.value = true
  detailLoading.value = true
  try {
    const res: any = await fetchArchivedLogs({ page: 1, pageSize: 20 })
    if (res?.code === 0 && res?.data?.list) {
      detailLogs.value = res.data.list
    } else if (res?.data?.list) {
      detailLogs.value = res.data.list
    } else {
      detailLogs.value = []
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载归档日志失败')
    detailLogs.value = []
  } finally {
    detailLoading.value = false
  }
}

/** 恢复归档 */
function handleRestore(row: any) {
  ElMessageBox.confirm(
    `确认恢复归档批次「${row.batchNo}」的 ${row.migratedCount} 条记录到主表？`,
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )
    .then(async () => {
      try {
        const res: any = await restoreArchive({ batchId: row.id })
        if (res?.code !== 0) throw new Error(res?.message || '恢复失败')
        ElMessage.success(res?.data?.message || res?.message || `已恢复 ${row.migratedCount} 条日志到主表`)
        loadBatches()
      } catch (e: any) {
        ElMessage.error(e?.message || '恢复失败')
      }
    })
    .catch(() => {})
}

/** 手动归档 */
async function handleArchive() {
  archiving.value = true
  try {
    const res: any = await triggerArchive({ days: archiveDays.value })
    if (res?.code !== 0) throw new Error(res?.message || '归档失败')
    const data = res?.data || {}
    ElMessage.success(`归档完成：批次 ${data.batchNo || ''}，迁移 ${data.migratedCount || 0} 条日志`)
    archiveDialogVisible.value = false
    loadBatches()
  } catch (e: any) {
    ElMessage.error(e?.message || '归档失败')
  } finally {
    archiving.value = false
  }
}

onMounted(() => {
  loadBatches()
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.archive-tip {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

.archive-tip-inline {
  margin-left: 8px;
  font-size: 13px;
  color: #909399;
}

.detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px;
}
</style>
