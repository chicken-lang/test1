<template>
  <section class="home-notice">
    <!-- 区块标题(中英文对照) -->
    <div class="section-header">
      <div class="section-title-group">
        <span class="title-cn">通知公告</span>
        <span class="title-en">Information</span>
      </div>
      <NuxtLink to="/list/notices" class="section-more">
        更多
        <Icon icon="mdi:arrow-right" width="14" height="14" />
      </NuxtLink>
    </div>

    <!-- 自定义 Tab(学生/教师) -->
    <div class="notice-tabs">
      <div class="tabs-header">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <Icon :icon="tab.icon" width="16" height="16" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <div class="tabs-body">
        <ul class="notice-list">
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
              <Icon icon="mdi:chevron-right" class="notice-arrow" width="18" height="18" />
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// HomeNotice v2.0: 自定义 Tab + 日期块 + 标签 + 摘要(参考 szpu 学生/教师分区)
import { studentNotices, teacherNotices } from '~/mock/data'

const tabs = [
  { key: 'student' as const, label: '学生通知', icon: 'mdi:account-school' },
  { key: 'teacher' as const, label: '教师通知', icon: 'mdi:account-tie' },
]

const activeTab = ref<'student' | 'teacher'>('student')

const currentList = computed(() =>
  activeTab.value === 'student' ? studentNotices : teacherNotices,
)
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

  &:hover {
    color: $primary;
  }

  &.active {
    color: $primary;
    border-bottom-color: $primary;
    font-weight: $fw-semibold;
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
