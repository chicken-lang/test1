<template>
  <div class="admin-login">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="deco-circle deco-circle-1"></div>
      <div class="deco-circle deco-circle-2"></div>
      <div class="deco-circle deco-circle-3"></div>
      <div class="deco-grid"></div>
    </div>

    <div class="login-content">
      <!-- 顶部品牌区 -->
      <div class="login-brand">
        <div class="brand-logo-wrap">
          <img src="/images/logo/logo-square-blue.png" alt="校徽" class="brand-logo" />
        </div>
        <h1 class="brand-title">教务处管理系统</h1>
        <p class="brand-sub">深圳信息职业技术大学 · 内容管理平台</p>
        <span class="brand-badge">管理员登录入口</span>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card">
        <!-- Tab 切换 -->
        <div class="login-tabs" role="tablist">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'sso' }"
            role="tab"
            :aria-selected="activeTab === 'sso'"
            @click="activeTab = 'sso'"
          >
            <Icon icon="mdi:shield-account" :width="18" :height="18" />
            <span>统一身份认证</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'local' }"
            role="tab"
            :aria-selected="activeTab === 'local'"
            @click="activeTab = 'local'"
          >
            <Icon icon="mdi:account-key" :width="18" :height="18" />
            <span>账号密码登录</span>
          </button>
          <div class="tab-indicator" :class="activeTab"></div>
        </div>

        <!-- SSO 面板 -->
        <div v-show="activeTab === 'sso'" class="tab-panel sso-panel">
          <div class="sso-icon-box">
            <div class="sso-icon-bg">
              <Icon icon="mdi:shield-account" :width="56" :height="56" class="sso-icon" />
            </div>
          </div>
          <h3 class="sso-title">校园统一身份认证</h3>
          <p class="sso-desc">使用校园工号和统一身份密码登录</p>
          <button
            class="btn-primary sso-btn"
            :disabled="ssoLoading"
            @click="handleSsoLogin"
          >
            <Icon v-if="ssoLoading" icon="mdi:loading" :width="18" :height="18" class="spin" />
            <Icon v-else icon="mdi:school" :width="18" :height="18" />
            <span>{{ ssoLoading ? '跳转中...' : '校园统一身份认证登录' }}</span>
          </button>
          <p class="sso-note">
            首次登录将自动绑定系统账号<br />
            如遇认证问题请联系技术支持
          </p>
        </div>

        <!-- 本地登录面板 -->
        <div v-show="activeTab === 'local'" class="tab-panel local-panel">
          <form class="login-form" @submit.prevent="handleLocalLogin">
            <div class="form-group">
              <div class="input-wrapper">
                <Icon icon="mdi:account-circle" :width="20" :height="20" class="input-icon" />
                <input
                  v-model="loginForm.username"
                  type="text"
                  placeholder="请输入工号 / 账号"
                  class="form-input"
                  autocomplete="username"
                  @keyup.enter="handleLocalLogin"
                />
              </div>
            </div>
            <div class="form-group">
              <div class="input-wrapper">
                <Icon icon="mdi:lock" :width="20" :height="20" class="input-icon" />
                <input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="请输入密码"
                  class="form-input"
                  autocomplete="current-password"
                  @keyup.enter="handleLocalLogin"
                />
              </div>
            </div>
            <button
              class="btn-primary login-btn"
              :disabled="localLoading || !loginForm.username || !loginForm.password"
              @click="handleLocalLogin"
            >
              <Icon v-if="localLoading" icon="mdi:loading" :width="18" :height="18" class="spin" />
              <span>{{ localLoading ? '登录中...' : '登 录' }}</span>
            </button>
          </form>
        </div>

        <!-- 安全提示 -->
        <div class="security-bar">
          <Icon icon="mdi:shield-check" :width="14" :height="14" />
          <span>仅限校内IP/VPN访问 · 连续5次错误锁定30分钟 · 15分钟无操作自动退出</span>
        </div>

        <!-- 返回首页按钮 -->
        <div class="back-home">
          <button class="btn-back-home" @click="goHome">
            <Icon icon="mdi:home" :width="16" :height="16" />
            <span>返回首页</span>
          </button>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="login-footer">
        <div class="footer-links">
          <a href="https://jwc.sziit.edu.cn" target="_blank" rel="noopener">教务处旧版入口</a>
          <span class="footer-divider">|</span>
          <span>技术支持: jszx@sziit.edu.cn</span>
          <span class="footer-divider">|</span>
          <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">{{ icpNumber }}</a>
        </div>
        <p class="footer-copyright">
          Copyright &copy; {{ new Date().getFullYear() }} 深圳信息职业技术大学 教务处
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/cmsAuth'

definePageMeta({ layout: false })
useSeoMeta({ title: '登录 - 教务处管理系统' })

const router = useRouter()
const authStore = useAuthStore()
const { icpNumber } = useRuntimeConfig().public

const activeTab = ref<'sso' | 'local'>('sso')
const localLoading = ref(false)
const ssoLoading = ref(false)

let loginDebounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 600

const loginForm = reactive({
  username: '',
  password: '',
})

onMounted(async () => {
  authStore.restoreAuth()
  if (authStore.isLoggedIn) {
    router.replace('/admin')
    return
  }
  authStore.preloadRsaKey()
})

const handleLocalLogin = async () => {
  if (localLoading.value || loginDebounceTimer) return

  const username = loginForm.username.trim()
  const password = loginForm.password.trim()

  if (!username || !password) {
    ElMessage.warning('账号和密码不能为空')
    return
  }

  loginDebounceTimer = setTimeout(() => {
    loginDebounceTimer = null
  }, DEBOUNCE_MS)

  localLoading.value = true
  try {
    await authStore.login(username, password)
    ElMessage.success('登录成功')
    router.push('/admin')
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || ''
    if (msg.includes('locked') || msg.includes('冻结') || msg.includes('锁定')) {
      ElMessage.error('账号已被锁定，请联系系统管理员解锁')
    } else if (msg.includes('password') || msg.includes('密码')) {
      ElMessage.error('密码错误，请重新输入')
    } else if (msg.includes('not found') || msg.includes('不存在')) {
      ElMessage.error('账号不存在，请检查工号是否正确')
    } else if (msg.includes('disabled') || msg.includes('禁用')) {
      ElMessage.error('账号已被禁用，请联系系统管理员')
    } else {
      ElMessage.error(msg || '登录失败，请稍后重试')
    }
  } finally {
    localLoading.value = false
    if (loginDebounceTimer) {
      clearTimeout(loginDebounceTimer)
      loginDebounceTimer = null
    }
  }
}

const handleSsoLogin = () => {
  if (ssoLoading.value) return
  ssoLoading.value = true

  try {
    const ssoBaseUrl = 'https://auth.sziit.edu.cn/cas/login'
    const callbackUrl = encodeURIComponent(
      `${window.location.origin}/admin/sso/callback`
    )
    const serviceParam = `?service=${callbackUrl}`
    const targetUrl = `${ssoBaseUrl}${serviceParam}`

    window.location.href = targetUrl
  } catch {
    ssoLoading.value = false
    ElMessage.error('跳转认证中心失败，请检查网络后重试')
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
/* ====== 整体布局 ====== */
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #005a8e 0%, #003d66 50%, #002d4d 100%);
  position: relative;
  overflow: hidden;
  padding: $space-6;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
}

.deco-circle-1 {
  width: 600px;
  height: 600px;
  top: -100px;
  right: -100px;
  animation: float 20s ease-in-out infinite;
}

.deco-circle-2 {
  width: 400px;
  height: 400px;
  bottom: -50px;
  left: -50px;
  animation: float 15s ease-in-out infinite reverse;
}

.deco-circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.05;
}

.deco-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(5deg); }
}

.login-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-8;
}

/* ====== 顶部品牌区 ====== */
.login-brand {
  text-align: center;
  color: #fff;
  animation: fadeInDown 0.6s ease-out;
}

.brand-logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: $space-4;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.brand-logo {
  width: 72px;
  height: 72px;
  filter: brightness(0) invert(1);
}

.brand-title {
  font-size: $fs-4xl;
  font-weight: $fw-bold;
  color: #fff;
  margin: 0 0 $space-2;
  letter-spacing: 4px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.brand-sub {
  font-size: $fs-base;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 $space-3;
  letter-spacing: 1px;
}

.brand-badge {
  display: inline-block;
  padding: 6px 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: $radius-pill;
  font-size: $fs-xs;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  letter-spacing: 1px;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ====== 登录卡片 ====== */
.login-card {
  width: 460px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: $radius-xl;
  padding: $space-10 $space-8;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ====== Tab 切换 ====== */
.login-tabs {
  display: flex;
  position: relative;
  background: rgba(0, 0, 0, 0.05);
  border-radius: $radius-lg;
  padding: 4px;
  margin-bottom: $space-8;
}

.tab-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  font-size: $fs-base;
  font-weight: $fw-medium;
  color: $text-secondary;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;

  &:hover {
    color: $primary;
    background: rgba($primary, 0.05);
  }

  &.active {
    color: #fff;
    font-weight: $fw-semibold;
  }
}

.tab-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 8px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  border-radius: $radius-md;
  box-shadow: 0 4px 12px rgba($primary, 0.3);
  transition: transform 0.3s ease;

  &.local {
    transform: translateX(100%);
  }
}

/* ====== SSO 面板 ====== */
.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.sso-panel {
  text-align: center;
}

.sso-icon-box {
  margin-bottom: $space-6;
}

.sso-icon-bg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.05) 100%);
  border-radius: 50%;
  border: 2px solid rgba($primary, 0.2);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.sso-icon {
  color: $primary;
}

.sso-title {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $text-primary;
  margin: 0 0 $space-2;
}

.sso-desc {
  font-size: $fs-sm;
  color: $text-secondary;
  margin: 0 0 $space-8;
}

.sso-btn {
  margin-bottom: $space-4;
}

.sso-note {
  font-size: $fs-xs;
  color: $text-placeholder;
  margin: 0;
  line-height: 1.8;
}

/* ====== 本地登录面板 ====== */
.local-panel {
  padding-top: $space-2;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.form-group {
  position: relative;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.03);
  border: 2px solid transparent;
  border-radius: $radius-lg;
  padding: 0 $space-4;
  transition: all 0.3s ease;

  &:focus-within {
    background: #fff;
    border-color: $primary;
    box-shadow: 0 0 0 4px rgba($primary, 0.1);
  }
}

.input-icon {
  color: $text-placeholder;
  margin-right: $space-3;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  height: 48px;
  border: none;
  outline: none;
  font-size: $fs-base;
  color: $text-primary;
  background: transparent;
  placeholder {
    color: $text-placeholder;
  }
}

/* ====== 按钮样式 ====== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: #fff;
  border: none;
  border-radius: $radius-lg;
  font-size: $fs-base;
  font-weight: $fw-semibold;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
  box-shadow: 0 4px 14px rgba($primary, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($primary, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.login-btn {
  letter-spacing: 6px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ====== 安全提示 ====== */
.security-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: $space-6;
  padding-top: $space-5;
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

/* ====== 返回首页按钮 ====== */
.back-home {
  display: flex;
  justify-content: center;
  margin-top: $space-4;
}

.btn-back-home {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-4;
  font-size: $fs-sm;
  color: $text-secondary;
  background: transparent;
  border: 1px solid $border-light;
  border-radius: $radius-base;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    color: $primary;
    border-color: $primary;
    background: rgba($primary, 0.05);
  }

  :deep(svg) {
    flex-shrink: 0;
  }
}

/* ====== 底部信息 ====== */
.login-footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: $fs-xs;
  line-height: 2;
  animation: fadeIn 0.6s ease-out 0.4s both;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  flex-wrap: wrap;

  a {
    color: rgba(255, 255, 255, 0.75);
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
      color: #fff;
      text-decoration: underline;
    }
  }
}

.footer-divider {
  color: rgba(255, 255, 255, 0.3);
}

.footer-copyright {
  margin: $space-2 0 0;
  color: rgba(255, 255, 255, 0.45);
}

/* ====== 响应式适配 ====== */
@media (max-width: 640px) {
  .login-card {
    width: 100%;
    padding: $space-8 $space-6;
    border-radius: $radius-xl;
  }

  .brand-logo-wrap {
    width: 80px;
    height: 80px;
  }

  .brand-logo {
    width: 56px;
    height: 56px;
  }

  .brand-title {
    font-size: $fs-2xl;
    letter-spacing: 2px;
  }

  .brand-sub {
    font-size: $fs-sm;
  }

  .tab-btn {
    padding: $space-2 $space-3;
    font-size: $fs-sm;
  }

  .sso-icon-bg {
    width: 80px;
    height: 80px;
  }

  .sso-icon {
    width: 40px;
    height: 40px;
  }

  .sso-title {
    font-size: $fs-lg;
  }

  .btn-primary {
    height: 44px;
    font-size: $fs-sm;
  }

  .footer-links {
    flex-direction: column;
    gap: $space-1;

    .footer-divider {
      display: none;
    }
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: $space-6 $space-4;
  }

  .admin-login {
    padding: $space-4;
  }
}
</style>