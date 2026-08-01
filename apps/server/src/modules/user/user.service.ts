import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  // ==================== 用户信息 ====================

  /**
   * 根据 unionId 查找或创建用户
   */
  async findOrCreateUser(unionId: string, userData: {
    ssoUserType: string
    name: string
    department?: string
    email?: string
  }) {
    let user = await this.prisma.user.findUnique({
      where: { unionId },
    })

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          unionId,
          ssoUserType: userData.ssoUserType,
          name: userData.name,
          department: userData.department || null,
          email: userData.email || null,
        },
      })
      this.logger.log(`创建新用户: ${unionId} (${userData.name})`)
    }

    return user
  }

  /**
   * 获取用户信息
   */
  async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        unionId: true,
        ssoUserType: true,
        name: true,
        department: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    return {
      id: user.id,
      unionId: user.unionId,
      userType: user.ssoUserType,
      name: user.name,
      department: user.department,
      email: user.email,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(userId: number, data: { email?: string; phone?: string; department?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email ?? user.email,
        phone: data.phone ?? user.phone,
        department: data.department ?? user.department,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
      },
    })

    return updated
  }

  // ==================== 收藏功能 ====================

  /**
   * 获取用户收藏列表
   */
  async getFavorites(userId: number, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize

    const [list, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          articleId: true,
          articleSlug: true,
          title: true,
          coverImage: true,
          columnSlug: true,
          createdAt: true,
        },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ])

    return {
      list: list.map(item => ({
        id: item.id,
        articleId: item.articleId,
        articleSlug: item.articleSlug,
        title: item.title,
        coverImage: item.coverImage,
        columnSlug: item.columnSlug,
        favoriteAt: item.createdAt,
      })),
      total,
      page,
      pageSize,
    }
  }

  /**
   * 添加收藏
   */
  async addFavorite(userId: number, articleId: number) {
    // 检查文章是否存在
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, articleSlug: true, column: { select: { columnSlug: true } } },
    })

    if (!article) {
      throw new BadRequestException('文章不存在')
    }

    // 检查是否已收藏
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    })

    if (existing) {
      return existing
    }

    return this.prisma.favorite.create({
      data: {
        userId,
        articleId,
        articleSlug: article.articleSlug,
        title: article.title,
        columnSlug: article.column?.columnSlug,
      },
      select: {
        id: true,
        articleId: true,
        articleSlug: true,
        title: true,
        createdAt: true,
      },
    })
  }

  /**
   * 取消收藏
   */
  async removeFavorite(userId: number, articleId: number) {
    const result = await this.prisma.favorite.deleteMany({
      where: {
        userId,
        articleId,
      },
    })

    return { deleted: result.count > 0 }
  }

  /**
   * 检查是否已收藏
   */
  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    const count = await this.prisma.favorite.count({
      where: { userId, articleId },
    })
    return count > 0
  }

  // ==================== 浏览历史 ====================

  /**
   * 获取浏览历史
   */
  async getHistory(userId: number, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize

    const [list, total] = await Promise.all([
      this.prisma.history.findMany({
        where: { userId },
        orderBy: { lastViewedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          articleId: true,
          articleSlug: true,
          title: true,
          columnSlug: true,
          viewCount: true,
          lastViewedAt: true,
        },
      }),
      this.prisma.history.count({ where: { userId } }),
    ])

    return {
      list: list.map(item => ({
        id: item.id,
        articleId: item.articleId,
        articleSlug: item.articleSlug,
        title: item.title,
        columnSlug: item.columnSlug,
        viewCount: item.viewCount,
        lastViewedAt: item.lastViewedAt,
      })),
      total,
      page,
      pageSize,
    }
  }

  /**
   * 记录浏览历史
   */
  async recordHistory(userId: number, articleId: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, articleSlug: true, column: { select: { columnSlug: true } } },
    })

    if (!article) {
      throw new BadRequestException('文章不存在')
    }

    const existing = await this.prisma.history.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    })

    if (existing) {
      // 更新浏览时间和计数
      return this.prisma.history.update({
        where: { id: existing.id },
        data: {
          lastViewedAt: new Date(),
          viewCount: { increment: 1 },
        },
        select: {
          id: true,
          lastViewedAt: true,
          viewCount: true,
        },
      })
    }

    // 创建新记录
    return this.prisma.history.create({
      data: {
        userId,
        articleId,
        articleSlug: article.articleSlug,
        title: article.title,
        columnSlug: article.column?.columnSlug,
        viewCount: 1,
      },
      select: {
        id: true,
        lastViewedAt: true,
        viewCount: true,
      },
    })
  }

  /**
   * 清空浏览历史
   */
  async clearHistory(userId: number) {
    const result = await this.prisma.history.deleteMany({
      where: { userId },
    })
    return { deleted: result.count }
  }

  // ==================== 订阅功能 ====================

  /**
   * 获取用户订阅列表
   */
  async getSubscriptions(userId: number, targetType?: string) {
    const where: any = { userId, isEnabled: true }
    if (targetType) {
      where.targetType = targetType
    }

    return this.prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        targetName: true,
        createdAt: true,
      },
    })
  }

  /**
   * 添加订阅
   */
  async addSubscription(userId: number, targetType: string, targetId: string, targetName: string) {
    const existing = await this.prisma.subscription.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType,
          targetId,
        },
      },
    })

    if (existing) {
      if (!existing.isEnabled) {
        return this.prisma.subscription.update({
          where: { id: existing.id },
          data: { isEnabled: true },
        })
      }
      return existing
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        targetType,
        targetId,
        targetName,
      },
    })
  }

  /**
   * 取消订阅
   */
  async removeSubscription(userId: number, subscriptionId: number) {
    const result = await this.prisma.subscription.deleteMany({
      where: {
        id: subscriptionId,
        userId,
      },
    })
    return { deleted: result.count > 0 }
  }

  /**
   * 按目标取消订阅
   */
  async removeSubscriptionByTarget(userId: number, targetType: string, targetId: string) {
    const result = await this.prisma.subscription.deleteMany({
      where: {
        userId,
        targetType,
        targetId,
      },
    })
    return { deleted: result.count > 0 }
  }
}
