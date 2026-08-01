import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Redis全局模块
 * 提供Redis连接服务
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}