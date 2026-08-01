// ====================================================================
// v-reveal 指令全局注册插件
// 配合 CSS .reveal / .is-revealed 类(见 main.scss)
// 使用 IntersectionObserver 检测元素进入视口,触发入场动画
// 尊重 prefers-reduced-motion:降级为直接显示
// --------------------------------------------------------------------
// 说明:原先 useRevealAnimation composable 需在每个组件 setup 中调用
// 改为全局插件注册,所有组件可直接使用 v-reveal,无需手动注册
// 同时提供 getSSRProps(SSR 安全),避免 server-renderer 报错
// ====================================================================
import type { Directive } from 'vue'

// 单例 Observer(全站共享,提升性能)
let observer: IntersectionObserver | null = null
// 待观察元素集合(避免重复观察)
const observedElements = new Set<Element>()

/**
 * 获取/创建单例 IntersectionObserver
 * 阈值 0.1:元素进入视口 10% 即触发
 */
function getObserver(): IntersectionObserver | null {
  // SSR 环境:不存在 IntersectionObserver
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  if (observer) return observer

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          // 揭示后停止观察(一次性动画)
          observer?.unobserve(entry.target)
          observedElements.delete(entry.target)
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px', // 略提前触发
    },
  )

  return observer
}

export default defineNuxtPlugin((nuxtApp) => {
  // v-reveal 指令:自动观察绑定元素,进入视口时添加 .is-revealed
  const vReveal: Directive<HTMLElement> = {
    // SSR:返回空 props,避免 server-renderer getSSRProps undefined 错误
    getSSRProps() {
      return {}
    },
    mounted(el) {
      // 确保有 reveal 基础类(若未手动添加)
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal')
      }
      const obs = getObserver()
      if (!obs) {
        // 降级:无 Observer 支持时直接显示
        el.classList.add('is-revealed')
        return
      }
      if (observedElements.has(el)) return
      obs.observe(el)
      observedElements.add(el)
    },
    unmounted(el) {
      observer?.unobserve(el)
      observedElements.delete(el)
    },
  }

  nuxtApp.vueApp.directive('reveal', vReveal)
})
