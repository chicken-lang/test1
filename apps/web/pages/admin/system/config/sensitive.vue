<script setup lang="ts">
// 敏感词管理（V2.0 系统配置中心）
// 路由: /admin/system/config/sensitive
// 权限: sensitive_word.view / sensitive_word.create / sensitive_word.update / sensitive_word.delete
// 对接后端: /api/admin/sensitive-words
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh, Upload as UploadIcon } from '@element-plus/icons-vue'
import {
  fetchSensitiveWordList,
  createSensitiveWord,
  updateSensitiveWord,
  deleteSensitiveWord,
  toggleSensitiveWord,
  batchImportSensitiveWords,
  type SensitiveWordItem,
  type SensitiveWordLevel,
  type SensitiveWordListParams,
  type CreateSensitiveWordBody,
} from '~/composables/adminApi'

definePageMeta({ layout: 'admin' })

// ===== 常量 =====
const LEVEL_OPTIONS = [
  { value: 'LOW', label: '普通', type: 'warning' },
  { value: 'HIGH', label: '高危', type: 'danger' },
] as const

const CATEGORY_OPTIONS = [
  { value: 'political', label: '政治类' },
  { value: 'pornographic', label: '色情类' },
  { value: 'violent', label: '暴力类' },
  { value: 'advertising', label: '广告类' },
  { value: 'other', label: '其他' },
]

const levelLabel = (code: string) => LEVEL_OPTIONS.find(o => o.value === code)?.label ?? code
const levelType = (code: string) => (LEVEL_OPTIONS.find(o => o.value === code)?.type as any) ?? 'info'
const categoryLabel = (code: string) => CATEGORY_OPTIONS.find(o => o.value === code)?.label ?? code

// ===== 列表数据 =====
const loading = ref(false)
const tableData = ref<SensitiveWordItem[]>([])
const total = ref(0)

const queryParams = reactive<SensitiveWordListParams>({
  page: 1,
  pageSize: 20,
  level: undefined,
  category: undefined,
  keyword: '',
})

async function loadList() {
  loading.value = true
  try {
    const res = await fetchSensitiveWordList(queryParams)
    const data = res.data || res
    // 后端返回 { items, total, page, pageSize }
    tableData.value = data.items ?? []
    total.value = data.total ?? 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载敏感词列表失败')
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
  queryParams.level = undefined
  queryParams.category = undefined
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

// ===== 启停切换 =====
const togglingIds = ref<Set<number>>(new Set())
async function handleToggle(row: SensitiveWordItem) {
  if (togglingIds.value.has(row.id)) return
  togglingIds.value.add(row.id)
  try {
    await toggleSensitiveWord(row.id)
    ElMessage.success(`敏感词已${row.isActive ? '禁用' : '启用'}`)
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '切换状态失败')
  } finally {
    togglingIds.value.delete(row.id)
  }
}

// ===== 新增/编辑对话框 =====
const formDialogVisible = ref(false)
const formDialogTitle = ref('新增敏感词')
const formRef = ref<FormInstance>()
const submitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive<CreateSensitiveWordBody>({
  word: '',
  level: 'LOW',
  category: 'other',
  replacement: '',
})

const formRules: FormRules = {
  word: [
    { required: true, message: '请输入敏感词', trigger: 'blur' },
    { max: 100, message: '敏感词长度不能超过 100 字符', trigger: 'blur' },
  ],
  level: [{ required: true, message: '请选择级别', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  replacement: [{ max: 100, message: '替换文本长度不能超过 100 字符', trigger: 'blur' }],
}

function resetForm() {
  form.word = ''
  form.level = 'LOW'
  form.category = 'other'
  form.replacement = ''
  editingId.value = null
  formRef.value?.clearValidate()
}

function openCreate() {
  formDialogTitle.value = '新增敏感词'
  resetForm()
  formDialogVisible.value = true
}

function openEdit(row: SensitiveWordItem) {
  formDialogTitle.value = '编辑敏感词'
  resetForm()
  form.word = row.word
  form.level = row.level
  form.category = row.category
  form.replacement = row.replacement
  editingId.value = row.id
  formDialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const body: CreateSensitiveWordBody = {
        word: form.word.trim(),
        level: form.level,
        category: form.category,
        replacement: form.replacement?.trim() || undefined,
      }
      if (editingId.value !== null) {
        await updateSensitiveWord(editingId.value, body)
        ElMessage.success('更新成功')
      } else {
        await createSensitiveWord(body)
        ElMessage.success('新增成功')
      }
      formDialogVisible.value = false
      loadList()
    } catch (e: any) {
      ElMessage.error(e?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// ===== 删除 =====
async function handleDelete(row: SensitiveWordItem) {
  try {
    await ElMessageBox.confirm(`确定要删除敏感词"${row.word}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteSensitiveWord(row.id)
    ElMessage.success('删除成功')
    // 当前页删空时回退一页
    if (tableData.value.length === 1 && queryParams.page! > 1) {
      queryParams.page = queryParams.page! - 1
    }
    loadList()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message)
  }
}

// ===== 批量导入 =====
const importDialogVisible = ref(false)
const importText = ref('')
const importLevel = ref<SensitiveWordLevel>('LOW')
const importCategory = ref('other')
const importing = ref(false)

function openImport() {
  importText.value = ''
  importLevel.value = 'LOW'
  importCategory.value = 'other'
  importDialogVisible.value = true
}

async function handleImport() {
  const lines = importText.value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
  if (!lines.length) {
    ElMessage.warning('请输入敏感词，每行一个')
    return
  }
  if (lines.length > 1000) {
    ElMessage.error('单次批量导入上限为 1000 条')
    return
  }
  importing.value = true
  try {
    const words = lines.map(word => ({
      word,
      level: importLevel.value,
      category: importCategory.value,
    }))
    const res = await batchImportSensitiveWords({ words })
    const data = res.data || res
    ElMessage.success(`导入完成：成功 ${data.imported ?? 0} 条，跳过 ${data.skipped ?? 0} 条`)
    importDialogVisible.value = false
    queryParams.page = 1
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '批量导入失败')
  } finally {
    importing.value = false
  }
}

const importWordCount = computed(() => {
  return importText.value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean).length
})

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <el-form :inline="true" class="filter-bar">
      <el-form-item label="级别">
        <el-select
          v-model="queryParams.level"
          placeholder="全部级别"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="opt in LEVEL_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="分类">
        <el-select
          v-model="queryParams.category"
          placeholder="全部分类"
          clearable
          style="width: 140px"
        >
          <el-option
            v-for="opt in CATEGORY_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索敏感词"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreate">新增敏感词</el-button>
      <el-button :icon="UploadIcon" @click="openImport">批量导入</el-button>
    </div>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="tableData" border stripe style="width: 100%">
      <el-table-column prop="word" label="敏感词" min-width="180" show-overflow-tooltip />
      <el-table-column label="级别" width="100">
        <template #default="{ row }">
          <el-tag :type="levelType(row.level)">
            {{ levelLabel(row.level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="120">
        <template #default="{ row }">
          {{ categoryLabel(row.category) }}
        </template>
      </el-table-column>
      <el-table-column prop="replacement" label="替换文本" width="120" show-overflow-tooltip />
      <el-table-column label="启用" width="90">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isActive"
            :loading="togglingIds.has(row.id)"
            @change="handleToggle(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="添加时间" width="180" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="queryParams.page"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      background
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
      style="margin-top: 16px; justify-content: flex-end"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="formDialogVisible" :title="formDialogTitle" width="480px">
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="90px"
        @submit.prevent
      >
        <el-form-item label="敏感词" prop="word">
          <el-input v-model="form.word" placeholder="请输入敏感词" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="级别" prop="level">
          <el-select v-model="form.level" placeholder="请选择级别" style="width: 100%">
            <el-option
              v-for="opt in LEVEL_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="opt in CATEGORY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="替换文本" prop="replacement">
          <el-input
            v-model="form.replacement"
            placeholder="留空默认为 ***"
            maxlength="100"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入敏感词" width="520px">
      <el-form label-width="90px">
        <el-form-item label="统一级别">
          <el-select v-model="importLevel" style="width: 200px">
            <el-option
              v-for="opt in LEVEL_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="统一分类">
          <el-select v-model="importCategory" style="width: 200px">
            <el-option
              v-for="opt in CATEGORY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="敏感词列表">
          <el-input
            v-model="importText"
            type="textarea"
            :rows="10"
            placeholder="每行一个敏感词，单次上限 1000 条"
          />
        </el-form-item>
        <el-form-item>
          <span style="color: #909399; font-size: 12px">
            共 {{ importWordCount }} 条（已存在的敏感词将自动跳过）
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.filter-bar {
  margin-bottom: 16px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
