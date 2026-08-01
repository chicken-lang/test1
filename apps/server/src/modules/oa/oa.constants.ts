export enum OaNoticeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum OaMessageType {
  SYSTEM = 'system',
  APPROVAL = 'approval',
  NOTICE = 'notice',
  TODO = 'todo',
}

export const OA_CONFIG_KEYS = {
  ENABLED: 'oa.enabled',
  BASE_URL: 'oa.base_url',
  API_TIMEOUT: 'oa.api_timeout',
  SYNC_ENABLED: 'oa.sync_enabled',
  SYNC_INTERVAL: 'oa.sync_interval',
  DEFAULT_PAGE_SIZE: 'oa.default_page_size',
  MAX_PAGE_SIZE: 'oa.max_page_size',
  AUTH_TOKEN: 'oa.auth_token',
}

export const DEFAULT_OA_CONFIG: Record<string, { value: string; type: string; description: string; isEncrypted: boolean }> = {
  [OA_CONFIG_KEYS.ENABLED]: { value: 'true', type: 'STRING', description: 'OA集成功能总开关', isEncrypted: false },
  [OA_CONFIG_KEYS.BASE_URL]: { value: 'https://oa.university.edu.cn/api', type: 'URL', description: 'OA平台API基础URL', isEncrypted: false },
  [OA_CONFIG_KEYS.API_TIMEOUT]: { value: '5000', type: 'NUMBER', description: 'API请求超时时间（毫秒）', isEncrypted: false },
  [OA_CONFIG_KEYS.SYNC_ENABLED]: { value: 'true', type: 'STRING', description: '是否启用自动同步', isEncrypted: false },
  [OA_CONFIG_KEYS.SYNC_INTERVAL]: { value: '3600000', type: 'NUMBER', description: '自动同步间隔（毫秒）', isEncrypted: false },
  [OA_CONFIG_KEYS.DEFAULT_PAGE_SIZE]: { value: '20', type: 'NUMBER', description: '默认每页条数', isEncrypted: false },
  [OA_CONFIG_KEYS.MAX_PAGE_SIZE]: { value: '100', type: 'NUMBER', description: '最大每页条数', isEncrypted: false },
  [OA_CONFIG_KEYS.AUTH_TOKEN]: { value: '', type: 'SECRET', description: 'OA平台认证Token', isEncrypted: true },
}

export const OA_API_ENDPOINTS = {
  NOTICES: '/notices',
  NOTICE_DETAIL: '/notices/:id',
  MESSAGES: '/messages',
  SYNC: '/sync',
}

export const OaErrorCode = {
  OA_NOT_ENABLED: 41001,
  OA_API_TIMEOUT: 41002,
  OA_API_ERROR: 41003,
  OA_CONFIG_NOT_FOUND: 41004,
  OA_CONFIG_UPDATE_FAILED: 41005,
  OA_SYNC_FAILED: 41006,
  OA_NOTICE_NOT_FOUND: 41007,
  OA_INVALID_PAGE_PARAMS: 41008,
}