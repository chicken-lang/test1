<template>
  <div class="page-container">
    <h3 class="section-title">本人提交稿件</h3>

    <!-- 状态筛选 Tab -->
    <el-tabs v-model="activeStatus" @tab-change="handleStatusChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="草稿" name="draft" />
      <el-tab-pane label="待审核" name="pending_review" />
      <el-tab-pane label="已驳回" name="review_rejected" />
      <el-tab-pane label="待终审" name="final_pending" />
      <el-tab-pane label="已发布" name="published" />
    </el-tabs>

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
      <el-select v-model="search.type" placeholder="稿件类型" clearable style="width: 160px">
        <el-option label="普通校园资讯" value="normal" />
        <el-option label="涉密公文/专项通知" value="confidential" />
      </el-select>
      <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
      <el-button icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="filteredData" stripe style="width: 100%">
      <el-table-column prop="title" label="稿件标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="column_name" label="归属栏目" width="140" />
      <el-table-column prop="submitted_at" label="提交时间" width="170" />
      <el-table-column label="稿件类型" width="160">
        <template #default="{ row }">
          <el-tag :type="row.type === 'confidential' ? 'danger' : 'primary'" size="small">
            {{ ArticleTypeLabels[row.type as ArticleType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="130">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ ArticleStatusLabels[row.status as ArticleStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">
            {{ canEdit(row.status) ? '编辑' : '查看' }}
          </el-button>
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
      />
    </div>

    <!-- 稿件详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`稿件详情 - ${currentArticle?.title || ''}`"
      width="700px"
    >
      <template v-if="currentArticle">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题" :span="2">{{ currentArticle.title }}</el-descriptions-item>
          <el-descriptions-item label="归属栏目">{{ currentArticle.column_name }}</el-descriptions-item>
          <el-descriptions-item label="稿件类型">
            <el-tag :type="currentArticle.type === 'confidential' ? 'danger' : 'primary'" size="small">
              {{ ArticleTypeLabels[currentArticle.type as ArticleType] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentArticle.status)" size="small">
              {{ ArticleStatusLabels[currentArticle.status as ArticleStatus] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentArticle.submitted_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentArticle.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentArticle.updated_at }}</el-descriptions-item>
          <el-descriptions-item label="驳回批注" :span="2" v-if="currentArticle.reject_reason">
            <el-alert :title="currentArticle.reject_reason" type="warning" :closable="false" show-icon />
          </el-descriptions-item>
          <el-descriptions-item label="正文内容" :span="2">
            <div class="article-content-preview">
              {{ currentArticle.content || '暂无正文内容（Mock 数据）' }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { ArticleStatus, ArticleType } from '~/utils/adminTypes'
import { ArticleStatusLabels, ArticleTypeLabels } from '~/utils/adminTypes'
import { fetchArticleList, fetchColumnTree } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

const activeStatus = ref('all')

const search = reactive({
  title: '',
  column_id: undefined as number | undefined,
  type: '' as string,
})

const columnOptions = ref<any[]>([])

const filteredData = ref<any[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const detailDialogVisible = ref(false)
const currentArticle = ref<any>(null)

function flattenColumnTree(nodes: any[]): any[] {
  const result: any[] = []
  function walk(list: any[]) {
    for (const n of list) {
      result.push({ id: n.id, name: n.name })
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
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

function mapRow(item: any) {
  return {
    id: item.id,
    title: item.title,
    column_name: item.columnName || item.column?.name || `栏目ID:${item.columnId || ''}`,
    created_at: formatDateTime(item.createdAt),
    updated_at: formatDateTime(item.updatedAt),
    submitted_at: formatDateTime(item.submittedAt),
    type: item.type,
    status: item.status,
    content: item.content || '',
    reject_reason: item.rejectReason || '',
  }
}

async function loadData() {
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: search.title || undefined,
    }
    if (activeStatus.value !== 'all') {
      params.status = activeStatus.value
    }
    if (search.column_id) {
      params.column = String(search.column_id)
    }
    if (search.type) {
      params.type = search.type
    }
    const res = await fetchArticleList(params)
    if (res.code === 0 && res.data) {
      filteredData.value = res.data.list.map(mapRow)
      pagination.total = res.data.total
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载稿件列表失败')
  }
}

onMounted(async () => {
  await loadColumnTree()
  loadData()
})

function statusTagType(status: string) {
  const map: Record<string, string> = {
    draft: 'info',
    pending_review: 'warning',
    review_rejected: 'danger',
    final_pending: 'warning',
    published: 'success',
    withdrawn: 'info',
  }
  return map[status] || 'info'
}

function handleStatusChange() {
  pagination.page = 1
  loadData()
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  search.title = ''
  search.column_id = undefined
  search.type = ''
  loadData()
}

function handleView(row: any) {
  // 直接跳转到编辑页（编辑/查看根据状态决定）
  navigateTo(`/admin/article/create?id=${row.id}`)
}

function canEdit(status: string): boolean {
  // 只有草稿和被驳回状态可编辑
  return status === 'draft' || status === 'review_rejected'
}

function handleEdit(row: any) {
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

.article-content-preview {
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.8;
  color: #606266;
  font-size: 14px;
  white-space: pre-wrap;
}
</style>
