<script setup lang="ts">
// 栏目列表页(T4.2 通用模板)
// URL: /list/[slug]?page=1&year=2026&month=6&tag=通知
// 支持: 栏目配置样式(card/table/compact) + 筛选(年度/月份/标签) + 分页 + 置顶加红 + 空状态 + 侧边栏
// URL query 可分享: 筛选/分页变化时同步更新 URL
import { columns, queryList, getFilterOptions, hotArticles, recommendArticles } from '~/mock/data'

const route = useRoute()
const router = useRouter()

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

// 侧边栏: 同级栏目(若当前为子栏目,显示兄弟栏目;否则显示所有顶层栏目)
const sidebarColumns = computed(() => {
  const parent = currentColumn.value.parent
  if (parent) {
    return columns.filter((c) => c.parent === parent)
  }
  return columns.filter((c) => c.parent === null)
})

// 面包屑
const breadcrumbItems = computed(() => {
  const items = [{ title: '首页', to: '/' }]
  const col = currentColumn.value
  if (col.parent) {
    const parent = columns.find((c) => c.slug === col.parent)
    if (parent) items.push({ title: parent.title, to: `/list/${parent.slug}` })
  }
  items.push({ title: col.title })
  return items
})

// 更新 URL query(筛选/分页变化时调用,保持可分享)
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
  // 筛选变化时重置页码
  if (!('page' in patch)) query.page = '1'
  router.push({ query })
}

// 筛选事件处理
const onFilterChange = () => {
  // 由 ListFilter 的 v-model 已更新 props,这里只需重置页码
  // 实际筛选值通过 URL query 驱动,需手动同步
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

    <!-- 栏目头部 -->
    <div class="column-header">
      <div class="container">
        <h1 class="column-title">
          <Icon icon="mdi:folder-open-outline" />
          {{ currentColumn.title }}
        </h1>
        <p class="column-desc">共 {{ listResult.total }} 条信息,支持按年度/月份/标签筛选</p>
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
        <div v-if="listResult.list.length" class="column-list">
          <ListCard v-if="currentColumn.listStyle === 'card'" :items="listResult.list" />
          <ListTable v-else-if="currentColumn.listStyle === 'table'" :items="listResult.list" />
          <ListCompact v-else :items="listResult.list" />
        </div>

        <!-- 空状态 -->
        <el-empty v-else description="暂无符合条件的信息">
          <el-button type="primary" plain @click="updateQuery({})">重置筛选</el-button>
        </el-empty>

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
  padding-bottom: 40px;
}

.column-header {
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  color: #fff;
  padding: 24px 0;
  margin-bottom: 20px;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px;

  :deep(svg) {
    font-size: 28px;
  }
}

.column-desc {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}

.column-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}

.column-content {
  min-width: 0;
}

.column-list {
  min-height: 400px;
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

// 适老化
:global([data-color-mode='elderly']) {
  .column-title {
    font-size: 26px;
  }

  .column-desc {
    font-size: 15px;
  }
}
</style>
