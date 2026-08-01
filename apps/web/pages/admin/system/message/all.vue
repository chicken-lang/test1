<template>
  <div class="page-container">
    <h3 class="section-title">全站消息查询</h3>

    <!-- 搜索区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="消息标题">
        <el-input
          v-model="searchForm.title"
          placeholder="请输入标题关键字"
          clearable
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="消息类型">
        <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 150px">
          <el-option label="驳回通知" value="reject" />
          <el-option label="系统公告" value="announcement" />
          <el-option label="终审退回" value="final_return" />
          <el-option label="待办提醒" value="approval-todo" />
          <el-option label="普通通知" value="notice" />
          <el-option label="反馈消息" value="feedback" />
          <el-option label="系统消息" value="system" />
        </el-select>
      </el-form-item>
      <el-form-item label="已读状态">
        <el-select v-model="searchForm.isRead" placeholder="全部状态" clearable style="width: 120px">
          <el-option label="已读" value="true" />
          <el-option label="未读" value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
        <el-button icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="title" label="消息标题" min-width="240" show-overflow-tooltip />
      <el-table-column label="接收人" width="120" align="center">
        <template #default="{ row }">
          {{ formatReceiver(row.receiver, row.receiverRole) }}
        </template>
      </el-table-column>
      <el-table-column label="消息类型" width="130" align="center">
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
          <el-tag v-else :type="row.isRead ? 'success' : 'warning'" size="small">
            {{ row.isRead ? '已读' : '未读' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
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
          <el-descriptions-item label="接收人">
            {{ formatReceiver(currentMessage.receiver, currentMessage.receiverRole) }}
          </el-descriptions-item>
          <el-descriptions-item label="消息类型">
            <el-tag :type="typeTagMap[currentMessage.type]" size="small">
              {{ typeLabelMap[currentMessage.type] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ formatDateTime(currentMessage.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="currentMessage.isArchived" type="info" size="small">已归档</el-tag>
            <el-tag v-else :type="currentMessage.isRead ? 'success' : 'warning'" size="small">
              {{ currentMessage.isRead ? '已读' : '未读' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="内容">{{ currentMessage.content }}</el-descriptions-item>
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
import { formatDateTime } from '~/utils/format'

const api = useApi()

const searchForm = reactive({
  title: '',
  type: '' as string,
  isRead: '' as '' | 'true' | 'false',
  dateRange: null as string[] | null,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const loading = ref(false)
const tableData = ref<any[]>([])
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
  reject: '驳回通知',
  announcement: '系统公告',
  final_return: '终审退回',
  'approval-todo': '待办提醒',
  notice: '普通通知',
  feedback: '反馈消息',
  system: '系统消息',
}

/** 格式化接收人显示：对象取 nickname，receiverRole=all 显示"全员" */
function formatReceiver(receiver: any, receiverRole?: string | null): string {
  if (!receiver && (!receiverRole || receiverRole === 'all')) return '全员'
  if (receiverRole && receiverRole !== 'all' && !receiver) {
    const roleMap: Record<string, string> = {
      editor: '全体编辑',
      reviewer: '全体审核',
      column_admin: '全体栏目管理员',
      system_admin: '全体系统管理员',
    }
    return roleMap[receiverRole] || receiverRole
  }
  if (typeof receiver === 'object') {
    return receiver.nickname || receiver.username || `用户${receiver.id || ''}`
  }
  if (typeof receiver === 'string') return receiver
  return '全员'
}

/** 加载数据 */
async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.title) params.title = searchForm.title
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.isRead !== '' && searchForm.isRead !== undefined) params.isRead = searchForm.isRead
    if (searchForm.dateRange?.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    const res = await api.get<any>('/admin/messages', params)
    const data = res?.data || res
    tableData.value = data?.list || []
    pagination.total = data?.total || 0
  } catch (err: any) {
    ElMessage.error(err?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  pagination.page = 1
  await loadData()
}

function handleReset() {
  searchForm.title = ''
  searchForm.type = ''
  searchForm.isRead = ''
  searchForm.dateRange = null
  pagination.page = 1
  loadData()
}

async function handlePageChange() {
  await loadData()
}

async function handleSizeChange() {
  pagination.page = 1
  await loadData()
}

function handleView(row: any) {
  currentMessage.value = row
  detailVisible.value = true
}

await loadData()
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.search-form {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
