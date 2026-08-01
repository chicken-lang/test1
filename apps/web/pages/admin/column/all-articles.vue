<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="栏目">
        <el-select v-model="searchForm.columnId" placeholder="请选择栏目" clearable style="width: 160px">
          <el-option
            v-for="col in columnOptions"
            :key="col.id"
            :label="col.name"
            :value="col.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
          <el-option
            v-for="(label, key) in ArticleStatusLabels"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 160px">
          <el-option
            v-for="(label, key) in ArticleTypeLabels"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="提交时间">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item label="业务标签">
        <el-select
          v-model="searchForm.businessTags"
          placeholder="请选择标签"
          multiple
          clearable
          style="width: 200px"
        >
          <el-option
            v-for="tag in BusinessTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
        <el-button icon="Refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" border stripe style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
      <el-table-column prop="columnName" label="栏目" width="120" />
      <el-table-column prop="authorName" label="撰稿人" width="100" />
      <el-table-column label="状态" width="130">
        <template #default="{ row }">
          <el-tag :color="getStatusColor(row.status)">
            {{ ArticleStatusLabels[row.status as ArticleStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="稿件类型" width="160">
        <template #default="{ row }">
          <el-tag :type="row.type === 'confidential' ? 'warning' : 'info'">
            {{ ArticleTypeLabels[row.type as ArticleType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submittedAt" label="提交时间" width="160" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看详情
            </el-button>
            <template v-if="canManageContent">
              <el-button type="warning" link size="small" @click="handleWithdraw(row)">
                撤回下架
              </el-button>
              <el-button type="success" link size="small" @click="handleRecommend(row)">
                调整推荐
              </el-button>
            </template>
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
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive, computed } from 'vue'
import type { ArticleStatus, ArticleType } from '~/utils/adminTypes'
import { ArticleStatusLabels, ArticleTypeLabels, BusinessTags } from '~/utils/adminTypes'
import { useAuthStore } from '~/stores/cmsAuth'
const authStore = useAuthStore()
// 系统管理员不参与内容运营, 无撤回/推荐权
const canManageContent = computed(() => {
  const role = authStore.user?.role
  return role === 'column_admin' || role === 'editor' || role === 'reviewer'
})

// 搜索表单
const searchForm = reactive({
  columnId: null as number | null,
  status: null as ArticleStatus | null,
  type: null as ArticleType | null,
  dateRange: null as [string, string] | null,
  businessTags: [] as string[],
})

// 栏目选项
const columnOptions = ref([
  { id: 1, name: '教学管理' },
  { id: 2, name: '实践教学' },
  { id: 3, name: '综合事务' },
])

// 状态颜色映射
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    draft: '#909399',
    pending_review: '#e6a23c',
    review_rejected: '#f56c6c',
    final_pending: '#e6a23c',
    published: '#67c23a',
    withdrawn: '#909399',
  }
  return colorMap[status] || '#909399'
}

// 表格数据
const tableData = ref([
  {
    id: 1,
    title: '2026年春季学期教学工作计划',
    columnName: '教学管理',
    authorName: '张老师',
    status: 'published',
    type: 'normal',
    submittedAt: '2026-07-15 10:00',
  },
  {
    id: 2,
    title: '校园技能竞赛报名通知',
    columnName: '实践教学',
    authorName: '李老师',
    status: 'pending_review',
    type: 'normal',
    submittedAt: '2026-07-18 14:30',
  },
  {
    id: 3,
    title: '关于期末考试安排的紧急通知',
    columnName: '教学管理',
    authorName: '王老师',
    status: 'final_pending',
    type: 'confidential',
    submittedAt: '2026-07-19 09:15',
  },
  {
    id: 4,
    title: '教师培训课程安排',
    columnName: '综合事务',
    authorName: '赵老师',
    status: 'review_rejected',
    type: 'normal',
    submittedAt: '2026-07-20 16:45',
  },
  {
    id: 5,
    title: '学生实习实训管理规定',
    columnName: '实践教学',
    authorName: '陈老师',
    status: 'draft',
    type: 'confidential',
    submittedAt: '2026-07-21 11:20',
  },
  {
    id: 6,
    title: '校园信息安全管理办法',
    columnName: '综合事务',
    authorName: '刘老师',
    status: 'withdrawn',
    type: 'normal',
    submittedAt: '2026-07-22 13:50',
  },
])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 6,
})

// 搜索
const handleSearch = () => {
  console.log('搜索:', searchForm)
}

// 重置
const handleReset = () => {
  searchForm.columnId = null
  searchForm.status = null
  searchForm.type = null
  searchForm.dateRange = null
  searchForm.businessTags = []
}

// 查看详情
const handleView = (row: any) => {
  console.log('查看详情:', row)
}

// 撤回下架
const handleWithdraw = (row: any) => {
  console.log('撤回下架:', row)
}

// 调整推荐
const handleRecommend = (row: any) => {
  console.log('调整推荐:', row)
}

// 分页事件
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
}

const handlePageChange = (val: number) => {
  pagination.page = val
}
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 16px;
}
</style>
