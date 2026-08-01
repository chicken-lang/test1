// 信息公开目录管理 - DTO 定义
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import {
  DisclosureCategory,
  DisclosureVisibility,
  DisclosureStatus,
  SLUG_REGEX,
  SLUG_RESERVED_WORDS,
} from '../disclosure-item.constants.js'

export class CreateDisclosureItemDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title!: string

  @IsString()
  @Matches(SLUG_REGEX, {
    message: 'slug 仅允许小写字母/数字/中划线，2-64 字符，须以字母开头',
  })
  slug!: string

  @IsEnum(DisclosureCategory)
  category!: DisclosureCategory

  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalBasis?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  disclosureDeadline?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  disclosureMethod?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  summary?: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string

  @IsOptional()
  @IsInt()
  columnId?: number | null

  @IsOptional()
  @IsEnum(DisclosureVisibility)
  visibility?: DisclosureVisibility

  @IsOptional()
  @IsInt()
  sortOrder?: number
}

export class UpdateDisclosureItemDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title?: string

  @IsOptional()
  @IsString()
  @Matches(SLUG_REGEX)
  slug?: string

  @IsOptional()
  @IsEnum(DisclosureCategory)
  category?: DisclosureCategory

  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalBasis?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  disclosureDeadline?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  disclosureMethod?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  summary?: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string

  @IsOptional()
  @IsInt()
  columnId?: number | null

  @IsOptional()
  @IsEnum(DisclosureVisibility)
  visibility?: DisclosureVisibility

  @IsOptional()
  @IsInt()
  sortOrder?: number
}

export class DisclosureItemListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number = 20

  @IsOptional()
  @IsEnum(DisclosureCategory)
  category?: DisclosureCategory

  @IsOptional()
  @IsEnum(DisclosureVisibility)
  visibility?: DisclosureVisibility

  @IsOptional()
  @IsEnum(DisclosureStatus)
  status?: DisclosureStatus

  @IsOptional()
  @IsString()
  keyword?: string
}

export class BatchSortItem {
  @IsInt()
  id!: number

  @IsInt()
  sortOrder!: number
}

export class BatchSortDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BatchSortItem)
  items!: BatchSortItem[]
}

export class BatchStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids!: number[]

  @IsEnum(DisclosureStatus)
  action!: DisclosureStatus
}
