import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSeatContributionDto {
  @ApiProperty({ description: 'Seat UUID' })
  @IsUUID()
  @IsNotEmpty()
  seatId: string;

  @ApiProperty({ description: 'Contributing member UUID' })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ example: 5000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  contributionDate: string;

  @ApiPropertyOptional({ example: 'January contribution to seat 1' })
  @IsString()
  @IsOptional()
  notes?: string;
}
