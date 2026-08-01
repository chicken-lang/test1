<template>
  <div class="list-guide">
    <!-- 事项卡片列表 -->
    <div v-for="(item, idx) in items" :key="item.id" class="guide-card" v-reveal>
      <!-- 事项头部 -->
      <div class="guide-header">
        <span class="guide-num">{{ idx + 1 }}</span>
        <h3 class="guide-title">{{ item.title }}</h3>
      </div>

      <!-- 固定结构:办理对象→办理流程→所需材料→办理时限→联系业务及电话→相关附件 -->
      <div class="guide-body">
        <!-- 办理对象 -->
        <div class="guide-section">
          <div class="section-label">
            <Icon :icon="icons.user" :width="16" :height="16" />
            <span>办理对象</span>
          </div>
          <div class="section-content">{{ item.target }}</div>
        </div>

        <!-- 办理流程 -->
        <div class="guide-section">
          <div class="section-label">
            <Icon :icon="icons.guide" :width="16" :height="16" />
            <span>办理流程</span>
          </div>
          <ol class="process-list">
            <li v-for="(step, i) in item.process" :key="i" class="process-step">
              <span class="step-num">{{ i + 1 }}</span>
              <span class="step-text">{{ step }}</span>
            </li>
          </ol>
        </div>

        <!-- 所需材料 -->
        <div class="guide-section">
          <div class="section-label">
            <Icon :icon="icons.document" :width="16" :height="16" />
            <span>所需材料</span>
          </div>
          <ul class="material-list">
            <li v-for="(mat, i) in item.materials" :key="i" class="material-item">
              <Icon :icon="icons.archive" :width="14" :height="14" />
              <span>{{ mat }}</span>
            </li>
          </ul>
        </div>

        <!-- 办理时限 + 联系业务(双列) -->
        <div class="guide-row">
          <div class="guide-section">
            <div class="section-label">
              <Icon :icon="icons.schedule" :width="16" :height="16" />
              <span>办理时限</span>
            </div>
            <div class="section-content highlight">{{ item.duration }}</div>
          </div>
          <div class="guide-section">
            <div class="section-label">
              <Icon :icon="icons.contact" :width="16" :height="16" />
              <span>联系业务及电话</span>
            </div>
            <div class="section-content">
              {{ item.contactDept }}
              <span class="phone">{{ item.contactPhone }}</span>
            </div>
          </div>
        </div>

        <!-- 相关附件 -->
        <div v-if="item.attachments.length" class="guide-section">
          <div class="section-label">
            <Icon :icon="icons.download" :width="16" :height="16" />
            <span>相关附件</span>
          </div>
          <div class="attachment-list">
            <button
              v-for="(att, i) in item.attachments"
              :key="i"
              class="attachment-item"
              :aria-label="`下载附件 ${att.name}`"
              @click="downloadAttachment(att)"
            >
              <Icon :icon="icons.document" :width="14" :height="14" />
              <span class="att-name">{{ att.name }}</span>
              <span class="att-size">{{ att.size }}</span>
              <Icon :icon="icons.download" :width="14" :height="14" class="att-download-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!items.length" class="guide-empty">
      <EmptyState variant="empty" title="暂无办事指南" description="该分类下暂无事项内容" />
    </div>
  </div>
</template>

<script setup lang="ts">
// ListGuide v1.1 - 事项页模板(需求 5.2)
// 固定结构: 办理对象 → 办理流程 → 所需材料 → 办理时限 → 联系业务及电话 → 相关附件
// 适用于办事指南各事项(guide-student/teacher/visitor)
// v1.1: 附件可点击下载(Mock 阶段生成临时文件)
import { icons } from '~/utils/icons'

interface GuideItem {
  id: number
  title: string
  columnSlug: string
  target: string
  process: string[]
  materials: string[]
  duration: string
  contactDept: string
  contactPhone: string
  attachments: { name: string; size: string }[]
}

defineProps<{
  items: GuideItem[]
}>()

// 附件下载(Mock 阶段: 生成临时文本文件供测试下载)
const downloadAttachment = (att: { name: string; size: string }) => {
  const content = [
    '================================',
    `附件名称: ${att.name}`,
    `文件大小: ${att.size}`,
    `下载时间: ${new Date().toLocaleString('zh-CN')}`,
    '================================',
    '',
    '此文件为测试阶段的模拟附件。',
    '后端服务就绪后,将提供真实文件下载。',
    '',
    '来源: 深圳信息职业技术大学教务处',
  ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = att.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style lang="scss" scoped>
.list-guide {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

// ========== 事项卡片 ==========
.guide-card {
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  overflow: hidden;
  transition: box-shadow $transition-base;

  &:hover {
    box-shadow: $shadow-primary;
  }
}

// 事项头部
.guide-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4 $space-5;
  background: $primary-dark;
  color: #fff;
}

.guide-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  font-family: $font-serif;
  font-size: $fs-md;
  font-weight: $fw-bold;
  flex-shrink: 0;
}

.guide-title {
  font-size: $fs-lg;
  font-weight: $fw-semibold;
  margin: 0;
  color: #fff;
}

// 事项主体
.guide-body {
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

// 每个区块
.guide-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.section-label {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-sm;
  font-weight: $fw-semibold;
  color: $primary;
  padding-bottom: $space-1;
  border-bottom: 1px dashed $border-lighter;
}

.section-content {
  font-size: $fs-base;
  color: $text-primary;
  line-height: $lh-base;

  &.highlight {
    color: $danger;
    font-weight: $fw-medium;
  }
}

// 双列布局(时限+联系)
.guide-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-5;

  .guide-section {
    gap: $space-1;
  }
}

// 办理流程
.process-list {
  list-style: none;
  margin: 0;
  padding: 0;
  counter-reset: step;
}

.process-step {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-2 0;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 11px;
    top: 28px;
    bottom: -4px;
    width: 2px;
    background: $border-lighter;
  }
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: $primary-bg;
  color: $primary;
  font-size: $fs-xs;
  font-weight: $fw-bold;
  flex-shrink: 0;
  z-index: 1;
}

.step-text {
  font-size: $fs-base;
  color: $text-primary;
  line-height: 1.6;
  padding-top: 2px;
}

// 所需材料
.material-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.material-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  background: $bg-soft;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  font-size: $fs-sm;
  color: $text-regular;
}

// 联系电话
.phone {
  color: $primary;
  font-weight: $fw-semibold;
  font-family: $font-serif;
  margin-left: $space-2;
}

// 相关附件
.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.attachment-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  background: $primary-bg;
  border: 1px solid rgba(0, 115, 189, 0.2);
  border-radius: $radius-base;
  font-size: $fs-sm;
  color: $primary-dark;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $primary;
    color: #fff;
    border-color: $primary;
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }

  .att-name {
    font-weight: $fw-medium;
  }

  .att-size {
    font-size: $fs-xs;
    opacity: 0.7;
  }

  .att-download-icon {
    opacity: 0.6;
    transition: opacity $transition-fast;
  }

  &:hover .att-download-icon {
    opacity: 1;
  }
}

// 空状态
.guide-empty {
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
}

// 移动端
@include respond-to(xs) {
  .guide-body {
    padding: $space-4 $space-3;
  }

  .guide-row {
    grid-template-columns: 1fr;
    gap: $space-3;
  }
}
</style>
