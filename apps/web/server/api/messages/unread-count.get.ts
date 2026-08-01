import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'GET', '/api/v1/messages/unread-count', {
    fallbackToMock: true,
  })
})