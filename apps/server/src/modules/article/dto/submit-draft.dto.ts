import { IsString, IsOptional } from 'class-validator'

export class SubmitDraftDto {
  @IsOptional()
  @IsString()
  reviewComment?: string
}