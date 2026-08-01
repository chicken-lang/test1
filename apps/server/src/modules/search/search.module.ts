import { Module } from '@nestjs/common'
import { SearchController } from './search.controller.js'
import { SearchService } from './search.service.js'
import { ArticleIndexService } from './article-index.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { SensitiveWordModule } from '../sensitive-word/sensitive-word.module.js'
import { AuditLogModule } from '../audit-log/audit-log.module.js'
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module.js'

@Module({
  imports: [PrismaModule, SensitiveWordModule, AuditLogModule, ElasticsearchModule],
  controllers: [SearchController],
  providers: [SearchService, ArticleIndexService],
  exports: [SearchService, ArticleIndexService],
})
export class SearchModule {}