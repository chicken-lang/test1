import { Module } from '@nestjs/common'
import { RsaKeyService } from './rsa-key.service.js'
import { RsaKeyController } from './rsa-key.controller.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [PrismaModule],
  controllers: [RsaKeyController],
  providers: [RsaKeyService],
  exports: [RsaKeyService], // 供 AuthModule 使用
})
export class RsaKeyModule {}
