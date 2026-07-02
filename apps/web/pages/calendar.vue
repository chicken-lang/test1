<script setup lang="ts">
// 校历作息页(T4.9)
// 含: 作息时间表 + 校历 + 班车时刻 + 部门电话 + 校园地图
import { classSchedule, schoolCalendar, busSchedule, departmentPhones } from '~/mock/data'

const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '校历作息' },
]

const tabs = [
  { key: 'schedule', label: '作息时间', icon: 'mdi:clock-outline' },
  { key: 'calendar', label: '校历安排', icon: 'mdi:calendar-month' },
  { key: 'bus', label: '班车时刻', icon: 'mdi:bus' },
  { key: 'phone', label: '部门电话', icon: 'mdi:phone-classic' },
  { key: 'map', label: '校园地图', icon: 'mdi:map' },
]
const activeTab = ref('schedule')

useSeoMeta({
  title: '校历作息 - 深圳信息职业技术大学教务处',
  description: '校历安排、作息时间表、班车时刻表、部门联系电话、校园地图',
})
</script>

<template>
  <div class="calendar-page">
    <div class="container">
      <Breadcrumb :items="breadcrumbItems" />
    </div>

    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:calendar-clock" />
          校历作息
        </h1>
        <p class="page-subtitle">Calendar · Schedule · Bus · Map</p>
      </div>
    </div>

    <div class="container">
      <!-- Tab 切换 -->
      <div class="tabs-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <Icon :icon="tab.icon" width="18" height="18" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- 作息时间表 -->
      <div v-show="activeTab === 'schedule'" class="tab-panel">
        <div class="panel-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>节次</th>
                <th>时间</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in classSchedule" :key="idx" :class="{ highlight: item.note.includes('课间') || item.note.includes('午休') }">
                <td class="td-section">{{ item.section }}</td>
                <td class="td-time">{{ item.time }}</td>
                <td class="td-note">{{ item.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 校历安排 -->
      <div v-show="activeTab === 'calendar'" class="tab-panel">
        <div class="panel-card">
          <ul class="calendar-list">
            <li v-for="(item, idx) in schoolCalendar" :key="idx" class="calendar-item">
              <div class="cal-week">{{ item.week }}</div>
              <div class="cal-info">
                <span class="cal-event">{{ item.event }}</span>
                <span class="cal-date">{{ item.date }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- 班车时刻 -->
      <div v-show="activeTab === 'bus'" class="tab-panel">
        <div class="panel-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>线路</th>
                <th>方向</th>
                <th>早班</th>
                <th>午班</th>
                <th>晚班</th>
                <th>途经站点</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(bus, idx) in busSchedule" :key="idx">
                <td class="td-route">{{ bus.route }}</td>
                <td>{{ bus.direction }}</td>
                <td class="td-time">{{ bus.morning }}</td>
                <td class="td-time">{{ bus.noon }}</td>
                <td class="td-time">{{ bus.evening }}</td>
                <td class="td-stops">{{ bus.stops }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 部门电话 -->
      <div v-show="activeTab === 'phone'" class="tab-panel">
        <div class="phone-grid">
          <div v-for="(dept, idx) in departmentPhones" :key="idx" class="phone-card">
            <div class="phone-head">
              <h3 class="phone-name">{{ dept.name }}</h3>
              <Icon icon="mdi:phone-classic" class="phone-icon" width="20" height="20" />
            </div>
            <p class="phone-duty">{{ dept.duty }}</p>
            <div class="phone-foot">
              <span class="phone-leader">科长:{{ dept.leader }}</span>
              <a :href="`tel:${dept.phone}`" class="phone-number">
                <Icon icon="mdi:phone-outline" width="14" height="14" />
                {{ dept.phone }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 校园地图 -->
      <div v-show="activeTab === 'map'" class="tab-panel">
        <div class="panel-card map-card">
          <div class="map-placeholder">
            <Icon icon="mdi:map-marker-radius" width="80" height="80" />
            <h3>校园地图</h3>
            <p>校园地图服务由学校 GIS 系统提供,后端就绪后将嵌入 iframe 沙箱。</p>
            <a href="https://map.sziit.edu.cn" target="_blank" rel="noopener noreferrer" class="map-link">
              <Icon icon="mdi:open-in-new" width="16" height="16" />
              打开校园地图
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.calendar-page {
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

// Tab
.tabs-bar {
  display: flex;
  gap: $space-1;
  margin-bottom: $space-6;
  border-bottom: 2px solid $border-lighter;
  flex-wrap: wrap;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-5;
  font-size: $fs-md;
  font-weight: $fw-medium;
  color: $text-secondary;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all $transition-fast;

  &:hover {
    color: $primary;
  }

  &.active {
    color: $primary;
    border-bottom-color: $primary;
    font-weight: $fw-semibold;
  }
}

.tab-panel {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-sm;
  overflow-x: auto;
}

// 通用表格
.data-table {
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

  tr.highlight td {
    background: $gold-bg;
    color: $gold-dark;
    font-weight: $fw-medium;
  }

  .td-section,
  .td-route {
    color: $primary;
    font-weight: $fw-semibold;
  }

  .td-time {
    font-family: $font-mono;
    color: $primary-dark;
  }
}

// 校历列表
.calendar-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.calendar-item {
  display: flex;
  align-items: center;
  gap: $space-5;
  padding: $space-4;
  background: $bg-soft;
  border-radius: $radius-base;
  border-left: 4px solid $gold;
  transition: all $transition-fast;

  &:hover {
    background: $primary-bg;
    border-left-color: $primary;
  }
}

.cal-week {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $primary;
  font-family: $font-serif;
  min-width: 120px;
}

.cal-info {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .cal-event {
    font-size: $fs-md;
    color: $text-primary;
    font-weight: $fw-medium;
  }

  .cal-date {
    font-size: $fs-xs;
    color: $text-secondary;
  }
}

// 部门电话卡片
.phone-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}

.phone-card {
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

.phone-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-3;

  .phone-icon {
    color: $gold;
  }
}

.phone-name {
  font-size: $fs-lg;
  font-weight: $fw-bold;
  color: $primary;
}

.phone-duty {
  font-size: $fs-sm;
  color: $text-secondary;
  line-height: $lh-snug;
  margin-bottom: $space-3;
  min-height: 42px;
}

.phone-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: $space-3;
  border-top: 1px solid $border-lighter;
}

.phone-leader {
  font-size: $fs-xs;
  color: $text-secondary;
}

.phone-number {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $fs-sm;
  color: $primary;
  font-weight: $fw-semibold;

  &:hover {
    color: $gold-dark;
  }
}

// 地图占位
.map-card {
  text-align: center;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  padding: $space-12 $space-6;
  color: $text-secondary;

  :deep(svg) {
    color: $border-base;
  }

  h3 {
    font-size: $fs-xl;
    color: $text-primary;
  }

  p {
    font-size: $fs-sm;
    max-width: 400px;
  }
}

.map-link {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-6;
  background: $primary;
  color: #fff;
  border-radius: $radius-base;
  font-size: $fs-base;
  font-weight: $fw-medium;
  transition: all $transition-base;

  &:hover {
    background: $primary-dark;
    color: #fff;
    transform: translateY(-2px);
  }
}

@include respond-to(md) {
  .phone-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@include respond-to(xs) {
  .phone-grid {
    grid-template-columns: 1fr;
  }
  .page-title {
    font-size: $fs-2xl;
  }
  .tab-btn {
    padding: $space-2 $space-3;
    font-size: $fs-sm;
  }
}
</style>
