// 注册 @iconify/vue 的 Icon 组件为全局组件
// 在模板中可直接使用 <Icon icon="mdi:xxx" />
import { Icon } from '@iconify/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Icon', Icon)
})
