import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AuditLogModule } from '../audit-log/audit-log.module.js'
import { RedisModule } from '../cache/redis.module.js'
import { HomepageCarouselController } from './homepage-carousel.controller.js'
import { HomepageCarouselService } from './homepage-carousel.service.js'

@Module({
  imports: [PrismaModule, AuditLogModule, RedisModule],
  controllers: [HomepageCarouselController],
  providers: [HomepageCarouselService],
  exports: [HomepageCarouselService],
})
export class HomepageCarouselModule {}