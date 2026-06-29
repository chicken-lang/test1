<template>
  <div class="app-layout">
    <!-- 无障碍:跳转到主内容 -->
    <a href="#main-content" class="skip-link">跳到主要内容</a>

    <!-- 顶部 Header -->
    <AppHeader />

    <!-- 主导航 -->
    <AppNav />

    <!-- 主内容区 -->
    <main id="main-content" class="app-main">
      <slot />
    </main>

    <!-- 页脚 -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
// 默认布局:Header + Nav + Content + Footer
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  min-height: 400px;
}
</style>
