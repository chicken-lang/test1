<template>
  <nav class="app-nav" aria-label="主导航">
    <div class="container nav-inner">
      <!-- PC 端:横向菜单 -->
      <ul class="nav-list">
        <li v-for="item in navItems" :key="item.path" class="nav-item">
          <NuxtLink :to="item.path" class="nav-link" :class="{ active: isActive(item.path) }">
            {{ item.title }}
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
// AppNav: 主导航 16 项(对应 T3.2 主导航 16 项 + 移动端抽屉)
// 栏目结构参考实施计划阶段 5 业务内容模块

const route = useRoute()
const mobileOpen = ref(false)

// 16 个一级栏目
const navItems = [
  { title: '首页', path: '/' },
  { title: '部门介绍', path: '/about' },
  { title: '规章制度', path: '/regulations' },
  { title: '通知公告', path: '/notices' },
  { title: '教务管理', path: '/academic' },
  { title: '实践教学', path: '/practice' },
  { title: '专业建设', path: '/major' },
  { title: '教研教改', path: '/research' },
  { title: '技能竞赛', path: '/competition' },
  { title: '教学荣誉', path: '/honor' },
  { title: '智慧教室', path: '/classroom' },
  { title: '项目指南', path: '/project' },
  { title: '下载中心', path: '/download' },
  { title: '教学反馈', path: '/feedback' },
  { title: '办事指南', path: '/guide' },
  { title: '校历作息', path: '/calendar' },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style lang="scss" scoped>
.app-nav {
  background: $primary;
  height: $nav-height;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
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
  gap: 0;
  height: 100%;
}

.nav-item {
  height: 100%;
}

.nav-link {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 18px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;

  &:hover,
  &.active {
    background: $primary-dark;
    color: #fff;
    border-bottom-color: #fff;
  }
}

.nav-toggle {
  display: none;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 8px;
}

.nav-drawer {
  display: none;
  background: $primary-dark;
  padding: 8px 0;

  li a {
    display: block;
    padding: 12px 24px;
    color: #fff;
    font-size: 15px;

    &:hover {
      background: $primary;
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
