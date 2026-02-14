import { Module } from '@nestjs/common';
import { SeatContributionsController } from './seat-contributions.controller';
import { SeatContributionsService } from './seat-contributions.service';
import { SeatContributionsRepository } from './seat-contributions.repository';
import { SeatsModule } from '../seats/seats.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [SeatsModule, LedgerModule],
  controllers: [SeatContributionsController],
  providers: [SeatContributionsService, SeatContributionsRepository],
  exports: [SeatContributionsService],
})
export class SeatContributionsModule {}
