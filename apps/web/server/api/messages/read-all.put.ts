import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'PUT', '/api/v1/messages/read-all', { fallbackToMock: true })
})