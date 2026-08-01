import 'reflect-metadata'
import { config } from 'dotenv'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module.js'
import { TagFilterInterceptor } from './common/interceptors/tag-filter.interceptor.js'

// 加载 .env 环境变量
config()

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
  // 全局标签过滤拦截器 - 模块十六: 文稿标签展示规则
  app.useGlobalInterceptors(new TagFilterInterceptor())
  app.enableCors()

  await app.listen(3001, '0.0.0.0')
  console.log('Server running on http://localhost:3001/api/v1')
}
bootstrap()
