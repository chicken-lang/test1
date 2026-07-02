<script setup lang="ts">
// 信息公开申请页
// el-form 申请表单(姓名/联系方式/申请内容/验证码) + 办理流程说明(4步)
import type { FormInstance, FormRules } from 'element-plus'

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '信息公开', to: '/disclosure' },
  { title: '信息公开申请' },
]

// 表单数据
const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  contact: '',
  content: '',
  captcha: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入申请人姓名', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }],
  content: [{ required: true, message: '请输入申请内容', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

// 提交申请
const submitting = ref(false)
const onSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    submitting.value = true
    // 模拟提交
    setTimeout(() => {
      submitting.value = false
      ElMessage.success('申请已提交,我们将在15个工作日内答复')
      formRef.value?.resetFields()
    }, 600)
  })
}

// 办理流程
const steps = [
  { title: '提交申请', desc: '在线填写并提交信息公开申请表', icon: 'mdi:file-document-edit-outline' },
  { title: '受理审查', desc: '教务处对申请材料进行受理与审查', icon: 'mdi:clipboard-check-outline' },
  { title: '办理答复', desc: '15个工作日内予以书面答复', icon: 'mdi:email-check-outline' },
  { title: '复议诉讼', desc: '对答复不服可依法申请复议或诉讼', icon: 'mdi:gavel' },
]

useSeoMeta({
  title: '信息公开申请 - 深圳信息职业技术大学教务处',
  description: '深圳信息职业技术大学教务处信息公开在线申请',
})
</script>

<template>
  <div class="apply-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:file-document-edit-outline" />
          信息公开申请
        </h1>
        <p class="page-subtitle">Apply for Disclosure</p>
      </div>
    </div>

    <div class="container">
      <!-- 申请表单 -->
      <div class="apply-card">
        <div class="apply-card-header">
          <Icon icon="mdi:form-select" width="22" height="22" />
          <h2>信息公开申请表</h2>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="apply-form"
        >
          <div class="form-row">
            <el-form-item label="申请人姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入您的姓名" clearable />
            </el-form-item>
            <el-form-item label="联系方式" prop="contact">
              <el-input v-model="form.contact" placeholder="请输入手机号或邮箱" clearable />
            </el-form-item>
          </div>

          <el-form-item label="申请内容" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="5"
              placeholder="请详细描述您需要申请公开的信息内容、用途等"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="form.captcha" placeholder="请输入验证码" clearable />
              <div class="captcha-box">
                <Icon icon="mdi:shield-check-outline" width="20" height="20" />
                <span>点击获取</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" class="submit-btn" @click="onSubmit">
              <Icon icon="mdi:send" width="16" height="16" />
              提交申请
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 办理流程 -->
      <div class="process-card">
        <div class="process-header">
          <Icon icon="mdi:clipboard-list-outline" width="22" height="22" />
          <h2>办理流程</h2>
        </div>
        <div class="process-steps">
          <div v-for="(step, idx) in steps" :key="idx" class="process-step">
            <div class="step-index">{{ idx + 1 }}</div>
            <div class="step-icon">
              <Icon :icon="step.icon" width="24" height="24" />
            </div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-desc">{{ step.desc }}</p>
            <Icon
              v-if="idx < steps.length - 1"
              icon="mdi:chevron-right"
              class="step-arrow"
              width="20"
              height="20"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.apply-page {
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

// 申请表单卡片
.apply-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-sm;
  margin-bottom: $space-6;
}

.apply-card-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-6;
  padding-bottom: $space-4;
  border-bottom: 1px solid $border-lighter;

  :deep(svg) {
    color: $primary;
  }

  h2 {
    font-size: $fs-xl;
    font-weight: $fw-bold;
    color: $text-primary;
    margin: 0;
  }
}

.apply-form {
  max-width: 760px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-5;
}

.captcha-row {
  display: flex;
  gap: $space-3;

  .el-input {
    flex: 1;
  }
}

.captcha-box {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0 $space-4;
  background: $grad-primary-soft;
  color: $primary;
  border-radius: $radius-base;
  cursor: pointer;
  font-size: $fs-sm;
  white-space: nowrap;
  transition: all $transition-fast;

  &:hover {
    background: $primary-bg;
  }
}

.submit-btn {
  :deep(svg) {
    margin-right: $space-1;
  }
}

// 办理流程卡片
.process-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-sm;
}

.process-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-6;
  padding-bottom: $space-4;
  border-bottom: 1px solid $border-lighter;

  :deep(svg) {
    color: $gold;
  }

  h2 {
    font-size: $fs-xl;
    font-weight: $fw-bold;
    color: $text-primary;
    margin: 0;
  }
}

.process-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-4;
}

.process-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: $space-5 $space-3;
  background: $bg-soft;
  border-radius: $radius-md;
  transition: all $transition-base;

  &:hover {
    background: $primary-bg;
    transform: translateY(-2px);
  }
}

.step-index {
  position: absolute;
  top: $space-2;
  right: $space-3;
  font-family: $font-serif;
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $border-base;
  line-height: 1;
}

.step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: $bg-card;
  color: $primary;
  margin-bottom: $space-3;
  box-shadow: $shadow-xs;
}

.step-title {
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin-bottom: $space-2;
}

.step-desc {
  font-size: $fs-xs;
  color: $text-secondary;
  line-height: $lh-snug;
}

.step-arrow {
  position: absolute;
  top: 50%;
  right: -16px;
  transform: translateY(-50%);
  color: $border-base;
  z-index: 1;
  background: $bg-soft;
  border-radius: 50%;
}

// 响应式
@include respond-to(md) {
  .process-steps {
    grid-template-columns: repeat(2, 1fr);
  }

  .step-arrow {
    display: none;
  }
}

@include respond-to(xs) {
  .apply-card,
  .process-card {
    padding: $space-5;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .process-steps {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: $fs-2xl;
  }
}
</style>
