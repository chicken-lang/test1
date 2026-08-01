// ====================================================================
// Admin 后台用户 Store（从 apps/admin 迁移）
// 依赖 cmsAuth store 获取认证状态, 在此基础上计算角色菜单
// ====================================================================
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAuthStore } from './cmsAuth'
import { AdminRole } from '~/utils/types'
import type { MenuItem } from '~/utils/adminTypes'

/** 各角色菜单配置 */
function getMenusByRole(role: string): MenuItem[] {
  const common: MenuItem[] = [
    {
      key: 'message',
      title: '站内消息',
      icon: 'Bell',
      children: [
        { key: 'message-all', title: '全部消息', path: '/admin/message/all' },
        { key: 'message-unread', title: '未读待办', path: '/admin/message/unread' },
        { key: 'message-archived', title: '已归档消息', path: '/admin/message/archived' },
      ],
    },
    {
      key: 'profile',
      title: '个人中心',
      icon: 'User',
      children: [
        { key: 'profile-info', title: '个人资料', path: '/admin/profile/info' },
        { key: 'profile-password', title: '修改登录密码', path: '/admin/profile/password' },
      ],
    },
  ]

  const editorMenus: MenuItem[] = [
    {
      key: 'article',
      title: '稿件管理',
      icon: 'Document',
      children: [
        { key: 'article-create', title: '新建稿件', path: '/admin/article/create' },
        { key: 'article-draft', title: '我的草稿', path: '/admin/article/draft' },
        { key: 'article-pending', title: '已提交待审稿件', path: '/admin/article/pending' },
        { key: 'article-rejected', title: '被驳回稿件', path: '/admin/article/rejected' },
      ],
    },
    ...common,
    { key: 'profile-log', title: '操作日志', icon: 'Notebook', path: '/admin/profile/logs' } as MenuItem,
  ]

  const reviewerMenus: MenuItem[] = [
    {
      key: 'article',
      title: '稿件管理',
      icon: 'Document',
      children: [
        { key: 'article-create', title: '新建稿件', path: '/admin/article/create' },
        { key: 'article-draft', title: '我的草稿', path: '/admin/article/draft' },
        { key: 'article-review', title: '待我审核稿件', path: '/admin/review/pending' },
        { key: 'article-pending', title: '已提交待审稿件', path: '/admin/article/pending' },
        { key: 'article-rejected', title: '被驳回稿件', path: '/admin/article/rejected' },
        { key: 'article-published', title: '已发布稿件', path: '/admin/review/published' },
      ],
    },
    { key: 'statistics', title: '数据统计', icon: 'DataAnalysis', path: '/admin/statistics/column' } as MenuItem,
    ...common,
    { key: 'profile-log', title: '栏目操作日志', icon: 'Notebook', path: '/admin/review/logs' } as MenuItem,
  ]

  const columnAdminMenus: MenuItem[] = [
    {
      key: 'article',
      title: '稿件管理',
      icon: 'Document',
      children: [
        { key: 'article-create', title: '新建稿件', path: '/admin/article/create' },
        { key: 'article-draft', title: '我的草稿', path: '/admin/article/draft' },
        { key: 'article-final', title: '待我终审稿件', path: '/admin/column/final-review' },
        { key: 'article-review', title: '待我审核稿件', path: '/admin/review/pending' },
        { key: 'article-pending', title: '本人提交稿件', path: '/admin/article/my-submissions' },
        { key: 'article-all', title: '全栏目稿件检索', path: '/admin/column/all-articles' },
        { key: 'article-published', title: '已发布稿件', path: '/admin/column/published' },
      ],
    },
    {
      key: 'column-mgmt',
      title: '栏目管理',
      icon: 'FolderOpened',
      children: [
        // 栏目树形管理(栏目结构)与信息公开目录属系统管理员职责,栏目管理员无权限,已从菜单移除
        { key: 'column-recommend', title: '首页推荐位配置', path: '/admin/column/recommend' },
        { key: 'column-tags', title: '栏目标签设置', path: '/admin/column/tags' },
      ],
    },
    {
      key: 'statistics',
      title: '数据统计',
      icon: 'DataAnalysis',
      children: [
        { key: 'stats-overview', title: '栏目访问统计', path: '/admin/statistics/column' },
        { key: 'stats-hot', title: '热门稿件排行', path: '/admin/statistics/hot' },
        { key: 'stats-download', title: '附件下载排行', path: '/admin/statistics/download' },
        { key: 'stats-export', title: '统计报表导出', path: '/admin/statistics/export' },
      ],
    },
    {
      key: 'audit',
      title: '审计日志',
      icon: 'Tickets',
      children: [
        { key: 'audit-logs', title: '本栏目操作日志', path: '/admin/column/audit/logs' },
        { key: 'audit-export', title: '日志导出', path: '/admin/column/audit/export' },
      ],
    },
    ...common,
  ]

  const systemAdminMenus: MenuItem[] = [
    {
      key: 'account',
      title: '账号权限管理',
      icon: 'UserFilled',
      children: [
        { key: 'account-list', title: '管理员账号列表', path: '/admin/system/account/list' },
        { key: 'account-role', title: '角色权限配置', path: '/admin/system/account/role' },
      ],
    },
    {
      key: 'column-global',
      title: '栏目全局管理',
      icon: 'FolderOpened',
      children: [
        { key: 'column-tree', title: '全站栏目管理', path: '/admin/system/column/tree' },
        { key: 'disclosure-list', title: '信息公开目录', path: '/admin/system/disclosure/list' },
      ],
    },
    {
      key: 'system-config',
      title: '系统配置中心',
      icon: 'Setting',
      children: [
        { key: 'config-sso', title: 'SSO统一认证配置', path: '/admin/system/config/sso' },
        { key: 'config-rsa', title: 'RSA密钥管理', path: '/admin/system/config/rsa' },
        { key: 'config-sensitive', title: '敏感词词库管理', path: '/admin/system/config/sensitive' },
        { key: 'config-ratelimit', title: '限流风控配置', path: '/admin/system/config/ratelimit' },
        { key: 'stats-filter', title: '统计过滤规则', path: '/admin/system/config/stats-filter' },
        { key: 'config-tags', title: '标签体系管理', path: '/admin/system/config/tags' },
      ],
    },
    {
      key: 'system-message',
      title: '站内消息管理',
      icon: 'ChatLineSquare',
      children: [
        { key: 'sys-message-all', title: '全站消息查询', path: '/admin/system/message/all' },
        { key: 'sys-message-publish', title: '发布全局公告', path: '/admin/system/message/publish' },
      ],
    },
    {
      key: 'system-stats',
      title: '全站数据统计',
      icon: 'DataAnalysis',
      children: [
        { key: 'sys-stats-overview', title: '全栏目访问统计', path: '/admin/system/statistics/overview' },
        { key: 'sys-stats-hot', title: '全站热门稿件', path: '/admin/system/statistics/hot' },
        { key: 'sys-stats-download', title: '全站附件下载', path: '/admin/system/statistics/download' },
        { key: 'sys-stats-export', title: '全量报表导出', path: '/admin/system/statistics/export' },
      ],
    },
    {
      key: 'system-audit',
      title: '审计日志中心',
      icon: 'Tickets',
      children: [
        { key: 'sys-audit-all', title: '全站操作日志', path: '/admin/system/audit/all' },
        { key: 'sys-audit-export', title: '日志批量导出', path: '/admin/system/audit/export' },
        { key: 'sys-audit-archive', title: '历史日志归档', path: '/admin/system/audit/archive' },
        { key: 'sys-audit-hash', title: '日志完整性校验', path: '/admin/system/audit/hash' },
      ],
    },
    { key: 'system-article', title: '稿件查询(只读)', icon: 'Search', path: '/admin/system/article/search' } as MenuItem,
    ...common,
  ]

  const map: Record<string, MenuItem[]> = {
    [AdminRole.EDITOR]: editorMenus,
    [AdminRole.REVIEWER]: reviewerMenus,
    [AdminRole.COLUMN_ADMIN]: columnAdminMenus,
    [AdminRole.SYSTEM_ADMIN]: systemAdminMenus,
  }

  return map[role] || []
}

export const useAdminUserStore = defineStore('admin-user', () => {
  const authStore = useAuthStore()

  const role = computed(() => authStore.user?.role ?? '')
  const roleName = computed(() => {
    if (!role.value) return ''
    const roleMap: Record<string, string> = {
      [AdminRole.EDITOR]: '编辑管理员',
      [AdminRole.REVIEWER]: '审核管理员',
      [AdminRole.COLUMN_ADMIN]: '栏目管理员',
      [AdminRole.SYSTEM_ADMIN]: '系统管理员',
    }
    return roleMap[role.value] || ''
  })
  const bindColumns = computed(() => authStore.user?.bindColumnIds || [])
  const menus = computed(() => role.value ? getMenusByRole(role.value) : [])

  return { role, roleName, bindColumns, menus }
})
