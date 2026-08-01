import { Module } from '@nestjs/common'
import { FileResourceService } from './file-resource.service.js'
import { FileResourceController } from './file-resource.controller.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AuditLogModule } from '../audit-log/audit-log.module.js'

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [FileResourceController],
  providers: [FileResourceService],
  exports: [FileResourceService],
})
export class FileResourceModule {}