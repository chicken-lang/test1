import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'POST', '/api/v1/messages/admin/notice', {
    fallbackToMock: true,
  })
})