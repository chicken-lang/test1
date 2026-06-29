<script setup lang="ts">
// ListCard: 卡片样式列表(图文并排,适用于教务管理/实践教学/教研教改等)
// 支持置顶标记、重要加红、标签、日期、浏览量
import type { ListItem } from '~/mock/data'

defineProps<{
  items: ListItem[]
}>()
</script>

<template>
  <div class="list-card">
    <NuxtLink
      v-for="item in items"
      :key="item.id"
      :to="item.url"
      class="card-item"
      :class="{ 'is-top': item.isTop }"
    >
      <!-- 置顶/重要标识 -->
      <div class="card-tags">
        <el-tag v-if="item.isTop" type="danger" size="small" effect="dark">置顶</el-tag>
        <el-tag v-if="item.isImportant" type="danger" size="small" effect="plain">重要</el-tag>
        <el-tag v-for="t in item.tags" :key="t" size="small" type="info" effect="plain">{{
          t
        }}</el-tag>
      </div>
      <!-- 标题(重要项加红) -->
      <h3 class="card-title" :class="{ 'is-important': item.isImportant }">
        {{ item.title }}
      </h3>
      <!-- 摘要 -->
      <p class="card-summary">{{ item.summary }}</p>
      <!-- 元信息 -->
      <div class="card-meta">
        <span><Icon icon="mdi:calendar" />{{ item.publishDate }}</span>
        <span><Icon icon="mdi:source-branch" />{{ item.source }}</span>
        <span><Icon icon="mdi:eye" />{{ item.views }}</span>
      </div>
    </NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
.list-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-item {
  display: block;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    border-color: $primary;
    box-shadow: 0 2px 12px rgba(0, 91, 172, 0.1);
    transform: translateY(-1px);

    .card-title {
      color: $primary;
    }
  }

  &.is-top {
    border-left: 3px solid $danger;
  }
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
  line-height: 1.5;
  @include text-ellipsis(2);

  &.is-important {
    color: $danger;
  }
}

.card-summary {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px;
  @include text-ellipsis(2);
}

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

// 适老化: 字号增大、对比度增强
:global([data-color-mode='elderly']) {
  .card-title {
    font-size: 18px;
  }

  .card-summary {
    font-size: 16px;
  }
}
</style>
