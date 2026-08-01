import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Headers,
  UsePipes,
  ValidationPipe,
  Inject,
} from '@nestjs/common'
import { PublicArticleService } from './public-article.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import type { ArticleListQueryDto, ArticleDetailParamsDto } from './dto/public-article.dto.js'

@Controller('public/articles')
export class PublicArticleController {
  private publicArticleService: PublicArticleService

  constructor(
    @Inject(PublicArticleService) publicArticleService: PublicArticleService,
  ) {
    this.publicArticleService = publicArticleService
  }

  /**
   * 前台文章列表
   * GET /api/v1/public/articles
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getList(
    @Query() dto: ArticleListQueryDto,
    @Req() req: any,
    @Headers('authorization') authHeader?: string,
    @Headers('x-sso-user') ssoUser?: string,
  ) {
    const { visitorType } = await this.publicArticleService.resolveVisitorType(
      authHeader,
      ssoUser,
    )

    const result = await this.publicArticleService.getArticleList(dto, visitorType)

    return ApiResponseHelper.paginated(
      result.list,
      result.total,
      result.page,
      result.pageSize,
    )
  }

  /**
   * 热门文章
   * GET /api/v1/public/articles/hot
   */
  @Get('hot')
  async getHotArticles(
    @Query('limit') limit?: string,
    @Req() req?: any,
    @Headers('authorization') authHeader?: string,
    @Headers('x-sso-user') ssoUser?: string,
  ) {
    const { visitorType } = await this.publicArticleService.resolveVisitorType(
      authHeader,
      ssoUser,
    )

    const articles = await this.publicArticleService.getHotArticles(
      limit ? parseInt(limit, 10) : 10,
      visitorType,
    )

    return ApiResponseHelper.success(articles)
  }

  /**
   * 推荐文章
   * GET /api/v1/public/articles/recommend
   */
  @Get('recommend')
  async getRecommendArticles(
    @Query('limit') limit?: string,
    @Req() req?: any,
    @Headers('authorization') authHeader?: string,
    @Headers('x-sso-user') ssoUser?: string,
  ) {
    const { visitorType } = await this.publicArticleService.resolveVisitorType(
      authHeader,
      ssoUser,
    )

    const articles = await this.publicArticleService.getRecommendArticles(
      limit ? parseInt(limit, 10) : 10,
      visitorType,
    )

    return ApiResponseHelper.success(articles)
  }

  /**
   * 文章详情
   * GET /api/v1/public/articles/:articleSlug
   */
  @Get(':articleSlug')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDetail(
    @Param() params: ArticleDetailParamsDto,
    @Req() req: any,
    @Headers('authorization') authHeader?: string,
    @Headers('x-sso-user') ssoUser?: string,
  ) {
    const { visitorType } = await this.publicArticleService.resolveVisitorType(
      authHeader,
      ssoUser,
    )

    const article = await this.publicArticleService.getArticleDetail(
      params.articleSlug,
      visitorType,
    )

    return ApiResponseHelper.success(article)
  }
}