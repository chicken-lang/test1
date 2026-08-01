<template>
  <div class="page-container" v-loading="loading">
    <h3 class="section-title">全栏目访问统计</h3>

    <!-- 日期范围选择 -->
    <StatsDateFilter @change="loadStats" />

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

    <!-- 全站 PV/UV 趋势折线图 -->
    <LineChart :data="trendData" :series="trendSeries" :height="360" />

    <!-- 各栏目统计表 -->
    <h3 class="section-title">各栏目访问明细</h3>
    <el-table :data="columnStatsData" stripe style="width: 100%">
      <el-table-column prop="columnName" label="栏目名称" min-width="180" />
      <el-table-column prop="pv" label="PV" width="140" align="center">
        <template #default="{ row }">{{ formatNumber(row.pv) }}</template>
      </el-table-column>
      <el-table-column prop="uv" label="UV" width="140" align="center">
        <template #default="{ row }">{{ formatNumber(row.uv) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 栏目详情对话框 -->
    <el-dialog v-model="detailVisible" :title="`栏目详情: ${detailTitle}`" width="800px" destroy-on-close>
      <div v-loading="detailLoading">
        <el-row :gutter="16" class="stat-row" v-if="detailSummary">
          <el-col :span="12">
            <div class="stat-card">
              <div class="stat-card__value" style="color: #409eff">{{ formatNumber(detailSummary.totalPV) }}</div>
              <div class="stat-card__label">区间 PV</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="stat-card">
              <div class="stat-card__value" style="color: #67c23a">{{ formatNumber(detailSummary.totalUV) }}</div>
              <div class="stat-card__label">区间 UV</div>
            </div>
          </el-col>
        </el-row>
        <LineChart v-if="detailTrendData.length > 0" :data="detailTrendData" :series="trendSeries" :height="300" />
        <el-empty v-else description="暂无趋势数据" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchColumnStats, fetchAllColumnStats } from '~/composables/adminApi'

const loading = ref(false)

/** 共享日期范围状态（跨页面持久化） */
const { dateRange, fmtDate, today, shortcuts } = useStatsDateRange()

/** PV/UV 趋势数据 */
const trendSeries = [
  { name: 'PV', color: '#409eff' },
  { name: 'UV', color: '#67c23a' },
]
const trendData = ref<{ label: string; values: number[] }[]>([])

/** 统计卡片 */
const statCards = ref([
  { label: '今日全站 PV', value: '-', color: '#409eff' },
  { label: '今日全站 UV', value: '-', color: '#67c23a' },
  { label: '区间 PV', value: '-', color: '#e6a23c' },
  { label: '区间 UV', value: '-', color: '#f56c6c' },
])

/** 各栏目统计数据 */
const columnStatsData = ref<{ columnId: number; columnName: string; pv: number; uv: number }[]>([])

/** 栏目详情对话框 */
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailTitle = ref('')
const detailSummary = ref<{ totalPV: number; totalUV: number } | null>(null)
const detailTrendData = ref<{ label: string; values: number[] }[]>([])

/** 兼容后端 code: 0 / 200 两种成功码 */
function isOk(code: number): boolean {
  return code === 0 || code === 200
}

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

async function loadStats() {
  if (!dateRange.value || dateRange.value.length < 2) return
  const [startDate, endDate] = dateRange.value
  loading.value = true

  // 重置卡片为占位
  statCards.value = [
    { label: '今日全站 PV', value: '-', color: '#409eff' },
    { label: '今日全站 UV', value: '-', color: '#67c23a' },
    { label: '区间 PV', value: '-', color: '#e6a23c' },
    { label: '区间 UV', value: '-', color: '#f56c6c' },
  ]
  trendData.value = []
  columnStatsData.value = []

  try {
    const todayStr = today.value

    // 今日全站 + 区间全站 趋势并行
    const [todayRes, rangeRes] = await Promise.all([
      fetchColumnStats({ startDate: todayStr, endDate: todayStr }).catch(() => null),
      fetchColumnStats({ startDate, endDate }).catch(() => null),
    ])

    if (todayRes && isOk(todayRes.code) && todayRes.data) {
      const s = (todayRes.data as any)?.summary || {}
      statCards.value[0] = { label: '今日全站 PV', value: formatNumber(s.totalPV ?? s.totalPv ?? 0), color: '#409eff' }
      statCards.value[1] = { label: '今日全站 UV', value: formatNumber(s.totalUV ?? s.totalUv ?? 0), color: '#67c23a' }
    }

    if (rangeRes && isOk(rangeRes.code) && rangeRes.data) {
      const d = rangeRes.data as any
      const s = d.summary || {}
      statCards.value[2] = { label: '区间 PV', value: formatNumber(s.totalPV ?? s.totalPv ?? 0), color: '#e6a23c' }
      statCards.value[3] = { label: '区间 UV', value: formatNumber(s.totalUV ?? s.totalUv ?? 0), color: '#f56c6c' }

      const details = d.details || []
      trendData.value = details.map((item: any) => ({
        label: String(item.date || '').slice(5) || '-',
        values: [item.pv ?? 0, item.uv ?? 0],
      }))
    }

    // 各栏目明细：栏目树 + 并行查询每栏目
    await loadColumnStats(startDate, endDate)
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

async function loadColumnStats(startDate: string, endDate: string) {
  try {
    // 单次 API 调用获取全栏目统计, 替代之前的 N+1 查询(栏目树 + 逐栏目请求)
    const res = await fetchAllColumnStats({ startDate, endDate }).catch(() => null)
    if (!res || !isOk(res.code) || !res.data) {
      columnStatsData.value = []
      return
    }
    const data = res.data as any
    const list = data.list || []
    columnStatsData.value = list.map((item: any) => ({
      columnId: item.columnId,
      columnName: item.columnName,
      pv: item.pv ?? 0,
      uv: item.uv ?? 0,
    }))
  } catch {
    columnStatsData.value = []
  }
}

async function handleDetail(row: { columnId: number; columnName: string }) {
  if (!dateRange.value || dateRange.value.length < 2) return
  const [startDate, endDate] = dateRange.value

  detailTitle.value = row.columnName
  detailVisible.value = true
  detailLoading.value = true
  detailSummary.value = null
  detailTrendData.value = []

  try {
    const res = await fetchColumnStats({ columnId: row.columnId, startDate, endDate }).catch(() => null)
    if (res && isOk(res.code) && res.data) {
      const d = res.data as any
      const s = d.summary || {}
      detailSummary.value = { totalPV: s.totalPV ?? 0, totalUV: s.totalUV ?? 0 }
      const details = d.details || []
      detailTrendData.value = details.map((item: any) => ({
        label: String(item.date || '').slice(5) || '-',
        values: [item.pv ?? 0, item.uv ?? 0],
      }))
    }
  } catch {
    ElMessage.error('加载栏目详情失败')
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
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

.date-picker-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.picker-label {
  font-size: 14px;
  color: #606266;
  flex-shrink: 0;
  margin-right: 8px;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px 16px;
  text-align: center;

  &__value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }

  &__label {
    font-size: 13px;
    color: #909399;
    margin-top: 8px;
  }
}
</style>
