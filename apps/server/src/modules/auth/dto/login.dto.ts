import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsNotEmpty()
  password: string

  /** RSA 密钥版本号，存在时表示使用 RSA 加密传输 */
  @IsString()
  @IsOptional()
  keyVersion?: string
}
