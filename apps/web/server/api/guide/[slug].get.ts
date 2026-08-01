// 事项页数据接口(需求 5.2 事项页模板)
// 返回指定办事指南栏目的事项列表,含固定结构:办理对象→流程→材料→时限→联系→附件
import { proxyPublicBackend } from '../../utils/backendProxy'
import { guideItems } from '~/mock/data'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''

  try {
    return await proxyPublicBackend(event, 'GET', `/api/v1/public/guide-items/${slug}`, {
      mapType: 'guide',
      fallbackHandler: () => {
        let list = guideItems
        if (slug && slug !== 'guide') {
          list = guideItems.filter((item) => item.columnSlug === slug)
        }
        return { list, total: list.length }
      },
    })
  } catch {
    let list = guideItems
    if (slug && slug !== 'guide') {
      list = guideItems.filter((item) => item.columnSlug === slug)
    }
    return { code: 0, data: { list, total: list.length }, message: 'ok (mock)' }
  }
})