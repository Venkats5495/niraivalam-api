import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SeatStatus } from '@prisma/client';

export class CreateSeatDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  seatNumber: number;

  @ApiPropertyOptional({ description: 'Assigned member UUID' })
  @IsUUID()
  @IsOptional()
  memberId?: string;

  @ApiProperty({ example: 100000.0, description: 'Total seat amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  totalAmount: number;

  @ApiPropertyOptional({ enum: SeatStatus, default: SeatStatus.OPEN })
  @IsEnum(SeatStatus)
  @IsOptional()
  status?: SeatStatus;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
