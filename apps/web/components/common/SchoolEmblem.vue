<template>
  <!-- 校徽组件:使用学校官方 PNG 资源,严格遵守 VI 手册规范 -->
  <!-- VI 第 3 页:最小尺寸 ≥ 10mm(约 38px@96dpi),项目最低 32px -->
  <!-- VI 第 4 页:安全空间 = 2X(X = 直径/15),由父容器 padding 控制 -->
  <!-- variant: horizontal(横版带校名)/ square(方形纯校徽) -->
  <!-- color: blue(白底用)/ white(深底用) -->
  <!-- mono: 向后兼容,等价于 color="white" -->
  <NuxtImg
    :src="logoSrc"
    :width="computedWidth"
    :height="computedHeight"
    :alt="alt"
    class="school-emblem"
    :class="`school-emblem--${variant} school-emblem--${resolvedColor}`"
    role="img"
    :aria-label="alt"
    decoding="async"
    format="webp"
    :modifiers="{ round: false }"
    loading="eager"
  />
</template>

<script setup lang="ts">
// 校徽组件:废弃 v3.0 自绘盾形 SVG,改用学校官方 PNG 资源
// 依据:VI 手册第 3-6 页 + docs/前端优化方案-VI规范化-v5.md §4.1
import { computed } from 'vue'

interface Props {
  variant?: 'horizontal' | 'square'
  color?: 'blue' | 'white'
  size?: number // 方形时为边长,横版时为高度
  alt?: string
  mono?: boolean // 向后兼容旧调用,等价于 color="white"
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'horizontal',
  color: 'blue',
  size: 56,
  alt: '深圳信息职业技术大学校徽',
  mono: false,
})

// 横版原始比例 4203:850 ≈ 4.95:1,方形原始比例 1:1
const computedWidth = computed(() =>
  props.variant === 'horizontal' ? Math.round(props.size * 4.95) : props.size,
)
const computedHeight = computed(() => props.size)

// 兼容旧 mono prop:mono=true 时使用白色版本(深底场景)
const resolvedColor = computed<'blue' | 'white'>(() =>
  props.mono || props.color === 'white' ? 'white' : 'blue',
)

const logoSrc = computed(() => {
  const colorStr = resolvedColor.value
  const variantStr = props.variant === 'horizontal' ? 'horizontal' : 'square'
  return `/images/logo/logo-${variantStr}-${colorStr}.png`
})
</script>

<style lang="scss" scoped>
.school-emblem {
  display: block;
  flex-shrink: 0;
  // 保证图片本身不变形
  object-fit: contain;
  // VI 第 4 页安全空间规范:四周留出直径/15 的安全边距
  // 实际使用时由父容器 padding 控制
}
</style>
