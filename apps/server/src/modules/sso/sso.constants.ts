// ==================== SSO用户类型枚举 ====================
export enum SsoUserType {
  STUDENT = 'student',
  TEACHER = 'teacher',
  STAFF = 'staff',
}

// ==================== 绑定来源枚举 ====================
export enum BindSource {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

// ==================== 配置类型枚举 ====================
export enum ConfigType {
  STRING = 'STRING',
  SECRET = 'SECRET',
  URL = 'URL',
  NUMBER = 'NUMBER',
}

// ==================== SSO配置键常量 ====================
export const SSO_CONFIG_KEYS = {
  ENABLED: 'sso.enabled',
  CLIENT_ID: 'sso.client_id',
  CLIENT_SECRET: 'sso.client_secret',
  AUTHORIZE_URL: 'sso.authorize_url',
  TOKEN_URL: 'sso.token_url',
  USERINFO_URL: 'sso.userinfo_url',
  LOGOUT_URL: 'sso.logout_url',
  HEALTH_CHECK_URL: 'sso.health_check_url',
  REDIRECT_URI: 'sso.redirect_uri',
  SCOPE: 'sso.scope',
  HEALTH_CHECK_TIMEOUT: 'sso.health_check_timeout',
  AUTO_BIND_ENABLED: 'sso.auto_bind_enabled',
  LOGOUT_TOKEN_SECRET: 'sso.logout_token_secret',
}

// ==================== SSO默认配置值 ====================
export const DEFAULT_SSO_CONFIG: Record<string, { value: string; type: ConfigType; description: string; isEncrypted: boolean }> = {
  [SSO_CONFIG_KEYS.ENABLED]: { value: 'true', type: ConfigType.STRING, description: 'SSO功能总开关', isEncrypted: false },
  [SSO_CONFIG_KEYS.CLIENT_ID]: { value: 'jwc_website', type: ConfigType.STRING, description: 'OAuth2客户端ID', isEncrypted: false },
  [SSO_CONFIG_KEYS.CLIENT_SECRET]: { value: '', type: ConfigType.SECRET, description: 'OAuth2客户端密钥', isEncrypted: true },
  [SSO_CONFIG_KEYS.AUTHORIZE_URL]: { value: 'https://sso.university.edu.cn/oauth2/authorize', type: ConfigType.URL, description: 'SSO授权页URL', isEncrypted: false },
  [SSO_CONFIG_KEYS.TOKEN_URL]: { value: 'https://sso.university.edu.cn/oauth2/token', type: ConfigType.URL, description: 'SSO令牌端点URL', isEncrypted: false },
  [SSO_CONFIG_KEYS.USERINFO_URL]: { value: 'https://sso.university.edu.cn/oauth2/userinfo', type: ConfigType.URL, description: 'SSO用户信息端点URL', isEncrypted: false },
  [SSO_CONFIG_KEYS.LOGOUT_URL]: { value: 'https://sso.university.edu.cn/oauth2/logout', type: ConfigType.URL, description: 'SSO登出端点URL', isEncrypted: false },
  [SSO_CONFIG_KEYS.HEALTH_CHECK_URL]: { value: 'https://sso.university.edu.cn/health', type: ConfigType.URL, description: 'SSO健康检测URL', isEncrypted: false },
  [SSO_CONFIG_KEYS.REDIRECT_URI]: { value: 'https://jwc.university.edu.cn/api/sso/callback', type: ConfigType.URL, description: '本系统回调地址', isEncrypted: false },
  [SSO_CONFIG_KEYS.SCOPE]: { value: 'openid profile', type: ConfigType.STRING, description: 'OAuth2请求scope', isEncrypted: false },
  [SSO_CONFIG_KEYS.HEALTH_CHECK_TIMEOUT]: { value: '3000', type: ConfigType.NUMBER, description: '健康检测超时时间（毫秒）', isEncrypted: false },
  [SSO_CONFIG_KEYS.AUTO_BIND_ENABLED]: { value: 'true', type: ConfigType.STRING, description: '是否启用自动绑定', isEncrypted: false },
  [SSO_CONFIG_KEYS.LOGOUT_TOKEN_SECRET]: { value: '', type: ConfigType.SECRET, description: '反向登出通知签名校验密钥', isEncrypted: true },
}

// ==================== 业务错误码 ====================
export const SsoErrorCode = {
  SSO_NOT_ENABLED: 30001,
  SSO_HEALTH_CHECK_FAILED: 30002,
  UNION_ID_ALREADY_BOUND: 30003,
  USER_ID_ALREADY_BOUND: 30004,
  USER_NOT_FOUND: 30005,
  PASSWORD_ERROR: 30006,
  BIND_NOT_FOUND: 30007,
  LOGOUT_TOKEN_INVALID: 30008,
  CONFIG_NOT_FOUND: 30009,
  CONFIG_UPDATE_FAILED: 30010,
  CALLBACK_STATE_MISMATCH: 30011,
  CALLBACK_CODE_ERROR: 30012,
  SSO_USER_INFO_ERROR: 30013,
}

// ==================== 角色映射规则 ====================
export const SSO_USER_TYPE_ROLE_MAPPING: Record<string, string[]> = {
  [SsoUserType.STUDENT]: [], // 学生不可分配管理员角色
  [SsoUserType.TEACHER]: ['editor_admin', 'review_admin', 'column_admin'], // 教师可分配R1~R3
  [SsoUserType.STAFF]: ['editor_admin', 'review_admin', 'column_admin', 'system_admin'], // 行政人员可分配全部角色
}

// ==================== 管理员角色列表 ====================
export const ADMIN_ROLES = ['editor_admin', 'review_admin', 'column_admin', 'system_admin']