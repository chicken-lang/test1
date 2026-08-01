<template>
  <div class="page-container">
    <h3 class="section-title">标签体系管理</h3>

    <!-- 业务标签 -->
    <div class="tag-section">
      <h4 class="tag-section__title">业务标签</h4>
      <div class="tag-list">
        <el-tag
          v-for="(tag, index) in businessTags"
          :key="index"
          closable
          @close="handleDeleteBusinessTag(index)"
          style="margin-right: 8px; margin-bottom: 8px"
        >
          {{ tag }}
        </el-tag>
        <el-button size="small" @click="handleAddBusinessTag">+ 添加</el-button>
      </div>
    </div>

    <el-divider />

    <!-- 角色标签 -->
    <div class="tag-section">
      <h4 class="tag-section__title">角色标签</h4>
      <div class="tag-list">
        <el-tag
          v-for="(tag, index) in roleTags"
          :key="index"
          closable
          @close="handleDeleteRoleTag(index)"
          style="margin-right: 8px; margin-bottom: 8px"
        >
          {{ tag }}
        </el-tag>
        <el-button size="small" @click="handleAddRoleTag">+ 添加</el-button>
      </div>
    </div>

    <el-divider />

    <!-- 时效标签 -->
    <div class="tag-section">
      <h4 class="tag-section__title">时效标签</h4>
      <div class="tag-list">
        <el-tag
          v-for="(tag, index) in timeTags"
          :key="index"
          closable
          @close="handleDeleteTimeTag(index)"
          style="margin-right: 8px; margin-bottom: 8px"
        >
          {{ tag }}
        </el-tag>
        <el-button size="small" @click="handleAddTimeTag">+ 添加</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { BusinessTags, RoleTags, TimeTags } from '~/utils/adminTypes'

// 业务标签
const businessTags = ref<string[]>([...BusinessTags])

// 角色标签
const roleTags = ref<string[]>([...RoleTags])

// 时效标签
const timeTags = ref<string[]>([...TimeTags])

// 添加业务标签
const handleAddBusinessTag = () => {
  ElMessageBox.prompt('请输入标签名称', '添加业务标签', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    if (value && value.trim()) {
      businessTags.value.push(value.trim())
      ElMessage.success('添加成功')
    }
  })
}

// 删除业务标签
const handleDeleteBusinessTag = (index: number) => {
  businessTags.value.splice(index, 1)
  ElMessage.success('删除成功')
}

// 添加角色标签
const handleAddRoleTag = () => {
  ElMessageBox.prompt('请输入标签名称', '添加角色标签', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    if (value && value.trim()) {
      roleTags.value.push(value.trim())
      ElMessage.success('添加成功')
    }
  })
}

// 删除角色标签
const handleDeleteRoleTag = (index: number) => {
  roleTags.value.splice(index, 1)
  ElMessage.success('删除成功')
}

// 添加时效标签
const handleAddTimeTag = () => {
  ElMessageBox.prompt('请输入标签名称', '添加时效标签', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    if (value && value.trim()) {
      timeTags.value.push(value.trim())
      ElMessage.success('添加成功')
    }
  })
}

// 删除时效标签
const handleDeleteTimeTag = (index: number) => {
  timeTags.value.splice(index, 1)
  ElMessage.success('删除成功')
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.tag-section {
  margin-bottom: 20px;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
