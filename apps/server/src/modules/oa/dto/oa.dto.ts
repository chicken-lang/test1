import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsEnum, IsBoolean, IsDateString, Type } from 'class-validator'

export class OaNoticeQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}

export class OaNoticeDetailParamsDto {
  @IsString()
  @IsNotEmpty()
  id!: string
}

export class OaSyncDto {
  @IsOptional()
  @IsString()
  type?: 'notices' | 'messages' | 'all'

  @IsOptional()
  @IsBoolean()
  force?: boolean
}

export class OaConfigDto {
  @IsString()
  @IsNotEmpty()
  configKey!: string

  @IsString()
  @IsNotEmpty()
  configValue!: string
}

export class OaMessageQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean
}