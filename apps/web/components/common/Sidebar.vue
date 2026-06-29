<script setup lang="ts">
// Sidebar: 列表页侧边栏(栏目导航 + 热门 + 推荐)
// props.columns: 同级栏目导航(高亮当前)
// props.currentSlug: 当前栏目 slug
// props.hot/recommend: 热门/推荐文章列表
import type { ColumnCategory, SideItem } from '~/mock/data'

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
        <Icon icon="mdi:folder-outline" />
        栏目导航
      </h3>
      <ul class="sidebar-nav">
        <li v-for="col in columns" :key="col.slug">
          <NuxtLink
            :to="`/list/${col.slug}`"
            class="sidebar-nav-link"
            :class="{ active: col.slug === currentSlug }"
          >
            <Icon icon="mdi:chevron-right" />
            {{ col.title }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- 热门文章 -->
    <section class="sidebar-block">
      <h3 class="sidebar-title">
        <Icon icon="mdi:fire" />
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
        <Icon icon="mdi:star-outline" />
        推荐文章
      </h3>
      <ul class="sidebar-list">
        <li v-for="item in recommend" :key="item.id">
          <NuxtLink :to="item.url" class="rec-link">
            <Icon icon="mdi:arrow-right-bold" />
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
  gap: 16px;
}

.sidebar-block {
  background: #fff;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  overflow: hidden;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: $primary;
}

.sidebar-nav {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}

.sidebar-nav-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 14px;
  color: $text-regular;
  transition: all 0.2s;

  :deep(svg) {
    font-size: 12px;
    opacity: 0.6;
  }

  &:hover {
    background: $primary-bg;
    color: $primary;
  }

  &.active {
    background: $primary-bg;
    color: $primary;
    font-weight: 600;
    border-left: 3px solid $primary;
  }
}

.sidebar-rank {
  list-style: none;
  margin: 0;
  padding: 8px 16px;
  counter-reset: none;

  li {
    padding: 6px 0;
    border-bottom: 1px dashed $border-lighter;

    &:last-child {
      border-bottom: none;
    }
  }
}

.rank-link {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: $text-regular;
  line-height: 1.5;

  &:hover .rank-text {
    color: $primary;
  }
}

.rank-num {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: $text-secondary;
  background: $bg-page;
  border-radius: 50%;

  &.top {
    color: #fff;
    background: $danger;
  }
}

.rank-text {
  @include text-ellipsis(2);
}

.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}

.rec-link {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 6px 16px;
  font-size: 13px;
  color: $text-regular;
  line-height: 1.5;

  :deep(svg) {
    flex-shrink: 0;
    color: $primary;
    margin-top: 2px;
  }

  span {
    @include text-ellipsis(2);
  }

  &:hover {
    background: $bg-hover;
    color: $primary;
  }
}

// 适老化
:global([data-color-mode='elderly']) {
  .sidebar-title {
    font-size: 16px;
  }

  .sidebar-nav-link,
  .rank-link,
  .rec-link {
    font-size: 15px;
  }
}
</style>
