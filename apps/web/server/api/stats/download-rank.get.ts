import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'GET', '/api/v1/stats/download-rank', { fallbackToMock: false })
})