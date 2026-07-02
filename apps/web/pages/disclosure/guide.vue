<script setup lang="ts">
// 信息公开指南页
// 白色卡片展示信息公开指南说明文字(公开范围/公开方式/公开时限/监督方式)
const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '信息公开', to: '/disclosure' },
  { title: '信息公开指南' },
]

// 指南章节
const sections = [
  {
    title: '一、公开范围',
    content:
      '根据《高等学校信息公开办法》及相关规定,教务处主动公开涉及师生切身利益、需要师生广泛知晓或参与、反映教务处基本情况等方面的信息。具体包括:部门基本信息、规章制度、人才培养方案、通知公告、教学评估结果、学生管理规定、教师人事信息、年度工作报告等。',
  },
  {
    title: '二、公开方式',
    content:
      '教务处主要通过教务处官方网站进行信息公开,同时结合校内公告栏、官方公众号、会议通报等多种渠道予以补充。对于依申请公开的信息,公民、法人和其他组织可按本指南规定的方式向教务处提交申请。',
  },
  {
    title: '三、公开时限',
    content:
      '属于主动公开范围的信息,教务处自该信息形成或者变更之日起 20 个工作日内予以公开。法律法规对信息公开时限另有规定的,从其规定。依申请公开的信息,教务处自收到申请之日起 15 个工作日内予以答复;如需延长答复期限,延长不超过 15 个工作日。',
  },
  {
    title: '四、监督方式',
    content:
      '师生及社会公众对教务处信息公开工作的意见和建议,可通过电话(0755-89226666)、邮箱(jwc@sziit.edu.cn)或在线反馈系统提出。对信息公开工作中的具体行政行为不服的,可依法申请行政复议或提起行政诉讼。',
  },
]

useSeoMeta({
  title: '信息公开指南 - 深圳信息职业技术大学教务处',
  description: '深圳信息职业技术大学教务处信息公开指南,含公开范围、公开方式、公开时限及监督方式',
})
</script>

<template>
  <div class="guide-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:book-open-page-variant-outline" />
          信息公开指南
        </h1>
        <p class="page-subtitle">Disclosure Guide</p>
      </div>
    </div>

    <div class="container">
      <div class="guide-card">
        <div class="guide-intro">
          <Icon icon="mdi:information-outline" width="22" height="22" />
          <p>
            为保障师生及社会公众依法获取教务处信息,提高教务工作透明度,根据《高等学校信息公开办法》及学校相关规定,结合教务处工作实际,制定本指南。
          </p>
        </div>

        <article v-for="sec in sections" :key="sec.title" class="guide-section">
          <h3 class="guide-heading">{{ sec.title }}</h3>
          <p class="guide-text">{{ sec.content }}</p>
        </article>

        <div class="guide-footer">
          <Icon icon="mdi:phone-outline" width="16" height="16" />
          如有疑问,请联系教务处综合科:0755-89226666-8000
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.guide-page {
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

.guide-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-sm;
  border-left: 4px solid $gold;
}

.guide-intro {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4 $space-5;
  background: $primary-bg;
  border-radius: $radius-md;
  margin-bottom: $space-6;

  :deep(svg) {
    color: $primary;
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

.guide-section {
  margin-bottom: $space-6;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.guide-heading {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $primary-dark;
  margin-bottom: $space-3;
  padding-left: $space-3;
  border-left: 4px solid $primary;
}

.guide-text {
  font-size: $fs-md;
  color: $text-regular;
  line-height: $lh-relaxed;
  text-indent: 2em;
}

.guide-footer {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-top: $space-6;
  padding-top: $space-5;
  border-top: 1px solid $border-lighter;
  font-size: $fs-sm;
  color: $text-secondary;

  :deep(svg) {
    color: $gold;
  }
}

@include respond-to(xs) {
  .guide-card {
    padding: $space-5;
  }

  .page-title {
    font-size: $fs-2xl;
  }

  .guide-heading {
    font-size: $fs-lg;
  }
}
</style>
