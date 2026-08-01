<template>
  <div class="home">
    <!-- A区:轮播头条 + 重要通知置顶(FR-01.02) -->
    <HomeBanner />

    <div class="container home-main">
      <!-- B区:通知公告 + 教务动态 双栏并列,提供标签筛选入口 -->
      <div class="home-two-col">
        <!-- 左:通知公告(教学通知/公示公告/处务通知 三 Tab) -->
        <div class="col-notice">
          <HomeNotice />
        </div>
        <!-- 右:教务动态 -->
        <div class="col-news">
          <HomeNews />
        </div>
      </div>

      <!-- C区:快捷服务入口(教务系统、选课入口、教学日历、办事大厅、成绩查询、下载中心) -->
      <HomeQuickLink />

      <!-- D区:业务板块(教学建设/实践教学/技能竞赛/教学质量 四栏切换) -->
      <HomeSections />

      <!-- E区:专题区(产教融合、职教本建设、重大赛事等,灵活上下线) -->
      <section v-reveal class="home-topics reveal" aria-labelledby="topics-title">
        <div class="section-header">
          <div class="section-title-group">
            <span id="topics-title" class="title-cn">专题推荐</span>
            <span class="title-en">Topics</span>
          </div>
        </div>
        <div class="topics-grid">
          <NuxtLink to="/topic/industry-education" class="topic-card topic-1">
            <div class="topic-icon">
              <Icon :icon="icons.book" :width="28" :height="28" />
            </div>
            <h3 class="topic-title">产教融合</h3>
            <p class="topic-desc">校企协同育人,共建专业课程与实训基地</p>
            <span class="topic-more">查看详情 <Icon :icon="icons.arrowRight" :width="13" :height="13" /></span>
          </NuxtLink>
          <NuxtLink to="/topic/vocational-degree" class="topic-card topic-2">
            <div class="topic-icon">
              <Icon :icon="icons.cap" :width="28" :height="28" />
            </div>
            <h3 class="topic-title">职教本建设</h3>
            <p class="topic-desc">职业本科专业建设与人才培养方案优化</p>
            <span class="topic-more">查看详情 <Icon :icon="icons.arrowRight" :width="13" :height="13" /></span>
          </NuxtLink>
          <NuxtLink to="/topic/major-competition" class="topic-card topic-3">
            <div class="topic-icon">
              <Icon :icon="icons.trophy" :width="28" :height="28" />
            </div>
            <h3 class="topic-title">重大赛事</h3>
            <p class="topic-desc">技能竞赛组织通知、获奖公示与风采展示</p>
            <span class="topic-more">查看详情 <Icon :icon="icons.arrowRight" :width="13" :height="13" /></span>
          </NuxtLink>
        </div>
      </section>

      <!-- G区:留言咨询 + 问卷调查(需求 4.1 前台功能) -->
      <div class="home-interact">
        <HomeConsultation />
        <HomeSurvey />
      </div>
    </div>

    <!-- F区:底部信息(规章制度速览、联系方式、友情链接、网站备案)由 AppFooter 全局布局承载 -->
  </div>
</template>

<script setup lang="ts">
// 首页 v4.0 - 对齐《教务处网站改版项目需求说明书》首页 A-F 六区布局
// A区:轮播头条+重要通知置顶 | B区:通知公告+教务动态双栏 | C区:快捷服务入口
// D区:业务四栏切换(教学建设/实践教学/技能竞赛/教学质量) | E区:专题区 | F区:底部信息(AppFooter)
import { icons } from '~/utils/icons'

// SEO:useSeoMeta 设置页面元信息 + Open Graph + Twitter Card
useSeoMeta({
  title: '首页 - 深圳信息职业技术大学教务处',
  description:
    '深圳信息职业技术大学教务处官方网站,提供通知公告、教务动态、教学建设、实践教学、技能竞赛、教学运行、考务教材、教学质量、办事指南等一站式服务,体现职业本"岗课赛证"综合育人特色',
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

// ========== B区:双栏布局 ==========
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

// ========== E区:专题区 ==========
.home-topics {
  margin-top: $space-8;
}

// ========== G区:留言咨询 + 问卷调查 ==========
.home-interact {
  margin-top: $space-8;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-6;
  align-items: start;
}

@include respond-to(md) {
  .home-interact {
    grid-template-columns: 1fr;
    gap: $space-5;
  }
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: $space-5;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;
}

.section-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  padding-left: $space-4;

  // 左侧 VI 主色装饰线
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 3px;
    background: $primary;
    border-radius: $radius-pill;
  }
}

.title-cn {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $text-primary;
  line-height: 1.2;
}

.title-en {
  font-size: $fs-xs;
  color: $text-placeholder;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-5;
}

.topic-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: $space-6;
  border-radius: $radius-lg;
  color: #fff;
  position: relative;
  overflow: hidden;
  min-height: 160px;
  transition: all $transition-base;

  // 右上角装饰圆
  &::before {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-primary;
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid $focus-ring;
    outline-offset: 2px;
  }
}

// 三个专题配色(VI 主色系延伸,无渐变)
.topic-1 {
  background: $primary-dark;
}
.topic-2 {
  background: $primary;
}
.topic-3 {
  background: $success;
}

.topic-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: $radius-base;
  background: rgba(255, 255, 255, 0.15);
  margin-bottom: $space-3;
}

.topic-title {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  margin: 0 0 $space-2;
}

.topic-desc {
  font-size: $fs-sm;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 $space-4;
  line-height: 1.5;
}

.topic-more {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-xs;
  color: rgba(255, 255, 255, 0.9);
  margin-top: auto;
  padding-top: $space-2;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  width: 100%;
}

// 移动端:专题区单列
@include respond-to(xs) {
  .topics-grid {
    grid-template-columns: 1fr;
    gap: $space-4;
  }

  .topic-card {
    padding: $space-5 $space-4;
    min-height: 140px;
  }
}
</style>
