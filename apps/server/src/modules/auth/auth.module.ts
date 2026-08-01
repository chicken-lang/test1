import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AuditLogModule } from '../audit-log/audit-log.module.js'
import { RsaKeyModule } from '../rsa-key/rsa-key.module.js'
import { SsoModule } from '../sso/sso.module.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'

const jwtModule = JwtModule.register({
  secret: 'sziit-jwc-admin-secret-key',
  signOptions: { expiresIn: '8h' },
}) as any

@Global()
@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    RsaKeyModule,
    SsoModule,
    PassportModule,
    jwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, jwtModule, AuthGuard],
})
export class AuthModule {}
