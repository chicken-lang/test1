import { writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { createHash } from 'node:crypto'
import { getServerHeader } from '~/server/utils/backendProxy'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_FILE_SIZE = 20 * 1024 * 1024

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event)
    
    if (!form || form.length === 0) {
      return { code: 400, message: '没有上传文件', data: null }
    }

    const results: Array<{ url: string; name: string; size: number; type: string }> = []

    for (const part of form) {
      if (!part.filename || !part.data) continue

      const ext = extname(part.filename).toLowerCase()
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE

      if (part.data.length > maxSize) {
        return { code: 413, message: `文件 "${part.filename}" 超过 ${isImage ? '5MB' : '20MB'} 限制`, data: null }
      }

      const hash = createHash('md5').update(`${Date.now()}-${part.filename}`).digest('hex').slice(0, 12)
      const storedName = `${hash}${ext}`

      await mkdir(UPLOAD_DIR, { recursive: true })
      const filePath = join(UPLOAD_DIR, storedName)
      await writeFile(filePath, part.data)

      const url = `/uploads/${storedName}`
      results.push({
        url,
        name: part.filename,
        size: part.data.length,
        type: isImage ? 'image' : 'file',
      })
    }

    return { code: 0, message: '上传成功', data: results }
  } catch (e: any) {
    console.error('Upload error:', e)
    return { code: 500, message: e?.message || '上传失败', data: null }
  }
})