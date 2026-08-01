import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { PrismaModule } from './modules/prisma/prisma.module.js'
import { RedisModule } from './modules/cache/redis.module.js'
import { AuthModule } from './modules/auth/auth.module.js'
import { AuditLogModule } from './modules/audit-log/audit-log.module.js'
import { AdminModule } from './modules/admin/admin.module.js'
import { PermissionModule } from './modules/permission/permission.module.js'
import { RsaKeyModule } from './modules/rsa-key/rsa-key.module.js'
import { ArticleModule } from './modules/article/article.module.js'
import { ColumnModule } from './modules/column/column.module.js'
import { MessageModule } from './modules/message/message.module.js'
import { FileResourceModule } from './modules/file-resource/file-resource.module.js'
import { SearchModule } from './modules/search/search.module.js'
import { PublicModule } from './modules/public/public.module.js'
import { InquiryModule } from './modules/inquiry/inquiry.module.js'
import { StatisticsModule } from './modules/statistics/statistics.module.js'
import { GuideItemModule } from './modules/guide-item/guide-item.module.js'
import { DisclosureItemModule } from './modules/disclosure-item/disclosure-item.module.js'
import { HomepageCarouselModule } from './modules/homepage-carousel/homepage-carousel.module.js'
import { HomepageRecommendationModule } from './modules/homepage-recommendation/homepage-recommendation.module.js'
import { SsoModule } from './modules/sso/sso.module.js'
import { OaModule } from './modules/oa/oa.module.js'
import { ThrottlerConfigModule } from './modules/throttler/throttler.module.js'
import { ScheduleConfigModule } from './modules/schedule/schedule.module.js'
import { SurveyModule } from './modules/survey/survey.module.js'
import { SensitiveWordModule } from './modules/sensitive-word/sensitive-word.module.js'
import { UserModule } from './modules/user/user.module.js'
import { ClientTypeInterceptor } from './common/interceptors/client-type.interceptor.js'
import { ContentAdapterInterceptor } from './common/interceptors/content-adapter.interceptor.js'
import { DebounceInterceptor } from './common/interceptors/debounce.interceptor.js'

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ThrottlerConfigModule,
    ScheduleConfigModule,
    AuthModule,
    AuditLogModule,
    AdminModule,
    PermissionModule,
    RsaKeyModule,
    ArticleModule,
    ColumnModule,
    MessageModule,
    FileResourceModule,
    SearchModule,
    PublicModule,
    InquiryModule,
    StatisticsModule,
    GuideItemModule,
    DisclosureItemModule,
    HomepageCarouselModule,
    HomepageRecommendationModule,
    SsoModule,
    OaModule,
    SurveyModule,
    SensitiveWordModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClientTypeInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ContentAdapterInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DebounceInterceptor,
    },
  ],
})
export class AppModule {}