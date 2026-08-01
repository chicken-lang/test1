<template>
  <div class="page-container">
    <h3 class="section-title">修改登录密码</h3>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="password-form"
    >
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          placeholder="请输入当前密码"
          show-password
          autocomplete="current-password"
        />
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          placeholder="至少8位，需含大小写字母、数字及特殊字符"
          show-password
          autocomplete="new-password"
        />
        <!-- 密码强度指示器 -->
        <div v-if="form.newPassword" class="strength-meter">
          <div class="strength-bars">
            <span
              v-for="i in 4"
              :key="i"
              class="strength-bar"
              :class="{ active: i <= strengthLevel, [strengthClass]: i <= strengthLevel }"
            />
          </div>
          <span class="strength-label" :class="strengthClass">{{ strengthText }}</span>
        </div>
      </el-form-item>

      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确认修改密码
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="password-tip">
      <p>密码要求：</p>
      <ul>
        <li>密码长度不少于 8 位</li>
        <li>必须包含大写字母、小写字母、数字及特殊字符</li>
        <li>新密码不能与旧密码相同</li>
        <li>修改成功后需使用新密码重新登录</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { changePassword } from '~/composables/adminApi'
import { useCrypto } from '~/composables/useCrypto'
import { useAuthStore } from '~/stores/cmsAuth'
import { PasswordRules } from '~/utils/types'

definePageMeta({ layout: 'admin' })

const formRef = ref<FormInstance>()
const submitting = ref(false)
const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// ========== 密码强度计算 ==========
const strengthLevel = computed(() => {
  const pwd = form.newPassword
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++
  return Math.min(score, 4)
})

const strengthClass = computed(() => {
  const map = ['weak', 'weak', 'medium', 'good', 'strong'] as const
  return map[strengthLevel.value] || 'weak'
})

const strengthText = computed(() => {
  const map: Record<number, string> = { 0: '', 1: '弱', 2: '弱', 3: '中', 4: '强' }
  return map[strengthLevel.value] || ''
})

// ========== 表单校验规则 ==========
/** 新密码复杂度校验（与 PasswordRules 对齐） */
const validateNewPassword = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入新密码'))
    return
  }
  if (value.length < PasswordRules.minLength) {
    callback(new Error(`密码长度不少于 ${PasswordRules.minLength} 位`))
    return
  }
  if (PasswordRules.requireUppercase && !/[A-Z]/.test(value)) {
    callback(new Error('需包含大写字母'))
    return
  }
  if (PasswordRules.requireLowercase && !/[a-z]/.test(value)) {
    callback(new Error('需包含小写字母'))
    return
  }
  if (PasswordRules.requireNumber && !/\d/.test(value)) {
    callback(new Error('需包含数字'))
    return
  }
  if (PasswordRules.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    callback(new Error('需包含特殊字符'))
    return
  }
  // 新旧密码不能相同
  if (form.oldPassword && value === form.oldPassword) {
    callback(new Error('新密码不能与旧密码相同'))
    return
  }
  callback()
}

/** 确认密码一致性校验 */
const validateConfirm = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
    return
  }
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const rules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { validator: validateNewPassword, trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

// ========== 提交修改 ==========
async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    // 1. 加密密码（RSA 优先，失败降级 SHA-256，与登录流程一致）
    const { encrypt } = useCrypto()
    const { cipher: oldCipher, keyVersion: oldKv } = await encrypt(form.oldPassword)
    const { cipher: newCipher, keyVersion: newKv } = await encrypt(form.newPassword)

    // 两次加密使用同一公钥，keyVersion 应一致
    const keyVersion = oldKv || newKv

    // 2. 调用后端 API
    const res = await changePassword({
      oldPassword: oldCipher,
      newPassword: newCipher,
      keyVersion,
    })

    if (res.code === 0) {
      ElMessage.success('密码修改成功，即将跳转登录页')
      formRef.value.resetFields()
      // 3. 清除本地认证状态并跳转登录页（后端已撤销全部 Token）
      setTimeout(async () => {
        await authStore.logout()
        router.replace('/admin/login')
      }, 1200)
    } else {
      ElMessage.error(res.message || '密码修改失败')
    }
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || ''
    if (msg.includes('旧密码')) {
      ElMessage.error('旧密码错误，请重新输入')
    } else if (msg.includes('不能与旧密码相同')) {
      ElMessage.error('新密码不能与旧密码相同')
    } else if (msg.includes('频繁')) {
      ElMessage.error('操作过于频繁，请5分钟后再试')
    } else if (msg.includes('令牌') || msg.includes('过期') || err?.statusCode === 401) {
      ElMessage.error('登录已过期，请重新登录')
      setTimeout(() => router.replace('/admin/login'), 1200)
    } else {
      ElMessage.error(msg || '密码修改失败，请稍后重试')
    }
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formRef.value?.resetFields()
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.password-form {
  max-width: 480px;
}

/* 密码强度指示器 */
.strength-meter {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-bars {
  display: flex;
  gap: 4px;
}

.strength-bar {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #dcdfe6;
  transition: background 0.3s ease;

  &.active.weak {
    background: #f56c6c;
  }
  &.active.medium {
    background: #e6a23c;
  }
  &.active.good {
    background: #409eff;
  }
  &.active.strong {
    background: #67c23a;
  }
}

.strength-label {
  font-size: 12px;
  &.weak { color: #f56c6c; }
  &.medium { color: #e6a23c; }
  &.good { color: #409eff; }
  &.strong { color: #67c23a; }
}

.password-tip {
  margin-top: 16px;
  padding: 16px 20px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  font-size: 13px;
  color: #e6a23c;
  line-height: 1.8;

  p {
    font-weight: 600;
    margin-bottom: 4px;
  }

  ul {
    padding-left: 18px;
    margin: 0;
  }

  li {
    list-style: disc;
  }
}
</style>
