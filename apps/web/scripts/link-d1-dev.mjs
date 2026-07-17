/**
 * 把 nuxt dev 使用的 miniflare v2 D1 目录
 * 链接到 wrangler v4 使用的 miniflare v3 D1 目录，
 * 解决两边读写不同 SQLite 文件的问题。
 */
import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'

const v3Dir = join(process.cwd(), '.wrangler/state/v3/d1')
const v2Dir = join(process.cwd(), '.wrangler/state/d1')

if (!existsSync(v3Dir)) {
  console.error('未找到 v3 D1 目录，请先执行 pnpm db:schema')
  process.exit(1)
}

// 删除旧的 v2 D1 目录（可能是空库或旧数据）
if (existsSync(v2Dir)) {
  rmSync(v2Dir, { recursive: true, force: true })
}

// 确保父目录存在
mkdirSync(join(process.cwd(), '.wrangler/state'), { recursive: true })

// Windows 用 junction，Unix 用 symlink
symlinkSync(v3Dir, v2Dir, 'junction')
console.log(`已链接: ${v2Dir} -> ${v3Dir}`)
