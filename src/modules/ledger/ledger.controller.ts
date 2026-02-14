import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { LedgerService } from './ledger.service';
import { QueryLedgerDto } from './dto/query-ledger.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Ledger')
@Controller('ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Query ledger entries with filters' })
  async findAll(@Query() dto: QueryLedgerDto) {
    return this.ledgerService.findAll(dto);
  }

  @Get('balances')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all account balances' })
  async getBalances() {
    return this.ledgerService.getAccountBalances();
  }
}
