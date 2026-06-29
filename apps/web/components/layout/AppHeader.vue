<template>
  <header class="app-header">
    <!-- 顶部装饰条(金色细线) -->
    <div class="header-topline"></div>

    <div class="container header-inner">
      <!-- 左侧:校徽 + 校名 + 部门名 -->
      <NuxtLink to="/" class="header-logo">
        <div class="logo-emblem">
          <svg viewBox="0 0 48 48" class="emblem-svg" aria-hidden="true">
            <!-- 盾形外框 -->
            <path
              d="M24 4 L42 10 L42 26 Q42 38 24 44 Q6 38 6 26 L6 10 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <!-- 内部书本图案 -->
            <path
              d="M14 18 L24 22 L34 18 L34 32 L24 36 L14 32 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
            <line x1="24" y1="22" x2="24" y2="36" stroke="currentColor" stroke-width="1.5" />
            <!-- 顶部星点 -->
            <circle cx="24" cy="12" r="1.8" fill="currentColor" />
          </svg>
        </div>
        <div class="logo-text">
          <h1 class="school-name">深圳信息职业技术大学</h1>
          <div class="school-name-en">Shenzhen Institute of Information Technology</div>
          <p class="dept-name">
            <span class="dept-cn">教 务 处</span>
            <span class="dept-en">Academic Affairs Office</span>
          </p>
        </div>
      </NuxtLink>

      <!-- 右侧:快捷功能 -->
      <div class="header-tools">
        <NuxtLink to="/search" class="tool-item" aria-label="搜索">
          <Icon icon="mdi:magnify" width="18" height="18" />
          <span>搜索</span>
        </NuxtLink>
        <div class="tool-divider"></div>
        <NuxtLink to="/user" class="tool-item" aria-label="登录">
          <Icon icon="mdi:account-outline" width="18" height="18" />
          <span>登录</span>
        </NuxtLink>
        <button class="tool-item" aria-label="收藏" @click="toggleFav">
          <Icon icon="mdi:bookmark-outline" width="18" height="18" />
          <span>收藏</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// AppHeader v2.0: 品牌化校徽 + 中英文校名 + 精致工具栏
// 移除适老化入口,聚焦教师/学生群体

// 收藏功能(前端占位,后续接 API)
const toggleFav = () => {
  ElMessage.info('收藏功能开发中')
}
</script>

<style lang="scss" scoped>
.app-header {
  background: $grad-primary;
  color: #fff;
  position: relative;
  overflow: hidden;
}

// 顶部金色装饰线
.header-topline {
  height: 3px;
  background: $grad-gold;
  position: relative;
  z-index: 2;

  // 装饰光晕
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: shimmer 6s ease-in-out infinite;
  }
}

@keyframes shimmer {
  0%,
  100% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $header-height;
  position: relative;
  z-index: 1;
}

// Logo 区
.header-logo {
  display: flex;
  align-items: center;
  gap: $space-4;
  color: #fff;
  transition: opacity $transition-fast;

  &:hover {
    opacity: 0.95;
    color: #fff;
  }
}

.logo-emblem {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  position: relative;

  .emblem-svg {
    width: 100%;
    height: 100%;
    color: #fff;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
  }

  // 背景光晕
  &::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(184, 149, 106, 0.3) 0%, transparent 70%);
    z-index: -1;
  }
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.school-name {
  font-size: $fs-3xl;
  font-weight: $fw-bold;
  letter-spacing: 2px;
  line-height: $lh-tight;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.school-name-en {
  font-size: $fs-xs;
  letter-spacing: 1px;
  opacity: 0.7;
  font-weight: $fw-regular;
  margin-top: 2px;
}

.dept-name {
  display: flex;
  align-items: baseline;
  gap: $space-3;
  margin-top: $space-2;
  padding-top: $space-2;
  border-top: 1px solid rgba(255, 255, 255, 0.15);

  .dept-cn {
    font-size: $fs-md;
    letter-spacing: 6px;
    font-weight: $fw-medium;
    color: $gold-light;
  }

  .dept-en {
    font-size: $fs-xs;
    letter-spacing: 1px;
    opacity: 0.6;
  }
}

// 工具栏
.header-tools {
  display: flex;
  align-items: center;
  gap: $space-1;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-3;
  color: rgba(255, 255, 255, 0.85);
  font-size: $fs-sm;
  border-radius: $radius-base;
  cursor: pointer;
  background: transparent;
  border: none;
  transition: all $transition-fast;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
}

.tool-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 $space-1;
}

// 背景装饰(右侧光晕)
.app-header::after {
  content: '';
  position: absolute;
  right: -100px;
  top: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(184, 149, 106, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

// 移动端
@include respond-to(xs) {
  .header-inner {
    height: auto;
    padding: $space-4 0;
  }

  .school-name {
    font-size: $fs-lg;
    letter-spacing: 1px;
  }

  .school-name-en {
    display: none;
  }

  .dept-name {
    .dept-cn {
      font-size: $fs-sm;
      letter-spacing: 3px;
    }
    .dept-en {
      display: none;
    }
  }

  .logo-emblem {
    width: 48px;
    height: 48px;
  }

  .tool-item span {
    display: none;
  }

  .tool-divider {
    display: none;
  }
}
</style>
