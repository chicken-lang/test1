<template>
  <div class="home">
    <!-- Banner 轮播(FR-01.02) -->
    <HomeBanner />

    <!-- 通知公告 + 新闻资讯 双栏 -->
    <div class="container home-main">
      <div class="home-two-col">
        <!-- 左:通知公告(学生/教师双 Tab) -->
        <div class="col-notice">
          <HomeNotice />
        </div>

        <!-- 右:新闻资讯 -->
        <div class="col-news">
          <HomeNews />
        </div>
      </div>

      <!-- 快速通道(FR-01.05) -->
      <HomeQuickLink />

      <!-- 课程建设 + 常用信息 + 投诉举报 + 信息公开 -->
      <HomeSections />
    </div>
  </div>
</template>

<script setup lang="ts">
// 首页 v3.0 - 落地 FR-01.01~14 全部 P0/P1 区块
// 区块: LOGO(Header) + Banner + 通知公告 + 新闻 + 快速通道 + 课程建设 + 常用信息 + 投诉举报 + 信息公开 + 友情链接(Footer) + 公众号二维码(Footer) + 联系方式(Footer) + 站点地图(Footer)
// 各区块已集成 v-reveal 入场动画,间距统一令牌化

// SEO:useSeoMeta 设置页面元信息 + Open Graph + Twitter Card
useSeoMeta({
  title: '首页 - 深圳信息职业技术大学教务处',
  description:
    '深圳信息职业技术大学教务处官方网站,提供教学管理、通知公告、办事指南、实践教学、专业建设等一站式服务,推动教学改革创新,提升人才培养质量。',
  ogTitle: '深圳信息职业技术大学教务处',
  ogDescription: '教学管理、通知公告、办事指南一站式服务',
  ogType: 'website',
  ogLocale: 'zh_CN',
  ogSiteName: '深圳信息职业技术大学教务处',
  twitterCard: 'summary_large_image',
  twitterTitle: '深圳信息职业技术大学教务处',
  twitterDescription: '教学管理、通知公告、办事指南一站式服务',
})
</script>

<style lang="scss" scoped>
.home-main {
  padding-top: $space-6;
}

.home-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-6;
  margin-bottom: $space-8;
  align-items: start;
}

// 平板:双栏堆叠
@include respond-to(md) {
  .home-two-col {
    grid-template-columns: 1fr;
    gap: $space-5;
  }
}

// 移动端:双栏堆叠
@include respond-to(xs) {
  .home-two-col {
    grid-template-columns: 1fr;
    gap: $space-4;
  }
}
</style>
