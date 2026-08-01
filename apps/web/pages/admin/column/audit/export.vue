<template>
  <div class="page-container">
    <!-- 导出表单 -->
    <div class="section">
      <h3 class="section-title">日志导出</h3>
      <el-form :model="exportForm" label-width="100px" style="max-width: 600px">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="栏目">
          <el-select v-model="exportForm.columnId" placeholder="请选择栏目" clearable style="width: 100%">
            <el-option
              v-for="col in columnOptions"
              :key="col.id"
              :label="col.name"
              :value="col.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="exportForm.actionTypes"
            placeholder="请选择操作类型"
            multiple
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="type in actionTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Download" :loading="exporting" @click="handleExport">
            导出日志
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 导出历史 -->
    <div class="section">
      <h3 class="section-title">导出历史</h3>
      <el-table :data="historyData" border stripe style="width: 100%">
        <el-table-column prop="exportTime" label="导出时间" width="160" />
        <el-table-column prop="exporter" label="导出人" width="120" />
        <el-table-column prop="fileName" label="文件名" min-width="250" show-overflow-tooltip />
        <el-table-column prop="recordCount" label="记录数" width="100" align="center" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDownload(row)">
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '~/utils/format'
import { AdminRoleLabels } from '~/utils/adminTypes'
import type { RoleType } from '~/utils/adminTypes'

const api = useApi()

// 导出表单
const exportForm = reactive({
  dateRange: null as [string, string] | null,
  columnId: null as number | null,
  actionTypes: [] as string[],
})

const exporting = ref(false)

// 栏目选项
const columnOptions = ref([
  { id: 1, name: '教学管理' },
  { id: 2, name: '实践教学' },
  { id: 3, name: '综合事务' },
])

// 操作类型选项
const actionTypes = ref([
  '创建稿件',
  '编辑稿件',
  '审核通过',
  '审核驳回',
  '发布稿件',
  '撤回稿件',
  '下架稿件',
  '设置推荐',
  '取消推荐',
])

// 导出历史
interface ExportRecord {
  id: number
  exportTime: string
  exporter: string
  fileName: string
  recordCount: number
  dateRange: [string, string]
  columnId: number | null
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
  columnId: number | null,
  actionTypes: string[],
): Promise<{ blob: Blob; fileName: string; count: number } | null> {
  // 拉取审计日志（传递日期参数让后端过滤，前端做二次过滤兜底）
  const [startDate, endDate] = dateRange
  const res = await api.get<any>('/audit', {
    page: 1,
    pageSize: 500,
    startDate,
    endDate,
  })
  let list: any[] = (res as any)?.list || []

  // 前端二次过滤：日期范围（兜底，防止后端未正确过滤）
  list = list.filter((item: any) => {
    const itemDate = (item.createdAt || item.created_at || '').slice(0, 10)
    if (!itemDate) return true
    return itemDate >= startDate && itemDate <= endDate
  })

  // 前端二次过滤：操作类型（使用前缀匹配，兼容后端具体动作名）
  if (actionTypes.length > 0) {
    const actionMap: Record<string, string[]> = {
      '创建稿件': ['article_create'],
      '编辑稿件': ['article_update'],
      '审核通过': ['article_first_review_approve', 'article_final_review_approve'],
      '审核驳回': ['article_first_review_reject', 'article_final_review_reject'],
      '发布稿件': ['article_publish'],
      '撤回稿件': ['article_withdraw'],
      '下架稿件': ['article_unpublish'],
      '设置推荐': ['article_pin', 'article_top'],
      '取消推荐': ['article_unpin', 'article_untop'],
    }
    const actionPrefixes = actionTypes.flatMap(t => actionMap[t] || [t])
    list = list.filter((item: any) =>
      actionPrefixes.some(p => item.action?.startsWith(p)),
    )
  }

  if (list.length === 0) {
    return null
  }

  // 生成文件名
  const now = new Date()
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const colName = columnOptions.value.find(c => c.id === columnId)?.name || '全部栏目'
  const fileName = `栏目操作日志_${colName}_${timestamp}.xls`

  // 生成文件内容（操作时间加宽，保留角色列）
  const headers = ['操作时间', '操作人', '角色', '操作类型', '关联目标', '操作IP', '操作详情']
  const rows = list.map((item: any) => [
    formatDateTime(item.createdAt || item.created_at),
    item.username || '-',
    item.role ? (AdminRoleLabels[item.role as RoleType] || item.role) : '-',
    item.action || '-',
    item.targetType ? `${item.targetType}${item.targetId ? ` #${item.targetId}` : ''}` : '-',
    item.ip || '-',
    item.detail || '-',
  ])

  // 生成 HTML 表格格式的 Excel 文件（支持列宽设置）
  const colWidths = [140, 100, 100, 100, 140, 120, 200]
  const headerHtml = headers.map((h, i) => `<th width="${colWidths[i]}" style="background:#f0f0f0;border:1px solid #ccc;padding:4px 8px;text-align:center;">${h}</th>`).join('')
  const rowsHtml = rows.map(r =>
    `<tr>${r.map(c => `<td style="border:1px solid #ccc;padding:4px 8px;white-space:nowrap;">${String(c).replace(/</g, '&lt;')}</td>`).join('')}</tr>`
  ).join('\n')
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1">\n<thead><tr>${headerHtml}</tr></thead>\n<tbody>\n${rowsHtml}\n</tbody>\n</table></body></html>`
  const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel;charset=utf-8' })

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

// 导出
async function handleExport() {
  if (!exportForm.dateRange || exportForm.dateRange.length < 2) {
    ElMessage.warning('请选择日期范围')
    return
  }
  exporting.value = true
  try {
    const result = await fetchAndGenerateFile(
      exportForm.dateRange,
      exportForm.columnId,
      exportForm.actionTypes,
    )
    if (!result) {
      ElMessage.info('所选条件下没有可导出的日志数据')
      return
    }

    triggerDownload(result.blob, result.fileName)

    // 添加到导出历史
    const now = new Date()
    historyData.value.unshift({
      id: nextHistoryId++,
      exportTime: formatDateTime(now.toISOString()),
      exporter: getCurrentExporter(),
      fileName: result.fileName,
      recordCount: result.count,
      dateRange: exportForm.dateRange,
      columnId: exportForm.columnId,
      actionTypes: [...exportForm.actionTypes],
    })

    ElMessage.success(`已导出 ${result.count} 条日志记录`)
  } catch (err: any) {
    ElMessage.error(err?.message || '导出失败，请稍后重试')
  } finally {
    exporting.value = false
  }
}

// 下载
async function handleDownload(row: ExportRecord) {
  try {
    const result = await fetchAndGenerateFile(
      row.dateRange,
      row.columnId,
      row.actionTypes,
    )
    if (!result) {
      ElMessage.info('该历史记录对应的日志数据已不存在')
      return
    }
    triggerDownload(result.blob, row.fileName)
    ElMessage.success('文件下载已开始')
  } catch (err: any) {
    ElMessage.error(err?.message || '下载失败，请稍后重试')
  }
}
</script>

<style lang="scss" scoped>
.section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}
</style>
