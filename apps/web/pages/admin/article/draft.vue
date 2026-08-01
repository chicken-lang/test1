<template>
  <div class="page-container">
    <h3 class="section-title">我的草稿</h3>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="search.title"
        placeholder="请输入稿件标题"
        clearable
        style="width: 220px"
      />
      <el-select v-model="search.column_id" placeholder="选择栏目" clearable style="width: 160px">
        <el-option
          v-for="col in columnOptions"
          :key="col.id"
          :label="col.name"
          :value="col.id"
        />
      </el-select>
      <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
      <el-button icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
      <el-table-column prop="title" label="稿件标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="column_name" label="所属栏目" width="140" />
      <el-table-column prop="created_at" label="创建时间" width="170" />
      <el-table-column label="标签" min-width="180">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.business_tags"
            :key="tag"
            size="small"
            style="margin-right: 4px; margin-bottom: 2px"
          >
            {{ tag }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag type="info">{{ ArticleStatusLabels[row.status as ArticleStatus] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link @click="handleEdit(row)">编辑草稿</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除草稿</el-button>
          </div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ArticleStatus } from '~/utils/adminTypes'
import { ArticleStatusLabels } from '~/utils/adminTypes'
import { fetchMyDrafts, deleteDraft, fetchColumnTree } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

const search = reactive({
  title: '',
  column_id: undefined as number | undefined,
})

const columnOptions = ref<any[]>([])

const tableData = ref<any[]>([])
const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

function flattenColumnTree(nodes: any[]): any[] {
  const result: any[] = []
  for (const n of nodes) {
    result.push({ id: n.columnId ?? n.id, name: n.columnName ?? n.name })
    if (n.children?.length) result.push(...flattenColumnTree(n.children))
  }
  return result
}

async function loadColumnTree() {
  try {
    const res = await fetchColumnTree()
    if (res.code === 0 && res.data) {
      columnOptions.value = flattenColumnTree(res.data)
    }
  } catch {
    columnOptions.value = []
  }
}

function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return val ? [val] : [] }
  }
  return []
}

function mapRow(item: any) {
  return {
    id: item.articleId ?? item.id,
    title: item.title,
    column_name: item.columnName || item.column?.name || `栏目ID:${item.columnId || ''}`,
    created_at: formatDateTime(item.createdAt),
    business_tags: parseJsonArray(item.businessTags),
    status: item.status,
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchMyDrafts({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: search.title || undefined,
      column: search.column_id || undefined,
    })
    if (res.code === 0 && res.data) {
      tableData.value = res.data.list.map(mapRow)
      pagination.total = res.data.total
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载草稿列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadColumnTree()
  loadData()
})

async function handleSearch() {
  pagination.page = 1
  loadData()
}

const handleSizeChange = () => {
  pagination.page = 1
  loadData()
}

function handleReset() {
  search.title = ''
  search.column_id = undefined
  pagination.page = 1
  loadData()
}

function handleEdit(row: any) {
  navigateTo(`/admin/article/create?id=${row.id}`)
}

function handleDelete(row: any) {
  ElMessageBox.confirm(`确认删除草稿「${row.title}」？`, '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      const res = await deleteDraft(row.id)
      if (res.code !== 0) {
        throw new Error(res.message || '删除失败')
      }
      ElMessage.success('已删除')
      loadData()
    } catch (e: any) {
      ElMessage.error(e?.message || '删除失败')
    }
  }).catch(() => {})
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
