import { IsEnum, IsOptional, IsInt } from 'class-validator'
import { Transform } from 'class-transformer'
import { PinLevel } from '../article.constants.js'

export class PinArticleDto {
  @IsEnum(PinLevel)
  pinLevel: string

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  durationHours?: number
}