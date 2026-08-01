import { IsString, IsOptional, IsEmail } from 'class-validator'

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  nickname?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string
}
