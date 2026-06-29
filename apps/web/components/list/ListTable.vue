<script setup lang="ts">
// ListTable: 表格样式列表(标题+日期,适用于通知公告/规章制度/下载中心)
// 支持置顶标记、重要加红、标签、日期、浏览量
import type { ListItem } from '~/mock/data'

defineProps<{
  items: ListItem[]
}>()
</script>

<template>
  <div class="list-table">
    <div v-for="item in items" :key="item.id" class="table-item" :class="{ 'is-top': item.isTop }">
      <!-- 日期块(左侧) -->
      <div class="table-date">
        <span class="date-day">{{ item.publishDate.slice(8) }}</span>
        <span class="date-month">{{ item.publishDate.slice(0, 7) }}</span>
      </div>
      <!-- 标题区 -->
      <div class="table-main">
        <div class="table-tags">
          <el-tag v-if="item.isTop" type="danger" size="small" effect="dark">置顶</el-tag>
          <el-tag v-if="item.isImportant" type="danger" size="small" effect="plain">重要</el-tag>
          <el-tag v-for="t in item.tags" :key="t" size="small" type="info" effect="plain">{{
            t
          }}</el-tag>
        </div>
        <NuxtLink :to="item.url" class="table-title" :class="{ 'is-important': item.isImportant }">
          {{ item.title }}
        </NuxtLink>
      </div>
      <!-- 浏览量(右侧) -->
      <div class="table-views">
        <Icon icon="mdi:eye" />
        <span>{{ item.views }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-table {
  background: #fff;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  overflow: hidden;
}

.table-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid $border-lighter;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: $bg-hover;

    .table-title {
      color: $primary;
    }
  }

  &.is-top {
    background: #fff7f7;

    .table-date {
      .date-day,
      .date-month {
        color: $danger;
      }
    }
  }
}

.table-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 56px;
  padding: 4px 0;
  border-right: 1px solid $border-lighter;

  .date-day {
    font-size: 20px;
    font-weight: 700;
    color: $primary;
    line-height: 1.2;
  }

  .date-month {
    font-size: 12px;
    color: $text-secondary;
  }
}

.table-main {
  flex: 1;
  min-width: 0;
}

.table-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.table-title {
  display: block;
  font-size: 15px;
  color: $text-primary;
  line-height: 1.6;
  @include text-ellipsis(1);

  &.is-important {
    color: $danger;
    font-weight: 600;
  }
}

.table-views {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: $text-secondary;
  flex-shrink: 0;
}

// 移动端: 隐藏浏览量,日期块缩小
@include respond-to(xs) {
  .table-item {
    gap: 10px;
    padding: 12px 14px;
  }

  .table-date {
    min-width: 44px;

    .date-day {
      font-size: 16px;
    }
  }

  .table-views {
    display: none;
  }
}

// 适老化
:global([data-color-mode='elderly']) {
  .table-title {
    font-size: 17px;
  }
}
</style>
