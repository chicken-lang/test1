<template>
  <div class="page-container">
    <h3 class="section-title">栏目访问统计</h3>

    <!-- 栏目选择器 -->
    <div class="column-selector">
      <span class="selector-label">选择栏目：</span>
      <el-select v-model="selectedColumn" placeholder="请选择栏目" style="width: 240px" @change="loadStats">
        <el-option
          v-for="col in columnOptions"
          :key="col.id"
          :label="col.name"
          :value="col.id"
        />
      </el-select>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" v-for="card in statCards" :key="card.label">
        <div class="stat-card">
          <div class="stat-card__value" :style="{ color: card.color }">
            {{ card.value }}
          </div>
          <div class="stat-card__label">{{ card.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- PV/UV 访问趋势折线图 -->
    <LineChart :data="trendData" :series="trendSeries" :height="360" />

    <!-- 热门稿件排行 -->
    <h3 class="section-title">热门稿件排行</h3>
    <el-table v-loading="loading" :data="hotArticles" stripe style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
      <el-table-column prop="view_count" label="浏览量" width="120" align="center" />
      <el-table-column prop="published_at" label="发布时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.published_at) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 附件下载排行 -->
    <h3 class="section-title" style="margin-top: 24px">附件下载排行</h3>
    <el-table v-loading="loading" :data="downloadRanking" stripe style="width: 100%">
      <el-table-column type="index" label="排名" width="70" align="center">
        <template #default="{ $index }">
          <el-tag
            v-if="$index < 3"
            :type="$index === 0 ? 'danger' : $index === 1 ? 'warning' : 'primary'"
            size="small"
            round
          >
            {{ $index + 1 }}
          </el-tag>
          <span v-else>{{ $index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="filename" label="附件名称" min-width="260" show-overflow-tooltip />
      <el-table-column prop="article_title" label="所属稿件" min-width="200" show-overflow-tooltip />
      <el-table-column prop="file_size" label="文件大小" width="120" align="center" />
      <el-table-column prop="download_count" label="下载次数" width="120" align="center">
        <template #default="{ row }">
          <span style="font-weight: 600; color: #409eff">{{ row.download_count }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchColumnTree, fetchColumnStats, fetchHotArticles, fetchDownloadRank } from '~/composables/adminApi'
import { formatDateTime } from '~/utils/format'

const loading = ref(false)
const selectedColumn = ref<number | null>(null)

const columnOptions = ref<{ id: number; name: string }[]>([])

const statCards = ref([
  { label: '今日 PV', value: '-', color: '#409eff' },
  { label: '今日 UV', value: '-', color: '#67c23a' },
  { label: '本月 PV', value: '-', color: '#e6a23c' },
  { label: '附件总下载', value: '-', color: '#f56c6c' },
])

const hotArticles = ref<any[]>([])
const downloadRanking = ref<any[]>([])

// PV/UV 趋势数据(近 7 天,后端就绪后从 statsRes 获取)
const trendSeries = [
  { name: 'PV', color: '#409eff' },
  { name: 'UV', color: '#67c23a' },
]
const trendData = ref(generateTrendData())

function generateTrendData() {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return days.map((label) => ({
    label,
    values: [
      Math.floor(2000 + Math.random() * 4000),  // PV
      Math.floor(500 + Math.random() * 1500),    // UV
    ],
  }))
}

async function loadColumnOptions() {
  try {
    const res = await fetchColumnTree()
    if (res.code === 0 && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.list || []
      columnOptions.value = list.map((item: any) => ({
        id: item.id,
        name: item.name || item.label || item.title || '-',
      }))
    }
  } catch {
    // column tree load failed, leave empty
  }
}

async function loadStats() {
  loading.value = true
  try {
    const today = new Date()
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    const dateParams = {
      startDate: monthAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    }

    const params: Record<string, any> = { ...dateParams }
    if (selectedColumn.value) params.columnId = selectedColumn.value

    const [statsRes, hotRes, downloadRes] = await Promise.all([
      fetchColumnStats(params).catch(() => null),
      fetchHotArticles({ ...params, limit: 5 }).catch(() => null),
      fetchDownloadRank({ ...params, limit: 5 }).catch(() => null),
    ])

    if (statsRes?.code === 0 && statsRes.data) {
      const d = statsRes.data as any
      statCards.value = [
        { label: '今日 PV', value: formatNumber(d.todayPV ?? d.todayPv ?? 0), color: '#409eff' },
        { label: '今日 UV', value: formatNumber(d.todayUV ?? d.todayUv ?? 0), color: '#67c23a' },
        { label: '本月 PV', value: formatNumber(d.monthPV ?? d.monthPv ?? 0), color: '#e6a23c' },
        { label: '附件总下载', value: formatNumber(d.totalDownloads ?? d.total_downloads ?? 0), color: '#f56c6c' },
      ]
    }

    if (hotRes?.code === 0 && hotRes.data) {
      const list = Array.isArray(hotRes.data) ? hotRes.data : (hotRes.data as any)?.list || []
      hotArticles.value = list.map((item: any) => ({
        title: item.title,
        view_count: item.viewCount ?? item.view_count ?? 0,
        published_at: item.publishedAt || item.published_at || '',
      }))
    }

    if (downloadRes?.code === 0 && downloadRes.data) {
      const list = Array.isArray(downloadRes.data) ? downloadRes.data : (downloadRes.data as any)?.list || []
      downloadRanking.value = list.map((item: any) => ({
        filename: item.filename || item.file_name || '-',
        article_title: item.articleTitle || item.article_title || '-',
        file_size: item.fileSize || item.file_size || '-',
        download_count: item.downloadCount ?? item.download_count ?? 0,
      }))
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

onMounted(async () => {
  await loadColumnOptions()
  loadStats()
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.column-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.selector-label {
  font-size: 14px;
  color: #606266;
  flex-shrink: 0;
  margin-right: 8px;
}

.stat-row {
  margin-bottom: 20px;
}
</style>
