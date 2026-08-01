// ====================================================================
// 敏感词检测 Composable
// 提交草稿时即时校验,block=直接拦截, warn=提示警告
// ====================================================================
import {
  type SensitiveWord,
  type SensitiveCheckResult,
  SensitiveWordCategory,
  TitleRules,
} from '~/utils/types'

// ===== 内置敏感词库(Mock,实际应从API/词库文件加载) =====
const builtinWords: SensitiveWord[] = [
  // 营销词汇(block)
  { id: 1, word: '重磅', category: SensitiveWordCategory.MARKETING, level: 'block' },
  { id: 2, word: '震惊', category: SensitiveWordCategory.MARKETING, level: 'block' },
  { id: 3, word: '必看', category: SensitiveWordCategory.MARKETING, level: 'block' },
  { id: 4, word: '速看', category: SensitiveWordCategory.MARKETING, level: 'block' },
  { id: 5, word: '不看后悔', category: SensitiveWordCategory.MARKETING, level: 'block' },
  { id: 6, word: '爆款', category: SensitiveWordCategory.MARKETING, level: 'block' },
  { id: 7, word: '刷屏', category: SensitiveWordCategory.MARKETING, level: 'block' },
  // 商业推广(block)
  { id: 10, word: '加微信', category: SensitiveWordCategory.COMMERCIAL, level: 'block' },
  { id: 11, word: '加QQ', category: SensitiveWordCategory.COMMERCIAL, level: 'block' },
  { id: 12, word: '扫码进群', category: SensitiveWordCategory.COMMERCIAL, level: 'block' },
  { id: 13, word: '优惠价', category: SensitiveWordCategory.COMMERCIAL, level: 'block' },
  { id: 14, word: '限时折扣', category: SensitiveWordCategory.COMMERCIAL, level: 'block' },
  // 隐私泄露模式(block)
  { id: 20, word: '身份证号', category: SensitiveWordCategory.PRIVACY, level: 'warn' },
  { id: 21, word: '手机号', category: SensitiveWordCategory.PRIVACY, level: 'warn' },
  { id: 22, word: '家庭住址', category: SensitiveWordCategory.PRIVACY, level: 'warn' },
  // 网络热梗(warn)
  { id: 30, word: 'yyds', category: SensitiveWordCategory.SLANG, level: 'warn' },
  { id: 31, word: '绝绝子', category: SensitiveWordCategory.SLANG, level: 'warn' },
  { id: 32, word: '躺平', category: SensitiveWordCategory.SLANG, level: 'warn' },
  { id: 33, word: '内卷', category: SensitiveWordCategory.SLANG, level: 'warn' },
]

export function useSensitiveCheck() {
  /** 检测文本中的敏感词 */
  const checkText = (text: string): SensitiveCheckResult => {
    if (!text.trim()) return { passed: true, blockedWords: [], warnedWords: [] }

    const blockedWords: SensitiveWord[] = []
    const warnedWords: SensitiveWord[] = []
    const lowerText = text.toLowerCase()

    for (const word of builtinWords) {
      if (lowerText.includes(word.word.toLowerCase())) {
        if (word.level === 'block') {
          blockedWords.push(word)
        } else {
          warnedWords.push(word)
        }
      }
    }

    // 正则检测: 完整身份证号(18位)
    if (/\d{17}[\dXx]/.test(text)) {
      blockedWords.push({
        id: 100,
        word: '疑似身份证号',
        category: SensitiveWordCategory.PRIVACY,
        level: 'block',
      })
    }

    // 正则检测: 完整手机号(11位)
    if (/1[3-9]\d{9}/.test(text.replace(/\s/g, ''))) {
      warnedWords.push({
        id: 101,
        word: '疑似手机号',
        category: SensitiveWordCategory.PRIVACY,
        level: 'warn',
      })
    }

    return {
      passed: blockedWords.length === 0,
      blockedWords,
      warnedWords,
    }
  }

  /** 检测标题(额外检查营销词和长度) */
  const checkTitle = (title: string): { errors: string[]; warnings: string[] } => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!title.trim()) {
      errors.push('标题不能为空')
      return { errors, warnings }
    }

    if (title.length > TitleRules.maxLength) {
      errors.push(`标题不超过${TitleRules.maxLength}字，当前${title.length}字`)
    }

    // 检查营销词
    for (const word of TitleRules.bannedWords) {
      if (title.includes(word)) {
        errors.push(`标题禁止使用"${word}"等营销词汇`)
      }
    }

    return { errors, warnings }
  }

  /** 检测正文格式 */
  const checkContent = (html: string): { errors: string[]; warnings: string[] } => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!html.trim()) {
      errors.push('正文内容不能为空')
      return { errors, warnings }
    }

    // 检测外部脚本/iframe
    if (/<script|<iframe|<object|<embed/i.test(html)) {
      errors.push('正文禁止包含脚本、iframe等外部嵌入代码')
    }

    // 检测外部链接
    const externalLinks = html.match(/href="(https?:\/\/(?!.*sziit|.*moe\.gov|.*edu\.gd\.gov|.*szeb\.sz\.gov))/gi)
    if (externalLinks && externalLinks.length > 0) {
      warnings.push('检测到非校内/官方域名外链，请确认链接合规')
    }

    // 检测"点击这里"类模糊链接文字
    if (/点击这里|查看详情|点击此处/i.test(html)) {
      warnings.push('链接文字禁止使用"点击这里""查看详情"等模糊描述，需写明链接内容')
    }

    // 敏感词检测
    const text = html.replace(/<[^>]+>/g, '') // 去HTML标签
    const sensitiveResult = checkText(text)
    if (!sensitiveResult.passed) {
      const words = sensitiveResult.blockedWords.map(w => `"${w.word}"`).join('、')
      errors.push(`包含违禁词汇: ${words}，请修改后重新提交`)
    }
    if (sensitiveResult.warnedWords.length > 0) {
      const words = sensitiveResult.warnedWords.map(w => `"${w.word}"`).join('、')
      warnings.push(`建议检查: ${words}`)
    }

    return { errors, warnings }
  }

  /** 图片校验 */
  const checkImage = (file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    const maxSize = 2 * 1024 * 1024 // 2MB

    if (!allowedTypes.includes(file.type)) {
      errors.push('仅支持 JPG/PNG 格式，不支持 PSD/RAW/GIF/动图')
    }

    if (file.size > maxSize) {
      errors.push(`图片大小不能超过2MB，当前${(file.size / 1024 / 1024).toFixed(1)}MB`)
    }

    return { valid: errors.length === 0, errors }
  }

  /** 附件校验 */
  const checkAttachment = (file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (!allowedTypes.includes(file.type)) {
      errors.push('附件仅支持 PDF、Word、Excel 格式，禁止 exe/压缩包')
    }

    return { valid: errors.length === 0, errors }
  }

  return { checkText, checkTitle, checkContent, checkImage, checkAttachment }
}
