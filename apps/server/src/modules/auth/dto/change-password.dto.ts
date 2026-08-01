import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string

  @IsString()
  @IsNotEmpty()
  newPassword: string

  /** RSA 密钥版本号 */
  @IsString()
  @IsOptional()
  keyVersion?: string
}
