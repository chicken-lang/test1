<script setup lang="ts">
// 个人中心页(T4.11)
// 左侧用户信息卡 + 右侧 Tabs(消息通知/我的收藏/浏览历史/我的反馈/订阅设置)
import { ElMessage } from 'element-plus'
import {
  userProfile,
  userMessages,
  userFavorites,
  userHistory,
  userFeedback,
  userSubscriptions,
} from '~/mock/data'

// 面包屑(最后一项不可点击)
const breadcrumbItems = [
  { title: '首页', to: '/' },
  { title: '个人中心' },
]

// 当前激活的 Tab
const activeTab = ref('messages')

// 消息类型 -> el-tag 配置(system=蓝/notice=金/feedback=绿)
const msgTagMap: Record<string, { type: 'primary' | 'warning' | 'success'; label: string }> = {
  system: { type: 'primary', label: '系统' },
  notice: { type: 'warning', label: '通知' },
  feedback: { type: 'success', label: '反馈' },
}

// 消息单条展开(点击切换)
const expandedMsgId = ref<number | null>(null)
const toggleMsg = (id: number) => {
  expandedMsgId.value = expandedMsgId.value === id ? null : id
}

// 取消收藏(前端占位,后端就绪后用 _id 调接口)
const onRemoveFavorite = (_id: number) => {
  ElMessage.info('已取消收藏(Mock 阶段,后端就绪后同步状态)')
}

// 浏览历史仅展示最近 5 条
const recentHistory = userHistory.slice(0, 5)

// 反馈回复展开
const expandedFeedbackId = ref<number | null>(null)
const toggleFeedback = (id: number) => {
  expandedFeedbackId.value = expandedFeedbackId.value === id ? null : id
}

// 订阅列表(ref 包装,支持 el-switch 双向绑定)
const subscriptions = ref(userSubscriptions.map((s) => ({ ...s })))
const onSubscriptionChange = (name: string, active: boolean) => {
  ElMessage.success(`${active ? '已订阅' : '已取消订阅'}:${name}`)
}

// 退出登录
const onLogout = () => {
  ElMessage.info('退出登录功能开发中')
}

useSeoMeta({
  title: '个人中心 - 深圳信息职业技术大学教务处',
  description: '查看消息通知、我的收藏、浏览历史、反馈记录与订阅设置',
})
</script>

<template>
  <div class="user-page">
    <!-- 顶部页头 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <Icon icon="mdi:account-circle-outline" />
          个人中心
        </h1>
        <p class="page-subtitle">User Center</p>
      </div>
    </div>

    <div class="container">
      <!-- 面包屑 -->
      <Breadcrumb :items="breadcrumbItems" />

      <!-- 主体: 左侧用户信息卡 + 右侧 Tabs -->
      <div class="user-main">
        <!-- 左侧:用户信息卡 -->
        <aside class="user-card">
          <div class="user-card__avatar">
            <Icon :icon="userProfile.avatar" width="64" height="64" />
          </div>
          <!-- 金色装饰线 -->
          <div class="user-card__divider" />
          <h2 class="user-card__name">{{ userProfile.name }}</h2>
          <el-tag class="user-card__role" type="primary" effect="plain">{{ userProfile.roleLabel }}</el-tag>

          <ul class="user-card__info">
            <li>
              <Icon icon="mdi:school-outline" width="16" height="16" />
              <span>{{ userProfile.college }}</span>
            </li>
            <li>
              <Icon icon="mdi:book-open-variant-outline" width="16" height="16" />
              <span>{{ userProfile.major }}</span>
            </li>
            <li>
              <Icon icon="mdi:calendar-account-outline" width="16" height="16" />
              <span>{{ userProfile.grade }}</span>
            </li>
          </ul>

          <div class="user-card__contact">
            <p>
              <Icon icon="mdi:email-outline" width="15" height="15" />
              <span>{{ userProfile.email }}</span>
            </p>
            <p>
              <Icon icon="mdi:phone-outline" width="15" height="15" />
              <span>{{ userProfile.phone }}</span>
            </p>
          </div>

          <button class="user-card__logout" @click="onLogout">
            <Icon icon="mdi:logout-variant" width="16" height="16" />
            退出登录
          </button>
        </aside>

        <!-- 右侧:Tabs 内容区 -->
        <section class="user-tabs">
          <el-tabs v-model="activeTab">
            <!-- 1. 消息通知 -->
            <el-tab-pane label="消息通知" name="messages">
              <div class="tab-section">
                <ul class="msg-list">
                  <li
                    v-for="msg in userMessages"
                    :key="msg.id"
                    class="msg-item"
                    :class="{ 'is-unread': !msg.read }"
                  >
                    <div class="msg-item__head" @click="toggleMsg(msg.id)">
                      <span class="msg-item__dot" />
                      <span class="msg-item__title">{{ msg.title }}</span>
                      <el-tag size="small" :type="msgTagMap[msg.type].type" effect="light">
                        {{ msgTagMap[msg.type].label }}
                      </el-tag>
                      <span class="msg-item__date">{{ msg.date }}</span>
                      <Icon
                        class="msg-item__arrow"
                        :class="{ 'is-open': expandedMsgId === msg.id }"
                        icon="mdi:chevron-down"
                        width="18"
                        height="18"
                      />
                    </div>
                    <div v-if="expandedMsgId === msg.id" class="msg-item__content">
                      {{ msg.content }}
                    </div>
                  </li>
                </ul>
              </div>
            </el-tab-pane>

            <!-- 2. 我的收藏 -->
            <el-tab-pane label="我的收藏" name="favorites">
              <div class="tab-section">
                <ul class="fav-list">
                  <li v-for="fav in userFavorites" :key="fav.id" class="fav-item">
                    <Icon icon="mdi:bookmark-outline" width="18" height="18" class="fav-item__icon" />
                    <div class="fav-item__main">
                      <NuxtLink :to="fav.url" class="fav-item__title">{{ fav.title }}</NuxtLink>
                      <span class="fav-item__date">收藏于 {{ fav.date }}</span>
                    </div>
                    <button class="fav-item__action" @click="onRemoveFavorite(fav.id)">
                      取消收藏
                    </button>
                  </li>
                </ul>
              </div>
            </el-tab-pane>

            <!-- 3. 浏览历史 -->
            <el-tab-pane label="浏览历史" name="history">
              <div class="tab-section">
                <ul class="history-list">
                  <li v-for="item in recentHistory" :key="item.id" class="history-item">
                    <Icon icon="mdi:clock-outline" width="16" height="16" class="history-item__icon" />
                    <NuxtLink :to="item.url" class="history-item__title">{{ item.title }}</NuxtLink>
                    <span class="history-item__date">{{ item.date }}</span>
                  </li>
                </ul>
              </div>
            </el-tab-pane>

            <!-- 4. 我的反馈 -->
            <el-tab-pane label="我的反馈" name="feedback">
              <div class="tab-section">
                <ul class="feedback-list">
                  <li v-for="fb in userFeedback" :key="fb.id" class="feedback-item">
                    <div class="feedback-item__head">
                      <span class="feedback-item__title">{{ fb.title }}</span>
                      <el-tag
                        size="small"
                        :type="fb.status === '已处理' ? 'success' : 'warning'"
                        effect="light"
                      >
                        {{ fb.status }}
                      </el-tag>
                      <span class="feedback-item__date">{{ fb.date }}</span>
                      <button
                        v-if="fb.reply"
                        class="feedback-item__toggle"
                        @click="toggleFeedback(fb.id)"
                      >
                        {{ expandedFeedbackId === fb.id ? '收起回复' : '查看回复' }}
                      </button>
                    </div>
                    <div v-if="expandedFeedbackId === fb.id && fb.reply" class="feedback-item__reply">
                      <Icon icon="mdi:reply-outline" width="16" height="16" />
                      <span>{{ fb.reply }}</span>
                    </div>
                    <p v-else-if="!fb.reply" class="feedback-item__pending">暂无回复,处理中…</p>
                  </li>
                </ul>
              </div>
            </el-tab-pane>

            <!-- 5. 订阅设置 -->
            <el-tab-pane label="订阅设置" name="subscriptions">
              <div class="tab-section">
                <p class="sub-tip">
                  <Icon icon="mdi:bell-outline" width="16" height="16" />
                  开启订阅后,相关内容更新将通过消息通知推送
                </p>
                <ul class="sub-list">
                  <li v-for="(sub, idx) in subscriptions" :key="idx" class="sub-item">
                    <div class="sub-item__main">
                      <el-tag size="small" :type="sub.type === 'column' ? 'primary' : 'warning'" effect="plain">
                        {{ sub.type }}
                      </el-tag>
                      <span class="sub-item__name">{{ sub.name }}</span>
                    </div>
                    <el-switch
                      v-model="sub.active"
                      @change="(val: boolean) => onSubscriptionChange(sub.name, val)"
                    />
                  </li>
                </ul>
              </div>
            </el-tab-pane>
          </el-tabs>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.user-page {
  padding-bottom: $space-12;
}

// 顶部页头
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

  :deep(svg) {
    width: $fs-4xl;
    height: $fs-4xl;
  }
}

.page-subtitle {
  font-size: $fs-sm;
  opacity: 0.8;
  letter-spacing: 2px;
}

// 主体布局: 280px + 1fr
.user-main {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: $space-6;
  align-items: start;
  margin-top: $space-5;
}

// ========== 左侧用户信息卡 ==========
.user-card {
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: $space-6 $space-5;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: sticky;
  top: $space-6;
}

.user-card__avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: $grad-primary-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary;

  :deep(svg) {
    color: $primary;
  }
}

// 头像下方金色装饰线
.user-card__divider {
  width: 40px;
  height: 3px;
  background: $grad-gold;
  border-radius: $radius-pill;
  margin: $space-4 0 $space-3;
}

.user-card__name {
  font-size: $fs-xl;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin-bottom: $space-2;
}

.user-card__role {
  margin-bottom: $space-4;
}

.user-card__info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3 0;
  border-top: 1px solid $border-lighter;
  border-bottom: 1px solid $border-lighter;

  li {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-sm;
    color: $text-regular;

    :deep(svg) {
      color: $gold;
      flex-shrink: 0;
    }
  }
}

.user-card__contact {
  width: 100%;
  margin-top: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-2;

  p {
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-xs;
    color: $text-secondary;

    :deep(svg) {
      color: $text-secondary;
      flex-shrink: 0;
    }
  }
}

.user-card__logout {
  @include btn-base;
  margin-top: $space-5;
  width: 100%;
  background: $bg-soft;
  color: $text-regular;
  border: 1px solid $border-light;

  &:hover {
    background: $danger;
    color: #fff;
    border-color: $danger;
  }
}

// ========== 右侧 Tabs ==========
.user-tabs {
  min-width: 0;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: $space-5 $space-6;
}

.tab-section {
  padding: $space-2 0 $space-2;
}

// 消息列表
.msg-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.msg-item {
  border: 1px solid $border-lighter;
  border-radius: $radius-md;
  overflow: hidden;
  transition: border-color $transition-fast;

  &:hover {
    border-color: $primary-lighter;
  }

  &.is-unread .msg-item__dot {
    background: $gold;
  }
}

.msg-item__head {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover {
    background: $bg-soft;
  }
}

.msg-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $border-base;
  flex-shrink: 0;
}

.msg-item__title {
  flex: 1;
  font-size: $fs-base;
  font-weight: $fw-medium;
  color: $text-primary;
  @include text-ellipsis(1);
}

.msg-item__date {
  font-size: $fs-xs;
  color: $text-secondary;
  flex-shrink: 0;
}

.msg-item__arrow {
  color: $text-secondary;
  transition: transform $transition-base;
  flex-shrink: 0;

  &.is-open {
    transform: rotate(180deg);
  }
}

.msg-item__content {
  padding: $space-3 $space-4 $space-4;
  margin: 0 $space-4 $space-2;
  background: $bg-soft;
  border-radius: $radius-base;
  font-size: $fs-sm;
  color: $text-regular;
  line-height: $lh-relaxed;
}

// 收藏列表
.fav-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.fav-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border: 1px solid $border-lighter;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    border-color: $primary-lighter;
    background: $bg-soft;
  }
}

.fav-item__icon {
  color: $gold;
  flex-shrink: 0;
}

.fav-item__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.fav-item__title {
  font-size: $fs-base;
  font-weight: $fw-medium;
  color: $text-primary;
  @include text-ellipsis(1);

  &:hover {
    color: $primary;
  }
}

.fav-item__date {
  font-size: $fs-xs;
  color: $text-secondary;
}

.fav-item__action {
  flex-shrink: 0;
  padding: $space-1 $space-3;
  font-size: $fs-xs;
  color: $text-secondary;
  background: transparent;
  border: 1px solid $border-light;
  border-radius: $radius-pill;
  transition: all $transition-fast;

  &:hover {
    color: $danger;
    border-color: $danger;
  }
}

// 浏览历史
.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.history-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  transition: background $transition-fast;

  &:hover {
    background: $bg-soft;
  }
}

.history-item__icon {
  color: $text-secondary;
  flex-shrink: 0;
}

.history-item__title {
  flex: 1;
  font-size: $fs-base;
  color: $text-regular;
  @include text-ellipsis(1);

  &:hover {
    color: $primary;
  }
}

.history-item__date {
  font-size: $fs-xs;
  color: $text-secondary;
  flex-shrink: 0;
}

// 反馈列表
.feedback-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.feedback-item {
  border: 1px solid $border-lighter;
  border-radius: $radius-md;
  padding: $space-3 $space-4;
}

.feedback-item__head {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.feedback-item__title {
  flex: 1;
  font-size: $fs-base;
  font-weight: $fw-medium;
  color: $text-primary;
  @include text-ellipsis(1);
}

.feedback-item__date {
  font-size: $fs-xs;
  color: $text-secondary;
}

.feedback-item__toggle {
  flex-shrink: 0;
  padding: $space-1 $space-3;
  font-size: $fs-xs;
  color: $primary;
  background: $primary-bg;
  border: 1px solid $primary-lighter;
  border-radius: $radius-pill;
  transition: all $transition-fast;

  &:hover {
    background: $primary;
    color: #fff;
  }
}

.feedback-item__reply {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  margin-top: $space-3;
  padding: $space-3;
  background: $gold-bg;
  border-radius: $radius-base;
  font-size: $fs-sm;
  color: $text-regular;
  line-height: $lh-relaxed;

  :deep(svg) {
    color: $gold;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.feedback-item__pending {
  margin-top: $space-2;
  font-size: $fs-xs;
  color: $text-secondary;
}

// 订阅设置
.sub-tip {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $fs-sm;
  color: $text-secondary;
  padding: $space-3 $space-4;
  background: $bg-soft;
  border-radius: $radius-md;
  margin-bottom: $space-4;

  :deep(svg) {
    color: $gold;
  }
}

.sub-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.sub-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border: 1px solid $border-lighter;
  border-radius: $radius-md;
  transition: border-color $transition-fast;

  &:hover {
    border-color: $primary-lighter;
  }
}

.sub-item__main {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.sub-item__name {
  font-size: $fs-base;
  color: $text-primary;
  font-weight: $fw-medium;
}

// ========== 响应式 ==========
@include respond-to(md) {
  .user-main {
    grid-template-columns: 1fr;
  }

  .user-card {
    position: static;
  }
}

@include respond-to(xs) {
  .page-title {
    font-size: $fs-2xl;

    :deep(svg) {
      width: $fs-2xl;
      height: $fs-2xl;
    }
  }

  .user-tabs {
    padding: $space-4 $space-3;
  }

  .msg-item__head,
  .fav-item,
  .history-item,
  .feedback-item,
  .sub-item {
    flex-wrap: wrap;
  }

  .msg-item__date,
  .feedback-item__date {
    width: 100%;
    padding-left: $space-5;
  }
}
</style>
