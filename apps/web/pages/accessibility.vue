<script setup lang="ts">
// 无障碍说明页
// 白色卡片展示无障碍声明(无障碍理念/支持功能/辅助技术兼容性/反馈渠道)
const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '无障碍说明' },
]

// 理念章节
const sections = [
  {
    title: '一、无障碍理念',
    content:
      '深圳信息职业技术大学教务处网站秉承"信息无障碍"理念,致力于让所有师生(包括视障、听障、运动障碍及认知障碍等不同需求群体)平等、便捷地获取教务信息与服务。我们遵循 WCAG 2.1 AA 级标准,持续推进网站无障碍建设,努力消除数字鸿沟。',
  },
  {
    title: '二、支持的无障碍功能',
    content:
      '本网站提供以下无障碍功能:1) 键盘导航:支持全程键盘操作,无需鼠标即可完成页面浏览与交互;2) 适老化模式:提供放大字号、增强对比度的适老化视图;3) 跳转链接:每页顶部提供"跳到主要内容"快捷链接,便于读屏软件快速定位;4) 焦点可见:所有可交互元素均具备清晰的金色焦点描边;5) 语义化结构:采用规范的 HTML 语义标签,便于辅助技术理解页面结构。',
  },
  {
    title: '三、辅助技术兼容性',
    content:
      '本网站已对主流读屏软件(NVDA、VoiceOver、争渡读屏等)、屏幕放大软件及语音识别工具进行兼容性测试,确保辅助技术能够正确识别页面内容与操作意图。我们持续关注辅助技术更新,及时优化兼容性表现。',
  },
  {
    title: '四、反馈渠道',
    content:
      '如您在使用本网站过程中遇到无障碍访问障碍,或有任何改进建议,欢迎通过以下方式反馈:电话 0755-89226666;邮箱 jwc@sziit.edu.cn;或通过网站在线反馈系统提交。我们将在 5 个工作日内响应,并持续改进无障碍体验。',
  },
]

useSeoMeta({
  title: '无障碍说明 - 深圳信息职业技术大学教务处',
  description: '深圳信息职业技术大学教务处网站无障碍声明,含无障碍理念、支持功能、辅助技术兼容性及反馈渠道',
})
</script>

<template>
  <div class="accessibility-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:human-friendly" />
          无障碍说明
        </h1>
        <p class="page-subtitle">Accessibility</p>
      </div>
    </div>

    <div class="container">
      <div class="a11y-card">
        <div class="a11y-intro">
          <Icon icon="mdi:hand-heart-outline" width="22" height="22" />
          <p>
            我们致力于为所有用户提供无障碍的访问体验。本说明阐述本网站的无障碍理念、支持功能及反馈渠道,欢迎监督与建议。
          </p>
        </div>

        <article v-for="sec in sections" :key="sec.title" class="a11y-section">
          <h3 class="a11y-heading">{{ sec.title }}</h3>
          <p class="a11y-text">{{ sec.content }}</p>
        </article>

        <div class="a11y-footer">
          <div class="footer-item">
            <Icon icon="mdi:phone-outline" width="16" height="16" />
            <span>0755-89226666</span>
          </div>
          <div class="footer-item">
            <Icon icon="mdi:email-outline" width="16" height="16" />
            <span>jwc@sziit.edu.cn</span>
          </div>
          <NuxtLink to="/feedback" class="footer-cta">
            <Icon icon="mdi:email-edit-outline" width="14" height="14" />
            在线反馈
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.accessibility-page {
  padding-bottom: 40px;
}

.page-header {
  background: $grad-primary;
  color: #fff;
  padding: $space-8 0;
  margin-bottom: $space-8;
}

.page-title {
  display: flex;
  align-items: center;
  gap: $space-3;
  font-size: $fs-4xl;
  font-weight: $fw-bold;
  margin-bottom: $space-2;
}

.page-subtitle {
  font-size: $fs-sm;
  opacity: 0.8;
  letter-spacing: 2px;
}

.a11y-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-sm;
  border-left: 4px solid $gold;
}

.a11y-intro {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4 $space-5;
  background: $gold-bg;
  border-radius: $radius-md;
  margin-bottom: $space-6;

  :deep(svg) {
    color: $gold-dark;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    font-size: $fs-md;
    color: $text-regular;
    line-height: $lh-relaxed;
    margin: 0;
  }
}

.a11y-section {
  margin-bottom: $space-6;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.a11y-heading {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $primary-dark;
  margin-bottom: $space-3;
  padding-left: $space-3;
  border-left: 4px solid $primary;
}

.a11y-text {
  font-size: $fs-md;
  color: $text-regular;
  line-height: $lh-relaxed;
}

.a11y-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-5;
  margin-top: $space-6;
  padding-top: $space-5;
  border-top: 1px solid $border-lighter;

  .footer-item {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-sm;
    color: $text-secondary;

    :deep(svg) {
      color: $gold;
    }
  }
}

.footer-cta {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  margin-left: auto;
  padding: $space-2 $space-4;
  background: $grad-gold;
  color: #fff;
  border-radius: $radius-base;
  font-size: $fs-sm;
  font-weight: $fw-semibold;
  transition: all $transition-base;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-gold;
    color: #fff;
  }
}

@include respond-to(xs) {
  .a11y-card {
    padding: $space-5;
  }

  .a11y-footer {
    .footer-cta {
      margin-left: 0;
    }
  }

  .page-title {
    font-size: $fs-2xl;
  }

  .a11y-heading {
    font-size: $fs-lg;
  }
}
</style>
