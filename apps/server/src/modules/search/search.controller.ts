import { Controller, Get, Query, Req, UsePipes, ValidationPipe, Headers, UseGuards, Inject } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { SearchService } from './search.service.js'
import { SearchDto, SuggestDto } from './dto/search.dto.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { SearchUserType } from './search.constants.js'
import { SearchThrottlerGuard } from '../throttler/search-throttler.guard.js'
import { ThrottlerPreset, THROTTLER_PRESETS } from '../throttler/throttler.constants.js'

@Controller('public/search')
@UseGuards(SearchThrottlerGuard)
export class SearchController {
  private searchService: SearchService

  constructor(
    @Inject(SearchService) searchService: SearchService,
  ) {
    this.searchService = searchService
  }

  @Get()
  @Throttle({ [ThrottlerPreset.RELAXED]: THROTTLER_PRESETS[ThrottlerPreset.RELAXED] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(
    @Query() dto: SearchDto,
    @Req() req: any,
    @Headers('x-client-type') clientType?: string,
  ) {
    const token = this.extractToken(req)
    const { userType, adminId } = await this.searchService.resolveUserType(token)

    const isMobile = this.isMobileRequest(clientType, req.headers['user-agent'])

    const result = await this.searchService.search(
      dto,
      userType,
      adminId,
      isMobile,
      req.ip,
      req.headers['user-agent'],
    )

    return ApiResponseHelper.success(result)
  }

  @Get('suggest')
  @Throttle({ [ThrottlerPreset.RELAXED]: THROTTLER_PRESETS[ThrottlerPreset.RELAXED] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async suggest(
    @Query() dto: SuggestDto,
    @Req() req: any,
  ) {
    const result = await this.searchService.getSuggestions(dto, req.ip)
    return ApiResponseHelper.success(result)
  }

  private extractToken(req: any): string | null {
    const authHeader = req.headers['authorization']
    if (!authHeader) return null
    return authHeader.replace('Bearer ', '')
  }

  private isMobileRequest(clientType?: string, userAgent?: string): boolean {
    if (clientType === 'mobile') return true
    if (!userAgent) return false
    return /mobile|android|iphone|ipad|ipod|blackberry|opera mini|iemobile/i.test(
      userAgent,
    )
  }
}