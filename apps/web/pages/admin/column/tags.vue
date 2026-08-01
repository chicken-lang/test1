<template>
  <div class="page-container">
    <!-- 业务标签 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">业务标签</h3>
        <el-button type="primary" icon="Plus" size="small" @click="handleAddTag('business')">
          添加标签
        </el-button>
      </div>
      <div class="tag-list">
        <el-tag
          v-for="tag in businessTags"
          :key="tag"
          closable
          size="large"
          @close="handleDeleteTag(tag, 'business')"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- 角色标签 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">角色标签</h3>
        <el-button type="primary" icon="Plus" size="small" @click="handleAddTag('role')">
          添加标签
        </el-button>
      </div>
      <div class="tag-list">
        <el-tag
          v-for="tag in roleTags"
          :key="tag"
          closable
          size="large"
          type="success"
          @close="handleDeleteTag(tag, 'role')"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- 时效标签 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">时效标签</h3>
        <el-button type="primary" icon="Plus" size="small" @click="handleAddTag('time')">
          添加标签
        </el-button>
      </div>
      <div class="tag-list">
        <el-tag
          v-for="tag in timeTags"
          :key="tag"
          closable
          size="large"
          type="warning"
          @close="handleDeleteTag(tag, 'time')"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- 添加标签对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加标签"
      width="400px"
    >
      <el-form :model="tagForm" label-width="80px">
        <el-form-item label="标签名称">
          <el-input
            v-model="tagForm.name"
            placeholder="请输入标签名称"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchTags, createTag, deleteTag } from '~/composables/adminApi'

interface TagObject {
  id: number
  name: string
  type: string
}

const businessTags = ref<string[]>([])
const roleTags = ref<string[]>([])
const timeTags = ref<string[]>([])

const tagObjects = ref<TagObject[]>([])

const dialogVisible = ref(false)
const currentTagType = ref<'business' | 'role' | 'time'>('business')

const tagForm = reactive({
  name: '',
})

async function loadTags() {
  try {
    const res = await fetchTags()
    if (res.code === 0 || res.code === 200) {
      tagObjects.value = res.data || []
      businessTags.value = tagObjects.value.filter(t => t.type === 'business').map(t => t.name)
      roleTags.value = tagObjects.value.filter(t => t.type === 'role').map(t => t.name)
      timeTags.value = tagObjects.value.filter(t => t.type === 'time').map(t => t.name)
    } else {
      ElMessage.error(res.message || '加载标签失败')
    }
  } catch (e) {
    ElMessage.error('加载标签失败')
  }
}

onMounted(() => {
  loadTags()
})

const handleAddTag = (type: 'business' | 'role' | 'time') => {
  currentTagType.value = type
  tagForm.name = ''
  dialogVisible.value = true
}

const handleConfirmAdd = async () => {
  if (!tagForm.name.trim()) {
    return
  }

  try {
    await createTag({ name: tagForm.name.trim(), type: currentTagType.value })
    dialogVisible.value = false
    ElMessage.success('添加成功')
    loadTags()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

const handleDeleteTag = async (tagName: string, type: string) => {
  const tag = tagObjects.value.find(t => t.name === tagName && t.type === type)
  if (!tag) return

  try {
    await deleteTag(tag.id)
    ElMessage.success('删除成功')
    loadTags()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}
</script>

<style lang="scss" scoped>
.section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
