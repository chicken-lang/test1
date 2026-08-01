<script setup lang="ts">
/**
 * 统计页面统一日期筛选组件
 *
 * 交互优化：
 * 1. 快捷标签按钮（今天/近7天/近30天/本月）—— 一键切换，无需打开日期面板
 * 2. 日期范围选择器 —— 自定义日期范围，支持快捷面板
 * 3. 当前选中的快捷项高亮显示，提供视觉反馈
 *
 * 使用共享 useState 实现跨页面持久化
 */
const { dateRange, fmtDate, shortcuts } = useStatsDateRange()

const emit = defineEmits<{
  change: [range: string[]]
}>()

/** 快捷选项定义 */
const quickOptions = [
  { label: '今天', key: 'today', getValue: () => { const t = fmtDate(new Date()); return [t, t] } },
  { label: '近7天', key: '7d', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return [fmtDate(s), fmtDate(e)] } },
  { label: '近30天', key: '30d', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return [fmtDate(s), fmtDate(e)] } },
  { label: '本月', key: 'month', getValue: () => { const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth(), 1); return [fmtDate(s), fmtDate(n)] } },
]

/** 当前激活的快捷项 */
const activeQuick = ref<string>('')

/** 检测当前 dateRange 匹配哪个快捷项 */
function detectActiveQuick() {
  const [s, e] = dateRange.value
  for (const opt of quickOptions) {
    const [qs, qe] = opt.getValue()
    if (s === qs && e === qe) {
      activeQuick.value = opt.key
      return
    }
  }
  activeQuick.value = '' // 自定义范围
}

/** 点击快捷选项 */
function handleQuickClick(opt: typeof quickOptions[0]) {
  const [s, e] = opt.getValue()
  dateRange.value = [s, e]
  activeQuick.value = opt.key
  emit('change', [s, e])
}

/** 日期选择器变更 */
function handleDateChange(val: string[] | null) {
  if (val && val.length === 2) {
    dateRange.value = val
    detectActiveQuick()
    emit('change', val)
  }
}

/** 组件挂载时检测当前快捷项 */
onMounted(() => {
  detectActiveQuick()
})
</script>

<template>
  <div class="stats-date-filter">
    <!-- 快捷标签按钮 -->
    <div class="quick-tags">
      <button
        v-for="opt in quickOptions"
        :key="opt.key"
        class="quick-tag"
        :class="{ 'is-active': activeQuick === opt.key }"
        @click="handleQuickClick(opt)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 分隔线 -->
    <span class="filter-divider">|</span>

    <!-- 日期范围选择器 -->
    <el-date-picker
      :model-value="dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="YYYY-MM-DD"
      :shortcuts="shortcuts"
      :clearable="false"
      style="width: 300px"
      @update:model-value="handleDateChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.stats-date-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.quick-tags {
  display: flex;
  gap: 6px;
}

.quick-tag {
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: #409eff;
    border-color: #c6e2ff;
    background: #ecf5ff;
  }

  &.is-active {
    color: #fff;
    background: #409eff;
    border-color: #409eff;
  }
}

.filter-divider {
  color: #dcdfe6;
  font-size: 14px;
  margin: 0 2px;
}
</style>
