<template>
  <div class="admin-layout">
    <!-- 移动端遮罩 -->
    <div v-if="isMobile && !isCollapsed" class="sidebar-overlay" @click="isCollapsed = true" />

    <!-- 侧边栏 -->
    <aside class="admin-sidebar" :class="{ 'is-collapsed': isCollapsed, 'is-mobile': isMobile }">
      <div class="sidebar-logo">
        <img src="/images/logo/logo-square-blue.png" alt="Logo" class="sidebar-logo__img" />
        <span v-show="!isCollapsed || !isMobile" class="sidebar-logo__text">教务处后台</span>
        <el-icon v-if="isMobile" class="sidebar-close" @click="isCollapsed = true"><Close /></el-icon>
      </div>
      <div class="sidebar-menu-wrapper">
        <el-scrollbar>
          <el-menu
            :default-active="activeMenu"
            :collapse="isCollapsed && !isMobile"
            :collapse-transition="false"
            background-color="#005a8e"
            text-color="#b3d4f0"
            active-text-color="#ffffff"
            active-background-color="#00426a"
            @select="onMenuSelect"
          >
            <template v-for="menu in adminUserStore.menus" :key="menu.key">
              <!-- 无子菜单 -->
              <el-menu-item v-if="!menu.children && menu.path" :index="menu.path" @click="navigateTo(menu.path!)">
                <el-icon v-if="menu.icon"><component :is="iconMap[menu.icon]" /></el-icon>
                <template #title>{{ menu.title }}</template>
              </el-menu-item>
              <!-- 有子菜单 -->
              <el-sub-menu v-else-if="menu.children" :index="menu.key">
                <template #title>
                  <el-icon v-if="menu.icon"><component :is="iconMap[menu.icon]" /></el-icon>
                  <span>{{ menu.title }}</span>
                </template>
                <el-menu-item
                  v-for="child in menu.children"
                  :key="child.key"
                  :index="child.path"
                  @click="navigateTo(child.path!)"
                >
                  {{ child.title }}
                </el-menu-item>
              </el-sub-menu>
            </template>
          </el-menu>
        </el-scrollbar>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="admin-main">
      <!-- 顶部导航 -->
      <header class="admin-header">
        <div class="header-left">
          <el-icon v-if="isMobile" class="hamburger" @click="isCollapsed = false"><Fold /></el-icon>
          <el-icon v-else class="collapse-btn" @click="isCollapsed = !isCollapsed">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/" class="breadcrumb-wrap">
            <el-breadcrumb-item :to="{ path: '/admin' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentPageName">{{ currentPageName }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <!-- 消息中心 -->
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="header-badge">
            <el-icon class="header-icon" @click="navigateTo('/admin/message/unread')"><Bell /></el-icon>
          </el-badge>
          <!-- 个人中心下拉 -->
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ authStore.user?.realName || '管理员' }}</span>
              <el-tag size="small" type="info" class="role-tag">{{ adminUserStore.roleName }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="navigateTo('/admin/profile/info')">个人资料</el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/admin/profile/password')">修改密码</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="admin-content">
        <slot />
      </main>

      <!-- 底部信息 -->
      <footer class="admin-footer">
        <span class="footer-text">
          当前账号: {{ authStore.user?.username || 'admin' }} |
          角色: {{ adminUserStore.roleName }} |
          深圳信息职业技术大学教务处 &copy; {{ new Date().getFullYear() }}
        </span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Admin 后台布局（从 apps/admin 迁移并适配 Nuxt）
 * - 角色感知动态侧边栏菜单
 * - 移动端抽屉式侧边栏
 * - 顶部面包屑 + 消息 + 个人中心下拉
 * - 未读消息数对接 /api/admin/messages/unread-count（T3.3）
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/cmsAuth'
import { useAdminUserStore } from '~/stores/adminUser'
import { fetchUnreadCount } from '~/composables/adminApi'
import {
  Bell, User, UserFilled, Document, FolderOpened, DataAnalysis,
  Tickets, Notebook, Setting, ChatLineSquare, Search,
  Fold, Expand, Close,
} from '@element-plus/icons-vue'

/** 图标名称 → 组件映射（el-menu 中用字符串引用图标） */
const iconMap: Record<string, any> = {
  Bell, User, UserFilled, Document, FolderOpened, DataAnalysis,
  Tickets, Notebook, Setting, ChatLineSquare, Search,
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const adminUserStore = useAdminUserStore()

const isCollapsed = ref(false)
// 未读消息数：默认 0，登录后通过 API 获取
const unreadCount = ref(0)
const isMobile = ref(false)

const activeMenu = computed(() => route.path)
const currentPageName = computed(() => {
  const nameMap: Record<string, string> = {
    '/admin': '工作台',
    '/admin/article/create': '新建稿件',
    '/admin/article/draft': '我的草稿',
    '/admin/article/pending': '已提交待审稿件',
    '/admin/article/rejected': '被驳回稿件',
    '/admin/review/pending': '待我审核稿件',
    '/admin/review/published': '已发布稿件',
    '/admin/review/logs': '栏目操作日志',
    '/admin/column/final-review': '待我终审稿件',
    '/admin/column/all-articles': '全栏目稿件检索',
    '/admin/column/published': '已发布稿件管理',
    '/admin/column/recommend': '首页推荐位配置',
    '/admin/column/tags': '栏目标签设置',
    '/admin/column/audit/logs': '本栏目操作日志',
    '/admin/column/audit/export': '日志导出',
    '/admin/article/my-submissions': '本人提交稿件',
    '/admin/message/all': '全部消息',
    '/admin/message/unread': '未读待办',
    '/admin/message/archived': '已归档消息',
    '/admin/profile/info': '个人资料',
    '/admin/profile/password': '修改登录密码',
    '/admin/profile/logs': '我的操作日志',
    '/admin/statistics/column': '栏目访问统计',
    '/admin/statistics/hot': '热门稿件排行',
    '/admin/statistics/download': '附件下载排行',
    '/admin/statistics/export': '统计报表导出',
    '/admin/system/account/list': '管理员账号列表',
    '/admin/system/account/role': '角色权限配置',
    '/admin/system/column/tree': '全站栏目管理',
    '/admin/system/disclosure/list': '信息公开目录',
    '/admin/system/config/sso': 'SSO统一认证配置',
    '/admin/system/config/rsa': 'RSA密钥管理',
    '/admin/system/config/sensitive': '敏感词词库管理',
    '/admin/system/config/ratelimit': '限流风控配置',
    '/admin/system/config/stats-filter': '统计过滤规则',
    '/admin/system/config/tags': '标签体系管理',
    '/admin/system/message/all': '全站消息查询',
    '/admin/system/message/publish': '发布全局公告',
    '/admin/system/statistics/overview': '全栏目访问统计',
    '/admin/system/statistics/hot': '全站热门稿件',
    '/admin/system/statistics/download': '全站附件下载',
    '/admin/system/statistics/export': '全量报表导出',
    '/admin/system/audit/all': '全站操作日志',
    '/admin/system/audit/export': '日志批量导出',
    '/admin/system/audit/archive': '历史日志归档',
    '/admin/system/audit/hash': '日志完整性校验',
    '/admin/system/article/search': '全站稿件查询',
  }
  return nameMap[route.path] || ''
})

/** 响应式检测 */
function checkMobile() {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    isCollapsed.value = true
  }
}

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  // 鉴权守卫已由 middleware/admin-auth.global.ts 处理
  // 此处仅恢复认证状态用于布局渲染
  authStore.restoreAuth()

  // 拉取未读消息数（登录态下）
  if (authStore.token) {
    try {
      const res = await fetchUnreadCount()
      if (res?.code === 0 && typeof res.data?.count === 'number') {
        unreadCount.value = res.data.count
      }
    } catch {
      // 拉取失败保持 0，不影响布局渲染
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function navigateTo(path: string) {
  router.push(path)
}

/** 移动端点击菜单后自动收起 */
function onMenuSelect() {
  if (isMobile.value) {
    isCollapsed.value = true
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/admin/login')
}
</script>

<style lang="scss" scoped>
/* ========== 整体布局 ========== */
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* ========== 侧边栏 ========== */
.admin-sidebar {
  width: 220px;
  height: 100vh;
  background: $primary-dark;
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;

  &.is-collapsed {
    width: 64px;
  }

  &.is-mobile {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 200;
    box-shadow: 4px 0 16px rgb(0 0 0 / 30%);

    &.is-collapsed {
      transform: translateX(-100%);
      width: 220px;
    }
  }
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: $primary-darker;
  overflow: hidden;
  flex-shrink: 0;

  &__img {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    filter: brightness(0) invert(1);
  }

  &__text {
    margin-left: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
  }
}

.sidebar-close {
  margin-left: auto;
  font-size: 18px;
  color: #bfcbd9;
  cursor: pointer;

  &:hover {
    color: #fff;
  }
}

.sidebar-menu-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;

  :deep(.el-scrollbar) {
    height: 100%;
  }

  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }
}

/* ========== 移动端遮罩 ========== */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(0 0 0 / 50%);
  z-index: 150;
}

/* ========== 主内容区 ========== */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.admin-header {
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  flex-shrink: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.hamburger {
  font-size: 22px;
  cursor: pointer;
  margin-right: 12px;
  color: #606266;
  flex-shrink: 0;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 16px;
  color: #606266;
  flex-shrink: 0;

  &:hover {
    color: #409eff;
  }
}

.breadcrumb-wrap {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  :deep(.el-breadcrumb__item) {
    white-space: nowrap;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.header-icon {
  font-size: 20px;
  cursor: pointer;
  color: #606266;

  &:hover {
    color: #409eff;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #303133;
}

.role-tag {
  display: none;
}

.header-badge {
  line-height: 1;
}

/* ========== 内容区 ========== */
.admin-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f0f2f5;
  min-height: 0;
}

/* ========== 底部 ========== */
.admin-footer {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
  background: #fff;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.footer-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== 菜单样式 ========== */
:deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu__title) {
  padding-right: 20px !important;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #00426a !important;
  color: #ffffff !important;
}

/* ========== 过渡动画 ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== 移动端适配 ========== */
@include respond-to(xs) {
  .admin-sidebar {
    width: 220px;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 200;
    box-shadow: 4px 0 16px rgb(0 0 0 / 30%);

    &.is-collapsed {
      transform: translateX(-100%);
    }
  }

  .admin-header {
    padding: 0 12px;
  }

  .user-name {
    display: none;
  }

  .role-tag {
    display: inline-flex;
  }

  .admin-content {
    padding: 12px;
  }

  .footer-text {
    font-size: 11px;
  }

  :deep(.el-table) {
    font-size: 12px;
    .el-table__cell {
      padding: 6px 0;
    }
  }

  :deep(.search-bar) {
    flex-direction: column;
    align-items: stretch;
    .el-input,
    .el-select {
      width: 100% !important;
    }
  }

  :deep(.el-row) {
    .el-col {
      margin-bottom: 12px;
    }
  }
}

/* ========== 平板适配 ========== */
@include respond-to(sm) {
  .admin-sidebar {
    width: 200px;
    &.is-collapsed {
      width: 64px;
    }
  }

  .user-name {
    display: none;
  }

  .role-tag {
    display: inline-flex;
  }
}
</style>

<!-- Admin 子页面通用样式（非 scoped，供所有 admin 子页面使用） -->
<style lang="scss">
.page-container {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;

  .el-input,
  .el-select {
    width: 200px;
  }

  .el-date-editor {
    width: 260px;
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.table-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.role-tip {
  padding: 8px 16px;
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  font-size: 13px;
  color: #409eff;
  margin-bottom: 16px;
}

/* 平板适配 */
@media screen and (max-width: 1024px) {
  .search-bar {
    .el-input,
    .el-select {
      width: 160px;
    }
  }
}

/* 手机适配 */
@media screen and (max-width: 768px) {
  .page-container {
    padding: 12px;
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;

    .el-input,
    .el-select,
    .el-date-editor {
      width: 100% !important;
    }
  }
}
</style>
