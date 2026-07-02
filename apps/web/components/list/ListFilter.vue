<script setup lang="ts">
// ListFilter v3.0: 列表筛选区(年度/月份/标签)
// 应用 v3.0 设计令牌:金色 active 渐变 + icons 字典 + 焦点态
import { icons } from '~/utils/icons'

const props = defineProps<{
  year: number | undefined
  month: number | undefined
  tag: string | undefined
  years: number[]
  tags: string[]
}>()

const emit = defineEmits<{
  (e: 'update:year', v: number | undefined): void
  (e: 'update:month', v: number | undefined): void
  (e: 'update:tag', v: string | undefined): void
  (e: 'change'): void
}>()

// 月份 1-12
const months = Array.from({ length: 12 }, (_, i) => i + 1)

type FilterValue = number | string | undefined

const onSelect = (field: 'year' | 'month' | 'tag', value: FilterValue) => {
  if (field === 'year') emit('update:year', value as number | undefined)
  if (field === 'month') emit('update:month', value as number | undefined)
  if (field === 'tag') emit('update:tag', value as string | undefined)
  emit('change')
}

const onReset = () => {
  emit('update:year', undefined)
  emit('update:month', undefined)
  emit('update:tag', undefined)
  emit('change')
}
</script>

<template>
  <div class="list-filter">
    <!-- 年度 -->
    <div class="filter-row">
      <span class="filter-label">
        <Icon :icon="icons.calendar" :width="14" :height="14" />
        年度
      </span>
      <div class="filter-options">
        <button
          type="button"
          class="filter-btn"
          :class="{ active: props.year === undefined }"
          @click="onSelect('year', undefined)"
        >
          全部
        </button>
        <button
          v-for="y in props.years"
          :key="y"
          type="button"
          class="filter-btn"
          :class="{ active: props.year === y }"
          @click="onSelect('year', y)"
        >
          {{ y }}
        </button>
      </div>
    </div>

    <!-- 月份 -->
    <div class="filter-row">
      <span class="filter-label">
        <Icon :icon="icons.clock" :width="14" :height="14" />
        月份
      </span>
      <div class="filter-options">
        <button
          type="button"
          class="filter-btn"
          :class="{ active: props.month === undefined }"
          @click="onSelect('month', undefined)"
        >
          全部
        </button>
        <button
          v-for="m in months"
          :key="m"
          type="button"
          class="filter-btn"
          :class="{ active: props.month === m }"
          @click="onSelect('month', m)"
        >
          {{ m }}月
        </button>
      </div>
    </div>

    <!-- 标签 -->
    <div class="filter-row">
      <span class="filter-label">
        <Icon :icon="icons.bookmark" :width="14" :height="14" />
        标签
      </span>
      <div class="filter-options">
        <button
          type="button"
          class="filter-btn"
          :class="{ active: props.tag === undefined }"
          @click="onSelect('tag', undefined)"
        >
          全部
        </button>
        <button
          v-for="t in props.tags"
          :key="t"
          type="button"
          class="filter-btn"
          :class="{ active: props.tag === t }"
          @click="onSelect('tag', t)"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <!-- 重置 -->
    <div class="filter-action">
      <button type="button" class="reset-btn" @click="onReset">
        <Icon :icon="icons.refresh" :width="14" :height="14" />
        重置筛选
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-filter {
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  padding: $space-4 $space-5;
  margin-bottom: $space-4;
  box-shadow: $shadow-xs;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-2 0;
  border-bottom: 1px dashed $border-lighter;

  &:last-of-type {
    border-bottom: none;
  }
}

.filter-label {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  width: 56px;
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: 30px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.filter-btn {
  height: 30px;
  padding: 0 $space-3;
  font-size: $fs-sm;
  color: $text-regular;
  background: $bg-page;
  border: 1px solid transparent;
  border-radius: $radius-pill;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    color: $primary;
    background: $primary-bg;
    border-color: $primary-bg-soft;
  }

  &.active {
    color: #fff;
    background: $grad-gold;
    box-shadow: $shadow-gold;
  }
}

.filter-action {
  display: flex;
  justify-content: flex-end;
  margin-top: $space-3;
  padding-top: $space-3;
  border-top: 1px solid $border-lighter;
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  height: 32px;
  padding: 0 $space-4;
  font-size: $fs-sm;
  color: $text-secondary;
  background: $bg-card;
  border: 1px solid $border-base;
  border-radius: $radius-base;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    color: $primary;
    border-color: $primary;
    background: $primary-bg;
  }
}

// 移动端: 标签宽度自适应
@include respond-to(xs) {
  .filter-label {
    width: auto;
  }
}
</style>
