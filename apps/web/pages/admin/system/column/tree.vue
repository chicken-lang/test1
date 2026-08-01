<template>
  <div class="page-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" icon="Plus" @click="handleAddTop">新增顶级栏目</el-button>
      <span class="toolbar-tip">
        共 {{ topLevelCount }} 个一级栏目 / {{ totalCount }} 个节点
        ｜ 使用"上移/下移"按钮调整同级排序
      </span>
    </div>

    <!-- 栏目树 -->
    <div class="tree-wrapper">
      <el-tree
        ref="treeRef"
        :data="treeData"
        node-key="columnId"
        :props="treeProps"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <div
            class="column-node"
            :class="{
              active: activeId === data.columnId,
              disabled: data.status === 'DISABLED',
            }"
            @click="setActive(data.columnId)"
          >
            <!-- 左侧：栏目信息 -->
            <div class="node-info">
              <span class="node-name">{{ data.columnName }}</span>
              <el-tag v-if="data.parentId === null" size="small" type="primary" effect="plain">一级</el-tag>
              <el-tag v-else size="small" type="warning" effect="plain">二级</el-tag>
              <el-tag v-if="data.linkUrl" size="small" type="info" effect="plain">链接</el-tag>
              <el-tag v-if="data.status === 'DISABLED'" size="small" type="danger" effect="dark">停用</el-tag>
              <code class="node-slug">{{ data.columnSlug }}</code>
              <span class="node-id">#{{ data.columnId }}</span>
              <el-tag
                v-if="data.responsibleBusiness"
                size="small"
                type="success"
                effect="plain"
              >
                {{ responsibleBusinessLabel(data.responsibleBusiness) }}
              </el-tag>
            </div>

            <!-- 右侧：操作区 -->
            <div class="node-actions" @click.stop>
              <el-button
                link
                size="small"
                :icon="ArrowUp"
                :disabled="isFirstNode(data)"
                :title="isFirstNode(data) ? '已是第一个' : '上移'"
                @click="handleMoveUp(data)"
              >
                上移
              </el-button>
              <el-button
                link
                size="small"
                :icon="ArrowDown"
                :disabled="isLastNode(data)"
                :title="isLastNode(data) ? '已是最后一个' : '下移'"
                @click="handleMoveDown(data)"
              >
                下移
              </el-button>
              <el-switch
                :model-value="data.status === 'ACTIVE'"
                active-text="启用"
                inactive-text="停用"
                inline-prompt
                size="small"
                @change="handleStatusChange(data)"
              />
              <el-button type="primary" link size="small" @click="handleEdit(data)">编辑</el-button>
              <el-button
                v-if="data.parentId === null"
                type="success"
                link
                size="small"
                @click="handleAddChild(data)"
              >
                新增子栏目
              </el-button>
              <el-button
                v-else
                type="info"
                link
                size="small"
                disabled
                title="二级栏目不支持添加子栏目（系统仅支持两级结构）"
              >
                不可添加子项
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(data)">删除</el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="580px">
      <el-form :model="form" label-width="110px" :rules="formRules" ref="formRef">
        <el-form-item label="栏目名称" prop="columnName">
          <el-input v-model="form.columnName" placeholder="请输入栏目名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="路由别名 slug" prop="columnSlug">
          <el-input
            v-model="form.columnSlug"
            placeholder="仅小写字母/数字/中划线，2-64 字符"
            maxlength="64"
            show-word-limit
          />
          <div class="form-tip">前台 URL 使用，如 /list/{{ form.columnSlug || 'example-slug' }}</div>
        </el-form-item>
        <el-form-item label="父级栏目">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            :props="treeSelectProps"
            check-strictly
            clearable
            placeholder="请选择父级栏目（留空为顶级）"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item v-if="form.parentId !== null && form.parentId !== undefined" label="责任业务" prop="responsibleBusiness">
          <el-select v-model="form.responsibleBusiness" placeholder="请选择责任业务" style="width: 100%" filterable>
            <el-option
              v-for="opt in responsibleBusinessOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <div class="form-tip">二级栏目必须绑定责任业务（V2.0 §5.4.2）</div>
        </el-form-item>
        <el-form-item label="外部链接">
          <el-input
            v-model="form.linkUrl"
            placeholder="可选，链接型栏目填写（如 https://jwxt.sziit.edu.cn）"
            maxlength="500"
          />
          <div class="form-tip">仅链接型栏目使用（如人才培养平台下的系统入口），留空则为普通文章栏目</div>
        </el-form-item>
        <el-form-item label="栏目描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选，栏目用途说明" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import {
  fetchAdminColumnTree,
  createColumn,
  updateColumn,
  deleteColumn,
  enableColumn,
  disableColumn,
  sortColumns,
} from '~/composables/adminApi'
import {
  COLUMN_SLUG_PATTERN,
  COLUMN_SLUG_RESERVED_WORDS,
  ColumnStatus,
  ResponsibleBusiness,
  ResponsibleBusinessLabel,
  type ColumnNode,
} from '~/utils/types'

// ===== 类型定义 =====
interface TableColumn extends ColumnNode {}

// ===== 栏目错误码 → 用户友好提示（共享，避免多处 if-else 重复） =====
const COLUMN_ERROR_MESSAGES: Record<number, string> = {
  40001: '二级栏目必须绑定责任业务',
  40003: 'slug 已被占用，请更换',
  40004: 'slug 格式不合规',
  40005: 'slug 为系统保留字，禁止使用',
  40008: '停用失败：存在已发布稿件，请先撤回或迁移',
  40009: '停用失败：存在子栏目，请先停用子栏目',
  40010: '停用失败：存在审批中稿件，请先处理',
  40013: '系统仅支持两级栏目结构，无法在二级栏目下创建子栏目',
  40014: '删除失败：该栏目下存在子栏目，请先删除子栏目',
  40015: '删除失败：该栏目下存在稿件，请先迁移或删除稿件',
  40016: '栏目已被删除，请刷新页面',
}

/** 根据错误对象提取错误码并返回友好提示，未匹配时回退到原始 message */
function resolveColumnError(e: any, fallback = '操作失败'): string {
  const code = e?.response?.data?.code || e?.code
  if (code && COLUMN_ERROR_MESSAGES[code]) return COLUMN_ERROR_MESSAGES[code]
  return e?.response?.data?.message || fallback
}

// ===== 响应式数据 =====
const treeData = ref<TableColumn[]>([])
const treeRef = ref()

// 交互视觉反馈：当前激活的栏目 ID
const activeId = ref<number | null>(null)
let activeTimer: ReturnType<typeof setTimeout> | null = null

const treeProps = {
  label: 'columnName',
  children: 'children',
}

const dialogVisible = ref(false)
const dialogTitle = ref('新增栏目')
const formRef = ref<FormInstance>()
const form = reactive({
  columnId: 0,
  columnName: '',
  columnSlug: '',
  parentId: null as number | null,
  responsibleBusiness: undefined as ResponsibleBusiness | undefined,
  sortOrder: 0,
  description: '',
  linkUrl: '',
  version: 1,
})

const formRules: FormRules = {
  columnName: [{ required: true, message: '请输入栏目名称', trigger: 'blur' }],
  columnSlug: [
    { required: true, message: '请输入路由别名 slug', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (!value) return callback()
        if (!COLUMN_SLUG_PATTERN.test(value)) {
          return callback(new Error('仅允许小写字母/数字/中划线，2-64 字符，不能以中划线开头或结尾'))
        }
        if ((COLUMN_SLUG_RESERVED_WORDS as readonly string[]).includes(value)) {
          return callback(new Error(`"${value}" 为系统保留字，禁止使用`))
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  responsibleBusiness: [
    {
      validator: (_rule: any, _value: any, callback: any) => {
        if (form.parentId !== null && form.parentId !== undefined && !form.responsibleBusiness) {
          return callback(new Error('二级栏目必须绑定责任业务'))
        }
        callback()
      },
      trigger: 'change',
    },
  ],
}

const parentOptions = ref<TableColumn[]>([])

const treeSelectProps = { label: 'columnName', value: 'columnId', children: 'children' }

// ===== 计算属性 =====
const topLevelCount = computed(() => treeData.value.length)
const totalCount = computed(() => {
  const count = (list: TableColumn[]): number =>
    list.reduce((sum, n) => sum + 1 + count(n.children ?? []), 0)
  return count(treeData.value)
})

const responsibleBusinessOptions = computed(() =>
  Object.entries(ResponsibleBusinessLabel).map(([value, label]) => ({ value, label })),
)

function responsibleBusinessLabel(code: string): string {
  return (ResponsibleBusinessLabel as Record<string, string>)[code] || code
}

// ===== 交互视觉反馈 =====
function setActive(id: number) {
  activeId.value = id
  // 清除之前的定时器，2秒后恢复
  if (activeTimer) clearTimeout(activeTimer)
  activeTimer = setTimeout(() => {
    activeId.value = null
  }, 2000)
}

// ===== 数据加载与映射 =====
function mapTreeData(data: any): TableColumn[] {
  if (!Array.isArray(data)) return []
  return data.map((item: any) => ({
    columnId: item.columnId,
    columnSlug: item.columnSlug,
    columnName: item.columnName,
    parentId: item.parentId ?? null,
    sortOrder: item.sortOrder ?? 0,
    status: (item.status as ColumnStatus) ?? ColumnStatus.ACTIVE,
    responsibleBusiness: item.responsibleBusiness ?? undefined,
    description: item.description ?? undefined,
    linkUrl: item.linkUrl ?? undefined,
    version: item.version ?? 1,
    children: item.children ? mapTreeData(item.children) : [],
  }))
}

async function loadTree() {
  try {
    const res = await fetchAdminColumnTree()
    if (res.code === 0 || res.code === 200) {
      treeData.value = mapTreeData(res.data)
      parentOptions.value = treeData.value
    } else {
      ElMessage.error(res.message || '加载栏目树失败')
    }
  } catch (e) {
    ElMessage.error('加载栏目树失败')
  }
}

onMounted(() => {
  loadTree()
})

// ===== 新增/编辑对话框 =====
const handleAddTop = () => {
  dialogTitle.value = '新增顶级栏目'
  form.columnId = 0
  form.columnName = ''
  form.columnSlug = ''
  form.parentId = null
  form.responsibleBusiness = undefined
  form.sortOrder = treeData.value.length + 1
  form.description = ''
  form.linkUrl = ''
  form.version = 1
  parentOptions.value = treeData.value
  dialogVisible.value = true
}

const handleEdit = (row: TableColumn) => {
  setActive(row.columnId)
  dialogTitle.value = '编辑栏目'
  form.columnId = row.columnId
  form.columnName = row.columnName
  form.columnSlug = row.columnSlug
  form.parentId = row.parentId
  form.responsibleBusiness = row.responsibleBusiness as ResponsibleBusiness | undefined
  form.sortOrder = row.sortOrder
  form.description = row.description ?? ''
  form.linkUrl = row.linkUrl ?? ''
  form.version = row.version ?? 1
  parentOptions.value = treeData.value
  dialogVisible.value = true
}

const handleAddChild = (row: TableColumn) => {
  setActive(row.columnId)
  dialogTitle.value = '新增子栏目'
  form.columnId = 0
  form.columnName = ''
  form.columnSlug = ''
  form.parentId = row.columnId
  form.responsibleBusiness = undefined
  form.sortOrder = (row.children?.length || 0) + 1
  form.description = ''
  form.linkUrl = ''
  form.version = 1
  parentOptions.value = treeData.value
  dialogVisible.value = true
}

// ===== 上移/下移排序 =====

/**
 * 获取节点的兄弟节点列表（同一父级下的同级节点）
 */
function getSiblings(node: TableColumn): TableColumn[] {
  if (node.parentId === null) {
    return treeData.value
  }
  const parent = findNodeById(treeData.value, node.parentId)
  return parent?.children ?? []
}

/**
 * 判断节点是否是兄弟中的第一个（无法上移）
 */
function isFirstNode(node: TableColumn): boolean {
  const siblings = getSiblings(node)
  return siblings[0]?.columnId === node.columnId
}

/**
 * 判断节点是否是兄弟中的最后一个（无法下移）
 */
function isLastNode(node: TableColumn): boolean {
  const siblings = getSiblings(node)
  return siblings[siblings.length - 1]?.columnId === node.columnId
}

/**
 * 上移：与上一个兄弟节点交换 sortOrder
 */
async function handleMoveUp(node: TableColumn) {
  if (isFirstNode(node)) return
  setActive(node.columnId)
  const siblings = getSiblings(node)
  const idx = siblings.findIndex((s) => s.columnId === node.columnId)
  if (idx <= 0) return

  // 交换 idx 与 idx-1 的位置
  await persistMove(siblings, idx, idx - 1, node, '上移')
}

/**
 * 下移：与下一个兄弟节点交换 sortOrder
 */
async function handleMoveDown(node: TableColumn) {
  if (isLastNode(node)) return
  setActive(node.columnId)
  const siblings = getSiblings(node)
  const idx = siblings.findIndex((s) => s.columnId === node.columnId)
  if (idx < 0 || idx >= siblings.length - 1) return

  // 交换 idx 与 idx+1 的位置
  await persistMove(siblings, idx, idx + 1, node, '下移')
}

/**
 * 持久化移动操作：交换两节点位置 → 重新编号 sortOrder → 调用 API → 失败回滚
 */
async function persistMove(
  siblings: TableColumn[],
  fromIdx: number,
  toIdx: number,
  node: TableColumn,
  actionLabel: '上移' | '下移',
) {
  // 1. 克隆兄弟数组，执行交换
  const newSiblings = [...siblings]
  const tmp = newSiblings[fromIdx]
  newSiblings[fromIdx] = newSiblings[toIdx]
  newSiblings[toIdx] = tmp

  // 2. 重新编号 sortOrder（1, 2, 3...）
  newSiblings.forEach((s, i) => {
    s.sortOrder = i + 1
  })

  // 3. 触发响应式更新：重建 treeData 引用
  //    一级栏目直接替换 treeData；二级栏目替换父级的 children
  if (node.parentId === null) {
    treeData.value = [...newSiblings]
  } else {
    const newTreeData = [...treeData.value]
    const parentIdx = newTreeData.findIndex((p) => p.columnId === node.parentId)
    if (parentIdx >= 0) {
      newTreeData[parentIdx] = {
        ...newTreeData[parentIdx],
        children: [...newSiblings],
      }
      treeData.value = newTreeData
    }
  }

  // 4. 调用后端排序接口（仅传受影响的兄弟节点）
  try {
    await sortColumns({
      items: newSiblings.map((s) => ({ columnId: s.columnId, sortOrder: s.sortOrder })),
    })
    ElMessage.success(`「${node.columnName}」已${actionLabel}`)
  } catch (e: any) {
    const code = e?.data?.code || e?.response?._data?.code || e?.code
    if (code === 40017) {
      ElMessage.error(`${actionLabel}失败：后端检测到跨层级操作，已恢复`)
    } else if (code === 40018) {
      ElMessage.error(`${actionLabel}失败：包含不存在的栏目，已恢复`)
    } else {
      ElMessage.error(`${actionLabel}失败，正在恢复...`)
    }
    loadTree()
  }
}

function findNodeById(list: TableColumn[], id: number): TableColumn | null {
  for (const item of list) {
    if (item.columnId === id) return item
    if (item.children) {
      const found = findNodeById(item.children, id)
      if (found) return found
    }
  }
  return null
}

// ===== 单项删除 =====
const handleDelete = (row: TableColumn) => {
  setActive(row.columnId)
  ElMessageBox.confirm(
    `确定要删除栏目「${row.columnName}」吗？删除后栏目将不可见，关联稿件需先迁移。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(async () => {
    try {
      await deleteColumn(row.columnId)
      console.info(`[ColumnDelete] columnId=${row.columnId} slug=${row.columnSlug} name=${row.columnName}`)
      ElMessage.success(`「${row.columnName}」已删除`)
      loadTree()
    } catch (e: any) {
      console.warn(`[ColumnDelete] failed columnId=${row.columnId}`, e)
      ElMessage.error(resolveColumnError(e, '删除失败'))
    }
  }).catch(() => {})
}

// ===== 启用/停用（状态列 switch） =====
const handleStatusChange = async (row: TableColumn) => {
  setActive(row.columnId)
  const oldStatus = row.status
  try {
    if (row.status === ColumnStatus.ACTIVE) {
      await disableColumn(row.columnId)
      row.status = ColumnStatus.DISABLED
      ElMessage.success(`「${row.columnName}」已停用`)
    } else {
      await enableColumn(row.columnId)
      row.status = ColumnStatus.ACTIVE
      ElMessage.success(`「${row.columnName}」已启用`)
    }
    // 状态切换日志
    console.info(`[ColumnStatusChange] columnId=${row.columnId} ${oldStatus} → ${row.status}`)
  } catch (e: any) {
    console.warn(`[ColumnStatusChange] failed columnId=${row.columnId}`, e)
    ElMessage.error(resolveColumnError(e, '操作失败'))
    row.status = oldStatus // 回滚 UI 状态
    loadTree() // 重新加载确保数据一致
  }
}

// ===== 提交表单 =====
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (!form.columnName.trim()) {
    ElMessage.warning('请输入栏目名称')
    return
  }

  try {
    if (form.columnId > 0) {
      // 编辑
      const res = await updateColumn(form.columnId, {
        columnName: form.columnName,
        columnSlug: form.columnSlug,
        responsibleBusiness: form.responsibleBusiness,
        sortOrder: form.sortOrder,
        description: form.description,
        linkUrl: form.linkUrl || undefined,
        version: form.version,
      })
      // 检查业务错误（$fetch 不对非零 code 抛异常）
      if (res && res.code !== 0 && res.code !== 200) {
        throw { response: { data: res } }
      }
      ElMessage.success(`「${form.columnName}」已更新`)
    } else {
      // 新增
      const res = await createColumn({
        columnName: form.columnName,
        columnSlug: form.columnSlug,
        parentId: form.parentId,
        responsibleBusiness: form.responsibleBusiness,
        sortOrder: form.sortOrder,
        description: form.description,
        linkUrl: form.linkUrl || undefined,
      })
      // 检查业务错误（$fetch 不对非零 code 抛异常）
      if (res && res.code !== 0 && res.code !== 200) {
        throw { response: { data: res } }
      }
      ElMessage.success(`栏目「${form.columnName}」已创建`)
    }
    dialogVisible.value = false
    loadTree()
    console.info(`[ColumnSubmit] ${form.columnId > 0 ? 'update' : 'create'} slug=${form.columnSlug} name=${form.columnName}`)
  } catch (e: any) {
    console.warn(`[ColumnSubmit] failed slug=${form.columnSlug}`, e)
    ElMessage.error(resolveColumnError(e, '保存失败'))
  }
}
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .toolbar-tip {
    margin-left: auto;
    color: #909399;
    font-size: 13px;
  }
}

.tree-wrapper {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

// 栏目节点样式
.column-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background-color 0.2s ease, border-left-color 0.2s ease;
  border-left: 3px solid transparent;

  // 悬停状态
  &:hover {
    background-color: #f5f7fa;
  }

  // 激活状态（点击/操作后 2 秒内）
  &.active {
    background-color: #ecf5ff;
    border-left-color: #409eff;
  }

  // 停用状态
  &.disabled {
    opacity: 0.55;
  }

  .node-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .node-name {
      font-weight: 600;
      font-size: 14px;
      color: #303133;
    }

    .node-slug {
      background: #f5f7fa;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 12px;
      color: #606266;
    }

    .node-id {
      font-size: 12px;
      color: #c0c4cc;
    }
  }

  .node-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 16px;
  }
}

// el-tree 节点高度调整
:deep(.el-tree-node__content) {
  height: auto !important;
  min-height: 44px;
  padding: 4px 0;
}

:deep(.el-tree-node__content:hover) {
  background-color: transparent;
}

:deep(.el-tree-node.is-drop-inner > .el-tree-node__content) {
  background-color: transparent;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}

.text-muted {
  color: #c0c4cc;
}

code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #606266;
}
</style>
