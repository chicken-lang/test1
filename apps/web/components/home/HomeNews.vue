<template>
  <section class="home-news">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-bar"></span>
        新闻资讯
      </h2>
      <NuxtLink to="/news" class="section-more">更多 &gt;</NuxtLink>
    </div>

    <div class="news-grid">
      <!-- 左侧大图新闻 -->
      <NuxtLink :to="`/article/${newsList[0].id}`" class="news-feature">
        <img :src="newsList[0].imageUrl" :alt="newsList[0].title" class="feature-img" />
        <div class="feature-info">
          <h3 class="feature-title">{{ newsList[0].title }}</h3>
          <p class="feature-summary">{{ newsList[0].summary }}</p>
          <span class="feature-date">{{ newsList[0].publishDate }}</span>
        </div>
      </NuxtLink>

      <!-- 右侧新闻列表 -->
      <ul class="news-list">
        <li v-for="item in newsList.slice(1)" :key="item.id" class="news-item">
          <NuxtLink :to="`/article/${item.id}`" class="news-link">
            <img :src="item.imageUrl" :alt="item.title" class="news-thumb" />
            <div class="news-info">
              <h4 class="news-title">{{ item.title }}</h4>
              <p class="news-summary">{{ item.summary }}</p>
              <span class="news-date">{{ item.publishDate }}</span>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
// 首页新闻资讯(FR-01.04: 图+标题+摘要+日期,3-4 条)
import { newsList } from '~/mock/data'
</script>

<style lang="scss" scoped>
.home-news {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: $text-primary;
}

.title-bar {
  display: inline-block;
  width: 4px;
  height: 20px;
  background: $primary;
  border-radius: 2px;
}

.section-more {
  font-size: 14px;
  color: $text-secondary;

  &:hover {
    color: $primary;
  }
}

.news-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.news-feature {
  display: block;
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 91, 172, 0.15);
  }
}

.feature-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.feature-info {
  padding: 16px;
}

.feature-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
  @include text-ellipsis(1);
  color: $text-primary;
}

.feature-summary {
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 8px;
  @include text-ellipsis(2);
}

.feature-date {
  font-size: 13px;
  color: $text-placeholder;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.news-item {
  background: $bg-card;
  border-radius: $radius-base;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 91, 172, 0.1);
  }
}

.news-link {
  display: flex;
  gap: 12px;
  padding: 10px;
}

.news-thumb {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: $radius-base;
  flex-shrink: 0;
}

.news-info {
  flex: 1;
  min-width: 0;
}

.news-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
  @include text-ellipsis(1);
}

.news-summary {
  font-size: 13px;
  color: $text-secondary;
  @include text-ellipsis(2);
  margin-bottom: 4px;
}

.news-date {
  font-size: 12px;
  color: $text-placeholder;
}

@include respond-to(xs) {
  .news-grid {
    grid-template-columns: 1fr;
  }

  .news-thumb {
    width: 90px;
    height: 60px;
  }
}
</style>
