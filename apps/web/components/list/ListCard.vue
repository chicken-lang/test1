<script setup lang="ts">
// ListCard v3.0: 卡片样式列表(图文并排,适用于教务管理/实践教学/教研教改)
// 应用 v3.0 设计令牌:card-hover mixin + 金色置顶装饰 + icons 字典
import type { ListItem } from '~/mock/data'
import { icons } from '~/utils/icons'

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
      <!-- 左侧金色装饰条(置顶项加粗) -->
      <span class="card-bar" aria-hidden="true" />

      <div class="card-body">
        <!-- 标签区(置顶/重要/分类) -->
        <div v-if="item.isTop || item.isImportant || item.tags?.length" class="card-tags">
          <span v-if="item.isTop" class="tag tag-top">
            <Icon :icon="icons.top" :width="12" :height="12" />置顶
          </span>
          <span v-if="item.isImportant" class="tag tag-important">重要</span>
          <span v-for="t in item.tags" :key="t" class="tag tag-default">{{ t }}</span>
        </div>

        <!-- 标题 -->
        <h3 class="card-title" :class="{ 'is-important': item.isImportant }">
          {{ item.title }}
        </h3>

        <!-- 摘要 -->
        <p class="card-summary">{{ item.summary }}</p>

        <!-- 元信息 -->
        <div class="card-meta">
          <span class="meta-item">
            <Icon :icon="icons.calendar" :width="14" :height="14" />
            {{ item.publishDate }}
          </span>
          <span class="meta-item">
            <Icon :icon="icons.document" :width="14" :height="14" />
            {{ item.source }}
          </span>
          <span class="meta-item">
            <Icon :icon="icons.eye" :width="14" :height="14" />
            {{ item.views }}
          </span>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
.list-card {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.card-item {
  position: relative;
  display: flex;
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  overflow: hidden;
  @include card-hover;

  // 置顶项:左侧装饰条加粗 + 浅金背景
  &.is-top {
    background: linear-gradient(90deg, $gold-bg 0%, $bg-card 30%);

    .card-bar {
      width: 4px;
      background: $grad-gold;
    }
  }
}

// 左侧装饰条(默认细蓝,置顶变金)
.card-bar {
  flex-shrink: 0;
  width: 3px;
  background: $grad-primary;
  transition: width $transition-base;
}

.card-body {
  flex: 1;
  min-width: 0;
  padding: $space-4 $space-5;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-2;
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

.card-title {
  font-size: $fs-lg;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0 0 $space-2;
  line-height: $lh-snug;
  @include text-ellipsis(2);
  transition: color $transition-fast;

  .card-item:hover & {
    color: $primary;
  }

  &.is-important {
    color: $danger;
  }
}

.card-summary {
  font-size: $fs-base;
  color: $text-regular;
  line-height: $lh-base;
  margin: 0 0 $space-3;
  @include text-ellipsis(2);
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
  font-size: $fs-sm;
  color: $text-secondary;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

// 移动端: 元信息换行优化
@include respond-to(xs) {
  .card-body {
    padding: $space-3 $space-4;
  }

  .card-meta {
    gap: $space-3;
  }
}
</style>
