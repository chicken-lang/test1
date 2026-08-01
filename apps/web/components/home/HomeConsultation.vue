<script setup lang="ts">
// 留言咨询模块(需求 4.1:分类提交咨询,后台按业务流转,限时答复并可选公开)
// 首页 G 区底部展示,左侧表单提交 + 右侧公开答复列表(Tab 切换)
// API: GET /api/consultation/categories, GET /api/consultation/public, POST /api/consultation/submit
import { icons } from '~/utils/icons'

const api = useApi()

// 咨询分类
const { data: categoriesData } = await useAsyncData('consultation-categories', () =>
  api.get<any[]>('/consultation/categories'),
)
const categories = computed(() => categoriesData.value ?? [])

// 公开答复列表
const { data: publicData } = await useAsyncData('consultation-public', () =>
  api.get<any[]>('/consultation/public'),
)
const publicList = computed(() => publicData.value ?? [])

// Tab 切换:提交咨询 / 公开答复
const activeTab = ref<'form' | 'list'>('form')

// 表单状态
const form = reactive({
  categoryId: '' as number | string,
  title: '',
  content: '',
  isPublic: false,
})
const submitting = ref(false)

// 提交咨询
const onSubmit = async () => {
  if (!form.categoryId || !form.title.trim() || !form.content.trim()) {
    ElMessage.warning('请填写分类、标题和内容')
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
      },
    })
    if (res.code === 0) {
      ElMessage.success(`提交成功,已流转至${res.data.assignedDept},将于 ${res.data.deadline} 前答复`)
      // 重置表单
      form.title = ''
      form.content = ''
      form.isPublic = false
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch {
    ElMessage.error('提交失败,请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section v-reveal class="home-consultation reveal" aria-labelledby="consultation-title">
    <div class="section-header">
      <div class="section-title-group">
        <span id="consultation-title" class="title-cn">留言咨询</span>
        <span class="title-en">Consultation</span>
      </div>
      <NuxtLink to="/consultation" class="section-more">
        查看全部
        <Icon :icon="icons.arrowRight" :width="12" :height="12" />
      </NuxtLink>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-bar" role="tablist">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'form' }"
        role="tab"
        :aria-selected="activeTab === 'form'"
        @click="activeTab = 'form'"
      >
        <Icon :icon="icons.email" :width="14" :height="14" />
        我要咨询
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'list' }"
        role="tab"
        :aria-selected="activeTab === 'list'"
        @click="activeTab = 'list'"
      >
        <Icon :icon="icons.checkCircle" :width="14" :height="14" />
        公开答复 <span v-if="publicList.length" class="tab-count">{{ publicList.length }}</span>
      </button>
    </div>

    <!-- 表单区 -->
    <div v-show="activeTab === 'form'" class="consult-form">
      <div class="form-row">
        <label class="form-label" for="consult-category">咨询分类 <span class="required">*</span></label>
        <select id="consult-category" v-model="form.categoryId" class="form-select" aria-label="选择咨询分类">
          <option value="" disabled>请选择分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}(流转至{{ cat.dept }})</option>
        </select>
      </div>
      <div class="form-row">
        <label class="form-label" for="consult-title">标题 <span class="required">*</span></label>
        <input id="consult-title" v-model="form.title" type="text" class="form-input" placeholder="请简要描述问题" maxlength="50" />
      </div>
      <div class="form-row">
        <label class="form-label" for="consult-content">咨询内容 <span class="required">*</span></label>
        <textarea id="consult-content" v-model="form.content" class="form-textarea" placeholder="请详细描述您的问题(限时 5 个工作日答复)" maxlength="500" rows="4" />
      </div>
      <label class="form-check">
        <input v-model="form.isPublic" type="checkbox" />
        <span>公开咨询及答复(供其他师生参考)</span>
      </label>
      <button class="form-submit" :disabled="submitting" @click="onSubmit">
        <Icon :icon="icons.arrowRight" :width="14" :height="14" />
        {{ submitting ? '提交中...' : '提交咨询' }}
      </button>
    </div>

    <!-- 公开答复列表 -->
    <div v-show="activeTab === 'list'" class="consult-list">
      <div v-if="!publicList.length" class="consult-empty">暂无公开答复</div>
      <div v-for="item in publicList" :key="item.id" class="consult-item">
        <div class="item-header">
          <span class="item-tag">{{ item.categoryName }}</span>
          <span class="item-status" :class="`status-${item.status}`">
            {{ item.status === 'replied' ? '已答复' : '待答复' }}
          </span>
        </div>
        <h4 class="item-title">{{ item.title }}</h4>
        <p class="item-content">{{ item.content }}</p>
        <div v-if="item.reply" class="item-reply">
          <div class="reply-meta">
            <Icon :icon="icons.checkCircle" :width="13" :height="13" />
            <span>{{ item.replyDept }}答复</span>
            <span class="reply-date">{{ item.replyDate }}</span>
          </div>
          <p class="reply-text">{{ item.reply }}</p>
        </div>
        <span class="item-date">提问时间:{{ item.submitDate }}</span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.home-consultation {
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

// Tab
.tab-bar {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-4;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-3;
  font-size: $fs-sm;
  color: $text-secondary;
  background: $bg-soft;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    color: $primary;
  }

  &.active {
    color: #fff;
    background: $primary;
    border-color: $primary;
  }
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  font-size: $fs-xs;
  background: rgba(255, 255, 255, 0.3);
  border-radius: $radius-pill;
}

// 表单
.consult-form {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  min-height: 360px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.form-label {
  font-size: $fs-sm;
  color: $text-secondary;
  font-weight: $fw-medium;

  .required {
    color: $danger;
  }
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: $space-2 $space-3;
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

.form-textarea {
  resize: vertical;
  line-height: 1.6;
}

.form-check {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-sm;
  color: $text-secondary;
  cursor: pointer;

  input {
    accent-color: $primary;
  }
}

.form-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  padding: $space-2 $space-4;
  font-size: $fs-sm;
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

// 公开答复列表(内容过多时滚动,高度与右侧问卷调查对齐)
.consult-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  max-height: 420px;
  overflow-y: auto;
  padding-right: $space-1;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $border-base;
    border-radius: $radius-pill;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: $primary-light;
  }
}

.consult-empty {
  text-align: center;
  padding: $space-6 0;
  color: $text-placeholder;
  font-size: $fs-sm;
}

.consult-item {
  padding: $space-3;
  background: $bg-soft;
  border-radius: $radius-base;
  border-left: 3px solid $primary;
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
  background: $primary-bg;
  padding: 2px $space-2;
  border-radius: $radius-sm;
  font-weight: $fw-medium;
}

.item-status {
  font-size: $fs-xs;
  font-weight: $fw-medium;

  &.status-replied {
    color: $success;
  }

  &.status-pending {
    color: $warning;
  }
}

.item-title {
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0 0 $space-1;
}

.item-content {
  font-size: $fs-sm;
  color: $text-secondary;
  margin: 0 0 $space-2;
  line-height: 1.5;
}

.item-reply {
  background: $bg-card;
  border-radius: $radius-base;
  padding: $space-2 $space-3;
  margin-bottom: $space-2;
}

.reply-meta {
  display: flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-xs;
  color: $primary;
  margin-bottom: $space-1;

  :deep(svg) {
    color: $success;
  }

  .reply-date {
    color: $text-placeholder;
    margin-left: auto;
  }
}

.reply-text {
  font-size: $fs-sm;
  color: $text-primary;
  margin: 0;
  line-height: 1.6;
}

.item-date {
  font-size: $fs-xs;
  color: $text-placeholder;
}
</style>
