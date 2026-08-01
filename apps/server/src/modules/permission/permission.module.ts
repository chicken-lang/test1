import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AuditLogModule } from '../audit-log/audit-log.module.js'
import { PermissionController } from './permission.controller.js'
import { PermissionService } from './permission.service.js'

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
