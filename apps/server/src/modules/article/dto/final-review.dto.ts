import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator'
import { ArticleStatus } from '../article.constants.js'

export class FinalReviewDto {
  @IsEnum([ArticleStatus.PUBLISHED, ArticleStatus.REVIEW_REJECTED])
  action: string

  @IsOptional()
  @IsString()
  finalReviewComment?: string

  @IsOptional()
  @IsDateString()
  scheduledPublishAt?: string
}