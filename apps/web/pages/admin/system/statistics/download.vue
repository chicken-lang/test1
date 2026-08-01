<template>
  <div class="page-container">
    <h3 class="section-title">全站附件下载排行</h3>

    <!-- 日期范围选择 -->
    <StatsDateFilter @change="handleDateChange" />

    <!-- 表格 -->
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column label="排名" width="80" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.rank <= 3 ? 'danger' : 'info'"
            :effect="row.rank <= 3 ? 'dark' : 'light'"
            round
            size="small"
          >
            {{ row.rank }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="file_name" label="附件名称" min-width="240" show-overflow-tooltip />
      <el-table-column prop="article_title" label="所属稿件" min-width="220" show-overflow-tooltip />
      <el-table-column prop="column_name" label="栏目" width="130" />
      <el-table-column prop="download_count" label="下载次数" width="120" align="center" />
      <el-table-column prop="file_size" label="文件大小" width="120" align="center" />
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchDownloadRank } from '~/composables/adminApi'

const loading = ref(false)

/** 共享日期范围状态（跨页面持久化） */
const { dateRange } = useStatsDateRange()

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const tableData = ref<any[]>([])

/** 兼容后端 code: 0 / 200 两种成功码 */
function isOk(code: number): boolean {
  return code === 0 || code === 200
}

/** 日期变更时重置分页并重新加载 */
function handleDateChange() {
  pagination.page = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await fetchDownloadRank(params)
    if (isOk(res.code) && res.data) {
      const list = (res.data as any)?.list || []
      tableData.value = list.map((item: any) => ({
        rank: item.rank ?? 0,
        file_name: item.fileName || item.file_name || '-',
        article_title: item.articleTitle || item.article_title || '-',
        column_name: item.columnName || item.column_name || '-',
        download_count: item.downloadCount ?? item.download_count ?? 0,
        file_size: item.fileSize || item.file_size || '-',
      }))
      pagination.total = (res.data as any)?.total || list.length
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载下载排行失败')
  } finally {
    loading.value = false
  }
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.date-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  .picker-label {
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
