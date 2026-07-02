<template>
  <div class="app-layout">
    <!-- 顶部加载进度条(路由切换时显示) -->
    <NuxtLoadingIndicator
      color="#b8956a"
      :height="3"
      :throttle="200"
    />

    <!-- 无障碍:跳转到主内容 -->
    <a href="#main-content" class="skip-link">跳到主要内容</a>

    <!-- 顶部 Header -->
    <AppHeader />

    <!-- 主导航 -->
    <AppNav />

    <!-- 主内容区(tabindex=-1 便于 skip-link 聚焦) -->
    <main id="main-content" class="app-main" tabindex="-1">
      <slot />
    </main>

    <!-- 页脚 -->
    <AppFooter />

    <!-- 返回顶部(全局) -->
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
// 默认布局:Header + Nav + Content + Footer + BackToTop
// NuxtLoadingIndicator:路由切换顶部进度条(金色,呼应品牌)
// main tabindex=-1:配合 skip-link,跳转后可聚焦,屏幕阅读器朗读
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

  // skip-link 跳转后的聚焦轮廓(仅键盘聚焦时显示)
  &:focus {
    outline: none;
  }
}
</style>
