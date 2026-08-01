import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Scope,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { map } from 'rxjs'
import { ClientType } from './client-type.interceptor.js'
import { MOBILE_CONTENT_ADAPT_KEY } from '../decorators/mobile-content-adapt.decorator.js'

/**
 * 移动端正文自适应拦截器
 *
 * 职责：
 * 对标注了 @MobileContentAdapt() 装饰器的接口，在移动端/平板端请求时，
 * 自动对返回的 HTML 正文内容进行响应式适配：
 * - <img> 注入 max-width:100%;height:auto; 样式
 * - <table> 包裹横向滚动容器
 * - <video> 注入 width:100%; 样式
 * - <iframe> 注入 max-width:100%; 样式
 *
 * 仅在以下条件同时满足时生效：
 * 1. 客户端类型为 mobile 或 tablet（由 ClientTypeInterceptor 注入 request.clientType）
 * 2. 路由方法标记了 @MobileContentAdapt() 装饰器
 */
@Injectable({ scope: Scope.REQUEST })
export class ContentAdapterInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest()
    const clientType = request.clientType

    // 仅处理移动端/平板端
    if (clientType !== ClientType.MOBILE && clientType !== ClientType.TABLET) {
      return next.handle()
    }

    // 检查路由是否标记了 @MobileContentAdapt()
    const handler = context.getHandler()
    const target = context.getClass()
    const adaptFields = this.reflector.getAllAndOverride<string[]>(MOBILE_CONTENT_ADAPT_KEY, [
      handler,
      target,
    ])

    if (!adaptFields || !Array.isArray(adaptFields)) {
      return next.handle()
    }

    // 响应阶段处理
    return next.handle().pipe(
      map((data: any) => {
        if (!data || typeof data !== 'object') return data

        // 仅处理 ApiResponse 格式
        if (data.code === undefined || data.data === undefined) return data

        const responseData = data.data
        const adaptedData = this.adaptContent(responseData, adaptFields)

        return {
          ...data,
          data: adaptedData,
        }
      }),
    )
  }

  /**
   * 递归遍历数据对象，对指定字段进行 HTML 自适应处理
   */
  private adaptContent(data: any, fields: string[]): any {
    if (data === null || data === undefined) return data

    if (Array.isArray(data)) {
      return data.map((item) => this.adaptContent(item, fields))
    }

    if (typeof data !== 'object') return data

    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (fields.includes(key) && typeof value === 'string') {
        result[key] = this.adaptHtml(value)
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.adaptContent(value, fields)
      } else {
        result[key] = value
      }
    }
    return result
  }

  /**
   * 对 HTML 字符串进行移动端自适应处理
   */
  private adaptHtml(html: string): string {
    if (!html || typeof html !== 'string') return html

    let result = html

    // 1. <img> 注入样式
    result = this.injectStyle(result, 'img', 'max-width:100%;height:auto;')

    // 2. <video> 注入样式
    result = this.injectStyle(result, 'video', 'width:100%;')

    // 3. <iframe> 注入样式
    result = this.injectStyle(result, 'iframe', 'max-width:100%;')

    // 4. <table> 包裹横向滚动容器
    result = result.replace(
      /<table\b([^>]*)>([\s\S]*?)<\/table>/gi,
      (_match: string, tableAttrs: string, tableContent: string) => {
        return `<div style="overflow-x:auto;"><table${tableAttrs}>${tableContent}</table></div>`
      },
    )

    return result
  }

  /**
   * 为指定 HTML 标签注入内联样式
   * 如果标签已有 style 属性则追加，否则新增
   */
  private injectStyle(html: string, tagName: string, style: string): string {
    const tagRegex = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi')
    return html.replace(tagRegex, (match: string, attrs: string) => {
      const styleRegex = /style\s*=\s*"([^"]*)"/i
      const styleMatch = attrs.match(styleRegex)

      if (styleMatch) {
        const existingStyles = styleMatch[1]
        const newStyles = existingStyles.trim()
          ? `${existingStyles};${style}`
          : style
        return match.replace(styleRegex, `style="${newStyles}"`)
      }

      // 无 style 属性，新增
      return `<${tagName}${attrs} style="${style}">`
    })
  }
}