export enum SurveyStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum SurveyType {
  GENERAL = 'GENERAL',
  COURSE_EVAL = 'COURSE_EVAL',
  FEEDBACK = 'FEEDBACK',
  CUSTOM = 'CUSTOM',
}

export enum QuestionType {
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  RATING = 'RATING',
  MATRIX = 'MATRIX',
  DATE = 'DATE',
  UPLOAD = 'UPLOAD',
}

export enum DistributionTargetType {
  ALL = 'ALL',
  ROLE = 'ROLE',
  DEPARTMENT = 'DEPARTMENT',
  CLASS = 'CLASS',
  USER = 'USER',
  LINK = 'LINK',
}

export enum ResponseStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

export const SURVEY_ERRORS = {
  NOT_FOUND: '问卷不存在',
  NOT_PUBLISHED: '问卷未发布',
  CLOSED: '问卷已关闭',
  NOT_STARTED: '问卷尚未开始',
  EXPIRED: '问卷已过期',
  MAX_SUBMIT_REACHED: '已达到最大提交次数',
  QUESTION_NOT_FOUND: '题目不存在',
  REQUIRED_FIELD: '必填字段不能为空',
  INVALID_OPTION: '选项无效',
  NOT_AUTHORIZED: '无权访问该问卷',
  INVALID_ACCESS_CODE: '访问口令错误',
}

export const SURVEY_MESSAGES = {
  CREATED: '问卷创建成功',
  UPDATED: '问卷更新成功',
  DELETED: '问卷删除成功',
  PUBLISHED: '问卷发布成功',
  CLOSED: '问卷已关闭',
  RESPONSE_SUBMITTED: '答卷提交成功',
}
