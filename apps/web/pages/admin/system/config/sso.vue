<template>
  <div class="page-container">
    <h3 class="section-title">SSO统一认证配置</h3>

    <el-form :model="form" label-width="160px" style="max-width: 700px">
      <el-form-item label="AppID">
        <el-input v-model="form.appId" placeholder="sziit_jwc_****" disabled />
      </el-form-item>

      <el-form-item label="AppSecret">
        <el-input
          v-model="form.appSecret"
          :type="showSecret ? 'text' : 'password'"
          placeholder="请输入AppSecret"
        >
          <template #suffix>
            <el-icon style="cursor: pointer" @click="showSecret = !showSecret">
              <component :is="showSecret ? 'Hide' : 'View'" />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="认证中心接口地址">
        <el-input v-model="form.authUrl" placeholder="https://auth.sziit.edu.cn/oauth/authorize" />
      </el-form-item>

      <el-form-item label="回调地址">
        <el-input v-model="form.callbackUrl" placeholder="https://admin.jwc.sziit.edu.cn/callback/sso" />
      </el-form-item>

      <el-form-item label="Token有效期(分钟)">
        <el-input-number v-model="form.tokenExpire" :min="5" :max="1440" />
      </el-form-item>

      <el-form-item label="启用SSO">
        <el-switch v-model="form.enabled" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSave">保存配置</el-button>
      </el-form-item>

      <el-form-item>
        <el-alert
          title="修改SSO配置将影响所有用户的统一身份登录，请谨慎操作"
          type="warning"
          :closable="false"
          show-icon
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">

definePageMeta({ layout: 'admin' })
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 表单数据
const form = reactive({
  appId: 'sziit_jwc_****',
  appSecret: '************',
  authUrl: 'https://auth.sziit.edu.cn/oauth/authorize',
  callbackUrl: 'https://admin.jwc.sziit.edu.cn/callback/sso',
  tokenExpire: 60,
  enabled: true,
})

// 显示密钥
const showSecret = ref(false)

// 保存
const handleSave = () => {
  console.log('保存配置:', form)
  ElMessage.success('SSO配置已保存')
}
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}
</style>
