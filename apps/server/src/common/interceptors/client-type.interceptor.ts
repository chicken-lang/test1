import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Scope,
} from '@nestjs/common'
import { map } from 'rxjs'

/**
 * 客户端类型枚举
 */
export enum ClientType {
  PC = 'pc',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

/**
 * 移动端分页配置
 */
const MOBILE_PAGINATION = {
  DEFAULT_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 15,
}

/**
 * PC端分页配置
 */
const PC_PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
}

/**
 * 客户端类型识别拦截器
 *
 * 职责：
 * 1. 识别请求来源的客户端类型（X-Client-Type 头 > User-Agent > 默认 pc）
 * 2. 将 clientType 注入 request 对象，供后续业务逻辑使用
 * 3. 根据客户端类型调整分页参数（移动端默认 pageSize=5, 最大 15；PC 端默认 20, 最大 50）
 * 4. 响应阶段为移动端分页数据注入 hasMore 字段
 *
 * 安全提示：X-Client-Type 头可被伪造，安全相关逻辑不可仅依赖此标识。
 */
@Injectable({ scope: Scope.REQUEST })
export class ClientTypeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest()

    // ===== 1. 识别客户端类型 =====
    const clientType = this.detectClientType(request)
    request.clientType = clientType

    // ===== 2. 适配分页参数 =====
    this.adaptPagination(request, clientType)

    // ===== 3. 响应阶段增强 =====
    return next.handle().pipe(
      map((data: any) => {
        if (clientType === ClientType.MOBILE || clientType === ClientType.TABLET) {
          return this.enhanceMobileResponse(data)
        }
        return data
      }),
    )
  }

  /**
   * 识别客户端类型
   * 优先级: X-Client-Type 头 > User-Agent 解析 > 默认 pc
   */
  private detectClientType(request: any): ClientType {
    // 方式1: X-Client-Type 请求头
    const headerType = request.headers['x-client-type'] as string | undefined
    if (headerType) {
      const normalized = headerType.toLowerCase().trim()
      if (Object.values(ClientType).includes(normalized as ClientType)) {
        return normalized as ClientType
      }
    }

    // 方式2: User-Agent 解析
    const userAgent: string = request.headers['user-agent'] || ''
    const uaLower = userAgent.toLowerCase()

    // 平板判定优先于手机（iPad UA 中包含 Mobile 关键字）
    if (/ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(uaLower)) {
      return ClientType.TABLET
    }
    if (/mobile|android.*mobile|iphone|ipod|blackberry|windows phone|opera mini|iemobile|silk/i.test(uaLower)) {
      return ClientType.MOBILE
    }

    // 方式3: 默认 pc
    return ClientType.PC
  }

  /**
   * 根据客户端类型调整分页参数
   */
  private adaptPagination(request: any, clientType: ClientType): void {
    if (!request.query) request.query = {}

    const config =
      clientType === ClientType.MOBILE || clientType === ClientType.TABLET
        ? MOBILE_PAGINATION
        : PC_PAGINATION

    // 调整 pageSize 默认值和上限
    if (request.query.pageSize !== undefined) {
      const size = Number(request.query.pageSize)
      if (isNaN(size) || size < 1) {
        request.query.pageSize = String(config.DEFAULT_PAGE_SIZE)
      } else if (size > config.MAX_PAGE_SIZE) {
        request.query.pageSize = String(config.MAX_PAGE_SIZE)
      }
    } else {
      request.query.pageSize = String(config.DEFAULT_PAGE_SIZE)
    }

    // 确保 page 合法
    if (request.query.page !== undefined) {
      const page = Number(request.query.page)
      if (isNaN(page) || page < 1) {
        request.query.page = '1'
      }
    } else {
      request.query.page = '1'
    }
  }

  /**
   * 为移动端响应添加增强字段
   * - 分页数据: 注入 hasMore 字段
   */
  private enhanceMobileResponse(data: any): any {
    if (!data || typeof data !== 'object') return data

    // 检测 ApiResponse 格式 { code, message, data, timestamp }
    if (data.code === undefined || data.data === undefined) return data

    const responseData = data.data

    // 检测分页数据 PaginatedData<T> { list, total, page, pageSize }
    if (
      responseData &&
      Array.isArray(responseData.list) &&
      typeof responseData.total === 'number' &&
      typeof responseData.page === 'number' &&
      typeof responseData.pageSize === 'number'
    ) {
      const { list, total, page, pageSize } = responseData
      const hasMore = page * pageSize < total

      return {
        ...data,
        data: {
          ...responseData,
          hasMore,
        },
      }
    }

    return data
  }
}