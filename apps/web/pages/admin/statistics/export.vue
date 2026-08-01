<template>
  <div class="page-container">
    <h3 class="section-title">统计报表导出</h3>

    <!-- 导出表单 -->
    <el-form :model="exportForm" label-width="100px" class="export-form">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12">
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="exportForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="选择栏目">
            <el-select
              v-model="exportForm.columnIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择栏目"
              style="width: 100%"
            >
              <el-option
                v-for="col in columnOptions"
                :key="col.id"
                :label="col.name"
                :value="col.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :xs="24" :sm="12">
          <el-form-item label="导出格式">
            <el-radio-group v-model="exportForm.format">
              <el-radio value="excel">Excel</el-radio>
              <el-radio value="pdf">PDF</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item>
        <el-button type="primary" icon="Download" :loading="exporting" @click="handleExport">导出报表</el-button>
      </el-form-item>
    </el-form>

    <!-- 历史导出记录 -->
    <el-divider content-position="left">历史导出记录</el-divider>

    <el-table v-loading="historyLoading" :data="historyData" stripe style="width: 100%">
      <el-table-column prop="exported_at" label="导出时间" width="170" />
      <el-table-column prop="exported_by" label="导出人" width="120" />
      <el-table-column prop="file_name" label="文件名" min-width="240" show-overflow-tooltip />
      <el-table-column label="格式" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.format === 'Excel' ? 'success' : 'danger'" size="small">
            {{ row.format }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleDownload(row)">下载</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchColumnTree, fetchExportReport } from '~/composables/adminApi'

const exporting = ref(false)
const historyLoading = ref(false)

const columnOptions = ref<{ id: number; name: string }[]>([])

const exportForm = reactive({
  dateRange: null as string[] | null,
  columnIds: [] as number[],
  format: 'excel' as 'excel' | 'pdf',
})

const historyData = ref<any[]>([])

async function loadColumnOptions() {
  try {
    const res = await fetchColumnTree()
    if (res.code === 0 && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.list || []
      columnOptions.value = list.map((item: any) => ({
        id: item.id,
        name: item.name || item.label || item.title || '-',
      }))
    }
  } catch {
    // column tree load failed
  }
}

async function loadHistory() {
  historyLoading.value = true
  try {
    historyData.value = []
  } catch {
    // ignore
  } finally {
    historyLoading.value = false
  }
}

async function handleExport() {
  if (!exportForm.dateRange || exportForm.dateRange.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }
  exporting.value = true
  try {
    const body: any = {
      reportType: 'column-access',
      format: exportForm.format,
      startDate: exportForm.dateRange[0],
      endDate: exportForm.dateRange[1],
    }
    if (exportForm.columnIds.length > 0) {
      body.columnIds = exportForm.columnIds
    }
    const res = await fetchExportReport(body)
    if (res.code === 0 && res.data) {
      const data = res.data as any
      const url = data.downloadUrl
      if (url) {
        window.open(url, '_blank')
      }
      ElMessage.success(`报表生成成功，共 ${data.recordCount ?? 0} 条记录`)
      await loadHistory()
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

function handleDownload(row: any) {
  if (row.downloadUrl) {
    window.open(row.downloadUrl, '_blank')
  } else {
    ElMessage.info(`下载文件: ${row.file_name}`)
  }
}

onMounted(async () => {
  await loadColumnOptions()
  loadHistory()
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.export-form {
  margin-bottom: 8px;
}
</style>
