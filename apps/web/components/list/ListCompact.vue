<script setup lang="ts">
// ListCompact v3.0: 紧凑样式列表(纯标题列表,适用于智慧教室/项目指南/办事指南)
// 应用 v3.0 设计令牌:金色置顶徽章 + 序号装饰 + icons 字典
import type { ListItem } from '~/mock/data'
import { icons } from '~/utils/icons'

defineProps<{
  items: ListItem[]
}>()
</script>

<template>
  <div class="list-compact">
    <NuxtLink
      v-for="(item, idx) in items"
      :key="item.id"
      :to="item.url"
      class="compact-item"
      :class="{ 'is-top': item.isTop }"
    >
      <!-- 序号(衬线字,置顶变金) -->
      <span class="compact-num" :class="{ 'is-top': item.isTop }">{{ idx + 1 }}</span>

      <!-- 置顶徽章 -->
      <span v-if="item.isTop" class="compact-badge">
        <Icon :icon="icons.top" :width="10" :height="10" />置顶
      </span>

      <!-- 标题 -->
      <span class="compact-title" :class="{ 'is-important': item.isImportant }">
        {{ item.title }}
      </span>

      <!-- 日期 -->
      <span class="compact-date">{{ item.publishDate }}</span>
    </NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
.list-compact {
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  overflow: hidden;
}

.compact-item {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-5;
  border-bottom: 1px dashed $border-lighter;
  font-size: $fs-base;
  color: $text-primary;
  transition: all $transition-base;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: $bg-soft;
    padding-left: $space-6;

    .compact-title {
      color: $primary;
    }

    .compact-num {
      color: $gold-dark;
    }
  }

  // 置顶项:浅金背景
  &.is-top {
    background: linear-gradient(90deg, $gold-bg 0%, $bg-card 30%);

    .compact-title {
      font-weight: $fw-semibold;
    }
  }
}

// 序号(衬线字,默认灰,置顶/hover 变金)
.compact-num {
  flex-shrink: 0;
  width: 24px;
  font-family: $font-serif;
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-placeholder;
  text-align: center;
  transition: color $transition-fast;

  &.is-top {
    color: $gold;
  }
}

.compact-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 18px;
  padding: 0 $space-1;
  font-size: $fs-xs;
  font-weight: $fw-medium;
  color: #fff;
  background: $grad-gold;
  border-radius: $radius-sm;
  line-height: 1;
}

.compact-title {
  flex: 1;
  min-width: 0;
  @include text-ellipsis(1);
  transition: color $transition-fast;

  &.is-important {
    color: $danger;
  }
}

.compact-date {
  flex-shrink: 0;
  font-size: $fs-xs;
  color: $text-secondary;
  font-variant-numeric: tabular-nums;
}

// 移动端: 隐藏日期,腾出标题空间
@include respond-to(xs) {
  .compact-item {
    padding: $space-3 $space-4;
  }

  .compact-date {
    display: none;
  }
}
</style>
