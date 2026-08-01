import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SensitiveWordLevel, SensitiveWordCategory, FilterResultType } from '../sensitive-word.constants';

/**
 * 创建敏感词 DTO
 */
export class CreateSensitiveWordDto {
  @IsString()
  @MaxLength(100)
  word: string;

  @IsEnum(SensitiveWordLevel)
  level: SensitiveWordLevel;

  @IsString()
  @MaxLength(50)
  category: SensitiveWordCategory | string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  replacement?: string;
}

/**
 * 批量导入敏感词 DTO
 */
export class BatchImportSensitiveWordDto {
  @IsArray()
  @Type(() => CreateSensitiveWordDto)
  words: CreateSensitiveWordDto[];
}

/**
 * 查询敏感词列表 DTO
 */
export class QuerySensitiveWordDto {
  @IsOptional()
  @IsEnum(SensitiveWordLevel)
  level?: SensitiveWordLevel;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}

/**
 * 更新敏感词 DTO
 */
export class UpdateSensitiveWordDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  word?: string;

  @IsOptional()
  @IsEnum(SensitiveWordLevel)
  level?: SensitiveWordLevel;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  replacement?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 敏感词匹配结果
 */
export interface MatchedWord {
  word: string;
  level: SensitiveWordLevel;
  category: string;
  replacement: string;
  startIndex: number;
  endIndex: number;
}

/**
 * 过滤结果
 */
export interface FilterResult {
  type: FilterResultType;
  matchedWords: MatchedWord[];
  desensitizedText?: string;
}