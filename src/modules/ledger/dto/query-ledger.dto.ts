import { IsDateString, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntryType } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryLedgerDto {
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: EntryType })
  @IsEnum(EntryType)
  @IsOptional()
  entryType?: EntryType;

  @ApiPropertyOptional({ example: 'CASH' })
  @IsString()
  @IsOptional()
  account?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}
