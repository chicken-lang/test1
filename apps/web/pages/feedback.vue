<script setup lang="ts">
// 教学反馈页 T4.8
// 左侧反馈提交表单 + 右侧我的反馈记录与反馈指南
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { feedbackTypes, feedbackList } from '~/mock/data'

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '教学反馈' },
]

// 表单数据
const formRef = ref<FormInstance>()
const form = reactive({
  type: '',
  subject: '',
  related: '',
  content: '',
  contact: '',
  anonymous: false,
})

// 表单校验规则: 反馈类型、主题、内容必填
const rules: FormRules = {
  type: [{ required: true, message: '请选择反馈类型', trigger: 'change' }],
  subject: [
    { required: true, message: '请输入反馈主题', trigger: 'blur' },
    { min: 4, max: 50, message: '长度在 4 到 50 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入反馈内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '长度在 10 到 1000 个字符', trigger: 'blur' },
  ],
}

// 提交反馈: 校验通过后提示并重置表单
const onSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    ElMessage.success('反馈已提交,我们将在 3 个工作日内处理')
    formRef.value?.resetFields()
  })
}

// 重置表单
const onReset = () => {
  formRef.value?.resetFields()
}

// 反馈记录展开控制(点击单条展开回复内容)
const expandId = ref<number | null>(null)
const toggleExpand = (id: number) => {
  expandId.value = expandId.value === id ? null : id
}

// 反馈指南
const guides = [
  { icon: 'mdi:clock-outline', text: '工作日内 3 个工作日回复' },
  { icon: 'mdi:shield-check-outline', text: '您的信息将严格保密' },
  { icon: 'mdi:alert-circle-outline', text: '紧急问题请直接拨打 0755-8922600' },
  { icon: 'mdi:account-group-outline', text: '教学信息员请使用专项反馈入口' },
]

useSeoMeta({
  title: '教学反馈 - 深圳信息职业技术大学教务处',
  description: '提交课程教学反馈、教师听课反馈、教学信息员反馈、投诉举报与意见建议',
})
</script>

<template>
  <div class="feedback-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:comment-question-outline" />
          教学反馈
        </h1>
        <p class="page-subtitle">Teaching Feedback</p>
      </div>
    </div>

    <div class="container feedback-main">
      <!-- 左侧:反馈提交表单 -->
      <section class="form-card">
        <div class="card-title-group">
          <h2 class="card-title">提交新反馈</h2>
          <div class="title-divider"></div>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="feedback-form"
        >
          <el-form-item label="反馈类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择反馈类型" style="width: 100%">
              <el-option
                v-for="item in feedbackTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <Icon :icon="item.icon" width="16" height="16" style="margin-right: 6px" />
                {{ item.label }}
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="反馈主题" prop="subject">
            <el-input v-model="form.subject" placeholder="请简明描述反馈主题" clearable />
          </el-form-item>

          <el-form-item label="相关课程/教师">
            <el-input v-model="form.related" placeholder="如涉及具体课程或教师请填写" clearable />
          </el-form-item>

          <el-form-item label="反馈内容" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="6"
              placeholder="请详细描述您的反馈内容..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="联系方式">
            <el-input v-model="form.contact" placeholder="手机号或邮箱(便于我们回复)" clearable />
          </el-form-item>

          <el-form-item label="是否匿名">
            <el-switch v-model="form.anonymous" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="onSubmit">提交反馈</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>
      </section>

      <!-- 右侧:我的反馈记录 + 反馈指南 -->
      <aside class="feedback-sidebar">
        <!-- 我的反馈记录 -->
        <div class="side-card">
          <div class="side-header">
            <Icon icon="mdi:history" width="18" height="18" />
            <span>我的反馈记录</span>
          </div>
          <ul class="record-list">
            <li
              v-for="item in feedbackList"
              :key="item.id"
              class="record-item"
              :class="{ 'is-expanded': expandId === item.id }"
            >
              <div class="record-main" @click="toggleExpand(item.id)">
                <h3 class="record-title">{{ item.title }}</h3>
                <div class="record-meta">
                  <el-tag size="small" effect="plain">{{ item.type }}</el-tag>
                  <el-tag
                    size="small"
                    :type="item.status === 'resolved' ? 'success' : 'warning'"
                  >
                    {{ item.status }}
                  </el-tag>
                  <span class="record-date">
                    <Icon icon="mdi:calendar-outline" width="12" height="12" />
                    {{ item.date }}
                  </span>
                </div>
              </div>
              <!-- 展开回复内容 -->
              <div v-if="expandId === item.id" class="record-reply">
                <div class="reply-label">
                  <Icon icon="mdi:reply-outline" width="14" height="14" />
                  回复内容
                </div>
                <p v-if="item.reply" class="reply-text">{{ item.reply }}</p>
                <p v-else class="reply-text reply-empty">暂无回复,处理中</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- 反馈指南 -->
        <div class="side-card">
          <div class="side-header">
            <Icon icon="mdi:information-outline" width="18" height="18" />
            <span>反馈指南</span>
          </div>
          <ul class="guide-list">
            <li v-for="(g, idx) in guides" :key="idx" class="guide-item">
              <Icon :icon="g.icon" width="18" height="18" class="guide-icon" />
              <span>{{ g.text }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.feedback-page {
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

// 主体两栏布局
.feedback-main {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: $space-6;
  align-items: start;
}

// 左侧表单卡片
.form-card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: $space-6;
}

.card-title-group {
  margin-bottom: $space-6;
}

.card-title {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $text-primary;
  margin-bottom: $space-3;
}

// 金色装饰线
.title-divider {
  @include gold-divider(40px);
}

.feedback-form {
  max-width: 100%;
}

// 右侧侧边栏
.feedback-sidebar {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  position: sticky;
  top: $space-6;
}

.side-card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: $space-6;
}

.side-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;

  :deep(svg) {
    color: $gold;
  }
}

// 反馈记录列表
.record-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.record-item {
  background: $bg-soft;
  border-radius: $radius-md;
  padding: $space-3 $space-4;
  cursor: pointer;
  transition: all $transition-base;
  border: 1px solid transparent;

  &:hover {
    background: $primary-bg;
    border-color: $primary-lighter;
  }

  &.is-expanded {
    background: $primary-bg;
    border-color: $primary-lighter;
  }
}

.record-main {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.record-title {
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: $text-primary;
  line-height: $lh-snug;
}

.record-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;
}

.record-date {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  margin-left: auto;
  font-size: $fs-xs;
  color: $text-secondary;
}

// 回复内容
.record-reply {
  margin-top: $space-3;
  padding-top: $space-3;
  border-top: 1px dashed $border-light;
}

.reply-label {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-xs;
  font-weight: $fw-semibold;
  color: $gold-dark;
  margin-bottom: $space-2;

  :deep(svg) {
    color: $gold;
  }
}

.reply-text {
  font-size: $fs-sm;
  color: $text-regular;
  line-height: $lh-relaxed;
}

.reply-empty {
  color: $text-secondary;
  font-style: italic;
}

// 反馈指南列表
.guide-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.guide-item {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  font-size: $fs-sm;
  color: $text-regular;
  line-height: $lh-snug;
}

.guide-icon {
  flex-shrink: 0;
  color: $primary;
  margin-top: 1px;
}

// 响应式: md 断点单列
@include respond-to(md) {
  .feedback-main {
    grid-template-columns: 1fr;
  }

  .feedback-sidebar {
    position: static;
    order: 2;
  }
}

// 响应式: xs 断点表单 label-width 缩小、字号缩小
@include respond-to(xs) {
  .form-card,
  .side-card {
    padding: $space-5;
  }

  :deep(.el-form-item__label) {
    width: 80px !important;
    font-size: $fs-sm;
  }

  .page-title {
    font-size: $fs-2xl;
  }
}
</style>
