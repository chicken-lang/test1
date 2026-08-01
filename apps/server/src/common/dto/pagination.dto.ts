import { IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 基础分页 DTO
 *
 * 所有需要分页的列表接口继承此类即可自动校验 page / pageSize 参数。
 * 使用 class-transformer 的 @Type 确保查询字符串正确转为数字。
 */
export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10
}
