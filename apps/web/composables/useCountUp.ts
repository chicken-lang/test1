// ====================================================================
// 数字滚动动画 composable v3.0
// 用于首页统计数字的入场动效(从 0 滚动到目标值)
// 尊重 prefers-reduced-motion,降级为直接显示
// ====================================================================

interface CountUpOptions {
  // 目标值
  end: number
  // 动画时长(毫秒),默认 1200
  duration?: number
  // 起始值,默认 0
  start?: number
  // 小数位数,默认 0
  decimals?: number
}

/**
 * 数字滚动动画
 * 用法: const { display } = useCountUp({ end: 62, duration: 1500 })
 * 模板中: <span>{{ display }}</span>
 */
export function useCountUp(options: CountUpOptions) {
  const { end, duration = 1200, start = 0, decimals = 0 } = options

  const display = ref(start)
  const isAnimating = ref(false)
  const hasAnimated = ref(false)

  // 检测 prefers-reduced-motion(SSR 安全:服务端渲染时直接返回 false)
  const prefersReducedMotion = import.meta.client
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  // 执行动画
  const animate = () => {
    if (hasAnimated.value) return
    hasAnimated.value = true
    isAnimating.value = true

    // 降级:尊重用户偏好,直接显示终值
    if (prefersReducedMotion) {
      display.value = end
      isAnimating.value = false
      return
    }

    const startTime = performance.now()
    const diff = end - start

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo 缓动:快进慢出,适合数字滚动
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      display.value = Number((start + diff * eased).toFixed(decimals))

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        display.value = end
        isAnimating.value = false
      }
    }

    requestAnimationFrame(tick)
  }

  // 重置(可重新触发)
  const reset = () => {
    hasAnimated.value = false
    display.value = start
  }

  return {
    display,
    isAnimating,
    animate,
    reset,
  }
}
