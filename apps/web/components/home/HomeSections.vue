<template>
  <section class="home-sections">
    <div class="sections-grid">
      <!-- 课程建设分区(FR-01.06):数字统计卡片 -->
      <div class="info-block block-stats">
        <div class="block-header">
          <div class="header-text">
            <h3 class="block-title">课程建设</h3>
            <span class="block-subtitle">Course Construction</span>
          </div>
          <NuxtLink to="/research" class="block-more">
            更多
            <Icon icon="mdi:arrow-right" width="13" height="13" />
          </NuxtLink>
        </div>
        <div class="stats-grid">
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
          <div class="header-text">
            <h3 class="block-title">常用信息</h3>
            <span class="block-subtitle">Common Info</span>
          </div>
        </div>
        <ul class="info-list">
          <li v-for="item in commonInfo" :key="item.title">
            <NuxtLink :to="item.url" class="info-link">
              <span class="info-icon">
                <Icon :icon="item.icon" width="18" height="18" />
              </span>
              <span class="info-text">{{ item.title }}</span>
              <Icon icon="mdi:chevron-right" class="info-arrow" width="14" height="14" />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- 投诉举报(FR-01.08):暗色卡片强调 -->
      <div class="info-block block-report">
        <div class="block-header">
          <div class="header-text">
            <h3 class="block-title">投诉举报</h3>
            <span class="block-subtitle">Feedback & Report</span>
          </div>
        </div>
        <ul class="report-list">
          <li v-for="item in reportInfo" :key="item.label">
            <span class="report-label">{{ item.label }}</span>
            <span class="report-value">{{ item.value }}</span>
          </li>
        </ul>
        <NuxtLink to="/feedback" class="report-btn">
          <Icon icon="mdi:email-edit-outline" width="16" height="16" />
          <span>在线反馈</span>
        </NuxtLink>
      </div>

      <!-- 信息公开(FR-01.09) -->
      <div class="info-block">
        <div class="block-header">
          <div class="header-text">
            <h3 class="block-title">信息公开</h3>
            <span class="block-subtitle">Disclosure</span>
          </div>
        </div>
        <ul class="info-list">
          <li v-for="item in disclosureLinks" :key="item.title">
            <NuxtLink :to="item.url" class="info-link">
              <span class="info-icon info-icon-doc">
                <Icon icon="mdi:file-document-outline" width="18" height="18" />
              </span>
              <span class="info-text">{{ item.title }}</span>
              <Icon icon="mdi:chevron-right" class="info-arrow" width="14" height="14" />
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// HomeSections v2.0: 课程建设统计 + 常用信息 + 投诉举报(暗色强调)+ 信息公开
// 对应 FR-01.06/07/08/09
import { courseConstruction, commonInfo, reportInfo, disclosureLinks } from '~/mock/data'
</script>

<style lang="scss" scoped>
.sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-5;
}

.info-block {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-sm;
  transition: box-shadow $transition-base;

  &:hover {
    box-shadow: $shadow-md;
  }
}

// 区块标题(中英文 + 金色装饰线)
.block-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: $space-5;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  padding-left: $space-4;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 3px;
    background: $grad-gold;
    border-radius: $radius-pill;
  }
}

.block-title {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $text-primary;
  line-height: 1.2;
}

.block-subtitle {
  font-size: $fs-xs;
  color: $text-placeholder;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.block-more {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-xs;
  color: $text-secondary;
  transition: color $transition-fast;

  &:hover {
    color: $primary;
  }
}

// 课程建设统计
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-3;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-5 $space-3;
  background: $bg-soft;
  border-radius: $radius-base;
  transition: all $transition-base;
  position: relative;
  overflow: hidden;

  // 底部装饰条
  &::after {
    content: '';
    position: absolute;
    left: 30%;
    right: 30%;
    bottom: 0;
    height: 2px;
    background: $grad-gold;
    transform: scaleX(0);
    transition: transform $transition-base;
  }

  &:hover {
    background: $primary-bg;
    transform: translateY(-2px);

    &::after {
      transform: scaleX(1);
    }
  }
}

.stat-count {
  font-family: $font-serif;
  font-size: $fs-4xl;
  font-weight: $fw-bold;
  line-height: 1;
  margin-bottom: $space-2;
}

.stat-label {
  font-size: $fs-sm;
  color: $text-secondary;
  font-weight: $fw-medium;
}

// 常用信息 / 信息公开列表
.info-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-2;

  li {
    list-style: none;
  }
}

.info-link {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-base;
  color: $text-regular;
  font-size: $fs-sm;
  transition: all $transition-fast;

  &:hover {
    background: $gold-bg;

    .info-icon {
      background: $grad-gold;
      color: #fff;
    }

    .info-text {
      color: $primary;
    }

    .info-arrow {
      opacity: 1;
      transform: translateX(0);
      color: $gold;
    }
  }
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: $radius-base;
  background: $primary-bg;
  color: $primary;
  transition: all $transition-fast;
}

.info-icon-doc {
  background: $gold-bg;
  color: $gold-dark;
}

.info-text {
  flex: 1;
  min-width: 0;
  font-weight: $fw-medium;
  transition: color $transition-fast;
}

.info-arrow {
  flex-shrink: 0;
  color: $text-placeholder;
  opacity: 0;
  transform: translateX(-4px);
  transition: all $transition-fast;
}

// 投诉举报(暗色卡片)
.block-report {
  background: $grad-dark;
  position: relative;
  overflow: hidden;

  // 右上角装饰图案
  &::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(184, 149, 106, 0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  .block-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .block-title {
    color: #fff;
  }

  .block-subtitle {
    color: rgba(255, 255, 255, 0.4);
  }
}

.report-list {
  margin-bottom: $space-5;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-3 0;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    font-size: $fs-sm;

    &:last-child {
      border-bottom: none;
    }
  }
}

.report-label {
  color: rgba(255, 255, 255, 0.5);
  display: inline-flex;
  align-items: center;

  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: $gold;
    margin-right: $space-2;
  }
}

.report-value {
  color: $gold-light;
  font-weight: $fw-medium;
}

.report-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  width: 100%;
  padding: $space-3;
  background: $grad-gold;
  border-radius: $radius-base;
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: #fff;
  transition: all $transition-base;
  box-shadow: 0 4px 12px rgba(184, 149, 106, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(184, 149, 106, 0.4);
    color: #fff;
  }
}

// 移动端
@include respond-to(xs) {
  .sections-grid {
    grid-template-columns: 1fr;
    gap: $space-4;
  }

  .info-block {
    padding: $space-5 $space-4;
  }

  .info-list {
    grid-template-columns: 1fr;
  }
}
</style>
