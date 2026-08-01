<script setup lang="ts">
// 搜索页(T4.10)
const route = useRoute()
const router = useRouter()

useSeoMeta({
  title: '搜索 - 深圳信息职业技术大学教务处',
  description: '搜索教务处通知、新闻、办事指南等内容',
})

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '搜索' },
]

const hotKeywords = ref<string[]>([])
const keyword = ref((route.query.q as string) || '')
const searchedKeyword = ref('')
const results = ref<any[]>([])
const suggestions = ref<string[]>([])
const isSearching = ref(false)
const hasSearched = ref(false)
const selectedColumn = ref<string>('')
const searchHistory = ref<string[]>([])

const filteredResults = computed(() => {
  if (!selectedColumn.value) return results.value
  return results.value.filter((r) => r.columnSlug === selectedColumn.value)
})

const columnOptions = computed(() => {
  const set = new Map<string, string>()
  results.value.forEach((r) => {
    if (r.columnSlug && r.columnTitle) set.set(r.columnSlug, r.columnTitle)
  })
  return Array.from(set.entries()).map(([slug, title]) => ({ slug, title }))
})

const doSearch = async (kw?: string) => {
  const finalKw = (kw ?? keyword.value).trim()
  if (!finalKw) return
  isSearching.value = true
  hasSearched.value = true
  selectedColumn.value = ''
  try {
    const api = useApi()
    const res = await api.get<{ list: any[] }>('/search', { q: finalKw })
    results.value = res?.list ?? []
    searchedKeyword.value = finalKw
    if (import.meta.client) {
      router.replace({ path: '/search', query: { q: finalKw } })
    }
  } catch {
    results.value = []
    searchedKeyword.value = finalKw
  } finally {
    isSearching.value = false
  }
}

const onInput = async () => {
  const kw = keyword.value.trim()
  if (!kw) { suggestions.value = []; return }
  try {
    const api = useApi()
    suggestions.value = await api.get<string[]>('/search/suggestions', { q: kw })
  } catch { suggestions.value = [] }
}

const onPickSuggestion = (s: string) => {
  keyword.value = s
  suggestions.value = []
  doSearch(s)
}

const onSubmit = () => {
  suggestions.value = []
  doSearch()
}

const onHotKeyword = (kw: string) => {
  keyword.value = kw
  doSearch(kw)
}

const onClear = () => {
  keyword.value = ''
  suggestions.value = []
  results.value = []
  hasSearched.value = false
  searchedKeyword.value = ''
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
}

onMounted(async () => {
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem('jwc_search_history')
      if (raw) searchHistory.value = JSON.parse(raw) || []
    } catch { /* ignore */ }
  }
  try {
    const api = useApi()
    hotKeywords.value = await api.get<string[]>('/hot-keywords')
  } catch { hotKeywords.value = [] }
  if (keyword.value) doSearch()
})

watch(() => route.query.q, (q) => {
  const next = (q as string) || ''
  if (next && next !== keyword.value) {
    keyword.value = next
    doSearch(next)
  }
})
</script>

<template>
  <div class="search-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:magnify" />
          全站搜索
        </h1>
        <p class="page-subtitle">Search</p>

        <div class="search-box">
          <Icon icon="mdi:magnify" class="search-icon" width="22" height="22" />
          <input
            v-model="keyword"
            type="text"
            class="search-input"
            placeholder="搜索通知、新闻、办事指南、表格下载..."
            @input="onInput"
            @keyup.enter="onSubmit"
          />
          <button v-if="keyword" class="clear-btn" @click="onClear">
            <Icon icon="mdi:close-circle" width="20" height="20" />
          </button>
          <button class="submit-btn" :disabled="isSearching" @click="onSubmit">
            <Icon v-if="isSearching" icon="mdi:loading" width="18" height="18" />
            <Icon v-else icon="mdi:arrow-right" width="18" height="18" />
            <span>搜索</span>
          </button>

          <ul v-if="suggestions.length" class="suggest-list">
            <li v-for="(s, i) in suggestions" :key="i" class="suggest-item" @click="onPickSuggestion(s)">
              <Icon icon="mdi:magnify" width="14" height="14" />
              <span>{{ s }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="container search-main">
      <div class="search-content">
        <div v-if="hasSearched && !isSearching" class="result-info">
          <span>关于「<strong>{{ searchedKeyword }}</strong>」共找到 <strong>{{ results.length }}</strong> 条结果</span>
        </div>

        <div v-if="hasSearched && !isSearching && results.length" class="filter-bar">
          <span class="filter-label">按栏目筛选:</span>
          <button class="filter-chip" :class="{ active: !selectedColumn }" @click="selectedColumn = ''">全部</button>
          <button
            v-for="opt in columnOptions"
            :key="opt.slug"
            class="filter-chip"
            :class="{ active: selectedColumn === opt.slug }"
            @click="selectedColumn = selectedColumn === opt.slug ? '' : opt.slug"
          >{{ opt.title }}</button>
        </div>

        <div v-if="isSearching" class="loading-list">
          <div v-for="i in 4" :key="i" class="loading-item">
            <div class="loading-line loading-title"></div>
            <div class="loading-line loading-desc"></div>
          </div>
        </div>

        <ol v-else-if="filteredResults.length" class="result-list">
          <li v-for="(item, idx) in filteredResults" :key="item.id" class="result-item">
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
              <p class="result-desc">{{ item.summary }}</p>
              <div class="result-meta">
                <span><Icon icon="mdi:calendar-outline" width="13" height="13" />{{ item.publishDate }}</span>
                <NuxtLink :to="item.url" class="result-link">查看详情<Icon icon="mdi:arrow-right" width="13" height="13" /></NuxtLink>
              </div>
            </div>
          </li>
        </ol>

        <EmptyState
          v-else-if="hasSearched"
          variant="search"
          :title="results.length === 0 ? (selectedColumn ? '该栏目暂无相关结果' : '未找到相关结果') : ''"
          :description="results.length === 0 ? (selectedColumn ? '尝试选择其他栏目,或清除筛选条件' : '请尝试更换关键词,或使用更简短的词汇') : ''"
        >
          <template #action>
            <div class="empty-actions">
              <button v-if="selectedColumn" class="suggest-btn" @click="selectedColumn = ''">清除筛选</button>
              <button
                v-for="kw in hotKeywords.slice(0, 4)"
                :key="kw"
                class="suggest-btn"
                @click="onHotKeyword(kw)"
              >{{ kw }}</button>
            </div>
          </template>
        </EmptyState>

        <div v-else class="initial-state">
          <div class="initial-icon"><Icon icon="mdi:feature-search-outline" width="80" height="80" /></div>
          <h3 class="initial-title">输入关键词开始搜索</h3>
          <p class="initial-desc">支持搜索通知公告、新闻资讯、办事指南、表格下载等全部内容</p>
        </div>
      </div>

      <aside class="search-sidebar">
        <div class="sidebar-card">
          <div class="sidebar-header"><Icon icon="mdi:fire" width="18" height="18" /><span>热门搜索</span></div>
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

        <div class="sidebar-card">
          <div class="sidebar-header">
            <Icon icon="mdi:history" width="18" height="18" />
            <span>搜索历史</span>
            <button v-if="searchHistory.length" class="clear-history" @click="clearHistory">
              <Icon icon="mdi:trash-can-outline" width="14" height="14" />清空
            </button>
          </div>
          <div v-if="searchHistory.length" class="history-list">
            <div v-for="kw in searchHistory" :key="kw" class="history-item">
              <button class="history-text" @click="onHotKeyword(kw)">
                <Icon icon="mdi:clock-time-four-outline" width="13" height="13" />{{ kw }}
              </button>
              <button class="history-remove" @click="removeHistory(kw)">
                <Icon icon="mdi:close" width="13" height="13" />
              </button>
            </div>
          </div>
          <p v-else class="empty-history">暂无搜索历史</p>
        </div>

        <div class="sidebar-card tip-card">
          <div class="sidebar-header"><Icon icon="mdi:lightbulb-on-outline" width="18" height="18" /><span>搜索小贴士</span></div>
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
.search-page { padding-bottom: $space-12; }

.page-header {
  background: $primary;
  color: #fff;
  padding: $space-10 0 $space-8;
  margin-bottom: $space-8;
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    right: -120px; top: -80px;
    width: 360px; height: 360px;
    background: rgba(0, 115, 189, 0.06);
    pointer-events: none;
  }
}

.page-title {
  display: flex; align-items: center; gap: $space-3;
  font-size: $fs-4xl; font-weight: $fw-bold; margin-bottom: $space-2;
}

.page-subtitle { font-size: $fs-sm; opacity: 0.8; letter-spacing: 2px; margin-bottom: $space-6; }

.search-box {
  position: relative; display: flex; align-items: center;
  background: #fff; border-radius: $radius-pill;
  padding: $space-2 $space-2 $space-2 $space-5;
  box-shadow: $shadow-sm; max-width: 800px;
}

.search-icon { color: $text-placeholder; flex-shrink: 0; :deep(svg) { color: #fff; } }

.search-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: $fs-md; color: $text-primary;
  padding: $space-2 $space-3; min-width: 0;
  &::placeholder { color: $text-placeholder; }
}

.clear-btn {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: $text-placeholder;
  padding: $space-1; cursor: pointer; border-radius: $radius-pill;
  &:hover { color: $text-secondary; }
}

.submit-btn {
  display: inline-flex; align-items: center; gap: $space-1;
  background: $primary; color: #fff; border: none;
  padding: $space-2 $space-5; font-size: $fs-base; font-weight: $fw-medium;
  border-radius: $radius-pill; cursor: pointer; transition: all $transition-fast;
  &:hover:not(:disabled) { box-shadow: $shadow-primary; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.suggest-list {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0;
  background: #fff; border-radius: $radius-lg; box-shadow: $shadow-sm;
  padding: $space-2 0; z-index: $z-dropdown; list-style: none;
  max-height: 360px; overflow-y: auto;
}

.suggest-item {
  display: flex; align-items: center; gap: $space-2;
  padding: $space-2 $space-5; color: $text-regular; font-size: $fs-base;
  cursor: pointer;
  &:hover { background: $bg-soft; color: $primary; }
}

.search-main { display: grid; grid-template-columns: 1fr 300px; gap: $space-6; align-items: start; }
.search-content { min-width: 0; }

.result-info {
  font-size: $fs-base; color: $text-secondary;
  padding: $space-3 $space-4; background: $bg-soft;
  border-radius: $radius-base; margin-bottom: $space-5;
  border-left: 3px solid $primary;
  strong { color: $primary; font-weight: $fw-semibold; }
}

.loading-list { display: flex; flex-direction: column; gap: $space-4; }
.loading-item { background: $bg-card; border-radius: $radius-lg; padding: $space-5; box-shadow: $shadow-sm; }
.loading-line { background: $bg-soft; border-radius: $radius-base; }
.loading-title { height: 20px; width: 60%; margin-bottom: $space-3; }
.loading-desc { height: 14px; width: 90%; margin-bottom: $space-2; }

.filter-bar { display: flex; align-items: center; gap: $space-3; padding: $space-3 $space-4; background: $bg-soft; border-radius: $radius-base; margin-bottom: $space-4; flex-wrap: wrap; }
.filter-label { font-size: $fs-sm; color: $text-secondary; font-weight: 500; flex-shrink: 0; }
.filter-chip { display: inline-flex; align-items: center; padding: 4px 12px; font-size: $fs-sm; color: $text-secondary; background: $bg-card; border: 1px solid $border-lighter; border-radius: $radius-pill; cursor: pointer; transition: all $transition-fast; &:hover { color: $primary; border-color: $primary-light; } &.active { color: #fff; background: $primary; border-color: $primary; } }

.result-list { list-style: none; display: flex; flex-direction: column; gap: $space-4; }

.result-item {
  display: flex; gap: $space-4; background: $bg-card;
  border-radius: $radius-lg; padding: $space-5; box-shadow: $shadow-sm;
  border: 1px solid transparent; transition: all $transition-base;
  &:hover { box-shadow: $shadow-sm; border-color: $border-light; }
}

.result-index {
  flex-shrink: 0; width: 32px; height: 32px;
  border-radius: $radius-pill; background: $primary-bg; color: $primary-dark;
  display: flex; align-items: center; justify-content: center;
  font-size: $fs-md; font-weight: $fw-bold; font-family: $font-mono;
}

.result-body { flex: 1; min-width: 0; }
.result-tags { display: flex; gap: $space-2; margin-bottom: $space-2; }

.result-title {
  display: flex; align-items: center; gap: $space-2;
  font-size: $fs-lg; font-weight: $fw-semibold; color: $text-primary;
  line-height: $lh-snug; margin-bottom: $space-2;
}

.result-desc { font-size: $fs-sm; color: $text-secondary; line-height: $lh-relaxed; margin-bottom: $space-3; }
.result-meta { display: flex; align-items: center; justify-content: space-between; font-size: $fs-xs; color: $text-placeholder; }
.result-meta > span { display: inline-flex; align-items: center; gap: $space-1; }
.result-link { display: inline-flex; align-items: center; gap: $space-1; color: $primary; font-weight: $fw-medium; }

.initial-state { text-align: center; padding: $space-16 $space-6; background: $bg-card; border-radius: $radius-lg; box-shadow: $shadow-sm; }
.initial-icon { color: $text-placeholder; margin-bottom: $space-4; }
.initial-title { font-size: $fs-xl; font-weight: $fw-semibold; color: $text-primary; margin-bottom: $space-2; }
.initial-desc { font-size: $fs-sm; color: $text-secondary; }

.empty-actions { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: $space-2; }
.suggest-btn {
  padding: $space-1 $space-3; font-size: $fs-sm; color: $text-regular;
  background: $bg-soft; border: 1px solid $border-lighter; border-radius: $radius-pill;
  cursor: pointer;
}

.search-sidebar { display: flex; flex-direction: column; gap: $space-5; }
.sidebar-card { background: $bg-card; border-radius: $radius-lg; padding: $space-5; box-shadow: $shadow-sm; }

.sidebar-header {
  display: flex; align-items: center; gap: $space-2;
  font-size: $fs-md; font-weight: $fw-semibold; color: $text-primary;
  margin-bottom: $space-4; padding-bottom: $space-3; border-bottom: 1px solid $border-lighter;
  .clear-history {
    margin-left: auto; display: inline-flex; align-items: center; gap: $space-1;
    background: transparent; border: none; color: $text-placeholder; font-size: $fs-xs;
    cursor: pointer;
  }
}

.hot-list { display: flex; flex-direction: column; gap: $space-1; }
.hot-item {
  display: flex; align-items: center; gap: $space-3;
  padding: $space-2 $space-3; background: transparent; border: none;
  border-radius: $radius-base; cursor: pointer; text-align: left; width: 100%;
  &.is-top .hot-rank { background: $primary; color: #fff; }
}
.hot-rank { width: 20px; height: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: $bg-soft; color: $text-secondary; border-radius: $radius-sm; font-size: $fs-xs; font-weight: $fw-bold; font-family: $font-mono; }
.hot-text { font-size: $fs-sm; color: $text-regular; }

.history-list { display: flex; flex-direction: column; gap: $space-1; }
.history-item { display: flex; align-items: center; justify-content: space-between; gap: $space-2; padding: $space-1 $space-2; border-radius: $radius-base; }
.history-text { display: inline-flex; align-items: center; gap: $space-2; background: transparent; border: none; padding: $space-1 0; color: $text-regular; font-size: $fs-sm; cursor: pointer; flex: 1; min-width: 0; text-align: left; }
.history-remove { display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; color: $text-placeholder; padding: $space-1; cursor: pointer; border-radius: $radius-pill; }
.empty-history { font-size: $fs-sm; color: $text-placeholder; text-align: center; padding: $space-4 0; }

.tip-card { background: $primary-bg; }
.tip-list { display: flex; flex-direction: column; gap: $space-2; font-size: $fs-sm; color: $text-secondary; line-height: $lh-relaxed; }
.tip-list li { position: relative; padding-left: $space-4; }

@include respond-to(md) {
  .search-main { grid-template-columns: 1fr; }
  .search-sidebar { order: 2; }
}
@include respond-to(xs) {
  .page-header { padding: $space-6 0 $space-5; }
  .page-title { font-size: $fs-2xl; }
}
</style>
