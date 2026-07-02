<script setup lang="ts">
// 栏目列表页 v3.0(T4.2 通用模板)
// URL: /list/[slug]?page=1&year=2026&month=6&tag=通知
// 应用 v3.0 设计令牌:深色头部 + EmptyState + icons 字典 + 入场动画
import { columns, queryList, getFilterOptions, hotArticles, recommendArticles } from '~/mock/data'
import { icons } from '~/utils/icons'
import { useRevealAnimation } from '~/composables/useRevealAnimation'

const route = useRoute()
const router = useRouter()

// 滚动揭示动画
const { vReveal } = useRevealAnimation()

// 当前栏目 slug
const slug = computed(() => route.params.slug as string)

// 当前栏目配置
const currentColumn = computed(() => columns.find((c) => c.slug === slug.value) || columns[0])

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

// 列表查询结果(同步 mock)
const listResult = computed(() =>
  queryList({
    columnSlug: slug.value,
    page: page.value,
    pageSize,
    year: year.value,
    month: month.value,
    tag: tag.value,
  }),
)

// 筛选选项(根据栏目动态生成)
const filterOptions = computed(() => getFilterOptions(slug.value))

// 侧边栏: 同级栏目
const sidebarColumns = computed(() => {
  const parent = currentColumn.value.parentId
  if (parent) {
    return columns.filter((c) => c.parentId === parent)
  }
  return columns.filter((c) => c.parentId === null)
})

// 面包屑
const breadcrumbItems = computed(() => {
  const items = [{ title: '首页', to: '/' }]
  const col = currentColumn.value
  if (col.parentId) {
    const parent = columns.find((c) => c.slug === col.parentId)
    if (parent) items.push({ title: parent.title, to: `/list/${parent.slug}` })
  }
  items.push({ title: col.title })
  return items
})

// 更新 URL query
type QueryValue = number | string | undefined
const updateQuery = (patch: Record<string, QueryValue>) => {
  const query: Record<string, string> = { ...route.query }
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
  title: () => `${currentColumn.value.title} - 深圳信息职业技术大学教务处`,
  description: () =>
    `${currentColumn.value.title}栏目列表,支持按年度、月份、标签筛选,提供通知公告、教务管理等内容查阅`,
})
</script>

<template>
  <div class="column-page">
    <!-- 面包屑 -->
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 栏目头部(深色渐变 + 金色装饰) -->
    <div class="column-header">
      <div class="container column-header-inner">
        <div class="header-icon">
          <Icon :icon="icons.archive" :width="32" :height="32" />
        </div>
        <div class="header-text">
          <h1 class="column-title">{{ currentColumn.title }}</h1>
          <p class="column-desc">
            共
            <span class="count">{{ listResult.total }}</span>
            条信息,支持按年度/月份/标签筛选
          </p>
        </div>
        <span class="header-deco" aria-hidden="true" />
      </div>
    </div>

    <!-- 主体: 左侧列表 + 右侧侧边栏 -->
    <div class="container column-main">
      <div class="column-content">
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
          <ListCard v-if="currentColumn.listStyle === 'card'" :items="listResult.list" />
          <ListTable v-else-if="currentColumn.listStyle === 'table'" :items="listResult.list" />
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
          v-if="listResult.total > pageSize"
          :page="page"
          :total="listResult.total"
          :page-size="pageSize"
          @update:page="onPageChange"
        />
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
  </div>
</template>

<style lang="scss" scoped>
.column-page {
  padding-bottom: $space-10;
}

// 栏目头部:深色渐变 + 金色装饰
.column-header {
  background: $grad-dark;
  padding: $space-6 0;
  margin-bottom: $space-5;
  position: relative;
  overflow: hidden;
}

.column-header-inner {
  display: flex;
  align-items: center;
  gap: $space-4;
  position: relative;
  z-index: $z-base;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: $radius-lg;
  background: rgba(184, 149, 106, 0.15);
  color: $gold-light;
  border: 1px solid rgba(184, 149, 106, 0.3);
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.column-title {
  font-size: $fs-3xl;
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
    color: $gold-light;
    font-weight: $fw-semibold;
    font-family: $font-serif;
    font-size: $fs-md;
  }
}

// 右侧金色装饰线
.header-deco {
  position: absolute;
  right: $space-5;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: $grad-gold;
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
