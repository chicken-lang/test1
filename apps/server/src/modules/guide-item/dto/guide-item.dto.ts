import { IsString, IsInt, IsOptional, IsEnum, Matches, Length, Min, IsArray, IsBoolean, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { SLUG_REGEX, TARGET_AUDIENCE_VALUES, BUSINESS_TAG_VALUES } from '../guide-item.constants.js'

// ==================== 创建事项 ====================
export interface TargetObjectCategory {
  name: string
  description: string
}

export interface TargetObject {
  categories: TargetObjectCategory[]
}

export interface ProcessStep {
  step: number
  name: string
  description: string
}

export interface RequiredMaterial {
  name: string
  description: string
  required: boolean
}

export class CreateGuideItemDto {
  @IsString()
  @Length(1, 200)
  title!: string

  @IsString()
  @Length(2, 100)
  @Matches(SLUG_REGEX, { message: 'slug 仅允许小写字母、数字、中划线,且长度 2-100' })
  slug!: string

  @IsString()
  @IsEnum(TARGET_AUDIENCE_VALUES)
  targetAudience!: string

  @IsString()
  @IsEnum(BUSINESS_TAG_VALUES)
  businessTag!: string

  @IsString()
  targetObject!: string

  @IsString()
  processSteps!: string

  @IsString()
  requiredMaterials!: string

  @IsString()
  @Length(1, 200)
  timeLimit!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeLimitDays?: number

  @IsString()
  @Length(1, 100)
  contactDept!: string

  @IsOptional()
  @IsString()
  @Length(0, 50)
  contactPhone?: string

  @IsOptional()
  @IsString()
  @Length(0, 200)
  contactAddress?: string

  @IsOptional()
  @IsString()
  @Length(0, 100)
  contactEmail?: string

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  relatedAttachmentIds?: number[]

  @IsOptional()
  @IsString()
  @Length(0, 64)
  hallCode?: string

  @IsOptional()
  @IsString()
  @Length(0, 500)
  hallLink?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contactPersonId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  columnId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number
}

// ==================== 更新事项 ====================
export class UpdateGuideItemDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string

  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Matches(SLUG_REGEX, { message: 'slug 仅允许小写字母、数字、中划线,且长度 2-100' })
  slug?: string

  @IsOptional()
  @IsString()
  @IsEnum(TARGET_AUDIENCE_VALUES)
  targetAudience?: string

  @IsOptional()
  @IsString()
  @IsEnum(BUSINESS_TAG_VALUES)
  businessTag?: string

  @IsOptional()
  @IsString()
  targetObject?: string

  @IsOptional()
  @IsString()
  processSteps?: string

  @IsOptional()
  @IsString()
  requiredMaterials?: string

  @IsOptional()
  @IsString()
  @Length(1, 200)
  timeLimit?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeLimitDays?: number

  @IsOptional()
  @IsString()
  @Length(1, 100)
  contactDept?: string

  @IsOptional()
  @IsString()
  @Length(0, 50)
  contactPhone?: string

  @IsOptional()
  @IsString()
  @Length(0, 200)
  contactAddress?: string

  @IsOptional()
  @IsString()
  @Length(0, 100)
  contactEmail?: string

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  relatedAttachmentIds?: number[]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contactPersonId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  columnId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number
}

// ==================== 网上办事大厅绑定 ====================
export class HallBindingDto {
  @IsOptional()
  @IsString()
  @Length(0, 64)
  hallCode?: string

  @IsOptional()
  @IsString()
  @Length(0, 500)
  hallLink?: string
}

// ==================== 前台列表查询 ====================
export class GuideItemListQueryDto {
  @IsOptional()
  @IsString()
  @IsEnum(TARGET_AUDIENCE_VALUES)
  targetAudience?: string

  @IsOptional()
  @IsString()
  @IsEnum(BUSINESS_TAG_VALUES)
  businessTag?: string

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Min(1, { message: 'pageSize 最小为 1' })
  pageSize?: number = 20
}
