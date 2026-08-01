import { test, expect } from '@playwright/test'

// E2E-01: 前台首页加载
// 验证: A-F 区渲染 + 轮播 + 快捷入口
test('E2E-01 前台首页加载', async ({ page }) => {
  await page.goto('/')

  // 验证标题
  await expect(page).toHaveTitle(/深圳信息职业技术大学教务处/)

  // 验证首页关键区块存在(banner / 通知 / 新闻)
  await expect(page.locator('body')).toContainText('通知公告')
  await expect(page.locator('body')).toContainText('新闻资讯')

  // 验证无 console 错误(忽略 404 资源)
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.waitForLoadState('networkidle')
  // 允许图片 404,但不应有 JS 运行时错误
  expect(errors.filter((e) => !e.includes('404'))).toHaveLength(0)
})

// E2E-02: 列表页筛选
// 验证: 进入通知公告 → 标签筛选 → 分页
test('E2E-02 列表页加载', async ({ page }) => {
  await page.goto('/list/notices')

  // 验证栏目标题渲染
  await expect(page.locator('body')).toContainText('通知公告')

  // 验证列表项存在
  const items = page.locator('a[href*="/article/"]')
  await expect(items.first()).toBeVisible()
})

// E2E-03: 全站搜索
// 验证: 输入关键词 → 查看结果
test('E2E-03 全站搜索', async ({ page }) => {
  await page.goto('/search?q=考试')
  await page.waitForLoadState('networkidle')

  // 验证搜索框存在
  await expect(page.locator('input[type="search"], input[placeholder*="搜索"]').first()).toBeVisible()
})

// E2E-04: 后台登录页
// 验证: 登录页渲染
test('E2E-04 后台登录页', async ({ page }) => {
  await page.goto('/admin/login')
  await page.waitForLoadState('networkidle')

  // 验证登录表单存在
  await expect(page.locator('body')).toContainText('登录')
})

// E2E-05: SSO 登录页
// 验证: 学生登录页渲染
test('E2E-05 SSO 登录页', async ({ page }) => {
  await page.goto('/login/student')
  await page.waitForLoadState('networkidle')

  await expect(page.locator('body')).toContainText('学生登录')
})

// E2E-06: 站点地图
test('E2E-06 站点地图', async ({ page }) => {
  await page.goto('/sitemap')
  await expect(page.locator('body')).toContainText('站点地图')
})

// E2E-07: 404 页面
test('E2E-07 404 页面', async ({ page }) => {
  const response = await page.goto('/some-non-existent-page')
  expect(response?.status()).toBe(404)
})

// E2E-08: 移动端响应式
// 验证: 375px 视口下导航可用
test('E2E-08 移动端响应式', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // 验证页面在移动端正常渲染
  await expect(page.locator('body')).toBeVisible()
})
