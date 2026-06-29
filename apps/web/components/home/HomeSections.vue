<template>
  <section class="home-sections">
    <div class="sections-grid">
      <!-- 课程建设分区(FR-01.06) -->
      <div class="info-block">
        <div class="block-header">
          <h3 class="block-title">课程建设</h3>
          <NuxtLink to="/research" class="block-more">更多 &gt;</NuxtLink>
        </div>
        <div class="course-stats">
          <NuxtLink
            v-for="item in courseConstruction"
            :key="item.title"
            :to="item.url"
            class="stat-item"
          >
            <span class="stat-count" :style="{ color: item.color }">{{ item.count }}</span>
            <span class="stat-label">{{ item.title }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- 常用信息(FR-01.07) -->
      <div class="info-block">
        <div class="block-header">
          <h3 class="block-title">常用信息</h3>
        </div>
        <ul class="info-list">
          <li v-for="item in commonInfo" :key="item.title">
            <NuxtLink :to="item.url" class="info-link">
              <Icon :icon="item.icon" width="18" height="18" />
              <span>{{ item.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- 投诉举报方式(FR-01.08) -->
      <div class="info-block report-block">
        <div class="block-header">
          <h3 class="block-title">投诉举报</h3>
        </div>
        <ul class="report-list">
          <li v-for="item in reportInfo" :key="item.label">
            <span class="report-label">{{ item.label }}</span>
            <span class="report-value">{{ item.value }}</span>
          </li>
        </ul>
        <NuxtLink to="/feedback" class="report-btn">在线反馈</NuxtLink>
      </div>

      <!-- 信息公开入口(FR-01.09) -->
      <div class="info-block">
        <div class="block-header">
          <h3 class="block-title">信息公开</h3>
        </div>
        <ul class="info-list">
          <li v-for="item in disclosureLinks" :key="item.title">
            <NuxtLink :to="item.url" class="info-link">
              <Icon icon="mdi:chevron-right" width="18" height="18" />
              <span>{{ item.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 首页:课程建设 + 常用信息 + 投诉举报 + 信息公开
// 对应 FR-01.06/07/08/09
import { courseConstruction, commonInfo, reportInfo, disclosureLinks } from '~/mock/data'
</script>

<style lang="scss" scoped>
.sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.info-block {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid $primary-bg;
}

.block-title {
  font-size: 17px;
  font-weight: 600;
  color: $text-primary;
  position: relative;
  padding-left: 12px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 16px;
    background: $primary;
    border-radius: 2px;
  }
}

.block-more {
  font-size: 13px;
  color: $text-secondary;
}

// 课程建设统计
.course-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: $bg-page;
  border-radius: $radius-base;
  transition: background 0.2s;

  &:hover {
    background: $primary-bg;
  }
}

.stat-count {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: $text-secondary;
  margin-top: 4px;
}

// 常用信息列表
.info-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.info-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: $radius-base;
  color: $text-regular;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: $primary-bg;
    color: $primary;
  }
}

// 投诉举报
.report-block {
  border-top: 3px solid $danger;
}

.report-list {
  margin-bottom: 12px;

  li {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed $border-lighter;
    font-size: 14px;
  }
}

.report-label {
  color: $text-secondary;
}

.report-value {
  color: $text-primary;
  font-weight: 500;
}

.report-btn {
  display: block;
  text-align: center;
  padding: 10px;
  background: $danger;
  color: #fff;
  border-radius: $radius-base;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
    color: #fff;
  }
}

@include respond-to(xs) {
  .sections-grid {
    grid-template-columns: 1fr;
  }
}
</style>
