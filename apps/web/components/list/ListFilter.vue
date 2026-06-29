<script setup lang="ts">
// ListFilter: 列表筛选区(年度/月份/标签)
// 通过 v-model:year / v-model:month / v-model:tag 双向绑定筛选条件
// 所有筛选变化触发 change 事件,父组件重置页码并重新查询
const props = defineProps<{
  year: number | undefined
  month: number | undefined
  tag: string | undefined
  // 可选年度列表
  years: number[]
  // 可选标签列表
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
    <div class="filter-row">
      <span class="filter-label">年度</span>
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

    <div class="filter-row">
      <span class="filter-label">月份</span>
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

    <div class="filter-row">
      <span class="filter-label">标签</span>
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

    <div class="filter-action">
      <el-button type="primary" plain size="small" @click="onReset">
        <Icon icon="mdi:refresh" />
        重置筛选
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-filter {
  background: #fff;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed $border-lighter;

  &:last-of-type {
    border-bottom: none;
  }
}

.filter-label {
  flex-shrink: 0;
  width: 40px;
  font-size: 13px;
  color: $text-secondary;
  line-height: 28px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-btn {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
  color: $text-regular;
  background: $bg-page;
  border: 1px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: $primary;
    background: $primary-bg;
  }

  &.active {
    color: #fff;
    background: $primary;
  }
}

.filter-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

// 移动端: 标签宽度自适应
@include respond-to(xs) {
  .filter-label {
    width: auto;
  }
}

// 适老化
:global([data-color-mode='elderly']) {
  .filter-btn {
    height: 32px;
    font-size: 14px;
  }
}
</style>
