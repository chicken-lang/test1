/**
 * 统计分析中心模块
 * 模块十二：统计分析中心
 */

import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { RedisModule } from '../cache/redis.module.js'
import { StatisticsService } from './statistics.service.js'
import { StatisticsController } from './statistics.controller.js'

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}
