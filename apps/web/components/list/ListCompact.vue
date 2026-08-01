<script setup lang="ts">
// ListCompact v3.0: 紧凑样式列表(纯标题列表,适用于智慧教室/项目指南/办事指南)
// 应用 v3.0 设计令牌:VI 主色置顶徽章 + 序号装饰 + icons 字典
// 数据通过 props 注入(由父级 list/[slug].vue 通过 useApi 获取后传入)
import { icons } from '~/utils/icons'

// 列表项类型(与后端 /api/list/:slug 响应字段对齐)
interface ListItem {
  id: number
  title: string
  summary: string
  publishDate: string
  source: string
  views: number
  tags: string[]
  columnSlug: string
  columnTitle: string
  isTop: boolean
  isImportant: boolean
  hasAttachment: boolean
  url: string
}

defineProps<{
  items: ListItem[]
}>()

// "新"标识:发布日期在 7 天内(固定基准日 2026-07-27,避免 SSR/CSR 不一致)
const NEW_THRESHOLD = '2026-07-20'
const isNew = (date: string) => date >= NEW_THRESHOLD
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
      <!-- 序号(衬线字,置顶变 VI 主色) -->
      <span class="compact-num" :class="{ 'is-top': item.isTop }">{{ idx + 1 }}</span>

      <!-- 新标识 -->
      <span v-if="isNew(item.publishDate)" class="compact-badge compact-badge--new">新</span>

      <!-- 置顶徽章 -->
      <span v-if="item.isTop" class="compact-badge">
        <Icon :icon="icons.top" :width="10" :height="10" />置顶
      </span>

      <!-- 标题 -->
      <span class="compact-title" :class="{ 'is-important': item.isImportant }">
        {{ item.title }}
      </span>

      <!-- 来源业务(需求 5.2 列表页模板要求) -->
      <span class="compact-source">{{ item.source }}</span>

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
      color: $primary-dark;
    }
  }

  // 置顶项:浅蓝背景(VI 合规:纯色,无渐变)
  &.is-top {
    background: $primary-bg;

    .compact-title {
      font-weight: $fw-semibold;
    }
  }
}

// 序号(衬线字,默认灰,置顶/hover 变 VI 主色)
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
    color: $primary;
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
  background: $primary;
  border-radius: $radius-sm;
  line-height: 1;

  &--new {
    background: $danger;
  }
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

// 来源业务(需求 5.2 列表页模板要求)
.compact-source {
  flex-shrink: 0;
  font-size: $fs-xs;
  color: $text-secondary;
}

.compact-date {
  flex-shrink: 0;
  font-size: $fs-xs;
  color: $text-secondary;
  font-variant-numeric: tabular-nums;
}

// 移动端: 隐藏日期和来源,腾出标题空间
@include respond-to(xs) {
  .compact-item {
    padding: $space-3 $space-4;
  }

  .compact-source,
  .compact-date {
    display: none;
  }
}
</style>
