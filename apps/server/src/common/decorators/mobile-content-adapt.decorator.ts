import { SetMetadata } from '@nestjs/common'

/**
 * 移动端正文自适应装饰器
 *
 * 标注在 Controller 方法上,表示该接口返回的 data 中包含需要自适应的 HTML 正文内容。
 * ContentAdapterInterceptor 会识别此装饰器并对 HTML 内容进行移动端适配处理。
 *
 * @param fields 需要自适应的字段名列表，默认为 ['content', 'body', 'html']
 *
 * @example
 * ```ts
 * @Get(':id')
 * @MobileContentAdapt(['content'])
 * async getById(...) { ... }
 * ```
 */
export const MOBILE_CONTENT_ADAPT_KEY = 'mobile_content_adapt'

export const MobileContentAdapt = (fields: string[] = ['content', 'body', 'html']) =>
  SetMetadata(MOBILE_CONTENT_ADAPT_KEY, fields)