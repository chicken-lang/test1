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
            v-if="!item.linkUrl"
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
          <a
            v-else
            :href="item.linkUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="nav-link"
          >
            <Icon v-if="item.icon" :icon="item.icon" :width="16" :height="16" class="nav-icon" />
            <span class="nav-text">{{ item.title }}</span>
            <Icon :icon="icons.externalLink" :width="12" :height="12" class="nav-caret" />
          </a>

          <!-- 二级下拉 -->
          <Transition name="dropdown">
            <ul v-if="item.children && openIndex === item.path" class="nav-dropdown">
              <li v-for="child in item.children" :key="child.path">
                <NuxtLink
                  v-if="!child.linkUrl"
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
                <a
                  v-else
                  :href="child.linkUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="dropdown-link"
                >
                  <Icon
                    v-if="child.icon"
                    :icon="child.icon"
                    :width="14"
                    :height="14"
                    class="dropdown-icon"
                  />
                  <span>{{ child.title }}</span>
                  <Icon :icon="icons.externalLink" :width="10" :height="10" style="margin-left: 4px; opacity: 0.6;" />
                </a>
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
              v-if="!item.linkUrl"
              :to="item.path"
              class="drawer-link"
              :class="{ active: isActive(item.path) }"
              @click="mobileOpen = false"
            >
              <Icon v-if="item.icon" :icon="item.icon" :width="18" :height="18" />
              <span>{{ item.title }}</span>
            </NuxtLink>
            <a
              v-else
              :href="item.linkUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="drawer-link"
              @click="mobileOpen = false"
            >
              <Icon v-if="item.icon" :icon="item.icon" :width="18" :height="18" />
              <span>{{ item.title }}</span>
            </a>
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
                  v-if="!child.linkUrl"
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
                <a
                  v-else
                  :href="child.linkUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="drawer-sub-link"
                  @click="mobileOpen = false"
                >
                  <Icon
                    v-if="child.icon"
                    :icon="child.icon"
                    :width="14"
                    :height="14"
                  />
                  <span>{{ child.title }}</span>
                </a>
              </li>
            </ul>
          </Transition>
        </li>
      </ul>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
// AppNav v5.0: 对齐《教务处网站改版项目需求说明书（修订版）》8 个一级栏目
// 主导航 6 项 + 右侧工具位 2 项(规章制度、下载中心) + 二级下拉 + icons 字典 + z-index 令牌
// V2.0: 栏目停用后前台导航自动隐藏（通过 /api/columns/tree 接口获取停用状态）
import { icons } from '~/utils/icons'
import { fetchColumnTree } from '~/composables/adminApi'

const route = useRoute()
const mobileOpen = ref(false)
// PC 端 hover 下拉索引
const openIndex = ref<string | null>(null)
// 移动端二级菜单展开索引
const mobileExpand = ref<string | null>(null)
// 停用栏目 slug 集合（从 /api/columns/tree 加载）
const disabledSlugs = ref<Set<string>>(new Set())

interface NavChild {
  title: string
  path: string
  icon?: string
  columnSlug?: string
  linkUrl?: string
}
interface NavItem {
  title: string
  path: string
  icon?: string
  columnSlug?: string
  linkUrl?: string
  children?: NavChild[]
}

// 主导航 7 项(6 个一级栏目 + 信息公开)
const mainNav = ref<NavItem[]>([
  {
    title: '部门概况',
    path: '/list/about',
    icon: icons.about,
    columnSlug: 'about',
    children: [
      { title: '部门简介', path: '/list/about-brief', icon: icons.info, columnSlug: 'about-brief' },
      { title: '机构设置', path: '/list/about-structure', icon: icons.internal, columnSlug: 'about-structure' },
    ],
  },
  {
    title: '通知公告',
    path: '/list/notices',
    icon: icons.notice,
    columnSlug: 'notices',
    children: [
      { title: '教师公告', path: '/list/notice-teacher', icon: icons.teacher, columnSlug: 'notice-teacher' },
      { title: '学生公告', path: '/list/notice-student', icon: icons.student, columnSlug: 'notice-student' },
      { title: '处务通知', path: '/list/notice-office', icon: icons.archive, columnSlug: 'notice-office' },
    ],
  },
  {
    title: '教务动态',
    path: '/list/news',
    icon: icons.news,
    columnSlug: 'news',
    children: [
      { title: '工作动态', path: '/list/news-work', icon: icons.news, columnSlug: 'news-work' },
      { title: '会议活动', path: '/list/news-meeting', icon: icons.users, columnSlug: 'news-meeting' },
    ],
  },
  {
    title: '一流育人体系',
    path: '/list/first-class-education',
    icon: icons.cap,
    columnSlug: 'first-class-education',
    children: [
      { title: '一流专业', path: '/list/first-class-major', icon: icons.cap, columnSlug: 'first-class-major' },
      { title: '一流课程', path: '/list/first-class-course', icon: icons.book, columnSlug: 'first-class-course' },
      { title: '一流教师', path: '/list/first-class-teacher', icon: icons.teacher, columnSlug: 'first-class-teacher' },
      { title: '一流教材', path: '/list/first-class-textbook', icon: icons.document, columnSlug: 'first-class-textbook' },
      { title: '实训基地建设', path: '/list/first-class-base', icon: icons.location, columnSlug: 'first-class-base' },
    ],
  },
  {
    title: '人才培养平台',
    path: '/list/talent-platform',
    icon: icons.star,
    columnSlug: 'talent-platform',
    children: [
      { title: '本科教务系统', path: '/list/platform-undergraduate', icon: icons.book, columnSlug: 'platform-undergraduate', linkUrl: 'https://jwxt.sziit.edu.cn/undergraduate' },
      { title: '专科教务系统', path: '/list/platform-college', icon: icons.book, columnSlug: 'platform-college', linkUrl: 'https://jwxt.sziit.edu.cn/college' },
      { title: '大赛与荣誉系统', path: '/list/platform-competition', icon: icons.star, columnSlug: 'platform-competition', linkUrl: 'https://competition.sziit.edu.cn' },
      { title: '二级学院育人综合管理平台', path: '/list/platform-college-mgmt', icon: icons.internal, columnSlug: 'platform-college-mgmt', linkUrl: 'https://college-mgmt.sziit.edu.cn' },
      { title: '通用项目评审', path: '/list/platform-review', icon: icons.document, columnSlug: 'platform-review', linkUrl: 'https://review.sziit.edu.cn' },
      { title: '教学质量评价系统', path: '/list/platform-quality-eval', icon: icons.book, columnSlug: 'platform-quality-eval', linkUrl: 'https://quality.sziit.edu.cn' },
      { title: '实践教学平台', path: '/list/platform-practice', icon: icons.location, columnSlug: 'platform-practice', linkUrl: 'https://practice.sziit.edu.cn' },
    ],
  },
  {
    title: '办事指南',
    path: '/guide',
    icon: icons.guide,
    columnSlug: 'guide',
    children: [
      { title: '国家及省市文件', path: '/list/regulation-national', icon: icons.document, columnSlug: 'regulation-national' },
      { title: '学校规章制度', path: '/list/regulation-school', icon: icons.archive, columnSlug: 'regulation-school' },
      { title: '下载中心', path: '/list/download', icon: icons.download, columnSlug: 'download' },
    ],
  },
  {
    title: '信息公开',
    path: '/disclosure',
    icon: icons.internal,
    children: [
      { title: '公开指南', path: '/disclosure/guide', icon: icons.document },
      { title: '公开年报', path: '/disclosure/report', icon: icons.report },
      { title: '公开申请', path: '/disclosure/apply', icon: icons.edit },
    ],
  },
])

// 右侧工具位 2 项(置于导航栏右侧)
const toolNav: NavItem[] = []

// 硬编码配置快照：供轮询刷新时重建 configMap 使用，避免重复重建后配置漂移
const hardcodedNavSnapshot: NavItem[] = mainNav.value.map(item => ({
  ...item,
  children: item.children?.map(c => ({ ...c })),
}))

// 加载栏目树，完全从后端数据重建 mainNav
// 策略：
//   1. 从后端获取 ACTIVE 栏目树（停用/删除栏目不在其中）
//   2. 对每个后端栏目，查找硬编码配置（提供图标/特殊路径）
//   3. 已知栏目保留硬编码配置；新栏目使用默认配置（默认图标 + /list/${slug} 路径）
//   4. 无 columnSlug 的项（信息公开）保持在末尾
//   5. 停用栏目不在后端返回列表中，自然不显示
async function refreshNav() {
  try {
    const res = await fetchColumnTree() as any
    if (!res || (res.code !== 0 && res.code !== 200)) return
    if (!Array.isArray(res.data) || res.data.length === 0) return

    // 构建硬编码配置查找表（一级栏目）- 始终基于原始快照，避免轮询漂移
    const configMap = new Map<string, NavItem>()
    for (const item of hardcodedNavSnapshot) {
      if (item.columnSlug) {
        configMap.set(item.columnSlug, item)
      }
    }

    // 从后端数据重建 mainNav
    const newNav: NavItem[] = []
    const disabled = new Set<string>()

    for (const node of res.data) {
      const slug = node.columnSlug || node.code || node.slug
      if (!slug) continue

      const config = configMap.get(slug)
      if (config) {
        // 已知栏目：保留硬编码配置（图标/路径），重建 children
        const newItem: NavItem = { ...config }

        if (Array.isArray(node.children) && node.children.length > 0) {
          // 构建子栏目硬编码配置查找表
          const childConfigMap = new Map<string, NavChild>()
          if (config.children) {
            for (const child of config.children) {
              if (child.columnSlug) {
                childConfigMap.set(child.columnSlug, child)
              }
            }
          }

          // 从后端数据重建 children
          const newChildren: NavChild[] = []
          for (const childNode of node.children) {
            const childSlug = childNode.columnSlug || childNode.code || childNode.slug
            if (!childSlug) continue

            const childConfig = childConfigMap.get(childSlug)
            if (childConfig) {
              // 已知子栏目：保留硬编码配置
              newChildren.push({ ...childConfig })
            } else {
              // 新子栏目：创建默认配置
              newChildren.push({
                title: childNode.name || childNode.title || childSlug,
                path: `/list/${childSlug}`,
                icon: icons.document,
                columnSlug: childSlug,
                linkUrl: childNode.linkUrl,
              })
            }
          }

          // 保留无 columnSlug 的子项（如信息公开的子项）
          if (config.children) {
            for (const child of config.children) {
              if (!child.columnSlug) {
                newChildren.push({ ...child })
              }
            }
          }

          newItem.children = newChildren
        }

        newNav.push(newItem)
      } else {
        // 新栏目：创建默认配置
        const children: NavChild[] = (node.children || []).map((child: any) => {
          const childSlug = child.columnSlug || child.code || child.slug
          return {
            title: child.name || child.title || childSlug,
            path: `/list/${childSlug}`,
            icon: icons.document,
            columnSlug: childSlug,
            linkUrl: child.linkUrl,
          }
        })

        newNav.push({
          title: node.name || node.title || slug,
          path: `/list/${slug}`,
          icon: icons.document,
          columnSlug: slug,
          linkUrl: node.linkUrl,
          children: children.length > 0 ? children : undefined,
        })
      }
    }

    // 保留无 columnSlug 的项（信息公开）在末尾 - 基于原始快照
    for (const item of hardcodedNavSnapshot) {
      if (!item.columnSlug) {
        newNav.push({ ...item })
      }
    }

    mainNav.value = newNav
    disabledSlugs.value = disabled
  } catch {
    // API 失败时保持当前导航（不覆盖已有数据）
  }
}

// 首次加载 + 轻量轮询（60s）+ 页面可见性刷新
// 目的：栏目停用/启用后，前台导航最迟 60s 内自动同步，无需手动刷新
let pollTimer: ReturnType<typeof setInterval> | null = null
const POLL_INTERVAL = 60_000

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(refreshNav, POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 页面从隐藏切回可见时立即刷新（切回标签页场景）
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshNav()
  }
}

onMounted(() => {
  refreshNav()
  startPolling()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// 判断导航项是否可见（未绑定 columnSlug 的始终可见）
const isNavVisible = (item: NavItem | NavChild) => {
  if (!item.columnSlug) return true
  return !disabledSlugs.value.has(item.columnSlug)
}

// 合并(移动端抽屉统一展示) - 过滤掉停用的栏目
const navItems = computed(() =>
  [...mainNav.value, ...toolNav]
    .filter(isNavVisible)
    .map((item) => ({
      ...item,
      children: item.children?.filter(isNavVisible),
    })),
)

// 当前路由激活判断(支持子栏目高亮父级)
// 严格前缀匹配：以 path 开头且后面紧跟 '/' 或 '-'（兼容两种子菜单设计）
// - /disclosure 匹配 /disclosure/guide（斜杠分隔）
// - /list/about 匹配 /list/about-brief（中划线分隔的兄弟 slug）
// - 不再误匹配 /guideline、/disclosure-foo 等无关路径
const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  if (route.path === path) return true
  return route.path.startsWith(path + '/') || route.path.startsWith(path + '-')
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
  box-shadow: $shadow-sm;
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

  // 工具位(规章制度)推到导航栏右侧
  li:last-child {
    margin-left: auto;
  }
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

  // 底部指示器(悬浮/激活时 VI 主色线条)
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%) scaleX(0);
    width: 24px;
    height: 3px;
    background: $primary;
    border-radius: $radius-pill $radius-pill 0 0;
    transition: transform $transition-base;
  }

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);

    .nav-icon {
      opacity: 1;
      color: $primary-light;
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
      color: $primary-light;
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
  box-shadow: $shadow-sm;
  padding: $space-2 0;
  list-style: none;
  margin: 0;
  z-index: $z-dropdown;

  // 顶部 VI 主色装饰条
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: $primary;
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
        background: $primary-bg;
        color: $primary-dark;
        padding-left: $space-5;

        .dropdown-icon {
          color: $primary;
        }
      }

      &.active {
        color: $primary-dark;
        font-weight: $fw-semibold;
        background: $primary-bg;

        .dropdown-icon {
          color: $primary;
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
      color: $primary-light;
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
      color: $primary-light;
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
        color: $primary;
        opacity: 0.7;
      }

      &:hover,
      &.active {
        background: rgba(0, 115, 189, 0.1); // VI 主色半透明
        color: $primary-light;

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
