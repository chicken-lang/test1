<script setup lang="ts">
// Nuxt 全局错误页 v3.0(根目录 error.vue)
// 处理 404/500 等所有未捕获错误,根据 statusCode 显示不同内容
// 应用 v3.0 设计令牌:深色渐变背景 + 玻璃态卡片 + 金色错误码 + icons 字典
import type { NuxtError } from '#app'
import { icons } from '~/utils/icons'

const props = defineProps<{
  error: NuxtError
}>()

// 根据状态码定制文案与图标(全部从 icons 字典取)
const errorInfo = computed(() => {
  const code = props.error?.statusCode || 500
  if (code === 404) {
    return {
      code,
      title: '页面未找到',
      desc: '您访问的页面不存在或已被移除,请检查网址或返回首页。',
      icon: icons.compassOff,
    }
  }
  if (code === 403) {
    return {
      code,
      title: '无访问权限',
      desc: '抱歉,您暂无权限访问此页面,请联系管理员或返回首页。',
      icon: icons.lock,
    }
  }
  if (code >= 500) {
    return {
      code,
      title: '服务器开小差了',
      desc: '服务器遇到一些问题,我们正在紧急修复,请稍后再试。',
      icon: icons.serverOff,
    }
  }
  return {
    code,
    title: '出错了',
    desc: props.error?.message || '页面发生未知错误,请稍后重试。',
    icon: icons.danger,
  }
})

// 返回首页并清除错误
const handleError = () => clearError({ redirect: '/' })

useSeoMeta({
  title: () => `${errorInfo.value.title} - ${errorInfo.value.code} - 深圳信息职业技术大学教务处`,
  description: '页面发生错误,请返回首页或联系教务处',
})
</script>

<template>
  <div class="error-page">
    <div class="error-bg"></div>

    <main class="error-main">
      <div class="error-card">
        <div class="error-icon">
          <Icon :icon="errorInfo.icon" width="56" height="56" />
        </div>

        <!-- 大号错误码 -->
        <div class="error-code">{{ errorInfo.code }}</div>
        <div class="error-line"></div>

        <h1 class="error-title">{{ errorInfo.title }}</h1>
        <p class="error-desc">{{ errorInfo.desc }}</p>

        <!-- 操作按钮 -->
        <div class="action-row">
          <button class="btn-primary" @click="handleError">
            <Icon :icon="icons.homeFill" :width="16" :height="16" />
            返回首页
          </button>
          <NuxtLink to="/sitemap" class="btn-ghost">
            <Icon :icon="icons.sitemap" :width="16" :height="16" />
            站点地图
          </NuxtLink>
        </div>

        <!-- 联系方式 -->
        <div class="contact">
          <span class="contact-label">如需帮助,请联系教务处:</span>
          <div class="contact-items">
            <a href="tel:0755-89226666" class="contact-item">
              <Icon :icon="icons.phone" :width="14" :height="14" />
              0755-89226666
            </a>
            <a href="mailto:jwc@sziit.edu.cn" class="contact-item">
              <Icon :icon="icons.email" :width="14" :height="14" />
              jwc@sziit.edu.cn
            </a>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: $bg-page;
}

// 渐变背景层
.error-bg {
  position: absolute;
  inset: 0;
  background: $grad-dark;
  z-index: 0;

  &::before {
    content: '';
    position: absolute;
    top: -20%;
    right: -10%;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 91, 172, 0.4) 0%, transparent 70%);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -20%;
    left: -10%;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(184, 149, 106, 0.2) 0%, transparent 70%);
  }
}

.error-main {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 560px;
  padding: $space-6;
  box-sizing: border-box;
}

.error-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $radius-xl;
  padding: $space-12 $space-8;
  text-align: center;
  box-shadow: $shadow-xl;
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(184, 149, 106, 0.15);
  color: $gold-light;
  margin-bottom: $space-6;
}

// 大号错误码
.error-code {
  font-family: $font-serif;
  font-size: 96px;
  font-weight: $fw-bold;
  line-height: 1;
  background: $grad-gold;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: $gold;
  letter-spacing: 4px;
  margin-bottom: $space-2;
}

.error-line {
  width: 64px;
  height: 3px;
  background: $grad-gold;
  border-radius: $radius-pill;
  margin: 0 auto $space-5;
}

.error-title {
  font-size: $fs-3xl;
  font-weight: $fw-bold;
  color: #fff;
  margin-bottom: $space-3;
}

.error-desc {
  font-size: $fs-md;
  color: rgba(255, 255, 255, 0.7);
  line-height: $lh-relaxed;
  margin-bottom: $space-8;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

// 操作按钮
.action-row {
  display: flex;
  justify-content: center;
  gap: $space-3;
  margin-bottom: $space-8;
}

.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-6;
  font-size: $fs-base;
  font-weight: $fw-medium;
  border-radius: $radius-base;
  transition: all $transition-base;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: $grad-gold;
  color: #fff;
  box-shadow: $shadow-gold;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid $gold-light;
    outline-offset: 2px;
  }
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
}

// 联系方式
.contact {
  padding-top: $space-6;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.contact-label {
  display: block;
  font-size: $fs-xs;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: $space-3;
}

.contact-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $space-5;
}

.contact-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-sm;
  color: rgba(255, 255, 255, 0.85);
  transition: color $transition-fast;

  :deep(svg) {
    color: $gold-light;
  }

  &:hover {
    color: $gold-light;
  }
}

// 响应式
@include respond-to(xs) {
  .error-card {
    padding: $space-8 $space-5;
  }

  .error-code {
    font-size: 72px;
  }

  .error-title {
    font-size: $fs-xl;
  }

  .action-row {
    flex-direction: column;
    align-items: stretch;
    max-width: 260px;
    margin-left: auto;
    margin-right: auto;
  }

  .contact-items {
    flex-direction: column;
    gap: $space-2;
  }
}
</style>
