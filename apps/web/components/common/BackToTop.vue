<template>
  <!-- 返回顶部按钮:滚动超过阈值显示,点击平滑回到顶部 -->
  <Transition name="backtop-fade">
    <button
      v-show="isVisible"
      class="back-to-top"
      type="button"
      :aria-label="'返回顶部'"
      title="返回顶部"
      @click="scrollToTop"
    >
      <Icon :icon="icons.chevronUp" :width="22" :height="22" />
    </button>
  </Transition>
</template>

<script setup lang="ts">
// 返回顶部按钮
// 使用 @vueuse/core 的 useScroll 监听滚动
// 阈值 400px:超过后显示按钮
// 点击后平滑滚动至顶部,尊重 prefers-reduced-motion
import { useWindowScroll, useThrottleFn } from '@vueuse/core'
import { icons } from '~/utils/icons'

const props = withDefaults(
  defineProps<{
    visibilityHeight?: number
  }>(),
  {
    visibilityHeight: 400,
  },
)

const { y } = useWindowScroll({ behavior: 'smooth' })

const isVisible = ref(false)

// 节流更新可见性(滚动事件高频触发)
const updateVisibility = useThrottleFn(() => {
  isVisible.value = y.value > props.visibilityHeight
}, 100)

// 监听 y 变化
watch(y, updateVisibility)

/**
 * 滚动到顶部
 * 平滑滚动,降级为 instant
 */
function scrollToTop() {
  // 检测是否偏好减少动画
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  window.scrollTo({
    top: 0,
    behavior: prefersReduced ? 'auto' : 'smooth',
  })
}
</script>

<style lang="scss" scoped>
.back-to-top {
  position: fixed;
  right: $space-6;
  bottom: $space-8;
  z-index: $z-back-to-top;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: $radius-pill;
  background: $grad-primary;
  color: $text-inverse;
  box-shadow: $shadow-lg;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    transform: translateY(-3px);
    box-shadow: $shadow-xl;
    background: linear-gradient(135deg, #005bac 0%, #2d7dc4 100%);
  }

  &:active {
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 3px;
  }

  // 中屏以下靠右下,避免遮挡内容
  @include respond-to(xs) {
    right: $space-4;
    bottom: $space-6;
    width: 44px;
    height: 44px;
  }
}

// 过渡动画
.backtop-fade-enter-active {
  transition:
    opacity 0.25s $ease-out-expo,
    transform 0.25s $ease-out-expo;
}
.backtop-fade-leave-active {
  transition:
    opacity 0.2s $ease-standard,
    transform 0.2s $ease-standard;
}
.backtop-fade-enter-from,
.backtop-fade-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.85);
}
</style>
