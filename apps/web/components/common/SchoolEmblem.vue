<template>
  <!-- 校徽组件:盾形 + 书本 + 金色装饰,SVG 矢量自适应 -->
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="['school-emblem', { 'school-emblem--mono': mono }]"
    role="img"
    aria-label="深圳信息职业技术大学教务处校徽"
  >
    <!-- 盾形外框(深信院蓝渐变) -->
    <defs>
      <linearGradient :id="`emblem-shield-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="mono ? 'currentColor' : '#003d73'" />
        <stop offset="100%" :stop-color="mono ? 'currentColor' : '#005bac'" />
      </linearGradient>
      <linearGradient :id="`emblem-gold-${uid}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" :stop-color="mono ? 'currentColor' : '#b8956a'" />
        <stop offset="100%" :stop-color="mono ? 'currentColor' : '#d4b88a'" />
      </linearGradient>
    </defs>

    <!-- 盾形主体 -->
    <path
      d="M32 4 L56 12 V32 C56 46 46 56 32 60 C18 56 8 46 8 32 V12 Z"
      :fill="`url(#emblem-shield-${uid})`"
    />
    <!-- 盾形金色描边 -->
    <path
      d="M32 4 L56 12 V32 C56 46 46 56 32 60 C18 56 8 46 8 32 V12 Z"
      stroke="none"
      :fill="`url(#emblem-gold-${uid})`"
      opacity="0.9"
      style="transform: scale(0.96); transform-origin: center"
    />
    <path
      d="M32 4 L56 12 V32 C56 46 46 56 32 60 C18 56 8 46 8 32 V12 Z"
      :fill="`url(#emblem-shield-${uid})`"
      style="transform: scale(0.92); transform-origin: center"
    />

    <!-- 上部:金色星辉(学术之光) -->
    <path
      d="M32 14 L33.5 18 L37.5 18.5 L34.5 21 L35.5 25 L32 22.8 L28.5 25 L29.5 21 L26.5 18.5 L30.5 18 Z"
      :fill="`url(#emblem-gold-${uid})`"
    />

    <!-- 中部:翻开的书本(知识) -->
    <g :fill="`url(#emblem-gold-${uid})`">
      <!-- 左页 -->
      <path
        d="M18 32 C22 30 26 30 31 31 V42 C26 41 22 41 18 43 Z"
        opacity="0.95"
      />
      <!-- 右页 -->
      <path
        d="M46 32 C42 30 38 30 33 31 V42 C38 41 42 41 46 43 Z"
        opacity="0.95"
      />
      <!-- 书脊 -->
      <rect x="31.4" y="31" width="1.2" height="11" :fill="`url(#emblem-gold-${uid})`" />
      <!-- 书页文字线 -->
      <line x1="21" y1="34.5" x2="28" y2="34" stroke="#fff" stroke-width="0.6" opacity="0.7" />
      <line x1="21" y1="36.5" x2="28" y2="36" stroke="#fff" stroke-width="0.6" opacity="0.7" />
      <line x1="36" y1="34" x2="43" y2="34.5" stroke="#fff" stroke-width="0.6" opacity="0.7" />
      <line x1="36" y1="36" x2="43" y2="36.5" stroke="#fff" stroke-width="0.6" opacity="0.7" />
    </g>

    <!-- 下部:金色装饰横纹(传统学术绶带意象) -->
    <rect x="20" y="46" width="24" height="1.5" :fill="`url(#emblem-gold-${uid})`" opacity="0.85" />
    <rect x="23" y="49" width="18" height="1" :fill="`url(#emblem-gold-${uid})`" opacity="0.7" />
  </svg>
</template>

<script setup lang="ts">
// 校徽组件:盾形 + 书本 + 金色星辉,纯 SVG 矢量
// size: 尺寸(支持数字或字符串)
// mono: 单色模式(使用 currentColor,适合白色/暗色背景)
import { useId } from '#app'

withDefaults(
  defineProps<{
    size?: number | string
    mono?: boolean
  }>(),
  {
    size: 40,
    mono: false,
  },
)

// 唯一 ID,避免多实例渐变冲突(SSR 安全)
const uid = useId()
</script>

<style lang="scss" scoped>
.school-emblem {
  display: block;
  flex-shrink: 0;

  &--mono {
    color: $primary;
  }
}
</style>
