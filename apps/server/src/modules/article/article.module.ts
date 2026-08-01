import { Module } from '@nestjs/common'
import { ArticleController } from './article.controller.js'
import { ArticleService } from './article.service.js'
import { SensitiveWordModule } from '../sensitive-word/sensitive-word.module.js'
import { MessageModule } from '../message/message.module.js'
import { ColumnModule } from '../column/column.module.js'
import { FileResourceModule } from '../file-resource/file-resource.module.js'
import { SearchModule } from '../search/search.module.js'
import { ScheduleConfigModule } from '../schedule/schedule.module.js'

@Module({
  imports: [SensitiveWordModule, MessageModule, ColumnModule, FileResourceModule, SearchModule, ScheduleConfigModule],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}