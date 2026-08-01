import { ErrorCode, type ApiResponse, type PaginatedData } from '@jwc/shared'

/**
 * 统一 API 响应格式辅助类
 *
 * 所有 Controller 返回格式严格遵循 @jwc/shared 中定义的 ApiResponse<T>:
 * { code, message, data, timestamp }
 */
export class ApiResponseHelper {
  /**
   * 成功响应
   * @param data    业务数据
   * @param message 提示信息,默认 'ok'
   */
  static success<T>(data: T, message = 'ok'): ApiResponse<T> {
    return {
      code: ErrorCode.SUCCESS,
      message,
      data,
      timestamp: Date.now(),
    }
  }

  /**
   * 错误响应
   * @param code    业务错误码(参考 ErrorCode)
   * @param message 错误描述
   */
  static error(code: number, message: string): ApiResponse<null> {
    return {
      code,
      message,
      data: null,
      timestamp: Date.now(),
    }
  }

  /**
   * 分页响应
   * @param list     当前页数据列表
   * @param total    总记录数
   * @param page     当前页码
   * @param pageSize 每页条数
   * @param hasMore  是否有更多数据(移动端专用，通常由 ClientTypeInterceptor 自动注入)
   */
  static paginated<T>(
    list: T[],
    total: number,
    page: number,
    pageSize: number,
    hasMore?: boolean,
  ): ApiResponse<PaginatedData<T>> {
    return {
      code: ErrorCode.SUCCESS,
      message: 'ok',
      data: {
        list,
        total,
        page,
        pageSize,
        ...(hasMore !== undefined ? { hasMore } : {}),
      },
      timestamp: Date.now(),
    }
  }
}
