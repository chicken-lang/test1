import { IsString, IsNotEmpty, IsArray, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  role: string

  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  bindColumnIds: number[]
}
