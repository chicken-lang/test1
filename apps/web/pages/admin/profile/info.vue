<template>
  <div class="page-container">
    <h3 class="section-title">个人资料</h3>

    <el-descriptions :column="1" border class="profile-descriptions">
      <el-descriptions-item label="账号名称">
        {{ profile.username }}
      </el-descriptions-item>
      <el-descriptions-item label="角色">
        <el-tag type="primary" size="small">{{ profile.roleLabel }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="可管辖栏目">
        <div class="column-tags">
          <el-tag
            v-for="col in profile.columns"
            :key="col"
            type="success"
            size="small"
            class="column-tag"
          >
            {{ col }}
          </el-tag>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="工号(SSO)">
        {{ profile.unionId }}
      </el-descriptions-item>
      <el-descriptions-item label="电话号码">
        <div class="phone-field">
          <template v-if="!editingPhone">
            <span>{{ profile.phone || '未填写' }}</span>
            <el-button type="primary" link size="small" @click="startEditPhone">编辑</el-button>
          </template>
          <template v-else>
            <el-input
              v-model="phoneInput"
              placeholder="请输入11位手机号"
              size="small"
              maxlength="11"
              style="width: 200px"
              @keyup.enter="savePhone"
            />
            <el-button type="primary" size="small" :loading="savingPhone" @click="savePhone">保存</el-button>
            <el-button size="small" @click="cancelEditPhone">取消</el-button>
          </template>
        </div>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { computed, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '~/stores/cmsAuth'
import { useAdminUserStore } from '~/stores/adminUser'
import { AdminRole } from '~/utils/types'
import { fetchColumnTree, updateMyProfile } from '~/composables/adminApi'

const authStore = useAuthStore()
const adminUserStore = useAdminUserStore()

const columnTree = ref<any[]>([])

// 栏目 ID → 名称映射表
const columnNameMap = computed(() => {
  const map = new Map<number, string>()
  function walk(nodes: any[]) {
    for (const n of nodes) {
      map.set(n.id, n.name)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(columnTree.value)
  return map
})

async function loadColumnTree() {
  try {
    const res = await fetchColumnTree()
    if (res.code === 0 && res.data) {
      columnTree.value = res.data
    }
  } catch {
    // 使用默认映射
  }
}

onMounted(() => {
  loadColumnTree()
})

const DEFAULT_COLUMN_MAP: Record<number, string> = {
  1: '政策文件',
  2: '校园公告',
  3: '考试通知',
  4: '教学竞赛',
  5: '实训安排',
  6: '人才培养',
  7: '教学评估',
  8: '科研管理',
}

function getColumnName(id: number): string {
  const name = columnNameMap.value.get(id)
  if (name) return name
  return DEFAULT_COLUMN_MAP[id] || `栏目${id}`
}

const profile = computed(() => {
  const user = authStore.user
  const isSystemAdmin = user?.role === AdminRole.SYSTEM_ADMIN
  const bindIds = user?.bindColumnIds || []
  const columns = isSystemAdmin
    ? ['全部栏目']
    : bindIds.length > 0
      ? bindIds.map(id => getColumnName(id))
      : (user?.department ? [user.department] : [])
  return {
    username: user?.username || '—',
    roleLabel: adminUserStore.roleName,
    columns,
    unionId: user?.staffId || '—',
    phone: user?.phone || '',
  }
})

// ========== 电话号码编辑 ==========
const editingPhone = ref(false)
const phoneInput = ref('')
const savingPhone = ref(false)

function startEditPhone() {
  phoneInput.value = profile.value.phone || ''
  editingPhone.value = true
}

function cancelEditPhone() {
  editingPhone.value = false
  phoneInput.value = ''
}

async function savePhone() {
  if (!authStore.user) return
  // 校验手机号格式: 11 位数字, 以 1 开头
  const phone = (phoneInput.value || '').trim()
  console.log('[savePhone] phoneInput.value =', JSON.stringify(phoneInput.value), 'phone =', JSON.stringify(phone))
  console.log('[savePhone] authStore.user.id =', authStore.user.id, 'authStore.user =', JSON.stringify(authStore.user))
  if (!/^1\d{10}$/.test(phone)) {
    ElMessage.warning(`请输入正确的 11 位手机号（当前输入: ${phone || '空'}）`)
    return
  }
  savingPhone.value = true
  try {
    // 调用专属的个人资料更新接口,使用 $api 自动携带 Authorization 头
    const res = await updateMyProfile({ phone })
    console.log('[savePhone] updateProfile response =', JSON.stringify(res))
    // 更新本地 user 对象并持久化到 localStorage
    authStore.updateUserProfile({ phone })
    ElMessage.success('电话号码已保存')
    editingPhone.value = false
  } catch (err: any) {
    console.error('[savePhone] error =', err)
    ElMessage.error(err?.statusMessage || err?.message || '保存失败')
  } finally {
    savingPhone.value = false
  }
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.profile-descriptions {
  max-width: 600px;
}

.column-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.column-tag {
  margin-right: 0;
}

.phone-field {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
