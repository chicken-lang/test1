<script setup lang="ts">
// ListCompact: 紧凑样式列表(纯标题列表,适用于智慧教室/项目指南/办事指南)
// 支持置顶标记、重要加红、日期
import type { ListItem } from '~/mock/data'

defineProps<{
  items: ListItem[]
}>()
</script>

<template>
  <div class="list-compact">
    <NuxtLink
      v-for="item in items"
      :key="item.id"
      :to="item.url"
      class="compact-item"
      :class="{ 'is-top': item.isTop }"
    >
      <span v-if="item.isTop" class="compact-mark">[置顶]</span>
      <span class="compact-title" :class="{ 'is-important': item.isImportant }">
        {{ item.title }}
      </span>
      <span class="compact-date">{{ item.publishDate }}</span>
    </NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
.list-compact {
  background: #fff;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  overflow: hidden;
}

.compact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px dashed $border-lighter;
  font-size: 14px;
  color: $text-primary;
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: $bg-hover;

    .compact-title {
      color: $primary;
    }
  }

  &.is-top {
    .compact-title {
      font-weight: 600;
    }
  }
}

.compact-mark {
  color: $danger;
  font-size: 12px;
  flex-shrink: 0;
}

.compact-title {
  flex: 1;
  min-width: 0;
  @include text-ellipsis(1);

  &.is-important {
    color: $danger;
  }
}

.compact-date {
  font-size: 12px;
  color: $text-secondary;
  flex-shrink: 0;
}

// 移动端: 隐藏日期,腾出标题空间
@include respond-to(xs) {
  .compact-item {
    padding: 10px 14px;
  }

  .compact-date {
    display: none;
  }
}

// 适老化
:global([data-color-mode='elderly']) {
  .compact-item {
    font-size: 16px;
  }
}
</style>
