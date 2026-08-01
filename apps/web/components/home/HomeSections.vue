<template>
  <section
    v-reveal
    class="home-sections reveal"
    aria-labelledby="sections-title"
  >
    <h2 id="sections-title" class="sr-only">业务板块</h2>

    <!-- Tab 切换头(通知公告/教务动态/一流育人体系/办事指南) -->
    <div class="sections-header" role="tablist" aria-label="业务板块切换">
      <button
        v-for="tab in tabs"
        :id="`section-tab-${tab.key}`"
        :key="tab.key"
        type="button"
        class="section-tab"
        :class="{ active: activeTab === tab.key }"
        role="tab"
        :aria-selected="activeTab === tab.key ? 'true' : 'false'"
        @click="activeTab = tab.key"
      >
        <Icon :icon="tab.icon" :width="18" :height="18" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- 内容区:当前栏目最新文章列表 -->
    <div class="sections-body">
      <Transition name="tab-fade" mode="out-in">
        <ul :key="activeTab" class="section-list">
          <li v-for="item in currentList" :key="item.id" class="section-item">
            <NuxtLink :to="`/article/${item.id}`" class="section-link">
              <span class="item-date">
                <span class="date-day">{{ item.publishDate.slice(8) }}</span>
                <span class="date-month">{{ item.publishDate.slice(0, 7) }}</span>
              </span>
              <div class="item-main">
                <h4 class="item-title">{{ item.title }}</h4>
                <p class="item-summary">{{ item.summary }}</p>
              </div>
              <Icon :icon="icons.chevronRight" class="item-arrow" :width="18" :height="18" />
            </NuxtLink>
          </li>
        </ul>
      </Transition>

      <!-- 空状态 -->
      <div v-if="!currentList.length" class="section-empty">
        <EmptyState
          variant="empty"
          :title="`暂无${currentTabLabel}内容`"
          description="内容加载中,请稍后访问"
        />
      </div>

      <!-- 查看更多 -->
      <div class="sections-footer">
        <NuxtLink :to="`/list/${activeTab}`" class="section-more">
          查看更多{{ currentTabLabel }}内容
          <Icon :icon="icons.arrowRight" :width="14" :height="14" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// HomeSections v5.0: D 区业务四栏切换（修订版）
// 对齐修订版需求文档首页 D 区:通知公告/教务动态/一流育人体系/办事指南 四栏切换,展示各栏目最新内容
// 数据源: useApi → /api/list/:slug（SSR 预取四个栏目各前 6 条）
import { icons } from '~/utils/icons'

const api = useApi()
// 四个业务栏目并行预取(对齐修订版需求文档 D 区四栏)
const { data: noticesData } = await useAsyncData('home-section-notices', () =>
  api.get<{ list: any[] }>('/list/notices?page_size=6'),
)
const { data: newsData } = await useAsyncData('home-section-news', () =>
  api.get<{ list: any[] }>('/list/news?page_size=6'),
)
const { data: firstClassData } = await useAsyncData('home-section-first-class', () =>
  api.get<{ list: any[] }>('/list/first-class-education?page_size=6'),
)
const { data: guideData } = await useAsyncData('home-section-guide', () =>
  api.get<{ list: any[] }>('/list/guide?page_size=6'),
)

const tabs = [
  { key: 'notices' as const, label: '通知公告', icon: icons.notice },
  { key: 'news' as const, label: '教务动态', icon: icons.news },
  { key: 'first-class-education' as const, label: '一流育人体系', icon: icons.cap },
  { key: 'guide' as const, label: '办事指南', icon: icons.guide },
]

const activeTab = ref<'notices' | 'news' | 'first-class-education' | 'guide'>('notices')

const currentList = computed(() => {
  const map = {
    notices: noticesData.value?.list ?? [],
    news: newsData.value?.list ?? [],
    'first-class-education': firstClassData.value?.list ?? [],
    guide: guideData.value?.list ?? [],
  }
  return map[activeTab.value]
})

const currentTabLabel = computed(() => tabs.find((t) => t.key === activeTab.value)?.label ?? '')
</script>

<style lang="scss" scoped>
// 屏幕阅读器专用(视觉隐藏)
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.home-sections {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-sm;
}

// ========== Tab 切换头 ==========
.sections-header {
  display: flex;
  gap: $space-1;
  border-bottom: 1px solid $border-lighter;
  margin-bottom: $space-5;
}

.section-tab {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-5;
  font-size: $fs-md;
  font-weight: $fw-medium;
  color: $text-secondary;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  transition: all $transition-fast;
  position: relative;
  margin-bottom: -1px;
  cursor: pointer;

  &:hover {
    color: $primary;
  }

  &.active {
    color: $primary;
    border-bottom-color: $primary;
    font-weight: $fw-semibold;
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: -2px;
    border-radius: $radius-base;
  }
}

// ========== 内容列表 ==========
.section-list {
  list-style: none;
  margin: 0;
  padding: 0;
  min-height: 300px;
}

.section-item {
  border-bottom: 1px dashed $border-lighter;

  &:last-child {
    border-bottom: none;
  }
}

.section-link {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-3 $space-2;
  border-radius: $radius-base;
  transition: all $transition-fast;

  &:hover {
    background: $bg-soft;

    .item-title {
      color: $primary;
    }

    .item-arrow {
      opacity: 1;
      transform: translateX(0);
      color: $primary;
    }
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

// 日期块
.item-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  flex-shrink: 0;
  padding: $space-2;
  background: $primary-bg;
  border-radius: $radius-base;
  color: $primary-dark;

  .date-day {
    font-size: $fs-xl;
    font-weight: $fw-bold;
    line-height: 1;
    font-family: $font-serif;
  }

  .date-month {
    font-size: $fs-xs;
    color: $text-secondary;
    margin-top: 2px;
  }
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: $fs-base;
  font-weight: $fw-medium;
  color: $text-primary;
  margin: 0 0 $space-1;
  transition: color $transition-fast;
  // 单行省略
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-summary {
  font-size: $fs-sm;
  color: $text-secondary;
  margin: 0;
  // 两行省略
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-arrow {
  flex-shrink: 0;
  color: $text-placeholder;
  opacity: 0;
  transform: translateX(-4px);
  transition: all $transition-fast;
}

// 空状态
.section-empty {
  padding: $space-8 0;
}

// 底部"查看更多"
.sections-footer {
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: 1px solid $border-lighter;
  text-align: center;
}

.section-more {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-5;
  font-size: $fs-sm;
  color: $primary;
  border: 1px solid $primary;
  border-radius: $radius-pill;
  transition: all $transition-fast;

  &:hover {
    background: $primary;
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

// Tab 切换过渡
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: all 0.2s $ease-out-expo;
}
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// 移动端
@include respond-to(xs) {
  .home-sections {
    padding: $space-5 $space-4;
  }

  .sections-header {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    .section-tab {
      padding: $space-2 $space-3;
      font-size: $fs-sm;
      white-space: nowrap;
    }
  }

  .section-link {
    gap: $space-2;
  }

  .item-date {
    width: 44px;
    padding: $space-1;

    .date-day {
      font-size: $fs-md;
    }
  }
}
</style>
