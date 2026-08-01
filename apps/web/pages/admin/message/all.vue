<template>
  <div class="page-container">
    <!-- 顶部标签切换 -->
    <el-tabs v-model="activeTab" class="message-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="全部消息" name="all" />
      <el-tab-pane label="未读待办" name="unread" />
      <el-tab-pane label="已归档消息" name="archived" />
    </el-tabs>

    <!-- 消息表格 -->
    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="title" label="消息标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="type" label="消息类型" width="130" align="center">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type]" size="small">
            {{ typeLabelMap[row.type] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="170" align="center">
        <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isArchived" type="info" size="small">已归档</el-tag>
          <el-tag v-else-if="row.isRead" type="success" size="small">已读</el-tag>
          <el-tag v-else type="warning" size="small">未读</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看详情
            </el-button>
            <el-button
              v-if="!row.isArchived"
              type="warning"
              link
              size="small"
              @click="handleArchive(row)"
            >
              归档
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="消息详情" width="520px">
      <template v-if="currentMessage">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="消息标题">{{ currentMessage.title }}</el-descriptions-item>
          <el-descriptions-item label="消息类型">
            <el-tag :type="typeTagMap[currentMessage.type]" size="small">
              {{ typeLabelMap[currentMessage.type] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ formatDateTime(currentMessage.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="内容">
            {{ currentMessage.content }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { TabsPaneContext } from 'element-plus'
import { formatDateTime } from '~/utils/format'

const api = useApi()
const router = useRouter()

// 跨页面共享的状态覆盖（客户端持久化，页面导航不丢失）
const overrides = useState<Record<number, { isRead?: boolean; isArchived?: boolean }>>('msg-overrides', () => ({}))

const activeTab = ref('all')
const loading = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})
const detailVisible = ref(false)
const currentMessage = ref<any>(null)

const typeTagMap: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
  reject: 'danger',
  announcement: 'info',
  final_return: 'warning',
  'approval-todo': 'danger',
  notice: 'info',
  feedback: 'success',
  system: 'warning',
}

const typeLabelMap: Record<string, string> = {
  reject: '审核驳回',
  announcement: '系统公告',
  final_return: '终审退回',
  'approval-todo': '待办',
  notice: '通知',
  feedback: '反馈',
  system: '系统',
}

/** 应用客户端状态覆盖 */
function applyOverrides(list: any[]) {
  return list.map((m: any) => {
    const ov = overrides.value[m.id]
    return ov ? { ...m, ...ov } : m
  })
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get<any>('/messages', {
      includeAll: true,
      page: 1,
      pageSize: 100,
    })
    const data = res?.data || res
    const rawList = data?.list || []
    // 应用客户端覆盖 + 过滤掉已归档消息（全部消息不含已归档）
    const filtered = applyOverrides(rawList).filter((m: any) => !m.isArchived)
    pagination.total = filtered.length
    const start = (pagination.page - 1) * pagination.pageSize
    tableData.value = filtered.slice(start, start + pagination.pageSize)
  } catch (err: any) {
    ElMessage.error(err?.message || '加载消息失败')
  } finally {
    loading.value = false
  }
}

function handleTabClick(pane: TabsPaneContext) {
  const routeMap: Record<string, string> = {
    all: '/admin/message/all',
    unread: '/admin/message/unread',
    archived: '/admin/message/archived',
  }
  const path = routeMap[pane.paneName as string]
  if (path) router.push(path)
}

async function handleView(row: any) {
  currentMessage.value = row
  detailVisible.value = true
  if (!row.isRead) {
    try {
      await api.put(`/messages/${row.id}/read`)
      row.isRead = true
      overrides.value[row.id] = { ...overrides.value[row.id], isRead: true }
    } catch {}
  }
}

async function handleArchive(row: any) {
  try {
    await api.put(`/messages/${row.id}/archive`)
    ElMessage.success(`已归档：${row.title}`)
    overrides.value[row.id] = { ...overrides.value[row.id], isArchived: true }
    // 立即从当前列表移除
    tableData.value = tableData.value.filter((m: any) => m.id !== row.id)
    pagination.total = Math.max(0, pagination.total - 1)
  } catch (err: any) {
    ElMessage.error(err?.message || '归档失败')
  }
}

async function handlePageChange(p: number) {
  pagination.page = p
  await loadData()
}

async function handleSizeChange(ps: number) {
  pagination.pageSize = ps
  pagination.page = 1
  await loadData()
}

await loadData()
</script>

<style lang="scss" scoped>
.message-tabs {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
