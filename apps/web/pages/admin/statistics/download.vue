<template>
  <div class="page-container">
    <h3 class="section-title">附件下载排行</h3>

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
      <el-table-column prop="file_name" label="附件名称" min-width="240" show-overflow-tooltip />
      <el-table-column prop="article_title" label="所属稿件" min-width="220" show-overflow-tooltip />
      <el-table-column prop="download_count" label="下载次数" width="120" align="center" />
      <el-table-column prop="file_size" label="文件大小" width="120" align="center" />
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
import { fetchDownloadRank } from '~/composables/adminApi'

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
    const res = await fetchDownloadRank(params)
    if (res.code === 0 && res.data) {
      tableData.value = (res.data.list || []).map((item: any) => ({
        rank: item.rank ?? 0,
        file_name: item.filename || item.file_name || '-',
        article_title: item.articleTitle || item.article_title || '-',
        download_count: item.downloadCount ?? item.download_count ?? 0,
        file_size: item.fileSize || item.file_size || '-',
      }))
      pagination.total = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载下载排行失败')
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