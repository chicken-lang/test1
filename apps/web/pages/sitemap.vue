<script setup lang="ts">
// 站点地图页
// 按 sitemapData 分类展示链接卡片,网格布局(每行2-3个分类)
import { sitemapData } from '~/mock/data'

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '站点地图' },
]

useSeoMeta({
  title: '站点地图 - 深圳信息职业技术大学教务处',
  description: '深圳信息职业技术大学教务处网站站点地图,按分类列出全部页面入口',
})
</script>

<template>
  <div class="sitemap-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:sitemap-outline" />
          站点地图
        </h1>
        <p class="page-subtitle">Sitemap</p>
      </div>
    </div>

    <div class="container">
      <div class="sitemap-grid">
        <section
          v-for="cat in sitemapData"
          :key="cat.title"
          class="sitemap-card"
        >
          <div class="card-header">
            <Icon icon="mdi:folder-outline" width="18" height="18" />
            <h2 class="card-title">{{ cat.title }}</h2>
            <span class="card-count">{{ cat.links.length }}</span>
          </div>
          <ul class="link-list">
            <li v-for="link in cat.links" :key="link.url">
              <NuxtLink :to="link.url" class="link-item">
                <Icon icon="mdi:chevron-right" width="14" height="14" />
                <span>{{ link.title }}</span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sitemap-page {
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

.sitemap-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-5;
}

.sitemap-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-sm;
  transition: all $transition-base;
  border-top: 3px solid transparent;

  &:hover {
    box-shadow: $shadow-md;
    border-top-color: $gold;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding-bottom: $space-3;
  margin-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;

  :deep(svg) {
    color: $gold;
  }

  .card-title {
    flex: 1;
    font-size: $fs-md;
    font-weight: $fw-bold;
    color: $primary-dark;
    margin: 0;
  }

  .card-count {
    font-size: $fs-xs;
    color: $text-secondary;
    background: $bg-soft;
    padding: 2px $space-2;
    border-radius: $radius-pill;
  }
}

.link-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  li {
    margin: 0;
  }
}

.link-item {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-2;
  font-size: $fs-sm;
  color: $text-regular;
  border-radius: $radius-sm;
  transition: all $transition-fast;

  :deep(svg) {
    color: $text-placeholder;
    flex-shrink: 0;
  }

  &:hover {
    color: $primary;
    background: $primary-bg;

    :deep(svg) {
      color: $primary;
    }
  }
}

// 响应式
@include respond-to(md) {
  .sitemap-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include respond-to(xs) {
  .sitemap-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: $fs-2xl;
  }
}
</style>
