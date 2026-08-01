import { IsString, IsOptional, IsEnum } from 'class-validator'
import { ArticleStatus } from '../article.constants.js'

export class FirstReviewDto {
  @IsEnum([ArticleStatus.PUBLISHED, ArticleStatus.REVIEW_REJECTED, ArticleStatus.FINAL_PENDING])
  action: string

  @IsOptional()
  @IsString()
  reviewComment?: string
}