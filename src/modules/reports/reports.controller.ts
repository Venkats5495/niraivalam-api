import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('member-statement/:memberId')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Get member financial statement' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getMemberStatement(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getMemberStatement(memberId, startDate, endDate);
  }

  @Get('monthly-collection')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get monthly collection report' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getMonthlyCollection(@Query('year') year?: number) {
    return this.reportsService.getMonthlyCollection(year);
  }

  @Get('expense-summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get expense summary by category' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getExpenseSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getExpenseSummary(startDate, endDate);
  }

  @Get('cash-flow')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cash flow report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getCashFlow(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCashFlow(startDate, endDate);
  }
}
