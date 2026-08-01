<template>
  <div class="page-container">
    <!-- 首页轮播推荐配置（V2.0 模块十七：批量保存，最多5张） -->
    <div class="section">
      <div class="section-header">
        <div class="section-title-group">
          <h3 class="section-title">首页轮播推荐配置</h3>
          <el-tag size="small" type="info" class="count-tag">
            {{ carouselItems.length }}/{{ MAX_COUNT }}
          </el-tag>
        </div>
        <div class="section-actions">
          <el-button
            type="primary"
            icon="Plus"
            size="small"
            :disabled="carouselItems.length >= MAX_COUNT"
            @click="handleAdd"
          >
            添加文章
          </el-button>
          <el-button
            type="danger"
            plain
            size="small"
            :disabled="carouselItems.length === 0"
            @click="handleClear"
          >
            清空
          </el-button>
          <el-button
            type="success"
            size="small"
            :loading="saving"
            :disabled="carouselItems.length === 0"
            @click="handleSave"
          >
            保存配置
          </el-button>
        </div>
      </div>

      <el-table :data="carouselItems" border stripe style="width: 100%" empty-text="暂无轮播推荐，请点击「添加文章」">
        <el-table-column label="序号" width="80" align="center">
          <template #default="{ $index }">
            <span class="row-index">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="封面" width="120" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.coverImageUrl"
              :src="row.coverImageUrl"
              :preview-src-list="[row.coverImageUrl]"
              fit="cover"
              class="cover-thumb"
              :preview-teleported="true"
            />
            <span v-else class="cover-placeholder">无封面</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
        <el-table-column label="发布时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.publishedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ $index }">
            <el-button
              type="primary"
              link
              size="small"
              :disabled="$index === 0"
              @click="handleMove($index, -1)"
            >
              上移
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              :disabled="$index === carouselItems.length - 1"
              @click="handleMove($index, 1)"
            >
              下移
            </el-button>
            <el-button type="danger" link size="small" @click="handleRemove($index)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="tips">
        <el-icon><InfoFilled /></el-icon>
        <span>轮播图最多 {{ MAX_COUNT }} 张；上移/下移/移除仅修改本地列表，点击「保存配置」后生效。</span>
      </div>
    </div>

    <!-- 选择文章对话框 -->
    <el-dialog v-model="dialogVisible" title="选择文章添加到轮播" width="640px">
      <el-form :inline="true" :model="searchForm" class="search-form" @submit.prevent>
        <el-form-item label="标题">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入标题"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" size="small" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="articleOptions" border stripe style="width: 100%" v-loading="optionsLoading">
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="columnName" label="栏目" width="120" />
        <el-table-column label="发布时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.publishedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              :disabled="isArticleSelected(row.articleId)"
              @click="handleSelectArticle(row)"
            >
              {{ isArticleSelected(row.articleId) ? '已添加' : '选择' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import {
  fetchCarouselConfig,
  saveCarouselConfig,
  clearCarouselConfig,
  fetchRecommendableArticles,
} from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

definePageMeta({ layout: 'admin' })

// V2.0 模块十七：轮播图最多 5 张
const MAX_COUNT = 5
const CAROUSEL_POSITION = 'CAROUSEL_A'

interface CarouselEditItem {
  articleId: number
  title: string
  coverImageUrl: string
  publishedAt: string
  sortOrder: number
}

interface ArticleOption {
  articleId: number
  title: string
  columnName: string
  coverImageUrl: string
  publishedAt: string
}

const carouselItems = ref<CarouselEditItem[]>([])
const saving = ref(false)
const optionsLoading = ref(false)

const dialogVisible = ref(false)
const searchForm = reactive({ title: '' })
const articleOptions = ref<ArticleOption[]>([])

function mapCarouselItem(item: any): CarouselEditItem {
  const article = item?.article || {}
  return {
    articleId: item.articleId ?? article.articleId ?? article.id ?? 0,
    title: article.title ?? item.title ?? '',
    coverImageUrl: article.coverImageUrl ?? item.coverImageUrl ?? '',
    publishedAt: article.publishedAt ?? item.publishedAt ?? '',
    sortOrder: item.sortOrder ?? 0,
  }
}

function mapArticleOption(item: any): ArticleOption {
  return {
    articleId: item.articleId ?? item.id ?? 0,
    title: item.title ?? '',
    columnName: item.column?.columnName ?? item.columnName ?? '',
    coverImageUrl: item.coverImageUrl ?? '',
    publishedAt: item.publishedAt ?? '',
  }
}

function isArticleSelected(articleId: number): boolean {
  return carouselItems.value.some(it => it.articleId === articleId)
}

async function loadConfig() {
  try {
    const res: any = await fetchCarouselConfig()
    if (res.code === 0 || res.code === 200) {
      const all = res.data?.data ?? res.data ?? {}
      const list = all[CAROUSEL_POSITION] ?? []
      carouselItems.value = (Array.isArray(list) ? list : []).map(mapCarouselItem)
    } else {
      ElMessage.error(res.message || '加载轮播配置失败')
    }
  } catch {
    ElMessage.error('加载轮播配置失败')
  }
}

async function loadArticleOptions(keyword?: string) {
  optionsLoading.value = true
  try {
    const res: any = await fetchRecommendableArticles({ keyword })
    if (res.code === 0 || res.code === 200) {
      const list = res.data?.list ?? res.data ?? []
      articleOptions.value = (Array.isArray(list) ? list : []).map(mapArticleOption)
    } else {
      ElMessage.error(res.message || '加载文章列表失败')
    }
  } catch {
    ElMessage.error('加载文章列表失败')
  } finally {
    optionsLoading.value = false
  }
}

onMounted(() => {
  loadConfig()
})

function handleAdd() {
  if (carouselItems.value.length >= MAX_COUNT) {
    ElMessage.warning(`轮播图最多 ${MAX_COUNT} 张`)
    return
  }
  searchForm.title = ''
  articleOptions.value = []
  dialogVisible.value = true
  loadArticleOptions()
}

function handleSearch() {
  loadArticleOptions(searchForm.title)
}

function handleSelectArticle(row: ArticleOption) {
  if (isArticleSelected(row.articleId)) {
    ElMessage.warning('该文章已在轮播中')
    return
  }
  if (carouselItems.value.length >= MAX_COUNT) {
    ElMessage.warning(`轮播图最多 ${MAX_COUNT} 张`)
    return
  }
  carouselItems.value.push({
    articleId: row.articleId,
    title: row.title,
    coverImageUrl: row.coverImageUrl,
    publishedAt: row.publishedAt,
    sortOrder: carouselItems.value.length + 1,
  })
  ElMessage.success('已添加，点击「保存配置」生效')
}

function handleMove(index: number, dir: number) {
  const target = index + dir
  if (target < 0 || target >= carouselItems.value.length) return
  const arr = carouselItems.value
  ;[arr[index], arr[target]] = [arr[target], arr[index]]
}

function handleRemove(index: number) {
  carouselItems.value.splice(index, 1)
}

async function handleSave() {
  if (carouselItems.value.length === 0) {
    ElMessage.warning('请至少添加一篇文章')
    return
  }
  saving.value = true
  try {
    const items = carouselItems.value.map((it, idx) => ({
      articleId: it.articleId,
      sortOrder: idx + 1,
    }))
    const res: any = await saveCarouselConfig({ positionCode: CAROUSEL_POSITION, items })
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('保存成功')
      await loadConfig()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.data?.message || e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function handleClear() {
  ElMessageBox.confirm('确定要清空当前轮播推荐位吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      const res: any = await clearCarouselConfig(CAROUSEL_POSITION)
      if (res.code === 0 || res.code === 200) {
        ElMessage.success('已清空')
        carouselItems.value = []
      } else {
        ElMessage.error(res.message || '清空失败')
      }
    } catch (e: any) {
      ElMessage.error(e?.data?.message || e?.message || '清空失败')
    }
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.count-tag {
  vertical-align: middle;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.cover-thumb {
  width: 80px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
}

.cover-placeholder {
  color: #c0c4cc;
  font-size: 12px;
}

.row-index {
  font-weight: 600;
  color: #005a8e;
}

.search-form {
  margin-bottom: 16px;
}

.tips {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
