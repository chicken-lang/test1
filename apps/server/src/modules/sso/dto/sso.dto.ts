import { IsString, IsOptional, IsInt, IsEnum, Length, Matches, IsNotEmpty } from 'class-validator'
import { SsoUserType, BindSource, ConfigType, SSO_CONFIG_KEYS } from '../sso.constants.js'

// ==================== SSO回调请求 DTO ====================
export class SsoCallbackDto {
  @IsString()
  @IsNotEmpty()
  code!: string

  @IsString()
  @IsNotEmpty()
  state!: string
}

// ==================== 账号绑定请求 DTO ====================
export class BindAccountDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  unionId!: string

  @IsString()
  @IsNotEmpty()
  @Length(3, 64)
  username!: string

  @IsString()
  @IsNotEmpty()
  encryptedPassword!: string

  @IsString()
  @IsOptional()
  keyId?: string
}

// ==================== 解绑请求 DTO ====================
export class UnbindAccountDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  unionId!: string
}

// ==================== SSO登出通知 DTO ====================
export class SsoLogoutNotifyDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 64)
  unionId!: string

  @IsString()
  @IsNotEmpty()
  logoutToken!: string
}

// ==================== SSO配置更新 DTO ====================
export class UpdateSsoConfigDto {
  @IsString()
  @IsNotEmpty()
  configKey!: string

  @IsString()
  @IsNotEmpty()
  configValue!: string
}

// ==================== SSO配置批量更新 DTO ====================
export class BatchUpdateSsoConfigDto {
  items!: Array<{
    configKey: string
    configValue: string
  }>
}

// ==================== SSO健康检查响应 DTO ====================
export class SsoHealthResponse {
  ssoAvailable!: boolean
  localLoginEnabled!: boolean
  message!: string
}

// ==================== SSO用户信息 DTO ====================
export class SsoUserInfoDto {
  unionId!: string
  name!: string
  email?: string
  phone?: string
  userType!: string
  department?: string
  ssoRoles?: string[]
}

// ==================== SSO绑定结果 DTO ====================
export class SsoBindResult {
  userId!: number
  unionId!: string
  ssoUserType!: string
  ssoName!: string
  bindSource!: string
  bindTime!: Date
}

// ==================== SSO code 换 token DTO ====================
export class SsoExchangeDto {
  @IsString()
  @IsNotEmpty()
  code!: string

  @IsString()
  @IsOptional()
  state?: string

  @IsString()
  @IsOptional()
  role?: string
}

// ==================== SSO登录结果 DTO ====================
export class SsoLoginResult {
  code!: number
  message!: string
  data?: {
    user: {
      userId: number
      name: string
      userType: string
      roleCode?: string
      department?: string
    }
    expiresIn?: number
    tokenType?: string
  }
}