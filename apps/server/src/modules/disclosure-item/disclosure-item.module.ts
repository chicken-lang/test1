// 信息公开目录管理 - Module
import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AuditLogModule } from '../audit-log/audit-log.module.js'
import { DisclosureItemService } from './disclosure-item.service.js'
import { DisclosureItemAdminController, DisclosureItemPublicController } from './disclosure-item.controller.js'

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [DisclosureItemAdminController, DisclosureItemPublicController],
  providers: [DisclosureItemService],
  exports: [DisclosureItemService],
})
export class DisclosureItemModule {}
