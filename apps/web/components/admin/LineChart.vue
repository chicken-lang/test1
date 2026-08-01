<template>
  <div class="line-chart" :style="{ height: height + 'px' }">
    <svg
      :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
      :width="chartWidth"
      :height="chartHeight"
      class="chart-svg"
      @mousemove="onMouseMove"
      @mouseleave="hoveredIndex = -1"
    >
      <!-- 渐变定义 -->
      <defs>
        <linearGradient v-for="(s, i) in series" :key="i" :id="`area-${i}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="s.color" stop-opacity="0.15" />
          <stop offset="100%" :stop-color="s.color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Y 轴网格线 -->
      <g class="grid-lines">
        <line
          v-for="tick in yTicks"
          :key="tick.value"
          :x1="padding.left"
          :y1="tick.y"
          :x2="chartWidth - padding.right"
          :y2="tick.y"
          stroke="#ebeef5"
          stroke-width="1"
          stroke-dasharray="4 4"
        />
        <text
          v-for="tick in yTicks"
          :key="`label-${tick.value}`"
          :x="padding.left - 10"
          :y="tick.y + 4"
          text-anchor="end"
          class="axis-text"
        >{{ tick.label }}</text>
      </g>

      <!-- X 轴标签 -->
      <g class="x-axis">
        <text
          v-for="(point, i) in data"
          :key="`x-${i}`"
          :x="getX(i)"
          :y="chartHeight - padding.bottom + 20"
          text-anchor="middle"
          class="axis-text"
        >{{ point.label }}</text>
      </g>

      <!-- 区域填充 + 折线 -->
      <g v-for="(s, si) in series" :key="`series-${si}`">
        <!-- 区域填充 -->
        <path
          :d="getAreaPath(si)"
          :fill="`url(#area-${si})`"
        />
        <!-- 折线 -->
        <path
          :d="getLinePath(si)"
          fill="none"
          :stroke="s.color"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- 数据点 -->
        <g class="data-points">
          <circle
            v-for="(point, i) in data"
            :key="`pt-${si}-${i}`"
            :cx="getX(i)"
            :cy="getY(point.values[si], si)"
            :r="hoveredIndex === i ? 5 : 3"
            :fill="hoveredIndex === i ? s.color : '#fff'"
            :stroke="s.color"
            stroke-width="2"
            class="data-point"
          />
        </g>
      </g>

      <!-- 悬停指示线 -->
      <line
        v-if="hoveredIndex >= 0"
        :x1="getX(hoveredIndex)"
        :y1="padding.top"
        :x2="getX(hoveredIndex)"
        :y2="chartHeight - padding.bottom"
        stroke="#c0c4cc"
        stroke-width="1"
        stroke-dasharray="3 3"
      />
    </svg>

    <!-- Tooltip -->
    <div
      v-if="hoveredIndex >= 0 && tooltipPos && data[hoveredIndex]"
      class="chart-tooltip"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      <div class="tooltip-label">{{ data[hoveredIndex].label }}</div>
      <div v-for="(s, i) in series" :key="i" class="tooltip-item">
        <span class="tooltip-dot" :style="{ background: s.color }"></span>
        <span class="tooltip-name">{{ s.name }}</span>
        <span class="tooltip-value">{{ formatNumber(data[hoveredIndex].values[i]) }}</span>
      </div>
    </div>

    <!-- 图例 -->
    <div class="chart-legend">
      <div v-for="(s, i) in series" :key="i" class="legend-item">
        <span class="legend-dot" :style="{ background: s.color }"></span>
        <span class="legend-name">{{ s.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// AdminLineChart - 纯 SVG 折线图组件(无第三方依赖)
// 支持多系列、悬停 tooltip、自适应宽度
// 用于后台统计分析页面(PV/UV 趋势等)

interface ChartDataPoint {
  label: string
  values: number[]
}

interface ChartSeries {
  name: string
  color: string
}

const props = withDefaults(defineProps<{
  data: ChartDataPoint[]
  series: ChartSeries[]
  height?: number
}>(), {
  height: 360,
})

const chartWidth = 800
const chartHeight = computed(() => props.height)
const padding = { top: 20, right: 30, bottom: 40, left: 60 }

const innerWidth = computed(() => chartWidth - padding.left - padding.right)
const innerHeight = computed(() => chartHeight.value - padding.top - padding.bottom)

// Y 轴最大值(取所有系列的最大值,向上取整到合适的刻度)
const maxValue = computed(() => {
  let max = 0
  props.data.forEach((d) => {
    d.values.forEach((v) => {
      if (v > max) max = v
    })
  })
  if (max === 0) max = 100
  // 向上取整到合适的刻度
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
  return Math.ceil(max / magnitude) * magnitude
})

// Y 轴刻度
const yTicks = computed(() => {
  const ticks: { value: number; y: number; label: string }[] = []
  const steps = 5
  for (let i = 0; i <= steps; i++) {
    const value = (maxValue.value / steps) * i
    const y = padding.top + innerHeight.value - (value / maxValue.value) * innerHeight.value
    ticks.push({ value, y, label: formatNumber(value) })
  }
  return ticks
})

// X 坐标
const getX = (index: number) => {
  if (props.data.length <= 1) return padding.left + innerWidth.value / 2
  return padding.left + (innerWidth.value / (props.data.length - 1)) * index
}

// Y 坐标
const getY = (value: number, seriesIndex: number) => {
  void seriesIndex
  return padding.top + innerHeight.value - (value / maxValue.value) * innerHeight.value
}

// 折线路径
const getLinePath = (seriesIndex: number) => {
  if (props.data.length === 0) return ''
  return props.data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.values[seriesIndex], seriesIndex)}`)
    .join(' ')
}

// 区域路径
const getAreaPath = (seriesIndex: number) => {
  if (props.data.length === 0) return ''
  const linePath = props.data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.values[seriesIndex], seriesIndex)}`)
    .join(' ')
  const lastX = getX(props.data.length - 1)
  const firstX = getX(0)
  const baseY = padding.top + innerHeight.value
  return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`
}

// 格式化数字
function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(Math.round(n))
}

// 悬停交互
const hoveredIndex = ref(-1)
const tooltipPos = ref<{ x: number; y: number } | null>(null)

const onMouseMove = (e: MouseEvent) => {
  if (props.data.length === 0) return
  const svg = e.currentTarget as SVGElement
  const rect = svg.getBoundingClientRect()
  const scaleX = chartWidth / rect.width
  const mouseX = (e.clientX - rect.left) * scaleX

  // 找到最近的点
  let closest = 0
  let minDist = Infinity
  props.data.forEach((_, i) => {
    const dist = Math.abs(getX(i) - mouseX)
    if (dist < minDist) {
      minDist = dist
      closest = i
    }
  })
  hoveredIndex.value = closest

  // Tooltip 位置(相对于容器)
  const containerRect = svg.parentElement?.getBoundingClientRect()
  if (containerRect) {
    const actualX = getX(closest) / scaleX
    tooltipPos.value = {
      x: actualX,
      y: padding.top / scaleX,
    }
  }
}
</script>

<style lang="scss" scoped>
.line-chart {
  position: relative;
  width: 100%;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
}

.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.axis-text {
  font-size: 12px;
  fill: #909399;
}

.data-point {
  transition: r 0.15s ease;
  cursor: pointer;
}

.chart-tooltip {
  position: absolute;
  background: rgba(48, 49, 51, 0.92);
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  transform: translate(-50%, -100%);
  margin-top: -8px;
  z-index: 10;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);

  .tooltip-label {
    font-weight: 600;
    margin-bottom: 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 4px;
  }

  .tooltip-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }

  .tooltip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .tooltip-name {
    color: rgba(255, 255, 255, 0.7);
  }

  .tooltip-value {
    font-weight: 600;
    margin-left: 8px;
  }
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding-top: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
