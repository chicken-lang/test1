<template>
  <div class="page-container">
    <h3 class="section-title">日志批量导出</h3>

    <!-- 导出表单 -->
    <el-form :model="exportForm" label-width="110px" class="export-form" style="max-width: 680px">
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
      <el-form-item label="角色">
        <el-select v-model="exportForm.role" placeholder="全部角色" clearable style="width: 100%">
          <el-option
            v-for="(label, key) in AdminRoleLabels"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作类型">
        <el-select
          v-model="exportForm.actionTypes"
          multiple
          collapse-tags
          collapse-tags-tooltip
          filterable
          placeholder="请选择操作类型（可多选）"
          style="width: 100%"
        >
          <el-option
            v-for="item in actionOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="导出格式">
        <el-radio-group v-model="exportForm.format">
          <el-radio value="excel">Excel</el-radio>
          <el-radio value="csv">CSV</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Download" :loading="exporting" @click="handleExport">导出日志</el-button>
      </el-form-item>
    </el-form>

    <!-- 导出历史 -->
    <el-divider content-position="left">导出历史</el-divider>

    <el-table :data="historyData" stripe style="width: 100%">
      <el-table-column prop="exported_at" label="导出时间" width="170" />
      <el-table-column prop="exporter" label="导出人" width="120" />
      <el-table-column prop="file_name" label="文件名" min-width="280" show-overflow-tooltip />
      <el-table-column prop="record_count" label="记录数" width="100" align="center" />
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDownload(row)">下载</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { AdminRoleLabels } from '~/utils/adminTypes'
import type { RoleType } from '~/utils/adminTypes'
import { AuditActionLabels, formatAuditDetail } from '~/utils/auditLog'
import { fetchMyAuditLogs } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

/** 操作类型选项（从共享映射生成） */
const actionOptions = computed(() => {
  return Object.entries(AuditActionLabels).map(([value, label]) => ({ value, label }))
})

/** 导出表单 */
const exportForm = reactive({
  dateRange: null as string[] | null,
  role: '' as RoleType | '',
  actionTypes: [] as string[],
  format: 'excel',
})

const exporting = ref(false)

/** 导出历史 */
interface ExportRecord {
  id: number
  exported_at: string
  exporter: string
  file_name: string
  record_count: number
  format: string
  dateRange: [string, string]
  role: string
  actionTypes: string[]
}

const historyData = ref<ExportRecord[]>([])

let nextHistoryId = 1

/** 获取当前用户昵称 */
function getCurrentExporter(): string {
  const authStore = useAuthStore()
  return authStore.user?.realName || authStore.user?.username || '当前管理员'
}

/** 拉取审计日志数据并生成文件 */
async function fetchAndGenerateFile(
  dateRange: [string, string],
  role: string,
  actionTypes: string[],
  format: string,
): Promise<{ blob: Blob; fileName: string; count: number } | null> {
  const [startDate, endDate] = dateRange

  // 使用 fetchMyAuditLogs（客户端 $fetch，携带 admin token）
  const res = await fetchMyAuditLogs({
    page: 1,
    pageSize: 500,
    startDate,
    endDate,
  })

  let list: any[] = res?.data?.list || []

  // 前端二次过滤：日期范围（兜底）
  list = list.filter((item: any) => {
    const itemDate = (item.createdAt || item.created_at || '').slice(0, 10)
    if (!itemDate) return true
    return itemDate >= startDate && itemDate <= endDate
  })

  // 前端二次过滤：角色
  if (role) {
    list = list.filter((item: any) => item.role === role)
  }

  // 前端二次过滤：操作类型（使用 action code 精确匹配）
  if (actionTypes.length > 0) {
    list = list.filter((item: any) => actionTypes.includes(item.action))
  }

  if (list.length === 0) {
    return null
  }

  // 生成文件名
  const now = new Date()
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const roleSuffix = role ? `_${AdminRoleLabels[role as RoleType]}` : ''
  const actionSuffix = actionTypes.length > 0 ? `_${actionTypes.map(a => AuditActionLabels[a] || a).join('+')}` : ''
  const ext = format === 'excel' ? 'xlsx' : 'csv'
  const fileName = `全站操作日志${roleSuffix}${actionSuffix}_${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}_${timestamp}.${ext}`

  // 生成文件内容
  const headers = ['操作时间', '操作人', '角色', '操作类型', '关联目标', '操作IP', '操作详情']
  const rows = list.map((item: any) => [
    formatDateTime(item.createdAt || item.created_at),
    item.username || '-',
    item.role ? (AdminRoleLabels[item.role as RoleType] || item.role) : '-',
    AuditActionLabels[item.action] || item.action || '-',
    item.targetType ? `${item.targetType}${item.targetId ? ` #${item.targetId}` : ''}` : '-',
    item.ip || '-',
    formatAuditDetail(item.action, item.detail),
  ])

  let blob: Blob
  if (format === 'excel') {
    // 生成 HTML 表格格式的 Excel 文件
    const colWidths = [140, 100, 100, 120, 140, 120, 220]
    const headerHtml = headers.map((h, i) => `<th width="${colWidths[i]}" style="background:#f0f0f0;border:1px solid #ccc;padding:4px 8px;text-align:center;">${h}</th>`).join('')
    const rowsHtml = rows.map(r =>
      `<tr>${r.map(c => `<td style="border:1px solid #ccc;padding:4px 8px;white-space:nowrap;">${String(c).replace(/</g, '&lt;')}</td>`).join('')}</tr>`
    ).join('\n')
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1">\n<thead><tr>${headerHtml}</tr></thead>\n<tbody>\n${rowsHtml}\n</tbody>\n</table></body></html>`
    blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel;charset=utf-8' })
  } else {
    // CSV 格式
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
  }

  return { blob, fileName, count: list.length }
}

/** 触发浏览器下载 */
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 导出 */
async function handleExport() {
  if (!exportForm.dateRange || exportForm.dateRange.length < 2) {
    ElMessage.warning('请选择日期范围')
    return
  }
  exporting.value = true
  try {
    const result = await fetchAndGenerateFile(
      exportForm.dateRange as [string, string],
      exportForm.role,
      exportForm.actionTypes,
      exportForm.format,
    )
    if (!result) {
      ElMessage.info('所选条件下没有可导出的日志数据')
      return
    }

    // 触发下载
    triggerDownload(result.blob, result.fileName)

    // 添加到导出历史
    const now = new Date()
    historyData.value.unshift({
      id: nextHistoryId++,
      exported_at: formatDateTime(now.toISOString()),
      exporter: getCurrentExporter(),
      file_name: result.fileName,
      record_count: result.count,
      format: exportForm.format,
      dateRange: exportForm.dateRange as [string, string],
      role: exportForm.role,
      actionTypes: [...exportForm.actionTypes],
    })

    ElMessage.success(`已导出 ${result.count} 条日志记录`)
  } catch (err: any) {
    ElMessage.error(err?.message || '导出失败，请稍后重试')
  } finally {
    exporting.value = false
  }
}

/** 下载（从历史记录重新生成文件） */
async function handleDownload(row: ExportRecord) {
  try {
    const result = await fetchAndGenerateFile(
      row.dateRange,
      row.role,
      row.actionTypes,
      row.format,
    )
    if (!result) {
      ElMessage.info('该历史记录对应的日志数据已不存在')
      return
    }
    // 使用历史记录中的文件名
    triggerDownload(result.blob, row.file_name)
    ElMessage.success('文件下载已开始')
  } catch (err: any) {
    ElMessage.error(err?.message || '下载失败，请稍后重试')
  }
}
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
