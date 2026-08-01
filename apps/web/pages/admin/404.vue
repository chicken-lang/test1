<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1 class="not-found-code">404</h1>
      <h2 class="not-found-title">页面不存在</h2>
      <p class="not-found-desc">您访问的页面不存在，请检查地址是否正确</p>
      <el-button type="primary" @click="goBack">返回工作台</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })

const router = useRouter()

const goBack = () => {
  router.push('/admin/dashboard')
}
</script>

<style lang="scss" scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background-color: #f5f7fa;

  &-content {
    text-align: center;
  }

  &-code {
    font-size: 120px;
    font-weight: 700;
    color: #409eff;
    margin: 0;
    line-height: 1;
  }

  &-title {
    font-size: 24px;
    font-weight: 500;
    color: #303133;
    margin: 20px 0 12px;
  }

  &-desc {
    font-size: 14px;
    color: #909399;
    margin: 0 0 32px;
  }
}
</style>
