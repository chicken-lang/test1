import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { MessageModule } from '../message/message.module.js';
import { ScheduledPublishService } from './scheduled-publish.service.js';
import { ArticleExpiryService } from './article-expiry.service.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditLogModule,
    MessageModule,
  ],
  providers: [ScheduledPublishService, ArticleExpiryService],
  exports: [ScheduledPublishService, ArticleExpiryService],
})
export class ScheduleConfigModule {}
