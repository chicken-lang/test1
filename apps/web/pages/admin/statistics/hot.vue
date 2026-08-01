<template>
  <div class="page-container">
    <h3 class="section-title">热门稿件排行</h3>

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
      <el-table-column prop="published_at" label="发布时间" width="170" />
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
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchHotArticles } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const tableData = ref<any[]>([])

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    const res = await fetchHotArticles(params)
    if (res.code === 0 && res.data) {
      tableData.value = (res.data.list || []).map((item: any) => ({
        rank: item.rank ?? 0,
        title: item.title,
        column_name: item.columnName || item.column_name || '-',
        view_count: item.viewCount ?? item.view_count ?? 0,
        published_at: formatDateTime(item.publishedAt || item.published_at),
      }))
      pagination.total = res.data.total || 0
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

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
