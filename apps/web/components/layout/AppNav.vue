<template>
  <nav class="app-nav" aria-label="主导航">
    <div class="container nav-inner">
      <!-- PC 端:横向菜单 -->
      <ul class="nav-list">
        <li v-for="item in navItems" :key="item.path" class="nav-item">
          <NuxtLink :to="item.path" class="nav-link" :class="{ active: isActive(item.path) }">
            <span class="nav-text">{{ item.title }}</span>
          </NuxtLink>
        </li>
      </ul>

      <!-- 移动端:汉堡菜单 -->
      <button class="nav-toggle" aria-label="菜单" @click="mobileOpen = !mobileOpen">
        <Icon :icon="mobileOpen ? 'mdi:close' : 'mdi:menu'" width="24" height="24" />
      </button>
    </div>

    <!-- 移动端抽屉菜单 -->
    <transition name="drawer">
      <ul v-show="mobileOpen" class="nav-drawer">
        <li v-for="item in navItems" :key="item.path">
          <NuxtLink :to="item.path" @click="mobileOpen = false">{{ item.title }}</NuxtLink>
        </li>
      </ul>
    </transition>
  </nav>
</template>

<script setup lang="ts">
// AppNav v2.0: 深色导航 + 金色底部指示器 + 悬浮动效
const route = useRoute()
const mobileOpen = ref(false)

// 16 个一级栏目(内容栏目指向通用列表页 /list/[slug])
const navItems = [
  { title: '首页', path: '/' },
  { title: '部门介绍', path: '/about' },
  { title: '规章制度', path: '/list/regulations' },
  { title: '通知公告', path: '/list/notices' },
  { title: '教务管理', path: '/list/academic' },
  { title: '实践教学', path: '/list/practice' },
  { title: '专业建设', path: '/list/major' },
  { title: '教研教改', path: '/list/research' },
  { title: '技能竞赛', path: '/list/competition' },
  { title: '教学荣誉', path: '/list/honor' },
  { title: '智慧教室', path: '/list/classroom' },
  { title: '项目指南', path: '/list/project' },
  { title: '下载中心', path: '/list/download' },
  { title: '教学反馈', path: '/list/feedback' },
  { title: '办事指南', path: '/list/guide' },
  { title: '校历作息', path: '/calendar' },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style lang="scss" scoped>
.app-nav {
  background: $primary-dark;
  height: $nav-height;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(0, 45, 82, 0.15);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.nav-list {
  display: flex;
  align-items: center;
  height: 100%;
}

.nav-item {
  height: 100%;
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 $space-4;
  color: rgba(255, 255, 255, 0.85);
  font-size: $fs-md;
  font-weight: $fw-medium;
  transition: all $transition-fast;
  position: relative;

  // 底部指示器(悬浮/激活时金色线条)
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%) scaleX(0);
    width: 24px;
    height: 3px;
    background: $grad-gold;
    border-radius: $radius-pill $radius-pill 0 0;
    transition: transform $transition-base;
  }

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);

    &::after {
      transform: translateX(-50%) scaleX(1);
    }
  }

  &.active {
    color: #fff;
    background: rgba(0, 0, 0, 0.15);

    &::after {
      transform: translateX(-50%) scaleX(1);
    }
  }
}

.nav-toggle {
  display: none;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: $space-2;
}

.nav-drawer {
  display: none;
  background: $primary-darker;
  padding: $space-2 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  li a {
    display: block;
    padding: $space-3 $space-6;
    color: rgba(255, 255, 255, 0.85);
    font-size: $fs-base;
    transition: all $transition-fast;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      padding-left: $space-8;
    }
  }
}

// 移动端
@include respond-to(xs) {
  .nav-list {
    display: none;
  }

  .nav-toggle {
    display: block;
  }

  .nav-drawer {
    display: block;
  }
}

// 抽屉动画
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.25s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
