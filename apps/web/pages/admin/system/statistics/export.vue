<template>
  <div class="page-container">
    <h3 class="section-title">全量统计报表导出</h3>

    <!-- 导出表单 -->
    <el-form :model="exportForm" label-width="110px" class="export-form" style="max-width: 720px">
      <el-form-item label="日期范围">
        <StatsDateFilter @change="() => {}" />
      </el-form-item>
      <el-form-item label="选择栏目">
        <el-select
          v-model="exportForm.columnIds"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择栏目（可多选，不选即全站）"
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
      <el-form-item label="报表类型">
        <el-select v-model="exportForm.reportType" placeholder="请选择报表类型" style="width: 100%">
          <el-option label="栏目访问量报表" value="column_access" />
          <el-option label="热门内容报表" value="hot_articles" />
          <el-option label="文件下载排行报表" value="download_rank" />
          <el-option label="搜索热词报表" value="hot_keywords" />
          <el-option label="综合统计报表" value="comprehensive" />
        </el-select>
      </el-form-item>
      <el-form-item label="导出格式">
        <el-radio-group v-model="exportForm.format">
          <el-radio value="xlsx">Excel</el-radio>
          <el-radio value="pdf">PDF</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Download" :loading="exporting" @click="handleExport">导出报表</el-button>
      </el-form-item>
    </el-form>

    <!-- 历史导出记录 -->
    <el-divider content-position="left">历史导出记录</el-divider>

    <el-table :data="historyData" stripe style="width: 100%">
      <el-table-column prop="generatedAt" label="导出时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.generatedAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="recordCount" label="记录数" width="120" align="center" />
      <el-table-column prop="reportType" label="报表类型" width="160" />
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" :disabled="!row.exportBody" @click="handleDownload(row)">下载</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <span style="color: #909399">暂无历史导出记录</span>
      </template>
    </el-table>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchColumnTree, fetchExportReport } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

const exporting = ref(false)

const columnOptions = ref<{ id: number; name: string }[]>([])

/** 共享日期范围状态（跨页面持久化） */
const { dateRange } = useStatsDateRange()

const exportForm = reactive({
  columnIds: [] as number[],
  reportType: 'comprehensive',
  format: 'xlsx',
})

/** 本次导出结果（作为历史记录展示，后端暂无历史接口） */
const historyData = ref<any[]>([])

/** 兼容后端 code: 0 / 200 两种成功码 */
function isOk(code: number): boolean {
  return code === 0 || code === 200
}

async function loadColumnOptions() {
  try {
    const res = await fetchColumnTree()
    if (isOk(res.code) && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.list || []
      columnOptions.value = list.map((item: any) => ({
        id: item.id ?? item.columnId,
        name: item.name || item.columnName || item.label || item.title || '-',
      }))
    }
  } catch {
    // 栏目加载失败，保留空选项
  }
}

async function handleExport() {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }
  exporting.value = true
  try {
    const body: any = {
      reportType: exportForm.reportType,
      format: exportForm.format,
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
    }
    if (exportForm.columnIds.length > 0) {
      body.columnIds = exportForm.columnIds
    }
    const blob = await fetchExportReport(body)
    // BFF 返回 CSV 文件,直接触发浏览器下载
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportForm.reportType}_${dateRange.value[0]}_${dateRange.value[1]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // 记入历史(存储导出参数,支持重新下载)
    historyData.value.unshift({
      generatedAt: new Date().toISOString(),
      recordCount: '-',
      reportType: exportForm.reportType,
      exportBody: { ...body },
    })
    ElMessage.success('报表导出成功')
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

async function handleDownload(row: any) {
  if (!row.exportBody) return
  try {
    const blob = await fetchExportReport(row.exportBody)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.reportType}_${row.exportBody.startDate || 'all'}_${row.exportBody.endDate || 'today'}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    ElMessage.error('下载失败,请重试')
  }
}

onMounted(() => {
  loadColumnOptions()
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
