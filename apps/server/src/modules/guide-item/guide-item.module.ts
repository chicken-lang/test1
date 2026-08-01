import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AuditLogModule } from '../audit-log/audit-log.module.js'
import { GuideItemService } from './guide-item.service.js'
import { GuideItemAdminController, GuideItemPublicController } from './guide-item.controller.js'

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [GuideItemAdminController, GuideItemPublicController],
  providers: [GuideItemService],
  exports: [GuideItemService],
})
export class GuideItemModule {}
