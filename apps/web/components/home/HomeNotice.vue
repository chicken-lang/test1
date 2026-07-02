<template>
  <section
    v-reveal
    class="home-notice reveal"
    aria-labelledby="notice-title"
  >
    <!-- 区块标题(中英文对照) -->
    <div class="section-header">
      <div class="section-title-group">
        <span id="notice-title" class="title-cn">通知公告</span>
        <span class="title-en">Information</span>
      </div>
      <NuxtLink to="/list/notices" class="section-more" aria-label="查看更多通知公告">
        更多
        <Icon :icon="icons.arrowRight" :width="14" :height="14" />
      </NuxtLink>
    </div>

    <!-- 自定义 Tab(学生/教师)ARIA 适配 -->
    <div class="notice-tabs">
      <div class="tabs-header" role="tablist" aria-label="通知公告分类">
        <button
          v-for="tab in tabs"
          :id="`tab-${tab.key}`"
          :key="tab.key"
          ref="tabRefs"
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          role="tab"
          :aria-selected="activeTab === tab.key ? 'true' : 'false'"
          :aria-controls="`panel-${tab.key}`"
          :tabindex="activeTab === tab.key ? 0 : -1"
          @click="activeTab = tab.key"
          @keydown="onTabKeydown"
        >
          <Icon :icon="tab.icon" :width="16" :height="16" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <div
        v-for="tab in tabs"
        :id="`panel-${tab.key}`"
        :key="tab.key"
        role="tabpanel"
        :aria-labelledby="`tab-${tab.key}`"
        :hidden="activeTab !== tab.key"
        :tabindex="activeTab === tab.key ? 0 : -1"
      >
        <Transition name="tab-fade" mode="out-in">
          <ul v-if="activeTab === tab.key" :key="tab.key" class="notice-list">
            <li v-for="item in currentList" :key="item.id" class="notice-item">
              <NuxtLink :to="`/article/${item.id}`" class="notice-link">
                <span class="notice-date">
                  <span class="date-day">{{ item.publishDate.slice(8) }}</span>
                  <span class="date-month">{{ item.publishDate.slice(0, 7) }}</span>
                </span>
                <div class="notice-main">
                  <div class="notice-tags">
                    <span v-if="item.isTop" class="tag-top">置顶</span>
                    <span v-if="item.isImportant" class="tag-important">重要</span>
                  </div>
                  <h4 class="notice-title" :class="{ important: item.isImportant }">
                    {{ item.title }}
                  </h4>
                  <p class="notice-summary">{{ item.summary }}</p>
                </div>
                <Icon :icon="icons.chevronRight" class="notice-arrow" :width="18" :height="18" />
              </NuxtLink>
            </li>
          </ul>
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// HomeNotice v3.0: ARIA tablist + 键盘导航 + Tab 过渡 + icons 字典 + v-reveal
import { studentNotices, teacherNotices } from '~/mock/data'
import { icons } from '~/utils/icons'

const tabs = [
  { key: 'student' as const, label: '学生通知', icon: icons.student },
  { key: 'teacher' as const, label: '教师通知', icon: icons.teacher },
]

const activeTab = ref<'student' | 'teacher'>('student')

// Tab 按钮引用(用于键盘导航聚焦)
const tabRefs = ref<HTMLButtonElement[]>([])

const currentList = computed(() =>
  activeTab.value === 'student' ? studentNotices : teacherNotices,
)

// Tab 键盘导航:← → 切换,Home/End 跳首尾
const onTabKeydown = (e: KeyboardEvent) => {
  const idx = tabs.findIndex((t) => t.key === activeTab.value)
  if (idx === -1) return

  let nextIdx = idx
  switch (e.key) {
    case 'ArrowRight':
      nextIdx = (idx + 1) % tabs.length
      break
    case 'ArrowLeft':
      nextIdx = (idx - 1 + tabs.length) % tabs.length
      break
    case 'Home':
      nextIdx = 0
      break
    case 'End':
      nextIdx = tabs.length - 1
      break
    default:
      return
  }

  e.preventDefault()
  activeTab.value = tabs[nextIdx].key
  // 聚焦到新激活的 Tab 按钮
  nextTick(() => {
    tabRefs.value[nextIdx]?.focus()
  })
}
</script>

<style lang="scss" scoped>
.home-notice {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-sm;
}

// Tab 头
.tabs-header {
  display: flex;
  gap: $space-1;
  border-bottom: 1px solid $border-lighter;
  margin-bottom: $space-4;
}

.tab-btn {
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
    border-radius: $radius-sm;
  }
}

// 列表
.notice-list {
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

.notice-item {
  border-bottom: 1px solid $border-lighter;

  &:last-child {
    border-bottom: none;
  }
}

.notice-link {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4 0;
  transition: all $transition-fast;

  &:hover {
    .notice-title {
      color: $primary;
    }

    .notice-arrow {
      color: $primary;
      transform: translateX(4px);
    }
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
    border-radius: $radius-sm;
  }
}

// 日期块
.notice-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: $bg-soft;
  border-radius: $radius-base;
  flex-shrink: 0;
  border-left: 3px solid $primary;
  transition: all $transition-fast;

  .notice-link:hover & {
    background: $primary-bg;
    border-left-color: $gold;
  }

  .date-day {
    font-size: $fs-xl;
    font-weight: $fw-bold;
    color: $primary;
    line-height: 1;
  }

  .date-month {
    font-size: $fs-xs;
    color: $text-secondary;
    margin-top: 2px;
  }
}

.notice-main {
  flex: 1;
  min-width: 0;
}

.notice-tags {
  display: flex;
  gap: $space-1;
  margin-bottom: $space-1;
}

.tag-top,
.tag-important {
  font-size: $fs-xs;
  padding: 1px $space-2;
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

.notice-title {
  font-size: $fs-md;
  font-weight: $fw-medium;
  color: $text-primary;
  line-height: $lh-snug;
  margin-bottom: $space-1;
  @include text-ellipsis(1);

  &.important {
    color: $danger;
  }
}

.notice-summary {
  font-size: $fs-sm;
  color: $text-secondary;
  @include text-ellipsis(1);
}

.notice-arrow {
  color: $text-placeholder;
  flex-shrink: 0;
  transition: all $transition-fast;
}

// Tab 切换淡入淡出
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
  .home-notice {
    padding: $space-4;
  }

  .notice-date {
    width: 44px;
    height: 44px;

    .date-day {
      font-size: $fs-md;
    }
  }

  .notice-summary {
    display: none;
  }

  .tab-btn {
    padding: $space-2 $space-3;
    font-size: $fs-base;
  }
}
</style>
