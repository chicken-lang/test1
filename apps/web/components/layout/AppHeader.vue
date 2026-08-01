<template>
  <header class="app-header">
    <!-- 顶部装饰条(VI 主色细线 + shimmer) -->
    <div class="header-topline" />

    <div class="container header-inner">
      <!-- 左侧:校徽 + 校名 + 部门名 -->
      <NuxtLink to="/" class="header-logo" aria-label="返回首页">
        <SchoolEmblem variant="horizontal" color="white" :size="104" class="logo-emblem" />
        <div class="logo-text">
          <p class="dept-name">
            <span class="dept-cn">教 务 处</span>
            <span class="dept-en">Academic Affairs Office</span>
          </p>
        </div>
      </NuxtLink>

      <!-- 右侧:快捷功能 -->
      <div class="header-tools">
        <!-- 搜索(点击展开) -->
        <button
          class="tool-item"
          type="button"
          aria-label="搜索"
          @click="searchOpen = !searchOpen"
        >
          <Icon :icon="icons.search" :width="18" :height="18" />
          <span>搜索</span>
        </button>

        <div class="tool-divider" />

        <!-- 办事大厅 -->
        <NuxtLink to="/list/guide" class="tool-item" aria-label="办事大厅">
          <Icon :icon="icons.guide" :width="18" :height="18" />
          <span>办事大厅</span>
        </NuxtLink>

        <div class="tool-divider" />

        <!-- 登录(下拉) -->
        <el-dropdown trigger="hover" @command="onLoginCommand">
          <button class="tool-item" type="button" aria-label="登录">
            <Icon :icon="icons.user" :width="18" :height="18" />
            <span>登录</span>
            <Icon :icon="icons.chevronDown" :width="12" :height="12" class="caret" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="student">
                <Icon :icon="icons.student" :width="16" :height="16" />
                学生登录
              </el-dropdown-item>
              <el-dropdown-item command="teacher">
                <Icon :icon="icons.teacher" :width="16" :height="16" />
                教师登录
              </el-dropdown-item>
              <el-dropdown-item divided command="admin">
                <Icon :icon="icons.internal" :width="16" :height="16" />
                管理后台
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        
      </div>
    </div>

    <!-- 搜索展开区 -->
    <Transition name="search-slide">
      <div v-show="searchOpen" class="search-panel">
        <div class="container search-inner">
          <Icon :icon="icons.search" :width="20" :height="20" class="search-icon" />
          <input
            ref="searchInput"
            v-model="searchKeyword"
            type="search"
            class="search-input"
            placeholder="搜索通知公告、教务管理、办事指南..."
            aria-label="搜索关键词"
            @keyup.enter="onSearch"
          />
          <button class="search-btn" type="button" @click="onSearch">搜索</button>
          <button class="search-close" type="button" aria-label="关闭搜索" @click="searchOpen = false">
            <Icon :icon="icons.close" :width="20" :height="20" />
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
// AppHeader v5.0: SchoolEmblem 组件 + icons 字典 + 搜索弹窗 + 登录下拉
// T3.1: 学生/教师登录跳转 SSO 登录页 /login/[role]
import { icons } from '~/utils/icons'

const route = useRoute()
const router = useRouter()

// 搜索状态
const searchOpen = ref(false)
const searchKeyword = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

// 搜索展开时自动聚焦
watch(searchOpen, async (open) => {
  if (open) {
    await nextTick()
    searchInput.value?.focus()
  }
})

// 执行搜索(跳转搜索页)
const onSearch = () => {
  if (!searchKeyword.value.trim()) return
  router.push({ path: '/search', query: { q: searchKeyword.value.trim() } })
  searchOpen.value = false
  searchKeyword.value = ''
}

// 登录下拉命令:学生/教师跳转 SSO 登录页,管理员跳转后台
const onLoginCommand = (command: string) => {
  if (command === 'admin') {
    router.push('/admin/login')
  } else if (command === 'student' || command === 'teacher') {
    router.push(`/login/${command}`)
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  background: $primary;
  color: #fff;
  position: relative;
  overflow: hidden;
}

// 顶部 VI 主色装饰线
.header-topline {
  height: 3px;
  background: $primary; // VI 主色(原 $grad-gold 已映射)
  position: relative;
  z-index: $z-base;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    // 豁免说明:shimmer 动画功能性渐变(必需,用户明确要求保留)
    // 白色半透明扫光效果,非品牌色渐变
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
  z-index: $z-base;
}

// Logo 区
.header-logo {
  display: flex;
  align-items: center;
  gap: $space-4;
  color: #fff;
  transition: opacity $transition-fast;
  // 向左移动,抵消容器内边距,贴近视口边缘
  margin-left: -$space-5;

  &:hover {
    opacity: 0.95;
    color: #fff;
  }
}

.logo-emblem {
  flex-shrink: 0;
  color: #fff;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.school-name {
  font-family: $font-school-cn; // VI 手册第 7 页:中文校名标准字体(过渡方案:系统宋体)
  font-size: $fs-3xl;
  font-weight: $fw-bold;
  letter-spacing: 2px;
  line-height: $lh-tight;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.school-name-en {
  font-family: $font-school-en; // VI 手册第 8 页:英文校名标准字体 Arial
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
    font-size: 19px;
    letter-spacing: 6px;
    font-weight: $fw-medium;
    color: $primary-light;
  }

  .dept-en {
    font-size: $fs-md;
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
  display: inline-flex;
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

  .caret {
    opacity: 0.7;
  }
}

.tool-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 $space-1;
}

// 搜索展开面板
.search-panel {
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.search-inner {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4 0;
}

.search-icon {
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: $radius-base;
  padding: 0 $space-4;
  color: #fff;
  font-size: $fs-md;
  outline: none;
  transition: all $transition-fast;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: $primary-light;
  }
}

.search-btn {
  height: 40px;
  padding: 0 $space-5;
  background: $primary;
  color: #fff;
  border: none;
  border-radius: $radius-base;
  font-size: $fs-base;
  font-weight: $fw-medium;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    box-shadow: $shadow-primary;
  }
}

.search-close {
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: $radius-base;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-fast;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
}

// 搜索面板过渡
.search-slide-enter-active,
.search-slide-leave-active {
  transition: all 0.25s $ease-out-expo;
}
.search-slide-enter-from,
.search-slide-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

// 背景装饰(VI 合规:删除光晕渐变,改为纯色装饰或删除)
// 注:VI 规范禁止 radial-gradient,此处装饰元素直接移除
// .app-header::after { ... }  // 已删除,保持 Header 纯色背景

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
    :deep(img) {
      width: 48px !important;
      height: 48px !important;
    }
  }

  .tool-item span {
    display: none;
  }

  .tool-divider {
    display: none;
  }
}
</style>
