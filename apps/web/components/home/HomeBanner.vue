<template>
  <section
    v-reveal
    class="home-banner reveal"
    role="region"
    aria-roledescription="轮播图"
    aria-label="教务处动态轮播"
  >
    <el-carousel
      ref="carouselRef"
      height="440px"
      :interval="6000"
      arrow="hover"
      indicator-position="none"
      @change="onSlideChange"
    >
      <el-carousel-item v-for="(banner, idx) in banners" :key="banner.id">
        <NuxtLink
          :to="banner.linkUrl"
          class="banner-item"
          :aria-label="`${banner.title} - 查看详情`"
          :aria-current="idx === activeIndex ? 'true' : undefined"
        >
          <img
            :src="banner.imageUrl"
            :alt="banner.title"
            class="banner-img"
            loading="lazy"
            decoding="async"
          />
          <div class="banner-overlay"></div>
          <div class="banner-content">
            <div class="banner-tag">
              <Icon :icon="icons.starFour" :width="14" :height="14" />
              <span>教务动态</span>
            </div>
            <h2 class="banner-title">{{ banner.title }}</h2>
            <div class="banner-line"></div>
            <p class="banner-desc">{{ banner.description }}</p>
            <span class="banner-btn">
              查看详情
              <Icon :icon="icons.arrowRight" :width="16" :height="16" />
            </span>
          </div>
        </NuxtLink>
      </el-carousel-item>
    </el-carousel>

    <!-- 自定义指示器(底部进度,ARIA 适配) -->
    <div class="banner-indicators" role="tablist" aria-label="轮播切换">
      <button
        v-for="(banner, idx) in banners"
        :key="banner.id"
        type="button"
        class="indicator-dot"
        :class="{ active: idx === activeIndex }"
        :aria-label="`切换到第 ${idx + 1} 张:${banner.title}`"
        :aria-selected="idx === activeIndex ? 'true' : 'false'"
        role="tab"
        @click="goToSlide(idx)"
      ></button>
    </div>
  </section>
</template>

<script setup lang="ts">
// HomeBanner v3.0: 沉浸式全宽轮播 + ARIA 适配 + icons 字典 + v-reveal 入场
import { banners } from '~/mock/data'
import { icons } from '~/utils/icons'
import type { CarouselInstance } from 'element-plus'

// 当前激活幻灯片索引(用于自定义指示器联动 + aria-selected)
const activeIndex = ref(0)
// el-carousel 实例引用
const carouselRef = ref<CarouselInstance | null>(null)

// el-carousel @change 回调,参数为当前索引
function onSlideChange(idx: number) {
  activeIndex.value = idx
}

// 点击自定义指示器切换幻灯片
function goToSlide(idx: number) {
  carouselRef.value?.setActiveItem(idx)
}
</script>

<style lang="scss" scoped>
.home-banner {
  position: relative;
  width: 100%;
  margin-bottom: $space-8;
}

.banner-item {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &:focus-visible {
    outline: 3px solid $focus-ring;
    outline-offset: -3px;
  }
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 8s ease;

  .banner-item:hover & {
    transform: scale(1.05);
  }
}

// 渐变遮罩(左侧深,右侧透明,文字可读)
.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(0, 42, 82, 0.85) 0%,
    rgba(0, 42, 82, 0.6) 40%,
    rgba(0, 42, 82, 0.2) 70%,
    transparent 100%
  );
}

// 文字内容(左下)
.banner-content {
  position: absolute;
  left: 0;
  bottom: 0;
  top: 0;
  max-width: 560px;
  padding: $space-12 $space-12;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
}

.banner-tag {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-1 $space-3;
  background: rgba(184, 149, 106, 0.25);
  border: 1px solid rgba(212, 184, 138, 0.4);
  border-radius: $radius-pill;
  font-size: $fs-xs;
  letter-spacing: 2px;
  color: $gold-light;
  margin-bottom: $space-4;
  align-self: flex-start;

  :deep(svg) {
    color: $gold-light;
  }
}

.banner-title {
  font-size: $fs-4xl;
  font-weight: $fw-bold;
  line-height: $lh-tight;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: $space-4;
}

.banner-line {
  width: 48px;
  height: 3px;
  background: $grad-gold;
  border-radius: $radius-pill;
  margin-bottom: $space-4;
}

.banner-desc {
  font-size: $fs-md;
  line-height: $lh-relaxed;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: $space-6;
  @include text-ellipsis(2);
}

.banner-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-6;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: $radius-pill;
  font-size: $fs-base;
  color: #fff;
  backdrop-filter: blur(8px);
  transition: all $transition-base;
  align-self: flex-start;

  .banner-item:hover & {
    background: $grad-gold;
    border-color: transparent;
    gap: $space-3;
  }
}

// 底部指示器
.banner-indicators {
  position: absolute;
  bottom: $space-6;
  right: $space-12;
  display: flex;
  gap: $space-2;
  z-index: $z-base;
}

.indicator-dot {
  width: 24px;
  height: 3px;
  padding: 0;
  border: none;
  background: rgba(255, 255, 255, 0.4);
  border-radius: $radius-pill;
  transition: all $transition-base;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.7);
  }

  &.active {
    width: 40px;
    background: $grad-gold;
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

// 移动端
@include respond-to(xs) {
  .home-banner {
    :deep(.el-carousel) {
      height: 280px !important;
    }
  }

  .banner-content {
    max-width: 100%;
    padding: $space-6 $space-5;
  }

  .banner-title {
    font-size: $fs-xl;
  }

  .banner-desc {
    font-size: $fs-sm;
    -webkit-line-clamp: 1;
  }

  .banner-indicators {
    right: $space-5;
    bottom: $space-4;
  }
}
</style>
