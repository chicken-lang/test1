<template>
  <!-- 空状态组件:无数据/无结果/出错的统一展示 -->
  <div class="empty-state" role="status" :aria-live="'polite'">
    <!-- 图标 -->
    <div class="empty-state__icon" :class="`empty-state__icon--${variant}`">
      <Icon :icon="iconName" :width="64" :height="64" />
    </div>

    <!-- 标题 -->
    <h3 v-if="title" class="empty-state__title">{{ title }}</h3>

    <!-- 描述 -->
    <p v-if="description" class="empty-state__desc">{{ description }}</p>

    <!-- 操作区(插槽:按钮等) -->
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 空状态组件:统一无数据展示
// variant: 视觉变体(empty/notFound/error),影响图标与配色
// title/description: 主副文案
// action 插槽:操作按钮
import { icons } from '~/utils/icons'

const props = withDefaults(
  defineProps<{
    variant?: 'empty' | 'notFound' | 'error' | 'search'
    title?: string
    description?: string
    icon?: string
  }>(),
  {
    variant: 'empty',
    title: '暂无数据',
    description: '',
    icon: '',
  },
)

// 根据 variant 选择默认图标
const iconName = computed(() => {
  if (props.icon) return props.icon
  const map: Record<string, string> = {
    empty: icons.empty,
    notFound: icons.notFound,
    error: icons.error,
    search: icons.search,
  }
  return map[props.variant] || icons.empty
})
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-16 $space-6;
  text-align: center;

  &__icon {
    width: 96px;
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    margin-bottom: $space-5;
    color: $text-placeholder;
    background: $bg-soft;
    transition: all $transition-base;

    // 变体配色
    &--empty {
      color: $text-placeholder;
    }
    &--notFound {
      color: $primary-lighter;
      background: $primary-bg;
    }
    &--error {
      color: $danger;
      background: rgba(230, 57, 70, 0.08);
    }
    &--search {
      color: $gold;
      background: $gold-bg;
    }
  }

  &__title {
    font-size: $fs-xl;
    font-weight: $fw-semibold;
    color: $text-primary;
    margin-bottom: $space-2;
  }

  &__desc {
    font-size: $fs-base;
    color: $text-secondary;
    max-width: 360px;
    line-height: $lh-base;
    margin-bottom: $space-5;
  }

  &__action {
    margin-top: $space-2;
  }
}
</style>
