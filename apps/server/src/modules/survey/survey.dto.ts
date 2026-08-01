import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsArray, ValidateNested, IsDateString, Min, Max } from 'class-validator'
import { SurveyType, QuestionType, DistributionTargetType, SurveyStatus } from './survey.constants'

export class SurveyQuestionOptionDto {
  @ApiProperty()
  @IsString()
  label: string

  @ApiProperty()
  @IsString()
  value: string
}

export class CreateSurveyQuestionDto {
  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  questionType: string

  @ApiProperty()
  @IsString()
  title: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ default: 0 })
  @IsInt()
  sortOrder: number = 0

  @ApiProperty({ default: true })
  @IsBoolean()
  isRequired: boolean = true

  @ApiProperty({ type: [SurveyQuestionOptionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  options?: SurveyQuestionOptionDto[]

  @ApiProperty({ default: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  ratingMax?: number = 5

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  matrixRows?: string[]

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  matrixColumns?: string[]

  @ApiProperty({ required: false })
  @IsOptional()
  logicRules?: any

  @ApiProperty({ required: false })
  @IsOptional()
  validationRules?: any
}

export class CreateSurveyDto {
  @ApiProperty()
  @IsString()
  title: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: SurveyType, default: 'GENERAL' })
  @IsEnum(SurveyType)
  surveyType: string = 'GENERAL'

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  templateId?: number

  @ApiProperty({ default: false })
  @IsBoolean()
  isAnonymous: boolean = false

  @ApiProperty({ default: true })
  @IsBoolean()
  allowSave: boolean = true

  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(1)
  maxSubmit: number = 1

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startTime?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endTime?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverImage?: string

  @ApiProperty({ type: [CreateSurveyQuestionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  questions?: CreateSurveyQuestionDto[]
}

export class UpdateSurveyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: SurveyType, required: false })
  @IsOptional()
  @IsEnum(SurveyType)
  surveyType?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowSave?: boolean

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSubmit?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startTime?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endTime?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverImage?: string
}

export class SurveyDistributionDto {
  @ApiProperty({ enum: DistributionTargetType })
  @IsEnum(DistributionTargetType)
  targetType: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accessCode?: string
}

export class PublishSurveyDto {
  @ApiProperty({ type: [SurveyDistributionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  distributions?: SurveyDistributionDto[]

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startTime?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endTime?: string
}

export class SurveyAnswerDto {
  @ApiProperty()
  @IsInt()
  questionId: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  answerValue?: string

  @ApiProperty({ required: false })
  @IsOptional()
  answerJson?: any
}

export class SubmitResponseDto {
  @ApiProperty({ type: [SurveyAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  answers: SurveyAnswerDto[]

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  durationSeconds?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accessCode?: string
}

export class SaveResponseDto {
  @ApiProperty({ type: [SurveyAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  answers: SurveyAnswerDto[]

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  durationSeconds?: number
}

export class SurveyQueryDto {
  @ApiProperty({ enum: SurveyStatus, required: false })
  @IsOptional()
  @IsEnum(SurveyStatus)
  status?: string

  @ApiProperty({ enum: SurveyType, required: false })
  @IsOptional()
  @IsEnum(SurveyType)
  surveyType?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  createdBy?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string
}

export class StatisticsOverviewDto {
  totalDistributed: number
  totalCollected: number
  responseRate: number
  avgDurationSeconds: number
  validCount: number
  invalidCount: number
}

export class QuestionStatisticsDto {
  questionId: number
  questionType: string
  title: string
  totalAnswers: number
  options?: { label: string; value: string; count: number; percentage: number }[]
  ratingStats?: { average: number; distribution: Record<string, number> }
  textAnswers?: string[]
}

export class TrendDataDto {
  date: string
  count: number
}

export class CrossAnalysisDto {
  dimension: string
  categories: { name: string; count: number; percentage: number }[]
}
