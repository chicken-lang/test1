<template>
  <!-- 骨架屏组件:加载占位,配合 main.scss .skeleton shimmer 动画 -->
  <div class="skeleton-wrap" :style="{ width: widthValue, height: heightValue }">
    <div
      class="skeleton"
      :class="{ 'skeleton--rounded': rounded, 'skeleton--circle': circle }"
      :style="{ width: '100%', height: '100%' }"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
// 骨架屏:加载中的占位元素
// width/height: 支持数字(转 px)或字符串(原样使用)
// rounded: 圆角; circle: 圆形(头像等)
// rows: 多行文本占位(暂未实现,可用多个 Skeleton 拼接)
const props = withDefaults(
  defineProps<{
    width?: number | string
    height?: number | string
    rounded?: boolean
    circle?: boolean
  }>(),
  {
    width: '100%',
    height: 16,
    rounded: true,
    circle: false,
  },
)

const widthValue = computed(() =>
  typeof props.width === 'number' ? `${props.width}px` : props.width,
)
const heightValue = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height,
)
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
</style>
