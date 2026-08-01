<template>
  <!-- SSO 回调页: 校园统一身份认证中心回调后处理 code 交换 -->
  <div class="sso-callback">
    <div class="callback-card">
      <div v-if="processing" class="callback-loading">
        <el-icon class="is-loading" :size="40" color="#0073BD">
          <Loading />
        </el-icon>
        <p class="callback-text">正在验证校园身份，请稍候...</p>
        <p class="callback-hint">正在与校园认证中心交换凭证</p>
      </div>

      <div v-else-if="errorMsg" class="callback-error">
        <Icon icon="mdi:alert-circle" :width="48" :height="48" class="error-icon" />
        <p class="error-text">{{ errorMsg }}</p>
        <el-button type="primary" @click="goLogin">返回登录页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SSO 回调处理页
 * 校园认证中心认证成功后重定向到: /admin/sso/callback?code=xxx
 * 本页面提取 code → 调用后端 /api/auth/sso/exchange → 获取 Token → 跳转后台首页
 */
import { Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '~/stores/cmsAuth'

definePageMeta({ layout: false })
useSeoMeta({ title: '认证中 - 教务处管理系统' })

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const processing = ref(true)
const errorMsg = ref('')

onMounted(async () => {
  const code = route.query.code as string | undefined

  if (!code) {
    processing.value = false
    errorMsg.value = '认证回调参数缺失，请重新登录'
    return
  }

  try {
    // 调用 Store 中的 SSO 登录方法（code 换 token）
    await authStore.loginWithSso(code)
    ElMessage.success('认证登录成功')
    router.replace('/admin')
  } catch (err: any) {
    processing.value = false
    const msg = err?.data?.message || err?.message || ''
    if (msg.includes('not bound') || msg.includes('未绑定')) {
      errorMsg.value = '该校园账号尚未绑定系统权限，请联系管理员开通'
    } else if (msg.includes('expired') || msg.includes('过期')) {
      errorMsg.value = '认证凭证已过期，请重新登录'
    } else if (msg.includes('invalid') || msg.includes('无效')) {
      errorMsg.value = '认证凭证无效，请重新登录'
    } else {
      errorMsg.value = msg || '认证失败，请稍后重试'
    }
  }
})

const goLogin = () => {
  router.replace('/admin/login')
}
</script>

<style lang="scss" scoped>
.sso-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #005a8e 0%, #003d66 100%);
  padding: $space-6;
}

.callback-card {
  width: 400px;
  background: #fff;
  border-radius: $radius-xl;
  padding: $space-10 $space-8;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  text-align: center;
}

.callback-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.callback-text {
  font-size: $fs-md;
  color: $text-primary;
  font-weight: $fw-medium;
  margin: $space-3 0 0;
}

.callback-hint {
  font-size: $fs-sm;
  color: $text-placeholder;
  margin: 0;
}

.callback-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.error-icon {
  color: $danger;
}

.error-text {
  font-size: $fs-md;
  color: $text-primary;
  margin: $space-2 0;
  line-height: 1.6;
}

@include respond-to(xs) {
  .callback-card {
    width: 100%;
    padding: $space-8 $space-5;
  }
}
</style>
