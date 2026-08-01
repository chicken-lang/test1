<template>
  <div class="page-container">
    <h3 class="section-title">日志完整性校验中心</h3>

    <!-- 说明文字 -->
    <div class="description-box">
      <p>
        日志完整性校验采用 <strong>SHA-256 哈希链 + HMAC-SHA256 数字签名</strong> 双重保障机制。
        哈希链检测日志插入/删除/重排，HMAC 签名防止整链重算攻击。
        系统每日 02:30 自动执行全量巡检，读取日志时按 10% 比例抽样校验。
        检测到篡改将自动生成告警记录，请及时处理。
      </p>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="audit-tabs">
      <!-- Tab 1: 执行校验 -->
      <el-tab-pane label="执行校验" name="verify">
        <!-- 校验表单 -->
        <el-form :model="verifyForm" label-width="100px" style="max-width: 600px; margin-bottom: 24px">
          <el-form-item label="校验范围">
            <el-radio-group v-model="verifyForm.scope">
              <el-radio value="main">主表（热数据）</el-radio>
              <el-radio value="archive">归档表（温数据）</el-radio>
              <el-radio value="full">全部</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="抽样数量">
            <el-input-number v-model="verifyForm.sampleSize" :min="0" :max="100000" :step="500" style="width: 200px" />
            <span class="sample-tip">0 = 全量校验</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Check" :loading="verifying" @click="handleVerify">开始校验</el-button>
          </el-form-item>
        </el-form>

        <!-- 密钥轮换重签 -->
        <el-divider content-position="left">密钥轮换</el-divider>
        <div class="re-sign-box">
          <div class="re-sign-desc">
            当 <code>AUDIT_HMAC_SECRET</code> 密钥变更后，历史日志的 HMAC 签名会校验失败。
            点击"重签全部日志"可用新密钥重新计算签名（重签前会先验证哈希链完整性，哈希链异常则拒绝重签）。
          </div>
          <el-button type="warning" icon="RefreshRight" :loading="reSigning" @click="handleReSign">
            重签全部日志
          </el-button>
        </div>

        <!-- 校验结果 -->
        <h4 class="sub-title">本次校验结果</h4>
        <el-table :data="resultData" stripe style="width: 100%" v-loading="verifying">
          <el-table-column label="校验范围" width="140" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="scopeTagType(row.scope)">{{ scopeLabel(row.scope) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalLogs" label="日志总数" width="100" align="center" />
          <el-table-column prop="checkedLogs" label="校验条数" width="100" align="center" />
          <el-table-column label="校验结果" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                {{ row.passed ? '通过' : '异常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="issuesCount" label="异常数" width="80" align="center">
            <template #default="{ row }">
              <span :class="{ 'issue-count': row.issuesCount > 0 }">{{ row.issuesCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="校验时间" width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.verifiedAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="message" label="说明" min-width="280" show-overflow-tooltip />
        </el-table>

        <div v-if="resultData.length === 0 && !verifying" class="empty-tip">
          暂无校验记录，请先执行一次校验
        </div>
      </el-tab-pane>

      <!-- Tab 2: 校验历史 -->
      <el-tab-pane label="校验历史" name="history">
        <div class="filter-bar">
          <el-select v-model="historyFilter.integrity" placeholder="筛选结果" clearable style="width: 160px" @change="loadHistory">
            <el-option label="全部" value="" />
            <el-option label="通过" value="pass" />
            <el-option label="异常" value="fail" />
          </el-select>
          <el-button icon="Refresh" @click="loadHistory">刷新</el-button>
        </div>
        <el-table :data="historyData" stripe style="width: 100%" v-loading="historyLoading">
          <el-table-column prop="id" label="ID" width="70" align="center" />
          <el-table-column label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="checkTypeTagType(row.checkType)">{{ checkTypeLabel(row.checkType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="范围" width="110" align="center">
            <template #default="{ row }">{{ scopeLabel(row.scope) }}</template>
          </el-table-column>
          <el-table-column prop="verifiedCount" label="校验数" width="90" align="center" />
          <el-table-column prop="totalCount" label="总数" width="90" align="center" />
          <el-table-column prop="issuesCount" label="异常数" width="80" align="center">
            <template #default="{ row }">
              <span :class="{ 'issue-count': row.issuesCount > 0 }">{{ row.issuesCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="结果" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.integrity === 'pass' ? 'success' : 'danger'" size="small">
                {{ row.integrity === 'pass' ? '通过' : '异常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="triggeredBy" label="触发者" width="120" show-overflow-tooltip />
          <el-table-column label="时间" width="170">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap" v-if="historyTotal > historyFilter.pageSize">
          <el-pagination
            v-model:current-page="historyFilter.page"
            :page-size="historyFilter.pageSize"
            :total="historyTotal"
            layout="prev, pager, next"
            @current-change="loadHistory"
          />
        </div>
        <div v-if="historyData.length === 0 && !historyLoading" class="empty-tip">暂无校验历史记录</div>
      </el-tab-pane>

      <!-- Tab 3: 篡改告警 -->
      <el-tab-pane name="alerts">
        <template #label>
          篡改告警
          <el-badge v-if="openAlertCount > 0" :value="openAlertCount" class="alert-badge" />
        </template>
        <div class="filter-bar">
          <el-select v-model="alertFilter.status" placeholder="筛选状态" clearable style="width: 160px" @change="loadAlerts">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="open" />
            <el-option label="已解决" value="resolved" />
          </el-select>
          <el-button icon="Refresh" @click="loadAlerts">刷新</el-button>
        </div>
        <el-table :data="alertData" stripe style="width: 100%" v-loading="alertLoading">
          <el-table-column prop="id" label="ID" width="70" align="center" />
          <el-table-column label="级别" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.severity === 'critical' ? 'danger' : 'warning'" size="small">
                {{ row.severity === 'critical' ? '严重' : '高危' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="150" align="center">
            <template #default="{ row }">{{ alertTypeLabel(row.alertType) }}</template>
          </el-table-column>
          <el-table-column prop="logId" label="日志ID" width="90" align="center" />
          <el-table-column prop="message" label="告警详情" min-width="300" show-overflow-tooltip />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'open' ? 'danger' : 'success'" size="small">
                {{ row.status === 'open' ? '待处理' : '已解决' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="告警时间" width="170">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'open'"
                type="primary"
                size="small"
                link
                @click="handleResolveAlert(row.id)"
              >处理</el-button>
              <span v-else class="resolved-text">已处理</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap" v-if="alertTotal > alertFilter.pageSize">
          <el-pagination
            v-model:current-page="alertFilter.page"
            :page-size="alertFilter.pageSize"
            :total="alertTotal"
            layout="prev, pager, next"
            @current-change="loadAlerts"
          />
        </div>
        <div v-if="alertData.length === 0 && !alertLoading" class="empty-tip">
          暂无篡改告警记录，系统运行正常
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '~/utils/format'
import {
  verifyAuditIntegrity,
  fetchIntegrityCheckHistory,
  fetchTamperAlerts,
  resolveTamperAlert,
  reSignAllLogs,
} from '~/composables/adminApi'

const activeTab = ref('verify')

// ========== 执行校验 ==========
const verifyForm = reactive({
  scope: 'main' as 'main' | 'archive' | 'full',
  sampleSize: 1000,
})
const verifying = ref(false)
const resultData = ref<any[]>([])

async function handleVerify() {
  verifying.value = true
  try {
    const res: any = await verifyAuditIntegrity({
      scope: verifyForm.scope,
      sampleSize: verifyForm.sampleSize,
    })
    if (res?.code !== 0) throw new Error(res?.message || '校验失败')

    const data = res.data
    resultData.value.unshift({
      id: Date.now(),
      scope: data.scope,
      totalLogs: data.totalLogs,
      checkedLogs: data.checkedLogs,
      passed: data.passed,
      issuesCount: data.issuesCount,
      verifiedAt: data.verifiedAt,
      message: data.message,
    })

    if (data.passed) {
      ElMessage.success('校验完成，日志数据完整')
    } else {
      ElMessage.warning(`校验发现 ${data.issuesCount} 个异常，请查看告警面板`)
      // 自动加载告警
      loadAlerts()
    }
    // 刷新历史
    loadHistory()
  } catch (e: any) {
    ElMessage.error(e?.message || '校验失败')
  } finally {
    verifying.value = false
  }
}

// ========== 校验历史 ==========
const historyLoading = ref(false)
const historyData = ref<any[]>([])
const historyTotal = ref(0)
const historyFilter = reactive({ page: 1, pageSize: 10, integrity: '' })

// ========== 密钥重签 ==========
const reSigning = ref(false)

async function handleReSign() {
  try {
    await ElMessageBox.confirm(
      '此操作将用当前密钥重新计算所有日志的 HMAC 签名。重签前会先验证哈希链完整性，确认继续？',
      '密钥重签',
      { type: 'warning', confirmButtonText: '确认重签', cancelButtonText: '取消' },
    )
    reSigning.value = true
    const res: any = await reSignAllLogs()
    if (res?.code !== 0) throw new Error(res?.message || '重签失败')

    const data = res.data
    if (data.success) {
      ElMessage.success(data.message)
    } else {
      ElMessage.error(data.message)
      // 哈希链异常,切换到告警面板
      if (data.chainErrors?.length) {
        activeTab.value = 'alerts'
        loadAlerts()
      }
    }
    // 刷新历史
    loadHistory()
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message)
  } finally {
    reSigning.value = false
  }
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const res: any = await fetchIntegrityCheckHistory({
      page: historyFilter.page,
      pageSize: historyFilter.pageSize,
      integrity: historyFilter.integrity || undefined,
    })
    if (res?.code === 0) {
      historyData.value = res.data.list
      historyTotal.value = res.data.total
    }
  } catch {
    historyData.value = []
  } finally {
    historyLoading.value = false
  }
}

// ========== 篡改告警 ==========
const alertLoading = ref(false)
const alertData = ref<any[]>([])
const alertTotal = ref(0)
const openAlertCount = ref(0)
const alertFilter = reactive({ page: 1, pageSize: 10, status: '' })

async function loadAlerts() {
  alertLoading.value = true
  try {
    const res: any = await fetchTamperAlerts({
      page: alertFilter.page,
      pageSize: alertFilter.pageSize,
      status: alertFilter.status || undefined,
    })
    if (res?.code === 0) {
      alertData.value = res.data.list
      alertTotal.value = res.data.total
    }
    // 单独查一次 open 状态的数量用于 badge
    const openRes: any = await fetchTamperAlerts({ page: 1, pageSize: 1, status: 'open' })
    if (openRes?.code === 0) {
      openAlertCount.value = openRes.data.total
    }
  } catch {
    alertData.value = []
  } finally {
    alertLoading.value = false
  }
}

async function handleResolveAlert(id: number) {
  try {
    await ElMessageBox.confirm('确认将该告警标记为已解决？', '处理告警', { type: 'warning' })
    const res: any = await resolveTamperAlert(id)
    if (res?.code === 0) {
      ElMessage.success('告警已处理')
      loadAlerts()
    } else {
      throw new Error(res?.message || '处理失败')
    }
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) ElMessage.error(e.message)
  }
}

// ========== 辅助方法 ==========
function scopeLabel(scope: string): string {
  const map: Record<string, string> = { main: '主表', archive: '归档表', full: '全部' }
  return map[scope] || scope
}
function scopeTagType(scope: string): string {
  return scope === 'full' ? 'warning' : scope === 'archive' ? 'info' : ''
}
function checkTypeLabel(type: string): string {
  const map: Record<string, string> = { manual: '手动', scheduled: '定时', on_read: '读取' }
  return map[type] || type
}
function checkTypeTagType(type: string): string {
  const map: Record<string, string> = { manual: 'primary', scheduled: 'info', on_read: 'warning' }
  return map[type] || ''
}
function alertTypeLabel(type: string): string {
  const map: Record<string, string> = {
    hash_mismatch: '哈希不匹配',
    chain_broken: '哈希链断裂',
    missing_hash: '缺少哈希',
    signature_invalid: '签名无效',
  }
  return map[type] || type
}

onMounted(() => {
  loadHistory()
  loadAlerts()
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.sub-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.description-box {
  padding: 12px 16px;
  background: #f4f4f5;
  border-radius: 4px;
  margin-bottom: 20px;

  p {
    font-size: 13px;
    color: #606266;
    line-height: 1.8;
    margin: 0;
  }
}

.sample-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.empty-tip {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 40px 0;
}

.audit-tabs {
  margin-top: 8px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.issue-count {
  color: #f56c6c;
  font-weight: 600;
}

.resolved-text {
  color: #909399;
  font-size: 12px;
}

.alert-badge {
  margin-left: 6px;
}

.re-sign-box {
  padding: 16px;
  background: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.re-sign-desc {
  font-size: 13px;
  color: #e6a23c;
  line-height: 1.8;

  code {
    background: #faecd8;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 12px;
    color: #b88230;
  }
}
</style>
