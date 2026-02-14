import { Injectable } from '@nestjs/common';
import { Prisma, EntryType } from '@prisma/client';
import { LedgerRepository } from './ledger.repository';
import { QueryLedgerDto } from './dto/query-ledger.dto';

@Injectable()
export class LedgerService {
  constructor(private readonly ledgerRepository: LedgerRepository) {}

  /**
   * Create paired double-entry ledger entries within a transaction.
   * Called by TransactionsService and ExpensesService.
   */
  async createPairedEntries(
    data: {
      transactionId?: string;
      expenseId?: string;
      debitAccount: string;
      creditAccount: string;
      amount: Prisma.Decimal | number;
      description?: string;
      entryDate: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.ledgerRepository.createPairedEntries(data, tx);
  }

  /**
   * Create a single ledger entry (for special cases).
   */
  async createEntry(
    data: {
      transactionId?: string;
      expenseId?: string;
      entryType: EntryType;
      account: string;
      amount: Prisma.Decimal | number;
      description?: string;
      entryDate: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.ledgerRepository.createEntry(data, tx);
  }

  async findAll(dto: QueryLedgerDto) {
    return this.ledgerRepository.findAll({
      page: dto.page,
      limit: dto.limit,
      startDate: dto.startDate,
      endDate: dto.endDate,
      entryType: dto.entryType,
      account: dto.account,
    });
  }

  async getAccountBalances() {
    return this.ledgerRepository.getAccountBalances();
  }
}
