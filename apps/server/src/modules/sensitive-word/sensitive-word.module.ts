import { Module } from '@nestjs/common';
import { SensitiveWordController } from './sensitive-word.controller.js';
import { SensitiveWordService } from './sensitive-word.service.js';
import { ArticleDecryptionService } from './article-decryption.service.js';
import { SensitiveWordCacheManager } from '../cache/sensitive-word-cache.manager.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SensitiveWordController],
  providers: [
    SensitiveWordService,
    ArticleDecryptionService,
    SensitiveWordCacheManager,
  ],
  exports: [
    SensitiveWordService,
    ArticleDecryptionService,
  ],
})
export class SensitiveWordModule {}