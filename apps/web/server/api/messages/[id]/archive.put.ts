import { defineEventHandler } from 'h3'
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  return proxyToBackend(event, 'PUT', `/api/v1/messages/${id}/archive`, { fallbackToMock: true })
})