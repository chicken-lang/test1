import { IsString, IsNotEmpty, MinLength, IsOptional, IsArray, IsNumber, IsEmail } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  username: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string

  @IsString()
  @IsNotEmpty()
  nickname: string

  @IsString()
  @IsNotEmpty()
  role: string

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  bindColumnIds?: number[]

  @IsOptional()
  @IsEmail()
  email?: string
}
