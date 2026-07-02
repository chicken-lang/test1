<script setup lang="ts">
// 信息公开首页
// 信息公开目录卡片网格 + 底部三个快捷入口(指南/年报/申请)
import { disclosureDirectory } from '~/mock/data'

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '信息公开' },
]

// 底部快捷入口
const quickEntries = [
  {
    title: '信息公开指南',
    desc: '了解信息公开的范围、方式与时限',
    url: '/disclosure/guide',
    icon: 'mdi:book-open-page-variant-outline',
  },
  {
    title: '信息公开年报',
    desc: '查阅年度信息公开工作报告',
    url: '/disclosure/report',
    icon: 'mdi:file-chart-outline',
  },
  {
    title: '信息公开申请',
    desc: '在线提交信息公开申请',
    url: '/disclosure/apply',
    icon: 'mdi:file-document-edit-outline',
  },
]

useSeoMeta({
  title: '信息公开 - 深圳信息职业技术大学教务处',
  description: '深圳信息职业技术大学教务处信息公开,含信息公开目录、指南、年报及申请入口',
})
</script>

<template>
  <div class="disclosure-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:shield-account-outline" />
          信息公开
        </h1>
        <p class="page-subtitle">Information Disclosure</p>
      </div>
    </div>

    <div class="container disclosure-content">
      <!-- 信息公开目录 -->
      <section class="disclosure-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="title-cn">信息公开目录</span>
            <span class="title-en">Directory</span>
          </div>
          <span class="section-more">{{ disclosureDirectory.length }} 项</span>
        </div>

        <div class="directory-grid">
          <NuxtLink
            v-for="item in disclosureDirectory"
            :key="item.id"
            :to="item.url"
            class="directory-card"
          >
            <div class="directory-icon">
              <Icon :icon="item.icon" width="26" height="26" />
            </div>
            <div class="directory-info">
              <h3 class="directory-title">{{ item.title }}</h3>
              <span class="directory-tag">{{ item.description }}</span>
            </div>
            <Icon icon="mdi:chevron-right" class="directory-arrow" width="18" height="18" />
          </NuxtLink>
        </div>
      </section>

      <!-- 快捷入口 -->
      <section class="disclosure-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="title-cn">快捷入口</span>
            <span class="title-en">Quick Access</span>
          </div>
        </div>

        <div class="quick-grid">
          <NuxtLink
            v-for="entry in quickEntries"
            :key="entry.url"
            :to="entry.url"
            class="quick-card"
          >
            <div class="quick-icon">
              <Icon :icon="entry.icon" width="32" height="32" />
            </div>
            <div class="quick-body">
              <h3 class="quick-title">{{ entry.title }}</h3>
              <p class="quick-desc">{{ entry.desc }}</p>
            </div>
            <span class="quick-cta">
              进入
              <Icon icon="mdi:arrow-right" width="14" height="14" />
            </span>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.disclosure-page {
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

.disclosure-section {
  margin-bottom: $space-10;
}

// 目录卡片网格
.directory-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;
}

.directory-card {
  display: flex;
  align-items: center;
  gap: $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-sm;
  transition: all $transition-base;
  border-left: 3px solid transparent;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
    border-left-color: $gold;

    .directory-title {
      color: $primary;
    }

    .directory-arrow {
      color: $gold;
      transform: translateX(3px);
    }
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

.directory-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: $radius-md;
  background: $grad-primary-soft;
  color: $primary;
  flex-shrink: 0;
}

.directory-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.directory-title {
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  @include text-ellipsis(1);
  transition: color $transition-fast;
}

.directory-tag {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  font-size: $fs-xs;
  color: $gold-dark;
  background: $gold-bg;
  padding: 2px $space-2;
  border-radius: $radius-sm;
}

.directory-arrow {
  color: $text-placeholder;
  flex-shrink: 0;
  transition: all $transition-fast;
}

// 快捷入口卡片
.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-5;
}

.quick-card {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-sm;
  transition: all $transition-base;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $grad-gold;
    opacity: 0;
    transition: opacity $transition-base;
  }

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-3px);

    &::before {
      opacity: 1;
    }

    .quick-icon {
      background: $grad-gold;
      color: #fff;
    }

    .quick-cta {
      color: $gold-dark;
      gap: $space-2;
    }
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: $radius-md;
  background: $grad-primary-soft;
  color: $primary;
  transition: all $transition-base;
}

.quick-body {
  flex: 1;
}

.quick-title {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $text-primary;
  margin-bottom: $space-1;
}

.quick-desc {
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: $lh-snug;
}

.quick-cta {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-sm;
  color: $primary;
  font-weight: $fw-medium;
  transition: all $transition-fast;
}

// 响应式
@include respond-to(md) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
}

@include respond-to(xs) {
  .directory-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: $fs-2xl;
  }
}
</style>
