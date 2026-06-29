<template>
  <header class="app-header">
    <div class="container header-inner">
      <!-- 左侧:校徽 + 校名 + 部门名(FR-01.01) -->
      <div class="header-logo">
        <div class="logo-badge">
          <Icon icon="mdi:school" width="44" height="44" />
        </div>
        <div class="logo-text">
          <h1 class="school-name">深圳信息职业技术大学</h1>
          <p class="dept-name">教务处</p>
        </div>
      </div>

      <!-- 右侧:快捷功能 -->
      <div class="header-tools">
        <NuxtLink to="/search" class="tool-item" aria-label="搜索">
          <Icon icon="mdi:magnify" width="18" height="18" />
          <span>搜索</span>
        </NuxtLink>
        <NuxtLink to="/user" class="tool-item" aria-label="登录">
          <Icon icon="mdi:account" width="18" height="18" />
          <span>登录</span>
        </NuxtLink>
        <button class="tool-item" aria-label="收藏" @click="toggleFav">
          <Icon icon="mdi:bookmark-outline" width="18" height="18" />
          <span>收藏</span>
        </button>
        <!-- 无障碍/适老化入口(FR-01.14) -->
        <button class="tool-item" aria-label="无障碍" @click="toggleElderly">
          <Icon icon="mdi:eye" width="18" height="18" />
          <span>适老化</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// AppHeader: 校徽 + 校名 + 部门名 + 快捷功能
// 对应 FR-01.01 LOGO 区

// 适老化模式切换(对应 T3.6 无障碍/适老化)
const colorMode = useColorMode()
const toggleElderly = () => {
  colorMode.preference = colorMode.preference === 'elderly' ? 'light' : 'elderly'
}

// 收藏(前端占位,后续接 API)
const toggleFav = () => {
  ElMessage.info('收藏功能开发中')
}
</script>

<style lang="scss" scoped>
.app-header {
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: #fff;
  height: $header-height;
  display: flex;
  align-items: center;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-badge {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.school-name {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1.3;
}

.dept-name {
  font-size: 18px;
  letter-spacing: 8px;
  opacity: 0.95;
  margin-top: 4px;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  border-radius: $radius-base;
  cursor: pointer;
  background: transparent;
  border: none;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
}

// 移动端适配
@include respond-to(xs) {
  .app-header {
    height: auto;
    padding: 12px 0;
  }

  .school-name {
    font-size: 18px;
    letter-spacing: 1px;
  }

  .dept-name {
    font-size: 14px;
    letter-spacing: 4px;
  }

  .header-tools {
    .tool-item span {
      display: none;
    }
  }
}
</style>
