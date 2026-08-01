import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsArray, MaxLength, Min, IsBoolean } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { MessagePriority, MessageType, ReceiverRole } from './message.constants.js'

/**
 * 创建消息 DTO（内部服务间调用）
 */
export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  type!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  content!: string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  senderId?: number | null

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  receiverId?: number | null

  @IsOptional()
  @IsString()
  receiverRole?: string | null

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  receiverDeptId?: number | null

  @IsOptional()
  @IsString()
  bizType?: string | null

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  bizId?: number | null

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  articleId?: number | null

  @IsOptional()
  @IsString()
  action?: string | null

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  actorId?: number | null

  @IsOptional()
  @IsString()
  priority?: string | null
}

/**
 * 批量创建消息 DTO
 */
export class CreateBatchMessageDto {
  @IsString()
  @IsNotEmpty()
  type!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  content!: string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  senderId?: number | null

  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  receiverIds!: number[]

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  receiverDeptId?: number | null

  @IsOptional()
  @IsString()
  bizType?: string | null

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  bizId?: number | null

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  articleId?: number | null

  @IsOptional()
  @IsString()
  action?: string | null

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  actorId?: number | null

  @IsOptional()
  @IsString()
  priority?: string | null
}

/**
 * 下发普通通知 DTO (POST /api/admin/messages/notice)
 */
export class SendNoticeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  content!: string

  @IsString()
  @IsNotEmpty()
  sendMode!: 'all' | 'role' | 'dept' | 'user'

  @IsOptional()
  @IsString()
  receiverRole?: string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  receiverDeptId?: number

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  receiverIds?: number[]

  @IsOptional()
  @IsString()
  priority?: string
}

/**
 * 查询消息列表 DTO
 */
export class QueryMessageDto {
  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === '1')
  isRead?: boolean

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === '1')
  archived?: boolean

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
 * 标记已读 DTO
 */
export class MarkAllReadDto {
  @IsOptional()
  @IsString()
  type?: string
}
