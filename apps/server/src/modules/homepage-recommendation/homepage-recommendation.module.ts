import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { RedisModule } from '../cache/redis.module.js'
import { HomepageRecommendationService } from './homepage-recommendation.service.js'
import { HomepageRecommendationController } from './homepage-recommendation.controller.js'

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [HomepageRecommendationController],
  providers: [HomepageRecommendationService],
  exports: [HomepageRecommendationService],
})
export class HomepageRecommendationModule {}
