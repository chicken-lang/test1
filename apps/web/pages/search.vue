<script setup lang="ts">
// 搜索页(T4.10)
// 功能:
//   1. 从 URL query.q 读取初始关键词(SSR 友好)
//   2. 输入实时获取建议(getSearchSuggestions),点击/回车触发搜索
//   3. 搜索结果列表:标题(链接)、摘要、栏目 tag、日期、来源
//   4. 右侧热门搜索词(hotKeywords) + 搜索历史(localStorage,客户端渲染)
//   5. 空状态/无结果状态/历史状态切换
import { ElMessage } from 'element-plus'
import {
  searchArticles,
  getSearchSuggestions,
  hotKeywords,
  type SearchResult,
} from '~/mock/data'

// 路由 & SEO
const route = useRoute()
const router = useRouter()

useSeoMeta({
  title: '搜索 - 深圳信息职业技术大学教务处',
  description: '搜索教务处通知、新闻、办事指南等内容',
})

// 面包屑
const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '搜索' },
]

// ========== 搜索状态 ==========
const keyword = ref((route.query.q as string) || '')
const searchedKeyword = ref('') // 已执行搜索的关键词(用于结果标题展示)
const results = ref<SearchResult[]>([])
const suggestions = ref<string[]>([])
const isSearching = ref(false)
const hasSearched = ref(false) // 是否已触发过搜索(区分初始状态与无结果)

// 搜索历史(localStorage, 仅客户端读写,SSR 安全)
const searchHistory = ref<string[]>([])

// ========== 方法 ==========

// 触发搜索(同步 mock,模拟 200ms 延迟营造体验)
const doSearch = (kw?: string) => {
  const finalKw = (kw ?? keyword.value).trim()
  if (!finalKw) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  isSearching.value = true
  hasSearched.value = true

  // 模拟异步(对接真实 API 时直接替换为 $fetch)
  setTimeout(() => {
    results.value = searchArticles(finalKw)
    searchedKeyword.value = finalKw
    isSearching.value = false

    // 写入搜索历史(去重、最多 10 条)
    addHistory(finalKw)

    // 同步 URL query(便于分享/刷新保留搜索态)
    router.replace({ path: '/search', query: { q: finalKw } })
  }, 200)
}

// 输入实时获取建议
const onInput = () => {
  const kw = keyword.value.trim()
  suggestions.value = kw ? getSearchSuggestions(kw) : []
}

// 选中建议项
const onPickSuggestion = (s: string) => {
  keyword.value = s
  suggestions.value = []
  doSearch(s)
}

// 回车提交
const onSubmit = () => {
  suggestions.value = []
  doSearch()
}

// 点击热门词
const onHotKeyword = (kw: string) => {
  keyword.value = kw
  doSearch(kw)
}

// 清空输入
const onClear = () => {
  keyword.value = ''
  suggestions.value = []
  results.value = []
  hasSearched.value = false
  searchedKeyword.value = ''
}

// ========== 搜索历史 ==========
const addHistory = (kw: string) => {
  const next = [kw, ...searchHistory.value.filter((k) => k !== kw)].slice(0, 10)
  searchHistory.value = next
  if (import.meta.client) {
    localStorage.setItem('jwc_search_history', JSON.stringify(next))
  }
}

const removeHistory = (kw: string) => {
  searchHistory.value = searchHistory.value.filter((k) => k !== kw)
  if (import.meta.client) {
    localStorage.setItem('jwc_search_history', JSON.stringify(searchHistory.value))
  }
}

const clearHistory = () => {
  searchHistory.value = []
  if (import.meta.client) {
    localStorage.removeItem('jwc_search_history')
  }
  ElMessage.success('已清空搜索历史')
}

// ========== 生命周期 ==========
onMounted(() => {
  // 客户端加载搜索历史
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem('jwc_search_history')
      if (raw) searchHistory.value = JSON.parse(raw) || []
    } catch {
      searchHistory.value = []
    }
  }

  // 若 URL 携带 q,自动执行一次搜索
  if (keyword.value) {
    doSearch()
  }
})

// 路由 query 变化时同步(支持从其他页跳转带 q)
watch(
  () => route.query.q,
  (q) => {
    const next = (q as string) || ''
    if (next && next !== keyword.value) {
      keyword.value = next
      doSearch(next)
    }
  },
)
</script>

<template>
  <div class="search-page">
    <!-- 面包屑 -->
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 顶部页头(渐变背景 + 大搜索框) -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:magnify" />
          全站搜索
        </h1>
        <p class="page-subtitle">Search</p>

        <!-- 大搜索框 -->
        <div class="search-box">
          <Icon icon="mdi:magnify" class="search-icon" width="22" height="22" />
          <input
            v-model="keyword"
            type="text"
            class="search-input"
            placeholder="搜索通知、新闻、办事指南、表格下载..."
            aria-label="搜索关键词"
            @input="onInput"
            @keyup.enter="onSubmit"
          />
          <button
            v-if="keyword"
            class="clear-btn"
            aria-label="清空"
            @click="onClear"
          >
            <Icon icon="mdi:close-circle" width="20" height="20" />
          </button>
          <button class="submit-btn" :disabled="isSearching" @click="onSubmit">
            <Icon v-if="isSearching" icon="mdi:loading" class="is-loading" width="18" height="18" />
            <Icon v-else icon="mdi:arrow-right" width="18" height="18" />
            <span>搜索</span>
          </button>

          <!-- 搜索建议下拉 -->
          <ul v-if="suggestions.length" class="suggest-list" role="listbox">
            <li
              v-for="(s, i) in suggestions"
              :key="i"
              class="suggest-item"
              role="option"
              @click="onPickSuggestion(s)"
            >
              <Icon icon="mdi:magnify" width="14" height="14" />
              <!-- eslint-disable-next-line vue/no-v-html -- 内容来自 mock 文章标题(受信任),且关键词高亮为本地拼接 -->
              <span v-html="s.replace(new RegExp(keyword, 'gi'), (m) => `<strong>${m}</strong>`)" />
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="container search-main">
      <!-- 左侧:搜索结果 -->
      <div class="search-content">
        <!-- 结果统计 -->
        <div v-if="hasSearched && !isSearching" class="result-summary">
          <span>
            关于「<strong class="result-keyword">{{ searchedKeyword }}</strong>」
            共找到 <strong class="result-count">{{ results.length }}</strong> 条结果
          </span>
        </div>

        <!-- 加载中 -->
        <div v-if="isSearching" class="loading-list">
          <div v-for="i in 4" :key="i" class="skeleton-item">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-desc"></div>
            <div class="skeleton skeleton-meta"></div>
          </div>
        </div>

        <!-- 结果列表 -->
        <ol v-else-if="results.length" class="result-list">
          <li v-for="(item, idx) in results" :key="item.id" class="result-item">
            <div class="result-index">{{ idx + 1 }}</div>
            <div class="result-body">
              <div class="result-tags">
                <el-tag size="small" type="primary" effect="plain">{{ item.columnTitle }}</el-tag>
                <el-tag size="small" type="info" effect="plain">{{ item.source }}</el-tag>
              </div>
              <NuxtLink :to="item.url" class="result-title">
                <Icon icon="mdi:file-document-outline" width="16" height="16" />
                <span>{{ item.title }}</span>
              </NuxtLink>
              <p class="result-summary">{{ item.summary }}</p>
              <div class="result-meta">
                <span>
                  <Icon icon="mdi:calendar-outline" width="13" height="13" />
                  {{ item.publishDate }}
                </span>
                <NuxtLink :to="item.url" class="result-link">
                  查看详情
                  <Icon icon="mdi:arrow-right" width="13" height="13" />
                </NuxtLink>
              </div>
            </div>
          </li>
        </ol>

        <!-- 无结果 -->
        <EmptyState
          v-else-if="hasSearched"
          variant="search"
          title="未找到相关结果"
          description="请尝试更换关键词,或使用更简短、更通用的词汇进行搜索"
        >
          <template #action>
            <div class="empty-actions">
              <span class="empty-tip">建议:</span>
              <button
                v-for="kw in hotKeywords.slice(0, 4)"
                :key="kw"
                class="suggest-btn"
                @click="onHotKeyword(kw)"
              >
                {{ kw }}
              </button>
            </div>
          </template>
        </EmptyState>

        <!-- 初始态(未搜索) -->
        <div v-else class="initial-state">
          <div class="initial-icon">
            <Icon icon="mdi:feature-search-outline" width="80" height="80" />
          </div>
          <h3 class="initial-title">输入关键词开始搜索</h3>
          <p class="initial-desc">支持搜索通知公告、新闻资讯、办事指南、表格下载等全部内容</p>
        </div>
      </div>

      <!-- 右侧:热门搜索 + 搜索历史 -->
      <aside class="search-sidebar">
        <!-- 热门搜索 -->
        <div class="sidebar-card">
          <div class="sidebar-header">
            <Icon icon="mdi:fire" width="18" height="18" />
            <span>热门搜索</span>
          </div>
          <div class="hot-list">
            <button
              v-for="(kw, i) in hotKeywords"
              :key="kw"
              class="hot-item"
              :class="{ 'is-top': i < 3 }"
              @click="onHotKeyword(kw)"
            >
              <span class="hot-rank">{{ i + 1 }}</span>
              <span class="hot-text">{{ kw }}</span>
            </button>
          </div>
        </div>

        <!-- 搜索历史 -->
        <div class="sidebar-card">
          <div class="sidebar-header">
            <Icon icon="mdi:history" width="18" height="18" />
            <span>搜索历史</span>
            <button
              v-if="searchHistory.length"
              class="clear-history"
              aria-label="清空历史"
              @click="clearHistory"
            >
              <Icon icon="mdi:trash-can-outline" width="14" height="14" />
              清空
            </button>
          </div>
          <div v-if="searchHistory.length" class="history-list">
            <div v-for="kw in searchHistory" :key="kw" class="history-item">
              <button class="history-text" @click="onHotKeyword(kw)">
                <Icon icon="mdi:clock-time-four-outline" width="13" height="13" />
                {{ kw }}
              </button>
              <button class="history-remove" aria-label="删除" @click="removeHistory(kw)">
                <Icon icon="mdi:close" width="13" height="13" />
              </button>
            </div>
          </div>
          <p v-else class="empty-history">暂无搜索历史</p>
        </div>

        <!-- 搜索提示 -->
        <div class="sidebar-card tip-card">
          <div class="sidebar-header">
            <Icon icon="mdi:lightbulb-on-outline" width="18" height="18" />
            <span>搜索小贴士</span>
          </div>
          <ul class="tip-list">
            <li>支持按标题、摘要、标签全文检索</li>
            <li>关键词越简短,匹配范围越广</li>
            <li>使用热门词汇可快速定位高频内容</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-page {
  padding-bottom: $space-12;
}

// ========== 页头 + 大搜索框 ==========
.page-header {
  background: $grad-primary;
  color: #fff;
  padding: $space-10 0 $space-8;
  margin-bottom: $space-8;
  position: relative;
  overflow: hidden;

  // 背景装饰
  &::after {
    content: '';
    position: absolute;
    right: -120px;
    top: -80px;
    width: 360px;
    height: 360px;
    background: radial-gradient(circle, rgba(184, 149, 106, 0.12) 0%, transparent 60%);
    pointer-events: none;
  }
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
  margin-bottom: $space-6;
}

// 大搜索框
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: $radius-pill;
  padding: $space-2 $space-2 $space-2 $space-5;
  box-shadow: $shadow-lg;
  max-width: 800px;
  transition: box-shadow $transition-base;

  &:focus-within {
    box-shadow: 0 0 0 4px rgba(184, 149, 106, 0.25), $shadow-lg;
  }
}

.search-icon {
  color: $text-placeholder;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: $fs-md;
  color: $text-primary;
  padding: $space-2 $space-3;
  min-width: 0;

  &::placeholder {
    color: $text-placeholder;
  }
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: $text-placeholder;
  padding: $space-1;
  cursor: pointer;
  border-radius: $radius-pill;
  transition: color $transition-fast;

  &:hover {
    color: $text-secondary;
  }
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  background: $grad-gold;
  color: #fff;
  border: none;
  padding: $space-2 $space-5;
  font-size: $fs-base;
  font-weight: $fw-medium;
  border-radius: $radius-pill;
  cursor: pointer;
  transition: all $transition-fast;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: $shadow-gold;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // loading 图标旋转
  .is-loading {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

// 搜索建议下拉
.suggest-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  padding: $space-2 0;
  z-index: $z-dropdown;
  list-style: none;
  max-height: 360px;
  overflow-y: auto;
}

.suggest-item {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-5;
  color: $text-regular;
  font-size: $fs-base;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover {
    background: $bg-soft;
    color: $primary;
  }

  :deep(strong) {
    color: $gold-dark;
    font-weight: $fw-semibold;
  }
}

// ========== 主体两栏 ==========
.search-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: $space-6;
  align-items: start;
}

.search-content {
  min-width: 0;
}

// 结果统计
.result-summary {
  font-size: $fs-base;
  color: $text-secondary;
  padding: $space-3 $space-4;
  background: $bg-soft;
  border-radius: $radius-base;
  margin-bottom: $space-5;
  border-left: 3px solid $gold;
}

.result-keyword {
  color: $primary;
  font-weight: $fw-semibold;
}

.result-count {
  color: $gold-dark;
  font-weight: $fw-bold;
  font-size: $fs-md;
}

// 加载骨架
.loading-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.skeleton-item {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-sm;
}

.skeleton {
  background: linear-gradient(90deg, $bg-soft 0%, $border-lighter 50%, $bg-soft 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
  border-radius: $radius-base;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-title {
  height: 20px;
  width: 60%;
  margin-bottom: $space-3;
}

.skeleton-desc {
  height: 14px;
  width: 90%;
  margin-bottom: $space-2;
}

.skeleton-meta {
  height: 12px;
  width: 30%;
}

// 结果列表
.result-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  counter-reset: result;
}

.result-item {
  display: flex;
  gap: $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-sm;
  transition: all $transition-base;
  border: 1px solid transparent;

  &:hover {
    box-shadow: $shadow-md;
    border-color: $border-light;
    transform: translateY(-2px);

    .result-title {
      color: $primary;
    }
  }
}

.result-index {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: $radius-pill;
  background: $grad-primary-soft;
  color: $primary-dark;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $fs-md;
  font-weight: $fw-bold;
  font-family: $font-mono;
}

.result-body {
  flex: 1;
  min-width: 0;
}

.result-tags {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-2;
}

.result-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-lg;
  font-weight: $fw-semibold;
  color: $text-primary;
  line-height: $lh-snug;
  margin-bottom: $space-2;
  transition: color $transition-fast;

  :deep(svg) {
    color: $gold;
    flex-shrink: 0;
  }

  span {
    @include text-ellipsis(1);
  }
}

.result-summary {
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: $lh-relaxed;
  margin-bottom: $space-3;
  @include text-ellipsis(2);
}

.result-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: $fs-xs;
  color: $text-placeholder;

  > span {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
  }
}

.result-link {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  color: $primary;
  font-weight: $fw-medium;

  &:hover {
    gap: $space-2;
    color: $primary-dark;
  }
}

// 初始态
.initial-state {
  text-align: center;
  padding: $space-16 $space-6;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

.initial-icon {
  color: $text-placeholder;
  margin-bottom: $space-4;
}

.initial-title {
  font-size: $fs-xl;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin-bottom: $space-2;
}

.initial-desc {
  font-size: $fs-sm;
  color: $text-secondary;
}

// 空状态操作
.empty-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: $space-2;
}

.empty-tip {
  font-size: $fs-sm;
  color: $text-secondary;
  margin-right: $space-1;
}

.suggest-btn {
  padding: $space-1 $space-3;
  font-size: $fs-sm;
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
}

// ========== 侧边栏 ==========
.search-sidebar {
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

  .clear-history {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    background: transparent;
    border: none;
    color: $text-placeholder;
    font-size: $fs-xs;
    cursor: pointer;
    padding: 0;
    transition: color $transition-fast;

    &:hover {
      color: $danger;
    }
  }
}

// 热门搜索(排行榜样式)
.hot-list {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-3;
  background: transparent;
  border: none;
  border-radius: $radius-base;
  cursor: pointer;
  transition: background $transition-fast;
  text-align: left;
  width: 100%;

  &:hover {
    background: $bg-soft;
  }

  &.is-top .hot-rank {
    background: $grad-gold;
    color: #fff;
  }
}

.hot-rank {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-soft;
  color: $text-secondary;
  border-radius: $radius-sm;
  font-size: $fs-xs;
  font-weight: $fw-bold;
  font-family: $font-mono;
  transition: all $transition-fast;
}

.hot-text {
  font-size: $fs-sm;
  color: $text-regular;
}

// 搜索历史
.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-1 $space-2;
  border-radius: $radius-base;
  transition: background $transition-fast;

  &:hover {
    background: $bg-soft;

    .history-remove {
      opacity: 1;
    }
  }
}

.history-text {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  background: transparent;
  border: none;
  padding: $space-1 0;
  color: $text-regular;
  font-size: $fs-sm;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  text-align: left;

  :deep(svg) {
    color: $text-placeholder;
    flex-shrink: 0;
  }

  span {
    @include text-ellipsis(1);
  }

  &:hover {
    color: $primary;
  }
}

.history-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: $text-placeholder;
  padding: $space-1;
  cursor: pointer;
  border-radius: $radius-pill;
  opacity: 0;
  transition: all $transition-fast;

  &:hover {
    color: $danger;
    background: rgba(230, 57, 70, 0.08);
  }
}

.empty-history {
  font-size: $fs-sm;
  color: $text-placeholder;
  text-align: center;
  padding: $space-4 0;
}

// 小贴士
.tip-card {
  background: $grad-primary-soft;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: $lh-relaxed;

  li {
    position: relative;
    padding-left: $space-4;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 9px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: $gold;
    }
  }
}

// ========== 响应式 ==========
@include respond-to(md) {
  .search-main {
    grid-template-columns: 1fr;
  }

  .search-sidebar {
    position: static;
    order: 2;
  }
}

@include respond-to(xs) {
  .page-header {
    padding: $space-6 0 $space-5;
  }

  .page-title {
    font-size: $fs-2xl;
  }

  .search-box {
    padding: $space-1 $space-1 $space-1 $space-4;
  }

  .search-input {
    font-size: $fs-base;
  }

  .submit-btn {
    padding: $space-2 $space-4;

    span {
      display: none;
    }
  }

  .result-item {
    flex-direction: column;
    gap: $space-2;
  }

  .result-index {
    width: 28px;
    height: 28px;
    font-size: $fs-sm;
  }
}
</style>
