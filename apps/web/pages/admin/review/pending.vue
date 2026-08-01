<template>
  <div class="page-container">
    <h3 class="section-title">待我审核稿件</h3>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="search.keyword"
        placeholder="请输入稿件标题"
        clearable
        style="width: 220px"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
      <el-button icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="title" label="稿件标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="columnName" label="归属栏目" width="140" />
      <el-table-column prop="authorName" label="撰稿编辑" width="120" />
      <el-table-column prop="submittedAt" label="提交时间" width="170" />
      <el-table-column label="稿件类型" width="160">
        <template #default="{ row }">
          <el-tag :type="row.type === 'confidential' ? 'danger' : 'primary'" size="small">
            {{ row.type === 'confidential' ? '涉密公文' : '普通资讯' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="当前状态" width="130">
        <template #default="{ row }">
          <el-tag type="warning" size="small">待审核</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link @click="handleView(row)">查看详情</el-button>
            <el-button v-if="canReview" type="success" link @click="openReviewDialog(row)">审核操作</el-button>
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
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 审核操作弹窗 -->
    <el-dialog
      v-model="reviewDialogVisible"
      :title="`审核稿件 - ${currentArticle?.title || ''}`"
      width="600px"
      :close-on-click-modal="false"
    >
      <template v-if="currentArticle">
        <el-descriptions :column="2" border class="review-article-info">
          <el-descriptions-item label="标题" :span="2">{{ currentArticle.title }}</el-descriptions-item>
          <el-descriptions-item label="归属栏目">{{ currentArticle.columnName }}</el-descriptions-item>
          <el-descriptions-item label="撰稿编辑">{{ currentArticle.authorName }}</el-descriptions-item>
          <el-descriptions-item label="稿件类型">
            <el-tag :type="currentArticle.type === 'confidential' ? 'danger' : 'primary'" size="small">
              {{ currentArticle.type === 'confidential' ? '涉密公文' : '普通资讯' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentArticle.submittedAt }}</el-descriptions-item>
        </el-descriptions>

        <el-alert
          v-if="currentArticle.type === 'normal'"
          title="普通资讯审核通过后将直接发布到前台"
          type="success"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        />
        <el-alert
          v-else
          title="涉密公文审核通过后将流转至栏目管理员进行终审"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 16px"
        />

        <el-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRules" label-width="80px" style="margin-top: 16px">
          <el-form-item label="审核结果" prop="action">
            <el-radio-group v-model="reviewForm.action">
              <el-radio value="approve">审核通过</el-radio>
              <el-radio value="reject">驳回退回</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="reviewForm.action === 'reject' ? '驳回原因' : '审核意见'" prop="comment">
            <el-input
              v-model="reviewForm.comment"
              type="textarea"
              :rows="4"
              :placeholder="reviewForm.action === 'reject' ? '请填写驳回原因，将通知撰稿编辑' : '可选：填写审核意见'"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview" :loading="reviewSubmitting">
          确认提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 稿件详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`稿件详情 - ${currentArticle?.title || ''}`"
      width="700px"
    >
      <template v-if="currentArticle">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题" :span="2">{{ currentArticle.title }}</el-descriptions-item>
          <el-descriptions-item label="归属栏目">{{ currentArticle.columnName }}</el-descriptions-item>
          <el-descriptions-item label="撰稿编辑">{{ currentArticle.authorName }}</el-descriptions-item>
          <el-descriptions-item label="稿件类型">
            <el-tag :type="currentArticle.type === 'confidential' ? 'danger' : 'primary'" size="small">
              {{ currentArticle.type === 'confidential' ? '涉密公文' : '普通资讯' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag type="warning" size="small">待审核</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间" :span="2">{{ currentArticle.submittedAt }}</el-descriptions-item>
          <el-descriptions-item label="正文内容" :span="2">
            <div class="article-content-preview" v-html="currentArticle.content || '<p>暂无正文内容</p>'" />
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { reactive, ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  fetchPendingReviewList,
  firstReviewAction,
  fetchColumnTree,
  buildFirstReviewBody,
} from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'
import { useAuthStore } from '~/stores/cmsAuth'
const authStore = useAuthStore()
// 系统管理员不参与内容运营, 无审核权; 审核由 reviewer/column_admin 负责
const canReview = computed(() => {
  const role = authStore.user?.role
  return role === 'reviewer' || role === 'column_admin'
})

const loading = ref(false)
const reviewSubmitting = ref(false)

const search = reactive({
  keyword: '',
})

const tableData = ref<any[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const columnMap = new Map<number, string>()

async function loadColumnTree() {
  try {
    const res = await fetchColumnTree()
    if (res.code === 0 && res.data) {
      function walk(list: any[]) {
        for (const n of list) {
          columnMap.set(n.id, n.name)
          if (n.children?.length) walk(n.children)
        }
      }
      walk(res.data)
    }
  } catch {
    // ignore
  }
}

async function loadPendingList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (search.keyword) params.keyword = search.keyword
    const res = await fetchPendingReviewList(params)
    if (res.code === 0 && res.data) {
      tableData.value = (res.data.list || []).map((item: any) => ({
        id: item.id || item.articleId,
        title: item.title,
        columnName: item.columnName || item.column_name || columnMap.get(item.columnId) || '未知栏目',
        authorName: item.authorName || item.author_name || item.author || '未知',
        submittedAt: formatDateTime(item.submittedAt || item.submitted_at || item.createdAt),
        type: item.confidentialLevel === 'confidential' || item.type === 'confidential' ? 'confidential' : 'normal',
        status: item.status,
        content: item.content,
      }))
      pagination.total = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载待审核稿件失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadPendingList()
}

function handleReset() {
  search.keyword = ''
  pagination.page = 1
  loadPendingList()
}

function handleSizeChange(val: number) {
  pagination.pageSize = val
  pagination.page = 1
  loadPendingList()
}

function handlePageChange(val: number) {
  pagination.page = val
  loadPendingList()
}

// ========== 审核弹窗 ==========
const reviewDialogVisible = ref(false)
const currentArticle = ref<any>(null)
const reviewFormRef = ref<FormInstance>()
const reviewForm = reactive({
  action: 'approve' as 'approve' | 'reject',
  comment: '',
})
const reviewRules: FormRules = {
  action: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  comment: [{
    validator: (_rule: any, value: string, callback: any) => {
      if (reviewForm.action === 'reject' && !value) {
        callback(new Error('驳回时必须填写原因'))
      } else {
        callback()
      }
    },
    trigger: 'blur',
  }],
}

function openReviewDialog(row: any) {
  currentArticle.value = row
  reviewForm.action = 'approve'
  reviewForm.comment = ''
  reviewDialogVisible.value = true
}

async function submitReview() {
  if (!reviewFormRef.value) return
  const valid = await reviewFormRef.value.validate().catch(() => false)
  if (!valid) return

  const article = currentArticle.value
  if (!article) return

  let confirmMsg = ''
  if (reviewForm.action === 'approve') {
    if (article.type === 'normal') {
      confirmMsg = `确认通过「${article.title}」？\n普通资讯审核通过后将直接发布到前台。`
    } else {
      confirmMsg = `确认通过「${article.title}」？\n涉密公文审核通过后将流转至栏目管理员进行终审。`
    }
  } else {
    confirmMsg = `确认驳回「${article.title}」？\n驳回后将通知撰稿编辑，稿件退回修改。`
  }

  // 先关闭审核弹窗，避免 ElMessageBox 被遮挡
  reviewDialogVisible.value = false
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))

  try {
    await ElMessageBox.confirm(confirmMsg, '审核确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: reviewForm.action === 'approve' ? 'success' : 'warning',
    })
  } catch {
    // 用户取消，重新打开审核弹窗
    reviewDialogVisible.value = true
    return
  }

  reviewSubmitting.value = true
  try {
    const body = buildFirstReviewBody(
      reviewForm.action,
      article.type,
      reviewForm.comment || undefined,
    )
    const res = await firstReviewAction(article.id, body)
    if (res.code === 0) {
      if (reviewForm.action === 'approve') {
        ElMessage.success(article.type === 'normal'
          ? `审核通过，「${article.title}」已发布到前台`
          : `审核通过，「${article.title}」已流转至栏目管理员终审`)
      } else {
        ElMessage.success(`已驳回「${article.title}」，已通知撰稿编辑`)
      }
      reviewDialogVisible.value = false
      loadPendingList()
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '审核提交失败')
  } finally {
    reviewSubmitting.value = false
  }
}

// ========== 详情弹窗 ==========
const detailDialogVisible = ref(false)

function handleView(row: any) {
  currentArticle.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  loadColumnTree()
  loadPendingList()
})
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

.review-article-info {
  margin-bottom: 8px;
}

.article-content-preview {
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.8;
  color: #606266;
  font-size: 14px;
  white-space: pre-wrap;
}
</style>