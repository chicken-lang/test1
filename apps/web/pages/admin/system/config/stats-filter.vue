<template>
  <div class="page-container">
    <h3 class="section-title">统计过滤规则</h3>

    <el-form :model="form" label-width="180px" style="max-width: 800px">
      <!-- 白名单IP段 -->
      <el-form-item label="白名单IP段">
        <el-input
          v-model="form.whitelistIPs"
          type="textarea"
          :rows="5"
          placeholder="每行一个IP段，例如：192.168.1.0/24"
        />
      </el-form-item>

      <!-- 爬虫UA过滤关键词 -->
      <el-form-item label="爬虫UA过滤关键词">
        <div class="tag-list">
          <el-tag
            v-for="(tag, index) in form.uaKeywords"
            :key="index"
            closable
            @close="handleRemoveTag(index)"
            style="margin-right: 8px; margin-bottom: 8px"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInputRef"
            v-model="tagInputValue"
            size="small"
            style="width: 120px"
            @keyup.enter="handleAddTag"
            @blur="handleAddTag"
          />
          <el-button
            v-else
            size="small"
            @click="showTagInput"
          >
            + 添加
          </el-button>
        </div>
      </el-form-item>

      <!-- 过滤规则开关 -->
      <el-form-item label="过滤搜索引擎爬虫">
        <el-switch v-model="form.filterSearchEngine" />
      </el-form-item>

      <el-form-item label="过滤监控探针">
        <el-switch v-model="form.filterMonitor" />
      </el-form-item>

      <el-form-item label="过滤内网测试流量">
        <el-switch v-model="form.filterInternal" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSave">保存配置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 表单数据
const form = reactive({
  whitelistIPs: '192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12',
  uaKeywords: ['Googlebot', 'Baiduspider', 'Bingbot', 'YisouSpider'],
  filterSearchEngine: true,
  filterMonitor: true,
  filterInternal: false,
})

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref<any>(null)

// 显示标签输入
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.input?.focus()
  })
}

// 添加标签
const handleAddTag = () => {
  if (tagInputValue.value.trim()) {
    form.uaKeywords.push(tagInputValue.value.trim())
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

// 删除标签
const handleRemoveTag = (index: number) => {
  form.uaKeywords.splice(index, 1)
}

// 保存
const handleSave = () => {
  console.log('保存配置:', form)
  ElMessage.success('过滤规则已保存')
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
