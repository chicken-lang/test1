<script setup lang="ts">
// 专题页模板(需求 5.2:版式灵活,支持自定义模块组合,可快速上下线)
// URL: /topic/[slug]
// 不在顶部导航设独立入口,仅通过首页专题推荐跳转
// 模块类型:banner(横幅)/ highlights(亮点卡片)/ timeline(大事记)/ articles(文章列表)/ links(相关链接)/ richtext(富文本)
// 由后台发布/下线(status 字段),模块组合由后端返回的 modules 数组决定
import { icons } from '~/utils/icons'

interface TopicArticle {
  id: number
  title: string
  publishDate: string
  source: string
  url: string
  summary: string
}

interface TopicModule {
  id: number
  type: 'banner' | 'articles' | 'timeline' | 'highlights' | 'links' | 'richtext'
  title?: string
  banner?: { description: string }
  articles?: TopicArticle[]
  timeline?: { date: string; title: string; desc: string }[]
  highlights?: { title: string; desc: string; icon: string }[]
  links?: { title: string; url: string }[]
  content?: string
}

interface Topic {
  slug: string
  title: string
  subtitle: string
  description: string
  status: 'online' | 'offline'
  publishDate: string
  modules: TopicModule[]
}

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// SSR 预取专题详情
const { data: topicData } = await useAsyncData(
  () => `topic-${slug.value}`,
  () => $fetch<{ code: number; data: Topic }>(`/api/topic/${slug.value}`).then((res) => res.data),
  { watch: [slug] },
)

const topic = computed(() => topicData.value ?? null)

if (!topic.value) {
  throw createError({ statusCode: 404, statusMessage: '专题不存在或已下线', fatal: true })
}

// 面包屑
const breadcrumbItems = computed(() => [
  { title: '首页', to: '/' },
  { title: '专题推荐' },
  { title: topic.value!.title },
])

useSeoMeta({
  title: () => `${topic.value!.title} - 专题 - 深圳信息职业技术大学教务处`,
  description: () => topic.value!.description,
})
</script>

<template>
  <div class="topic-page">
    <!-- 面包屑 -->
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 专题头部(深色背景 + 装饰) -->
    <div class="topic-header">
      <div class="container topic-header-inner">
        <div class="header-content">
          <span class="header-label">专题</span>
          <h1 class="topic-title">{{ topic!.title }}</h1>
          <p class="topic-subtitle">{{ topic!.subtitle }}</p>
          <p class="topic-desc">{{ topic!.description }}</p>
          <span class="topic-date">发布日期:{{ topic!.publishDate }}</span>
        </div>
        <span class="header-deco" aria-hidden="true" />
      </div>
    </div>

    <!-- 模块渲染区:按 modules 数组顺序渲染,每种 type 对应一种版式 -->
    <div class="container topic-body">
      <template v-for="module in topic!.modules" :key="module.id">
        <!-- banner 横幅模块 -->
        <section v-if="module.type === 'banner'" class="topic-module module-banner" v-reveal>
          <p class="banner-text">{{ module.banner?.description }}</p>
        </section>

        <!-- highlights 亮点卡片模块 -->
        <section v-else-if="module.type === 'highlights'" class="topic-module" v-reveal>
          <h2 v-if="module.title" class="module-title">{{ module.title }}</h2>
          <div class="highlights-grid">
            <div v-for="(item, idx) in module.highlights" :key="idx" class="highlight-card">
              <div class="highlight-icon">
                <Icon :icon="item.icon" :width="26" :height="26" />
              </div>
              <h3 class="highlight-title">{{ item.title }}</h3>
              <p class="highlight-desc">{{ item.desc }}</p>
            </div>
          </div>
        </section>

        <!-- timeline 大事记模块 -->
        <section v-else-if="module.type === 'timeline'" class="topic-module" v-reveal>
          <h2 v-if="module.title" class="module-title">{{ module.title }}</h2>
          <div class="timeline">
            <div v-for="(item, idx) in module.timeline" :key="idx" class="timeline-item">
              <div class="timeline-marker">
                <span class="timeline-dot" />
                <span v-if="idx < module.timeline!.length - 1" class="timeline-line" />
              </div>
              <div class="timeline-content">
                <span class="timeline-date">{{ item.date }}</span>
                <h3 class="timeline-event">{{ item.title }}</h3>
                <p class="timeline-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- articles 文章列表模块 -->
        <section v-else-if="module.type === 'articles'" class="topic-module" v-reveal>
          <h2 v-if="module.title" class="module-title">{{ module.title }}</h2>
          <ul class="topic-articles">
            <li v-for="article in module.articles" :key="article.id">
              <NuxtLink :to="article.url" class="article-row">
                <span class="article-title">{{ article.title }}</span>
                <span class="article-meta">
                  <span class="article-source">{{ article.source }}</span>
                  <span class="article-date">{{ article.publishDate }}</span>
                </span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- links 相关链接模块 -->
        <section v-else-if="module.type === 'links'" class="topic-module" v-reveal>
          <h2 v-if="module.title" class="module-title">{{ module.title }}</h2>
          <div class="topic-links">
            <NuxtLink v-for="(link, idx) in module.links" :key="idx" :to="link.url" class="topic-link-item">
              <Icon :icon="icons.arrowRight" :width="14" :height="14" />
              <span>{{ link.title }}</span>
            </NuxtLink>
          </div>
        </section>

        <!-- richtext 富文本模块 -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <section v-else-if="module.type === 'richtext'" class="topic-module module-richtext" v-html="module.content" v-reveal />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.topic-page {
  padding-bottom: $space-10;
}

// ========== 专题头部 ==========
.topic-header {
  background: $primary-dark;
  padding: $space-6 0;
  margin-bottom: $space-6;
  position: relative;
  overflow: hidden;
}

.topic-header-inner {
  display: flex;
  align-items: center;
  position: relative;
  z-index: $z-base;
}

.header-content {
  flex: 1;
  min-width: 0;
}

.header-label {
  display: inline-block;
  font-size: $fs-xs;
  color: $primary-light;
  background: rgba(0, 115, 189, 0.2);
  padding: 2px $space-2;
  border-radius: $radius-sm;
  letter-spacing: 2px;
  margin-bottom: $space-2;
}

.topic-title {
  font-size: $fs-3xl;
  font-weight: $fw-bold;
  color: $text-inverse;
  margin: 0 0 $space-1;
  letter-spacing: 2px;
}

.topic-subtitle {
  font-size: $fs-sm;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
  margin: 0 0 $space-3;
  text-transform: uppercase;
}

.topic-desc {
  font-size: $fs-base;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0 0 $space-3;
  max-width: 720px;
}

.topic-date {
  font-size: $fs-xs;
  color: rgba(255, 255, 255, 0.5);
}

.header-deco {
  position: absolute;
  right: $space-5;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 70%;
  background: $primary;
  border-radius: $radius-pill;
  opacity: 0.6;

  @include respond-to(xs) {
    display: none;
  }
}

// ========== 模块通用 ==========
.topic-body {
  display: flex;
  flex-direction: column;
  gap: $space-8;
}

.topic-module {
  min-width: 0;
}

.module-title {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $text-primary;
  margin: 0 0 $space-5;
  padding-left: $space-4;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 3px;
    background: $primary;
    border-radius: $radius-pill;
  }
}

// ========== banner 模块 ==========
.module-banner {
  background: $primary-bg;
  border-left: 4px solid $primary;
  border-radius: $radius-base;
  padding: $space-5 $space-6;
}

.banner-text {
  font-size: $fs-md;
  line-height: 1.8;
  color: $text-primary;
  margin: 0;
}

// ========== highlights 模块 ==========
.highlights-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;
}

.highlight-card {
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  padding: $space-5;
  text-align: center;
  transition: all $transition-base;

  &:hover {
    border-color: $primary-lighter;
    box-shadow: $shadow-sm;
    transform: translateY(-2px);
  }
}

.highlight-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: $primary-bg;
  color: $primary;
  margin-bottom: $space-3;
}

.highlight-title {
  font-size: $fs-lg;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0 0 $space-1;
}

.highlight-desc {
  font-size: $fs-sm;
  color: $text-secondary;
  margin: 0;
  line-height: 1.5;
}

// ========== timeline 模块 ==========
.timeline {
  position: relative;
  padding-left: $space-2;
}

.timeline-item {
  display: flex;
  gap: $space-4;
  padding-bottom: $space-5;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $primary;
  border: 2px solid $primary-bg;
  box-shadow: 0 0 0 2px $primary;
  margin-top: 4px;
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: $border-lighter;
  margin-top: $space-1;
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-date {
  font-size: $fs-sm;
  font-weight: $fw-semibold;
  color: $primary;
  font-family: $font-serif;
}

.timeline-event {
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: $space-1 0;
}

.timeline-desc {
  font-size: $fs-sm;
  color: $text-secondary;
  margin: 0;
  line-height: 1.6;
}

// ========== articles 模块 ==========
.topic-articles {
  list-style: none;
  margin: 0;
  padding: 0;
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  overflow: hidden;

  li {
    border-bottom: 1px dashed $border-lighter;

    &:last-child {
      border-bottom: none;
    }
  }
}

.article-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-3 $space-5;
  transition: all $transition-fast;

  &:hover {
    background: $bg-soft;
    padding-left: $space-6;

    .article-title {
      color: $primary;
    }
  }
}

.article-title {
  flex: 1;
  min-width: 0;
  font-size: $fs-base;
  color: $text-primary;
  @include text-ellipsis(1);
  transition: color $transition-fast;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex-shrink: 0;
}

.article-source {
  font-size: $fs-xs;
  color: $text-secondary;
}

.article-date {
  font-size: $fs-xs;
  color: $text-placeholder;
  font-variant-numeric: tabular-nums;
}

// ========== links 模块 ==========
.topic-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $space-3;
}

.topic-link-item {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  font-size: $fs-sm;
  color: $text-primary;
  transition: all $transition-fast;

  :deep(svg) {
    color: $primary;
  }

  &:hover {
    border-color: $primary-lighter;
    background: $primary-bg;
    color: $primary;
  }
}

// ========== 响应式 ==========
@include respond-to(md) {
  .highlights-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include respond-to(xs) {
  .highlights-grid {
    grid-template-columns: 1fr;
  }

  .article-meta {
    .article-source {
      display: none;
    }
  }

  .topic-links {
    grid-template-columns: 1fr;
  }
}
</style>
