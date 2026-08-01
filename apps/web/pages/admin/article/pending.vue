<template>
  <div class="page-container">
    <h3 class="section-title">已提交待审稿件</h3>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="search.title"
        placeholder="请输入稿件标题"
        clearable
        style="width: 220px"
      />
      <el-select v-model="search.type" placeholder="稿件类型" clearable style="width: 160px">
        <el-option label="普通校园资讯" value="normal" />
        <el-option label="涉密公文/专项通知" value="confidential" />
      </el-select>
      <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
      <el-button icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="column_name" label="栏目" width="130" />
      <el-table-column prop="submitted_at" label="提交时间" width="170" />
      <el-table-column label="稿件类型" width="150">
        <template #default="{ row }">
          <el-tag :type="row.type === 'confidential' ? 'danger' : undefined">
            {{ ArticleTypeLabels[row.type as ArticleType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="current_node" label="当前审批节点" width="150" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
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
        @current-change="loadData"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { ArticleType } from '~/utils/adminTypes'
import { ArticleTypeLabels } from '~/utils/adminTypes'
import { fetchArticleList } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

const search = reactive({
  title: '',
  type: undefined as ArticleType | undefined,
})

const tableData = ref<any[]>([])
const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

function mapRow(item: any) {
  return {
    id: item.articleId ?? item.id,
    title: item.title,
    column_name: item.columnName || item.column?.name || `栏目ID:${item.columnId || ''}`,
    submitted_at: formatDateTime(item.submittedAt || item.createdAt),
    type: item.type,
    current_node: item.currentNode || item.reviewStatus || '初审',
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchArticleList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: 'pending_review',
      keyword: search.title || undefined,
      type: search.type || undefined,
    })
    if (res.code === 0 && res.data) {
      tableData.value = res.data.list.map(mapRow)
      pagination.total = res.data.total
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载待审列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function handleSearch() {
  pagination.page = 1
  loadData()
}

const handleSizeChange = () => {
  pagination.page = 1
  loadData()
}

function handleReset() {
  search.title = ''
  search.type = undefined
  pagination.page = 1
  loadData()
}

function handleView(row: any) {
  // 直接跳转到编辑页（编辑后可重新提交）
  navigateTo(`/admin/article/create?id=${row.id}`)
}
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
</style>
