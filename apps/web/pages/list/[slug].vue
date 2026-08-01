<script setup lang="ts">
// 栏目列表页 v3.0(T4.2 通用模板)
// URL: /list/[slug]?page=1&year=2026&month=6&tag=通知
// 应用 v3.0 设计令牌:深色头部 + EmptyState + icons 字典 + 入场动画
// 数据源: useApi → /api/columns + /api/list/:slug + /api/hot-articles + /api/recommend-articles
import { icons } from '~/utils/icons'

// 列表项类型(与后端 /api/list/:slug 响应字段对齐)
interface ListItem {
  id: number
  title: string
  summary: string
  publishDate: string
  source: string
  views: number
  tags: string[]
  columnSlug: string
  columnTitle: string
  isTop: boolean
  isImportant: boolean
  hasAttachment: boolean
  url: string
}

interface ColumnItem {
  slug: string
  title: string
  parentId: string | null
  listStyle: 'card' | 'table' | 'compact' | 'gallery'
  order: number
  articleCount: number
  icon?: string
  linkUrl?: string
}

// 画廊项类型(需求 5.2:图文/视频卡片展示,与 mock GalleryItem 对齐)
interface GalleryItem {
  id: number
  columnSlug: string
  title: string
  description: string
  coverUrl: string
  videoUrl?: string
  type: 'image' | 'video'
  publishDate: string
  views: number
  url: string
}

const route = useRoute()
const router = useRouter()
const api = useApi()

// 当前栏目 slug
const slug = computed(() => route.params.slug as string)

// 从 URL query 读取筛选与分页参数(支持分享链接)
const page = computed(() => Number(route.query.page) || 1)
const year = computed(() => {
  const y = route.query.year
  return y ? Number(y) : undefined
})
const month = computed(() => {
  const m = route.query.month
  return m ? Number(m) : undefined
})
const tag = computed(() => (route.query.tag as string) || undefined)

const pageSize = 10

// ========== 数据获取 ==========
// 1. 栏目配置(SSR 预取,全局缓存,key 固定)
const { data: columnsData } = await useAsyncData('columns', () =>
  api.get<ColumnItem[]>('/columns'),
)
const columns = computed(() => columnsData.value ?? [])

// 2. 当前栏目配置
// 安全: 栏目不存在(被停用/删除/从未创建)时返回 null，由模板显示"栏目不存在"
const currentColumn = computed(
  () => columns.value.find((c) => c.slug === slug.value) || null,
)

// 栏目是否存在（停用栏目不在 /columns 返回列表中）
const columnNotFound = computed(() => !currentColumn.value)

// 2.1 链接型栏目处理：如果当前栏目有 linkUrl，重定向到外部链接
//     链接型栏目（如人才培养平台下的系统入口）不显示内容列表，直接跳转
//     SSR 和客户端均生效：直接 navigateTo 外部链接
watch(
  () => currentColumn.value?.linkUrl,
  (linkUrl) => {
    if (linkUrl) {
      // 使用 navigateTo 进行外部重定向（SSR + 客户端均生效）
      navigateTo(linkUrl, { external: true })
    }
  },
  { immediate: true },
)

// 3. 列表查询结果(随 slug/page/year/month/tag 变化自动重新获取)
const {
  data: listData,
} = await useAsyncData(
  () => `list-${slug.value}-${page.value}-${year.value ?? ''}-${month.value ?? ''}-${tag.value ?? ''}`,
  () =>
    api.get<{
      list: ListItem[]
      total: number
      page: number
      page_size: number
      filters: { years: number[]; tags: string[] }
    }>(`/list/${slug.value}`, {
      page: page.value,
      page_size: pageSize,
      year: year.value,
      month: month.value,
      tag: tag.value,
    }),
  { watch: [page, year, month, tag, slug] },
)

const listResult = computed(() => {
  // 将 /api/list/:slug 返回的驼峰字段（publishedAt/viewCount/columnName）映射回 ListItem 接口字段
  const raw = (listData.value?.list ?? []) as any[]
  return {
    list: raw.map((it) => ({
      ...it,
      publishDate: it.publishDate ?? it.publishedAt ?? '',
      views: it.views ?? it.viewCount ?? 0,
      columnTitle: it.columnTitle ?? it.columnName ?? '',
      coverUrl: it.coverUrl ?? it.coverImageUrl,
    })),
    total: listData.value?.total ?? 0,
  }
})
const filterOptions = computed(
  () => listData.value?.filters ?? { years: [], tags: [] },
)

// 事项页模板:办事指南栏目使用固定结构事项页
// 需求 5.2:办理对象→办理流程→所需材料→办理时限→联系业务及电话→相关附件
const isGuideColumn = computed(() =>
  ['guide', 'guide-student', 'guide-teacher', 'guide-visitor'].includes(slug.value),
)

// 图文画廊栏目(需求 5.2:实训室建设/实践教学基地/竞赛风采等用图文/视频卡片展示)
const isGalleryColumn = computed(() => currentColumn.value?.listStyle === 'gallery')

// 画廊数据(仅 gallery 栏目获取,独立于 /api/list/:slug)
// 需求 5.2:用卡片展示图片或视频,后端可替换为真实图文数据
const galleryPageSize = 12
const { data: galleryData } = await useAsyncData(
  () => `gallery-${slug.value}-${page.value}`,
  async () => {
    if (!isGalleryColumn.value) return { list: [], total: 0 }
    const res = await $fetch<any>(`/api/gallery/${slug.value}`, {
      params: { page: page.value, page_size: galleryPageSize },
    })
    return {
      list: (res.data?.list ?? []) as GalleryItem[],
      total: res.data?.total ?? 0,
    }
  },
  { watch: [slug, page] },
)
const galleryList = computed(() => galleryData.value?.list ?? [])
const galleryTotal = computed(() => galleryData.value?.total ?? 0)

// 事项页数据(仅 guide 类栏目获取)
// 用 $fetch 直接调用,兼容 { list: [...] } 和 { data: { list: [...] } } 两种格式
const { data: guideData } = await useAsyncData(
  () => `guide-v2-${slug.value}`,
  async () => {
    const res = await $fetch<any>(`/api/guide/${slug.value}`)
    return res.data?.list ? res.data : res
  },
  { watch: [slug] },
)
const guideList = computed(() => guideData.value?.list ?? [])

// 4. 侧边栏: 同级栏目
const sidebarColumns = computed(() => {
  const parent = currentColumn.value?.parentId
  if (parent) {
    return columns.value.filter((c) => c.parentId === parent)
  }
  return columns.value.filter((c) => c.parentId === null)
})

// 5. 侧边栏热门/推荐(SSR 预取,全局缓存)
const { data: hotArticlesData } = await useAsyncData('hot-articles', () =>
  api.get<any[]>('/hot-articles'),
)
const { data: recommendArticlesData } = await useAsyncData('recommend-articles', () =>
  api.get<any[]>('/recommend-articles'),
)
const hotArticles = computed(() => hotArticlesData.value ?? [])
const recommendArticles = computed(() => recommendArticlesData.value ?? [])

// 面包屑
const breadcrumbItems = computed(() => {
  const items = [{ title: '首页', to: '/' }]
  const col = currentColumn.value
  if (!col) {
    items.push({ title: '栏目不存在', to: '' })
    return items
  }
  if (col.parentId) {
    const parent = columns.value.find((c) => c.slug === col.parentId)
    if (parent) items.push({ title: parent.title, to: `/list/${parent.slug}` })
  }
  items.push({ title: col.title, to: '' })
  return items
})

// 更新 URL query
type QueryValue = number | string | undefined
const updateQuery = (patch: Record<string, QueryValue>) => {
  const query: Record<string, any> = { ...route.query }
  Object.keys(patch).forEach((k) => {
    const v = patch[k]
    if (v === undefined || v === null || v === '') {
      delete query[k]
    } else {
      query[k] = String(v)
    }
  })
  if (!('page' in patch)) query.page = '1'
  router.push({ query })
}

const onFilterChange = () => {
  // 由 ListFilter 的 v-model 已更新 props,筛选值通过 URL query 驱动
}
const onYearChange = (v: number | undefined) => updateQuery({ year: v })
const onMonthChange = (v: number | undefined) => updateQuery({ month: v })
const onTagChange = (v: string | undefined) => updateQuery({ tag: v })
const onPageChange = (p: number) => updateQuery({ page: p })

// SEO
useSeoMeta({
  title: () => columnNotFound.value
    ? '栏目不存在 - 深圳信息职业技术大学教务处'
    : `${currentColumn.value?.title ?? '栏目'} - 深圳信息职业技术大学教务处`,
  description: () => columnNotFound.value
    ? '该栏目不存在或已被停用'
    : `${currentColumn.value?.title ?? ''}栏目列表,支持按年度、月份、标签筛选,提供通知公告、教务管理等内容查阅`,
})
</script>

<template>
  <div class="column-page">
    <!-- 面包屑 -->
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 栏目不存在提示（停用/删除/从未创建） -->
    <div v-if="columnNotFound" class="container column-not-found">
      <div class="not-found-card">
        <Icon :icon="icons.archive" :width="64" :height="64" />
        <h2>栏目不存在</h2>
        <p>该栏目可能已被停用或删除</p>
        <NuxtLink to="/" class="back-home">返回首页</NuxtLink>
      </div>
    </div>

    <template v-else>

    <!-- 栏目头部(深色背景 + VI 主色装饰) -->
    <div class="column-header">
      <div class="container column-header-inner">
        <div class="header-icon">
          <Icon :icon="icons.archive" :width="24" :height="24" />
        </div>
        <div class="header-text">
          <h1 class="column-title">{{ currentColumn?.title }}</h1>
          <p class="column-desc">
            <template v-if="isGuideColumn">
              共
              <span class="count">{{ guideList.length }}</span>
              个事项,含办理对象、流程、材料、时限及联系方式
            </template>
            <template v-else-if="isGalleryColumn">
              共
              <span class="count">{{ galleryTotal }}</span>
              个图文/视频展示,支持分页浏览
            </template>
            <template v-else>
              共
              <span class="count">{{ listResult.total }}</span>
              条信息,支持按年度/月份/标签筛选
            </template>
          </p>
        </div>
        <span class="header-deco" aria-hidden="true" />
      </div>
    </div>

    <!-- 主体: 左侧列表 + 右侧侧边栏 -->
    <div class="container column-main">
      <div class="column-content">
        <!-- 事项页模板(办事指南,需求 5.2 固定结构) -->
        <ListGuide v-if="isGuideColumn" :items="guideList" />

        <!-- 图文画廊模板(需求 5.2:实训室建设/实践教学基地/竞赛风采) -->
        <template v-else-if="isGalleryColumn">
          <div v-if="galleryList.length" v-reveal class="column-list reveal">
            <ListGallery :items="galleryList" />
          </div>
          <div v-else class="column-empty">
            <EmptyState
              variant="empty"
              title="暂无展示内容"
              description="该栏目下暂无图文或视频资料"
            />
          </div>
          <AppPagination
            v-if="galleryTotal > galleryPageSize"
            :page="page"
            :total="galleryTotal"
            :page-size="galleryPageSize"
            @update:page="onPageChange"
          />
        </template>

        <!-- 普通列表模板 -->
        <template v-else>
          <!-- 筛选区 -->
          <ListFilter
            :year="year"
            :month="month"
            :tag="tag"
            :years="filterOptions.years"
            :tags="filterOptions.tags"
            @update:year="onYearChange"
            @update:month="onMonthChange"
            @update:tag="onTagChange"
            @change="onFilterChange"
          />

          <!-- 列表(根据栏目样式渲染) -->
          <div v-if="listResult.list.length" v-reveal class="column-list reveal">
            <ListCard v-if="currentColumn?.listStyle === 'card'" :items="listResult.list" />
            <ListTable v-else-if="currentColumn?.listStyle === 'table'" :items="listResult.list" />
            <ListCompact v-else :items="listResult.list" />
          </div>

          <!-- 空状态(使用 EmptyState 组件) -->
          <div v-else class="column-empty">
            <EmptyState
              variant="search"
              title="暂无符合条件的信息"
              description="尝试调整筛选条件,或重置筛选查看全部内容"
            >
              <template #action>
                <el-button type="primary" @click="updateQuery({})">重置筛选</el-button>
              </template>
            </EmptyState>
          </div>

          <!-- 分页 -->
          <AppPagination
            v-if="listResult.total > 0"
            :page="page"
            :total="listResult.total"
            :page-size="pageSize"
            @update:page="onPageChange"
          />
        </template>
      </div>

      <!-- 侧边栏 -->
      <div class="column-sidebar">
        <Sidebar
          :columns="sidebarColumns"
          :current-slug="slug"
          :hot="hotArticles"
          :recommend="recommendArticles"
        />
      </div>
    </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.column-page {
  padding-bottom: $space-10;
}

// 栏目不存在
.column-not-found {
  display: flex;
  justify-content: center;
  padding: $space-16 0;

  .not-found-card {
    text-align: center;
    max-width: 400px;

    :deep(svg) {
      color: $text-secondary;
      margin-bottom: $space-4;
    }

    h2 {
      font-size: $fs-xl;
      font-weight: $fw-semibold;
      color: $text-primary;
      margin-bottom: $space-2;
    }

    p {
      font-size: $fs-sm;
      color: $text-secondary;
      margin-bottom: $space-6;
    }

    .back-home {
      display: inline-block;
      padding: $space-2 $space-6;
      background: $primary;
      color: #fff;
      border-radius: $radius-base;
      font-size: $fs-sm;
      transition: background $transition-fast;

      &:hover {
        background: $primary-dark;
      }
    }
  }
}

// 栏目头部:深色背景 + VI 主色装饰
.column-header {
  background: $primary-dark;
  padding: $space-3 0;
  margin-bottom: $space-4;
  position: relative;
  overflow: hidden;
}

.column-header-inner {
  display: flex;
  align-items: center;
  gap: $space-3;
  position: relative;
  z-index: $z-base;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: $radius-base;
  background: rgba(0, 115, 189, 0.15); // VI 主色半透明
  color: $primary-light;
  border: 1px solid rgba(0, 115, 189, 0.3); // VI 主色半透明边框
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.column-title {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $text-inverse;
  margin: 0 0 $space-1;
  letter-spacing: 1px;
}

.column-desc {
  font-size: $fs-sm;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;

  .count {
    color: $primary-light;
    font-weight: $fw-semibold;
    font-family: $font-serif;
    font-size: $fs-md;
  }
}

// 右侧 VI 主色装饰线
.header-deco {
  position: absolute;
  right: $space-5;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: $primary;
  border-radius: $radius-pill;
  opacity: 0.6;

  @include respond-to(xs) {
    display: none;
  }
}

.column-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: $space-6;
  align-items: start;
}

.column-content {
  min-width: 0;
}

.column-list {
  min-height: 400px;
}

.column-empty {
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
}

// 平板: 侧边栏移到下方
@include respond-to(md) {
  .column-main {
    grid-template-columns: 1fr;
  }

  .column-sidebar {
    order: 2;
  }
}

// 移动端: 头部图标缩小
@include respond-to(xs) {
  .column-header {
    padding: $space-5 0;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }

  .column-title {
    font-size: $fs-2xl;
  }
}
</style>
