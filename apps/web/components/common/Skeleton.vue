<template>
  <!-- 骨架屏组件:加载占位,配合 main.scss .skeleton shimmer 动画 -->
  <!-- 单行模式:返回单个 .skeleton 元素 -->
  <div
    v-if="!rows || rows <= 1"
    class="skeleton-wrap"
    :style="{ width: widthValue, height: heightValue }"
  >
    <div
      class="skeleton"
      :class="{ 'skeleton--rounded': rounded, 'skeleton--circle': circle }"
      :style="{ width: '100%', height: '100%' }"
      aria-hidden="true"
    />
  </div>
  <!-- 多行模式(rows):渲染多行文本占位,最后一行宽度收窄为 60% -->
  <div v-else class="skeleton-rows" :style="{ width: widthValue }" aria-hidden="true">
    <div
      v-for="i in rows"
      :key="i"
      class="skeleton skeleton-row"
      :class="{ 'skeleton--rounded': rounded }"
      :style="rowStyle(i)"
    />
  </div>
</template>

<script setup lang="ts">
// 骨架屏:加载中的占位元素
// width/height: 支持数字(转 px)或字符串(原样使用)
// rounded: 圆角; circle: 圆形(头像等)
// rows: 多行文本占位(T3.5 补全) - 渲染 rows 行,首行 100% 宽,末行 60% 宽
// rowsGap: 多行模式下行间距,默认 10px
const props = withDefaults(
  defineProps<{
    width?: number | string
    height?: number | string
    rounded?: boolean
    circle?: boolean
    rows?: number
    rowsGap?: number
  }>(),
  {
    width: '100%',
    height: 16,
    rounded: true,
    circle: false,
    rows: 0,
    rowsGap: 10,
  },
)

const widthValue = computed(() =>
  typeof props.width === 'number' ? `${props.width}px` : props.width,
)
const heightValue = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height,
)

/** 多行模式:每行宽度递减(首行 100%, 末行 60%) */
const rowStyle = (idx: number) => {
  const total = props.rows || 1
  // 末行 60%,中间行线性插值
  const ratio = total <= 1 ? 1 : 1 - ((idx - 1) / total) * 0.4
  return {
    width: `${ratio * 100}%`,
    height: heightValue.value,
    marginBottom: idx < total ? `${props.rowsGap}px` : 0,
  }
}
</script>

<style lang="scss" scoped>
.skeleton-wrap {
  display: inline-block;
  overflow: hidden;
}

.skeleton {
  width: 100%;
  height: 100%;

  &--circle {
    border-radius: $radius-pill !important;
  }

  &--rounded:not(.skeleton--circle) {
    border-radius: $radius-base;
  }
}

.skeleton-rows {
  display: flex;
  flex-direction: column;
}

.skeleton-row {
  display: block;
}
</style>
