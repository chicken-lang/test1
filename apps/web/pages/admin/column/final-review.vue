<template>
  <div class="page-container">
    <h3 class="section-title">待我终审稿件</h3>

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
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
        <el-button icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert
      title="仅涉密公文/专项通知需终审，普通资讯由审核管理员初审通过后直接发布"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="columnName" label="栏目" width="120" />
      <el-table-column prop="authorName" label="撰稿编辑" width="120" />
      <el-table-column prop="reviewerName" label="初审人" width="120" />
      <el-table-column prop="submittedAt" label="提交时间" width="160" />
      <el-table-column label="稿件类型" width="160">
        <template #default="{ row }">
          <el-tag type="danger" size="small">{{ row.typeLabel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看详情
            </el-button>
            <el-button v-if="canFinalReview" type="warning" link size="small" @click="openFinalReviewDialog(row)">
              终审操作
            </el-button>
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

    <!-- 终审操作弹窗 -->
    <el-dialog
      v-model="finalReviewDialogVisible"
      :title="`终审稿件 - ${currentArticle?.title || ''}`"
      width="640px"
      :close-on-click-modal="false"
    >
      <template v-if="currentArticle">
        <el-descriptions :column="2" border class="review-article-info">
          <el-descriptions-item label="标题" :span="2">{{ currentArticle.title }}</el-descriptions-item>
          <el-descriptions-item label="栏目">{{ currentArticle.columnName }}</el-descriptions-item>
          <el-descriptions-item label="撰稿编辑">{{ currentArticle.authorName }}</el-descriptions-item>
          <el-descriptions-item label="初审人">{{ currentArticle.reviewerName }}</el-descriptions-item>
          <el-descriptions-item label="稿件类型">
            <el-tag type="danger" size="small">{{ currentArticle.typeLabel }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间" :span="2">{{ currentArticle.submittedAt }}</el-descriptions-item>
        </el-descriptions>

        <el-form ref="finalReviewFormRef" :model="finalReviewForm" :rules="finalReviewRules" label-width="90px" style="margin-top: 16px">
          <el-form-item label="终审结果" prop="action" for="">
            <el-radio-group v-model="finalReviewForm.action">
              <el-radio value="approve">终审通过（发布）</el-radio>
              <el-radio value="reject">终审驳回（退回）</el-radio>
            </el-radio-group>
          </el-form-item>

          <template v-if="finalReviewForm.action === 'approve'">
            <el-form-item label="审核意见">
              <el-input
                v-model="finalReviewForm.comment"
                type="textarea"
                :rows="2"
                placeholder="可选：填写终审意见"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </template>

          <el-form-item label="驳回批注" prop="comment" v-if="finalReviewForm.action === 'reject'">
            <el-input
              v-model="finalReviewForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请填写驳回原因，将退回至审核管理员"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="finalReviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFinalReview" :loading="finalReviewSubmitting">
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
          <el-descriptions-item label="栏目">{{ currentArticle.columnName }}</el-descriptions-item>
          <el-descriptions-item label="撰稿编辑">{{ currentArticle.authorName }}</el-descriptions-item>
          <el-descriptions-item label="初审人">{{ currentArticle.reviewerName }}</el-descriptions-item>
          <el-descriptions-item label="稿件类型">
            <el-tag type="danger" size="small">{{ currentArticle.typeLabel }}</el-tag>
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
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  fetchFinalPendingList,
  finalReviewAction,
  buildFinalReviewBody,
} from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'
import { useAuthStore } from '~/stores/cmsAuth'
const authStore = useAuthStore()
// 系统管理员不参与内容运营, 无终审权; 终审由 column_admin 负责
const canFinalReview = computed(() => {
  const role = authStore.user?.role
  return role === 'column_admin'
})

const loading = ref(false)
const finalReviewSubmitting = ref(false)

const searchForm = reactive({
  keyword: '',
})

const tableData = ref<any[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

async function loadFinalPendingList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    const res = await fetchFinalPendingList(params)
    if (res.code === 0 && res.data) {
      tableData.value = (res.data.list || []).map((item: any) => ({
        id: item.id || item.articleId,
        title: item.title,
        columnName: item.columnName || item.column_name || '未知栏目',
        authorName: item.authorName || item.author_name || '未知',
        reviewerName: item.reviewerName || item.reviewer_name || item.firstReviewerName || '未知',
        submittedAt: formatDateTime(item.submittedAt || item.submitted_at || item.createdAt),
        typeLabel: item.type === 'confidential' || item.confidentialLevel === 'confidential' ? '涉密公文/专项通知' : '普通资讯',
        content: item.content,
      }))
      pagination.total = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载待终审稿件失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadFinalPendingList()
}

function handleReset() {
  searchForm.keyword = ''
  pagination.page = 1
  loadFinalPendingList()
}

function handleSizeChange(val: number) {
  pagination.pageSize = val
  pagination.page = 1
  loadFinalPendingList()
}

function handlePageChange(val: number) {
  pagination.page = val
  loadFinalPendingList()
}

// ========== 终审弹窗 ==========
const finalReviewDialogVisible = ref(false)
const currentArticle = ref<any>(null)
const finalReviewFormRef = ref<FormInstance>()
const finalReviewForm = reactive({
  action: 'approve' as 'approve' | 'reject',
  comment: '',
})
const finalReviewRules: FormRules = {
  action: [{ required: true, message: '请选择终审结果', trigger: 'change' }],
  comment: [{
    validator: (_rule: any, value: string, callback: any) => {
      if (finalReviewForm.action === 'reject' && !value) {
        callback(new Error('驳回时必须填写批注'))
      } else {
        callback()
      }
    },
    trigger: 'blur',
  }],
}

function openFinalReviewDialog(row: any) {
  currentArticle.value = row
  finalReviewForm.action = 'approve'
  finalReviewForm.comment = ''
  finalReviewDialogVisible.value = true
}

async function submitFinalReview() {
  if (!finalReviewFormRef.value) return
  const valid = await finalReviewFormRef.value.validate().catch(() => false)
  if (!valid) return

  const article = currentArticle.value
  if (!article) return

  let confirmMsg = ''
  if (finalReviewForm.action === 'approve') {
    confirmMsg = `确认终审通过「${article.title}」？\n稿件将正式发布到前台。`
  } else {
    confirmMsg = `确认终审驳回「${article.title}」？\n稿件将退回至审核管理员，并通知撰稿编辑。`
  }

  // 先关闭审核弹窗，避免 ElMessageBox 被遮挡
  finalReviewDialogVisible.value = false
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))

  try {
    await ElMessageBox.confirm(confirmMsg, '终审确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: finalReviewForm.action === 'approve' ? 'success' : 'warning',
    })
  } catch {
    // 用户取消，重新打开审核弹窗
    finalReviewDialogVisible.value = true
    return
  }

  finalReviewSubmitting.value = true
  try {
    const body = buildFinalReviewBody(
      finalReviewForm.action,
      finalReviewForm.comment || undefined,
    )
    const res = await finalReviewAction(article.id, body)
    if (res.code === 0) {
      if (finalReviewForm.action === 'approve') {
        ElMessage.success(`终审通过，「${article.title}」已发布`)
      } else {
        ElMessage.success(`已驳回「${article.title}」，已退回至审核管理员`)
      }
      finalReviewDialogVisible.value = false
      loadFinalPendingList()
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '终审提交失败')
  } finally {
    finalReviewSubmitting.value = false
  }
}

// ========== 详情弹窗 ==========
const detailDialogVisible = ref(false)

const handleView = (row: any) => {
  currentArticle.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  loadFinalPendingList()
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