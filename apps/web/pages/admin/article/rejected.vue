<template>
  <div class="page-container">
    <h3 class="section-title">被驳回稿件</h3>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="search.title"
        placeholder="请输入稿件标题"
        clearable
        style="width: 220px"
      />
      <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
      <el-button icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="column_name" label="栏目" width="130" />
      <el-table-column prop="rejected_at" label="驳回时间" width="170" />
      <el-table-column prop="reviewer_name" label="驳回人" width="110" />
      <el-table-column prop="reject_reason" label="驳回批注" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" @click="handleResubmit(row)">编辑重提</el-button>
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
import { fetchRejectedList } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

const search = reactive({
  title: '',
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
    rejected_at: formatDateTime(item.rejectedAt || item.updatedAt),
    reviewer_name: item.reviewerName || item.rejectedBy || '',
    reject_reason: item.rejectReason || item.reviewComment || '',
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchRejectedList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: search.title || undefined,
    })
    if (res.code === 0 && res.data) {
      tableData.value = res.data.list.map(mapRow)
      pagination.total = res.data.total
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载驳回列表失败')
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
  pagination.page = 1
  loadData()
}

function handleResubmit(row: any) {
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
