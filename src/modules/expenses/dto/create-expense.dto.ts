import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Office supplies purchase' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 2500.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Category UUID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  expenseDate: string;

  @ApiPropertyOptional({ description: 'URL to receipt image/document' })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiPropertyOptional({ example: 'Approved by committee vote' })
  @IsString()
  @IsOptional()
  notes?: string;
}
