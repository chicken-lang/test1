<script setup lang="ts">
// ListCard v3.0: 卡片样式列表(图文并排,适用于教务管理/实践教学/教研教改)
// 应用 v3.0 设计令牌:card-hover mixin + VI 主色置顶装饰 + icons 字典
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
  <div class="list-card">
    <NuxtLink
      v-for="item in items"
      :key="item.id"
      :to="item.url"
      class="card-item"
      :class="{ 'is-top': item.isTop }"
    >
      <!-- 左侧 VI 主色装饰条(置顶项加粗) -->
      <span class="card-bar" aria-hidden="true" />

      <div class="card-body">
        <!-- 标签区(新/置顶/重要/分类) -->
        <div v-if="isNew(item.publishDate) || item.isTop || item.isImportant || item.tags?.length" class="card-tags">
          <span v-if="isNew(item.publishDate)" class="tag tag-new">新</span>
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

  // 置顶项:左侧装饰条加粗 + 浅蓝背景(VI 合规:纯色,无渐变)
  &.is-top {
    background: $primary-bg;

    .card-bar {
      width: 4px;
      background: $primary;
    }
  }
}

// 左侧装饰条(默认细蓝,置顶加粗变 VI 主色)
.card-bar {
  flex-shrink: 0;
  width: 3px;
  background: $primary;
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
    background: $primary;
  }

  &-important {
    color: $danger;
    background: rgba(230, 57, 70, 0.08);
    border: 1px solid rgba(230, 57, 70, 0.2);
  }

  &-new {
    color: #fff;
    background: $danger;
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
