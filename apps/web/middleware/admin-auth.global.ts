// ====================================================================
// 全局路由中间件 - 后台鉴权守卫
// 解决 G3: admin 鉴权仅靠 layout onMounted,深链直访鉴权时序风险
// 改为在路由级别执行鉴权,早于组件挂载
// ====================================================================
import { useAuthStore } from '~/stores/cmsAuth'

export default defineNuxtRouteMiddleware((to) => {
  // 仅对 /admin 路径生效（排除登录页和 404）
  if (!to.path.startsWith('/admin') || to.path === '/admin/login' || to.path === '/admin/404') {
    return
  }

  // 认证状态存储在 localStorage,SSR 阶段无法访问
  // 仅在客户端执行鉴权检查
  if (process.client) {
    const authStore = useAuthStore()

    // 从 localStorage 恢复认证状态
    authStore.restoreAuth()

    // 未登录 → 跳转登录页
    if (!authStore.isLoggedIn) {
      return navigateTo('/admin/login')
    }

    // 角色越权防护: /admin/system/* 为系统管理员专属
    // (栏目结构/信息公开目录/账号权限/系统配置/全站统计与审计等)
    // 栏目管理员/审核/编辑均无权限,直接 URL 访问也拦截
    if (to.path.startsWith('/admin/system/') && authStore.user?.role !== 'system_admin') {
      return navigateTo('/admin')
    }

    // 已登录 → 更新活动时间（滑动会话）
    authStore.touchActivity()
  }
})
