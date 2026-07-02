<template>
  <section
    v-reveal
    class="home-news reveal"
    aria-labelledby="news-title"
  >
    <!-- 区块标题(中英文对照) -->
    <div class="section-header">
      <div class="section-title-group">
        <span id="news-title" class="title-cn">新闻资讯</span>
        <span class="title-en">News</span>
      </div>
      <NuxtLink to="/news" class="section-more" aria-label="查看更多新闻资讯">
        更多
        <Icon :icon="icons.arrowRight" :width="14" :height="14" />
      </NuxtLink>
    </div>

    <!-- 防御性数据:有内容时展示,空数据时显示 EmptyState -->
    <div v-if="hasNews" class="news-grid">
      <!-- 左侧:特色大图新闻 -->
      <NuxtLink
        v-if="featured"
        :to="`/article/${featured.id}`"
        class="news-feature"
        :aria-label="`头条新闻:${featured.title}`"
      >
        <div class="feature-media">
          <img
            :src="featured.imageUrl"
            :alt="featured.title"
            class="feature-img"
            loading="lazy"
            decoding="async"
          />
          <div class="feature-overlay"></div>
          <span class="feature-category">
            <Icon :icon="icons.hot" :width="12" :height="12" />
            头条
          </span>
        </div>
        <div class="feature-body">
          <h3 class="feature-title">{{ featured.title }}</h3>
          <p class="feature-summary">{{ featured.summary }}</p>
          <div class="feature-meta">
            <span class="meta-date">
              <Icon :icon="icons.calendar" :width="13" :height="13" />
              {{ featured.publishDate }}
            </span>
            <span class="meta-views">
              <Icon :icon="icons.eye" :width="13" :height="13" />
              {{ featured.views }} 阅读
            </span>
          </div>
        </div>
      </NuxtLink>

      <!-- 右侧:次要新闻列表 -->
      <ul v-if="rest.length" class="news-side">
        <li v-for="(item, idx) in rest" :key="item.id" class="side-item">
          <NuxtLink :to="`/article/${item.id}`" class="side-link">
            <span class="side-index">{{ String(idx + 1).padStart(2, '0') }}</span>
            <div class="side-media">
              <img
                :src="item.imageUrl"
                :alt="item.title"
                class="side-img"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="side-body">
              <h4 class="side-title">{{ item.title }}</h4>
              <p class="side-summary">{{ item.summary }}</p>
              <div class="side-meta">
                <span>{{ item.publishDate }}</span>
                <span class="dot">·</span>
                <span>{{ item.views }} 阅读</span>
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- 空数据防御:显示 EmptyState -->
    <div v-else class="news-empty">
      <EmptyState
        variant="empty"
        title="暂无新闻资讯"
        description="新闻资讯加载中,请稍后访问"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
// HomeNews v3.0: 防御性数据 + icons 字典 + v-reveal 入场 + EmptyState 兜底
import { newsList } from '~/mock/data'
import { icons } from '~/utils/icons'

// 防御性数据:mock 数据可能为空数组,需兜底处理
const hasNews = computed(() => newsList.length > 0)
// 取第一条作为头条,其余作为侧栏
const featured = computed(() => newsList[0])
const rest = computed(() => newsList.slice(1, 4))
</script>

<style lang="scss" scoped>
.home-news {
  margin-bottom: $space-10;
}

.news-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: $space-6;
}

// 左侧特色新闻
.news-feature {
  display: flex;
  flex-direction: column;
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;
  transition: all $transition-base;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-2px);

    .feature-img {
      transform: scale(1.06);
    }

    .feature-title {
      color: $primary;
    }
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

.feature-media {
  position: relative;
  width: 100%;
  height: 260px;
  overflow: hidden;
}

.feature-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(0, 42, 82, 0.55) 100%);
}

.feature-category {
  position: absolute;
  top: $space-4;
  left: $space-4;
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  background: $grad-gold;
  border-radius: $radius-pill;
  font-size: $fs-xs;
  font-weight: $fw-semibold;
  color: #fff;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(184, 149, 106, 0.4);

  :deep(svg) {
    color: #fff;
  }
}

.feature-body {
  padding: $space-5 $space-6 $space-6;
}

.feature-title {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  line-height: $lh-snug;
  color: $text-primary;
  margin-bottom: $space-3;
  @include text-ellipsis(2);
  transition: color $transition-fast;
}

.feature-summary {
  font-size: $fs-sm;
  line-height: $lh-relaxed;
  color: $text-secondary;
  margin-bottom: $space-4;
  @include text-ellipsis(2);
}

.feature-meta {
  display: flex;
  align-items: center;
  gap: $space-5;
  padding-top: $space-3;
  border-top: 1px solid $border-lighter;
  font-size: $fs-xs;
  color: $text-placeholder;

  span {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
  }

  :deep(svg) {
    color: $gold;
  }
}

// 右侧次要新闻列表
.news-side {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.side-item {
  flex: 1;
  background: $bg-card;
  border-radius: $radius-base;
  overflow: hidden;
  box-shadow: $shadow-xs;
  transition: all $transition-base;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateX(2px);

    .side-img {
      transform: scale(1.05);
    }

    .side-title {
      color: $primary;
    }

    .side-index {
      color: $gold;
    }
  }
}

.side-link {
  display: flex;
  align-items: stretch;
  height: 100%;

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

.side-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  flex-shrink: 0;
  font-family: $font-serif;
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $border-base;
  background: $bg-soft;
  transition: all $transition-base;
}

.side-media {
  width: 110px;
  flex-shrink: 0;
  overflow: hidden;
}

.side-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.side-body {
  flex: 1;
  min-width: 0;
  padding: $space-3 $space-4;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.side-title {
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: $text-primary;
  line-height: $lh-snug;
  margin-bottom: $space-2;
  @include text-ellipsis(1);
  transition: color $transition-fast;
}

.side-summary {
  font-size: $fs-xs;
  color: $text-secondary;
  line-height: $lh-base;
  margin-bottom: $space-2;
  @include text-ellipsis(1);
}

.side-meta {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-xs;
  color: $text-placeholder;

  .dot {
    color: $border-base;
  }
}

// 空状态
.news-empty {
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1px solid $border-lighter;
}

// 移动端
@include respond-to(xs) {
  .news-grid {
    grid-template-columns: 1fr;
    gap: $space-4;
  }

  .feature-media {
    height: 200px;
  }

  .feature-title {
    font-size: $fs-lg;
  }

  .side-media {
    width: 90px;
  }

  .side-index {
    width: 28px;
    font-size: $fs-md;
  }
}
</style>
