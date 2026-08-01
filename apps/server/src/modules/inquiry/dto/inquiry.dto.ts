import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  IsIn,
  Matches,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { InquiryStatus, BusinessTag, SubmitterType } from '../inquiry.constants.js'

/**
 * 访客提交咨询 DTO
 * POST /api/v1/inquiries
 */
export class SubmitInquiryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  content!: string

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(BusinessTag))
  businessTag!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  submitterName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  submitterContact!: string

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(SubmitterType))
  submitterType!: string
}

/**
 * 答复咨询 DTO
 * PUT /api/v1/inquiries/:id/reply
 */
export class ReplyInquiryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  replyContent!: string

  @IsBoolean()
  isPublic!: boolean
}

/**
 * 手动指派处理人 DTO
 * POST /api/admin/inquiries/:id/assign
 */
export class AssignInquiryDto {
  @IsInt()
  @Type(() => Number)
  assigneeId!: number
}

/**
 * 分流配置 DTO
 * PUT /api/admin/inquiries/routing-config
 */
export class RoutingConfigDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(BusinessTag))
  businessTag!: string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  assigneeId?: number

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  assigneeDeptId?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  timeoutHours?: number
}

/**
 * 咨询台账查询 DTO
 * GET /api/admin/inquiries
 */
export class QueryInquiryDto {
  @IsOptional()
  @IsIn(Object.values(InquiryStatus))
  status?: string

  @IsOptional()
  @IsString()
  businessTag?: string

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsIn(Object.values(SubmitterType))
  submitterType?: string

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  isTimeout?: boolean

  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @IsString()
  endDate?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 20
}

/**
 * 公开咨询查询 DTO
 * GET /api/v1/inquiries/public
 */
export class QueryPublicInquiryDto {
  @IsOptional()
  @IsString()
  businessTag?: string

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 10
}

/**
 * 导出咨询台账 DTO
 * POST /api/admin/inquiries/export
 */
export class ExportInquiryDto {
  @IsString()
  @IsIn(['xlsx', 'csv'])
  format!: string

  @IsOptional()
  @IsString()
  businessTag?: string

  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @IsString()
  endDate?: string

  @IsOptional()
  @IsString()
  status?: string
}
