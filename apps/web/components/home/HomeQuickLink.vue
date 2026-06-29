<template>
  <section class="home-quick">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-bar"></span>
        快速通道
      </h2>
    </div>

    <div class="quick-grid">
      <a
        v-for="link in quickLinks"
        :key="link.id"
        :href="link.url"
        class="quick-item"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="quick-icon">
          <Icon :icon="link.icon" width="28" height="28" />
        </div>
        <span class="quick-title">{{ link.title }}</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
// 首页快速通道(FR-01.05: ≥6 入口,对应 FR-17 外部系统)
import { quickLinks } from '~/mock/data'
</script>

<style lang="scss" scoped>
.home-quick {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
}

.title-bar {
  width: 4px;
  height: 20px;
  background: $primary;
  border-radius: 2px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 8px;
  background: $bg-card;
  border-radius: $radius-lg;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 91, 172, 0.12);

    .quick-icon {
      background: $primary;
      color: #fff;
    }

    .quick-title {
      color: $primary;
    }
  }
}

.quick-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: $primary-bg;
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.quick-title {
  font-size: 14px;
  color: $text-regular;
  text-align: center;
  @include text-ellipsis(1);
}

@include respond-to(xs) {
  .quick-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .quick-icon {
    width: 44px;
    height: 44px;
  }

  .quick-title {
    font-size: 12px;
  }
}
</style>
