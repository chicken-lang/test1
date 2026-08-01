<script setup lang="ts">
// 问卷调查列表页 (需求 4.1:后台创建、定向发布、结果统计导出)
// URL: /survey
// 展示全部问卷(进行中/已结束),支持状态筛选,点击进入答题页
import { icons } from '~/utils/icons'

interface SurveyListItem {
  id: number
  title: string
  description: string
  deadline: string
  target: string
  status: 'active' | 'ended'
  publishDate: string
  responseCount: number
  questionCount: number
}

const api = useApi()

// 状态筛选
const activeFilter = ref<'all' | 'active' | 'ended'>('all')

const { data: surveyData, refresh } = await useAsyncData(
  'survey-list',
  () =>
    api.get<any[]>(
      activeFilter.value === 'all' ? '/survey' : `/survey?status=${activeFilter.value}`,
    ),
  { watch: [activeFilter] },
)

const surveys = computed<SurveyListItem[]>(() => surveyData.value ?? [])

// 统计
const stats = computed(() => ({
  total: surveys.value.length,
  active: surveys.value.filter((s) => s.status === 'active').length,
  ended: surveys.value.filter((s) => s.status === 'ended').length,
  totalResponses: surveys.value.reduce((sum, s) => sum + s.responseCount, 0),
}))

// 计算剩余天数
const daysLeft = (deadline: string) => {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// 面包屑
const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '问卷调查' },
]

useSeoMeta({
  title: '问卷调查 - 深圳信息职业技术大学教务处',
  description: '参与教务处组织的各类问卷调查,分享您的意见和建议',
})
</script>

<template>
  <div class="survey-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon :icon="icons.form" />
          问卷调查
        </h1>
        <p class="page-subtitle">Questionnaire Survey</p>
      </div>
    </div>

    <div class="container survey-main">
      <!-- 统计卡片 -->
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon stat-icon--blue">
            <Icon :icon="icons.document" :width="22" :height="22" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">问卷总数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--green">
            <Icon :icon="icons.checkCircle" :width="22" :height="22" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.active }}</span>
            <span class="stat-label">进行中</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--gray">
            <Icon :icon="icons.history" :width="22" :height="22" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.ended }}</span>
            <span class="stat-label">已结束</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--orange">
            <Icon :icon="icons.user" :width="22" :height="22" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalResponses.toLocaleString() }}</span>
            <span class="stat-label">累计参与</span>
          </div>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button
            class="filter-tab"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            全部
            <span class="tab-count">{{ surveys.length }}</span>
          </button>
          <button
            class="filter-tab"
            :class="{ active: activeFilter === 'active' }"
            @click="activeFilter = 'active'"
          >
            进行中
            <span class="tab-count">{{ stats.active }}</span>
          </button>
          <button
            class="filter-tab"
            :class="{ active: activeFilter === 'ended' }"
            @click="activeFilter = 'ended'"
          >
            已结束
            <span class="tab-count">{{ stats.ended }}</span>
          </button>
        </div>
      </div>

      <!-- 问卷列表 -->
      <div v-if="!surveys.length" class="survey-empty">
        <EmptyState icon="survey" title="暂无问卷" description="当前分类下没有问卷,请稍后再来看看" />
      </div>

      <div v-else class="survey-grid">
        <NuxtLink
          v-for="survey in surveys"
          :key="survey.id"
          :to="`/survey/${survey.id}`"
          class="survey-card"
          :class="{ 'is-ended': survey.status === 'ended' }"
        >
          <!-- 状态徽章 -->
          <div class="card-badge" :class="`badge-${survey.status}`">
            <span v-if="survey.status === 'active'">
              <Icon :icon="icons.lightningBolt" :width="12" :height="12" />
              进行中
            </span>
            <span v-else>
              <Icon :icon="icons.history" :width="12" :height="12" />
              已结束
            </span>
          </div>

          <!-- 剩余天数 -->
          <div v-if="survey.status === 'active'" class="card-days">
            <Icon :icon="icons.clock" :width="12" :height="12" />
            剩余 {{ daysLeft(survey.deadline) }} 天
          </div>
          <div v-else class="card-days days-ended">
            <Icon :icon="icons.clock" :width="12" :height="12" />
            截止于 {{ survey.deadline }}
          </div>

          <!-- 标题与描述 -->
          <h3 class="card-title">{{ survey.title }}</h3>
          <p class="card-desc">{{ survey.description }}</p>

          <!-- 元信息 -->
          <div class="card-meta">
            <span class="meta-item">
              <Icon :icon="icons.user" :width="12" :height="12" />
              {{ survey.target }}
            </span>
            <span class="meta-item">
              <Icon :icon="icons.document" :width="12" :height="12" />
              {{ survey.questionCount }} 题
            </span>
            <span class="meta-item">
              <Icon :icon="icons.checkCircle" :width="12" :height="12" />
              {{ survey.responseCount }} 人参与
            </span>
          </div>

          <!-- 操作按钮 -->
          <div class="card-footer">
            <span class="card-action">
              {{ survey.status === 'active' ? '参与问卷' : '查看详情' }}
              <Icon :icon="icons.arrowRight" :width="13" :height="13" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.survey-page {
  padding-bottom: $space-10;
}

// ========== 页头 ==========
.page-header {
  background: $primary;
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

// ========== 主体 ==========
.survey-main {
  max-width: 1100px;
}

// ========== 统计卡片 ==========
.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;
  margin-bottom: $space-6;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4 $space-5;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1px solid $border-lighter;
  transition: all $transition-fast;

  &:hover {
    box-shadow: $shadow-sm;
    transform: translateY(-2px);
  }
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: $radius-base;
  flex-shrink: 0;

  &--blue {
    background: $primary-bg;
    color: $primary;
  }
  &--green {
    background: rgba(82, 196, 26, 0.1);
    color: $success;
  }
  &--gray {
    background: $bg-soft;
    color: $text-secondary;
  }
  &--orange {
    background: rgba(250, 173, 20, 0.1);
    color: $warning;
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: $fs-2xl;
  font-weight: $fw-bold;
  color: $text-primary;
  line-height: 1.2;
}

.stat-label {
  font-size: $fs-xs;
  color: $text-secondary;
}

// ========== 筛选栏 ==========
.filter-bar {
  margin-bottom: $space-6;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;
}

.filter-tabs {
  display: flex;
  gap: $space-2;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-4;
  font-size: $fs-sm;
  color: $text-secondary;
  background: transparent;
  border: 1px solid transparent;
  border-radius: $radius-base;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    color: $primary;
    background: $primary-bg;
  }

  &.active {
    color: $primary;
    font-weight: $fw-medium;
    border-color: $primary-lighter;
    background: $primary-bg;
  }
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  font-size: $fs-xs;
  color: $text-secondary;
  background: $bg-soft;
  border-radius: $radius-pill;
}

.filter-tab.active .tab-count {
  color: $primary;
  background: #fff;
}

// ========== 空状态 ==========
.survey-empty {
  padding: $space-10 0;
}

// ========== 问卷卡片 ==========
.survey-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-5;
}

.survey-card {
  display: block;
  position: relative;
  padding: $space-5;
  background: $bg-card;
  border-radius: $radius-lg;
  border: 1px solid $border-lighter;
  transition: all $transition-base;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $primary;
    opacity: 1;
    transition: opacity $transition-fast;
  }

  &:hover {
    box-shadow: $shadow-sm;
    transform: translateY(-3px);

    &::before {
      opacity: 0.7;
    }

    .card-title {
      color: $primary;
    }

    .card-action {
      color: $primary;

      :deep(svg) {
        transform: translateX(3px);
      }
    }
  }

  &.is-ended::before {
    background: $text-placeholder;
  }

  &.is-ended:hover::before {
    background: $text-secondary;
  }
}

.card-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: $fs-xs;
  font-weight: $fw-medium;
  padding: 3px $space-2;
  border-radius: $radius-sm;
  margin-bottom: $space-3;

  &.badge-active {
    color: $success;
    background: rgba(82, 196, 26, 0.1);
  }

  &.badge-ended {
    color: $text-secondary;
    background: $bg-soft;
  }

  :deep(svg) {
    color: inherit;
  }
}

.card-days {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: $fs-xs;
  color: $warning;
  font-weight: $fw-medium;
  margin-bottom: $space-3;

  &.days-ended {
    color: $text-placeholder;
  font-weight: $fw-regular;
  }

  :deep(svg) {
    color: inherit;
  }
}

.card-title {
  font-size: $fs-lg;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0 0 $space-2;
  line-height: $lh-snug;
  transition: color $transition-fast;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc {
  font-size: $fs-sm;
  color: $text-secondary;
  margin: 0 0 $space-3;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
  margin-bottom: $space-3;
  padding-bottom: $space-3;
  border-bottom: 1px dashed $border-lighter;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: $fs-xs;
  color: $text-secondary;

  :deep(svg) {
    color: $primary;
  }
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.card-action {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-sm;
  font-weight: $fw-medium;
  color: $text-secondary;
  transition: all $transition-fast;

  :deep(svg) {
    transition: transform $transition-fast;
  }
}

// ========== 响应式 ==========
@include respond-to(md) {
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }

  .survey-grid {
    grid-template-columns: 1fr;
  }
}

@include respond-to(xs) {
  .page-title {
    font-size: $fs-2xl;
  }

  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: $space-3;
  }

  .stat-card {
    padding: $space-3;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: $fs-xl;
  }

  .filter-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .survey-grid {
    grid-template-columns: 1fr;
  }

  .survey-card {
    padding: $space-4;
  }
}
</style>
