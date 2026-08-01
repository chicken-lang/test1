<template>
  <div class="page-container">
    <h3 class="section-title">全站热门稿件</h3>

    <!-- 排行类型选择 -->
    <div class="date-picker-row">
      <span class="picker-label">榜单周期：</span>
      <el-radio-group v-model="rankType" @change="handleRankTypeChange">
        <el-radio-button value="daily">日榜</el-radio-button>
        <el-radio-button value="weekly">周榜</el-radio-button>
        <el-radio-button value="monthly">月榜</el-radio-button>
        <el-radio-button value="total">总榜</el-radio-button>
      </el-radio-group>
    </div>

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
      <el-table-column prop="title" label="稿件标题" min-width="260" show-overflow-tooltip />
      <el-table-column prop="column_name" label="所属栏目" width="140" />
      <el-table-column prop="view_count" label="浏览量" width="120" align="center" />
      <el-table-column prop="published_at" label="发布时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.published_at) }}
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchHotArticles } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

const loading = ref(false)

/** 榜单周期（跨页面持久化） */
const rankType = useState<string>('stats-rank-type', () => 'daily')

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

/** 周期变更时重置分页并重新加载 */
function handleRankTypeChange() {
  pagination.page = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      rankType: rankType.value,
    }
    const res = await fetchHotArticles(params)
    if (isOk(res.code) && res.data) {
      const list = (res.data as any)?.list || []
      tableData.value = list.map((item: any) => ({
        rank: item.rank ?? 0,
        title: item.title || item.articleId || '-',
        column_name: item.columnName || item.column_name || '-',
        view_count: item.viewCount ?? item.view_count ?? 0,
        published_at: item.publishedAt || item.published_at || '',
      }))
      pagination.total = (res.data as any)?.total || list.length
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载热门稿件失败')
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
