import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole, SeatStatus } from '@prisma/client';
import { SeatsService } from './seats.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Seats')
@Controller('seats')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a new seat' })
  async create(@Body() dto: CreateSeatDto) {
    return this.seatsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'List all seats with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: SeatStatus })
  @ApiQuery({ name: 'memberId', required: false, type: String })
  async findAll(
    @Query('status') status?: SeatStatus,
    @Query('memberId') memberId?: string,
  ) {
    return this.seatsService.findAll({ status, memberId });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get seat by ID with contributions' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.seatsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Update seat details' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSeatDto,
  ) {
    return this.seatsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete a seat' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.seatsService.remove(id);
  }
}
