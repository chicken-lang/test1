<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="操作时间">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item label="操作人">
        <el-select v-model="searchForm.operator" placeholder="请选择操作人" clearable style="width: 150px">
          <el-option
            v-for="user in operatorOptions"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作类型">
        <el-select v-model="searchForm.actionType" placeholder="请选择类型" clearable style="width: 150px">
          <el-option
            v-for="type in actionTypes"
            :key="type"
            :label="type"
            :value="type"
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
      <el-table-column prop="operateTime" label="操作时间" width="160" />
      <el-table-column prop="operator" label="操作人" width="120" />
      <el-table-column prop="role" label="角色" width="120" />
      <el-table-column prop="actionType" label="操作类型" width="140" />
      <el-table-column prop="relatedArticle" label="关联稿件" min-width="200" show-overflow-tooltip />
      <el-table-column prop="ip" label="操作IP" width="140" />
      <el-table-column prop="detail" label="详情" min-width="180" show-overflow-tooltip />
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
import { ref, reactive } from 'vue'

// 搜索表单
const searchForm = reactive({
  dateRange: null as [string, string] | null,
  operator: null as number | null,
  actionType: '',
})

// 操作人选项
const operatorOptions = ref([
  { id: 1, name: '张老师' },
  { id: 2, name: '李老师' },
  { id: 3, name: '王老师' },
])

// 操作类型选项
const actionTypes = ref([
  '创建稿件',
  '编辑稿件',
  '审核通过',
  '审核驳回',
  '发布稿件',
  '撤回稿件',
  '下架稿件',
  '设置推荐',
  '取消推荐',
])

// 表格数据
const tableData = ref([
  {
    id: 1,
    operateTime: '2026-07-24 10:30:15',
    operator: '张老师',
    role: '栏目管理员',
    actionType: '审核通过',
    relatedArticle: '关于2026年春季学期期末考试安排的通知',
    ip: '192.168.1.100',
    detail: '终审通过稿件',
  },
  {
    id: 2,
    operateTime: '2026-07-24 09:45:20',
    operator: '李老师',
    role: '编辑管理员',
    actionType: '创建稿件',
    relatedArticle: '校园技能竞赛获奖名单公示',
    ip: '192.168.1.101',
    detail: '创建新稿件',
  },
  {
    id: 3,
    operateTime: '2026-07-23 16:20:30',
    operator: '王老师',
    role: '审核管理员',
    actionType: '审核驳回',
    relatedArticle: '教师培训课程安排',
    ip: '192.168.1.102',
    detail: '初审驳回，原因：内容不完整',
  },
  {
    id: 4,
    operateTime: '2026-07-23 14:15:10',
    operator: '张老师',
    role: '栏目管理员',
    actionType: '发布稿件',
    relatedArticle: '2026年春季学期教学工作计划',
    ip: '192.168.1.100',
    detail: '发布稿件至前台',
  },
  {
    id: 5,
    operateTime: '2026-07-23 11:30:45',
    operator: '李老师',
    role: '编辑管理员',
    actionType: '编辑稿件',
    relatedArticle: '学生实习实训管理规定',
    ip: '192.168.1.101',
    detail: '修改稿件内容',
  },
  {
    id: 6,
    operateTime: '2026-07-22 15:50:25',
    operator: '张老师',
    role: '栏目管理员',
    actionType: '设置推荐',
    relatedArticle: '校园文化活动周安排',
    ip: '192.168.1.100',
    detail: '设置为首页轮播推荐',
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
  searchForm.dateRange = null
  searchForm.operator = null
  searchForm.actionType = ''
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
