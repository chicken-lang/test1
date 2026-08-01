import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  TagVisibility,
  TAG_PREFIX,
  API_PATH_PATTERNS,
  UserRole,
  getTagType,
  type UserRoleType,
} from '../constants/tag.constants.js'

/**
 * 标签展示过滤拦截器
 *
 * 根据接口类型和用户角色自动过滤标签数据，实现三维标签可见性控制：
 * 1. 文章详情接口 → 不返回任何标签
 * 2. 公开列表/搜索接口 → 根据角色返回对应标签
 * 3. 后台管理接口 → 根据角色返回对应标签
 *
 * 安全基线：
 * - 栏目私有标签和管控标签在前台接口中严格过滤，不可泄露
 * - 文章详情接口对所有角色不返回标签，消除C2冲突
 * - 编辑不可查看其他栏目的私有标签
 * - 管控标签仅系统管理员可见，其他角色任何接口均不可获取
 */
@Injectable()
export class TagFilterInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TagFilterInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const url = request.originalUrl || request.url || ''

    return next.handle().pipe(
      map((response) => {
        try {
          const user = request.user as {
            role?: string
            bindColumnIds?: number[]
          } | undefined

          const visibility = this.determineVisibility(url, user)

          if (visibility === TagVisibility.NONE) {
            return this.removeAllTags(response)
          }

          if (visibility === TagVisibility.PUBLIC_ONLY) {
            return this.filterTagsByVisibility(response, visibility, user)
          }

          if (
            visibility === TagVisibility.PUBLIC_PLUS_COLUMN ||
            visibility === TagVisibility.PUBLIC_PLUS_ALL_COLUMN ||
            visibility === TagVisibility.ALL
          ) {
            return this.filterTagsByVisibility(response, visibility, user)
          }

          return response
        } catch (error) {
          this.logger.error('标签过滤拦截器执行失败', error)
          return response
        }
      }),
    )
  }

  /**
   * 根据接口URL和用户角色判断标签可见性
   */
  private determineVisibility(
    url: string,
    user?: { role?: string; bindColumnIds?: number[] },
  ): TagVisibility {
    const role = user?.role as UserRoleType | undefined

    // 文章详情接口 → 不返回任何标签
    if (this.matchesAny(url, API_PATH_PATTERNS.ARTICLE_DETAIL)) {
      return TagVisibility.NONE
    }

    // 列表接口/搜索接口
    if (
      this.matchesAny(url, [
        ...API_PATH_PATTERNS.COLUMN_LIST,
        ...API_PATH_PATTERNS.SEARCH,
        ...API_PATH_PATTERNS.PUBLIC_ARTICLE_LIST,
      ])
    ) {
      if (!user || !role) {
        return TagVisibility.PUBLIC_ONLY
      }
      return this.getVisibilityByRole(role)
    }

    // 后台管理列表接口
    if (this.matchesAny(url, API_PATH_PATTERNS.ADMIN_ARTICLE_LIST)) {
      if (!user || !role) {
        return TagVisibility.NONE
      }
      return this.getVisibilityByRole(role)
    }

    // 后台编辑/预览接口
    if (this.matchesAny(url, API_PATH_PATTERNS.ADMIN_ARTICLE_EDIT)) {
      if (!user || !role) {
        return TagVisibility.NONE
      }
      return this.getVisibilityByRole(role)
    }

    return TagVisibility.PUBLIC_ONLY
  }

  /**
   * 根据用户角色获取标签可见性级别
   */
  private getVisibilityByRole(role: UserRoleType): TagVisibility {
    switch (role) {
      case UserRole.EDITOR:
      case UserRole.REVIEWER:
        return TagVisibility.PUBLIC_PLUS_COLUMN
      case UserRole.COLUMN_ADMIN:
        return TagVisibility.PUBLIC_PLUS_ALL_COLUMN
      case UserRole.SYSTEM_ADMIN:
        return TagVisibility.ALL
      default:
        return TagVisibility.PUBLIC_ONLY
    }
  }

  /**
   * 判断URL是否匹配任一正则模式
   */
  private matchesAny(url: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(url))
  }

  /**
   * 移除响应中的所有标签数据（文章详情接口使用）
   */
  private removeAllTags(response: any): any {
    if (!response || typeof response !== 'object') return response

    const data = response.data ?? response

    if (!data) return response

    const removeTagsFromObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj
      if (obj instanceof Date) return obj.toISOString()
      if (obj instanceof RegExp) return String(obj)
      if (obj.constructor?.name !== 'Object' && !Array.isArray(obj)) {
        return String(obj)
      }

      if (Array.isArray(obj)) {
        return obj.map(removeTagsFromObject)
      }

      const result: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        // 跳过所有标签字段
        if (this.isTagField(key)) {
          result[key] = []
          continue
        }
        result[key] = typeof value === 'object' && value !== null
          ? removeTagsFromObject(value)
          : value
      }
      return result
    }

    // 处理 ApiResponse 包装: { code, message, data, timestamp }
    if ('data' in response && ('code' in response || 'message' in response)) {
      return {
        ...response,
        data: this.processDataField(data, removeTagsFromObject),
      }
    }

    return removeTagsFromObject(response)
  }

  /**
   * 根据可见性级别过滤标签
   */
  private filterTagsByVisibility(
    response: any,
    visibility: TagVisibility,
    user?: { role?: string; bindColumnIds?: number[] },
  ): any {
    if (!response || typeof response !== 'object') return response

    const data = response.data ?? response

    if (!data) return response

    const filterTagsFromObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj
      if (obj instanceof Date) return obj.toISOString()
      if (obj instanceof RegExp) return String(obj)
      if (obj.constructor?.name !== 'Object' && !Array.isArray(obj)) {
        return String(obj)
      }

      if (Array.isArray(obj)) {
        return obj.map(filterTagsFromObject)
      }

      const result: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        if (this.isTagField(key)) {
          result[key] = this.filterTagArray(value, visibility)
          continue
        }
        result[key] = typeof value === 'object' && value !== null
          ? filterTagsFromObject(value)
          : value
      }
      return result
    }

    // 处理 ApiResponse 包装
    if ('data' in response && ('code' in response || 'message' in response)) {
      return {
        ...response,
        data: this.processDataField(data, filterTagsFromObject),
      }
    }

    return filterTagsFromObject(response)
  }

  /**
   * 处理响应中的 data 字段（支持分页结构）
   */
  private processDataField(data: any, processor: (obj: any) => any): any {
    if (!data) return data

    // 分页结构: { list: [...], total, page, pageSize }
    if (data.list && Array.isArray(data.list)) {
      return {
        ...data,
        list: data.list.map(processor),
      }
    }

    // 单个对象
    if (typeof data === 'object') {
      return processor(data)
    }

    // 数组
    if (Array.isArray(data)) {
      return data.map(processor)
    }

    return data
  }

  /**
   * 过滤标签数组，根据可见性级别决定保留哪些标签
   */
  private filterTagArray(tags: any, visibility: TagVisibility): any[] {
    if (!tags || !Array.isArray(tags)) return []

    return tags.filter((tag) => {
      const tagCode = this.extractTagCode(tag)
      const tagType = getTagType(tagCode)

      if (!tagType) return false

      switch (visibility) {
        case TagVisibility.NONE:
          return false

        case TagVisibility.PUBLIC_ONLY:
          return tagType === 'public'

        case TagVisibility.PUBLIC_PLUS_COLUMN:
          return tagType === 'public' || tagType === 'column'

        case TagVisibility.PUBLIC_PLUS_ALL_COLUMN:
          return tagType === 'public' || tagType === 'column'

        case TagVisibility.ALL:
          return true

        default:
          return tagType === 'public'
      }
    })
  }

  /**
   * 从标签对象或字符串中提取标签编码
   */
  private extractTagCode(tag: any): string {
    if (typeof tag === 'string') return tag
    if (tag && typeof tag === 'object') {
      return tag.tagCode || tag.code || tag.tag || ''
    }
    return ''
  }

  /**
   * 判断字段名是否为标签相关字段
   */
  private isTagField(key: string): boolean {
    return [
      'tags',
      'businessTags',
      'roleTags',
      'timeTags',
    ].includes(key)
  }
}
