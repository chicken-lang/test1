// ====================================================================
// CMS 权限校验 Composable
// 用于页面级权限守卫和操作级权限判断
// ====================================================================
import { useAuthStore } from '~/stores/cmsAuth'
import { AdminRole, RoleLabels } from '~/utils/types'

/** 权限校验组合式函数 */
export function usePermission() {
  const authStore = useAuthStore()

  /** 检查当前用户是否有指定权限 */
  const can = (permission: string): boolean => {
    return authStore.hasPermission(permission)
  }

  /** 检查当前用户是否为指定角色之一 */
  const isRole = (...roles: AdminRole[]): boolean => {
    return roles.includes(authStore.currentRole as AdminRole)
  }

  /** 编辑管理员和审核管理员: 可创建/编辑草稿 */
  const canEdit = computed(() => isRole(AdminRole.EDITOR, AdminRole.REVIEWER, AdminRole.COLUMN_ADMIN))

  /** 审核管理员和栏目管理员: 可审核稿件 */
  const canReview = computed(() => isRole(AdminRole.REVIEWER, AdminRole.COLUMN_ADMIN))

  /** 栏目管理员专属: 可终审/发布 */
  const canPublish = computed(() => isRole(AdminRole.COLUMN_ADMIN))

  /** 栏目管理员和系统管理员: 可查看审计日志 */
  const canViewAudit = computed(() => isRole(AdminRole.COLUMN_ADMIN, AdminRole.SYSTEM_ADMIN))

  /** 系统管理员专属: 可管理系统配置 */
  const canSystemConfig = computed(() => isRole(AdminRole.SYSTEM_ADMIN))

  /** 是否可管理用户(仅系统管理员) */
  const canManageUsers = computed(() => isRole(AdminRole.SYSTEM_ADMIN))

  /** 是否可管理敏感词(仅系统管理员) */
  const canManageSensitiveWords = computed(() => isRole(AdminRole.SYSTEM_ADMIN))

  /** 当前角色标签 */
  const roleLabel = computed(() => {
    const role = authStore.currentRole
    return role ? RoleLabels[role] : '未登录'
  })

  return {
    can,
    isRole,
    canEdit,
    canReview,
    canPublish,
    canViewAudit,
    canSystemConfig,
    canManageUsers,
    canManageSensitiveWords,
    roleLabel,
  }
}

/** 路由权限守卫(在 middleware 或页面 setup 中调用) */
export function useRouteGuard() {
  const authStore = useAuthStore()
  const router = useRouter()

  /** 检查是否已登录,未登录跳转登录页 */
  const requireAuth = () => {
    if (!authStore.isLoggedIn) {
      router.push('/admin/login')
      return false
    }
    authStore.touchActivity()
    return true
  }

  /** 检查是否具有指定权限,无权限提示 */
  const requirePermission = (permission: string) => {
    if (!requireAuth()) return false
    if (!authStore.hasPermission(permission)) {
      ElMessage.error('权限不足，无法执行此操作')
      return false
    }
    return true
  }

  /** 检查是否为指定角色 */
  const requireRole = (...roles: AdminRole[]) => {
    if (!requireAuth()) return false
    if (!roles.includes(authStore.currentRole as AdminRole)) {
      ElMessage.error('角色权限不足')
      return false
    }
    return true
  }

  return { requireAuth, requirePermission, requireRole }
}
