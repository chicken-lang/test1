<script setup lang="ts">
// 文章详情页(T4.3 通用模板)v3.0 视觉对齐
// URL: /article/[id]
// 包含: 面包屑 + H1标题 + 元信息 + 富文本正文 + 附件 + 联系方式 + 上下篇 + 分享/打印/收藏/返回
// v3.0: icons 字典 + v-reveal 入场 + focus-visible + ARIA 无障碍
// 数据源: useApi → /api/articles/:id + /api/recommend-articles（SSR 预取）
import { icons } from '~/utils/icons'

const route = useRoute()
const router = useRouter()
const api = useApi()

// 文章 ID
const articleId = computed(() => Number(route.params.id))

// 文章详情(SSR 预取,key 随 id 变化)
// 使用 .catch(() => null) 捕获 404/网络错误，避免 fatal error 破坏 payload 预加载
const { data: articleData } = await useAsyncData(
  () => `article-${articleId.value}`,
  () => api.get<any>(`/articles/${articleId.value}`).catch(() => null),
)

const article = computed(() => articleData.value ?? null)

// 文章不存在时不抛 404（避免 Nuxt payload 预加载失败）
// 改为内联渲染"不存在"提示，SSR 始终返回 200 确保 payload 可生成
const notFound = computed(() => !article.value)

// 推荐阅读(SSR 预取,全局缓存)
const { data: recommendData } = await useAsyncData('recommend-articles', () =>
  api.get<any[]>('/recommend-articles'),
)
const recommendArticles = computed(() => recommendData.value ?? [])

// 面包屑
const breadcrumbItems = computed(() => [
  { title: '首页', to: '/' },
  ...(article.value ? [{ title: article.value.columnTitle ?? '栏目', to: `/list/${article.value.columnSlug ?? ''}` }] : []),
  ...(article.value ? [{ title: '正文' }] : [{ title: '文章不存在' }]),
])

// 浏览量展示（后端文章详情接口在请求时已 viewCount+1，前端直接展示返回值即可）
const viewCount = ref(article.value?.views ?? 0)
onMounted(() => {
  // 上报 article_view 事件到统计中心 (V2.0 §12)，用于栏目访问量聚合统计
  reportArticleView()
})

// 埋点上报：将稿件浏览事件写入 stat_raw_event，供定时聚合任务生成统计报表
async function reportArticleView() {
  try {
    const a = article.value
    if (!a) return
    // 会话标识：同一 sessionId 当日多次访问仅计 1 UV (V2.0 §12.3.1)
    let sessionId = localStorage.getItem('stat_session_id')
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem('stat_session_id', sessionId)
    }
    await api.post('/stats/beacon', {
      eventType: 'article_view',
      sessionId,
      articleId: a.articleId ?? a.id,
      columnId: a.columnId,
      referer: document.referrer || '',
      deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'pc',
      eventTime: new Date().toISOString(),
    })
  } catch {
    // 埋点失败静默忽略，不影响前台浏览体验
  }
}

// 字号调节
const fontSize = ref<'normal' | 'large' | 'xlarge'>('normal')
const fontClass = computed(() => `fs-${fontSize.value}`)
const cycleFontSize = () => {
  const order: Array<'normal' | 'large' | 'xlarge'> = ['normal', 'large', 'xlarge']
  const idx = order.indexOf(fontSize.value)
  fontSize.value = order[(idx + 1) % order.length]
}

// 收藏
const isFavorited = ref(false)
const toggleFavorite = async () => {
  try {
    if (isFavorited.value) {
      await api.delete(`/user/favorites/${articleId.value}`)
      isFavorited.value = false
      ElMessage.success('已取消收藏')
    } else {
      await api.post('/user/favorites', { articleId: articleId.value })
      isFavorited.value = true
      ElMessage.success('已收藏')
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '操作失败,请重试')
  }
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

// 可在线预览的文件类型
const previewableExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
const canPreview = (ext: string) => previewableExts.includes(ext.toLowerCase())

// 在线预览弹窗
const previewVisible = ref(false)
const previewFileData = ref<{ id: number; name: string; ext: string; size: string } | null>(null)
const previewUrl = computed(() => {
  if (!previewFileData.value) return ''
  return `/api/attachments/${previewFileData.value.id}/download`
})
const isImage = computed(() => {
  if (!previewFileData.value) return false
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(previewFileData.value.ext.toLowerCase())
})

// 打开预览
const openPreview = (file: any) => {
  if (!canPreview(file.ext)) {
    ElMessage.info('该文件类型不支持在线预览,请下载后查看')
    return
  }
  previewFileData.value = { id: file.id, name: file.name, ext: file.ext, size: file.size }
  previewVisible.value = true
}

// 附件下载(调用 BFF 下载接口,支持 Mock 降级)
const downloading = ref<Set<number>>(new Set())
const downloadFile = async (file: any) => {
  if (downloading.value.has(file.id)) return
  downloading.value.add(file.id)
  try {
    const response = await fetch(`/api/attachments/${file.id}/download`)
    if (!response.ok) throw new Error(`下载失败 (HTTP ${response.status})`)

    const contentType = response.headers.get('content-type') || ''

    // 后端模式: 返回 JSON 含 downloadUrl
    if (contentType.includes('application/json')) {
      const data = await response.json()
      if (data.code === 0 && data.data?.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank')
        file.downloads = (file.downloads || 0) + 1
        ElMessage.success(`开始下载: ${file.name}`)
        return
      }
      throw new Error(data.message || '下载失败')
    }

    // Mock 模式: 直接返回文件 Blob
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    file.downloads = (file.downloads || 0) + 1
    ElMessage.success(`下载成功: ${file.name}`)
  } catch (err: any) {
    ElMessage.error(err?.message || '下载失败,请稍后重试')
  } finally {
    downloading.value.delete(file.id)
  }
}

// SEO
useSeoMeta({
  title: () => article.value ? `${article.value.title} - 深圳信息职业技术大学教务处` : '文章不存在 - 深圳信息职业技术大学教务处',
  description: () => article.value?.summary || article.value?.title || '该文章不存在或已被删除',
  ogTitle: () => article.value?.title ?? '文章不存在',
  ogDescription: () => article.value?.summary || '',
})
</script>

<template>
  <div class="article-page">
    <!-- 面包屑 -->
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <div class="container article-main">
      <!-- 文章不存在提示 -->
      <div v-if="notFound" class="article-not-found">
        <Icon :icon="icons.document" :width="64" :height="64" />
        <h2>文章不存在</h2>
        <p>该文章可能已被删除或尚未发布</p>
        <NuxtLink to="/" class="back-home">返回首页</NuxtLink>
      </div>

      <!-- 左侧:正文区 -->
      <article v-else v-reveal class="article-content-wrap reveal">
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
        <div v-if="article?.attachments?.length" class="article-attachments">
          <h3 class="attachment-title">
            <Icon :icon="icons.paperclip" :width="18" :height="18" />
            附件下载({{ article.attachments.length }})
          </h3>
          <ul class="attachment-list">
            <li v-for="file in article.attachments" :key="file.id" class="attachment-item">
              <span class="file-icon" :class="`ext-${file.ext}`" aria-hidden="true">
                <Icon :icon="getFileIcon(file.ext)" :width="24" :height="24" />
              </span>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-meta">{{ file.size }} · 下载 {{ file.downloads }} 次</span>
              </div>
              <div class="file-actions">
                <button
                  v-if="canPreview(file.ext)"
                  class="file-preview"
                  :aria-label="`预览附件 ${file.name}`"
                  @click="openPreview(file)"
                >
                  <Icon :icon="icons.eye" :width="16" :height="16" />
                  预览
                </button>
                <button
                  class="file-download"
                  :disabled="downloading.has(file.id)"
                  :aria-label="`下载附件 ${file.name}`"
                  @click="downloadFile(file)"
                >
                  <Icon v-if="downloading.has(file.id)" icon="mdi:loading" :width="18" :height="18" class="spin" />
                  <Icon v-else :icon="icons.download" :width="18" :height="18" />
                  {{ downloading.has(file.id) ? '下载中' : '下载' }}
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- 在线预览弹窗 -->
        <el-dialog
          v-model="previewVisible"
          :title="`在线预览: ${previewFileData?.name || ''}`"
          width="85%"
          top="5vh"
          destroy-on-close
        >
          <div class="preview-container">
            <iframe
              v-if="previewFileData && !isImage"
              :src="previewUrl"
              class="preview-iframe"
              :title="previewFileData.name"
            />
            <div v-else-if="previewFileData && isImage" class="preview-image-wrap">
              <img :src="previewUrl" :alt="previewFileData.name" class="preview-image" />
            </div>
          </div>
        </el-dialog>

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

.article-not-found {
  text-align: center;
  padding: 80px 20px;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  grid-column: 1 / -1;

  h2 { font-size: 24px; color: #303133; margin: 0; }
  p { margin: 0; }
  .back-home {
    margin-top: 12px;
    color: #409eff;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}
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
      color: $primary;
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
      color: $primary-dark;
      background: $primary-bg;
      border-color: $primary-light;
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
    border-left: 3px solid $primary;
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
    background: $primary-bg;
    border-left: 4px solid $primary;
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
    color: $primary;
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
    color: $primary;
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
    border-color: $primary-light;
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

  &:hover:not(:disabled) {
    color: #fff;
    background: $primary;
    border-color: $primary;
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.file-actions {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-shrink: 0;
}

.file-preview {
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

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 预览弹窗
.preview-container {
  width: 100%;
  height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-soft;
  border-radius: $radius-base;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: $radius-base;
}

.preview-image-wrap {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: $radius-base;
  box-shadow: $shadow-sm;
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
    color: $primary;
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
        color: $primary;
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
    background: $primary-bg;
    color: $primary;

    :deep(svg) {
      color: $primary;
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
