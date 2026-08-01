<script setup lang="ts">
// 问卷答题页(需求 4.1:后台创建、定向发布、结果统计导出)
// URL: /survey/[id]
// 展示问卷题目(单选/多选/简答),提交后返回统计概览
import { icons } from '~/utils/icons'

interface SurveyQuestion {
  id: number
  type: 'single' | 'multiple' | 'text'
  title: string
  required: boolean
  options?: string[]
}

interface Survey {
  id: number
  title: string
  description: string
  deadline: string
  target: string
  status: 'active' | 'ended'
  publishDate: string
  responseCount: number
  questions: SurveyQuestion[]
}

const route = useRoute()
const surveyId = computed(() => Number(route.params.id))

// SSR 预取问卷详情
const { data: surveyData } = await useAsyncData(
  () => `survey-${surveyId.value}`,
  () => $fetch<{ code: number; data: Survey }>(`/api/survey/${surveyId.value}`).then((res) => res.data),
  { watch: [surveyId] },
)

const survey = computed(() => surveyData.value ?? null)

if (!survey.value) {
  throw createError({ statusCode: 404, statusMessage: '问卷不存在', fatal: true })
}

// 答案状态:questionId → value(单选 string / 多选 string[] / 简答 string)
const answers = reactive<Record<number, string | string[]>>({})

const setSingle = (qId: number, option: string) => {
  answers[qId] = option
}
const toggleMultiple = (qId: number, option: string) => {
  const arr = Array.isArray(answers[qId]) ? [...(answers[qId] as string[])] : []
  const idx = arr.indexOf(option)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(option)
  }
  answers[qId] = arr
}

const submitted = ref(false)
const submitStats = ref<{ totalResponses: number } | null>(null)
const submitting = ref(false)

const onSubmit = async () => {
  // 校验必填
  for (const q of survey.value!.questions) {
    if (q.required) {
      const v = answers[q.id]
      if (!v || (Array.isArray(v) && v.length === 0)) {
        ElMessage.warning(`请完成必填题:第 ${q.id} 题`)
        return
      }
    }
  }
  submitting.value = true
  try {
    const res = await $fetch<{ code: number; data: any; message?: string }>(`/api/survey/${surveyId.value}/submit`, {
      method: 'POST',
      body: {
        answers: Object.entries(answers).map(([qid, value]) => ({
          questionId: Number(qid),
          value,
        })),
      },
    })
    if (res.code === 0) {
      submitted.value = true
      submitStats.value = res.data.stats
      ElMessage.success('问卷提交成功,感谢参与')
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch {
    ElMessage.error('提交失败,请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 面包屑
const breadcrumbItems = computed(() => [
  { title: '首页', to: '/' },
  { title: '问卷调查' },
  { title: survey.value!.title },
])

useSeoMeta({
  title: () => `${survey.value!.title} - 问卷调查 - 深圳信息职业技术大学教务处`,
  description: () => survey.value!.description,
})
</script>

<template>
  <div class="survey-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <div class="container survey-main">
      <div v-reveal class="survey-card reveal">
        <!-- 问卷头部 -->
        <header class="survey-header">
          <span class="survey-badge">问卷调查</span>
          <h1 class="survey-title">{{ survey!.title }}</h1>
          <p class="survey-desc">{{ survey!.description }}</p>
          <div class="survey-meta">
            <span class="meta-item">
              <Icon :icon="icons.user" :width="13" :height="13" />
              {{ survey!.target }}
            </span>
            <span class="meta-item">
              <Icon :icon="icons.clock" :width="13" :height="13" />
              截止 {{ survey!.deadline }}
            </span>
            <span class="meta-item">
              <Icon :icon="icons.checkCircle" :width="13" :height="13" />
              {{ survey!.responseCount }} 人参与
            </span>
          </div>
        </header>

        <!-- 提交成功提示 -->
        <div v-if="submitted" class="survey-done">
          <Icon :icon="icons.checkCircle" :width="48" :height="48" />
          <h2>提交成功</h2>
          <p>感谢您的参与!您的意见对我们非常重要。</p>
          <p v-if="submitStats" class="done-stats">已有 {{ submitStats.totalResponses }} 人完成问卷</p>
          <NuxtLink to="/" class="done-back">返回首页</NuxtLink>
        </div>

        <!-- 答题区 -->
        <template v-else>
          <div v-for="(q, idx) in survey!.questions" :key="q.id" class="question-item">
            <div class="question-head">
              <span class="question-num">{{ idx + 1 }}</span>
              <h3 class="question-title">{{ q.title }}</h3>
              <span v-if="q.required" class="question-required">必填</span>
              <span v-else class="question-optional">选填</span>
            </div>

            <!-- 单选 -->
            <div v-if="q.type === 'single'" class="question-options">
              <label v-for="opt in q.options" :key="opt" class="option-item" :class="{ checked: answers[q.id] === opt }">
                <input
                  :type="'radio'"
                  :name="`q${q.id}`"
                  :value="opt"
                  :checked="answers[q.id] === opt"
                  @change="setSingle(q.id, opt)"
                />
                <span class="option-radio" />
                <span class="option-text">{{ opt }}</span>
              </label>
            </div>

            <!-- 多选 -->
            <div v-else-if="q.type === 'multiple'" class="question-options">
              <label
                v-for="opt in q.options"
                :key="opt"
                class="option-item"
                :class="{ checked: Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt) }"
              >
                <input
                  :type="'checkbox'"
                  :value="opt"
                  :checked="Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt)"
                  @change="toggleMultiple(q.id, opt)"
                />
                <span class="option-check" />
                <span class="option-text">{{ opt }}</span>
              </label>
            </div>

            <!-- 简答 -->
            <textarea
              v-else
              v-model="answers[q.id] as string"
              class="question-textarea"
              placeholder="请输入您的回答"
              rows="4"
            />
          </div>

          <button class="survey-submit" :disabled="submitting" @click="onSubmit">
            <Icon :icon="icons.checkCircle" :width="15" :height="15" />
            {{ submitting ? '提交中...' : '提交问卷' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.survey-page {
  padding-bottom: $space-10;
}

.survey-main {
  max-width: 760px;
}

.survey-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-sm;
}

// 头部
.survey-header {
  margin-bottom: $space-6;
  padding-bottom: $space-5;
  border-bottom: 1px solid $border-lighter;
}

.survey-badge {
  display: inline-block;
  font-size: $fs-xs;
  color: #fff;
  background: $primary;
  padding: 2px $space-2;
  border-radius: $radius-sm;
  margin-bottom: $space-2;
}

.survey-title {
  font-size: $fs-2xl;
  font-weight: $fw-bold;
  color: $text-primary;
  margin: 0 0 $space-2;
}

.survey-desc {
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: 1.6;
  margin: 0 0 $space-3;
}

.survey-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-xs;
  color: $text-secondary;

  :deep(svg) {
    color: $primary;
  }
}

// 题目
.question-item {
  padding: $space-4 0;
  border-bottom: 1px dashed $border-lighter;

  &:last-of-type {
    border-bottom: none;
  }
}

.question-head {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-3;
}

.question-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: $fs-sm;
  font-weight: $fw-semibold;
  color: #fff;
  background: $primary;
  border-radius: 50%;
  flex-shrink: 0;
}

.question-title {
  flex: 1;
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0;
}

.question-required {
  font-size: $fs-xs;
  color: $danger;
  background: rgba(230, 57, 70, 0.1);
  padding: 2px $space-1;
  border-radius: $radius-sm;
}

.question-optional {
  font-size: $fs-xs;
  color: $text-placeholder;
}

// 选项
.question-options {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding-left: $space-6;
}

.option-item {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  cursor: pointer;
  border-radius: $radius-base;
  transition: background $transition-fast;

  &:hover {
    background: $bg-soft;
  }

  &.checked {
    background: $primary-bg;

    .option-radio,
    .option-check {
      border-color: $primary;
    }

    .option-radio {
      background: $primary;
      border-color: $primary;

      &::after {
        opacity: 1;
      }
    }

    .option-check {
      background: $primary;
      border-color: $primary;

      &::after {
        opacity: 1;
      }
    }

    .option-text {
      color: $primary-dark;
      font-weight: $fw-medium;
    }
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
}

.option-radio {
  width: 16px;
  height: 16px;
  border: 2px solid $border-base;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  transition: all $transition-fast;

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    background: #fff;
    border-radius: 50%;
    opacity: 0;
    transition: opacity $transition-fast;
  }
}

.option-check {
  width: 16px;
  height: 16px;
  border: 2px solid $border-base;
  border-radius: $radius-sm;
  flex-shrink: 0;
  position: relative;
  transition: all $transition-fast;

  &::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    opacity: 0;
    transition: opacity $transition-fast;
  }
}

.option-text {
  font-size: $fs-sm;
  color: $text-primary;
  transition: all $transition-fast;
}

.question-textarea {
  width: 100%;
  margin-left: $space-6;
  padding: $space-2 $space-3;
  font-size: $fs-sm;
  color: $text-primary;
  background: $bg-soft;
  border: 1px solid $border-base;
  border-radius: $radius-base;
  outline: none;
  resize: vertical;
  line-height: 1.6;
  font-family: inherit;

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 2px $focus-ring;
  }
}

// 提交按钮
.survey-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  width: 100%;
  margin-top: $space-5;
  padding: $space-3;
  font-size: $fs-md;
  font-weight: $fw-medium;
  color: #fff;
  background: $primary;
  border: none;
  border-radius: $radius-base;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    background: $primary-dark;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 提交成功
.survey-done {
  text-align: center;
  padding: $space-8 0;

  :deep(svg) {
    color: $success;
    margin-bottom: $space-3;
  }

  h2 {
    font-size: $fs-xl;
    font-weight: $fw-bold;
    color: $text-primary;
    margin: 0 0 $space-2;
  }

  p {
    font-size: $fs-sm;
    color: $text-secondary;
    margin: 0 0 $space-1;
  }

  .done-stats {
    color: $primary;
    font-weight: $fw-medium;
  }

  .done-back {
    display: inline-block;
    margin-top: $space-4;
    padding: $space-2 $space-4;
    font-size: $fs-sm;
    color: #fff;
    background: $primary;
    border-radius: $radius-base;
    transition: background $transition-fast;

    &:hover {
      background: $primary-dark;
    }
  }
}

@include respond-to(xs) {
  .survey-card {
    padding: $space-5 $space-4;
  }

  .question-options,
  .question-textarea {
    padding-left: 0;
    margin-left: 0;
  }
}
</style>
