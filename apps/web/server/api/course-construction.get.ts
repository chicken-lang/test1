// GET /api/course-construction - 课程建设分区数据
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockCourseConstruction } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/course-construction', {
      fallbackHandler: () => mockCourseConstruction(),
    })
  } catch {
    return { code: 0, data: mockCourseConstruction(), message: 'ok (mock)' }
  }
})