import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SeatContributionsService } from './seat-contributions.service';
import { CreateSeatContributionDto } from './dto/create-seat-contribution.dto';
import { QuerySeatContributionDto } from './dto/query-seat-contribution.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Seat Contributions')
@Controller('seat-contributions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SeatContributionsController {
  constructor(private readonly seatContributionsService: SeatContributionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Record a seat contribution' })
  async create(@Body() dto: CreateSeatContributionDto) {
    return this.seatContributionsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'List seat contributions with filters' })
  async findAll(@Query() dto: QuerySeatContributionDto) {
    return this.seatContributionsService.findAll(dto);
  }
}
