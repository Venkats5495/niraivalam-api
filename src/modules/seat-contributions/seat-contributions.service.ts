import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, TransactionTypeEnum } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SeatContributionsRepository } from './seat-contributions.repository';
import { SeatsRepository } from '../seats/seats.repository';
import { LedgerService } from '../ledger/ledger.service';
import { CreateSeatContributionDto } from './dto/create-seat-contribution.dto';
import { QuerySeatContributionDto } from './dto/query-seat-contribution.dto';

@Injectable()
export class SeatContributionsService {
  private readonly logger = new Logger(SeatContributionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly seatContributionsRepository: SeatContributionsRepository,
    private readonly seatsRepository: SeatsRepository,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Record a seat contribution with atomic operations:
   * 1. Create the contribution record
   * 2. Update the seat's paid amount
   * 3. Create a corresponding transaction
   * 4. Create ledger entries
   */
  async create(dto: CreateSeatContributionDto) {
    // Validate seat exists
    const seat = await this.prisma.seat.findFirst({
      where: { id: dto.seatId, deletedAt: null },
    });
    if (!seat) {
      throw new NotFoundException(`Seat with ID ${dto.seatId} not found`);
    }

    // Validate member exists
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${dto.memberId} not found`);
    }

    // Check seat is not already completed
    if (seat.status === 'COMPLETED') {
      throw new BadRequestException('This seat is already completed');
    }

    // Execute atomically
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the contribution record
      const contribution = await this.seatContributionsRepository.create(
        {
          seatId: dto.seatId,
          memberId: dto.memberId,
          amount: dto.amount,
          contributionDate: new Date(dto.contributionDate),
          notes: dto.notes,
        },
        tx,
      );

      // 2. Update seat paid amount and status
      await this.seatsRepository.updatePaidAmount(
        dto.seatId,
        new Prisma.Decimal(dto.amount.toString()),
        tx,
      );

      // 3. Find SEAT_PAYMENT transaction type
      const seatPaymentType = await tx.transactionType.findUnique({
        where: { name: TransactionTypeEnum.SEAT_PAYMENT },
      });

      if (seatPaymentType) {
        // Get member running balance
        const lastTx = await tx.transaction.findFirst({
          where: { memberId: dto.memberId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        });
        const currentBalance = lastTx
          ? new Prisma.Decimal(lastTx.runningBalance.toString())
          : new Prisma.Decimal(0);
        const newBalance = currentBalance.add(new Prisma.Decimal(dto.amount.toString()));

        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            memberId: dto.memberId,
            typeId: seatPaymentType.id,
            amount: new Prisma.Decimal(dto.amount.toString()),
            description: `Seat #${seat.seatNumber} contribution`,
            transactionDate: new Date(dto.contributionDate),
            runningBalance: newBalance,
          },
        });

        // 4. Create ledger entries
        await this.ledgerService.createPairedEntries(
          {
            transactionId: transaction.id,
            debitAccount: 'CASH',
            creditAccount: 'SEAT_FUND',
            amount: dto.amount,
            description: `Seat #${seat.seatNumber} contribution by ${member.name}`,
            entryDate: new Date(dto.contributionDate),
          },
          tx,
        );
      }

      this.logger.log(
        `Seat contribution: Seat #${seat.seatNumber} | ${dto.amount} | Member: ${member.name}`,
      );

      return contribution;
    });
  }

  async findAll(dto: QuerySeatContributionDto) {
    return this.seatContributionsRepository.findAll({
      page: dto.page,
      limit: dto.limit,
      seatId: dto.seatId,
      memberId: dto.memberId,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }
}
