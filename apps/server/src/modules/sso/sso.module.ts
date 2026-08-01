import { Module } from '@nestjs/common'
import { SsoController } from './sso.controller.js'
import { SsoService } from './sso.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AuditLogModule } from '../audit-log/audit-log.module.js'
import { RsaKeyModule } from '../rsa-key/rsa-key.module.js'

@Module({
  imports: [PrismaModule, AuditLogModule, RsaKeyModule],
  controllers: [SsoController],
  providers: [SsoService],
  exports: [SsoService],
})
export class SsoModule {}