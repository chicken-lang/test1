import {
  Controller,
  Get,
  Query,
  Inject,
  BadRequestException,
  Req,
  Headers,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common'
import { HomepageRecommendationService } from './homepage-recommendation.service.js'
import {
  RoleTag,
  ROLE_TAG_VALUES,
  RecommendSection,
  RECOMMEND_SECTION_VALUES,
  RecommendErrorCode,
  ROLE_LABELS,
} from './homepage-recommendation.constants.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/homepage/recommend')
export class HomepageRecommendationController {
  private readonly logger = new Logger(HomepageRecommendationController.name)
  private readonly service: HomepageRecommendationService

  constructor(
    @Inject(HomepageRecommendationService) service: HomepageRecommendationService,
  ) {
    this.service = service
  }

  /**
   * 获取首页完整推荐数据（公开接口）
   * GET /api/v1/public/homepage/recommend
   *
   * @param role 角色标签 (student | teacher | visitor)，默认 visitor
   * @param noticeLimit 通知推荐数量，默认 10
   * @param guideLimit 指南推荐数量，默认 8
   * @param quickLinkLimit 快捷入口数量，默认 6
   * @param topicLimit 专题推荐数量，默认 4
   */
  @Get()
  async getHomepageRecommendations(
    @Query('role') role?: string,
    @Query('noticeLimit') noticeLimit?: string,
    @Query('guideLimit') guideLimit?: string,
    @Query('quickLinkLimit') quickLinkLimit?: string,
    @Query('topicLimit') topicLimit?: string,
    @Req() req?: any,
    @Headers('x-sso-user') ssoUser?: string,
  ) {
    // 如果未传 role，尝试从 SSO 头或请求中推断
    let resolvedRole = role
    if (!resolvedRole && ssoUser) {
      resolvedRole = this.inferRoleFromSso(ssoUser)
    }

    try {
      const result = await this.service.getHomepageRecommendations(resolvedRole, {
        noticeLimit: noticeLimit ? Number(noticeLimit) : undefined,
        guideLimit: guideLimit ? Number(guideLimit) : undefined,
        quickLinkLimit: quickLinkLimit ? Number(quickLinkLimit) : undefined,
        topicLimit: topicLimit ? Number(topicLimit) : undefined,
      })

      return ApiResponseHelper.success(result)
    } catch (error) {
      this.logger.error('获取首页推荐数据失败', error)
      throw new InternalServerErrorException(error.message || '获取首页推荐数据失败')
    }
  }

  /**
   * 获取指定区域的推荐内容（公开接口）
   * GET /api/v1/public/homepage/recommend/section
   *
   * @param section 推荐区域 (notice | guide | quickLink | topic)
   * @param role 角色标签
   * @param limit 返回数量
   */
  @Get('section')
  async getSectionRecommendations(
    @Query('section') section: string,
    @Query('role') role?: string,
    @Query('limit') limit?: string,
  ) {
    if (!RECOMMEND_SECTION_VALUES.includes(section as RecommendSection)) {
      throw new BadRequestException({
        code: RecommendErrorCode.INVALID_SECTION,
        message: `无效的推荐区域: ${section}`,
        validSections: RECOMMEND_SECTION_VALUES,
      })
    }

    try {
      const result = await this.service.getSectionRecommendations(
        section as RecommendSection,
        role,
        limit ? Number(limit) : undefined,
      )

      return ApiResponseHelper.success(result)
    } catch (error) {
      this.logger.error(`获取推荐区域数据失败: ${section}`, error)
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException(error.message || '获取推荐区域数据失败')
    }
  }

  /**
   * 获取支持的角色标签列表（公开接口）
   * GET /api/v1/public/homepage/recommend/roles
   */
  @Get('roles')
  async getSupportedRoles() {
    const roles = this.service.getSupportedRoles()
    return ApiResponseHelper.success({
      roles,
      defaultRole: RoleTag.VISITOR,
      total: roles.length,
    })
  }

  /**
   * 从 SSO 用户信息推断角色
   */
  private inferRoleFromSso(ssoUser: string): string {
    try {
      const userInfo = JSON.parse(ssoUser)
      if (userInfo?.type === 'student') return RoleTag.STUDENT
      if (userInfo?.type === 'teacher') return RoleTag.TEACHER
      if (userInfo?.role === 'student') return RoleTag.STUDENT
      if (userInfo?.role === 'teacher') return RoleTag.TEACHER
    } catch {
      // SSO 信息解析失败，返回默认
    }
    return RoleTag.VISITOR
  }
}
