import { IsDateString, IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionTypeEnum } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryTransactionDto {
  @ApiPropertyOptional({ description: 'Filter by member ID' })
  @IsUUID()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({ enum: TransactionTypeEnum })
  @IsEnum(TransactionTypeEnum)
  @IsOptional()
  transactionType?: TransactionTypeEnum;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}
