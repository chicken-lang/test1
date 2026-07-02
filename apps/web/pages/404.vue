<script setup lang="ts">
// 404 错误页(独立路由页)v3.0 视觉对齐
// 居中大号 404 + 搜索框 + 返回首页 + 站点地图快捷链接
// v3.0: icons 字典 + v-reveal 入场 + focus-visible + ARIA 无障碍
import { sitemapData } from '~/mock/data'
import { icons } from '~/utils/icons'

// 搜索
const searchKeyword = ref('')
const router = useRouter()
const onSearch = () => {
  if (!searchKeyword.value.trim()) return
  router.push({ path: '/search', query: { q: searchKeyword.value.trim() } })
}

// 扁平化站点地图作为快捷链接
const quickLinks = computed(() =>
  sitemapData
    .flatMap((cat) => cat.links)
    .filter((link) => link.url !== '/')
    .slice(0, 12),
)

useSeoMeta({
  title: '页面未找到 - 404 - 深圳信息职业技术大学教务处',
  description: '您访问的页面未找到,请通过搜索或站点地图查找所需内容',
})
</script>

<template>
  <div class="error-404">
    <div class="container">
      <div v-reveal class="error-content reveal">
        <!-- 大号 404 -->
        <div class="error-code" aria-hidden="true">404</div>
        <div class="error-gold-line" aria-hidden="true"></div>

        <h1 class="error-title">页面未找到</h1>
        <p class="error-desc">
          抱歉,您访问的页面不存在或已被移除。<br />
          请检查网址是否正确,或通过以下方式继续浏览。
        </p>

        <!-- 搜索框 -->
        <form class="search-box" role="search" @submit.prevent="onSearch">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索您需要的内容"
            size="large"
            clearable
            aria-label="搜索关键词"
            @keyup.enter="onSearch"
          >
            <template #prefix>
              <Icon :icon="icons.search" :width="18" :height="18" />
            </template>
          </el-input>
          <el-button type="primary" size="large" aria-label="执行搜索" @click="onSearch">
            搜索
          </el-button>
        </form>

        <!-- 操作按钮 -->
        <div class="action-row">
          <NuxtLink to="/" class="btn-home" aria-label="返回首页">
            <Icon :icon="icons.homeFill" :width="16" :height="16" />
            返回首页
          </NuxtLink>
          <NuxtLink to="/sitemap" class="btn-sitemap" aria-label="查看站点地图">
            <Icon :icon="icons.sitemap" :width="16" :height="16" />
            查看站点地图
          </NuxtLink>
        </div>

        <!-- 站点地图快捷链接 -->
        <div class="quick-links">
          <h2 class="quick-title">快捷导航</h2>
          <nav class="quick-grid" aria-label="快捷导航链接">
            <NuxtLink
              v-for="link in quickLinks"
              :key="link.url"
              :to="link.url"
              class="quick-link"
            >
              <Icon :icon="icons.chevronRight" :width="14" :height="14" />
              {{ link.title }}
            </NuxtLink>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-404 {
  min-height: 60vh;
  display: flex;
  align-items: center;
  padding: $space-12 0;
}

.error-content {
  text-align: center;
  max-width: 720px;
  margin: 0 auto;
}

// 大号 404
.error-code {
  font-family: $font-serif;
  font-size: $fs-6xl;
  font-weight: $fw-bold;
  line-height: 1;
  background: $grad-gold;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: $gold;
  letter-spacing: 4px;
  margin-bottom: $space-3;
}

.error-gold-line {
  width: 60px;
  height: 3px;
  background: $grad-gold;
  border-radius: $radius-pill;
  margin: 0 auto $space-5;
}

.error-title {
  font-size: $fs-3xl;
  font-weight: $fw-bold;
  color: $text-primary;
  margin-bottom: $space-3;
}

.error-desc {
  font-size: $fs-md;
  color: $text-secondary;
  line-height: $lh-relaxed;
  margin-bottom: $space-8;
}

// 搜索框
.search-box {
  display: flex;
  gap: $space-2;
  max-width: 480px;
  margin: 0 auto $space-6;

  .el-input {
    flex: 1;
  }

  :deep(.el-input__wrapper) {
    border-radius: $radius-base;
  }
}

// 操作按钮
.action-row {
  display: flex;
  justify-content: center;
  gap: $space-3;
  margin-bottom: $space-10;
}

.btn-home,
.btn-sitemap {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-6;
  font-size: $fs-base;
  font-weight: $fw-medium;
  border-radius: $radius-base;
  transition: all $transition-base;

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

.btn-home {
  background: $grad-primary;
  color: #fff;
  box-shadow: $shadow-primary;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
    color: #fff;
  }
}

.btn-sitemap {
  background: $bg-card;
  color: $primary;
  border: 1px solid $border-base;

  &:hover {
    background: $primary-bg;
    border-color: $primary-lighter;
    color: $primary;
  }
}

// 快捷链接
.quick-links {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-sm;
}

.quick-title {
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin-bottom: $space-4;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-2;
}

.quick-link {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2;
  font-size: $fs-sm;
  color: $text-regular;
  border-radius: $radius-sm;
  transition: all $transition-fast;

  :deep(svg) {
    color: $text-placeholder;
    flex-shrink: 0;
  }

  &:hover {
    color: $primary;
    background: $primary-bg;

    :deep(svg) {
      color: $primary;
    }
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

@include respond-to(md) {
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include respond-to(xs) {
  .error-code {
    font-size: $fs-5xl;
  }

  .error-title {
    font-size: $fs-xl;
  }

  .search-box {
    flex-direction: column;
  }

  .action-row {
    flex-direction: column;
    align-items: stretch;
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
