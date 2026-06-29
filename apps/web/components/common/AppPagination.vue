<script setup lang="ts">
// AppPagination: 通用分页组件(包装 el-pagination)
// 支持首页/上页/页码/下页/尾页/总数,通过 v-model 双向绑定当前页
const props = defineProps<{
  // 当前页
  page: number
  // 总条数
  total: number
  // 每页条数
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'change', page: number): void
}>()

// 页码变化时同步父组件
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
  padding: 24px 0 8px;
}

// 适老化: 增大页码点击区域
:global([data-color-mode='elderly']) {
  .app-pagination {
    :deep(.el-pagination) {
      font-size: 15px;

      .el-pager li {
        width: 36px;
        height: 36px;
        line-height: 36px;
      }

      .btn-prev,
      .btn-next {
        width: 36px;
        height: 36px;
        line-height: 36px;
      }
    }
  }
}
</style>
