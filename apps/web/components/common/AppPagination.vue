<script setup lang="ts">
// AppPagination v3.0: 通用分页组件(包装 el-pagination)
// 金色 active 态由 main.scss 全局 EP 微调处理,此处仅布局
const props = defineProps<{
  page: number
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'change', page: number): void
}>()

const onPageChange = (p: number) => {
  emit('update:page', p)
  emit('change', p)
}
</script>

<template>
  <div class="app-pagination">
    <el-pagination
      :current-page="props.page"
      :page-size="props.pageSize"
      :total="props.total"
      :page-sizes="[10, 20, 50]"
      layout="total, prev, pager, next, jumper"
      background
      @current-change="onPageChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.app-pagination {
  display: flex;
  justify-content: center;
  padding: $space-6 0 $space-2;
}
</style>
