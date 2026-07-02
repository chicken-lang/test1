<script setup lang="ts">
// ListTable v3.0: 表格样式列表(标题+日期,适用于通知公告/规章制度/下载中心)
// 应用 v3.0 设计令牌:日期块金色 + 置顶浅金 + icons 字典
import type { ListItem } from '~/mock/data'
import { icons } from '~/utils/icons'

defineProps<{
  items: ListItem[]
}>()
</script>

<template>
  <div class="list-table">
    <div
      v-for="item in items"
      :key="item.id"
      class="table-item"
      :class="{ 'is-top': item.isTop }"
    >
      <!-- 日期块(左侧,金色装饰) -->
      <div class="table-date">
        <span class="date-day">{{ item.publishDate.slice(8) }}</span>
        <span class="date-month">{{ item.publishDate.slice(0, 7) }}</span>
      </div>

      <!-- 标题区 -->
      <div class="table-main">
        <div v-if="item.isTop || item.isImportant || item.tags?.length" class="table-tags">
          <span v-if="item.isTop" class="tag tag-top">
            <Icon :icon="icons.top" :width="12" :height="12" />置顶
          </span>
          <span v-if="item.isImportant" class="tag tag-important">重要</span>
          <span v-for="t in item.tags" :key="t" class="tag tag-default">{{ t }}</span>
        </div>
        <NuxtLink :to="item.url" class="table-title" :class="{ 'is-important': item.isImportant }">
          {{ item.title }}
        </NuxtLink>
      </div>

      <!-- 浏览量(右侧) -->
      <div class="table-views">
        <Icon :icon="icons.eye" :width="14" :height="14" />
        <span>{{ item.views }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-table {
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  overflow: hidden;
}

.table-item {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-3 $space-5;
  border-bottom: 1px solid $border-lighter;
  transition: all $transition-base;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: $bg-soft;

    .table-title {
      color: $primary;
    }

    .date-day {
      color: $gold-dark;
    }
  }

  // 置顶项:浅金背景 + 左侧金色边
  &.is-top {
    background: linear-gradient(90deg, $gold-bg 0%, $bg-card 40%);
    border-left: 3px solid $gold;

    .date-day {
      color: $gold-dark;
    }
  }
}

.table-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 56px;
  padding: $space-1 0;
  border-right: 1px solid $border-lighter;

  .date-day {
    font-family: $font-serif;
    font-size: $fs-2xl;
    font-weight: $fw-bold;
    color: $primary;
    line-height: $lh-tight;
    transition: color $transition-fast;
  }

  .date-month {
    font-size: $fs-xs;
    color: $text-secondary;
    margin-top: 2px;
  }
}

.table-main {
  flex: 1;
  min-width: 0;
}

.table-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
  margin-bottom: $space-1;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 $space-2;
  font-size: $fs-xs;
  font-weight: $fw-medium;
  border-radius: $radius-sm;
  line-height: 1;

  &-top {
    color: #fff;
    background: $grad-gold;
  }

  &-important {
    color: $danger;
    background: rgba(230, 57, 70, 0.08);
    border: 1px solid rgba(230, 57, 70, 0.2);
  }

  &-default {
    color: $text-secondary;
    background: $bg-soft;
    border: 1px solid $border-lighter;
  }
}

.table-title {
  display: block;
  font-size: $fs-md;
  color: $text-primary;
  line-height: $lh-base;
  @include text-ellipsis(1);
  transition: color $transition-fast;

  &.is-important {
    color: $danger;
    font-weight: $fw-semibold;
  }
}

.table-views {
  display: flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-sm;
  color: $text-secondary;
  flex-shrink: 0;
}

// 移动端: 隐藏浏览量,日期块缩小
@include respond-to(xs) {
  .table-item {
    gap: $space-3;
    padding: $space-3 $space-4;
  }

  .table-date {
    min-width: 44px;

    .date-day {
      font-size: $fs-lg;
    }
  }

  .table-views {
    display: none;
  }
}
</style>
