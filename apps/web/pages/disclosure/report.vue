<script setup lang="ts">
// 信息公开年报页
// 展示 disclosureReport 数据: 年份/发布日期/摘要 + 各 section 标题与正文
import { disclosureReport } from '~/mock/data'

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '信息公开', to: '/disclosure' },
  { title: '信息公开年报' },
]

useSeoMeta({
  title: '信息公开年报 - 深圳信息职业技术大学教务处',
  description: '深圳信息职业技术大学教务处信息公开年度工作报告',
})
</script>

<template>
  <div class="report-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:file-chart-outline" />
          信息公开年报
        </h1>
        <p class="page-subtitle">Annual Report</p>
      </div>
    </div>

    <div class="container">
      <!-- 报告概要卡片 -->
      <div class="report-summary-card">
        <div class="summary-year">
          <span class="year-label">报告年度</span>
          <span class="year-value">{{ disclosureReport.year }}</span>
        </div>
        <div class="summary-info">
          <h2 class="summary-title">教务处{{ disclosureReport.year }}年度信息公开工作报告</h2>
          <p class="summary-text">{{ disclosureReport.content }}</p>
          <div class="summary-meta">
            <span class="meta-item">
              <Icon icon="mdi:calendar-outline" width="14" height="14" />
              发布日期:{{ disclosureReport.publishedAt }}
            </span>
            <span class="meta-item">
              <Icon icon="mdi:domain" width="14" height="14" />
              教务处
            </span>
          </div>
        </div>
      </div>

      <!-- 报告正文 -->
      <div class="report-body-card">
        <article
          v-for="(sec, idx) in disclosureReport.sections"
          :key="idx"
          class="report-section"
        >
          <h3 class="report-heading">{{ sec.title }}</h3>
          <p class="report-text">{{ sec.content }}</p>
        </article>

        <div class="report-footer">
          <Icon icon="mdi:information-outline" width="16" height="16" />
          本报告由深圳信息职业技术大学教务处编制并负责解释。
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.report-page {
  padding-bottom: 40px;
}

.page-header {
  background: $grad-primary;
  color: #fff;
  padding: $space-8 0;
  margin-bottom: $space-8;
}

.page-title {
  display: flex;
  align-items: center;
  gap: $space-3;
  font-size: $fs-4xl;
  font-weight: $fw-bold;
  margin-bottom: $space-2;
}

.page-subtitle {
  font-size: $fs-sm;
  opacity: 0.8;
  letter-spacing: 2px;
}

// 概要卡片
.report-summary-card {
  display: flex;
  align-items: stretch;
  gap: $space-6;
  background: $grad-dark;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-md;
  margin-bottom: $space-6;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: -60px;
    right: -40px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(184, 149, 106, 0.18) 0%, transparent 70%);
    pointer-events: none;
  }
}

.summary-year {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-right: $space-6;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;

  .year-label {
    font-size: $fs-xs;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 2px;
    margin-bottom: $space-2;
  }

  .year-value {
    font-family: $font-serif;
    font-size: 56px;
    font-weight: $fw-bold;
    color: $gold-light;
    line-height: 1;
  }
}

.summary-info {
  flex: 1;
  min-width: 0;
  position: relative;
}

.summary-title {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: #fff;
  margin-bottom: $space-3;
  line-height: $lh-snug;
}

.summary-text {
  font-size: $fs-md;
  color: rgba(255, 255, 255, 0.8);
  line-height: $lh-relaxed;
  margin-bottom: $space-4;
}

.summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-5;

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
    font-size: $fs-sm;
    color: rgba(255, 255, 255, 0.7);

    :deep(svg) {
      color: $gold-light;
    }
  }
}

// 正文卡片
.report-body-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-sm;
}

.report-section {
  margin-bottom: $space-6;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.report-heading {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $primary-dark;
  margin-bottom: $space-3;
  padding-left: $space-3;
  border-left: 4px solid $gold;
}

.report-text {
  font-size: $fs-md;
  color: $text-regular;
  line-height: $lh-relaxed;
  text-indent: 2em;
}

.report-footer {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-top: $space-6;
  padding-top: $space-5;
  border-top: 1px solid $border-lighter;
  font-size: $fs-sm;
  color: $text-secondary;

  :deep(svg) {
    color: $gold;
  }
}

@include respond-to(xs) {
  .report-summary-card {
    flex-direction: column;
    gap: $space-4;
    padding: $space-6;
  }

  .summary-year {
    padding-right: 0;
    padding-bottom: $space-4;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    flex-direction: row;
    gap: $space-3;
    justify-content: flex-start;

    .year-value {
      font-size: 40px;
    }
  }

  .report-body-card {
    padding: $space-5;
  }

  .page-title {
    font-size: $fs-2xl;
  }

  .report-heading {
    font-size: $fs-lg;
  }
}
</style>
