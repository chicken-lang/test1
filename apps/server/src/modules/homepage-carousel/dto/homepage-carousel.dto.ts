import { IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class CarouselItemDto {
  @IsNumber()
  articleId: number

  @IsNumber()
  sortOrder: number

  @IsOptional()
  @IsNumber()
  coverImageId?: number
}

export class SaveCarouselDto {
  @IsString()
  positionCode: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarouselItemDto)
  items: CarouselItemDto[]
}