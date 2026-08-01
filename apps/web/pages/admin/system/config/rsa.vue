<template>
  <div class="page-container">
    <h3 class="section-title">RSA 密钥管理</h3>

    <div class="rsa-layout" v-loading="loading">
      <!-- 当前密钥状态 -->
      <el-card class="status-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>当前密钥状态</span>
            <el-tag :type="keyStatus.hasKey ? 'success' : 'danger'" size="small">
              {{ keyStatus.hasKey ? '已配置' : '未配置' }}
            </el-tag>
          </div>
        </template>

        <template v-if="keyStatus.activeKey">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="密钥版本">{{ keyStatus.activeKey.version }}</el-descriptions-item>
            <el-descriptions-item label="生成时间">{{ formatTime(keyStatus.activeKey.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="操作人">{{ keyStatus.activeKey.createdBy || '-' }}</el-descriptions-item>
            <el-descriptions-item label="密钥总数">{{ keyStatus.totalKeys }} 把</el-descriptions-item>
          </el-descriptions>
        </template>

        <el-empty v-else description="尚未生成 RSA 密钥对，登录将使用 SHA-256 兼容模式" :image-size="80" />
      </el-card>

      <!-- 操作区域 -->
      <el-card class="action-card" shadow="never">
        <template #header>
          <span>密钥操作</span>
        </template>

        <div class="action-section">
          <h4>生成新密钥对</h4>
          <p class="action-desc">
            生成 RSA 2048 位密钥对。公钥用于前端登录密码加密，私钥使用 AES-256-GCM 加密后安全存储。
            生成新密钥后，旧密钥将自动失效，已在线用户需重新登录。
          </p>
          <el-button
            type="primary"
            :loading="generating"
            @click="handleGenerate"
          >
            {{ keyStatus.hasKey ? '重新生成密钥对' : '生成密钥对' }}
          </el-button>
        </div>

        <el-divider />

        <div class="action-section">
          <h4>公钥预览</h4>
          <p class="action-desc">公钥可公开分发，用于前端 RSA 加密。</p>
          <el-input
            v-if="publicKeyPreview"
            type="textarea"
            :model-value="publicKeyPreview"
            :rows="6"
            readonly
            class="public-key-display"
          />
          <el-button
            v-if="publicKeyPreview"
            size="small"
            @click="copyPublicKey"
            style="margin-top: 8px"
          >
            复制公钥
          </el-button>
          <span v-else class="no-key-hint">暂无公钥，请先生成密钥对</span>
        </div>
      </el-card>

      <!-- 历史密钥记录 -->
      <el-card v-if="keyStatus.allKeys && keyStatus.allKeys.length > 0" class="history-card" shadow="never">
        <template #header>
          <span>密钥历史记录</span>
        </template>
        <el-table :data="keyStatus.allKeys" border stripe size="small">
          <el-table-column prop="version" label="版本" width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                {{ row.isActive ? '活跃' : '已废弃' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="生成时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="createdBy" label="操作人" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface KeyInfo {
  id: number
  version: string
  isActive: boolean
  createdAt: string
  createdBy: string | null
}

const loading = ref(false)
const generating = ref(false)
const publicKeyPreview = ref('')

const keyStatus = reactive<{
  hasKey: boolean
  activeKey: KeyInfo | null
  totalKeys: number
  allKeys: KeyInfo[]
}>({
  hasKey: false,
  activeKey: null,
  totalKeys: 0,
  allKeys: [],
})

function formatTime(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadKeyStatus() {
  loading.value = true
  try {
    const token = localStorage.getItem('sziit-cms-auth')
    const auth = token ? JSON.parse(token) : null
    const headers: Record<string, string> = {}
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`

    const res = await $fetch<any>('/api/rsa/status', { headers })
    if (res?.code === 0 && res.data) {
      keyStatus.hasKey = res.data.hasKey
      keyStatus.activeKey = res.data.activeKey
      keyStatus.totalKeys = res.data.totalKeys
      keyStatus.allKeys = res.data.allKeys || []

      // 如果有活跃密钥，获取公钥预览
      if (keyStatus.hasKey) {
        const pubRes = await $fetch<any>('/api/auth/public-key')
        if (pubRes?.code === 0 && pubRes.data?.publicKey) {
          publicKeyPreview.value = pubRes.data.publicKey
        }
      }
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '加载密钥状态失败')
  } finally {
    loading.value = false
  }
}

async function handleGenerate() {
  try {
    await ElMessageBox.confirm(
      keyStatus.hasKey
        ? '重新生成密钥对将使旧密钥失效，所有在线用户需重新登录。确定继续？'
        : '确定要生成 RSA 2048 位密钥对吗？',
      '确认操作',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  generating.value = true
  try {
    const token = localStorage.getItem('sziit-cms-auth')
    const auth = token ? JSON.parse(token) : null
    const headers: Record<string, string> = {}
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`

    const res = await $fetch<any>('/api/rsa/generate', { method: 'POST', headers })
    if (res?.code === 0) {
      ElMessage.success('RSA 密钥对生成成功')
      await loadKeyStatus()
    } else {
      ElMessage.error(res?.message || '生成失败')
    }
  } catch (err: any) {
    ElMessage.error(err?.statusMessage || err?.message || '生成密钥对失败')
  } finally {
    generating.value = false
  }
}

function copyPublicKey() {
  if (!publicKeyPreview.value) return
  navigator.clipboard.writeText(publicKeyPreview.value).then(() => {
    ElMessage.success('公钥已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动选择复制')
  })
}

onMounted(() => {
  loadKeyStatus()
})
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.rsa-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-section {
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 8px;
  }
}

.action-desc {
  font-size: 13px;
  color: #909399;
  margin: 0 0 16px;
  line-height: 1.6;
}

.public-key-display {
  :deep(textarea) {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
    background: #f5f7fa;
  }
}

.no-key-hint {
  font-size: 13px;
  color: #c0c4cc;
}
</style>
