import { IsString, IsOptional, IsInt, IsEnum, Min, Max, Length, Matches, IsArray } from 'class-validator'
import { Type } from 'class-transformer'
import { ALLOWED_SORT_FIELDS, PUBLIC_PAGE_DEFAULTS } from '../public.constants.js'

/**
 * 前台文章列表查询 DTO
 */
export class ArticleListQueryDto {
  @IsOptional()
  @IsString()
  columnSlug?: string

  @IsOptional()
  @IsString()
  responsibleBusiness?: string

  @IsOptional()
  @IsString()
  @Length(1, 200)
  keyword?: string

  @IsOptional()
  @IsEnum(ALLOWED_SORT_FIELDS)
  sortBy?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_PAGE_DEFAULTS.MAX_PAGE_SIZE)
  pageSize?: number
}

/**
 * 文章详情路径 DTO
 */
export class ArticleDetailParamsDto {
  @IsString()
  @Length(2, 128)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/, {
    message: 'articleSlug 仅允许字母、数字、中划线和下划线',
  })
  articleSlug!: string
}