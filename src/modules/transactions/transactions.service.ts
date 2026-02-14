import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma, TransactionTypeEnum } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionsRepository } from './transactions.repository';
import { LedgerService } from '../ledger/ledger.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

// Account names for double-entry ledger
const ACCOUNTS = {
  CASH: 'CASH',
  MEMBER_CONTRIBUTION: 'MEMBER_CONTRIBUTION',
  MEMBER_PAYOUT: 'MEMBER_PAYOUT',
  SEAT_FUND: 'SEAT_FUND',
  EXPENSE: 'EXPENSE',
} as const;

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Create a transaction with atomic ledger entries.
   * Uses Prisma interactive transactions for financial integrity.
   */
  async create(dto: CreateTransactionDto) {
    // Validate transaction type exists
    const transactionType = await this.transactionsRepository.getTransactionTypeByName(
      dto.transactionType,
    );
    if (!transactionType) {
      throw new BadRequestException(`Invalid transaction type: ${dto.transactionType}`);
    }

    // Validate member exists
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${dto.memberId} not found`);
    }

    // Execute within a Prisma transaction for atomicity
    return this.prisma.$transaction(async (tx) => {
      // Calculate new running balance for the member
      const currentBalance = await this.transactionsRepository.getMemberRunningBalance(
        dto.memberId,
        tx,
      );

      const amount = new Prisma.Decimal(dto.amount.toString());
      let newBalance: Prisma.Decimal;

      // Determine balance direction based on transaction type
      switch (dto.transactionType) {
        case TransactionTypeEnum.CASH_IN:
        case TransactionTypeEnum.SEAT_PAYMENT:
          newBalance = currentBalance.add(amount);
          break;
        case TransactionTypeEnum.CASH_OUT:
        case TransactionTypeEnum.EXPENSE:
          newBalance = currentBalance.sub(amount);
          break;
        default:
          newBalance = currentBalance;
      }

      // Create the transaction record
      const transaction = await this.transactionsRepository.create(
        {
          memberId: dto.memberId,
          typeId: transactionType.id,
          categoryId: dto.categoryId,
          amount: dto.amount,
          description: dto.description,
          transactionDate: new Date(dto.transactionDate),
          referenceNumber: dto.referenceNumber,
          runningBalance: newBalance,
        },
        tx,
      );

      // Create corresponding double-entry ledger entries
      const ledgerAccounts = this.getLedgerAccounts(dto.transactionType);

      await this.ledgerService.createPairedEntries(
        {
          transactionId: transaction.id,
          debitAccount: ledgerAccounts.debit,
          creditAccount: ledgerAccounts.credit,
          amount,
          description: `${dto.transactionType}: ${dto.description || 'Transaction'}`,
          entryDate: new Date(dto.transactionDate),
        },
        tx,
      );

      this.logger.log(
        `Transaction created: ${transaction.id} | ${dto.transactionType} | ${dto.amount} | Member: ${member.name}`,
      );

      return transaction;
    });
  }

  async findAll(dto: QueryTransactionDto) {
    return this.transactionsRepository.findAll({
      page: dto.page,
      limit: dto.limit,
      memberId: dto.memberId,
      transactionType: dto.transactionType,
      categoryId: dto.categoryId,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  async findById(id: string) {
    const transaction = await this.transactionsRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  /**
   * Map transaction types to debit/credit account pairs.
   * Follows double-entry accounting principles.
   */
  private getLedgerAccounts(type: TransactionTypeEnum): {
    debit: string;
    credit: string;
  } {
    switch (type) {
      case TransactionTypeEnum.CASH_IN:
        // Cash comes in, member contribution goes up
        return { debit: ACCOUNTS.CASH, credit: ACCOUNTS.MEMBER_CONTRIBUTION };
      case TransactionTypeEnum.CASH_OUT:
        // Cash goes out, payout recorded
        return { debit: ACCOUNTS.MEMBER_PAYOUT, credit: ACCOUNTS.CASH };
      case TransactionTypeEnum.SEAT_PAYMENT:
        // Cash comes in, seat fund goes up
        return { debit: ACCOUNTS.CASH, credit: ACCOUNTS.SEAT_FUND };
      case TransactionTypeEnum.EXPENSE:
        // Expense recorded, cash goes out
        return { debit: ACCOUNTS.EXPENSE, credit: ACCOUNTS.CASH };
      default:
        return { debit: ACCOUNTS.CASH, credit: ACCOUNTS.CASH };
    }
  }
}
