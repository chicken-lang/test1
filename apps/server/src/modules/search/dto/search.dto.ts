import { IsString, IsOptional, IsInt, IsEnum, Min, Max, Length, IsArray, Matches } from 'class-validator'
import { Type } from 'class-transformer'
import { SearchSortBy } from '../search.constants'

export class SearchDto {
  @IsString()
  @Length(1, 100)
  keyword!: string

  @IsOptional()
  @IsString()
  columnId?: string

  @IsOptional()
  @IsString()
  tagId?: string

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be in YYYY-MM-DD format' })
  startDate?: string

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be in YYYY-MM-DD format' })
  endDate?: string

  @IsOptional()
  @IsString()
  contentType?: string

  @IsOptional()
  @IsEnum(SearchSortBy)
  sortBy?: SearchSortBy

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  pageSize?: number
}

export class SuggestDto {
  @IsString()
  @Length(1, 100)
  keyword!: string
}