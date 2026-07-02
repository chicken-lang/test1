<template>
  <nav class="app-nav" aria-label="主导航">
    <div class="container nav-inner">
      <!-- PC 端:横向菜单(重组为 8 项 + 二级下拉) -->
      <ul class="nav-list">
        <li
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          @mouseenter="openIndex = item.children ? item.path : null"
          @mouseleave="openIndex = null"
        >
          <NuxtLink
            :to="item.path"
            class="nav-link"
            :class="{ active: isActive(item.path) }"
            :aria-haspopup="item.children ? 'true' : undefined"
            :aria-expanded="openIndex === item.path ? 'true' : 'false'"
          >
            <Icon v-if="item.icon" :icon="item.icon" :width="16" :height="16" class="nav-icon" />
            <span class="nav-text">{{ item.title }}</span>
            <Icon
              v-if="item.children"
              :icon="icons.chevronDown"
              :width="12"
              :height="12"
              class="nav-caret"
            />
          </NuxtLink>

          <!-- 二级下拉 -->
          <Transition name="dropdown">
            <ul v-if="item.children && openIndex === item.path" class="nav-dropdown">
              <li v-for="child in item.children" :key="child.path">
                <NuxtLink
                  :to="child.path"
                  class="dropdown-link"
                  :class="{ active: isActive(child.path) }"
                >
                  <Icon
                    v-if="child.icon"
                    :icon="child.icon"
                    :width="14"
                    :height="14"
                    class="dropdown-icon"
                  />
                  <span>{{ child.title }}</span>
                </NuxtLink>
              </li>
            </ul>
          </Transition>
        </li>
      </ul>

      <!-- 移动端:汉堡菜单 -->
      <button
        class="nav-toggle"
        type="button"
        :aria-label="mobileOpen ? '关闭菜单' : '打开菜单'"
        :aria-expanded="mobileOpen"
        @click="mobileOpen = !mobileOpen"
      >
        <Icon
          :icon="mobileOpen ? icons.close : icons.menu"
          :width="24"
          :height="24"
        />
      </button>
    </div>

    <!-- 移动端抽屉菜单(支持二级展开) -->
    <Transition name="drawer">
      <ul v-show="mobileOpen" class="nav-drawer">
        <li v-for="item in navItems" :key="item.path" class="drawer-item">
          <div class="drawer-row">
            <NuxtLink
              :to="item.path"
              class="drawer-link"
              :class="{ active: isActive(item.path) }"
              @click="mobileOpen = false"
            >
              <Icon v-if="item.icon" :icon="item.icon" :width="18" :height="18" />
              <span>{{ item.title }}</span>
            </NuxtLink>
            <button
              v-if="item.children"
              type="button"
              class="drawer-toggle"
              :aria-label="`展开${item.title}子菜单`"
              :aria-expanded="mobileExpand === item.path"
              @click="mobileExpand = mobileExpand === item.path ? null : item.path"
            >
              <Icon
                :icon="icons.chevronDown"
                :width="18"
                :height="18"
                :class="{ rotated: mobileExpand === item.path }"
              />
            </button>
          </div>

          <!-- 移动端二级菜单 -->
          <Transition name="collapse">
            <ul v-if="item.children && mobileExpand === item.path" class="drawer-sub">
              <li v-for="child in item.children" :key="child.path">
                <NuxtLink
                  :to="child.path"
                  class="drawer-sub-link"
                  :class="{ active: isActive(child.path) }"
                  @click="mobileOpen = false"
                >
                  <Icon
                    v-if="child.icon"
                    :icon="child.icon"
                    :width="14"
                    :height="14"
                  />
                  <span>{{ child.title }}</span>
                </NuxtLink>
              </li>
            </ul>
          </Transition>
        </li>
      </ul>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
// AppNav v3.0: 重组 8 项主菜单 + 二级下拉 + 中屏适配 + icons 字典 + z-index 令牌
import { icons } from '~/utils/icons'

const route = useRoute()
const mobileOpen = ref(false)
// PC 端 hover 下拉索引
const openIndex = ref<string | null>(null)
// 移动端二级菜单展开索引
const mobileExpand = ref<string | null>(null)

// 重组为 8 项主菜单(原 16 项聚合,带二级下拉)
interface NavChild {
  title: string
  path: string
  icon?: string
}
interface NavItem {
  title: string
  path: string
  icon?: string
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { title: '首页', path: '/', icon: icons.home },
  { title: '部门介绍', path: '/about', icon: icons.about },
  {
    title: '通知公告',
    path: '/list/notices',
    icon: icons.notice,
    children: [
      { title: '学生通知', path: '/list/student-notices', icon: icons.student },
      { title: '教师通知', path: '/list/teacher-notices', icon: icons.teacher },
    ],
  },
  {
    title: '教务管理',
    path: '/list/academic',
    icon: icons.course,
    children: [
      { title: '规章制度', path: '/list/regulations', icon: icons.document },
      { title: '教务管理', path: '/list/academic', icon: icons.course },
      { title: '办事指南', path: '/list/guide', icon: icons.guide },
    ],
  },
  {
    title: '教学实践',
    path: '/list/practice',
    icon: icons.book,
    children: [
      { title: '实践教学', path: '/list/practice', icon: icons.book },
      { title: '专业建设', path: '/list/major', icon: icons.cap },
      { title: '教研教改', path: '/list/research', icon: icons.lightbulb },
    ],
  },
  {
    title: '学科竞赛',
    path: '/list/competition',
    icon: icons.trophy,
    children: [
      { title: '技能竞赛', path: '/list/competition', icon: icons.trophy },
      { title: '教学荣誉', path: '/list/honor', icon: icons.star },
      { title: '项目指南', path: '/list/project', icon: icons.target },
    ],
  },
  {
    title: '资源服务',
    path: '/list/download',
    icon: icons.download,
    children: [
      { title: '下载中心', path: '/list/download', icon: icons.download },
      { title: '智慧教室', path: '/list/classroom', icon: icons.classroom },
      { title: '教学反馈', path: '/list/feedback', icon: icons.faq },
    ],
  },
  { title: '校历作息', path: '/calendar', icon: icons.calendar },
]

// 当前路由激活判断(支持子栏目高亮父级)
const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/') || route.path.startsWith(path)
}

// 路由变化时关闭移动端菜单
watch(
  () => route.path,
  () => {
    mobileOpen.value = false
    mobileExpand.value = null
  },
)
</script>

<style lang="scss" scoped>
.app-nav {
  background: $primary-dark;
  height: $nav-height;
  position: sticky;
  top: 0;
  z-index: $z-nav;
  box-shadow: $shadow-md;
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

// ========== PC 端横向菜单 ==========
.nav-list {
  display: flex;
  align-items: center;
  height: 100%;
  gap: $space-1;
}

.nav-item {
  height: 100%;
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: $space-1;
  height: 100%;
  padding: 0 $space-4;
  color: rgba(255, 255, 255, 0.85);
  font-size: $fs-md;
  font-weight: $fw-medium;
  transition: all $transition-fast;
  position: relative;

  .nav-icon {
    opacity: 0.7;
    transition: all $transition-fast;
  }

  .nav-caret {
    opacity: 0.6;
    transition: transform $transition-fast;
  }

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

    .nav-icon {
      opacity: 1;
      color: $gold-light;
    }

    .nav-caret {
      opacity: 1;
      transform: rotate(180deg);
    }

    &::after {
      transform: translateX(-50%) scaleX(1);
    }
  }

  &.active {
    color: #fff;
    background: rgba(0, 0, 0, 0.15);

    .nav-icon {
      opacity: 1;
      color: $gold-light;
    }

    &::after {
      transform: translateX(-50%) scaleX(1);
    }
  }
}

// 二级下拉
.nav-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  min-width: 180px;
  background: $bg-card;
  border-radius: 0 0 $radius-md $radius-md;
  box-shadow: $shadow-lg;
  padding: $space-2 0;
  list-style: none;
  margin: 0;
  z-index: $z-dropdown;

  // 顶部金色装饰条
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: $grad-gold;
  }

  li {
    .dropdown-link {
      display: flex;
      align-items: center;
      gap: $space-2;
      padding: $space-2 $space-4;
      color: $text-regular;
      font-size: $fs-base;
      transition: all $transition-fast;

      .dropdown-icon {
        color: $text-placeholder;
        transition: all $transition-fast;
      }

      &:hover {
        background: $gold-bg;
        color: $gold-dark;
        padding-left: $space-5;

        .dropdown-icon {
          color: $gold;
        }
      }

      &.active {
        color: $gold-dark;
        font-weight: $fw-semibold;
        background: $gold-bg;

        .dropdown-icon {
          color: $gold;
        }
      }
    }
  }
}

// 下拉动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s $ease-out-expo;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

// ========== 移动端汉堡按钮 ==========
.nav-toggle {
  display: none;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: $space-2;
  border-radius: $radius-base;
  transition: background $transition-fast;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

// ========== 移动端抽屉 ==========
.nav-drawer {
  display: none;
  background: $primary-darker;
  padding: $space-2 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  max-height: calc(100vh - #{$nav-height});
  overflow-y: auto;

  .drawer-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:last-child {
      border-bottom: none;
    }
  }

  .drawer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .drawer-link {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-3 $space-5;
    color: rgba(255, 255, 255, 0.85);
    font-size: $fs-md;
    transition: all $transition-fast;

    :deep(svg) {
      color: $gold-light;
      flex-shrink: 0;
    }

    &:hover,
    &.active {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      padding-left: $space-6;
    }
  }

  .drawer-toggle {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    padding: $space-3 $space-4;
    transition: all $transition-fast;

    &:hover {
      color: $gold-light;
    }

    .rotated {
      transform: rotate(180deg);
    }
  }

  .drawer-sub {
    background: rgba(0, 0, 0, 0.2);
    padding: $space-1 0;
    list-style: none;
    margin: 0;

    .drawer-sub-link {
      display: flex;
      align-items: center;
      gap: $space-2;
      padding: $space-2 $space-5 $space-2 $space-10;
      color: rgba(255, 255, 255, 0.7);
      font-size: $fs-sm;
      transition: all $transition-fast;

      :deep(svg) {
        color: $gold;
        opacity: 0.7;
      }

      &:hover,
      &.active {
        background: rgba(184, 149, 106, 0.1);
        color: $gold-light;

        :deep(svg) {
          opacity: 1;
        }
      }
    }
  }
}

// 抽屉展开/收起动画
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.25s $ease-out-expo;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 子菜单折叠动画
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s $ease-out-expo;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  max-height: 300px;
}

// ========== 响应式:中屏(md)及以下切换为移动端抽屉 ==========
// 设计方案要求中屏适配,768px 以下完全切换为抽屉模式
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

// 平板及以上的紧凑优化:中屏下减小间距防止换行
@include respond-to(md) {
  .nav-link {
    padding: 0 $space-3;
    font-size: $fs-base;

    .nav-text {
      letter-spacing: 0;
    }
  }

  .nav-icon {
    display: none;
  }
}
</style>
