<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <SchoolEmblem variant="horizontal" color="blue" :size="56" class="login-emblem" />
        <h1 class="login-title">{{ roleLabel }}登录</h1>
        <p class="login-subtitle">深圳信息职业技术大学 · 统一身份认证</p>
      </div>

      <div class="sso-section">
        <div class="sso-icon-wrap">
          <Icon icon="mdi:shield-account" :width="48" :height="48" class="sso-icon" />
        </div>
        <p class="sso-tip">使用校园工号和统一身份密码登录</p>
        <button class="btn-primary" type="button" :disabled="ssoLoading" @click="gotoSSO">
          <Icon v-if="ssoLoading" icon="mdi:loading" :width="18" :height="18" class="spin" />
          <Icon v-else icon="mdi:school" :width="18" :height="18" />
          <span>{{ ssoLoading ? '跳转中...' : '校园统一身份认证登录' }}</span>
        </button>
        <p class="sso-note">
          首次登录将自动创建系统账号<br />
          如遇认证问题请联系技术支持
        </p>
      </div>

      <div class="security-notice">
        <Icon icon="mdi:shield-check" :width="14" :height="14" />
        <span>仅限校内IP/VPN访问 · 15分钟无操作自动退出</span>
      </div>

      <div class="login-footer">
        <NuxtLink to="/" class="back-home">
          <Icon icon="mdi:arrow-left" :width="14" :height="14" />
          返回首页
        </NuxtLink>
        <span class="footer-dot">·</span>
        <NuxtLink to="/admin/login" class="back-admin">管理后台</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()

const role = computed(() => {
  const r = route.params.role as string
  return r === 'teacher' ? 'teacher' : 'student'
})
const roleLabel = computed(() => (role.value === 'student' ? '学生' : '教师'))

const ssoLoading = ref(false)

const FALLBACK_SSO_URL = 'https://auth.sziit.edu.cn/cas/login'

const gotoSSO = async () => {
  if (ssoLoading.value) return
  ssoLoading.value = true

  try {
    const data = await $fetch<{
      url: string
      state?: string
      fromFallback?: boolean
    }>('/api/auth/sso/authorize', {
      method: 'GET',
      params: { role: role.value },
      timeout: 10000,
    })

    if (data?.url) {
      if (data.fromFallback) {
        console.warn('[SSO] 使用降级模式的授权 URL')
      }
      window.location.href = data.url
    } else {
      throw new Error('未获取到授权 URL')
    }
  } catch (err) {
    console.error('[SSO] 获取授权 URL 失败，使用降级方案:', err)
    const callbackUrl = encodeURIComponent(
      `${window.location.origin}/login/sso/callback?role=${role.value}`
    )
    const targetUrl = `${FALLBACK_SSO_URL}?service=${callbackUrl}`
    ElMessage.warning('认证中心暂时不可用，使用备用链接跳转')
    window.location.href = targetUrl
  }
}

useSeoMeta({
  title: () => `${roleLabel.value}登录 - 深圳信息职业技术大学教务处`,
  description: '深圳信息职业技术大学统一身份认证登录',
})
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #005a8e 0%, #003d66 100%);
  padding: $space-4;
}

.login-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: $radius-xl;
  padding: $space-10 $space-8;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.login-header {
  text-align: center;
  margin-bottom: $space-8;
}

.login-emblem {
  margin: 0 auto $space-4;
  display: block;
}

.login-title {
  font-size: $fs-2xl;
  font-weight: $fw-bold;
  color: $text-primary;
  margin-bottom: $space-2;
}

.login-subtitle {
  font-size: $fs-sm;
  color: $text-secondary;
}

.sso-section {
  text-align: center;
}

.sso-icon-wrap {
  margin-bottom: $space-4;
  color: $primary;
}

.sso-icon {
  color: $primary;
}

.sso-tip {
  font-size: $fs-sm;
  color: $text-secondary;
  margin: 0 0 $space-6;
}

.sso-note {
  font-size: $fs-xs;
  color: $text-placeholder;
  margin: $space-4 0 0;
  line-height: 1.8;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  width: 100%;
  height: 44px;
  background: $primary;
  color: #fff;
  border: none;
  border-radius: $radius-base;
  font-size: $fs-md;
  font-weight: $fw-medium;
  cursor: pointer;
  transition: all $transition-fast;
  letter-spacing: 1px;

  &:hover:not(:disabled) {
    background: $primary-dark;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.security-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: 1px solid $border-lighter;
  font-size: 11px;
  color: $text-placeholder;
  text-align: center;
  line-height: 1.6;

  :deep(svg) {
    color: $success;
    flex-shrink: 0;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  margin-top: $space-6;
  padding-top: $space-4;
  border-top: 1px solid $border-lighter;
  text-align: center;
  font-size: $fs-sm;

  a {
    color: $text-secondary;
    display: inline-flex;
    align-items: center;
    gap: 2px;

    &:hover {
      color: $primary;
    }
  }

  .footer-dot {
    margin: 0 $space-2;
    color: $border-base;
  }
}
</style>