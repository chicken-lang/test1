import { IsString, IsOptional } from 'class-validator'

export class ResubmitDto {
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
  @IsString()
  reviewComment?: string
}