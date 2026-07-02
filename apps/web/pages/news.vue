<script setup lang="ts">
// 新闻资讯列表页
// 左侧新闻卡片网格(2列,含图片/标题/摘要/日期/阅读量) + 右侧热门搜索词标签云
import { newsList, hotKeywords } from '~/mock/data'

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '新闻资讯' },
]

// 热门搜索词点击跳转搜索
const router = useRouter()
const onKeywordClick = (kw: string) => {
  router.push({ path: '/search', query: { q: kw } })
}

useSeoMeta({
  title: '新闻资讯 - 深圳信息职业技术大学教务处',
  description: '深圳信息职业技术大学教务处新闻资讯,展示教学动态、专业建设、教研成果等新闻',
})
</script>

<template>
  <div class="news-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:newspaper-variant-outline" />
          新闻资讯
        </h1>
        <p class="page-subtitle">News</p>
      </div>
    </div>

    <div class="container news-main">
      <!-- 左侧:新闻卡片网格 -->
      <div class="news-content">
        <div class="news-grid">
          <NuxtLink
            v-for="item in newsList"
            :key="item.id"
            :to="`/article/${item.id}`"
            class="news-card"
          >
            <div class="news-cover">
              <img :src="item.imageUrl" :alt="item.title" loading="lazy" />
            </div>
            <div class="news-body">
              <h3 class="news-title">{{ item.title }}</h3>
              <p class="news-summary">{{ item.summary }}</p>
              <div class="news-meta">
                <span class="meta-date">
                  <Icon icon="mdi:calendar-outline" width="14" height="14" />
                  {{ item.publishDate }}
                </span>
                <span class="meta-views">
                  <Icon icon="mdi:eye-outline" width="14" height="14" />
                  {{ item.views }} 阅读
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- 右侧:侧边栏(热门搜索词标签云) -->
      <aside class="news-sidebar">
        <div class="sidebar-card">
          <div class="sidebar-header">
            <Icon icon="mdi:fire" width="18" height="18" />
            <span>热门搜索</span>
          </div>
          <div class="tag-cloud">
            <button
              v-for="kw in hotKeywords"
              :key="kw"
              class="tag-item"
              @click="onKeywordClick(kw)"
            >
              <Icon icon="mdi:magnify" width="12" height="12" />
              {{ kw }}
            </button>
          </div>
        </div>

        <div class="sidebar-card">
          <div class="sidebar-header">
            <Icon icon="mdi:lightbulb-on-outline" width="18" height="18" />
            <span>温馨提示</span>
          </div>
          <p class="sidebar-tip">
            如需查阅历史新闻,请使用顶部搜索功能,支持按标题、摘要、标签检索。
          </p>
          <NuxtLink to="/search" class="sidebar-link">
            <Icon icon="mdi:arrow-right" width="14" height="14" />
            前往搜索
          </NuxtLink>
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.news-page {
  padding-bottom: 40px;
}

.page-header {
  background: $grad-primary;
  color: #fff;
  padding: $space-8 0;
  margin-bottom: $space-8;
}

.page-title {
  display: flex;
  align-items: center;
  gap: $space-3;
  font-size: $fs-4xl;
  font-weight: $fw-bold;
  margin-bottom: $space-2;
}

.page-subtitle {
  font-size: $fs-sm;
  opacity: 0.8;
  letter-spacing: 2px;
}

.news-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: $space-6;
  align-items: start;
}

.news-content {
  min-width: 0;
}

// 新闻卡片网格
.news-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-5;
}

.news-card {
  display: flex;
  flex-direction: column;
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;
  transition: all $transition-base;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-3px);

    .news-cover img {
      transform: scale(1.05);
    }

    .news-title {
      color: $primary;
    }
  }
}

.news-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: $bg-soft;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform $transition-base;
  }
}

.news-body {
  padding: $space-4 $space-5 $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  flex: 1;
}

.news-title {
  font-size: $fs-lg;
  font-weight: $fw-semibold;
  color: $text-primary;
  line-height: $lh-snug;
  @include text-ellipsis(2);
  transition: color $transition-fast;
}

.news-summary {
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: $lh-relaxed;
  @include text-ellipsis(2);
}

.news-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: $space-3;
  border-top: 1px solid $border-lighter;
  font-size: $fs-xs;
  color: $text-secondary;

  .meta-date,
  .meta-views {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
  }
}

// 侧边栏
.news-sidebar {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  position: sticky;
  top: $space-6;
}

.sidebar-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-sm;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;

  :deep(svg) {
    color: $gold;
  }
}

// 标签云
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  font-size: $fs-xs;
  color: $text-regular;
  background: $bg-soft;
  border: 1px solid $border-lighter;
  border-radius: $radius-pill;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    color: $primary;
    background: $primary-bg;
    border-color: $primary-lighter;
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

.sidebar-tip {
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: $lh-relaxed;
  margin-bottom: $space-3;
}

.sidebar-link {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-sm;
  color: $primary;
  font-weight: $fw-medium;

  &:hover {
    gap: $space-2;
  }
}

// 响应式
@include respond-to(md) {
  .news-main {
    grid-template-columns: 1fr;
  }

  .news-sidebar {
    position: static;
    order: 2;
  }
}

@include respond-to(xs) {
  .news-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: $fs-2xl;
  }
}
</style>
