<template>
  <div class="dashboard-page">
    <div class="role-tip">
      当前角色: <strong>{{ adminUserStore.roleName }}</strong>
      <template v-if="adminUserStore.role === 'editor'">，仅可操作分配栏目稿件</template>
      <template v-else-if="adminUserStore.role === 'reviewer'">，可审核所辖栏目稿件</template>
      <template v-else-if="adminUserStore.role === 'column_admin'">，可管理所辖栏目全部业务</template>
      <template v-else-if="adminUserStore.role === 'system_admin'">，拥有系统全部管理权限</template>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" v-for="card in statCards" :key="card.label">
        <div class="stat-card">
          <div class="stat-card__value" :style="{ color: card.color }">
            {{ card.value }}
          </div>
          <div class="stat-card__label">{{ card.label }}</div>
        </div>
      </el-col>
    </el-row>

    <div class="page-container" style="margin-top: 16px">
      <h3 class="section-title">快捷操作</h3>
      <div class="quick-actions">
        <template v-for="(action, idx) in quickActions" :key="action.path">
          <el-button
            :type="idx === 0 ? 'primary' : 'default'"
            :icon="action.icon"
            @click="router.push(action.path)"
          >
            {{ action.label }}
            <el-badge v-if="action.badge && unreadCount > 0" :value="unreadCount" class="badge" />
          </el-button>
        </template>
      </div>
    </div>

    <div class="page-container" style="margin-top: 16px">
      <h3 class="section-title">
        内容到期提醒
        <el-badge v-if="expiryTotal > 0" :value="expiryTotal" class="badge" />
      </h3>
      <el-empty v-if="expiryTotal === 0" description="暂无到期内容" :image-size="80" />
      <div v-else class="expiry-list">
        <!-- 已过期 -->
        <div v-if="expiryData.expired.length" class="expiry-group">
          <div class="expiry-group-header">
            <el-tag type="danger" size="small">已过期</el-tag>
            <span class="expiry-group-count">{{ expiryData.expired.length }} 篇</span>
          </div>
          <div v-for="item in expiryData.expired" :key="item.id" class="expiry-item expired">
            <div class="expiry-item-info">
              <span class="expiry-item-title">{{ item.title }}</span>
              <span class="expiry-item-meta">
                {{ item.columnName }} · 时效: {{ item.timeTag }} · 发布: {{ item.publishedAt }}
              </span>
            </div>
            <div class="expiry-item-actions">
              <span class="expiry-days expired-text">已过期 {{ Math.abs(item.daysRemaining) }} 天</span>
              <el-button type="warning" size="small" @click="handleArchive(item)">归档</el-button>
            </div>
          </div>
        </div>

        <!-- 即将到期 -->
        <div v-if="expiryData.expiring.length" class="expiry-group">
          <div class="expiry-group-header">
            <el-tag type="warning" size="small">即将到期</el-tag>
            <span class="expiry-group-count">{{ expiryData.expiring.length }} 篇</span>
          </div>
          <div v-for="item in expiryData.expiring" :key="item.id" class="expiry-item expiring">
            <div class="expiry-item-info">
              <span class="expiry-item-title">{{ item.title }}</span>
              <span class="expiry-item-meta">
                {{ item.columnName }} · 时效: {{ item.timeTag }} · 发布: {{ item.publishedAt }}
              </span>
            </div>
            <div class="expiry-item-actions">
              <span class="expiry-days expiring-text">剩余 {{ item.daysRemaining }} 天</span>
              <el-button size="small" @click="handleArchive(item)">归档</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-container" style="margin-top: 16px">
      <h3 class="section-title">系统公告</h3>
      <el-empty v-if="announcements.length === 0" description="暂无公告" :image-size="80" />
      <div v-else class="announcement-list">
        <div v-for="item in announcements" :key="item.id" class="announcement-item">
          <el-tag size="small" type="danger">公告</el-tag>
          <span class="announcement-title">{{ item.title }}</span>
          <span class="announcement-time">{{ item.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
const router = useRouter()

import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAdminUserStore } from '~/stores/adminUser'
import { fetchDashboardStats, fetchUnreadCount } from '~/composables/adminApi'

const adminUserStore = useAdminUserStore()

const stats = ref<Record<string, number>>({})
const unreadCount = ref(0)

// 内容到期检查
interface ExpiryItem {
  id: number
  title: string
  columnName: string
  timeTag: string
  publishedAt: string
  daysRemaining: number
  status: string
}
const expiryData = ref<{ expired: ExpiryItem[]; expiring: ExpiryItem[] }>({ expired: [], expiring: [] })
const expiryTotal = computed(() => expiryData.value.expired.length + expiryData.value.expiring.length)

// 归档操作
async function handleArchive(item: ExpiryItem) {
  try {
    await ElMessageBox.confirm(
      `确认将「${item.title}」归档?归档后文章将保留记录但不再公开展示。`,
      '内容归档确认',
      { confirmButtonText: '确认归档', cancelButtonText: '取消', type: 'warning' },
    )
    // TODO: 后端就绪后调用 /api/admin/articles/:id/archive
    // Mock: 从列表中移除
    expiryData.value.expired = expiryData.value.expired.filter((a) => a.id !== item.id)
    expiryData.value.expiring = expiryData.value.expiring.filter((a) => a.id !== item.id)
    ElMessage.success(`已归档: ${item.title}`)
  } catch {
    // 用户取消
  }
}

const statCards = computed(() => {
  const role = adminUserStore.role
  const s = stats.value
  if (role === 'editor') {
    return [
      { label: '待审稿件', value: s.pending || 0, color: '#e6a23c' },
      { label: '驳回稿件', value: s.rejected || 0, color: '#f56c6c' },
      { label: '未读消息', value: unreadCount.value, color: '#409eff' },
      { label: '本月投稿', value: s.monthSubmissions || 0, color: '#67c23a' },
    ]
  }
  if (role === 'reviewer') {
    return [
      { label: '待我审核', value: s.pending || 0, color: '#e6a23c' },
      { label: '已发布稿件', value: s.published || 0, color: '#67c23a' },
      { label: '未读消息', value: unreadCount.value, color: '#409eff' },
      { label: '驳回统计', value: s.rejected || 0, color: '#f56c6c' },
    ]
  }
  if (role === 'column_admin') {
    return [
      { label: '待终审', value: s.finalPending || 0, color: '#e6a23c' },
      { label: '待初审', value: s.pending || 0, color: '#909399' },
      { label: '已发布稿件', value: s.published || 0, color: '#67c23a' },
      { label: '未读消息', value: unreadCount.value, color: '#409eff' },
    ]
  }
  return [
    { label: '管理员总数', value: s.adminCount || 0, color: '#409eff' },
    { label: '系统告警', value: s.alerts || 0, color: '#f56c6c' },
    { label: '全站稿件', value: s.totalArticles || 0, color: '#67c23a' },
    { label: '未办结审核', value: s.unresolved || 0, color: '#e6a23c' },
  ]
})

// 各角色快捷操作（按角色差异化配置）
interface QuickAction {
  label: string
  icon: string
  path: string
  badge?: boolean
}
const quickActions = computed<QuickAction[]>(() => {
  const role = adminUserStore.role
  // 通用：消息中心（带未读徽标）
  const messageAction: QuickAction = { label: '消息中心', icon: 'Bell', path: '/admin/message/unread', badge: true }

  if (role === 'editor') {
    // 编辑：聚焦稿件创作
    return [
      { label: '新建稿件', icon: 'Plus', path: '/admin/article/create' },
      { label: '我的草稿', icon: 'Document', path: '/admin/article/draft' },
      { label: '已提交待审', icon: 'Clock', path: '/admin/article/pending' },
      { label: '被驳回稿件', icon: 'WarningFilled', path: '/admin/article/rejected' },
      messageAction,
    ]
  }
  if (role === 'reviewer') {
    // 审核员：聚焦审核工作流
    return [
      { label: '待我审核', icon: 'Check', path: '/admin/review/pending' },
      { label: '新建稿件', icon: 'Plus', path: '/admin/article/create' },
      { label: '我的草稿', icon: 'Document', path: '/admin/article/draft' },
      { label: '已发布稿件', icon: 'CircleCheck', path: '/admin/review/published' },
      { label: '数据统计', icon: 'DataAnalysis', path: '/admin/statistics/column' },
      messageAction,
    ]
  }
  if (role === 'column_admin') {
    // 栏目管理员：聚焦栏目运营
    return [
      { label: '待我终审', icon: 'Check', path: '/admin/column/final-review' },
      { label: '全栏目稿件', icon: 'Search', path: '/admin/column/all-articles' },
      { label: '栏目管理', icon: 'FolderOpened', path: '/admin/system/column/tree' },
      { label: '推荐位配置', icon: 'Star', path: '/admin/column/recommend' },
      { label: '栏目统计', icon: 'DataAnalysis', path: '/admin/statistics/column' },
      messageAction,
    ]
  }
  // 系统管理员：聚焦系统管理（不显示新建稿件等业务操作）
  return [
    { label: '账号管理', icon: 'UserFilled', path: '/admin/system/account/list' },
    { label: '栏目全局管理', icon: 'FolderOpened', path: '/admin/system/column/tree' },
    { label: '发布全局公告', icon: 'BellFilled', path: '/admin/system/message/publish' },
    { label: '全站操作日志', icon: 'Tickets', path: '/admin/system/audit/all' },
    { label: '全站统计', icon: 'DataAnalysis', path: '/admin/system/statistics/overview' },
    { label: '系统配置', icon: 'Setting', path: '/admin/system/config/sso' },
    messageAction,
  ]
})

const announcements = [
  { id: 1, title: '系统将于本周六凌晨2:00-6:00进行维护升级', time: '2026-07-22' },
  { id: 2, title: '关于规范稿件提交流程的通知', time: '2026-07-18' },
]

async function loadDashboard() {
  try {
    const [statsRes, unreadRes, expiryRes] = await Promise.allSettled([
      fetchDashboardStats(),
      fetchUnreadCount(),
      $fetch('/api/admin/expiry-check'),
    ])
    if (statsRes.status === 'fulfilled' && statsRes.value?.code === 0) {
      stats.value = statsRes.value.data || {}
    }
    if (unreadRes.status === 'fulfilled' && unreadRes.value?.code === 0) {
      unreadCount.value = unreadRes.value.data?.count || 0
    }
    if (expiryRes.status === 'fulfilled' && expiryRes.value?.code === 0 && expiryRes.value?.data) {
      expiryData.value = {
        expired: expiryRes.value.data.expired || [],
        expiring: expiryRes.value.data.expiring || [],
      }
    }
  } catch {
    // keep default values
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style lang="scss" scoped>
.stat-row {
  margin-bottom: 0;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 1px solid #ebeef5;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  &__value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 8px;
  }

  &__label {
    font-size: 13px;
    color: #909399;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.badge {
  margin-left: 4px;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.announcement-title {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.announcement-time {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

// 到期提醒
.expiry-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.expiry-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.expiry-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.expiry-group-count {
  font-size: 13px;
  color: #909399;
}

.expiry-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  gap: 12px;

  &.expired {
    background: #fef0f0;
    border-color: #fde2e2;
  }

  &.expiring {
    background: #fdf6ec;
    border-color: #faecd8;
  }
}

.expiry-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.expiry-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expiry-item-meta {
  font-size: 12px;
  color: #909399;
}

.expiry-item-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.expiry-days {
  font-size: 13px;
  font-weight: 600;

  &.expired-text {
    color: #f56c6c;
  }

  &.expiring-text {
    color: #e6a23c;
  }
}
</style>