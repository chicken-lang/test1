<script setup lang="ts">
// Sidebar v3.0: 列表页侧边栏(栏目导航 + 热门 + 推荐)
// 应用 v3.0 设计令牌:去蓝底标题改用金色装饰 + card-hover + icons 字典
import type { ColumnCategory, SideItem } from '~/mock/data'
import { icons } from '~/utils/icons'

defineProps<{
  columns: ColumnCategory[]
  currentSlug?: string
  hot: SideItem[]
  recommend: SideItem[]
}>()
</script>

<template>
  <aside class="sidebar">
    <!-- 栏目导航 -->
    <section class="sidebar-block">
      <h3 class="sidebar-title">
        <span class="title-bar" aria-hidden="true" />
        <Icon :icon="icons.archive" :width="16" :height="16" />
        栏目导航
      </h3>
      <ul class="sidebar-nav">
        <li v-for="col in columns" :key="col.slug">
          <NuxtLink
            :to="`/list/${col.slug}`"
            class="sidebar-nav-link"
            :class="{ active: col.slug === currentSlug }"
          >
            <Icon :icon="icons.chevronRight" :width="14" :height="14" class="nav-arrow" />
            <span>{{ col.title }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- 热门文章 -->
    <section class="sidebar-block">
      <h3 class="sidebar-title">
        <span class="title-bar" aria-hidden="true" />
        <Icon :icon="icons.hot" :width="16" :height="16" />
        热门文章
      </h3>
      <ol class="sidebar-rank">
        <li v-for="(item, idx) in hot" :key="item.id">
          <NuxtLink :to="item.url" class="rank-link">
            <span class="rank-num" :class="{ top: idx < 3 }">{{ idx + 1 }}</span>
            <span class="rank-text">{{ item.title }}</span>
          </NuxtLink>
        </li>
      </ol>
    </section>

    <!-- 推荐文章 -->
    <section class="sidebar-block">
      <h3 class="sidebar-title">
        <span class="title-bar" aria-hidden="true" />
        <Icon :icon="icons.star" :width="16" :height="16" />
        推荐文章
      </h3>
      <ul class="sidebar-list">
        <li v-for="item in recommend" :key="item.id">
          <NuxtLink :to="item.url" class="rec-link">
            <Icon :icon="icons.arrowRight" :width="14" :height="14" class="rec-arrow" />
            <span>{{ item.title }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </aside>
</template>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.sidebar-block {
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-xs;
}

// 标题:金色装饰条 + 图标(去蓝底)
.sidebar-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 0;
  padding: $space-3 $space-4;
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  background: $bg-soft;
  border-bottom: 1px solid $border-lighter;
}

.title-bar {
  width: 3px;
  height: 16px;
  background: $grad-gold;
  border-radius: $radius-pill;
}

.sidebar-nav {
  list-style: none;
  margin: 0;
  padding: $space-2 0;
}

.sidebar-nav-link {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-4;
  font-size: $fs-base;
  color: $text-regular;
  transition: all $transition-fast;
  border-left: 3px solid transparent;

  .nav-arrow {
    opacity: 0;
    color: $gold;
    transition: opacity $transition-fast;
  }

  &:hover {
    background: $primary-bg;
    color: $primary;

    .nav-arrow {
      opacity: 1;
    }
  }

  &.active {
    background: $gold-bg;
    color: $gold-dark;
    font-weight: $fw-semibold;
    border-left-color: $gold;

    .nav-arrow {
      opacity: 1;
      color: $gold;
    }
  }
}

.sidebar-rank {
  list-style: none;
  margin: 0;
  padding: $space-2 $space-4;

  li {
    padding: $space-2 0;
    border-bottom: 1px dashed $border-lighter;

    &:last-child {
      border-bottom: none;
    }
  }
}

.rank-link {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  font-size: $fs-sm;
  color: $text-regular;
  line-height: $lh-snug;

  &:hover .rank-text {
    color: $primary;
  }
}

.rank-num {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-family: $font-serif;
  font-size: $fs-xs;
  font-weight: $fw-bold;
  color: $text-secondary;
  background: $bg-page;
  border-radius: $radius-pill;

  &.top {
    color: #fff;
    background: $grad-gold;
  }
}

.rank-text {
  @include text-ellipsis(2);
}

.sidebar-list {
  list-style: none;
  margin: 0;
  padding: $space-2 0;
}

.rec-link {
  display: flex;
  align-items: flex-start;
  gap: $space-1;
  padding: $space-2 $space-4;
  font-size: $fs-sm;
  color: $text-regular;
  line-height: $lh-snug;

  .rec-arrow {
    flex-shrink: 0;
    color: $gold;
    margin-top: 2px;
  }

  span {
    @include text-ellipsis(2);
  }

  &:hover {
    background: $bg-soft;
    color: $primary;
  }
}
</style>
