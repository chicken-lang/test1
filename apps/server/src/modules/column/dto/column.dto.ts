import { IsString, IsInt, IsOptional, IsEnum, Matches, Length, Min, IsArray, IsNotEmpty } from 'class-validator'
import { Type } from 'class-transformer'
import { SLUG_REGEX, RESPONSIBLE_BUSINESS_VALUES } from '../column.constants.js'

// ==================== 创建栏目 ====================
export class CreateColumnDto {
  @IsString()
  @Length(1, 50)
  columnName!: string

  @IsString()
  @Length(2, 64)
  @Matches(SLUG_REGEX, { message: 'columnSlug 仅允许小写字母、数字、中划线,且长度 2-64' })
  columnSlug!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number

  @IsOptional()
  @IsString()
  @IsEnum(RESPONSIBLE_BUSINESS_VALUES)
  responsibleBusiness?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number

  @IsOptional()
  @IsString()
  @Length(0, 200)
  description?: string

  @IsOptional()
  @IsString()
  @Length(0, 500)
  linkUrl?: string
}

// ==================== 更新栏目 ====================
export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  columnName?: string

  @IsOptional()
  @IsString()
  @Length(2, 64)
  @Matches(SLUG_REGEX, { message: 'columnSlug 仅允许小写字母、数字、中划线,且长度 2-64' })
  columnSlug?: string

  @IsOptional()
  @IsString()
  @IsEnum(RESPONSIBLE_BUSINESS_VALUES)
  responsibleBusiness?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number

  @IsOptional()
  @IsString()
  @Length(0, 200)
  description?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number

  @IsOptional()
  @IsString()
  @Length(0, 500)
  linkUrl?: string
}

// ==================== 栏目排序 ====================
export class SortColumnItemDto {
  @Type(() => Number)
  @IsInt()
  columnId!: number

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number
}

export class SortColumnDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  items!: SortColumnItemDto[]
}

// ==================== 映射查询 ====================
export class SlugToIdDto {
  @IsString()
  @Length(2, 64)
  slug!: string
}

export class IdToSlugDto {
  @Type(() => Number)
  @IsInt()
  columnId!: number
}

export type MappingType = 'SLUG_TO_ID' | 'ID_TO_SLUG'

export class BatchMappingDto {
  @IsString()
  type!: MappingType

  @IsArray()
  @IsNotEmpty({ each: true })
  values!: string[] | number[]
}

// ==================== 批量 ID 查询 ====================
export class BatchIdQueryDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids!: number[]
}
