import { IsString, IsInt, IsOptional, MaxLength, IsIn } from 'class-validator'
import { Transform } from 'class-transformer'

const ARTICLE_TYPES = ['normal', 'confidential'] as const
const SECRET_LEVELS = ['normal', 'confidential'] as const

export class CreateDraftDto {
  @IsInt()
  @Transform(({ value }) => Number(value))
  columnId: number

  @IsString()
  @MaxLength(200)
  title: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  summary?: string

  @IsOptional()
  @IsString()
  encryptedContent?: string

  @IsOptional()
  @IsIn(ARTICLE_TYPES as unknown as string[])
  type?: string = 'normal'

  @IsOptional()
  @IsIn(SECRET_LEVELS as unknown as string[])
  secretLevel?: string = 'normal'

  @IsOptional()
  @IsString()
  businessTags?: string

  @IsOptional()
  @IsString()
  roleTags?: string

  @IsOptional()
  @IsString()
  timeTags?: string

  @IsOptional()
  @IsString()
  images?: string

  @IsOptional()
  @IsString()
  attachments?: string

  @IsOptional()
  @IsString()
  expireDate?: string // ISO 8601 日期字符串，即时办理类稿件的过期日期
}

export class UpdateDraftDto extends CreateDraftDto {}
