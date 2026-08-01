<template>
  <div class="page-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" icon="Plus" @click="handleAdd">新增账号</el-button>
    </div>

    <!-- 搜索区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="账号名">
        <el-input v-model="searchForm.username" placeholder="请输入账号名" clearable style="width: 160px" @keyup.enter="handleSearch" @clear="handleSearch" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="searchForm.role" placeholder="请选择角色" clearable style="width: 160px" @change="handleSearch">
          <el-option
            v-for="(label, key) in AdminRoleLabels"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px" @change="handleSearch">
          <el-option label="正常" value="active" />
          <el-option label="冻结" value="frozen" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" :loading="loading" @click="handleSearch">搜索</el-button>
        <el-button icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="username" label="账号名" width="120" />
      <el-table-column prop="nickname" label="登录工号" width="120" />
      <el-table-column label="绑定角色" width="140">
        <template #default="{ row }">
          <el-tag>{{ AdminRoleLabels[row.role as RoleType] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="管辖栏目" min-width="200">
        <template #default="{ row }">
          <template v-if="row.columnNames && row.columnNames.length">
            <el-tag v-for="col in row.columnNames" :key="col" style="margin-right: 4px">
              {{ col }}
            </el-tag>
          </template>
          <span v-else style="color: #999">未分配</span>
        </template>
      </el-table-column>
      <el-table-column label="账号状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="电话号码" width="140">
        <template #default="{ row }">
          {{ row.phone || '—' }}
        </template>
      </el-table-column>
      <el-table-column prop="unionId" label="绑定union_id" width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              :type="row.status === 'frozen' ? 'success' : 'warning'"
              link
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'frozen' ? '解禁' : '冻结' }}
            </el-button>
            <el-button type="info" link size="small" @click="handleResetPassword(row)">
              重置密码
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              逻辑删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
      style="margin-top: 16px; justify-content: flex-end"
    />

    <!-- 新增/编辑账号对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑账号' : '新增账号'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="账号名" required>
          <el-input v-model="form.username" placeholder="请输入账号名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="昵称" required>
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="初始密码">
          <el-input v-model="form.password" type="password" placeholder="留空则默认 123456" show-password />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="(label, key) in AdminRoleLabels"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="管辖栏目">
          <el-tree-select
            v-model="form.columnIds"
            :data="columnTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            multiple
            check-strictly
            placeholder="请选择管辖栏目"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { RoleType } from '~/utils/adminTypes'
import { AdminRoleLabels } from '~/utils/adminTypes'
import {
  fetchAdminList,
  createAdmin,
  updateAdmin,
  updateAdminRole,
  toggleAdminFreeze,
  resetAdminPassword,
  deleteAdmin,
  fetchColumnTree,
} from '~/composables/adminApi'

// ========== 状态 ==========

const loading = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

// 搜索表单
const searchForm = reactive({
  username: '',
  role: null as RoleType | null,
  status: null as 'active' | 'frozen' | null,
})

// 表格数据
const tableData = ref<any[]>([])

// 栏目树 & ID→名称映射
const columnTree = ref<any[]>([])
const columnMap = new Map<number, string>()

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 对话框
const dialogVisible = ref(false)
const form = reactive({
  username: '',
  nickname: '',
  password: '',
  role: null as RoleType | null,
  columnIds: [] as number[],
})

// ========== 工具函数 ==========

/** 构建栏目 ID→名称 映射 */
function buildColumnMap(nodes: any[]) {
  columnMap.clear()
  function walk(list: any[]) {
    for (const n of list) {
      columnMap.set(n.id, n.name)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
}

/** 将 bindColumnIds 数组转为名称数组 */
function resolveColumnNames(ids: number[]): string[] {
  return (ids || []).map((id) => columnMap.get(id) || `未知(${id})`)
}

/** 状态标签 */
const getStatusType = (status: string): 'success' | 'warning' | 'danger' => {
  const typeMap: Record<string, 'success' | 'warning' | 'danger'> = {
    active: 'success',
    frozen: 'warning',
    deleted: 'danger',
  }
  return typeMap[status] || 'success'
}

const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    active: '正常',
    frozen: '冻结',
    deleted: '已删除',
  }
  return labelMap[status] || '未知'
}

// ========== 数据加载 ==========

/** 加载管理员列表 */
async function loadAdminList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.username) params.keyword = searchForm.username
    if (searchForm.role) params.role = searchForm.role
    if (searchForm.status) params.status = searchForm.status

    const res = await fetchAdminList(params)
    if (res.code === 0 && res.data) {
      tableData.value = (res.data.list || []).map((admin: any) => ({
        ...admin,
        columnNames: resolveColumnNames(admin.bindColumnIds || []),
      }))
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res?.message || '加载管理员列表失败')
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载管理员列表失败')
  } finally {
    loading.value = false
  }
}

/** 加载栏目树 */
async function loadColumnTree() {
  try {
    const res = await fetchColumnTree()
    if (res.code === 0 && res.data) {
      columnTree.value = res.data
      buildColumnMap(res.data)
    }
  } catch {
    // 栏目树加载失败不阻塞页面
  }
}

// ========== 搜索 / 分页 ==========

const handleSearch = () => {
  pagination.page = 1
  loadAdminList()
}

const handleReset = () => {
  searchForm.username = ''
  searchForm.role = null
  searchForm.status = null
  pagination.page = 1
  loadAdminList()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.page = 1
  loadAdminList()
}

const handlePageChange = (val: number) => {
  pagination.page = val
  loadAdminList()
}

// ========== 新增 / 编辑 ==========

const handleAdd = () => {
  isEdit.value = false
  editingId.value = null
  form.username = ''
  form.nickname = ''
  form.password = ''
  form.role = null
  form.columnIds = []
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editingId.value = row.id
  form.username = row.username
  form.nickname = row.nickname
  form.password = ''
  form.role = row.role
  form.columnIds = [...(row.bindColumnIds || [])]
  dialogVisible.value = true
}

const handleSubmit = async () => {
  // 基本校验
  if (!form.username || !form.nickname || !form.role) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submitLoading.value = true
  try {
    if (isEdit.value && editingId.value) {
      // 编辑模式: 更新基本信息
      await updateAdmin(editingId.value, {
        nickname: form.nickname,
      })
      // 如果角色或栏目变了，调用角色更新接口
      await updateAdminRole(editingId.value, {
        role: form.role!,
        bindColumnIds: form.columnIds,
      })
      ElMessage.success('编辑成功')
    } else {
      // 新增模式
      await createAdmin({
        username: form.username,
        password: form.password || '123456',
        nickname: form.nickname,
        role: form.role!,
        bindColumnIds: form.columnIds,
      })
      ElMessage.success(form.password ? '新增成功' : '新增成功，初始密码为 123456')
    }
    dialogVisible.value = false
    loadAdminList()
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// ========== 冻结 / 解冻 ==========

const handleToggleStatus = async (row: any) => {
  const isFrozen = row.status === 'frozen'
  const action = isFrozen ? '解禁' : '冻结'
  try {
    await ElMessageBox.confirm(`确定要${action}该账号吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return // 用户取消
  }

  try {
    await toggleAdminFreeze(row.id, !isFrozen)
    ElMessage.success(`${action}成功`)
    loadAdminList()
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || `${action}失败`)
  }
}

// ========== 重置密码 ==========

const handleResetPassword = async (row: any) => {
  let inputValue = ''
  try {
    const { value } = await ElMessageBox.prompt('请输入新密码（留空则重置为 123456）', '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '新密码',
      type: 'warning',
    })
    inputValue = value || ''
  } catch {
    return // 用户取消
  }

  try {
    await resetAdminPassword(row.id, { newPassword: inputValue || '123456' })
    ElMessage.success('密码已重置')
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '重置密码失败')
  }
}

// ========== 逻辑删除 ==========

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要逻辑删除该账号吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await deleteAdmin(row.id)
    ElMessage.success('删除成功')
    loadAdminList()
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '删除失败')
  }
}

// ========== 初始化 ==========

onMounted(() => {
  loadColumnTree()
  loadAdminList()
})
</script>

<style lang="scss" scoped>
.toolbar {
  margin-bottom: 16px;
}

.search-form {
  margin-bottom: 16px;
}
</style>
