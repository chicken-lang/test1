<script setup lang="ts">
// 文章详情页(T4.3 通用模板)v3.0 视觉对齐
// URL: /article/[id]
// 包含: 面包屑 + H1标题 + 元信息 + 富文本正文 + 附件 + 联系方式 + 上下篇 + 分享/打印/收藏/返回
// v3.0: icons 字典 + v-reveal 入场 + focus-visible + ARIA 无障碍
import { getArticleDetail, recommendArticles } from '~/mock/data'
import { icons } from '~/utils/icons'

const route = useRoute()
const router = useRouter()

// 文章 ID
const articleId = computed(() => Number(route.params.id))

// 文章详情(Mock)
const article = computed(() => getArticleDetail(articleId.value))

// 文章不存在时抛 404
if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在', fatal: true })
}

// 面包屑
const breadcrumbItems = computed(() => [
  { title: '首页', to: '/' },
  { title: article.value!.columnTitle, to: `/list/${article.value!.columnSlug}` },
  { title: '正文' },
])

// 模拟浏览量自增(前端展示用,实际由后端统计)
const viewCount = ref(article.value!.views)
onMounted(() => {
  viewCount.value += 1
})

// 字号调节
const fontSize = ref<'normal' | 'large' | 'xlarge'>('normal')
const fontClass = computed(() => `fs-${fontSize.value}`)
const cycleFontSize = () => {
  const order: Array<'normal' | 'large' | 'xlarge'> = ['normal', 'large', 'xlarge']
  const idx = order.indexOf(fontSize.value)
  fontSize.value = order[(idx + 1) % order.length]
}

// 收藏(前端占位)
const isFavorited = ref(false)
const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value
  ElMessage.success(isFavorited.value ? '已收藏' : '已取消收藏')
}

// 打印
const printArticle = () => {
  window.print()
}

// 分享(复制链接)
const shareLink = () => {
  const url = window.location.href
  navigator.clipboard?.writeText(url).then(
    () => ElMessage.success('链接已复制,可粘贴分享'),
    () => ElMessage.info('请手动复制地址栏链接'),
  )
}

// 附件图标映射(基于 icons 字典,统一管理)
const fileIconMap: Record<string, string> = {
  pdf: icons.pdf,
  doc: icons.word,
  docx: icons.word,
  xls: icons.excel,
  xlsx: icons.excel,
  ppt: icons.ppt,
  pptx: icons.ppt,
  zip: icons.zip,
  rar: icons.zip,
}
const getFileIcon = (ext: string) => fileIconMap[ext] || icons.document

// 附件下载(前端占位)
const downloadFile = (name: string) => {
  ElMessage.info(`下载: ${name}(Mock 阶段,后端就绪后对接附件 API)`)
}

// SEO
useSeoMeta({
  title: () => `${article.value!.title} - 深圳信息职业技术大学教务处`,
  description: () => article.value!.summary || article.value!.title,
  ogTitle: () => article.value!.title,
  ogDescription: () => article.value!.summary || '',
})
</script>

<template>
  <div class="article-page">
    <!-- 面包屑 -->
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <div class="container article-main">
      <!-- 左侧:正文区 -->
      <article v-reveal class="article-content-wrap reveal">
        <!-- 标题区 -->
        <header class="article-header">
          <div class="article-tags">
            <span v-if="article!.isTop" class="tag-top">置顶</span>
            <span v-if="article!.isImportant" class="tag-important">重要</span>
            <span v-for="tag in article!.tags" :key="tag" class="tag-normal">{{ tag }}</span>
          </div>
          <h1 class="article-title">{{ article!.title }}</h1>
          <div class="article-meta">
            <span class="meta-item">
              <Icon :icon="icons.calendar" :width="14" :height="14" />
              {{ article!.publishDate }}
            </span>
            <span class="meta-item">
              <Icon :icon="icons.source" :width="14" :height="14" />
              来源:{{ article!.source }}
            </span>
            <span class="meta-item">
              <Icon :icon="icons.eye" :width="14" :height="14" />
              {{ viewCount }} 阅读
            </span>
          </div>
        </header>

        <!-- 工具栏 -->
        <div class="article-toolbar" role="toolbar" aria-label="文章工具">
          <button class="tool-btn" aria-label="切换字号" @click="cycleFontSize">
            <Icon :icon="icons.formatFont" :width="16" :height="16" />
            <span>字号</span>
          </button>
          <button
            class="tool-btn"
            :class="{ active: isFavorited }"
            :aria-label="isFavorited ? '取消收藏' : '收藏文章'"
            :aria-pressed="isFavorited"
            @click="toggleFavorite"
          >
            <Icon :icon="isFavorited ? icons.bookmarkFill : icons.bookmark" :width="16" :height="16" />
            <span>{{ isFavorited ? '已收藏' : '收藏' }}</span>
          </button>
          <button class="tool-btn" aria-label="分享文章链接" @click="shareLink">
            <Icon :icon="icons.share" :width="16" :height="16" />
            <span>分享</span>
          </button>
          <button class="tool-btn" aria-label="打印文章" @click="printArticle">
            <Icon :icon="icons.print" :width="16" :height="16" />
            <span>打印</span>
          </button>
          <button class="tool-btn" aria-label="返回上一页" @click="router.back()">
            <Icon :icon="icons.arrowLeft" :width="16" :height="16" />
            <span>返回</span>
          </button>
        </div>

        <!-- 正文(富文本) - 内容来自后端受信任的富文本存储,无 XSS 风险 -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="article-body" :class="fontClass" v-html="article!.content"></div>

        <!-- 联系方式区(办事类文章) -->
        <div v-if="article!.contact || article!.acceptTime" class="article-contact">
          <h3 class="contact-title">
            <Icon :icon="icons.info" :width="18" :height="18" />
            办理信息
          </h3>
          <div class="contact-grid">
            <div v-if="article!.contact" class="contact-item">
              <span class="contact-label">联系人/电话</span>
              <span class="contact-value">{{ article!.contact }}</span>
            </div>
            <div v-if="article!.acceptTime" class="contact-item">
              <span class="contact-label">受理时间</span>
              <span class="contact-value">{{ article!.acceptTime }}</span>
            </div>
            <div v-if="article!.supervise" class="contact-item">
              <span class="contact-label">监督渠道</span>
              <span class="contact-value">{{ article!.supervise }}</span>
            </div>
          </div>
        </div>

        <!-- 附件下载区 -->
        <div v-if="article!.attachments.length" class="article-attachments">
          <h3 class="attachment-title">
            <Icon :icon="icons.paperclip" :width="18" :height="18" />
            附件下载({{ article!.attachments.length }})
          </h3>
          <ul class="attachment-list">
            <li v-for="file in article!.attachments" :key="file.id" class="attachment-item">
              <span class="file-icon" :class="`ext-${file.ext}`" aria-hidden="true">
                <Icon :icon="getFileIcon(file.ext)" :width="24" :height="24" />
              </span>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-meta">{{ file.size }} · 下载 {{ file.downloads }} 次</span>
              </div>
              <button
                class="file-download"
                :aria-label="`下载附件 ${file.name}`"
                @click="downloadFile(file.name)"
              >
                <Icon :icon="icons.download" :width="18" :height="18" />
                下载
              </button>
            </li>
          </ul>
        </div>

        <!-- 上一篇/下一篇 -->
        <nav class="article-nav" aria-label="文章导航">
          <NuxtLink v-if="article!.prev" :to="`/article/${article!.prev.id}`" class="nav-link nav-prev" :aria-label="`上一篇:${article!.prev.title}`">
            <Icon :icon="icons.chevronLeft" :width="18" :height="18" />
            <div class="nav-text">
              <span class="nav-label">上一篇</span>
              <span class="nav-title">{{ article!.prev.title }}</span>
            </div>
          </NuxtLink>
          <span v-else class="nav-link nav-prev disabled" aria-disabled="true">
            <Icon :icon="icons.chevronLeft" :width="18" :height="18" />
            <div class="nav-text">
              <span class="nav-label">上一篇</span>
              <span class="nav-title">没有更多了</span>
            </div>
          </span>

          <NuxtLink v-if="article!.next" :to="`/article/${article!.next.id}`" class="nav-link nav-next" :aria-label="`下一篇:${article!.next.title}`">
            <div class="nav-text">
              <span class="nav-label">下一篇</span>
              <span class="nav-title">{{ article!.next.title }}</span>
            </div>
            <Icon :icon="icons.chevronRight" :width="18" :height="18" />
          </NuxtLink>
          <span v-else class="nav-link nav-next disabled" aria-disabled="true">
            <div class="nav-text">
              <span class="nav-label">下一篇</span>
              <span class="nav-title">没有更多了</span>
            </div>
            <Icon :icon="icons.chevronRight" :width="18" :height="18" />
          </span>
        </nav>
      </article>

      <!-- 右侧:侧边栏 -->
      <aside v-reveal class="article-sidebar reveal">
        <!-- 推荐阅读 -->
        <div class="side-card">
          <h3 class="side-title">
            <Icon :icon="icons.hot" :width="16" :height="16" />
            推荐阅读
          </h3>
          <ul class="side-list">
            <li v-for="(item, idx) in recommendArticles" :key="item.id" class="side-item">
              <NuxtLink :to="item.url" class="side-link" :aria-label="`推荐阅读:${item.title}`">
                <span class="side-index">{{ String(idx + 1).padStart(2, '0') }}</span>
                <span class="side-text">{{ item.title }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- 快捷服务 -->
        <div class="side-card side-service">
          <h3 class="side-title">
            <Icon :icon="icons.lightningBolt" :width="16" :height="16" />
            快捷服务
          </h3>
          <div class="service-grid">
            <NuxtLink to="/list/download" class="service-item" aria-label="下载中心">
              <Icon :icon="icons.download" :width="22" :height="22" />
              <span>下载中心</span>
            </NuxtLink>
            <NuxtLink to="/list/guide" class="service-item" aria-label="办事指南">
              <Icon :icon="icons.guide" :width="22" :height="22" />
              <span>办事指南</span>
            </NuxtLink>
            <NuxtLink to="/feedback" class="service-item" aria-label="教学反馈">
              <Icon :icon="icons.email" :width="22" :height="22" />
              <span>教学反馈</span>
            </NuxtLink>
            <NuxtLink to="/calendar" class="service-item" aria-label="校历作息">
              <Icon :icon="icons.schedule" :width="22" :height="22" />
              <span>校历作息</span>
            </NuxtLink>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.article-page {
  padding-bottom: $space-10;
}

.article-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: $space-6;
  align-items: start;
}

// ========== 正文区 ==========
.article-content-wrap {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-sm;
  min-width: 0;
}

// 标题区
.article-header {
  margin-bottom: $space-5;
  padding-bottom: $space-5;
  border-bottom: 1px solid $border-lighter;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-3;
}

.tag-top,
.tag-important,
.tag-normal {
  font-size: $fs-xs;
  padding: 2px $space-2;
  border-radius: $radius-sm;
  font-weight: $fw-medium;
}

.tag-top {
  color: $warning;
  background: rgba(250, 173, 20, 0.1);
}

.tag-important {
  color: $danger;
  background: rgba(230, 57, 70, 0.1);
}

.tag-normal {
  color: $primary;
  background: $primary-bg;
}

.article-title {
  font-size: $fs-4xl;
  font-weight: $fw-bold;
  color: $text-primary;
  line-height: $lh-tight;
  margin-bottom: $space-4;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-5;
  font-size: $fs-sm;
  color: $text-secondary;

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: $space-1;

    :deep(svg) {
      color: $gold;
    }
  }
}

// 工具栏
.article-toolbar {
  display: flex;
  gap: $space-2;
  padding: $space-3 0;
  margin-bottom: $space-5;
  border-bottom: 1px solid $border-lighter;

  .tool-btn {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    padding: $space-2 $space-3;
    font-size: $fs-sm;
    color: $text-secondary;
    background: $bg-soft;
    border: 1px solid $border-lighter;
    border-radius: $radius-base;
    transition: all $transition-fast;

    &:hover {
      color: $primary;
      background: $primary-bg;
      border-color: $primary-lighter;
    }

    &.active {
      color: $gold-dark;
      background: $gold-bg;
      border-color: $gold-light;
    }

    &:focus-visible {
      outline: 2px solid $focus-ring;
      outline-offset: 2px;
    }
  }
}

// 正文富文本
.article-body {
  font-size: $fs-md;
  line-height: $lh-relaxed;
  color: $text-regular;

  // 字号调节
  &.fs-normal {
    font-size: $fs-md;
  }
  &.fs-large {
    font-size: $fs-lg;
  }
  &.fs-xlarge {
    font-size: $fs-xl;
  }

  :deep(h2) {
    font-size: $fs-xl;
    font-weight: $fw-bold;
    color: $text-primary;
    margin: $space-6 0 $space-3;
    padding-left: $space-3;
    border-left: 4px solid $primary;
  }

  :deep(p) {
    margin-bottom: $space-3;
  }

  :deep(.article-lead) {
    font-size: $fs-lg;
    color: $text-secondary;
    background: $bg-soft;
    padding: $space-4;
    border-radius: $radius-base;
    border-left: 3px solid $gold;
    margin-bottom: $space-5;
  }

  :deep(ol),
  :deep(ul) {
    margin: $space-3 0 $space-3 $space-5;

    li {
      margin-bottom: $space-2;
      line-height: $lh-relaxed;
    }
  }

  :deep(ol) {
    list-style: decimal;
  }

  :deep(ul) {
    list-style: disc;
  }

  :deep(table) {
    margin: $space-4 0;
    border: 1px solid $border-base;
    border-radius: $radius-base;
    overflow: hidden;

    th {
      background: $primary-bg;
      color: $primary-dark;
      font-weight: $fw-semibold;
    }

    td,
    th {
      border: 1px solid $border-lighter;
    }
  }

  :deep(blockquote) {
    margin: $space-4 0;
    padding: $space-4;
    background: $gold-bg;
    border-left: 4px solid $gold;
    border-radius: $radius-base;
    color: $text-secondary;
    font-style: italic;
  }
}

// 联系方式区
.article-contact {
  margin: $space-6 0;
  padding: $space-5;
  background: $primary-bg;
  border-radius: $radius-lg;
}

.contact-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-lg;
  font-weight: $fw-semibold;
  color: $primary-dark;
  margin-bottom: $space-4;

  :deep(svg) {
    color: $gold;
  }
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  .contact-label {
    font-size: $fs-xs;
    color: $text-secondary;
  }

  .contact-value {
    font-size: $fs-sm;
    color: $text-primary;
    font-weight: $fw-medium;
  }
}

// 附件区
.article-attachments {
  margin: $space-6 0;
  padding: $space-5;
  background: $bg-soft;
  border-radius: $radius-lg;
}

.attachment-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-lg;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin-bottom: $space-4;

  :deep(svg) {
    color: $gold;
  }
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: $bg-card;
  border-radius: $radius-base;
  border: 1px solid $border-lighter;
  transition: all $transition-fast;

  &:hover {
    border-color: $gold-light;
    box-shadow: $shadow-xs;
  }
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: $radius-base;
  flex-shrink: 0;

  &.ext-pdf {
    color: $danger;
    background: rgba(230, 57, 70, 0.08);
  }
  &.ext-doc,
  &.ext-docx {
    color: #2b579a;
    background: rgba(43, 87, 154, 0.08);
  }
  &.ext-xls,
  &.ext-xlsx {
    color: #217346;
    background: rgba(33, 115, 70, 0.08);
  }
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  .file-name {
    font-size: $fs-sm;
    font-weight: $fw-medium;
    color: $text-primary;
    @include text-ellipsis(1);
  }

  .file-meta {
    font-size: $fs-xs;
    color: $text-placeholder;
  }
}

.file-download {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-4;
  font-size: $fs-sm;
  color: $primary;
  background: $primary-bg;
  border: 1px solid $primary-lighter;
  border-radius: $radius-base;
  transition: all $transition-fast;
  flex-shrink: 0;

  &:hover {
    color: #fff;
    background: $primary;
    border-color: $primary;
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

// 上下篇导航
.article-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;
  margin-top: $space-8;
  padding-top: $space-6;
  border-top: 2px solid $border-lighter;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-4;
  background: $bg-soft;
  border-radius: $radius-base;
  transition: all $transition-base;

  &:hover:not(.disabled) {
    background: $primary-bg;
    transform: translateX(0);

    .nav-title {
      color: $primary;
    }
  }

  &:focus-visible:not(.disabled) {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }

  &.nav-next {
    text-align: right;
    justify-content: flex-end;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nav-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .nav-label {
    font-size: $fs-xs;
    color: $text-placeholder;
  }

  .nav-title {
    font-size: $fs-sm;
    color: $text-regular;
    font-weight: $fw-medium;
    @include text-ellipsis(1);
    transition: color $transition-fast;
  }
}

// ========== 侧边栏 ==========
.article-sidebar {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  position: sticky;
  top: 80px;
}

.side-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-sm;
}

.side-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;

  :deep(svg) {
    color: $gold;
  }
}

.side-list {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.side-item {
  .side-link {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
    padding: $space-2;
    border-radius: $radius-sm;
    transition: all $transition-fast;

    &:hover {
      background: $primary-bg;

      .side-index {
        color: $gold;
      }
      .side-text {
        color: $primary;
      }
    }

    &:focus-visible {
      outline: 2px solid $focus-ring;
      outline-offset: 2px;
    }
  }

  .side-index {
    font-family: $font-serif;
    font-size: $fs-md;
    font-weight: $fw-bold;
    color: $border-base;
    flex-shrink: 0;
    transition: color $transition-fast;
  }

  .side-text {
    font-size: $fs-sm;
    color: $text-regular;
    line-height: $lh-snug;
    @include text-ellipsis(2);
    transition: color $transition-fast;
  }
}

// 快捷服务
.service-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-1;
  padding: $space-3 $space-2;
  border-radius: $radius-base;
  color: $text-regular;
  font-size: $fs-xs;
  transition: all $transition-fast;

  &:hover {
    background: $gold-bg;
    color: $primary;

    :deep(svg) {
      color: $gold;
    }
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }

  :deep(svg) {
    color: $primary;
    transition: color $transition-fast;
  }
}

// 响应式
@include respond-to(md) {
  .article-main {
    grid-template-columns: 1fr;
  }

  .article-sidebar {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;

    .side-card {
      flex: 1;
      min-width: 280px;
    }
  }
}

@include respond-to(xs) {
  .article-content-wrap {
    padding: $space-5 $space-4;
  }

  .article-title {
    font-size: $fs-2xl;
  }

  .article-meta {
    gap: $space-3;
  }

  .article-toolbar {
    flex-wrap: wrap;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }

  .article-nav {
    grid-template-columns: 1fr;
  }

  .nav-next {
    text-align: left !important;
    justify-content: flex-start !important;
  }
}

// 打印样式
@media print {
  .app-header,
  .app-nav,
  .app-footer,
  .article-toolbar,
  .article-sidebar,
  .breadcrumb {
    display: none !important;
  }

  .article-main {
    grid-template-columns: 1fr;
  }

  .article-content-wrap {
    box-shadow: none;
    padding: 0;
  }
}
</style>
