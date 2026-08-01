<script setup lang="ts">
// 信息公开目录管理（V2.0 §9.3.9 + 《高等学校信息公开办法》）
// 路由: /admin/system/disclosure/list
// 权限: 仅 system_admin 可访问（菜单已限制 + BFF 校验）
// 功能: 列表查询、筛选、创建、编辑、删除、发布/下线、批量操作
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh, Download, Upload } from '@element-plus/icons-vue'
import {
  fetchDisclosureList,
  fetchDisclosureDetail,
  createDisclosureItem,
  updateDisclosureItem,
  deleteDisclosureItem,
  publishDisclosureItem,
  offlineDisclosureItem,
  batchStatusDisclosure,
  type DisclosureListParams,
  type DisclosureItemBody,
} from '~/composables/adminApi'
import { fetchAdminColumnTree } from '~/composables/adminApi'

definePageMeta({ layout: 'admin' })

// ===== 常量 =====
const CATEGORY_OPTIONS = [
  { value: 'BASIC', label: '学校基本信息' },
  { value: 'REGULATION', label: '规章制度文件' },
  { value: 'PLAN', label: '发展规划与年度报告' },
  { value: 'FINANCE', label: '财务与收费信息' },
  { value: 'ADMISSION', label: '招生与就业信息' },
  { value: 'PERSONNEL', label: '人事与师资信息' },
  { value: 'TEACHING', label: '教学管理信息' },
  { value: 'STUDENT', label: '学生管理与服务' },
  { value: 'OTHER', label: '其他应公开事项' },
]

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: '公开（匿名可见）', type: 'success' },
  { value: 'CAMPUS', label: '校园可见（SSO师生）', type: 'warning' },
  { value: 'INTERNAL', label: '内部可见（仅管理员）', type: 'info' },
]

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: '草稿', type: 'info' },
  { value: 'PUBLISHED', label: '已发布', type: 'success' },
  { value: 'OFFLINE', label: '已下线', type: 'danger' },
]

const categoryLabel = (code: string) => CATEGORY_OPTIONS.find(o => o.value === code)?.label ?? code
const visibilityLabel = (code: string) => VISIBILITY_OPTIONS.find(o => o.value === code)?.label ?? code
const visibilityType = (code: string) => (VISIBILITY_OPTIONS.find(o => o.value === code)?.type as any) ?? 'info'
const statusLabel = (code: string) => STATUS_OPTIONS.find(o => o.value === code)?.label ?? code
const statusType = (code: string) => (STATUS_OPTIONS.find(o => o.value === code)?.type as any) ?? 'info'

// ===== 列表数据 =====
interface DisclosureItem {
  id: number
  title: string
  slug: string
  category: string
  legalBasis?: string
  disclosureDeadline?: string
  disclosureMethod?: string
  summary?: string
  linkUrl?: string
  columnId?: number | null
  columnName?: string
  visibility: 'PUBLIC' | 'CAMPUS' | 'INTERNAL'
  status: 'DRAFT' | 'PUBLISHED' | 'OFFLINE'
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const loading = ref(false)
const tableData = ref<DisclosureItem[]>([])
const total = ref(0)

const queryParams = reactive<DisclosureListParams>({
  page: 1,
  pageSize: 20,
  category: undefined,
  visibility: undefined,
  status: undefined,
  keyword: '',
})

async function loadList() {
  loading.value = true
  try {
    const res = await fetchDisclosureList(queryParams)
    const data = res.data || res
    tableData.value = data.list ?? []
    total.value = data.total ?? 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载列表失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.page = 1
  loadList()
}

function handleReset() {
  queryParams.category = undefined
  queryParams.visibility = undefined
  queryParams.status = undefined
  queryParams.keyword = ''
  queryParams.page = 1
  loadList()
}

function handlePageChange(p: number) {
  queryParams.page = p
  loadList()
}

function handleSizeChange(s: number) {
  queryParams.pageSize = s
  queryParams.page = 1
  loadList()
}

// ===== 批量操作 =====
const selectedRows = ref<DisclosureItem[]>([])
function handleSelectionChange(rows: DisclosureItem[]) {
  selectedRows.value = rows
}

async function handleBatchPublish() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先勾选要发布的条目')
    return
  }
  const ids = selectedRows.value.map(r => r.id)
  try {
    await ElMessageBox.confirm(`确认批量发布选中的 ${ids.length} 个条目？`, '批量发布', { type: 'warning' })
    await batchStatusDisclosure(ids, 'PUBLISHED')
    ElMessage.success(`已批量发布 ${ids.length} 个条目`)
    loadList()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message)
  }
}

async function handleBatchOffline() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先勾选要下线的条目')
    return
  }
  const ids = selectedRows.value.map(r => r.id)
  try {
    await ElMessageBox.confirm(`确认批量下线选中的 ${ids.length} 个条目？`, '批量下线', { type: 'warning' })
    await batchStatusDisclosure(ids, 'OFFLINE')
    ElMessage.success(`已批量下线 ${ids.length} 个条目`)
    loadList()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message)
  }
}

// ===== 单条操作 =====
async function handlePublish(row: DisclosureItem) {
  try {
    await publishDisclosureItem(row.id)
    ElMessage.success('发布成功')
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '发布失败')
  }
}

async function handleOffline(row: DisclosureItem) {
  try {
    await offlineDisclosureItem(row.id)
    ElMessage.success('已下线')
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '下线失败')
  }
}

async function handleDelete(row: DisclosureItem) {
  try {
    await ElMessageBox.confirm(`确认删除条目「${row.title}」？此操作为逻辑删除，可联系系统管理员恢复。`, '删除确认', {
      type: 'warning',
    })
    await deleteDisclosureItem(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message)
  }
}

// ===== 新增/编辑对话框 =====
const dialogVisible = ref(false)
const dialogTitle = ref('新增公开条目')
const formRef = ref<FormInstance>()
const form = reactive<DisclosureItemBody & { id?: number }>({
  id: undefined,
  title: '',
  slug: '',
  category: 'BASIC',
  legalBasis: '',
  disclosureDeadline: '',
  disclosureMethod: '网站公开',
  content: '',
  summary: '',
  linkUrl: '',
  columnId: null,
  visibility: 'PUBLIC',
  sortOrder: 0,
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入公开事项名称', trigger: 'blur' }],
  slug: [
    { required: true, message: '请输入路由别名', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9-]{1,63}$/,
      message: '仅小写字母/数字/中划线，2-64 字符，须以字母开头',
      trigger: 'blur',
    },
  ],
  category: [{ required: true, message: '请选择公开类别', trigger: 'change' }],
  visibility: [{ required: true, message: '请选择可见性', trigger: 'change' }],
}

// 栏目树数据（用于关联栏目选择）
const columnTree = ref<any[]>([])
async function loadColumnTree() {
  try {
    const res = await fetchAdminColumnTree()
    columnTree.value = res.data || []
  } catch {
    columnTree.value = []
  }
}

const treeSelectProps = { label: 'columnName', value: 'columnId', children: 'children' }

function resetForm() {
  form.id = undefined
  form.title = ''
  form.slug = ''
  form.category = 'BASIC'
  form.legalBasis = ''
  form.disclosureDeadline = ''
  form.disclosureMethod = '网站公开'
  form.content = ''
  form.summary = ''
  form.linkUrl = ''
  form.columnId = null
  form.visibility = 'PUBLIC'
  form.sortOrder = 0
}

function handleAdd() {
  resetForm()
  dialogTitle.value = '新增公开条目'
  form.sortOrder = total.value + 1
  dialogVisible.value = true
  loadColumnTree()
}

async function handleEdit(row: DisclosureItem) {
  resetForm()
  dialogTitle.value = '编辑公开条目'
  try {
    const res = await fetchDisclosureDetail(row.id)
    const d = res.data || row
    form.id = d.id
    form.title = d.title
    form.slug = d.slug
    form.category = d.category
    form.legalBasis = d.legalBasis || ''
    form.disclosureDeadline = d.disclosureDeadline || ''
    form.disclosureMethod = d.disclosureMethod || '网站公开'
    form.content = d.content || ''
    form.summary = d.summary || ''
    form.linkUrl = d.linkUrl || ''
    form.columnId = d.columnId ?? null
    form.visibility = d.visibility
    form.sortOrder = d.sortOrder ?? 0
    dialogVisible.value = true
    loadColumnTree()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载详情失败')
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const body: DisclosureItemBody = {
        title: form.title,
        slug: form.slug,
        category: form.category,
        legalBasis: form.legalBasis || undefined,
        disclosureDeadline: form.disclosureDeadline || undefined,
        disclosureMethod: form.disclosureMethod || undefined,
        content: form.content || undefined,
        summary: form.summary || undefined,
        linkUrl: form.linkUrl || undefined,
        columnId: form.columnId ?? undefined,
        visibility: form.visibility,
        sortOrder: form.sortOrder,
      }
      if (form.id) {
        await updateDisclosureItem(form.id, body)
        ElMessage.success('更新成功')
      } else {
        await createDisclosureItem(body)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadList()
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    }
  })
}

// ===== 初始化 =====
onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">信息公开目录管理</h2>
        <p class="page-desc">
          依据《高等学校信息公开办法》维护公开事项，包含公开依据、公开时限、公开方式等合规字段。
          仅系统管理员可操作。
        </p>
      </div>
    </div>

    <!-- 查询筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="queryParams.keyword"
        placeholder="搜索标题/slug"
        clearable
        style="width: 220px"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="queryParams.category" placeholder="公开类别" clearable style="width: 180px">
        <el-option v-for="opt in CATEGORY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select v-model="queryParams.visibility" placeholder="可见性" clearable style="width: 170px">
        <el-option v-for="opt in VISIBILITY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 140px">
        <el-option v-for="opt in STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      <div class="filter-spacer" />
      <el-button type="success" :icon="Plus" @click="handleAdd">新增条目</el-button>
      <el-button type="warning" :disabled="!selectedRows.length" @click="handleBatchPublish">批量发布</el-button>
      <el-button type="info" :disabled="!selectedRows.length" @click="handleBatchOffline">批量下线</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      border
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="42" />
      <el-table-column label="#" type="index" width="50" />
      <el-table-column prop="title" label="公开事项" min-width="200" show-overflow-tooltip />
      <el-table-column prop="slug" label="Slug" width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <code class="slug-code">{{ row.slug }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="类别" width="140">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ categoryLabel(row.category) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="visibility" label="可见性" width="140">
        <template #default="{ row }">
          <el-tag size="small" :type="visibilityType(row.visibility)">{{ visibilityLabel(row.visibility) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="70" />
      <el-table-column prop="columnName" label="关联栏目" width="140" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.columnName">{{ row.columnName }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="160" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.status !== 'PUBLISHED'"
            link
            type="success"
            size="small"
            @click="handlePublish(row)"
          >
            发布
          </el-button>
          <el-button
            v-if="row.status === 'PUBLISHED'"
            link
            type="warning"
            size="small"
            @click="handleOffline(row)"
          >
            下线
          </el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="780px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="公开事项" prop="title">
          <el-input v-model="form.title" placeholder="如：学校年度财务预算决算" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input
            v-model="form.slug"
            placeholder="如：finance-budget-2024"
            maxlength="64"
            show-word-limit
          />
          <div class="form-tip">前台 URL 使用，如 /disclosure/{{ form.slug || 'example-slug' }}</div>
        </el-form-item>
        <el-form-item label="公开类别" prop="category">
          <el-select v-model="form.category" placeholder="请选择" style="width: 100%">
            <el-option v-for="opt in CATEGORY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="公开依据" prop="legalBasis">
          <el-input
            v-model="form.legalBasis"
            placeholder="如：《高等学校信息公开办法》第X条"
            maxlength="200"
          />
          <div class="form-tip">合规字段：依据的法规/政策条款</div>
        </el-form-item>
        <el-form-item label="公开时限" prop="disclosureDeadline">
          <el-input
            v-model="form.disclosureDeadline"
            placeholder="如：自信息形成或变更之日起20个工作日内"
            maxlength="100"
          />
          <div class="form-tip">合规字段：公开期限要求</div>
        </el-form-item>
        <el-form-item label="公开方式" prop="disclosureMethod">
          <el-input v-model="form.disclosureMethod" placeholder="如：网站公开 / 公告栏 / 书面申请" maxlength="100" />
          <div class="form-tip">合规字段：公开渠道</div>
        </el-form-item>
        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="2"
            placeholder="简要描述该公开事项"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="详细内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="公开事项的完整说明（仅 SSO 师生可见完整内容，匿名访客见摘要）"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="外部链接" prop="linkUrl">
          <el-input v-model="form.linkUrl" placeholder="如该事项跳转外部页面，填写完整 URL" maxlength="500" />
        </el-form-item>
        <el-form-item label="关联栏目" prop="columnId">
          <el-tree-select
            v-model="form.columnId"
            :data="columnTree"
            :props="treeSelectProps"
            check-strictly
            clearable
            placeholder="可选，关联到全站栏目（数据联动）"
            style="width: 100%"
          />
          <div class="form-tip">与"全站栏目管理"模块数据联动，可关联至某个栏目</div>
        </el-form-item>
        <el-form-item label="可见性" prop="visibility">
          <el-radio-group v-model="form.visibility">
            <el-radio v-for="opt in VISIBILITY_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
          <div class="form-tip">PUBLIC=匿名可见；CAMPUS=仅SSO师生可见完整内容；INTERNAL=仅管理员后台可见</div>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
          <div class="form-tip">数字越小越靠前</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  padding: 16px;
}

.page-header {
  margin-bottom: 16px;

  .page-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  .page-desc {
    font-size: 13px;
    color: #606266;
    margin: 0;
    line-height: 1.6;
  }
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .filter-spacer {
    flex: 1;
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.slug-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
}

.text-muted {
  color: #c0c4cc;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}
</style>
