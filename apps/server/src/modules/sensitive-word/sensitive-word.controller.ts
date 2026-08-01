import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SensitiveWordService } from './sensitive-word.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { ApiResponseHelper } from '../../common/dto/api-response.js';
import {
  CreateSensitiveWordDto,
  BatchImportSensitiveWordDto,
  QuerySensitiveWordDto,
  UpdateSensitiveWordDto,
} from './dto/sensitive-word.dto.js';
import { BATCH_IMPORT_LIMIT } from './sensitive-word.constants.js';

/**
 * 敏感词管理接口
 * 权限要求: 仅系统管理员(super_admin)可操作
 */
@Controller('admin/sensitive-words')
@UseGuards(AuthGuard)
export class SensitiveWordController {
  private readonly logger = new Logger(SensitiveWordController.name)
  private readonly sensitiveWordService: SensitiveWordService
  private readonly prisma: PrismaService

  constructor(
    @Inject(SensitiveWordService) sensitiveWordService: SensitiveWordService,
    @Inject(PrismaService) prisma: PrismaService,
  ) {
    this.sensitiveWordService = sensitiveWordService
    this.prisma = prisma
  }

  /**
   * 查询敏感词列表
   * GET /api/admin/sensitive-words
   */
  @Get()
  @RequirePermissions('sensitive_word.view')
  async findAll(@Query() query: QuerySensitiveWordDto) {
    const { level, category, keyword, page = 1, pageSize = 50 } = query;

    try {
      const where: any = {};

      if (level) {
        where.level = level;
      }

      if (category) {
        where.category = category;
      }

      if (keyword) {
        where.word = { contains: keyword };
      }

      const [items, total] = await Promise.all([
        this.prisma.sensitiveWord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.sensitiveWord.count({ where }),
      ]);

      return ApiResponseHelper.success({
        items,
        total,
        page,
        pageSize,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `查询敏感词列表失败 - page=${page}, pageSize=${pageSize}, level=${level ?? 'all'}: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        '查询敏感词列表失败，请稍后重试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 新增单个敏感词
   * POST /api/admin/sensitive-words
   */
  @Post()
  @RequirePermissions('sensitive_word.create')
  async create(@Body() body: CreateSensitiveWordDto, @CurrentUser() user: any) {
    try {
      // 检查敏感词是否已存在
      const existing = await this.prisma.sensitiveWord.findUnique({
        where: { word: body.word },
      });

      if (existing) {
        throw new HttpException('敏感词已存在', HttpStatus.BAD_REQUEST);
      }

      // 创建敏感词
      const result = await this.prisma.sensitiveWord.create({
        data: {
          word: body.word,
          level: body.level,
          category: body.category,
          replacement: body.replacement || '***',
          createdBy: user.id,
        },
      });

      // 使用addWordAndRefreshCache更新缓存（缓存刷新失败不影响数据已入库）
      try {
        await this.sensitiveWordService.addWordAndRefreshCache({
          id: result.id,
          word: result.word,
          level: result.level,
          category: result.category,
          replacement: result.replacement,
          isActive: result.isActive,
        });
      } catch (cacheError) {
        const errMsg = cacheError instanceof Error ? cacheError.message : String(cacheError);
        this.logger.warn(
          `敏感词已入库但缓存刷新失败 - wordId=${result.id}, word="${body.word}": ${errMsg}`,
        );
      }

      // 记录审计日志
      await this.prisma.auditLog.create({
        data: {
          adminId: user.id,
          username: user.username,
          role: user.role,
          action: 'create_sensitive_word',
          targetType: 'sensitive_word',
          targetId: result.id,
          detail: JSON.stringify({ word: body.word, level: body.level }),
        },
      });

      this.logger.log(
        `敏感词创建成功 - id=${result.id}, word="${body.word}", level=${body.level}, operator=${user.username}`,
      );

      return ApiResponseHelper.success(result, '敏感词创建成功');
    } catch (error) {
      // 已是 HttpException 的直接抛出
      if (error instanceof HttpException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `创建敏感词失败 - word="${body.word}", operator=${user?.username}: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        '创建敏感词失败，请稍后重试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 批量导入敏感词
   * POST /api/admin/sensitive-words/import
   */
  @Post('import')
  @RequirePermissions('sensitive_word.create')
  async batchImport(@Body() body: BatchImportSensitiveWordDto, @CurrentUser() user: any) {
    const { words } = body;

    try {
      // 检查批量导入上限
      if (words.length > BATCH_IMPORT_LIMIT) {
        throw new HttpException(
          `单次批量导入上限为 ${BATCH_IMPORT_LIMIT} 条`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 过滤已存在的敏感词
      const existingWords = await this.prisma.sensitiveWord.findMany({
        where: {
          word: { in: words.map((w) => w.word) },
        },
        select: { word: true },
      });

      const existingWordSet = new Set(existingWords.map((w) => w.word));
      const newWords = words.filter((w) => !existingWordSet.has(w.word));

      // 批量插入
      if (newWords.length > 0) {
        await this.prisma.sensitiveWord.createMany({
          data: newWords.map((w) => ({
            word: w.word,
            level: w.level,
            category: w.category,
            replacement: w.replacement || '***',
            createdBy: user.id,
          })),
        });
      }

      // 刷新缓存（失败不影响已导入数据）
      try {
        await this.sensitiveWordService.refreshCache();
      } catch (cacheError) {
        const errMsg = cacheError instanceof Error ? cacheError.message : String(cacheError);
        this.logger.warn(
          `批量导入完成但缓存刷新失败 - imported=${newWords.length}: ${errMsg}`,
        );
      }

      // 记录审计日志
      await this.prisma.auditLog.create({
        data: {
          adminId: user.id,
          username: user.username,
          role: user.role,
          action: 'batch_import_sensitive_words',
          targetType: 'sensitive_word',
          detail: JSON.stringify({
            total: words.length,
            imported: newWords.length,
            skipped: words.length - newWords.length,
          }),
        },
      });

      this.logger.log(
        `批量导入敏感词完成 - total=${words.length}, imported=${newWords.length}, skipped=${words.length - newWords.length}, operator=${user.username}`,
      );

      return ApiResponseHelper.success(
        {
          imported: newWords.length,
          skipped: words.length - newWords.length,
        },
        '批量导入完成',
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `批量导入敏感词失败 - total=${words.length}, operator=${user?.username}: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        '批量导入敏感词失败，请稍后重试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 更新敏感词
   * PUT /api/admin/sensitive-words/:id
   */
  @Post(':id')
  @RequirePermissions('sensitive_word.update')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateSensitiveWordDto,
    @CurrentUser() user: any,
  ) {
    const wordId = parseInt(id);

    try {
      // 检查敏感词是否存在
      const existing = await this.prisma.sensitiveWord.findUnique({
        where: { id: wordId },
      });

      if (!existing) {
        throw new HttpException('敏感词不存在', HttpStatus.NOT_FOUND);
      }

      // 如果修改了word字段,检查是否与其他敏感词冲突
      if (body.word && body.word !== existing.word) {
        const duplicate = await this.prisma.sensitiveWord.findUnique({
          where: { word: body.word },
        });

        if (duplicate) {
          throw new HttpException('敏感词已存在', HttpStatus.BAD_REQUEST);
        }
      }

      // 更新敏感词
      const result = await this.prisma.sensitiveWord.update({
        where: { id: wordId },
        data: body,
      });

      // 刷新缓存（失败不影响已更新数据）
      try {
        await this.sensitiveWordService.refreshCache();
      } catch (cacheError) {
        const errMsg = cacheError instanceof Error ? cacheError.message : String(cacheError);
        this.logger.warn(
          `敏感词已更新但缓存刷新失败 - wordId=${wordId}: ${errMsg}`,
        );
      }

      // 记录审计日志
      await this.prisma.auditLog.create({
        data: {
          adminId: user.id,
          username: user.username,
          role: user.role,
          action: 'update_sensitive_word',
          targetType: 'sensitive_word',
          targetId: wordId,
          detail: JSON.stringify({ before: existing, after: body }),
        },
      });

      this.logger.log(
        `敏感词更新成功 - id=${wordId}, operator=${user.username}`,
      );

      return ApiResponseHelper.success(result, '更新成功');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `更新敏感词失败 - id=${wordId}, operator=${user?.username}: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        '更新敏感词失败，请稍后重试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 删除敏感词
   * DELETE /api/admin/sensitive-words/:id
   */
  @Delete(':id')
  @RequirePermissions('sensitive_word.delete')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const wordId = parseInt(id);

    try {
      // 检查敏感词是否存在
      const existing = await this.prisma.sensitiveWord.findUnique({
        where: { id: wordId },
      });

      if (!existing) {
        throw new HttpException('敏感词不存在', HttpStatus.NOT_FOUND);
      }

      // 删除敏感词
      await this.prisma.sensitiveWord.delete({
        where: { id: wordId },
      });

      // 使用removeWordAndRefreshCache更新缓存（缓存刷新失败不影响已删除数据）
      try {
        await this.sensitiveWordService.removeWordAndRefreshCache(existing.word);
      } catch (cacheError) {
        const errMsg = cacheError instanceof Error ? cacheError.message : String(cacheError);
        this.logger.warn(
          `敏感词已删除但缓存刷新失败 - wordId=${wordId}: ${errMsg}`,
        );
      }

      // 记录审计日志
      await this.prisma.auditLog.create({
        data: {
          adminId: user.id,
          username: user.username,
          role: user.role,
          action: 'delete_sensitive_word',
          targetType: 'sensitive_word',
          targetId: wordId,
          detail: JSON.stringify({ word: existing.word }),
        },
      });

      this.logger.log(
        `敏感词删除成功 - id=${wordId}, word="${existing.word}", operator=${user.username}`,
      );

      return ApiResponseHelper.success(null, '删除成功');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `删除敏感词失败 - id=${wordId}, operator=${user?.username}: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        '删除敏感词失败，请稍后重试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 切换敏感词启用状态
   * POST /api/admin/sensitive-words/:id/toggle
   */
  @Post(':id/toggle')
  @RequirePermissions('sensitive_word.update')
  async toggle(@Param('id') id: string, @CurrentUser() user: any) {
    const wordId = parseInt(id);

    try {
      // 检查敏感词是否存在
      const existing = await this.prisma.sensitiveWord.findUnique({
        where: { id: wordId },
      });

      if (!existing) {
        throw new HttpException('敏感词不存在', HttpStatus.NOT_FOUND);
      }

      // 切换状态
      const result = await this.prisma.sensitiveWord.update({
        where: { id: wordId },
        data: { isActive: !existing.isActive },
      });

      // 使用toggleWordAndRefreshCache更新缓存（缓存刷新失败不影响已切换数据）
      try {
        await this.sensitiveWordService.toggleWordAndRefreshCache(
          existing.word,
          result.isActive,
        );
      } catch (cacheError) {
        const errMsg = cacheError instanceof Error ? cacheError.message : String(cacheError);
        this.logger.warn(
          `敏感词状态已切换但缓存刷新失败 - wordId=${wordId}: ${errMsg}`,
        );
      }

      // 记录审计日志
      await this.prisma.auditLog.create({
        data: {
          adminId: user.id,
          username: user.username,
          role: user.role,
          action: 'toggle_sensitive_word',
          targetType: 'sensitive_word',
          targetId: wordId,
          detail: JSON.stringify({
            word: existing.word,
            isActive: result.isActive,
          }),
        },
      });

      this.logger.log(
        `敏感词状态切换成功 - id=${wordId}, isActive=${result.isActive}, operator=${user.username}`,
      );

      return ApiResponseHelper.success(result, '状态已切换');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `切换敏感词状态失败 - id=${wordId}, operator=${user?.username}: ${errMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        '切换敏感词状态失败，请稍后重试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 预检测接口(前端预检测)
   * POST /api/admin/sensitive-words/check
   */
  @Post('check')
  async checkText(@Body() body: { text: string }) {
    // 入参校验
    if (!body || typeof body.text !== 'string') {
      throw new HttpException('text 字段必填且必须为字符串', HttpStatus.BAD_REQUEST);
    }

    const result = this.sensitiveWordService.checkText(body.text);
    return ApiResponseHelper.success(result);
  }
}