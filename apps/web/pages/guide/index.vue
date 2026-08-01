<script setup lang="ts">
// 办事指南首页 (T5.2)
// 展示办事指南分类入口 + 事项列表
const api = useApi()

// 获取所有办事指南数据
const { data: guideData } = await useAsyncData('guide-all', () =>
  api.get<{ list: any[]; total: number }>('/guide'),
)
const allGuides = computed(() => guideData.value?.list ?? [])

// 分类配置（对齐 V2.0 办事指南二级栏目）
const categories = [
  { slug: 'regulation-national', title: '国家及省市文件', icon: 'mdi:flag-outline', desc: '教育部、教育厅等上级主管部门文件' },
  { slug: 'regulation-school', title: '学校规章制度', icon: 'mdi:rule', desc: '学校及教务处制定的教学管理规章制度' },
  { slug: 'download', title: '下载中心', icon: 'mdi:download-circle-outline', desc: '各类表格模板、文件下载' },
]

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '办事指南' },
]

const viewDetail = (item: any) => {
  alert(`【${item.title}】\n\n办理对象：${item.target}\n\n办理流程：\n${(item.process || []).map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}\n\n所需材料：\n${(item.materials || []).map((m: string) => `• ${m}`).join('\n')}\n\n办理时限：${item.duration}\n\n联系部门：${item.contactDept}\n联系电话：${item.contactPhone}`)
}

useSeoMeta({
  title: '办事指南 - 深圳信息职业技术大学教务处',
  description: '深圳信息职业技术大学教务处办事指南,涵盖国家及省市文件、学校规章制度、下载中心等',
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
          <Icon icon="mdi:book-open-page-variant" />
          办事指南
        </h1>
        <p class="page-subtitle">Guide</p>
      </div>
    </div>

    <div class="container guide-content">
      <!-- 分类入口 -->
      <section class="category-section">
        <div class="section-title">办事分类</div>
        <div class="category-grid">
          <NuxtLink
            v-for="cat in categories"
            :key="cat.slug"
            :to="`/list/${cat.slug}`"
            class="category-card"
          >
            <div class="category-icon">
              <Icon :icon="cat.icon" width="32" height="32" />
            </div>
            <div class="category-info">
              <h3 class="category-title">{{ cat.title }}</h3>
              <p class="category-desc">{{ cat.desc }}</p>
            </div>
            <span class="category-arrow">
              进入
              <Icon icon="mdi:chevron-right" width="16" height="16" />
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- 事项列表(平铺) -->
      <section class="items-section">
        <div class="section-title">全部事项</div>
        <div class="items-grid">
          <div
            v-for="item in allGuides"
            :key="item.id"
            class="item-card"
          >
            <div class="item-header">
              <el-tag size="small" type="primary" effect="plain">
                {{ categories.find(c => c.slug === item.columnSlug)?.title || '其他' }}
              </el-tag>
              <h3 class="item-title">{{ item.title }}</h3>
            </div>
            <p class="item-desc">{{ item.description }}</p>
            <div class="item-meta">
              <span class="meta-item">
                <Icon icon="mdi:account-outline" width="14" height="14" />
                {{ item.target?.substring(0, 20) }}{{ item.target && item.target.length > 20 ? '...' : '' }}
              </span>
              <span class="meta-item">
                <Icon icon="mdi:clock-outline" width="14" height="14" />
                {{ item.duration }}
              </span>
              <span class="meta-item">
                <Icon icon="mdi:phone-outline" width="14" height="14" />
                {{ item.contactPhone }}
              </span>
            </div>
            <div class="item-actions">
              <button
                class="action-btn"
                @click="viewDetail(item)"
              >
                查看详情
                <Icon icon="mdi:arrow-right" width="14" height="14" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.guide-page {
  padding-bottom: $space-12;
}

.page-header {
  background: $primary;
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

.section-title {
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $text-primary;
  margin-bottom: $space-5;
  padding-left: $space-3;
  border-left: 4px solid $primary;
}

.category-section {
  margin-bottom: $space-10;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-5;
}

.category-card {
  display: flex;
  align-items: center;
  gap: $space-4;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-sm;
  transition: all $transition-base;
  text-decoration: none;
  color: inherit;

  &:hover {
    box-shadow: $shadow-sm;
    transform: translateY(-2px);
    border: 1px solid $primary-light;

    .category-icon {
      background: $primary;
      color: #fff;
    }

    .category-title {
      color: $primary;
    }

    .category-arrow {
      color: $primary;
    }
  }
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: $radius-lg;
  background: $primary-bg;
  color: $primary;
  flex-shrink: 0;
  transition: all $transition-base;
}

.category-info {
  flex: 1;
}

.category-title {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $text-primary;
  margin-bottom: $space-1;
  transition: color $transition-fast;
}

.category-desc {
  font-size: $fs-sm;
  color: $text-secondary;
}

.category-arrow {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-sm;
  color: $text-placeholder;
  transition: color $transition-fast;
}

.items-section {
  margin-bottom: $space-8;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;
}

.item-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-sm;
  transition: all $transition-base;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &:hover {
    box-shadow: $shadow-sm;
    border-color: $border-light;
  }
}

.item-header {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.item-title {
  font-size: $fs-lg;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0;
}

.item-desc {
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: $lh-relaxed;
  margin: 0;
  @include text-ellipsis(2);
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  font-size: $fs-xs;
  color: $text-placeholder;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

.item-actions {
  margin-top: auto;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  background: $primary-bg;
  color: $primary;
  border: 1px solid $primary-light;
  border-radius: $radius-base;
  padding: $space-2 $space-4;
  font-size: $fs-sm;
  font-weight: $fw-medium;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $primary;
    color: #fff;
  }
}

@include respond-to(md) {
  .category-grid {
    grid-template-columns: 1fr;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }
}

@include respond-to(xs) {
  .page-title {
    font-size: $fs-2xl;
  }
}
</style>
