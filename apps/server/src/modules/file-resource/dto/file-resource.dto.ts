import { IsString, IsEnum, IsOptional, IsInt, IsBoolean, IsArray, MaxLength, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer'
import { AccessLevel, SecretLevel, FileCategory } from '../file-resource.constants.js'

/**
 * 创建文件资源 DTO (管理员上传文件)
 */
export class CreateFileResourceDto {
  @IsString()
  @MaxLength(200)
  fileName!: string

  @IsString()
  @MaxLength(500)
  storagePath!: string

  @IsInt()
  @Min(0)
  fileSize!: number

  @IsString()
  @MaxLength(20)
  fileFormat!: string

  @IsString()
  @MaxLength(100)
  mimeType!: string

  @IsOptional()
  @IsInt()
  columnId?: number

  @IsOptional()
  @IsInt()
  articleId?: number

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel = AccessLevel.PUBLIC

  @IsOptional()
  @IsEnum(SecretLevel)
  secretLevel?: SecretLevel = SecretLevel.NORMAL

  @IsOptional()
  @IsString()
  @MaxLength(500)
  internalTags?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  riskNote?: string

  @IsOptional()
  @IsBoolean()
  previewEnabled?: boolean = true
}

/**
 * 更新文件资源 DTO
 */
export class UpdateFileResourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fileName?: string

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory

  @IsOptional()
  @IsInt()
  columnId?: number

  @IsOptional()
  @IsString()
  @MaxLength(500)
  internalTags?: string
}

/**
 * 更新文件权限配置 DTO
 */
export class UpdateFilePermissionDto {
  @IsEnum(AccessLevel)
  accessLevel!: AccessLevel

  @IsOptional()
  @IsEnum(SecretLevel)
  secretLevel?: SecretLevel

  @IsOptional()
  @IsBoolean()
  previewEnabled?: boolean
}

/**
 * 查询文件列表 DTO
 */
export class QueryFileResourceDto {
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  page?: number = 1

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  pageSize?: number = 10

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  columnId?: number

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  articleId?: number

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel

  @IsOptional()
  @IsString()
  fileFormat?: string

  @IsOptional()
  @IsString()
  status?: string
}

/**
 * 预览请求 DTO
 */
export class PreviewQueryDto {
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  page?: number = 1

  @IsOptional()
  @IsString()
  mode?: string = 'full'

  @IsOptional()
  @IsString()
  device?: string = 'desktop'
}