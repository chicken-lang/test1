import { Module } from '@nestjs/common'
import { PublicArticleController } from './public-article.controller.js'
import { PublicArticleService } from './public-article.service.js'
import { PublicColumnController } from './public-column.controller.js'
import { PublicAboutController } from './public-about.controller.js'
import { PublicCalendarController } from './public-calendar.controller.js'
import { PublicDeptLeadersController } from './public-dept-leaders.controller.js'
import { PublicCommonInfoController } from './public-common-info.controller.js'
import { PublicDisclosureLinksController } from './public-disclosure-links.controller.js'
import { PublicSitemapController } from './public-sitemap.controller.js'
import { PublicDownloadsController } from './public-downloads.controller.js'
import { PublicHotKeywordsController } from './public-hot-keywords.controller.js'
import { PublicNewsController } from './public-news.controller.js'
import { PublicTopicsController } from './public-topics.controller.js'
import { PublicGalleriesController } from './public-galleries.controller.js'
import { ColumnModule } from '../column/column.module.js'

@Module({
  imports: [ColumnModule],
  controllers: [
    PublicArticleController,
    PublicColumnController,
    PublicAboutController,
    PublicCalendarController,
    PublicDeptLeadersController,
    PublicCommonInfoController,
    PublicDisclosureLinksController,
    PublicSitemapController,
    PublicDownloadsController,
    PublicHotKeywordsController,
    PublicNewsController,
    PublicTopicsController,
    PublicGalleriesController,
  ],
  providers: [PublicArticleService],
  exports: [PublicArticleService],
})
export class PublicModule {}