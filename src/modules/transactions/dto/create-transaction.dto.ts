import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionTypeEnum } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Member UUID' })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ enum: TransactionTypeEnum, example: TransactionTypeEnum.CASH_IN })
  @IsNotEmpty()
  transactionType: TransactionTypeEnum;

  @ApiPropertyOptional({ description: 'Category UUID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 5000.0, description: 'Amount (positive value)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Monthly contribution for January' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  transactionDate: string;

  @ApiPropertyOptional({ example: 'TXN-2024-001' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;
}
