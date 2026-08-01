<template>
  <div class="page-container">
    <h3 class="section-title">已发布稿件（本栏目）</h3>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="search.title"
        placeholder="请输入稿件标题"
        clearable
        style="width: 220px"
      />
      <el-select v-model="search.type" placeholder="稿件类型" clearable style="width: 160px">
        <el-option label="普通校园资讯" value="normal" />
        <el-option label="涉密公文/专项通知" value="confidential" />
      </el-select>
      <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
      <el-button icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" stripe style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
      <el-table-column prop="published_at" label="发布时间" width="170" />
      <el-table-column prop="author_name" label="撰稿人" width="120" />
      <el-table-column label="稿件类型" width="160">
        <template #default="{ row }">
          <el-tag :type="row.type === 'confidential' ? 'danger' : 'primary'" size="small">
            {{ ArticleTypeLabels[row.type as ArticleType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="view_count" label="浏览量" width="100" align="center" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button type="primary" link @click="handleView(row)">查看详情</el-button>
            <el-button type="warning" link @click="handleWithdraw(row)">撤回</el-button>
            <el-button type="info" link @click="handleUnpin(row)">取消置顶</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { ArticleType } from '~/utils/adminTypes'
import { ArticleTypeLabels } from '~/utils/adminTypes'

/** 搜索条件 */
const search = reactive({
  title: '',
  type: '' as string,
})

/** Mock 数据 */
const tableData = ref([
  {
    id: 1,
    title: '关于2026年春季学期期末成绩录入工作的通知',
    published_at: '2026-07-22 10:00',
    author_name: '张老师',
    type: 'normal',
    view_count: 1280,
  },
  {
    id: 2,
    title: '教务处关于教材征订的紧急通知',
    published_at: '2026-07-20 15:30',
    author_name: '李编辑',
    type: 'confidential',
    view_count: 856,
  },
  {
    id: 3,
    title: '2026年暑期实习安排及注意事项',
    published_at: '2026-07-18 09:00',
    author_name: '王编辑',
    type: 'normal',
    view_count: 2340,
  },
  {
    id: 4,
    title: '关于调整下学期选课时间的公告',
    published_at: '2026-07-15 14:20',
    author_name: '赵编辑',
    type: 'normal',
    view_count: 3120,
  },
])

/** 分页 */
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 4,
})

/** 搜索 */
function handleSearch() {
  ElMessage.info('搜索功能（Mock）')
}

/** 重置 */
function handleReset() {
  search.title = ''
  search.type = ''
  ElMessage.info('已重置搜索条件')
}

/** 查看详情 */
function handleView(row: any) {
  ElMessage.info(`查看详情: ${row.title}`)
}

/** 撤回 */
function handleWithdraw(row: any) {
  ElMessage.info(`撤回稿件: ${row.title}`)
}

/** 取消置顶 */
function handleUnpin(row: any) {
  ElMessage.info(`取消置顶: ${row.title}`)
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
