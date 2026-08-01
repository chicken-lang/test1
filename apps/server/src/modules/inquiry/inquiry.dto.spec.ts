import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import {
  SubmitInquiryDto,
  ReplyInquiryDto,
  AssignInquiryDto,
  RoutingConfigDto,
  QueryInquiryDto,
  QueryPublicInquiryDto,
  ExportInquiryDto,
} from './dto/inquiry.dto.js'
import { BusinessTag, SubmitterType, InquiryStatus, InquiryTimeoutConfig } from './inquiry.constants.js'

// ==================== 测试辅助 ====================

async function validateDto<T extends object>(DtoClass: new () => T, data: any): Promise<ValidationError[]> {
  const instance = plainToInstance(DtoClass, data)
  const errors = await validate(instance, { skipMissingProperties: false })
  return errors
}

function getFieldErrors(errors: ValidationError[], field: string): ValidationError | undefined {
  return errors.find(e => e.property === field)
}

// ==================== SubmitInquiryDto 测试 ====================

describe('SubmitInquiryDto', () => {
  const validData = {
    title: '关于期末考试缓考申请流程咨询',
    content: '您好，我因生病无法参加下周一的期末考试，想了解缓考申请的具体流程和所需材料。',
    businessTag: BusinessTag.EXAM,
    submitterName: '张三',
    submitterContact: 'zhangsan@stu.edu.cn',
    submitterType: SubmitterType.STUDENT,
  }

  it('应通过有效数据校验', async () => {
    const errors = await validateDto(SubmitInquiryDto, validData)
    expect(errors.length).toBe(0)
  })

  // ---- 标题校验 ----

  it('标题为空时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, title: '' })
    expect(getFieldErrors(errors, 'title')).toBeDefined()
  })

  it('标题少于5个字符时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, title: '测试' })
    expect(getFieldErrors(errors, 'title')).toBeDefined()
  })

  it('标题超过200个字符时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, title: 'A'.repeat(201) })
    expect(getFieldErrors(errors, 'title')).toBeDefined()
  })

  // ---- 内容校验 ----

  it('内容为空时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, content: '' })
    expect(getFieldErrors(errors, 'content')).toBeDefined()
  })

  it('内容少于10个字符时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, content: '太短了' })
    expect(getFieldErrors(errors, 'content')).toBeDefined()
  })

  it('内容超过2000个字符时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, content: 'A'.repeat(2001) })
    expect(getFieldErrors(errors, 'content')).toBeDefined()
  })

  // ---- 业务标签校验 ----

  it('业务标签为无效值时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, businessTag: 'invalid_tag' })
    expect(getFieldErrors(errors, 'businessTag')).toBeDefined()
  })

  it('应接受所有6个有效业务标签', async () => {
    const validTags = Object.values(BusinessTag)
    for (const tag of validTags) {
      const errors = await validateDto(SubmitInquiryDto, { ...validData, businessTag: tag })
      expect(errors.length).toBe(0)
    }
  })

  it('业务标签为空时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, businessTag: '' })
    expect(getFieldErrors(errors, 'businessTag')).toBeDefined()
  })

  // ---- 提交人姓名校验 ----

  it('姓名少于2个字符时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, submitterName: '张' })
    expect(getFieldErrors(errors, 'submitterName')).toBeDefined()
  })

  it('姓名超过50个字符时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, submitterName: '张'.repeat(51) })
    expect(getFieldErrors(errors, 'submitterName')).toBeDefined()
  })

  // ---- 提交人类型校验 ----

  it('提交人类型为无效值时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, submitterType: 'invalid' })
    expect(getFieldErrors(errors, 'submitterType')).toBeDefined()
  })

  it('应接受所有3种有效提交人类型', async () => {
    const validTypes = Object.values(SubmitterType)
    for (const type of validTypes) {
      const errors = await validateDto(SubmitInquiryDto, { ...validData, submitterType: type })
      expect(errors.length).toBe(0)
    }
  })

  // ---- 联系方式校验 ----

  it('联系方式超过100个字符时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, { ...validData, submitterContact: 'A'.repeat(101) })
    expect(getFieldErrors(errors, 'submitterContact')).toBeDefined()
  })

  // ---- 必填字段校验 ----

  it('缺少必填字段时应校验失败', async () => {
    const errors = await validateDto(SubmitInquiryDto, {})
    expect(errors.length).toBeGreaterThanOrEqual(6)
  })
})

// ==================== ReplyInquiryDto 测试 ====================

describe('ReplyInquiryDto', () => {
  const validData = {
    replyContent: '张三同学您好，缓考申请流程如下：1. 登录教务系统提交缓考申请；2. 上传医院诊断证明。',
    isPublic: true,
  }

  it('应通过有效数据校验', async () => {
    const errors = await validateDto(ReplyInquiryDto, validData)
    expect(errors.length).toBe(0)
  })

  it('答复内容为空时应校验失败', async () => {
    const errors = await validateDto(ReplyInquiryDto, { ...validData, replyContent: '' })
    expect(getFieldErrors(errors, 'replyContent')).toBeDefined()
  })

  it('答复内容少于10个字符时应校验失败', async () => {
    const errors = await validateDto(ReplyInquiryDto, { ...validData, replyContent: '太短了' })
    expect(getFieldErrors(errors, 'replyContent')).toBeDefined()
  })

  it('答复内容超过5000个字符时应校验失败', async () => {
    const errors = await validateDto(ReplyInquiryDto, { ...validData, replyContent: 'A'.repeat(5001) })
    expect(getFieldErrors(errors, 'replyContent')).toBeDefined()
  })

  it('isPublic 为非布尔值时应校验失败', async () => {
    const errors = await validateDto(ReplyInquiryDto, { ...validData, isPublic: 'yes' as any })
    expect(getFieldErrors(errors, 'isPublic')).toBeDefined()
  })

  it('缺少 isPublic 时应校验失败', async () => {
    const errors = await validateDto(ReplyInquiryDto, { replyContent: '这是答复内容数据数据数据数据数据' })
    expect(getFieldErrors(errors, 'isPublic')).toBeDefined()
  })
})

// ==================== AssignInquiryDto 测试 ====================

describe('AssignInquiryDto', () => {
  it('应通过有效数据校验', async () => {
    const errors = await validateDto(AssignInquiryDto, { assigneeId: 100 })
    expect(errors.length).toBe(0)
  })

  it('assigneeId 为空时应校验失败', async () => {
    const errors = await validateDto(AssignInquiryDto, {})
    expect(getFieldErrors(errors, 'assigneeId')).toBeDefined()
  })

  it('assigneeId 为非数字时应校验失败', async () => {
    const errors = await validateDto(AssignInquiryDto, { assigneeId: 'abc' as any })
    expect(getFieldErrors(errors, 'assigneeId')).toBeDefined()
  })
})

// ==================== RoutingConfigDto 测试 ====================

describe('RoutingConfigDto', () => {
  const validData = {
    businessTag: BusinessTag.EXAM,
    assigneeId: 1005,
    timeoutHours: 48,
  }

  it('应通过有效数据校验', async () => {
    const errors = await validateDto(RoutingConfigDto, validData)
    expect(errors.length).toBe(0)
  })

  it('businessTag 为无效值时应校验失败', async () => {
    const errors = await validateDto(RoutingConfigDto, { ...validData, businessTag: 'invalid' })
    expect(getFieldErrors(errors, 'businessTag')).toBeDefined()
  })

  it('businessTag 为空时应校验失败', async () => {
    const errors = await validateDto(RoutingConfigDto, { ...validData, businessTag: '' })
    expect(getFieldErrors(errors, 'businessTag')).toBeDefined()
  })

  it('timeoutHours 小于1时应校验失败', async () => {
    const errors = await validateDto(RoutingConfigDto, { ...validData, timeoutHours: 0 })
    expect(getFieldErrors(errors, 'timeoutHours')).toBeDefined()
  })

  it('assigneeId 为可选字段', async () => {
    const errors = await validateDto(RoutingConfigDto, { businessTag: BusinessTag.EXAM })
    expect(errors.length).toBe(0)
  })
})

// ==================== QueryInquiryDto 测试 ====================

describe('QueryInquiryDto', () => {
  it('空查询应通过校验（全部可选）', async () => {
    const errors = await validateDto(QueryInquiryDto, {})
    expect(errors.length).toBe(0)
  })

  it('status 为无效值时应校验失败', async () => {
    const errors = await validateDto(QueryInquiryDto, { status: 'invalid' })
    expect(getFieldErrors(errors, 'status')).toBeDefined()
  })

  it('应接受所有4种有效状态', async () => {
    const validStatuses = Object.values(InquiryStatus)
    for (const status of validStatuses) {
      const errors = await validateDto(QueryInquiryDto, { status })
      expect(errors.length).toBe(0)
    }
  })

  it('page 小于1时应校验失败', async () => {
    const errors = await validateDto(QueryInquiryDto, { page: 0 })
    expect(getFieldErrors(errors, 'page')).toBeDefined()
  })

  it('pageSize 小于1时应校验失败', async () => {
    const errors = await validateDto(QueryInquiryDto, { pageSize: 0 })
    expect(getFieldErrors(errors, 'pageSize')).toBeDefined()
  })

  it('应接受有效查询参数组合', async () => {
    const errors = await validateDto(QueryInquiryDto, {
      status: InquiryStatus.PROCESSING,
      businessTag: BusinessTag.EXAM,
      keyword: '缓考',
      submitterType: SubmitterType.STUDENT,
      page: 2,
      pageSize: 50,
    })
    expect(errors.length).toBe(0)
  })
})

// ==================== QueryPublicInquiryDto 测试 ====================

describe('QueryPublicInquiryDto', () => {
  it('空查询应通过校验（全部可选）', async () => {
    const errors = await validateDto(QueryPublicInquiryDto, {})
    expect(errors.length).toBe(0)
  })

  it('page 小于1时应校验失败', async () => {
    const errors = await validateDto(QueryPublicInquiryDto, { page: 0 })
    expect(getFieldErrors(errors, 'page')).toBeDefined()
  })

  it('应接受有效查询参数', async () => {
    const errors = await validateDto(QueryPublicInquiryDto, {
      businessTag: BusinessTag.EXAM,
      keyword: '缓考',
      page: 1,
      pageSize: 10,
    })
    expect(errors.length).toBe(0)
  })
})

// ==================== ExportInquiryDto 测试 ====================

describe('ExportInquiryDto', () => {
  it('应通过有效数据校验', async () => {
    const errors = await validateDto(ExportInquiryDto, { format: 'xlsx' })
    expect(errors.length).toBe(0)
  })

  it('format 为无效值时应校验失败', async () => {
    const errors = await validateDto(ExportInquiryDto, { format: 'pdf' })
    expect(getFieldErrors(errors, 'format')).toBeDefined()
  })

  it('format 为空时应校验失败', async () => {
    const errors = await validateDto(ExportInquiryDto, {})
    expect(getFieldErrors(errors, 'format')).toBeDefined()
  })

  it('应接受 csv 格式', async () => {
    const errors = await validateDto(ExportInquiryDto, { format: 'csv' })
    expect(errors.length).toBe(0)
  })

  it('应接受带筛选条件的导出', async () => {
    const errors = await validateDto(ExportInquiryDto, {
      format: 'xlsx',
      businessTag: BusinessTag.EXAM,
      startDate: '2026-07-01',
      endDate: '2026-07-27',
      status: InquiryStatus.REPLIED,
    })
    expect(errors.length).toBe(0)
  })
})

// ==================== 常量值测试 ====================

describe('InquiryConstants', () => {
  it('应定义4种咨询状态', () => {
    expect(Object.keys(InquiryStatus).length).toBe(4)
    expect(InquiryStatus.PENDING).toBe('pending')
    expect(InquiryStatus.PROCESSING).toBe('processing')
    expect(InquiryStatus.REPLIED).toBe('replied')
    expect(InquiryStatus.CLOSED).toBe('closed')
  })

  it('应定义6种业务标签', () => {
    const tags = Object.values(BusinessTag)
    expect(tags.length).toBe(6)
    expect(tags).toContain('academic')
    expect(tags).toContain('exam')
    expect(tags).toContain('training')
    expect(tags).toContain('student')
    expect(tags).toContain('teaching')
    expect(tags).toContain('general')
  })

  it('应定义3种提交人身份', () => {
    const types = Object.values(SubmitterType)
    expect(types.length).toBe(3)
    expect(types).toContain('student')
    expect(types).toContain('teacher')
    expect(types).toContain('visitor')
  })

  it('应定义正确的超时配置', () => {
    expect(InquiryTimeoutConfig.DEFAULT_TIMEOUT_HOURS).toBe(72)
    expect(InquiryTimeoutConfig.WARNING_HOURS).toBe(12)
    expect(InquiryTimeoutConfig.CRON_INTERVAL_MS).toBe(30 * 60 * 1000)
  })
})
