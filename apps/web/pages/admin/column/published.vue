<template>
  <div class="page-container">
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="标题">
        <el-input
          v-model="searchForm.keyword"
          placeholder="请输入稿件标题"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="栏目">
        <el-select v-model="searchForm.columnId" placeholder="请选择栏目" clearable style="width: 160px">
          <el-option
            v-for="col in columnOptions"
            :key="col.id"
            :label="col.name"
            :value="col.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
        <el-button icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="batch-toolbar" v-if="canManageContent">
      <el-button type="danger" icon="Download" :disabled="selectedRows.length === 0" @click="handleBatchOffline">
        批量下架
      </el-button>
      <span class="selected-count" v-if="selectedRows.length > 0">已选 {{ selectedRows.length }} 项</span>
    </div>

    <el-table
      :data="tableData"
      border
      stripe
      style="width: 100%"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="title-cell">
            <el-tag v-if="row.isTop" type="danger" size="small" effect="dark" class="top-tag">置顶</el-tag>
            <span class="title-text">{{ row.title }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="columnName" label="栏目" width="120" />
      <el-table-column label="发布时间" width="170">
        <template #default="{ row }">
          <span>{{ formatDateTime(row.publishedAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="authorName" label="撰稿人" width="100" />
      <el-table-column label="稿件类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.type === 'confidential' ? 'warning' : 'info'" size="small">
            {{ row.type === 'confidential' ? '涉密公文' : '普通资讯' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="viewCount" label="浏览量" width="100" />
      <el-table-column label="是否置顶" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isTop ? 'danger' : 'info'" size="small">
            {{ row.isTop ? '已置顶' : '未置顶' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <template v-if="canManageContent">
              <el-button type="warning" link size="small" @click="handleWithdraw(row)">撤回</el-button>
              <el-button type="success" link size="small" @click="handleToggleTop(row)">
                {{ row.isTop ? '取消置顶' : '置顶' }}
              </el-button>
            </template>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchPublishedList,
  fetchColumnTree,
  withdrawArticle,
  pinArticle,
  unpinArticle,
} from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'
import { useAuthStore } from '~/stores/cmsAuth'
const authStore = useAuthStore()
// 系统管理员只负责系统配置/账号/栏目, 不参与内容运营(发布/撤回/置顶)
// 后端已拦截, 前端按角色隐藏按钮避免误操作触发 403
const canManageContent = computed(() => {
  const role = authStore.user?.role
  return role === 'column_admin' || role === 'editor' || role === 'reviewer'
})

const loading = ref(false)

const searchForm = reactive({
  keyword: '',
  columnId: null as number | null,
})

const columnOptions = ref<{ id: number; name: string }[]>([])
const columnMap = new Map<number, string>()

const tableData = ref<any[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})
const selectedRows = ref<any[]>([])

async function loadColumnTree() {
  try {
    const res = await fetchColumnTree()
    if (res.code === 0 && res.data) {
      const list: { id: number; name: string }[] = []
      function walk(nodes: any[]) {
        for (const n of nodes) {
          list.push({ id: n.id, name: n.name })
          columnMap.set(n.id, n.name)
          if (n.children?.length) walk(n.children)
        }
      }
      walk(res.data)
      columnOptions.value = list
    }
  } catch {
    // ignore
  }
}

async function loadPublishedList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.columnId) params.columnId = searchForm.columnId
    const res = await fetchPublishedList(params)
    if (res.code === 0 && res.data) {
      tableData.value = (res.data.list || []).map((item: any) => ({
        id: item.id || item.articleId,
        title: item.title,
        columnName: item.columnName || item.column_name || columnMap.get(item.columnId) || '未知',
        publishedAt: item.publishedAt || item.published_at || item.createdAt || '',
        authorName: item.authorName || item.author_name || '未知',
        type: item.confidentialLevel === 'confidential' || item.type === 'confidential' ? 'confidential' : 'normal',
        viewCount: item.viewCount || 0,
        isTop: !!item.isTop || item.pinLevel === 'site_top' || item.pinLevel === 'column_top',
        content: item.content,
      }))
      pagination.total = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载已发布稿件失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadPublishedList()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.columnId = null
  pagination.page = 1
  loadPublishedList()
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

function handleSizeChange(val: number) {
  pagination.pageSize = val
  pagination.page = 1
  loadPublishedList()
}

function handlePageChange(val: number) {
  pagination.page = val
  loadPublishedList()
}

function handleView(row: any) {
  // Navigate to article detail page or open dialog
  ElMessage.info(`查看稿件: ${row.title}`)
}

async function handleWithdraw(row: any) {
  try {
    await ElMessageBox.confirm(
      `确认撤回「${row.title}」？撤回后稿件将变为"已撤回"状态，不再对外展示。`,
      '撤回确认',
      { confirmButtonText: '确认撤回', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  try {
    const res = await withdrawArticle(row.id, {})
    if (res.code === 0) {
      ElMessage.success(`已撤回「${row.title}」`)
      loadPublishedList()
    }
  } catch (err: any) {
    const backendMsg = err?.data?.message || err?.response?._data?.message || ''
    ElMessage.error(backendMsg || err?.statusMessage || err?.message || '撤回失败')
  }
}

async function handleToggleTop(row: any) {
  try {
    if (row.isTop) {
      const res = await unpinArticle(row.id)
      if (res.code === 0) {
        ElMessage.success(`已取消置顶「${row.title}」`)
        loadPublishedList()
      }
    } else {
      const res = await pinArticle(row.id, {})
      if (res.code === 0) {
        ElMessage.success(`已置顶「${row.title}」`)
        loadPublishedList()
      }
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '操作失败')
  }
}

async function handleBatchOffline() {
  if (selectedRows.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认批量下架选中的 ${selectedRows.value.length} 篇稿件？`,
      '批量下架确认',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  let success = 0
  let fail = 0
  let failReason = ''
  for (const row of selectedRows.value) {
    try {
      const res = await withdrawArticle(row.id, {})
      if (res.code === 0) success++
      else fail++
    } catch (err: any) {
      fail++
      // 记录第一个失败原因, 用于提示用户(批量场景下逐条弹窗会刷屏)
      if (!failReason) {
        failReason = err?.data?.message || err?.response?._data?.message || err?.message || ''
      }
    }
  }
  if (success > 0 && fail === 0) {
    ElMessage.success(`批量下架完成：成功 ${success} 篇`)
  } else if (success > 0 && fail > 0) {
    ElMessage.warning(`批量下架：成功 ${success} 篇，失败 ${fail} 篇${failReason ? `（${failReason}）` : ''}`)
  } else {
    ElMessage.error(`批量下架全部失败${failReason ? `：${failReason}` : ''}`)
  }
  loadPublishedList()
}

onMounted(() => {
  loadColumnTree()
  loadPublishedList()
})
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 16px;
}

.batch-toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.title-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.title-cell .top-tag {
  flex-shrink: 0;
}
.title-cell .title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-count {
  color: #909399;
  font-size: 13px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>