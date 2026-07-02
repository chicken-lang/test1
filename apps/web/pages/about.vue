<script setup lang="ts">
// 部门介绍页(T4.4)
// 包含: 简介 + 部门领导 + 7大业务口结构 + 人员一览 + 主要职责 + 联系我们
import { deptIntro, deptLeaders, businessDivisions, mainDuties, deptContact } from '~/mock/data'

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '部门介绍' },
]

// 人员筛选
const filterDivision = ref('all')
const divisionOptions = computed(() => [
  { value: 'all', label: '全部业务口' },
  ...businessDivisions.map((d) => ({ value: d.name, label: d.name })),
])

const filteredStaff = computed(() => {
  if (filterDivision.value === 'all') return businessDivisions
  return businessDivisions.filter((d) => d.name === filterDivision.value)
})

useSeoMeta({
  title: '部门介绍 - 深圳信息职业技术大学教务处',
  description: '深圳信息职业技术大学教务处部门介绍,含部门简介、领导介绍、组织机构、主要职责及联系方式',
})
</script>

<template>
  <div class="about-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <!-- 页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:office-building-outline" />
          部门介绍
        </h1>
        <p class="page-subtitle">Academic Affairs Office · 教务处</p>
      </div>
    </div>

    <div class="container about-content">
      <!-- 部门简介 -->
      <section id="brief" class="about-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="title-cn">部门简介</span>
            <span class="title-en">Brief</span>
          </div>
        </div>
        <div class="brief-card">
          <p class="brief-text">{{ deptIntro.brief }}</p>
          <p class="brief-text">{{ deptIntro.history }}</p>
        </div>
      </section>

      <!-- 部门领导 -->
      <section id="leaders" class="about-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="title-cn">部门领导</span>
            <span class="title-en">Leadership</span>
          </div>
        </div>
        <div class="leaders-grid">
          <div v-for="leader in deptLeaders" :key="leader.id" class="leader-card">
            <div class="leader-avatar">
              <Icon :icon="leader.avatar" width="48" height="48" />
            </div>
            <div class="leader-info">
              <h3 class="leader-name">{{ leader.name }}</h3>
              <span class="leader-title">{{ leader.title }}</span>
              <p class="leader-duty">{{ leader.duty }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 组织机构 -->
      <section id="divisions" class="about-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="title-cn">组织机构</span>
            <span class="title-en">Organization</span>
          </div>
          <span class="section-more">7 大业务科室</span>
        </div>
        <div class="divisions-grid">
          <div v-for="div in businessDivisions" :key="div.id" class="division-card">
            <div class="division-head">
              <h3 class="division-name">{{ div.name }}</h3>
              <span class="division-leader">科长:{{ div.leader }}</span>
            </div>
            <p class="division-duty">{{ div.duty }}</p>
            <div class="division-foot">
              <span class="division-phone">
                <Icon icon="mdi:phone-outline" width="14" height="14" />
                {{ div.phone }}
              </span>
              <span class="division-count">{{ div.staff.length }} 人</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 人员一览 -->
      <section class="about-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="title-cn">人员一览</span>
            <span class="title-en">Staff</span>
          </div>
          <el-select v-model="filterDivision" placeholder="筛选业务口" size="small" style="width: 160px">
            <el-option v-for="opt in divisionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div class="staff-table-wrap">
          <table class="staff-table">
            <thead>
              <tr>
                <th>业务口</th>
                <th>姓名</th>
                <th>职务</th>
                <th>联系电话</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="div in filteredStaff" :key="div.id">
                <tr v-for="(member, idx) in div.staff" :key="`${div.id}-${idx}`">
                  <td v-if="idx === 0" :rowspan="div.staff.length" class="td-division">{{ div.name }}</td>
                  <td>{{ member.name }}</td>
                  <td>{{ member.role }}</td>
                  <td v-if="idx === 0" :rowspan="div.staff.length">{{ div.phone }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 主要职责 -->
      <section id="duties" class="about-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="title-cn">主要职责</span>
            <span class="title-en">Responsibilities</span>
          </div>
          <span class="section-more">{{ mainDuties.length }} 项</span>
        </div>
        <ol class="duties-list">
          <li v-for="(duty, idx) in mainDuties" :key="idx" class="duty-item">
            <span class="duty-index">{{ String(idx + 1).padStart(2, '0') }}</span>
            <span class="duty-text">{{ duty }}</span>
          </li>
        </ol>
      </section>

      <!-- 联系我们 -->
      <section id="contact" class="about-section">
        <div class="section-header">
          <div class="section-title-group">
            <span class="title-cn">联系我们</span>
            <span class="title-en">Contact</span>
          </div>
        </div>
        <div class="contact-card">
          <div class="contact-info-grid">
            <div class="contact-info-item">
              <Icon icon="mdi:map-marker-outline" width="22" height="22" />
              <div>
                <span class="info-label">办公地址</span>
                <span class="info-value">{{ deptContact.address }}</span>
              </div>
            </div>
            <div class="contact-info-item">
              <Icon icon="mdi:phone-outline" width="22" height="22" />
              <div>
                <span class="info-label">联系电话</span>
                <span class="info-value">{{ deptContact.phone }}</span>
              </div>
            </div>
            <div class="contact-info-item">
              <Icon icon="mdi:email-outline" width="22" height="22" />
              <div>
                <span class="info-label">电子邮箱</span>
                <span class="info-value">{{ deptContact.email }}</span>
              </div>
            </div>
            <div class="contact-info-item">
              <Icon icon="mdi:clock-outline" width="22" height="22" />
              <div>
                <span class="info-label">办公时间</span>
                <span class="info-value">{{ deptContact.officeHours }}</span>
              </div>
            </div>
          </div>
          <NuxtLink to="/feedback" class="contact-cta">
            <Icon icon="mdi:email-edit-outline" width="18" height="18" />
            <span>在线反馈</span>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.about-page {
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

.about-section {
  margin-bottom: $space-10;
}

.brief-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-sm;
  border-left: 4px solid $gold;
}

.brief-text {
  font-size: $fs-md;
  line-height: $lh-relaxed;
  color: $text-regular;
  margin-bottom: $space-4;

  &:last-child {
    margin-bottom: 0;
  }
}

// 领导卡片
.leaders-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-5;
}

.leader-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-6;
  text-align: center;
  box-shadow: $shadow-sm;
  transition: all $transition-base;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-3px);
  }
}

.leader-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: $grad-primary-soft;
  color: $primary;
  margin-bottom: $space-3;
}

.leader-name {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $text-primary;
  margin-bottom: $space-1;
}

.leader-title {
  display: inline-block;
  font-size: $fs-xs;
  color: $gold-dark;
  background: $gold-bg;
  padding: 2px $space-2;
  border-radius: $radius-sm;
  margin-bottom: $space-2;
}

.leader-duty {
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: $lh-snug;
}

// 业务口卡片
.divisions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}

.division-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-sm;
  transition: all $transition-base;
  border-top: 3px solid transparent;

  &:hover {
    box-shadow: $shadow-md;
    border-top-color: $gold;
  }
}

.division-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-3;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-lighter;
}

.division-name {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $primary;
}

.division-leader {
  font-size: $fs-xs;
  color: $text-secondary;
}

.division-duty {
  font-size: $fs-sm;
  color: $text-regular;
  line-height: $lh-relaxed;
  margin-bottom: $space-3;
}

.division-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: $fs-xs;
  color: $text-secondary;

  .division-phone {
    display: inline-flex;
    align-items: center;
    gap: $space-1;

    :deep(svg) {
      color: $gold;
    }
  }
}

// 人员表格
.staff-table-wrap {
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;
  overflow-x: auto;
}

.staff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $fs-sm;

  th {
    background: $primary-bg;
    color: $primary-dark;
    font-weight: $fw-semibold;
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 2px solid $primary-lighter;
  }

  td {
    padding: $space-3 $space-4;
    border-bottom: 1px solid $border-lighter;
    color: $text-regular;
  }

  tr:hover td {
    background: $bg-soft;
  }

  .td-division {
    color: $primary;
    font-weight: $fw-semibold;
  }
}

// 职责列表
.duties-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
  counter-reset: duty;
}

.duty-item {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: $bg-card;
  border-radius: $radius-base;
  box-shadow: $shadow-xs;
  transition: all $transition-fast;

  &:hover {
    box-shadow: $shadow-sm;
    .duty-index {
      color: $gold;
    }
  }
}

.duty-index {
  font-family: $font-serif;
  font-size: $fs-xl;
  font-weight: $fw-bold;
  color: $border-base;
  flex-shrink: 0;
  line-height: 1;
  transition: color $transition-fast;
}

.duty-text {
  font-size: $fs-sm;
  color: $text-regular;
  line-height: $lh-snug;
}

// 联系卡片
.contact-card {
  background: $grad-dark;
  border-radius: $radius-lg;
  padding: $space-8;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(184, 149, 106, 0.15) 0%, transparent 70%);
  }
}

.contact-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-6;
  margin-bottom: $space-6;
  position: relative;
}

.contact-info-item {
  display: flex;
  align-items: flex-start;
  gap: $space-3;

  :deep(svg) {
    color: $gold-light;
    flex-shrink: 0;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .info-label {
    font-size: $fs-xs;
    color: rgba(255, 255, 255, 0.5);
  }

  .info-value {
    font-size: $fs-sm;
    color: #fff;
    font-weight: $fw-medium;
  }
}

.contact-cta {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-6;
  background: $grad-gold;
  border-radius: $radius-base;
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: #fff;
  transition: all $transition-base;
  box-shadow: $shadow-gold;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
    color: #fff;
  }
}

// 响应式
@include respond-to(md) {
  .leaders-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .divisions-grid {
    grid-template-columns: 1fr 1fr;
  }
  .duties-list {
    grid-template-columns: 1fr;
  }
  .contact-info-grid {
    grid-template-columns: 1fr;
  }
}

@include respond-to(xs) {
  .leaders-grid {
    grid-template-columns: 1fr;
  }
  .divisions-grid {
    grid-template-columns: 1fr;
  }
  .page-title {
    font-size: $fs-2xl;
  }
}
</style>
