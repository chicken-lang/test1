import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
  Inject,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'

class CreateFeedbackDto {
  title!: string
  content!: string
  contact?: string
}

class QueryFeedbackDto {
  status?: string
  page?: number
  pageSize?: number
}

@Controller('feedback')
@UseGuards(AuthGuard)
export class FeedbackController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async list(
    @Query() query: QueryFeedbackDto,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.id
    const { status, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * Math.min(pageSize, 50)

    const where: any = {
      businessTag: 'feedback',
      submitterUserId: userId,
    }
    if (status) where.status = status

    const [list, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: Math.min(pageSize, 50),
      }),
      this.prisma.inquiry.count({ where }),
    ])

    return ApiResponseHelper.paginated(list, total, page, pageSize)
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() dto: CreateFeedbackDto,
    @Req() req: any,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.id
    const ip = req.ip || req.socket?.remoteAddress

    const now = new Date()
    const inquiryNo = `FB${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${Date.now().toString().slice(-6)}`

    const record = await this.prisma.inquiry.create({
      data: {
        inquiryNo,
        title: dto.title,
        content: dto.content,
        businessTag: 'feedback',
        submitterName: user?.nickname || user?.username || '用户',
        submitterContact: dto.contact || user?.email || '',
        submitterType: 'user',
        submitterUserId: userId ? Number(userId) : undefined,
        status: 'pending',
        deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: ip,
      },
    })

    return ApiResponseHelper.success(record, '反馈提交成功')
  }

  @Get(':id')
  async detail(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.id
    const record = await this.prisma.inquiry.findFirst({
      where: {
        id: Number(id),
        businessTag: 'feedback',
        submitterUserId: userId,
      },
    })
    if (!record) {
      return ApiResponseHelper.error(404, '反馈记录不存在')
    }
    return ApiResponseHelper.success(record)
  }
}
