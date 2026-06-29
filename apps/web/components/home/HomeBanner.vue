<template>
  <section class="home-banner">
    <el-carousel height="360px" :interval="5000" arrow="hover" indicator-position="outside">
      <el-carousel-item v-for="banner in banners" :key="banner.id">
        <NuxtLink :to="banner.linkUrl" class="banner-item">
          <img :src="banner.imageUrl" :alt="banner.title" class="banner-img" />
          <div class="banner-overlay">
            <h2 class="banner-title">{{ banner.title }}</h2>
          </div>
        </NuxtLink>
      </el-carousel-item>
    </el-carousel>
  </section>
</template>

<script setup lang="ts">
// 首页 Banner 轮播(FR-01.02,≥3 张,PC+移动)
import { banners } from '~/mock/data'
</script>

<style lang="scss" scoped>
.home-banner {
  width: 100%;
  margin-bottom: 24px;
}

.banner-item {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  padding: 40px 30px 24px;
}

.banner-title {
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  @include text-ellipsis(2);
}

@include respond-to(xs) {
  .banner-title {
    font-size: 16px;
  }
}
</style>
