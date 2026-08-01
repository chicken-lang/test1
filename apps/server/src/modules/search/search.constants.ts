export enum SearchUserType {
  ANONYMOUS = 'anonymous',
  SSO = 'sso',
  ADMIN = 'admin',
}

export enum ArticleVisibility {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
}

export enum SearchSortBy {
  RELEVANCE = 'relevance',
  TIME = 'time',
  VIEWS = 'views',
}

export const STOP_WORDS = new Set([
  '的', '了', '是', '在', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看',
  '好', '自己', '这', '那', '但', '而', '与', '或', '及', '等', '以', '为',
  'from', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
])

export const SEARCH_CONFIG = {
  MIN_KEYWORD_LENGTH: 1,
  MAX_KEYWORD_LENGTH: 100,
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE_PC: 30,
  DEFAULT_PAGE_SIZE_MOBILE: 5,
  MAX_PAGE_SIZE_MOBILE: 10,
  KEYWORD_MIN_LENGTH_FOR_STAT: 2,
  SEARCH_TIMEOUT_MS: 3000,
  SUGGESTION_MIN_LENGTH: 1,
  SUGGESTION_LIMIT: 10,
  SUMMARY_LENGTH_PC: 300,
  SUMMARY_LENGTH_MOBILE: 100,
}

export type SearchResultItem = {
  articleId: number
  title: string
  summary: string
  highlightField: 'title' | 'content' | 'attachment' | null
  columnId: number
  columnName: string
  columnSlug: string
  publishedAt: string | null
  viewCount: number
  isPreview?: boolean
  attachments: { attachmentId: number; fileName: string }[] | number
}

export type SearchResponse = {
  total: number
  keyword: string
  page: number
  pageSize: number
  list: SearchResultItem[]
  suggestedColumns: { columnId: number; columnName: string; matchCount: number }[]
}

export type SuggestionItem = {
  keyword: string
  matchCount: number
}

export type SuggestResponse = {
  suggestions: SuggestionItem[]
}