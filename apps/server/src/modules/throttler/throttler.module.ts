import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisService } from '../cache/redis.service.js';
import { RedisThrottlerStorage } from './redis-throttler.storage.js';
import { LoginThrottlerGuard } from './login-throttler.guard.js';
import { SearchThrottlerGuard } from './search-throttler.guard.js';
import { UploadThrottlerGuard } from './upload-throttler.guard.js';
import { ThrottlerPreset, THROTTLER_PRESETS } from './throttler.constants.js';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          {
            name: ThrottlerPreset.DEFAULT,
            ttl: THROTTLER_PRESETS[ThrottlerPreset.DEFAULT].ttl,
            limit: THROTTLER_PRESETS[ThrottlerPreset.DEFAULT].limit,
          },
          {
            name: ThrottlerPreset.STRICT,
            ttl: THROTTLER_PRESETS[ThrottlerPreset.STRICT].ttl,
            limit: THROTTLER_PRESETS[ThrottlerPreset.STRICT].limit,
          },
          {
            name: ThrottlerPreset.RELAXED,
            ttl: THROTTLER_PRESETS[ThrottlerPreset.RELAXED].ttl,
            limit: THROTTLER_PRESETS[ThrottlerPreset.RELAXED].limit,
          },
        ],
        storage: new RedisThrottlerStorage(redisService),
      }),
    }),
  ],
  providers: [
    // 全局限流守卫（使用 default 预设）
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    LoginThrottlerGuard,
    SearchThrottlerGuard,
    UploadThrottlerGuard,
  ],
  exports: [
    LoginThrottlerGuard,
    SearchThrottlerGuard,
    UploadThrottlerGuard,
  ],
})
export class ThrottlerConfigModule {}
