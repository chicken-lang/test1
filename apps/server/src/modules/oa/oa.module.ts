import { Module } from '@nestjs/common'
import { OaController } from './oa.controller.js'
import { OaService } from './oa.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AuditLogModule } from '../audit-log/audit-log.module.js'

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [OaController],
  providers: [OaService],
  exports: [OaService],
})
export class OaModule {}