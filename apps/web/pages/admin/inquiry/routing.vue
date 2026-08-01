<template>
  <div class="page-container">
    <h3 class="section-title">咨询分流规则配置</h3>

    <el-alert
      title="分流规则说明"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px;"
    >
      <template #default>
        系统按以下优先级自动分配处理人: 1. 指定处理人 → 2. 指定处理部门（轮询分配编辑）→ 3. 通知系统管理员手动指派。超时时限默认72小时，截止前12小时自动发送预警。
      </template>
    </el-alert>

    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column label="业务标签" width="140">
        <template #default="{ row }">
          <el-tag>{{ row.businessTagName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="指定处理人ID" width="140">
        <template #default="{ row }">
          <el-input-number
            v-model="row.assigneeId"
            :min="0"
            controls-position="right"
            style="width: 120px"
            placeholder="不指定"
          />
        </template>
      </el-table-column>
      <el-table-column label="指定部门ID" width="140">
        <template #default="{ row }">
          <el-input-number
            v-model="row.assigneeDeptId"
            :min="0"
            controls-position="right"
            style="width: 120px"
            placeholder="不指定"
          />
        </template>
      </el-table-column>
      <el-table-column label="处理时限(小时)" width="160">
        <template #default="{ row }">
          <el-input-number
            v-model="row.timeoutHours"
            :min="1"
            :max="720"
            controls-position="right"
            style="width: 140px"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleSave(row)">保存</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 16px;">
      <el-button type="primary" @click="handleSaveAll" :loading="saveAllLoading">保存全部配置</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="warning" @click="handleTimeoutCheck" :loading="checkLoading">手动触发超时检查</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const saveAllLoading = ref(false)
const checkLoading = ref(false)
const tableData = ref<any[]>([])

async function fetchData() {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/inquiries/routing-config')
    tableData.value = (res.data || res) as any[]
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || '获取分流配置失败')
    tableData.value = []
  } finally {
    loading.value = false
  }
}

async function handleSave(row: any) {
  try {
    await $fetch('/api/admin/inquiries/routing-config', {
      method: 'PUT',
      body: JSON.stringify({
        businessTag: row.businessTag,
        assigneeId: row.assigneeId || undefined,
        assigneeDeptId: row.assigneeDeptId || undefined,
        timeoutHours: row.timeoutHours,
      }),
    })
    ElMessage.success(`${row.businessTagName} 配置已保存`)
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || '保存失败')
  }
}

async function handleSaveAll() {
  saveAllLoading.value = true
  try {
    for (const row of tableData.value) {
      await $fetch('/api/admin/inquiries/routing-config', {
        method: 'PUT',
        body: JSON.stringify({
          businessTag: row.businessTag,
          assigneeId: row.assigneeId || undefined,
          assigneeDeptId: row.assigneeDeptId || undefined,
          timeoutHours: row.timeoutHours,
        }),
      })
    }
    ElMessage.success('全部配置已保存')
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || '批量保存失败')
  } finally {
    saveAllLoading.value = false
  }
}

function handleReset() {
  fetchData()
}

async function handleTimeoutCheck() {
  checkLoading.value = true
  try {
    const res = await $fetch('/api/admin/inquiries/timeout-check', {
      method: 'POST',
    })
    const data = res.data || res
    ElMessage.success(`超时检查完成: 预警 ${data.warningCount || 0} 条, 超时 ${data.timeoutCount || 0} 条`)
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || '超时检查失败')
  } finally {
    checkLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}
</style>
