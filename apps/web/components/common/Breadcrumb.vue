<script setup lang="ts">
// Breadcrumb: 面包屑导航(首页 > 栏目 > 子栏目)
// 接收 items 数组,最后一项为当前页(不可点击)
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
          <Icon v-if="idx === 0" icon="mdi:home" />
          {{ item.title }}
        </NuxtLink>
        <span v-else class="breadcrumb-current" aria-current="page">{{ item.title }}</span>
        <Icon v-if="idx < items.length - 1" icon="mdi:chevron-right" class="breadcrumb-sep" />
      </li>
    </ol>
  </nav>
</template>

<style lang="scss" scoped>
.breadcrumb {
  padding: 12px 0;
  font-size: 13px;
  color: $text-secondary;
}

.breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: $text-secondary;

  &:hover {
    color: $primary;
  }
}

.breadcrumb-current {
  color: $text-primary;
  font-weight: 500;
}

.breadcrumb-sep {
  font-size: 14px;
  color: $text-placeholder;
}

// 适老化
:global([data-color-mode='elderly']) {
  .breadcrumb {
    font-size: 15px;
  }
}
</style>
