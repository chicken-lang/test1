<template>
  <section class="home-quick">
    <!-- 区块标题(中英文对照) -->
    <div class="section-header">
      <div class="section-title-group">
        <span class="title-cn">快速通道</span>
        <span class="title-en">Quick Access</span>
      </div>
    </div>

    <div class="quick-grid">
      <a
        v-for="link in quickLinks"
        :key="link.id"
        :href="link.url"
        class="quick-card"
        target="_blank"
        rel="noopener noreferrer"
      >
        <!-- 顶部金色装饰条 -->
        <span class="card-top"></span>
        <div class="card-body">
          <div class="card-icon">
            <Icon :icon="link.icon" width="22" height="22" />
          </div>
          <div class="card-text">
            <span class="card-title">{{ link.title }}</span>
            <span class="card-category">{{ link.category }}</span>
          </div>
          <Icon icon="mdi:arrow-top-right" class="card-arrow" width="14" height="14" />
        </div>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
// HomeQuickLink v2.0: 卡片化设计(去圆形图标,采用顶边装饰+方形图标+类别副标)
import { quickLinks } from '~/mock/data'
</script>

<style lang="scss" scoped>
.home-quick {
  margin-bottom: $space-10;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: $space-4;
}

.quick-card {
  position: relative;
  display: block;
  background: $bg-card;
  border-radius: $radius-base;
  overflow: hidden;
  box-shadow: $shadow-xs;
  transition: all $transition-base;

  // 顶部装饰条(默认透明)
  .card-top {
    display: block;
    height: 3px;
    background: transparent;
    transition: all $transition-base;
  }

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-3px);

    .card-top {
      background: $grad-gold;
    }

    .card-icon {
      background: $grad-primary;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 91, 172, 0.3);
    }

    .card-title {
      color: $primary;
    }

    .card-arrow {
      opacity: 1;
      transform: translate(0, 0);
      color: $gold;
    }
  }
}

.card-body {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: $radius-base;
  background: $primary-bg;
  color: $primary;
  transition: all $transition-base;

  :deep(svg) {
    transition: color $transition-base;
  }
}

.card-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: $text-primary;
  line-height: 1.3;
  @include text-ellipsis(1);
  transition: color $transition-fast;
}

.card-category {
  font-size: $fs-xs;
  color: $text-placeholder;
  letter-spacing: 0.5px;
}

.card-arrow {
  flex-shrink: 0;
  color: $text-placeholder;
  opacity: 0;
  transform: translate(-4px, 4px);
  transition: all $transition-base;
}

// 移动端
@include respond-to(xs) {
  .quick-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: $space-3;
  }

  .card-body {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-2;
    padding: $space-3;
  }

  .card-icon {
    width: 38px;
    height: 38px;
  }

  .card-arrow {
    display: none;
  }

  .card-category {
    display: none;
  }
}
</style>
