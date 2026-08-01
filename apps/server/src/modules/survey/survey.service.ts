import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service.js';
import { SurveyStatus, SurveyType, QuestionType, DistributionTargetType, ResponseStatus, SURVEY_ERRORS } from './survey.constants.js';
import { CreateSurveyDto, UpdateSurveyDto, PublishSurveyDto, SubmitResponseDto, SaveResponseDto, SurveyQueryDto, SurveyAnswerDto } from './survey.dto.js';
import { Prisma, Survey, SurveyQuestion, SurveyResponse, SurveyAnswer, SurveyDistribution } from '@prisma/client';
import { randomUUID } from 'crypto';

type SurveyWithQuestions = Prisma.SurveyGetPayload<{
  include: { questions: { orderBy: { sortOrder: 'asc' } }; distributions: true };
}>;

@Injectable()
export class SurveyService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(dto: CreateSurveyDto, createdBy: number): Promise<Survey> {
    const { questions, ...surveyData } = dto;

    return this.prisma.survey.create({
      data: {
        ...surveyData,
        createdBy,
        questions: questions?.length
          ? {
              create: questions.map((q) => ({
                ...q,
                options: q.options ? JSON.stringify(q.options) : null,
                matrixRows: q.matrixRows ? JSON.stringify(q.matrixRows) : null,
                matrixColumns: q.matrixColumns ? JSON.stringify(q.matrixColumns) : null,
                logicRules: q.logicRules ? JSON.stringify(q.logicRules) : null,
                validationRules: q.validationRules ? JSON.stringify(q.validationRules) : null,
              })),
            }
          : undefined,
      },
      include: { questions: true },
    });
  }

  async findAll(query: SurveyQueryDto = {}): Promise<{ data: Survey[]; total: number }> {
    const where: Prisma.SurveyWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.surveyType) {
      where.surveyType = query.surveyType;
    }
    if (query.createdBy) {
      where.createdBy = query.createdBy;
    }
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { description: { contains: query.keyword } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.survey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { questions: true },
      }),
      this.prisma.survey.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: number): Promise<SurveyWithQuestions> {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
        distributions: true,
      },
    });

    if (!survey) {
      throw new NotFoundException(SURVEY_ERRORS.NOT_FOUND);
    }

    return survey;
  }

  async update(id: number, dto: UpdateSurveyDto): Promise<Survey> {
    await this.findById(id);

    return this.prisma.survey.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number): Promise<void> {
    const survey = await this.findById(id);

    if (survey.status === SurveyStatus.PUBLISHED) {
      throw new ForbiddenException('已发布的问卷无法删除');
    }

    await this.prisma.survey.delete({ where: { id } });
  }

  async addQuestion(surveyId: number, question: Omit<SurveyQuestion, 'id' | 'surveyId' | 'createdAt'>): Promise<SurveyQuestion> {
    await this.findById(surveyId);

    return this.prisma.surveyQuestion.create({
      data: {
        ...question,
        surveyId,
        options: question.options ? JSON.stringify(question.options) : null,
        matrixRows: question.matrixRows ? JSON.stringify(question.matrixRows) : null,
        matrixColumns: question.matrixColumns ? JSON.stringify(question.matrixColumns) : null,
        logicRules: question.logicRules ? JSON.stringify(question.logicRules) : null,
        validationRules: question.validationRules ? JSON.stringify(question.validationRules) : null,
      },
    });
  }

  async updateQuestion(questionId: number, data: Partial<SurveyQuestion>): Promise<SurveyQuestion> {
    const question = await this.prisma.surveyQuestion.findUnique({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException(SURVEY_ERRORS.QUESTION_NOT_FOUND);
    }

    return this.prisma.surveyQuestion.update({
      where: { id: questionId },
      data: {
        ...data,
        options: data.options ? JSON.stringify(data.options) : question.options,
        matrixRows: data.matrixRows ? JSON.stringify(data.matrixRows) : question.matrixRows,
        matrixColumns: data.matrixColumns ? JSON.stringify(data.matrixColumns) : question.matrixColumns,
        logicRules: data.logicRules ? JSON.stringify(data.logicRules) : question.logicRules,
        validationRules: data.validationRules ? JSON.stringify(data.validationRules) : question.validationRules,
      },
    });
  }

  async deleteQuestion(questionId: number): Promise<void> {
    const question = await this.prisma.surveyQuestion.findUnique({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException(SURVEY_ERRORS.QUESTION_NOT_FOUND);
    }

    await this.prisma.surveyQuestion.delete({ where: { id: questionId } });
  }

  async publish(id: number, dto: PublishSurveyDto): Promise<Survey> {
    const survey = await this.findById(id);

    if (survey.status !== SurveyStatus.DRAFT) {
      throw new ForbiddenException('只能发布草稿状态的问卷');
    }

    const distributions: SurveyDistribution[] = [];
    if (dto.distributions?.length) {
      for (const dist of dto.distributions) {
        let shareLink: string | undefined;
        if (dist.targetType === DistributionTargetType.LINK) {
          shareLink = `${process.env.BASE_URL || 'http://localhost:3000'}/survey/${id}/fill?token=${randomUUID()}`;
        }

        distributions.push({
          id: 0,
          surveyId: id,
          targetType: dist.targetType,
          targetId: dist.targetId || null,
          shareLink: shareLink || null,
          accessCode: dist.accessCode || null,
          isActive: true,
          createdAt: new Date(),
        });
      }
    }

    return this.prisma.survey.update({
      where: { id },
      data: {
        status: SurveyStatus.PUBLISHED,
        startTime: dto.startTime ? new Date(dto.startTime) : survey.startTime || new Date(),
        endTime: dto.endTime ? new Date(dto.endTime) : survey.endTime,
        distributions: distributions.length ? { create: distributions } : undefined,
      },
      include: { distributions: true },
    });
  }

  async close(id: number): Promise<Survey> {
    const survey = await this.findById(id);

    if (survey.status !== SurveyStatus.PUBLISHED) {
      throw new ForbiddenException('只能关闭已发布的问卷');
    }

    return this.prisma.survey.update({
      where: { id },
      data: { status: SurveyStatus.CLOSED },
    });
  }

  async archive(id: number): Promise<Survey> {
    const survey = await this.findById(id);

    return this.prisma.survey.update({
      where: { id },
      data: { status: SurveyStatus.ARCHIVED },
    });
  }

  async validateAccess(surveyId: number, respondentId?: number, accessCode?: string): Promise<SurveyWithQuestions> {
    const survey = await this.findById(surveyId);

    if (survey.status === SurveyStatus.DRAFT) {
      throw new ForbiddenException(SURVEY_ERRORS.NOT_PUBLISHED);
    }

    if (survey.status === SurveyStatus.CLOSED || survey.status === SurveyStatus.ARCHIVED) {
      throw new ForbiddenException(SURVEY_ERRORS.CLOSED);
    }

    const now = new Date();
    if (survey.startTime && survey.startTime > now) {
      throw new ForbiddenException(SURVEY_ERRORS.NOT_STARTED);
    }

    if (survey.endTime && survey.endTime < now) {
      throw new ForbiddenException(SURVEY_ERRORS.EXPIRED);
    }

    const linkDistribution = await this.prisma.surveyDistribution.findFirst({
      where: { surveyId, targetType: DistributionTargetType.LINK, isActive: true },
    });

    if (linkDistribution && linkDistribution.accessCode && accessCode !== linkDistribution.accessCode) {
      throw new ForbiddenException(SURVEY_ERRORS.INVALID_ACCESS_CODE);
    }

    if (!linkDistribution && !respondentId) {
      throw new ForbiddenException(SURVEY_ERRORS.NOT_AUTHORIZED);
    }

    if (respondentId && survey.maxSubmit > 0) {
      const responseCount = await this.prisma.surveyResponse.count({
        where: { surveyId, respondentId, status: ResponseStatus.SUBMITTED },
      });

      if (responseCount >= survey.maxSubmit) {
        throw new ForbiddenException(SURVEY_ERRORS.MAX_SUBMIT_REACHED);
      }
    }

    return survey;
  }

  async submitResponse(surveyId: number, dto: SubmitResponseDto, respondentId?: number, respondentName?: string, ip?: string): Promise<SurveyResponse> {
    const survey = await this.validateAccess(surveyId, respondentId, dto.accessCode);

    await this.validateAnswers(survey, dto.answers);

    const isAnonymous = survey.isAnonymous;

    return this.prisma.surveyResponse.create({
      data: {
        surveyId,
        respondentId: isAnonymous ? null : respondentId,
        respondentName: isAnonymous ? null : respondentName,
        respondentIp: ip,
        submitTime: new Date(),
        durationSeconds: dto.durationSeconds,
        status: ResponseStatus.SUBMITTED,
        answers: {
          create: dto.answers.map((answer) => ({
            questionId: answer.questionId,
            answerValue: answer.answerValue,
            answerJson: answer.answerJson ? JSON.stringify(answer.answerJson) : null,
          })),
        },
      },
      include: { answers: true },
    });
  }

  async saveResponse(surveyId: number, dto: SaveResponseDto, respondentId: number): Promise<SurveyResponse> {
    const survey = await this.findById(surveyId);

    if (!survey.allowSave) {
      throw new ForbiddenException('该问卷不允许暂存');
    }

    let response = await this.prisma.surveyResponse.findFirst({
      where: { surveyId, respondentId, status: ResponseStatus.DRAFT },
    });

    if (response) {
      await this.prisma.surveyAnswer.deleteMany({ where: { responseId: response.id } });

      return this.prisma.surveyResponse.update({
        where: { id: response.id },
        data: {
          durationSeconds: dto.durationSeconds,
          answers: {
            create: dto.answers.map((answer) => ({
              questionId: answer.questionId,
              answerValue: answer.answerValue,
              answerJson: answer.answerJson ? JSON.stringify(answer.answerJson) : null,
            })),
          },
        },
        include: { answers: true },
      });
    }

    return this.prisma.surveyResponse.create({
      data: {
        surveyId,
        respondentId,
        status: ResponseStatus.DRAFT,
        durationSeconds: dto.durationSeconds,
        answers: {
          create: dto.answers.map((answer) => ({
            questionId: answer.questionId,
            answerValue: answer.answerValue,
            answerJson: answer.answerJson ? JSON.stringify(answer.answerJson) : null,
          })),
        },
      },
      include: { answers: true },
    });
  }

  async getSavedResponse(surveyId: number, respondentId: number): Promise<SurveyResponse | null> {
    return this.prisma.surveyResponse.findFirst({
      where: { surveyId, respondentId, status: ResponseStatus.DRAFT },
      include: { answers: true },
    });
  }

  async getResponses(surveyId: number): Promise<SurveyResponse[]> {
    await this.findById(surveyId);

    return this.prisma.surveyResponse.findMany({
      where: { surveyId, status: ResponseStatus.SUBMITTED },
      orderBy: { submitTime: 'desc' },
      include: { answers: true },
    });
  }

  async getResponseById(responseId: number): Promise<SurveyResponse> {
    const response = await this.prisma.surveyResponse.findUnique({
      where: { id: responseId },
      include: { answers: true, survey: true },
    });

    if (!response) {
      throw new NotFoundException('答卷不存在');
    }

    return response;
  }

  async statisticsOverview(surveyId: number) {
    await this.findById(surveyId);

    const [totalCollected, distributions, avgDuration, invalidCount] = await Promise.all([
      this.prisma.surveyResponse.count({ where: { surveyId, status: ResponseStatus.SUBMITTED } }),
      this.prisma.surveyDistribution.findMany({ where: { surveyId, isActive: true } }),
      this.prisma.surveyResponse.aggregate({
        where: { surveyId, status: ResponseStatus.SUBMITTED },
        _avg: { durationSeconds: true },
      }).then((r) => r._avg.durationSeconds || 0),
      this.countInvalidResponses(surveyId),
    ]);

    let totalDistributedUsers = 0;
    for (const dist of distributions) {
      if (dist.targetType === DistributionTargetType.USER && dist.targetId) {
        totalDistributedUsers += dist.targetId.split(',').length;
      } else if (dist.targetType === DistributionTargetType.LINK) {
        totalDistributedUsers += 100;
      } else {
        totalDistributedUsers += 500;
      }
    }

    const responseRate = totalDistributedUsers > 0 ? ((totalCollected / totalDistributedUsers) * 100).toFixed(2) : '0.00';

    return {
      totalDistributed: totalDistributedUsers,
      totalCollected,
      responseRate: parseFloat(responseRate),
      avgDurationSeconds: Math.round(avgDuration),
      validCount: totalCollected - invalidCount,
      invalidCount,
    };
  }

  async questionStatistics(surveyId: number, questionId: number) {
    await this.findById(surveyId);

    const question = await this.prisma.surveyQuestion.findUnique({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException(SURVEY_ERRORS.QUESTION_NOT_FOUND);
    }

    const answers = await this.prisma.surveyAnswer.findMany({
      where: { questionId },
      include: { response: true },
    });

    const validAnswers = answers.filter((a) => a.response.status === ResponseStatus.SUBMITTED);
    const totalAnswers = validAnswers.length;

    const result = {
      questionId: question.id,
      questionType: question.questionType,
      title: question.title,
      totalAnswers,
    };

    if (question.questionType === QuestionType.RADIO || question.questionType === QuestionType.CHECKBOX) {
      const options = question.options ? JSON.parse(question.options) : [];
      const optionCounts: Record<string, number> = {};

      validAnswers.forEach((answer) => {
        const answerJson = answer.answerJson ? JSON.parse(answer.answerJson) : [];
        if (Array.isArray(answerJson)) {
          answerJson.forEach((opt) => {
            optionCounts[opt] = (optionCounts[opt] || 0) + 1;
          });
        } else if (answer.answerValue) {
          optionCounts[answer.answerValue] = (optionCounts[answer.answerValue] || 0) + 1;
        }
      });

      result['options'] = options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        count: optionCounts[opt.value] || 0,
        percentage: totalAnswers > 0 ? ((optionCounts[opt.value] || 0) / totalAnswers) * 100 : 0,
      }));
    } else if (question.questionType === QuestionType.RATING) {
      const ratings: number[] = [];
      const distribution: Record<string, number> = {};

      validAnswers.forEach((answer) => {
        if (answer.answerValue) {
          const rating = parseInt(answer.answerValue, 10);
          ratings.push(rating);
          distribution[rating] = (distribution[rating] || 0) + 1;
        }
      });

      const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      result['ratingStats'] = { average: parseFloat(average.toFixed(2)), distribution };
    } else if (question.questionType === QuestionType.TEXT || question.questionType === QuestionType.TEXTAREA) {
      result['textAnswers'] = validAnswers.map((a) => a.answerValue || '');
    }

    return result;
  }

  async trendStatistics(surveyId: number, days: number = 7) {
    await this.findById(surveyId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const responses = await this.prisma.surveyResponse.findMany({
      where: {
        surveyId,
        status: ResponseStatus.SUBMITTED,
        submitTime: { gte: startDate },
      },
      select: { submitTime: true },
    });

    const trend: Record<string, number> = {};
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trend[dateStr] = 0;
    }

    responses.forEach((r) => {
      const dateStr = r.submitTime.toISOString().split('T')[0];
      if (trend[dateStr] !== undefined) {
        trend[dateStr]++;
      }
    });

    return Object.entries(trend).map(([date, count]) => ({ date, count }));
  }

  async exportToExcel(surveyId: number): Promise<string> {
    await this.findById(surveyId);

    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: { orderBy: { sortOrder: 'asc' } }, responses: { include: { answers: true } } },
    });

    if (!survey) {
      throw new NotFoundException(SURVEY_ERRORS.NOT_FOUND);
    }

    const headers = ['提交时间', '填写人', '填写耗时(秒)', ...survey.questions.map((q) => q.title)];
    const rows = survey.responses.map((response) => {
      const row = [
        response.submitTime.toISOString(),
        response.respondentName || '匿名',
        response.durationSeconds || 0,
      ];

      survey.questions.forEach((question) => {
        const answer = response.answers.find((a) => a.questionId === question.id);
        if (answer) {
          if (answer.answerJson) {
            row.push(JSON.parse(answer.answerJson).join(', '));
          } else {
            row.push(answer.answerValue || '');
          }
        } else {
          row.push('');
        }
      });

      return row;
    });

    let csv = headers.join('\t') + '\n';
    rows.forEach((row) => {
      csv += row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join('\t') + '\n';
    });

    return csv;
  }

  private async validateAnswers(survey: SurveyWithQuestions, answers: SurveyAnswerDto[]) {
    const questionIds = survey.questions.map((q) => q.id);
    const requiredQuestions = survey.questions.filter((q) => q.isRequired);

    for (const question of requiredQuestions) {
      const answer = answers.find((a) => a.questionId === question.id);
      if (!answer) {
        throw new ForbiddenException(`问题 "${question.title}" 是必填项`);
      }

      if (!answer.answerValue && !answer.answerJson) {
        throw new ForbiddenException(`问题 "${question.title}" 是必填项`);
      }

      if ((question.questionType === QuestionType.RADIO || question.questionType === QuestionType.CHECKBOX) && answer.answerJson) {
        const options = question.options ? JSON.parse(question.options) : [];
        const selectedOptions = JSON.parse(answer.answerJson);
        const validOptionValues = options.map((o) => o.value);

        for (const selected of selectedOptions) {
          if (!validOptionValues.includes(selected)) {
            throw new ForbiddenException(`问题 "${question.title}" 的选项 "${selected}" 无效`);
          }
        }
      }
    }

    for (const answer of answers) {
      if (!questionIds.includes(answer.questionId)) {
        throw new ForbiddenException(SURVEY_ERRORS.QUESTION_NOT_FOUND);
      }
    }
  }

  private async countInvalidResponses(surveyId: number): Promise<number> {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: true },
    });

    if (!survey) return 0;

    const requiredQuestions = survey.questions.filter((q) => q.isRequired);
    let invalidCount = 0;

    const responses = await this.prisma.surveyResponse.findMany({
      where: { surveyId, status: ResponseStatus.SUBMITTED },
      include: { answers: true },
    });

    for (const response of responses) {
      for (const question of requiredQuestions) {
        const answer = response.answers.find((a) => a.questionId === question.id);
        if (!answer || (!answer.answerValue && !answer.answerJson)) {
          invalidCount++;
          break;
        }
      }
    }

    return invalidCount;
  }
}
