import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SurveyService } from './survey.service.js';
import { CreateSurveyDto, UpdateSurveyDto, PublishSurveyDto, SubmitResponseDto, SaveResponseDto, SurveyQueryDto } from './survey.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller('survey')
@ApiTags('问卷调查')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SurveyController {
  constructor(@Inject(SurveyService) private readonly surveyService: SurveyService) {}

  @Post()
  @ApiOperation({ summary: '创建问卷' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSurveyDto, @Request() req) {
    const result = await this.surveyService.create(dto, req.user.id);
    return { message: '问卷创建成功', data: result };
  }

  @Get()
  @ApiOperation({ summary: '查询问卷列表' })
  async findAll(@Query() query: SurveyQueryDto) {
    const result = await this.surveyService.findAll(query);
    return { data: result.data, total: result.total };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取问卷详情' })
  async findById(@Param('id') id: string) {
    const result = await this.surveyService.findById(parseInt(id, 10));
    return { data: result };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新问卷' })
  async update(@Param('id') id: string, @Body() dto: UpdateSurveyDto) {
    const result = await this.surveyService.update(parseInt(id, 10), dto);
    return { message: '问卷更新成功', data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除问卷' })
  async delete(@Param('id') id: string) {
    await this.surveyService.delete(parseInt(id, 10));
    return { message: '问卷删除成功' };
  }

  @Post(':id/questions')
  @ApiOperation({ summary: '添加题目' })
  async addQuestion(@Param('id') id: string, @Body() question: any) {
    const result = await this.surveyService.addQuestion(parseInt(id, 10), question);
    return { message: '题目添加成功', data: result };
  }

  @Put('questions/:questionId')
  @ApiOperation({ summary: '更新题目' })
  async updateQuestion(@Param('questionId') questionId: string, @Body() data: any) {
    const result = await this.surveyService.updateQuestion(parseInt(questionId, 10), data);
    return { message: '题目更新成功', data: result };
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: '删除题目' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    await this.surveyService.deleteQuestion(parseInt(questionId, 10));
    return { message: '题目删除成功' };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布问卷' })
  async publish(@Param('id') id: string, @Body() dto: PublishSurveyDto) {
    const result = await this.surveyService.publish(parseInt(id, 10), dto);
    return { message: '问卷发布成功', data: result };
  }

  @Post(':id/close')
  @ApiOperation({ summary: '关闭问卷' })
  async close(@Param('id') id: string) {
    const result = await this.surveyService.close(parseInt(id, 10));
    return { message: '问卷已关闭', data: result };
  }

  @Post(':id/archive')
  @ApiOperation({ summary: '归档问卷' })
  async archive(@Param('id') id: string) {
    const result = await this.surveyService.archive(parseInt(id, 10));
    return { message: '问卷已归档', data: result };
  }

  @Get(':id/fill')
  @ApiOperation({ summary: '获取问卷填写页面数据（公开接口）' })
  @Public()
  async getFillSurvey(@Param('id') id: string, @Query('accessCode') accessCode?: string) {
    const survey = await this.surveyService.validateAccess(parseInt(id, 10), undefined, accessCode);
    return { data: survey };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交答卷（公开接口，支持匿名）' })
  @HttpCode(HttpStatus.CREATED)
  @Public()
  async submitResponse(@Param('id') id: string, @Body() dto: SubmitResponseDto, @Request() req) {
    const respondentId = req.user?.id;
    const respondentName = req.user?.username;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    const result = await this.surveyService.submitResponse(parseInt(id, 10), dto, respondentId, respondentName, ip);
    return { message: '答卷提交成功', data: result };
  }

  @Post(':id/save')
  @ApiOperation({ summary: '暂存答卷' })
  async saveResponse(@Param('id') id: string, @Body() dto: SaveResponseDto, @Request() req) {
    const result = await this.surveyService.saveResponse(parseInt(id, 10), dto, req.user.id);
    return { message: '答卷暂存成功', data: result };
  }

  @Get(':id/saved')
  @ApiOperation({ summary: '获取暂存的答卷' })
  async getSavedResponse(@Param('id') id: string, @Request() req) {
    const result = await this.surveyService.getSavedResponse(parseInt(id, 10), req.user.id);
    return { data: result };
  }

  @Get(':id/responses')
  @ApiOperation({ summary: '获取答卷列表' })
  async getResponses(@Param('id') id: string) {
    const result = await this.surveyService.getResponses(parseInt(id, 10));
    return { data: result };
  }

  @Get('responses/:responseId')
  @ApiOperation({ summary: '获取答卷详情' })
  async getResponseById(@Param('responseId') responseId: string) {
    const result = await this.surveyService.getResponseById(parseInt(responseId, 10));
    return { data: result };
  }

  @Get(':id/statistics/overview')
  @ApiOperation({ summary: '统计概览' })
  async statisticsOverview(@Param('id') id: string) {
    const result = await this.surveyService.statisticsOverview(parseInt(id, 10));
    return { data: result };
  }

  @Get(':id/statistics/question/:questionId')
  @ApiOperation({ summary: '单题统计' })
  async questionStatistics(@Param('id') id: string, @Param('questionId') questionId: string) {
    const result = await this.surveyService.questionStatistics(parseInt(id, 10), parseInt(questionId, 10));
    return { data: result };
  }

  @Get(':id/statistics/trend')
  @ApiOperation({ summary: '趋势分析' })
  async trendStatistics(@Param('id') id: string, @Query('days') days?: string) {
    const result = await this.surveyService.trendStatistics(parseInt(id, 10), parseInt(days || '7', 10));
    return { data: result };
  }

  @Get(':id/export')
  @ApiOperation({ summary: '导出数据（CSV格式）' })
  async exportToExcel(@Param('id') id: string) {
    const csv = await this.surveyService.exportToExcel(parseInt(id, 10));
    return {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="survey_${id}_${Date.now()}.csv"`,
      },
      data: csv,
    };
  }
}
