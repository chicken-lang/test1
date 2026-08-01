<script setup lang="ts">
// 问卷调查模块(需求 4.1:后台创建问卷、定向发布、结果统计导出)
// 首页 G 区底部展示,展示进行中的问卷列表,点击进入答题页 /survey/[id]
// API: GET /api/survey/active
import { icons } from '~/utils/icons'

const api = useApi()

const { data: surveyData } = await useAsyncData('active-surveys', () =>
  api.get<any[]>('/survey/active'),
)
const surveys = computed(() => surveyData.value ?? [])

// 计算剩余天数
const daysLeft = (deadline: string) => {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
</script>

<template>
  <section v-reveal class="home-survey reveal" aria-labelledby="survey-title">
    <div class="section-header">
      <div class="section-title-group">
        <span id="survey-title" class="title-cn">问卷调查</span>
        <span class="title-en">Survey</span>
      </div>
      <NuxtLink to="/survey" class="section-more">
        查看全部
        <Icon :icon="icons.arrowRight" :width="12" :height="12" />
      </NuxtLink>
    </div>

    <div v-if="!surveys.length" class="survey-empty">暂无进行中的问卷</div>

    <div v-else class="survey-list">
      <NuxtLink
        v-for="survey in surveys"
        :key="survey.id"
        :to="`/survey/${survey.id}`"
        class="survey-card"
      >
        <div class="card-header">
          <span class="card-badge">进行中</span>
          <span class="card-days">
            <Icon :icon="icons.clock" :width="12" :height="12" />
            剩余 {{ daysLeft(survey.deadline) }} 天
          </span>
        </div>
        <h4 class="card-title">{{ survey.title }}</h4>
        <p class="card-desc">{{ survey.description }}</p>
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
        <span class="card-action">
          参与问卷
          <Icon :icon="icons.arrowRight" :width="13" :height="13" />
        </span>
      </NuxtLink>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.home-survey {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  border: 1px solid $border-lighter;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;
}

.section-more {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-xs;
  color: $primary;
  text-decoration: none;
  transition: all $transition-fast;

  &:hover {
    color: $primary-dark;

    :deep(svg) {
      transform: translateX(2px);
    }
  }

  :deep(svg) {
    transition: transform $transition-fast;
  }
}

.section-title-group {
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
    background: $primary;
    border-radius: $radius-pill;
  }
}

.title-cn {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $text-primary;
}

.title-en {
  font-size: $fs-xs;
  color: $text-placeholder;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.survey-empty {
  text-align: center;
  padding: $space-6 0;
  color: $text-placeholder;
  font-size: $fs-sm;
}

.survey-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.survey-card {
  display: block;
  padding: $space-4;
  background: $bg-soft;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  transition: all $transition-fast;

  &:hover {
    border-color: $primary-lighter;
    background: $primary-bg;

    .card-title {
      color: $primary;
    }

    .card-action {
      color: $primary;

      :deep(svg) {
        transform: translateX(2px);
      }
    }
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-2;
}

.card-badge {
  font-size: $fs-xs;
  color: #fff;
  background: $success;
  padding: 2px $space-2;
  border-radius: $radius-sm;
  font-weight: $fw-medium;
}

.card-days {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: $fs-xs;
  color: $warning;
  font-weight: $fw-medium;
}

.card-title {
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0 0 $space-1;
  transition: color $transition-fast;
}

.card-desc {
  font-size: $fs-sm;
  color: $text-secondary;
  margin: 0 0 $space-3;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  margin-bottom: $space-3;
  padding-bottom: $space-2;
  border-bottom: 1px dashed $border-lighter;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: $fs-xs;
  color: $text-secondary;

  :deep(svg) {
    color: $primary;
  }
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
</style>
