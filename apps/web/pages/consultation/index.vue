<script setup lang="ts">
// 留言咨询页 (需求 4.1:分类提交咨询,后台按业务流转,限时答复并可选公开)
// URL: /consultation
// 左侧:咨询提交表单 + 咨询指南;右侧:公开答复列表 + 我的咨询记录
import { icons } from '~/utils/icons'

interface ConsultationCategory {
  id: number
  name: string
  dept: string
}

interface PublicConsultation {
  id: number
  categoryId: number
  categoryName: string
  title: string
  content: string
  status: 'pending' | 'replied' | 'closed'
  submitDate: string
  reply?: string
  replyDate?: string
  replyDept?: string
  deadline: string
}

const api = useApi()

// 咨询分类
const { data: categoriesData } = await useAsyncData('consultation-categories', () =>
  api.get<ConsultationCategory[]>('/consultation/categories'),
)
const categories = computed(() => categoriesData.value ?? [])

// 公开答复列表
const { data: publicData, refresh: refreshPublic } = await useAsyncData(
  'consultation-public-list',
  () => api.get<PublicConsultation[]>('/consultation/public'),
)
const publicList = computed<PublicConsultation[]>(() => publicData.value ?? [])

// 我的咨询记录
interface MyConsultation {
  id: number
  categoryName: string
  title: string
  status: 'pending' | 'replied' | 'closed'
  submitDate: string
  reply?: string
  replyDate?: string
  replyDept?: string
  deadline: string
  isPublic: boolean
}

const { data: myData, refresh: refreshMy } = await useAsyncData(
  'my-consultations',
  () => api.get<{ list: MyConsultation[] }>('/user/consultations'),
)
const myList = computed<MyConsultation[]>(() => myData.value?.list ?? [])

// Tab 切换:提交咨询 / 公开答复 / 我的咨询 / 咨询指南
const activeTab = ref<'submit' | 'list' | 'mine' | 'guide'>('submit')

// 表单状态
const form = reactive({
  categoryId: '' as number | string,
  title: '',
  content: '',
  isPublic: false,
  contact: '',
})
const submitting = ref(false)

// 提交咨询
const onSubmit = async () => {
  if (!form.categoryId || !form.title.trim() || !form.content.trim()) {
    ElMessage.warning('请填写咨询分类、标题和内容')
    return
  }
  if (form.content.trim().length < 10) {
    ElMessage.warning('咨询内容至少 10 个字符')
    return
  }
  submitting.value = true
  try {
    const res = await $fetch<{ code: number; data: any; message?: string }>('/api/consultation/submit', {
      method: 'POST',
      body: {
        categoryId: Number(form.categoryId),
        title: form.title.trim(),
        content: form.content.trim(),
        isPublic: form.isPublic,
        contact: form.contact.trim(),
      },
    })
    if (res.code === 0) {
      ElMessage.success(`提交成功!已流转至${res.data.assignedDept},将于 ${res.data.deadline} 前答复`)
      // 重置表单
      form.categoryId = ''
      form.title = ''
      form.content = ''
      form.isPublic = false
      form.contact = ''
      // 刷新公开列表
      refreshPublic()
      // 切换到公开答复 Tab
      activeTab.value = 'list'
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch {
    ElMessage.error('提交失败,请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 展开/收起公开答复
const expandId = ref<number | null>(null)
const toggleExpand = (id: number) => {
  expandId.value = expandId.value === id ? null : id
}

// 计算剩余天数
const daysLeft = (deadline: string) => {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// 咨询指南
const guides = [
  { icon: icons.clock, text: '工作日内 5 个工作日答复' },
  { icon: icons.shield, text: '您的个人信息将严格保密' },
  { icon: icons.phone, text: '紧急问题请直接拨打 0755-89226666' },
  { icon: icons.accountGroup, text: '选择正确的咨询分类可加速处理' },
  { icon: icons.checkCircle, text: '勾选"公开"可让其他师生参考' },
]

// 状态映射
const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待答复', color: '#faad14' },
  replied: { label: '已答复', color: '#52c41a' },
  closed: { label: '已关闭', color: '#a8b1bd' },
}

// 面包屑
const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '留言咨询' },
]

useSeoMeta({
  title: '留言咨询 - 深圳信息职业技术大学教务处',
  description: '提交教学管理咨询,查看公开答复,限时 5 个工作日答复',
})
</script>

<template>
  <div class="consultation-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon :icon="icons.email" />
          留言咨询
        </h1>
        <p class="page-subtitle">Consultation</p>
      </div>
    </div>

    <div class="container consultation-main">
      <!-- 左侧:咨询提交 + 咨询指南 -->
      <div class="consult-left">
        <!-- Tab 切换 -->
        <div class="tab-bar">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'submit' }"
            @click="activeTab = 'submit'"
          >
            <Icon :icon="icons.edit" :width="14" :height="14" />
            提交咨询
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'mine' }"
            @click="activeTab = 'mine'"
          >
            <Icon :icon="icons.history" :width="14" :height="14" />
            我的咨询
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'guide' }"
            @click="activeTab = 'guide'"
          >
            <Icon :icon="icons.information" :width="14" :height="14" />
            咨询指南
          </button>
        </div>

        <!-- 提交咨询表单 -->
        <div v-show="activeTab === 'submit'" class="form-card">
          <div class="card-header">
            <h2 class="card-title">提交新咨询</h2>
            <p class="card-desc">选择对应业务分类提交咨询,我们将在 5 个工作日内答复</p>
          </div>

          <div class="form-body">
            <div class="form-row">
              <label class="form-label">
                咨询分类 <span class="required">*</span>
              </label>
              <div class="form-select-wrap">
                <select v-model="form.categoryId" class="form-select">
                  <option value="" disabled>请选择分类</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }} (流转至{{ cat.dept }})
                  </option>
                </select>
                <Icon :icon="icons.chevronDown" :width="16" :height="16" class="select-arrow" />
              </div>
            </div>

            <div class="form-row">
              <label class="form-label">
                咨询标题 <span class="required">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                class="form-input"
                placeholder="请简明描述问题(4-50字)"
                maxlength="50"
              />
              <span class="form-counter">{{ form.title.length }}/50</span>
            </div>

            <div class="form-row">
              <label class="form-label">
                咨询内容 <span class="required">*</span>
              </label>
              <textarea
                v-model="form.content"
                class="form-textarea"
                placeholder="请详细描述您的问题(不少于 10 字)"
                maxlength="500"
                rows="6"
              />
              <span class="form-counter">{{ form.content.length }}/500</span>
            </div>

            <div class="form-row">
              <label class="form-label">联系方式</label>
              <input
                v-model="form.contact"
                type="text"
                class="form-input"
                placeholder="手机号或邮箱(选填,便于我们回复您)"
              />
            </div>

            <label class="form-check">
              <input v-model="form.isPublic" type="checkbox" />
              <span class="check-label">
                公开咨询及答复
                <span class="check-hint">(勾选后,您的咨询及答复将公开,供其他师生参考)</span>
              </span>
            </label>

            <button class="form-submit" :disabled="submitting" @click="onSubmit">
              <Icon :icon="icons.arrowRight" :width="15" :height="15" />
              {{ submitting ? '提交中...' : '提交咨询' }}
            </button>
          </div>
        </div>

        <!-- 我的咨询 -->
        <div v-show="activeTab === 'mine'" class="mine-card">
          <div class="card-header">
            <h2 class="card-title">我的咨询记录</h2>
            <p class="card-desc">查看您提交的所有咨询及处理状态</p>
          </div>

          <div class="mine-body">
            <div v-if="!myList.length" class="empty-state">
              <Icon :icon="icons.inbox" :width="48" :height="48" />
              <p>暂无咨询记录</p>
              <button class="empty-action" @click="activeTab = 'submit'">去提交咨询</button>
            </div>

            <div v-else class="mine-list">
              <div
                v-for="item in myList"
                :key="item.id"
                class="mine-item"
                :class="{ 'is-expanded': expandId === item.id }"
              >
                <div class="mine-header" @click="toggleExpand(item.id)">
                  <div class="mine-tags">
                    <span class="item-tag">{{ item.categoryName }}</span>
                    <span class="item-status" :style="{ color: statusMap[item.status]?.color }">
                      {{ statusMap[item.status]?.label || item.status }}
                    </span>
                  </div>
                  <Icon
                    :icon="expandId === item.id ? icons.chevronUp : icons.chevronDown"
                    :width="16"
                    :height="16"
                    class="expand-icon"
                  />
                </div>
                <h3 class="mine-title">{{ item.title }}</h3>
                <div class="mine-meta">
                  <span>
                    <Icon :icon="icons.clock" :width="12" :height="12" />
                    提交于 {{ item.submitDate }}
                  </span>
                  <span v-if="item.status === 'pending'">
                    <Icon :icon="icons.clock" :width="12" :height="12" />
                    预计 {{ item.deadline }} 前答复
                  </span>
                </div>

                <!-- 展开内容 -->
                <div v-if="expandId === item.id" class="mine-detail">
                  <div v-if="item.reply" class="mine-reply">
                    <div class="reply-meta">
                      <Icon :icon="icons.checkCircle" :width="14" :height="14" />
                      <span>{{ item.replyDept }} 于 {{ item.replyDate }} 答复</span>
                    </div>
                    <p class="reply-text">{{ item.reply }}</p>
                  </div>
                  <div v-else class="mine-pending">
                    <Icon :icon="icons.clock" :width="16" :height="16" />
                    <p>您的咨询正在处理中,请耐心等待</p>
                    <p>截止时间:{{ item.deadline }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 咨询指南 -->
        <div v-show="activeTab === 'guide'" class="guide-card">
          <div class="card-header">
            <h2 class="card-title">咨询指南</h2>
            <p class="card-desc">了解咨询流程和注意事项</p>
          </div>

          <div class="guide-content">
            <div class="guide-section">
              <h3 class="guide-title">
                <Icon :icon="icons.target" :width="18" :height="18" />
                咨询流程
              </h3>
              <ol class="guide-steps">
                <li>选择与您问题相关的业务分类</li>
                <li>填写咨询标题和详细内容</li>
                <li>可选择是否公开咨询</li>
                <li>提交后由对应业务科室受理</li>
                <li>5 个工作日内答复(紧急问题请电话联系)</li>
              </ol>
            </div>

            <div class="guide-section">
              <h3 class="guide-title">
                <Icon :icon="icons.lightbulb" :width="18" :height="18" />
                温馨提示
              </h3>
              <ul class="guide-tips">
                <li>选择正确的分类可以加速问题处理</li>
                <li>详细描述问题背景有助于快速定位</li>
                <li>咨询内容不少于 10 个字</li>
                <li>请不要在咨询中包含身份证号、银行卡号等敏感信息</li>
                <li>如需快速响应,请拨打:0755-89226666</li>
              </ul>
            </div>

            <div class="guide-section">
              <h3 class="guide-title">
                <Icon :icon="icons.phone" :width="18" :height="18" />
                联系方式
              </h3>
              <div class="contact-info">
                <div class="contact-item">
                  <span class="contact-label">教务科</span>
                  <span class="contact-phone">0755-89226666</span>
                </div>
                <div class="contact-item">
                  <span class="contact-label">学籍科</span>
                  <span class="contact-phone">0755-89226666-8002</span>
                </div>
                <div class="contact-item">
                  <span class="contact-label">考试科</span>
                  <span class="contact-phone">0755-89226666-8003</span>
                </div>
                <div class="contact-item">
                  <span class="contact-label">教研科</span>
                  <span class="contact-phone">0755-89226666-8005</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧:公开答复列表 -->
      <div class="consult-right">
        <div class="right-card">
          <div class="right-header">
            <div class="right-title-group">
              <Icon :icon="icons.checkCircle" :width="20" :height="20" />
              <h2 class="right-title">公开答复</h2>
              <span v-if="publicList.length" class="right-count">{{ publicList.length }}</span>
            </div>
            <span class="right-tip">查看已公开的咨询及答复</span>
          </div>

          <div v-if="!publicList.length" class="empty-state">
            <Icon :icon="icons.inbox" :width="48" :height="48" />
            <p>暂无公开答复</p>
          </div>

          <div v-else class="consult-list">
            <div
              v-for="item in publicList"
              :key="item.id"
              class="consult-item"
              :class="{ 'is-expanded': expandId === item.id }"
            >
              <!-- 头部:分类标签 + 状态 -->
              <div class="item-header">
                <span class="item-tag">{{ item.categoryName }}</span>
                <span class="item-status" :style="{ color: statusMap[item.status]?.color }">
                  {{ statusMap[item.status]?.label || item.status }}
                </span>
              </div>

              <!-- 标题 + 日期 -->
              <div class="item-main" @click="toggleExpand(item.id)">
                <h3 class="item-title">{{ item.title }}</h3>
                <span class="item-date">
                  <Icon :icon="icons.clock" :width="12" :height="12" />
                  {{ item.submitDate }}
                </span>
              </div>

              <!-- 问题内容 -->
              <p class="item-content">{{ item.content }}</p>

              <!-- 答复内容 -->
              <div v-if="item.reply" class="item-reply">
                <div class="reply-meta">
                  <Icon :icon="icons.checkCircle" :width="14" :height="14" />
                  <span class="reply-dept">{{ item.replyDept }}答复</span>
                  <span class="reply-date">{{ item.replyDate }}</span>
                </div>
                <p class="reply-text">{{ item.reply }}</p>
              </div>

              <!-- 展开提示 -->
              <div v-if="!item.reply && expandId !== item.id" class="item-hint">
                <Icon :icon="icons.clock" :width="12" :height="12" />
                将于 {{ item.deadline }} 前答复
              </div>
              <div v-else-if="item.reply && expandId !== item.id" class="item-expand-hint">
                点击查看完整答复
                <Icon :icon="icons.chevronDown" :width="12" :height="12" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧:快速指南 -->
        <div class="quick-guide">
          <div class="quick-guide-header">
            <Icon :icon="icons.lightbulb" :width="16" :height="16" />
            <span>咨询指南速览</span>
          </div>
          <ul class="quick-guide-list">
            <li v-for="(g, idx) in guides" :key="idx" class="quick-guide-item">
              <Icon :icon="g.icon" :width="16" :height="16" class="guide-icon" />
              <span>{{ g.text }}</span>
            </li>
          </ul>
          <button class="guide-link" @click="activeTab = 'guide'">
            查看完整指南
            <Icon :icon="icons.arrowRight" :width="12" :height="12" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.consultation-page {
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

// ========== 主体两栏布局 ==========
.consultation-main {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: $space-6;
  align-items: start;
  max-width: 1200px;
}

// ========== 左侧 ==========
.consult-left {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

// Tab
.tab-bar {
  display: flex;
  gap: $space-2;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-2;
  box-shadow: $shadow-sm;
  border: 1px solid $border-lighter;
}

.tab-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  font-size: $fs-sm;
  font-weight: $fw-medium;
  color: $text-secondary;
  background: transparent;
  border: none;
  border-radius: $radius-base;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    color: $primary;
    background: $primary-bg;
  }

  &.active {
    color: #fff;
    background: $primary;

    &:hover {
      background: $primary-dark;
      color: #fff;
    }
  }
}

// 表单卡片
.form-card,
.mine-card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  border: 1px solid $border-lighter;
  overflow: hidden;
}

.card-header {
  padding: $space-5 $space-6;
  border-bottom: 1px solid $border-lighter;
  background: linear-gradient(135deg, $primary-bg 0%, $bg-card 100%);
}

.card-title {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $text-primary;
  margin: 0 0 $space-1;
}

.card-desc {
  font-size: $fs-sm;
  color: $text-secondary;
  margin: 0;
  line-height: 1.6;
}

.form-body {
  padding: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.form-label {
  font-size: $fs-sm;
  color: $text-secondary;
  font-weight: $fw-medium;

  .required {
    color: $danger;
  }
}

.form-select-wrap {
  position: relative;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: $space-3 $space-4;
  padding-right: $space-10;
  font-size: $fs-sm;
  color: $text-primary;
  background: $bg-soft;
  border: 1px solid $border-base;
  border-radius: $radius-base;
  outline: none;
  transition: all $transition-fast;
  font-family: inherit;

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 2px $focus-ring;
  }
}

.form-select {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.select-arrow {
  position: absolute;
  right: $space-3;
  top: 50%;
  transform: translateY(-50%);
  color: $text-placeholder;
  pointer-events: none;
}

.form-textarea {
  resize: vertical;
  line-height: 1.6;
  min-height: 120px;
}

.form-counter {
  font-size: $fs-xs;
  color: $text-placeholder;
  text-align: right;
  margin-top: 2px;
}

.form-check {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  font-size: $fs-sm;
  cursor: pointer;

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    accent-color: $primary;
    cursor: pointer;
    flex-shrink: 0;
  }
}

.check-label {
  color: $text-primary;
  font-weight: $fw-medium;
}

.check-hint {
  display: block;
  font-size: $fs-xs;
  color: $text-secondary;
  font-weight: $fw-regular;
  margin-top: 2px;
}

.form-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3 $space-6;
  font-size: $fs-base;
  font-weight: $fw-medium;
  color: #fff;
  background: $primary;
  border: none;
  border-radius: $radius-base;
  cursor: pointer;
  transition: all $transition-fast;
  align-self: flex-start;
  min-width: 160px;

  &:hover:not(:disabled) {
    background: $primary-dark;
    box-shadow: $shadow-primary;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 我的咨询
.mine-body {
  padding: $space-6;
}

.mine-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.mine-item {
  background: $bg-soft;
  border-radius: $radius-base;
  padding: $space-4;
  border-left: 3px solid $primary;
  transition: all $transition-fast;

  &.is-expanded {
    background: $primary-bg;
  }
}

.mine-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.mine-tags {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.expand-icon {
  color: $text-placeholder;
  transition: transform $transition-fast;
}

.mine-title {
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: $space-2 0 $space-1;
  line-height: 1.4;
}

.mine-meta {
  display: flex;
  align-items: center;
  gap: $space-4;
  font-size: $fs-xs;
  color: $text-secondary;

  span {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  :deep(svg) {
    color: $primary;
  }
}

.mine-detail {
  margin-top: $space-3;
  padding-top: $space-3;
  border-top: 1px dashed $border-lighter;
}

.mine-reply {
  background: $bg-card;
  border-radius: $radius-base;
  padding: $space-3;
  border-left: 3px solid $success;
}

.mine-pending {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  background: rgba($warning, 0.1);
  border-radius: $radius-base;
  text-align: center;

  :deep(svg) {
    color: $warning;
  }

  p {
    margin: 0;
    font-size: $fs-sm;
    color: $text-secondary;
  }
}

.empty-action {
  margin-top: $space-3;
  padding: $space-2 $space-4;
  font-size: $fs-sm;
  color: #fff;
  background: $primary;
  border: none;
  border-radius: $radius-base;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover {
    background: $primary-dark;
  }
}

// 指南卡片
.guide-card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  border: 1px solid $border-lighter;
  overflow: hidden;
}

.guide-content {
  padding: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.guide-section {
  &:not(:last-child) {
    padding-bottom: $space-5;
    border-bottom: 1px dashed $border-lighter;
  }
}

.guide-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0 0 $space-3;

  :deep(svg) {
    color: $primary;
  }
}

.guide-steps,
.guide-tips {
  margin: 0;
  padding-left: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.guide-steps li {
  font-size: $fs-sm;
  color: $text-regular;
  line-height: 1.6;
}

.guide-tips li {
  font-size: $fs-sm;
  color: $text-regular;
  line-height: 1.6;
}

.contact-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-3;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-3;
  background: $bg-soft;
  border-radius: $radius-base;
}

.contact-label {
  font-size: $fs-xs;
  color: $text-secondary;
}

.contact-phone {
  font-size: $fs-sm;
  color: $primary;
  font-weight: $fw-medium;
}

// ========== 右侧 ==========
.consult-right {
  position: sticky;
  top: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.right-card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  border: 1px solid $border-lighter;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-header {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  padding: $space-4 $space-5;
  border-bottom: 1px solid $border-lighter;
  background: $bg-soft;
}

.right-title-group {
  display: flex;
  align-items: center;
  gap: $space-2;

  :deep(svg) {
    color: $primary;
  }
}

.right-title {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $text-primary;
  margin: 0;
}

.right-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  font-size: $fs-xs;
  font-weight: $fw-medium;
  color: $primary;
  background: $primary-bg;
  border-radius: $radius-pill;
}

.right-tip {
  font-size: $fs-xs;
  color: $text-secondary;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-10 $space-4;
  color: $text-placeholder;

  :deep(svg) {
    color: $border-base;
    margin-bottom: $space-3;
  }

  p {
    font-size: $fs-sm;
    margin: 0;
  }
}

// 咨询列表
.consult-list {
  flex: 1;
  overflow-y: auto;
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $border-base;
    border-radius: $radius-pill;
  }
}

.consult-item {
  background: $bg-soft;
  border-radius: $radius-base;
  padding: $space-3 $space-4;
  border-left: 3px solid $primary;
  transition: all $transition-fast;

  &:hover {
    background: $primary-bg;
  }

  &.is-expanded {
    background: $primary-bg;
  }
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-2;
}

.item-tag {
  font-size: $fs-xs;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 2px $space-2;
  border-radius: $radius-sm;
  font-weight: $fw-medium;
}

.item-status {
  font-size: $fs-xs;
  font-weight: $fw-medium;
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;
  cursor: pointer;
}

.item-title {
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.item-date {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-size: $fs-xs;
  color: $text-placeholder;

  :deep(svg) {
    color: $text-placeholder;
  }
}

.item-content {
  font-size: $fs-sm;
  color: $text-regular;
  margin: $space-2 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-reply {
  background: $bg-card;
  border-radius: $radius-base;
  padding: $space-3;
  margin-top: $space-2;
  border-left: 3px solid $success;
}

.reply-meta {
  display: flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-xs;
  color: $success;
  margin-bottom: $space-2;

  :deep(svg) {
    color: $success;
  }

  .reply-date {
    margin-left: auto;
    color: $text-placeholder;
  }
}

.reply-text {
  font-size: $fs-sm;
  color: $text-primary;
  margin: 0;
  line-height: 1.6;
}

.item-hint,
.item-expand-hint {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: $fs-xs;
  color: $text-placeholder;
  margin-top: $space-2;

  :deep(svg) {
    color: $text-placeholder;
  }
}

// 快速指南
.quick-guide {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  border: 1px solid $border-lighter;
  padding: $space-4 $space-5;
}

.quick-guide-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-sm;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin-bottom: $space-3;

  :deep(svg) {
    color: $warning;
  }
}

.quick-guide-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.quick-guide-item {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  font-size: $fs-xs;
  color: $text-regular;
  line-height: 1.5;

  .guide-icon {
    flex-shrink: 0;
    color: $primary;
    margin-top: 2px;
  }
}

.guide-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  width: 100%;
  margin-top: $space-4;
  padding: $space-2;
  font-size: $fs-xs;
  font-weight: $fw-medium;
  color: $primary;
  background: $primary-bg;
  border: none;
  border-radius: $radius-base;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $primary;
    color: #fff;

    :deep(svg) {
      color: #fff;
    }
  }

  :deep(svg) {
    transition: transform $transition-fast;
  }
}

// ========== 响应式 ==========
@include respond-to(md) {
  .consultation-main {
    grid-template-columns: 1fr;
  }

  .consult-right {
    position: static;
    order: 2;
  }

  .right-card {
    max-height: none;
  }
}

@include respond-to(xs) {
  .page-title {
    font-size: $fs-2xl;
  }

  .form-body,
  .guide-content {
    padding: $space-5 $space-4;
  }

  .card-header {
    padding: $space-4 $space-5;
  }

  .contact-info {
    grid-template-columns: 1fr;
  }

  .form-submit {
    width: 100%;
    min-width: auto;
  }

  .item-main {
    flex-direction: column;
    gap: $space-1;
  }
}
</style>
