// ====================================================================
// 滚动揭示动画 composable
// 配合 CSS .reveal / .is-revealed 类(见 main.scss)
// 使用 IntersectionObserver 检测元素进入视口,触发入场动画
// 尊重 prefers-reduced-motion:降级为直接显示
// ====================================================================
import { onUnmounted, type Directive } from 'vue'

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

/**
 * 滚动揭示动画 composable
 *
 * 用法 1(指令):在组件 setup 中注册
 * ```ts
 * const { vReveal } = useRevealAnimation()
 * ```
 * 模板:
 * ```html
 * <div v-reveal class="reveal">内容</div>
 * <div v-reveal class="reveal reveal-delay-2">内容</div>
 * ```
 *
 * 用法 2(函数):手动观察元素
 * ```ts
 * const { observe } = useRevealAnimation()
 * observe(refEl.value)
 * ```
 */
export function useRevealAnimation() {
  /**
   * 观察单个元素,进入视口时添加 .is-revealed
   */
  function observe(el: Element | null | undefined) {
    if (!el) return
    const obs = getObserver()
    if (!obs) {
      // 降级:无 Observer 支持时直接显示
      el.classList.add('is-revealed')
      return
    }
    if (observedElements.has(el)) return
    obs.observe(el)
    observedElements.add(el)
  }

  /**
   * 批量观察元素
   */
  function observeAll(els: Element[] | NodeListOf<Element> | null | undefined) {
    if (!els) return
    Array.from(els).forEach(observe)
  }

  /**
   * 停止观察(组件卸载时调用)
   */
  function unobserve(el: Element | null | undefined) {
    if (!el) return
    observer?.unobserve(el)
    observedElements.delete(el)
  }

  // v-reveal 指令:自动观察绑定元素
  const vReveal: Directive<HTMLElement> = {
    mounted(el) {
      // 确保有 reveal 基础类(若未手动添加)
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal')
      }
      observe(el)
    },
    unmounted(el) {
      unobserve(el)
    },
  }

  // 组件卸载时清理(防止内存泄漏)
  onUnmounted(() => {
    // 注意:不主动 disconnect 全局 observer
    // 因为多组件共享,各组件 mounted/unmounted 频繁切换时
    // observer 自身开销极小,保持单例即可
  })

  return {
    vReveal,
    observe,
    observeAll,
    unobserve,
  }
}
