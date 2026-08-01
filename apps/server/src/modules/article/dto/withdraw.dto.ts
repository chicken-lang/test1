import { IsString, IsOptional } from 'class-validator'

export class WithdrawDto {
  @IsOptional()
  @IsString()
  reason?: string
}