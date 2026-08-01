import { Injectable, BadRequestException, ForbiddenException, Logger, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { RedisService } from '../cache/redis.service.js'
import {
  PositionCode,
  POSITION_CODE_VALUES,
  CarouselStatus,
  CAROUSEL_MAX_COUNT,
  CAROUSEL_CACHE_KEY_PREFIX,
  CAROUSEL_CACHE_TTL,
  CarouselErrorCode,
  CAROUSEL_AUDIT_ACTIONS,
} from './homepage-carousel.constants.js'
import type { SaveCarouselDto } from './dto/homepage-carousel.dto.js'

@Injectable()
export class HomepageCarouselService {
  private readonly logger = new Logger(HomepageCarouselService.name)

  private prisma: PrismaService
  private auditLog: AuditLogService
  private redis: RedisService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLog: AuditLogService,
    @Inject(RedisService) redis: RedisService,
  ) {
    this.prisma = prisma
    this.auditLog = auditLog
    this.redis = redis
  }

  // ==================== 保存轮播图配置 ====================

  async saveCarousel(
    dto: SaveCarouselDto,
    operatorId: number,
    operatorRole: string,
    ip?: string,
  ) {
    // 1. 权限校验：仅栏目管理员(R3)可操作轮播图配置
    if (operatorRole !== 'column_admin') {
      throw new ForbiddenException('仅栏目管理员可配置轮播图')
    }

    // 2. 位置编码校验
    if (!POSITION_CODE_VALUES.includes(dto.positionCode as any)) {
      throw new BadRequestException({
        code: CarouselErrorCode.POSITION_CODE_INVALID,
        message: `positionCode "${dto.positionCode}" 无效`,
      })
    }

    // 3. 数量约束校验：轮播图最多5张
    if (dto.items.length > CAROUSEL_MAX_COUNT) {
      throw new BadRequestException({
        code: CarouselErrorCode.MAX_COUNT_EXCEEDED,
        message: `轮播图最多${CAROUSEL_MAX_COUNT}张，当前已选择${dto.items.length}张，请减少后重新保存`,
        data: {
          maxAllowed: CAROUSEL_MAX_COUNT,
          currentCount: dto.items.length,
        },
      })
    }

    // 4. 去重校验：同一推荐位下不能有重复文章
    const articleIds = dto.items.map((item) => item.articleId)
    const uniqueArticleIds = new Set(articleIds)
    if (articleIds.length !== uniqueArticleIds.size) {
      throw new BadRequestException({
        code: CarouselErrorCode.DUPLICATE_ARTICLE,
        message: '存在重复的文章，请确保每篇文章只配置一次',
      })
    }

    // 5. 逐条校验文章和封面图
    for (const item of dto.items) {
      // 校验文章存在且已发布
      const article = await this.prisma.article.findUnique({
        where: { id: item.articleId },
      })
      if (!article) {
        throw new BadRequestException({
          code: CarouselErrorCode.ARTICLE_NOT_FOUND,
          message: `文章 ${item.articleId} 不存在`,
        })
      }
      if (article.status !== 'published') {
        throw new BadRequestException({
          code: CarouselErrorCode.ARTICLE_NOT_PUBLISHED,
          message: `文章 ${item.articleId} 未发布，无法配置为轮播图`,
        })
      }

      // 校验封面图（如有）
      if (item.coverImageId) {
        const coverImage = await this.prisma.fileResource.findUnique({
          where: { id: item.coverImageId },
        })
        if (!coverImage || coverImage.status !== 'ACTIVE') {
          throw new BadRequestException({
            code: CarouselErrorCode.COVER_IMAGE_NOT_FOUND,
            message: `封面图 ${item.coverImageId} 不存在或已归档`,
          })
        }
      }
    }

    // 6. 事务更新：先删除旧配置，再插入新配置
    await this.prisma.$transaction(async (tx) => {
      // 删除旧配置
      await tx.homepageCarousel.deleteMany({
        where: { positionCode: dto.positionCode },
      })

      // 插入新配置
      const createPromises = dto.items.map((item) =>
        tx.homepageCarousel.create({
          data: {
            positionCode: dto.positionCode,
            articleId: item.articleId,
            sortOrder: item.sortOrder,
            coverImageId: item.coverImageId ?? null,
            status: CarouselStatus.ACTIVE,
          },
        }),
      )

      await Promise.all(createPromises)
    })

    // 7. 记录审计日志
    await this.auditLog.create({
      adminId: operatorId,
      action: CAROUSEL_AUDIT_ACTIONS.CONFIG_UPDATE,
      targetType: 'homepage_carousel',
      ip,
      detail: JSON.stringify({
        positionCode: dto.positionCode,
        itemCount: dto.items.length,
        articleIds: articleIds,
      }),
    })

    // 8. 清除缓存（静态化约束：配置变更后立即失效缓存）
    await this.invalidateCache(dto.positionCode)

    // 9. 返回配置结果
    return await this.getCarousel(dto.positionCode)
  }

  // ==================== 获取轮播图配置（含缓存）====================

  async getCarousel(positionCode: string) {
    // 1. 校验位置编码
    if (!POSITION_CODE_VALUES.includes(positionCode as any)) {
      throw new BadRequestException({
        code: CarouselErrorCode.POSITION_CODE_INVALID,
        message: `positionCode "${positionCode}" 无效`,
      })
    }

    // 2. 尝试从缓存获取（静态化约束：读优先缓存）
    const cacheKey = this.getCacheKey(positionCode)
    const cachedData = await this.redis.get(cacheKey)

    if (cachedData) {
      try {
        return JSON.parse(cachedData)
      } catch {
        // 缓存数据格式错误，继续从数据库获取
        this.logger.warn(`缓存数据解析失败: ${cacheKey}`)
      }
    }

    // 3. 从数据库获取
    const carouselItems = await this.prisma.homepageCarousel.findMany({
      where: {
        positionCode,
        status: CarouselStatus.ACTIVE,
      },
      include: {
        article: {
          select: {
            id: true,
            articleSlug: true,
            title: true,
            summary: true,
            coverImageUrl: true,
            // 降级取首张图片附件作封面(coverImageUrl 未设置时,覆盖已有文章)
            attachments: {
              where: { fileType: 'image' },
              take: 1,
              orderBy: { id: 'asc' },
              select: { fileUrl: true },
            },
            publishedAt: true,
            viewCount: true,
          },
        },
        coverImage: {
          select: {
            id: true,
            fileName: true,
            storagePath: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // 4. 序列化结果
    const result = carouselItems.map((item) => ({
      id: item.id,
      positionCode: item.positionCode,
      articleId: item.articleId,
      article: item.article
        ? {
            articleId: item.article.id,
            articleSlug: item.article.articleSlug,
            title: item.article.title,
            summary: item.article.summary,
            coverImageUrl: item.article.coverImageUrl || item.article.attachments?.[0]?.fileUrl || null,
            publishedAt: item.article.publishedAt,
            viewCount: item.article.viewCount,
          }
        : null,
      sortOrder: item.sortOrder,
      coverImageId: item.coverImageId,
      coverImage: item.coverImage
        ? {
            id: item.coverImage.id,
            fileName: item.coverImage.fileName,
            storagePath: item.coverImage.storagePath,
          }
        : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))

    // 5. 写入缓存（静态化约束：结果缓存1小时）
    await this.redis.set(cacheKey, JSON.stringify(result), CAROUSEL_CACHE_TTL)

    return result
  }

  // ==================== 获取所有轮播图配置 ====================

  async getAllCarousels() {
    const result: Record<string, any[]> = {}
    for (const positionCode of POSITION_CODE_VALUES) {
      result[positionCode] = await this.getCarousel(positionCode)
    }
    return result
  }

  // ==================== 删除轮播图配置 ====================

  async deleteCarousel(positionCode: string, operatorId: number, operatorRole: string, ip?: string) {
    // 权限校验：仅栏目管理员可操作
    if (operatorRole !== 'column_admin') {
      throw new ForbiddenException('仅栏目管理员可删除轮播图配置')
    }

    // 校验位置编码
    if (!POSITION_CODE_VALUES.includes(positionCode as any)) {
      throw new BadRequestException({
        code: CarouselErrorCode.POSITION_CODE_INVALID,
        message: `positionCode "${positionCode}" 无效`,
      })
    }

    // 删除配置
    const deleted = await this.prisma.homepageCarousel.deleteMany({
      where: { positionCode },
    })

    // 记录审计日志
    await this.auditLog.create({
      adminId: operatorId,
      action: CAROUSEL_AUDIT_ACTIONS.CONFIG_UPDATE,
      targetType: 'homepage_carousel',
      ip,
      detail: JSON.stringify({
        positionCode,
        deletedCount: deleted.count,
      }),
    })

    // 清除缓存
    await this.invalidateCache(positionCode)

    return { success: true, deletedCount: deleted.count }
  }

  // ==================== 内部工具 ====================

  private getCacheKey(positionCode: string): string {
    return `${CAROUSEL_CACHE_KEY_PREFIX}${positionCode}`
  }

  private async invalidateCache(positionCode: string): Promise<void> {
    const cacheKey = this.getCacheKey(positionCode)
    await this.redis.del(cacheKey)
    this.logger.debug(`轮播图缓存已失效: ${cacheKey}`)
  }
}