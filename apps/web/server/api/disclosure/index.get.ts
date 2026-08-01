// GET /api/disclosure - 信息公开目录
export default defineEventHandler(async () => {
  return apiOk(mockDisclosureDirectory())
})
