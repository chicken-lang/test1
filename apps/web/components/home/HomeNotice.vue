<template>
  <section class="home-notice">
    <el-tabs v-model="activeTab" class="notice-tabs">
      <!-- 学生通知(FR-01.03) -->
      <el-tab-pane label="学生通知" name="student">
        <ul class="notice-list">
          <li v-for="item in studentNotices" :key="item.id" class="notice-item">
            <NuxtLink :to="`/article/${item.id}`" class="notice-link">
              <span v-if="item.isImportant" class="tag-important">[重要]</span>
              <span v-if="item.isTop" class="tag-top">[置顶]</span>
              <span class="notice-title" :class="{ important: item.isImportant }">
                {{ item.title }}
              </span>
              <span class="notice-date">{{ item.publishDate.slice(5) }}</span>
            </NuxtLink>
          </li>
        </ul>
      </el-tab-pane>

      <!-- 教师通知(FR-01.03) -->
      <el-tab-pane label="教师通知" name="teacher">
        <ul class="notice-list">
          <li v-for="item in teacherNotices" :key="item.id" class="notice-item">
            <NuxtLink :to="`/article/${item.id}`" class="notice-link">
              <span v-if="item.isImportant" class="tag-important">[重要]</span>
              <span v-if="item.isTop" class="tag-top">[置顶]</span>
              <span class="notice-title" :class="{ important: item.isImportant }">
                {{ item.title }}
              </span>
              <span class="notice-date">{{ item.publishDate.slice(5) }}</span>
            </NuxtLink>
          </li>
        </ul>
      </el-tab-pane>
    </el-tabs>

    <NuxtLink to="/notices" class="notice-more">更多 &gt;</NuxtLink>
  </section>
</template>

<script setup lang="ts">
// 首页通知公告: 学生/教师双 Tab 列表(FR-01.03,各 5-8 条)
// 重要通知加红、置顶标注(对应 FR-04.06/07)
import { studentNotices, teacherNotices } from '~/mock/data'

const activeTab = ref<'student' | 'teacher'>('student')
</script>

<style lang="scss" scoped>
.home-notice {
  position: relative;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 16px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.notice-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }

  :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 600;
  }
}

.notice-list {
  min-height: 280px;
}

.notice-item {
  border-bottom: 1px dashed $border-lighter;

  &:last-child {
    border-bottom: none;
  }
}

.notice-link {
  display: flex;
  align-items: center;
  padding: 11px 0;
  font-size: 15px;
  gap: 4px;

  &:hover .notice-title {
    color: $primary;
  }
}

.tag-important,
.tag-top {
  color: $danger;
  font-size: 13px;
  flex-shrink: 0;
}

.tag-top {
  color: $warning;
}

.notice-title {
  flex: 1;
  @include text-ellipsis(1);
  color: $text-regular;

  &.important {
    color: $danger;
    font-weight: 500;
  }
}

.notice-date {
  color: $text-secondary;
  font-size: 13px;
  flex-shrink: 0;
  margin-left: 12px;
}

.notice-more {
  position: absolute;
  top: 18px;
  right: 24px;
  font-size: 14px;
  color: $text-secondary;

  &:hover {
    color: $primary;
  }
}
</style>
