<template>
  <div class="page-container">
    <h3 class="section-title">全站稿件查询（只读）</h3>

    <!-- 搜索区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="稿件标题">
        <el-input
          v-model="searchForm.keyword"
          placeholder="请输入标题关键字"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="栏目">
        <el-select v-model="searchForm.columnId" placeholder="全部栏目" clearable style="width: 150px">
          <el-option
            v-for="col in columnOptions"
            :key="col.id"
            :label="col.columnName || col.name"
            :value="col.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="稿件状态">
        <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
          <el-option
            v-for="(label, key) in ArticleStatusLabels"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="稿件类型">
        <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 150px">
          <el-option
            v-for="(label, key) in ArticleTypeLabels"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="作者">
        <el-input
          v-model="searchForm.author"
          placeholder="请输入作者"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" :loading="loading" @click="handleSearch">搜索</el-button>
        <el-button icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
      <el-table-column label="栏目" width="130">
        <template #default="{ row }">{{ row.columnName || row.column_name || '-' }}</template>
      </el-table-column>
      <el-table-column label="作者" width="110" align="center">
        <template #default="{ row }">{{ row.authorName || row.author_name || row.source || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="130" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" size="small">
            {{ ArticleStatusLabels[row.status as ArticleStatus] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="稿件类型" width="160" align="center">
        <template #default="{ row }">
          {{ ArticleTypeLabels[row.type as ArticleType] || row.type || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createdAt || row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="110" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="loadData"
        @size-change="loadData"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="稿件详情（只读）" width="600px">
      <template v-if="currentArticle">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题" :span="2">{{ currentArticle.title }}</el-descriptions-item>
          <el-descriptions-item label="栏目">{{ currentArticle.columnName || currentArticle.column_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="作者">{{ currentArticle.authorName || currentArticle.author_name || currentArticle.source || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentArticle.status)" size="small">
              {{ ArticleStatusLabels[currentArticle.status as ArticleStatus] || currentArticle.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="稿件类型">
            {{ ArticleTypeLabels[currentArticle.type as ArticleType] || currentArticle.type || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentArticle.createdAt || currentArticle.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(currentArticle.updatedAt || currentArticle.updated_at) }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArticleStatusLabels, ArticleTypeLabels } from '~/utils/adminTypes'
import type { ArticleStatus, ArticleType } from '~/utils/adminTypes'
import { fetchArticleList, fetchColumnTree } from '~/composables/adminApi'

/** 搜索表单 */
const searchForm = reactive({
  keyword: '',
  columnId: undefined as number | undefined,
  status: '' as ArticleStatus | '',
  type: '' as ArticleType | '',
  author: '',
  dateRange: null as string[] | null,
})

/** 栏目选项（从后端动态获取） */
const columnOptions = ref<Array<{ id: number; columnName?: string; name?: string }>>([])

/** 状态 -> el-tag type 映射 (color-coded) */
const statusTagMap: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
  draft: 'info',
  pending_review: 'warning',
  review_rejected: 'danger',
  final_pending: 'primary',
  published: 'success',
  withdrawn: 'info',
}

/** 获取状态标签 type（确保返回合法值） */
function getStatusTagType(status?: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' {
  return statusTagMap[status || ''] || 'info'
}

/** 分页（服务端分页） */
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

/** 加载状态 */
const loading = ref(false)

/** 表格数据 */
const tableData = ref<any[]>([])

/** 详情弹窗 */
const detailVisible = ref(false)
const currentArticle = ref<any | null>(null)

/** 格式化日期 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 加载栏目选项 */
async function loadColumns() {
  try {
    const res = await fetchColumnTree()
    const data = (res as any)?.data || res
    columnOptions.value = Array.isArray(data) ? data : (data?.list || [])
  } catch {
    columnOptions.value = []
  }
}

/** 加载稿件数据 */
async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.columnId) params.columnId = searchForm.columnId
    if (searchForm.status) params.status = searchForm.status

    const res = await fetchArticleList(params)
    const data = (res as any)?.data || res
    tableData.value = data?.list || []
    total.value = data?.total || 0

    // 本地过滤：后端暂不支持的筛选条件（type, author, dateRange）
    if (searchForm.type) {
      tableData.value = tableData.value.filter((row: any) => row.type === searchForm.type)
      total.value = tableData.value.length
    }
    if (searchForm.author) {
      tableData.value = tableData.value.filter((row: any) => {
        const author = row.authorName || row.author_name || row.source || ''
        return author.toLowerCase().includes(searchForm.author.toLowerCase())
      })
      total.value = tableData.value.length
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const [start, end] = searchForm.dateRange
      tableData.value = tableData.value.filter((row: any) => {
        const dateStr = row.createdAt || row.created_at || ''
        const d = dateStr.slice(0, 10)
        return d >= start && d <= end
      })
      total.value = tableData.value.length
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '加载稿件列表失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** 搜索 */
function handleSearch() {
  currentPage.value = 1
  loadData()
}

/** 重置 */
function handleReset() {
  searchForm.keyword = ''
  searchForm.columnId = undefined
  searchForm.status = ''
  searchForm.type = ''
  searchForm.author = ''
  searchForm.dateRange = null
  currentPage.value = 1
  loadData()
  ElMessage.info('已重置搜索条件')
}

/** 查看详情 */
function handleView(row: any) {
  currentArticle.value = row
  detailVisible.value = true
}

/** 初始化 */
onMounted(() => {
  loadColumns()
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
</style>
