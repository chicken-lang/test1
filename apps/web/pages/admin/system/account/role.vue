<template>
  <div class="page-container">
    <h3 class="section-title">角色权限说明</h3>
    <p class="section-tip">系统四种角色及其预定义权限如下，权限由系统配置，仅供查看。</p>

    <div v-loading="loading">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" v-for="role in roleList" :key="role.key">
          <div class="role-card">
            <div class="role-card__header">
              <h4>{{ role.label }}</h4>
              <p class="role-card__desc">{{ role.description }}</p>
            </div>

            <div class="role-card__body">
              <div v-for="group in permissionGroups" :key="group.name" class="perm-group">
                <div class="perm-group__title">{{ group.label }}</div>
                <div class="perm-tags">
                  <el-tag
                    v-for="perm in group.items.filter(item => role.permissions.includes(item.value))"
                    :key="perm.value"
                    type="info"
                    size="small"
                    class="perm-tag"
                  >
                    {{ perm.label }}
                  </el-tag>
                  <span
                    v-if="group.items.filter(item => role.permissions.includes(item.value)).length === 0"
                    class="perm-empty"
                  >—</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { RoleType } from '~/utils/adminTypes'
import { AdminRoleLabels } from '~/utils/adminTypes'
import { fetchAllPermissions } from '~/composables/adminApi'

// ========== 权限定义（与后端 Permission 枚举一一对应，仅用于展示权限名称） ==========

interface PermItem { value: string; label: string }
interface PermGroup { name: string; label: string; items: PermItem[] }

const permissionGroups: PermGroup[] = [
  {
    name: 'article',
    label: '稿件管理',
    items: [
      { value: 'article.create', label: '创建稿件' },
      { value: 'article.draft', label: '草稿管理' },
      { value: 'article.pending', label: '待审稿件' },
      { value: 'article.rejected', label: '被驳回稿件' },
      { value: 'article.edit_own', label: '编辑自有稿件' },
      { value: 'article.delete_draft', label: '删除草稿' },
      { value: 'article.readonly', label: '只读检索稿件' },
    ],
  },
  {
    name: 'review',
    label: '审核功能',
    items: [
      { value: 'article.review', label: '初审' },
      { value: 'article.review_publish', label: '审核并发布' },
      { value: 'article.review_to_final', label: '审核转终审' },
      { value: 'article.reject', label: '驳回稿件' },
      { value: 'article.published_view', label: '查看已发布' },
      { value: 'article.withdraw', label: '撤回稿件' },
      { value: 'article.top', label: '置顶稿件' },
    ],
  },
  {
    name: 'final',
    label: '终审功能',
    items: [
      { value: 'article.final_review', label: '终审' },
      { value: 'article.final_publish', label: '终审发布' },
      { value: 'article.final_reject', label: '终审驳回' },
      { value: 'article.all_search', label: '全栏目检索' },
    ],
  },
  {
    name: 'column',
    label: '栏目管理',
    items: [
      { value: 'column.manage', label: '增删改栏目' },
      { value: 'column.recommend', label: '首页推荐位' },
      { value: 'column.tags', label: '栏目标签' },
    ],
  },
  {
    name: 'message',
    label: '消息管理',
    items: [
      { value: 'message.view', label: '查看消息' },
      { value: 'message.archive', label: '归档消息' },
      { value: 'message.publish', label: '发布公告' },
      { value: 'message.view_all', label: '查看全站消息' },
    ],
  },
  {
    name: 'statistics',
    label: '统计模块',
    items: [
      { value: 'statistics.view', label: '本栏目统计' },
      { value: 'statistics.export', label: '统计导出' },
      { value: 'statistics.view_all', label: '全站统计' },
    ],
  },
  {
    name: 'audit',
    label: '审计日志',
    items: [
      { value: 'audit.view_own', label: '个人日志' },
      { value: 'audit.view_column', label: '本栏目日志' },
      { value: 'audit.view_all', label: '全站日志' },
      { value: 'audit.export', label: '日志导出' },
      { value: 'audit.archive', label: '日志归档' },
      { value: 'audit.hash_verify', label: '完整性校验' },
    ],
  },
  {
    name: 'admin',
    label: '账号管理',
    items: [
      { value: 'admin.manage', label: '账号增删改' },
      { value: 'admin.role_config', label: '角色权限配置' },
      { value: 'admin.bind_column', label: '栏目权限分配' },
    ],
  },
  {
    name: 'system',
    label: '系统配置',
    items: [
      { value: 'system.sso_config', label: 'SSO 配置' },
      { value: 'system.sensitive', label: '敏感词管理' },
      { value: 'system.ratelimit', label: '限流配置' },
      { value: 'system.stats_filter', label: '统计筛选配置' },
      { value: 'system.tags_manage', label: '标签管理' },
    ],
  },
]

// ========== 状态 ==========

const loading = ref(false)

interface RoleConfig {
  key: RoleType
  label: string
  description: string
  permissions: string[]
}

const roleDescriptions: Record<RoleType, string> = {
  editor: '负责稿件的创建和编辑工作',
  reviewer: '负责稿件的审核工作',
  column_admin: '管理所辖栏目的全部业务',
  system_admin: '拥有系统全部管理权限',
}

const roleList = ref<RoleConfig[]>(
  (Object.keys(AdminRoleLabels) as RoleType[]).map((key) => ({
    key,
    label: AdminRoleLabels[key],
    description: roleDescriptions[key],
    permissions: [],
  })),
)

// ========== 数据加载 ==========

async function loadPermissions() {
  loading.value = true
  try {
    const res = await fetchAllPermissions()
    if (res.code === 0 && res.data) {
      // 后端返回数组: [{ role, roleName, permissions: string[], ... }]
      const permMap = new Map<string, string[]>()
      for (const item of res.data) {
        permMap.set(item.role, item.permissions || [])
      }
      // 将后端权限数据填充到各角色卡片
      for (const role of roleList.value) {
        role.permissions = permMap.get(role.key) || []
      }
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载权限配置失败')
  } finally {
    loading.value = false
  }
}

// ========== 初始化 ==========

onMounted(() => {
  loadPermissions()
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.section-tip {
  font-size: 13px;
  color: #909399;
  margin: 0 0 20px 0;
}

.role-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;

  &__header {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }
  }

  &__desc {
    font-size: 13px;
    color: #909399;
    margin: 0;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    max-height: 520px;
  }
}

.perm-group {
  margin-bottom: 16px;

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px dashed #ebeef5;
  }
}

.perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.perm-tag {
  margin: 0;
}

.perm-empty {
  font-size: 13px;
  color: #c0c4cc;
}
</style>
