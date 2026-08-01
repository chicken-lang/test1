<template>
  <div style="text-align: center; padding: 60px 0; color: #909399;">
    <p>正在跳转到工作台...</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
const router = useRouter()
onMounted(() => {
  router.replace('/admin/dashboard')
})
</script>
