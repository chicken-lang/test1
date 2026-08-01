// 全局注册 @element-plus/icons-vue 图标组件
// 使 el-button icon="Search" 等字符串引用方式能正常工作
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default defineNuxtPlugin((nuxtApp) => {
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    nuxtApp.vueApp.component(key, component as any)
  }
})
