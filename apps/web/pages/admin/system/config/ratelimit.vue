<template>
  <div class="page-container">
    <h3 class="section-title">限流风控配置</h3>

    <el-form :model="form" label-width="200px" style="max-width: 800px">
      <!-- 匿名访问限流 -->
      <el-divider content-position="left">匿名访问限流</el-divider>

      <el-form-item label="单IP每分钟最大请求数">
        <el-input-number v-model="form.anonMaxRequests" :min="1" :max="10000" />
      </el-form-item>

      <el-form-item label="触发封禁时长(分钟)">
        <el-input-number v-model="form.anonBanDuration" :min="1" :max="1440" />
      </el-form-item>

      <!-- 登录接口限流 -->
      <el-divider content-position="left">登录接口限流</el-divider>

      <el-form-item label="同IP每分钟最大登录次数">
        <el-input-number v-model="form.loginMaxAttempts" :min="1" :max="100" />
      </el-form-item>

      <el-form-item label="账号连续失败锁定次数">
        <el-input-number v-model="form.loginLockCount" :min="1" :max="20" />
      </el-form-item>

      <!-- 异常IP管理 -->
      <el-divider content-position="left">异常IP管理</el-divider>

      <el-table :data="blockedIPs" border stripe style="width: 100%; margin-bottom: 20px">
        <el-table-column prop="ip" label="IP地址" width="160" />
        <el-table-column prop="reason" label="封禁原因" min-width="200" />
        <el-table-column prop="blocked_at" label="封禁时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="handleUnblock(row)">
              解禁
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-form-item>
        <el-button type="primary" @click="handleSave">保存配置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 表单数据
const form = reactive({
  anonMaxRequests: 60,
  anonBanDuration: 30,
  loginMaxAttempts: 5,
  loginLockCount: 5,
})

// 封禁IP列表
const blockedIPs = ref([
  {
    id: 1,
    ip: '192.168.1.100',
    reason: '匿名访问频率过高',
    blocked_at: '2026-07-20 14:30:00',
  },
  {
    id: 2,
    ip: '10.0.0.50',
    reason: '登录尝试次数过多',
    blocked_at: '2026-07-21 09:15:00',
  },
  {
    id: 3,
    ip: '172.16.0.200',
    reason: '异常请求行为',
    blocked_at: '2026-07-22 16:45:00',
  },
])

// 解禁
const handleUnblock = (row: any) => {
  ElMessageBox.confirm(`确定要解禁IP"${row.ip}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    ElMessage.success('解禁成功')
  })
}

// 保存
const handleSave = () => {
  console.log('保存配置:', form)
  ElMessage.success('限流配置已保存')
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}
</style>
