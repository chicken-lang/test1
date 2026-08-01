<template>
  <!-- 媒体资源库对话框: 图片+附件统一选择 -->
  <el-dialog
    :model-value="visible"
    :title="mode === 'image' ? '选择图片' : '选择附件'"
    width="860px"
    top="4vh"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="media-library">
      <!-- 左侧: 目录树 -->
      <div class="media-sidebar">
        <div class="sidebar-title">分类目录</div>
        <div
          v-for="cat in categories"
          :key="cat.key"
          class="sidebar-item"
          :class="{ active: selectedCategory === cat.key }"
          @click="selectedCategory = cat.key"
        >
          <Icon :icon="cat.icon" :width="16" :height="16" />
          <span>{{ cat.label }}</span>
        </div>
        <el-divider />
        <div class="sidebar-title">年份归档</div>
        <div
          class="sidebar-item"
          :class="{ active: selectedYear === 0 }"
          @click="selectedYear = 0"
        >全部</div>
        <div
          v-for="year in availableYears"
          :key="year"
          class="sidebar-item"
          :class="{ active: selectedYear === year }"
          @click="selectedYear = year"
        >{{ year }}年</div>
      </div>

      <!-- 右侧: 文件列表 -->
      <div class="media-main">
        <!-- 搜索/筛选 -->
        <div class="media-toolbar">
          <el-input v-model="keyword" :placeholder="mode === 'image' ? '搜索图片名称/alt文字...' : '搜索文件名...'" clearable style="width:220px" />
          <el-select v-if="!limitToOwn" v-model="uploaderFilter" placeholder="上传人" clearable style="width:120px">
            <el-option label="张三" :value="1" />
            <el-option label="李四" :value="2" />
            <el-option label="超级管理员" :value="99" />
          </el-select>
          <div class="toolbar-spacer" />
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :accept="mode === 'image' ? '.jpg,.jpeg,.png,.gif,.svg' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'"
            :on-change="handleUpload"
          >
            <el-button type="primary" size="small">
              <Icon icon="mdi:upload" :width="14" :height="14" />
              上传{{ mode === 'image' ? '图片' : '附件' }}
            </el-button>
          </el-upload>
        </div>

        <!-- 图片模式: 网格展示 -->
        <div v-if="mode === 'image'" class="media-grid">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="media-card"
            :class="{ selected: selectedId === item.id }"
            @click="selectItem(item)"
          >
            <div class="card-thumb">
              <img :src="item.thumbnailUrl || item.url" :alt="item.alt" />
            </div>
            <div class="card-info">
              <span class="card-name" :title="item.originalName">{{ item.originalName }}</span>
              <span class="card-meta">{{ formatSize(item.size) }} · {{ item.uploadedByName }}</span>
            </div>
          </div>
          <el-empty v-if="filteredItems.length === 0" description="暂无图片" :image-size="50" />
        </div>

        <!-- 附件模式: 列表展示 -->
        <div v-else class="media-list">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="media-list-item"
            :class="{ selected: selectedId === item.id }"
            @click="selectItem(item)"
          >
            <div class="list-icon">
              <Icon :icon="getFileIcon(item.mimeType)" :width="24" :height="24" />
            </div>
            <div class="list-info">
              <span class="list-name">{{ item.originalName }}</span>
              <span class="list-meta">{{ formatSize(item.size) }} · {{ item.uploadedByName }} · {{ item.createdAt }}</span>
            </div>
            <div class="list-refs" v-if="item.linkedArticleIds.length">
              <el-tag size="small" type="info">引用 {{ item.linkedArticleIds.length }}</el-tag>
            </div>
          </div>
          <el-empty v-if="filteredItems.length === 0" description="暂无附件" :image-size="50" />
        </div>

        <!-- Alt 文字输入(图片选中时) -->
        <div v-if="mode === 'image' && selectedItem && !selectedItem.alt" class="alt-input-bar">
          <el-input v-model="altText" placeholder="请输入图片描述(alt文字,≥4字)" size="small" style="width:300px" />
          <span v-if="altText.length > 0 && altText.length < 4" class="alt-error">描述过短</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="footer-stats">
          共 {{ mediaStore.items.length }} 个文件 · 图片 {{ mediaStore.images.length }} · 附件 {{ mediaStore.attachments.length }}
        </span>
        <div>
          <el-button @click="$emit('update:visible', false)">取消</el-button>
          <el-button type="primary" :disabled="!canConfirm" @click="confirmSelection">确认选择</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// 媒体资源库对话框: 图片+附件分类/检索/预览/权限隔离
import { useMediaLibraryStore } from '~/stores/mediaLibrary'
import { useAuthStore } from '~/stores/cmsAuth'
import { MediaCategory, MediaCategoryLabels, type MediaItem } from '~/utils/types'

const props = defineProps<{
  visible: boolean
  mode: 'image' | 'attachment'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [item: MediaItem]
}>()

const mediaStore = useMediaLibraryStore()
const authStore = useAuthStore()

// ===== 筛选 =====
const keyword = ref('')
const selectedCategory = ref<MediaCategory | ''>('')
const selectedYear = ref(0)
const uploaderFilter = ref<number | null>(null)
const altText = ref('')

// 是否限制只看自己的(编辑员权限隔离)
const limitToOwn = computed(() => authStore.user?.role === 'editor')

const categories = [
  { key: '' as const, label: '全部', icon: 'mdi:folder-multiple' },
  { key: MediaCategory.ACTIVITY, label: MediaCategoryLabels[MediaCategory.ACTIVITY], icon: 'mdi:image-multiple' },
  { key: MediaCategory.NOTICE_IMAGE, label: MediaCategoryLabels[MediaCategory.NOTICE_IMAGE], icon: 'mdi:image-text' },
  { key: MediaCategory.DOC_COVER, label: MediaCategoryLabels[MediaCategory.DOC_COVER], icon: 'mdi:file-image' },
  { key: MediaCategory.ICON, label: MediaCategoryLabels[MediaCategory.ICON], icon: 'mdi:shape' },
  { key: MediaCategory.ATTACHMENT, label: MediaCategoryLabels[MediaCategory.ATTACHMENT], icon: 'mdi:folder-file' },
]

const availableYears = computed(() => {
  const years = new Set(mediaStore.items.map(i => new Date(i.createdAt).getFullYear()))
  return [...years].sort((a, b) => b - a)
})

// ===== 筛选结果 =====
const filteredItems = computed(() => {
  let list = mediaStore.items

  // 类型筛选
  if (props.mode === 'image') {
    list = list.filter(i => i.type === 'image')
  } else {
    list = list.filter(i => i.type === 'attachment')
  }

  // 分类
  if (selectedCategory.value) {
    list = list.filter(i => i.category === selectedCategory.value)
  }

  // 年份
  if (selectedYear.value > 0) {
    list = list.filter(i => new Date(i.createdAt).getFullYear() === selectedYear.value)
  }

  // 权限隔离
  if (limitToOwn.value && authStore.user) {
    list = list.filter(i => i.uploadedBy === authStore.user!.id)
  }

  // 上传人
  if (uploaderFilter.value) {
    list = list.filter(i => i.uploadedBy === uploaderFilter.value)
  }

  // 搜索
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(i =>
      i.originalName.toLowerCase().includes(kw) ||
      (i.alt || '').toLowerCase().includes(kw) ||
      i.filename.toLowerCase().includes(kw)
    )
  }

  return list
})

// ===== 选择 =====
const selectedId = ref<number | null>(null)
const selectedItem = computed(() => mediaStore.items.find(i => i.id === selectedId.value) || null)

const selectItem = (item: MediaItem) => {
  selectedId.value = item.id
  altText.value = item.alt || ''
}

const canConfirm = computed(() => {
  if (!selectedItem.value) return false
  if (props.mode === 'image') {
    const alt = altText.value || selectedItem.value.alt || ''
    return alt.length >= 4
  }
  return true
})

const confirmSelection = () => {
  if (!selectedItem.value) return
  // 更新 alt
  if (props.mode === 'image' && altText.value) {
    selectedItem.value.alt = altText.value
  }
  emit('select', selectedItem.value)
  emit('update:visible', false)
}

// ===== 上传 =====
const handleUpload = (file: any) => {
  const rawFile = file.raw as File
  if (!rawFile || !authStore.user) return

  try {
    if (props.mode === 'image') {
      mediaStore.uploadImage(
        rawFile,
        (selectedCategory.value as MediaCategory) || MediaCategory.ACTIVITY,
        null,
        authStore.user.id,
        authStore.user.realName,
        authStore.user.department,
      )
      ElMessage.success('图片上传成功')
    } else {
      mediaStore.uploadAttachment(
        rawFile,
        MediaCategory.ATTACHMENT,
        null,
        authStore.user.id,
        authStore.user.realName,
        authStore.user.department,
      )
      ElMessage.success('附件上传成功')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '上传失败')
  }
}

// ===== 工具函数 =====
const formatSize = (bytes: number) => {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  if (bytes > 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${bytes}B`
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return 'mdi:file-pdf-box'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'mdi:file-word'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'mdi:file-excel'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'mdi:file-powerpoint'
  if (mimeType.includes('text')) return 'mdi:file-document'
  return 'mdi:file'
}

// 重置
watch(() => props.visible, (val) => {
  if (val) {
    selectedId.value = null
    altText.value = ''
    keyword.value = ''
    selectedCategory.value = ''
    selectedYear.value = 0
    uploaderFilter.value = null
  }
})
</script>

<style lang="scss" scoped>
.media-library {
  display: flex;
  height: 480px;
  gap: 0;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  overflow: hidden;
}

// ===== 左侧目录 =====
.media-sidebar {
  width: 160px;
  background: $bg-soft;
  border-right: 1px solid $border-lighter;
  padding: 12px 0;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 11px;
  font-weight: $fw-semibold;
  color: $text-placeholder;
  padding: 0 14px;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  color: $text-regular;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover { background: rgba(74, 144, 217, 0.06); }
  &.active {
    background: rgba(74, 144, 217, 0.1);
    color: $primary;
    font-weight: $fw-medium;
  }

  :deep(svg) { flex-shrink: 0; }
}

// ===== 右侧主区域 =====
.media-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.media-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid $border-lighter;
  flex-shrink: 0;
}

.toolbar-spacer { flex: 1; }

// ===== 图片网格 =====
.media-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  align-content: start;
}

.media-card {
  border: 2px solid transparent;
  border-radius: $radius-base;
  overflow: hidden;
  cursor: pointer;
  transition: all $transition-fast;
  background: #fff;

  &:hover { box-shadow: $shadow-sm; }
  &.selected {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.2);
  }
}

.card-thumb {
  height: 90px;
  overflow: hidden;
  background: $bg-page;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.card-info {
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
}

.card-name {
  font-size: 12px;
  color: $text-regular;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  font-size: 10px;
  color: $text-placeholder;
  margin-top: 2px;
}

// ===== 附件列表 =====
.media-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.media-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid $border-lighter;
  transition: all $transition-fast;

  &:hover { background: $bg-soft; }
  &.selected {
    background: rgba(74, 144, 217, 0.06);
    border-left: 3px solid $primary;
  }

  &:last-child { border-bottom: none; }
}

.list-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-soft;
  border-radius: $radius-base;
  color: $primary;
  flex-shrink: 0;
}

.list-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.list-name {
  font-size: 14px;
  color: $text-regular;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-meta {
  font-size: 12px;
  color: $text-placeholder;
  margin-top: 2px;
}

.list-refs { flex-shrink: 0; }

// ===== Alt 输入 =====
.alt-input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fffbe6;
  border-top: 1px solid #fff1b8;
  flex-shrink: 0;
}

.alt-error {
  font-size: 11px;
  color: $danger;
}

// ===== 底部 =====
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.footer-stats {
  font-size: 12px;
  color: $text-placeholder;
}
</style>
