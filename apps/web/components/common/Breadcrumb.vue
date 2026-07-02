<script setup lang="ts">
// Breadcrumb v3.0: 面包屑导航(首页 > 栏目 > 子栏目)
// 应用 v3.0 设计令牌:当前页金色 + icons 字典
import { icons } from '~/utils/icons'

interface BreadcrumbItem {
  title: string
  to?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav class="breadcrumb" aria-label="面包屑导航">
    <ol class="breadcrumb-list">
      <li v-for="(item, idx) in items" :key="idx" class="breadcrumb-item">
        <NuxtLink v-if="item.to && idx < items.length - 1" :to="item.to" class="breadcrumb-link">
          <Icon v-if="idx === 0" :icon="icons.home" :width="14" :height="14" />
          <span>{{ item.title }}</span>
        </NuxtLink>
        <span v-else class="breadcrumb-current" aria-current="page">{{ item.title }}</span>
        <Icon
          v-if="idx < items.length - 1"
          :icon="icons.chevronRight"
          :width="12"
          :height="12"
          class="breadcrumb-sep"
        />
      </li>
    </ol>
  </nav>
</template>

<style lang="scss" scoped>
.breadcrumb {
  padding: $space-3 0;
  font-size: $fs-sm;
  color: $text-secondary;
}

.breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-1;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: $text-secondary;
  transition: color $transition-fast;

  &:hover {
    color: $primary;
  }
}

// 当前页:金色加粗(品牌化)
.breadcrumb-current {
  color: $gold-dark;
  font-weight: $fw-semibold;
}

.breadcrumb-sep {
  color: $text-placeholder;
}
</style>
