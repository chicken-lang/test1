<script setup lang="ts">
// ListGallery v1.0 - 图文画廊卡片(需求 5.2)
// 用于实训室建设/实践教学基地/竞赛风采等需要图文或视频展示的栏目
// 对应栏目 listStyle: 'gallery'
// 数据源: 父级 list/[slug].vue 通过 /api/gallery/:slug 获取后传入
import { icons } from '~/utils/icons'

// 画廊项类型(与 mock/data.ts GalleryItem 对齐)
interface GalleryItem {
  id: number
  columnSlug: string
  title: string
  description: string
  coverUrl: string // 封面图
  videoUrl?: string // 视频地址(有值时显示播放图标)
  type: 'image' | 'video'
  publishDate: string
  views: number
  url: string // 点击跳转
}

defineProps<{
  items: GalleryItem[]
}>()

// "新"标识:7 天内发布(固定基准日避免 SSR/CSR 不一致)
const NEW_THRESHOLD = '2026-07-21'
const isNew = (date: string) => date >= NEW_THRESHOLD

// 视频图标(icons 字典无 play,使用 mdi:play-circle)
const playIcon = 'mdi:play-circle'
</script>

<template>
  <div class="list-gallery">
    <NuxtLink
      v-for="item in items"
      :key="item.id"
      :to="item.url"
      class="gallery-card"
    >
      <!-- 封面区 -->
      <div class="card-cover">
        <img
          :src="item.coverUrl"
          :alt="item.title"
          loading="lazy"
          class="cover-img"
        />
        <!-- 视频播放标识 -->
        <div v-if="item.type === 'video'" class="video-badge">
          <Icon :icon="playIcon" :width="32" :height="32" />
        </div>
        <!-- 顶部标签 -->
        <div class="cover-tags">
          <span v-if="isNew(item.publishDate)" class="tag tag-new">新</span>
          <span class="tag" :class="item.type === 'video' ? 'tag-video' : 'tag-image'">
            <Icon
              :icon="item.type === 'video' ? icons.video : icons.image"
              :width="12"
              :height="12"
            />
            {{ item.type === 'video' ? '视频' : '图文' }}
          </span>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="card-body">
        <h3 class="card-title">{{ item.title }}</h3>
        <p class="card-desc">{{ item.description }}</p>
        <div class="card-meta">
          <span class="meta-item">
            <Icon :icon="icons.calendar" :width="14" :height="14" />
            {{ item.publishDate }}
          </span>
          <span class="meta-item">
            <Icon :icon="icons.eye" :width="14" :height="14" />
            {{ item.views }}
          </span>
        </div>
      </div>
    </NuxtLink>

    <!-- 空状态 -->
    <div v-if="!items.length" class="gallery-empty">
      <EmptyState variant="empty" title="暂无展示内容" description="该栏目下暂无图文或视频资料" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-4;
}

// ========== 画廊卡片 ==========
.gallery-card {
  display: flex;
  flex-direction: column;
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  overflow: hidden;
  transition: all $transition-base;
  @include card-hover;

  &:hover {
    .cover-img {
      transform: scale(1.05);
    }

    .card-title {
      color: $primary;
    }
  }
}

// 封面区
.card-cover {
  position: relative;
  width: 100%;
  padding-top: 75%; // 4:3 比例
  background: $bg-soft;
  overflow: hidden;
}

.cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform $transition-base;
}

// 视频播放标识
.video-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
  transition: transform $transition-base;

  .gallery-card:hover & {
    transform: translate(-50%, -50%) scale(1.1);
  }
}

// 顶部标签
.cover-tags {
  position: absolute;
  top: $space-2;
  left: $space-2;
  display: flex;
  gap: $space-1;
  z-index: 1;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  padding: 0 $space-2;
  font-size: $fs-xs;
  font-weight: $fw-medium;
  border-radius: $radius-sm;
  line-height: 1;
  backdrop-filter: blur(4px);

  &-new {
    color: #fff;
    background: rgba(230, 57, 70, 0.9);
  }

  &-image {
    color: #fff;
    background: rgba(0, 115, 189, 0.85); // VI 主色半透明
  }

  &-video {
    color: #fff;
    background: rgba(0, 0, 0, 0.7);
  }
}

// 内容区
.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: $space-3 $space-4 $space-4;
}

.card-title {
  font-size: $fs-base;
  font-weight: $fw-semibold;
  color: $text-primary;
  margin: 0 0 $space-2;
  line-height: $lh-snug;
  @include text-ellipsis(2);
  transition: color $transition-fast;
}

.card-desc {
  font-size: $fs-sm;
  color: $text-regular;
  line-height: $lh-base;
  margin: 0 0 $space-3;
  @include text-ellipsis(2);
  flex: 1;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  font-size: $fs-xs;
  color: $text-secondary;
  padding-top: $space-2;
  border-top: 1px dashed $border-lighter;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
}

// 空状态
.gallery-empty {
  grid-column: 1 / -1;
  background: $bg-card;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
}

// 响应式
@include respond-to(md) {
  .list-gallery {
    grid-template-columns: repeat(2, 1fr);
  }
}

@include respond-to(xs) {
  .list-gallery {
    grid-template-columns: 1fr;
  }

  .card-body {
    padding: $space-3;
  }
}
</style>
