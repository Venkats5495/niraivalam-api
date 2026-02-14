import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpensesRepository } from './expenses.repository';
import { LedgerService } from '../ledger/ledger.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { AuthenticatedUser } from '../../common/types';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expensesRepository: ExpensesRepository,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Create an expense with atomic ledger entries.
   */
  async create(dto: CreateExpenseDto, currentUser: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      // Create expense record
      const expense = await this.expensesRepository.create(
        {
          description: dto.description,
          amount: dto.amount,
          categoryId: dto.categoryId,
          expenseDate: new Date(dto.expenseDate),
          approvedById: currentUser.id,
          receiptUrl: dto.receiptUrl,
          notes: dto.notes,
        },
        tx,
      );

      // Create ledger entries (Expense debit, Cash credit)
      await this.ledgerService.createPairedEntries(
        {
          expenseId: expense.id,
          debitAccount: 'EXPENSE',
          creditAccount: 'CASH',
          amount: dto.amount,
          description: `Expense: ${dto.description}`,
          entryDate: new Date(dto.expenseDate),
        },
        tx,
      );

      this.logger.log(`Expense created: ${expense.id} | ${dto.amount} | ${dto.description}`);

      return expense;
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return this.expensesRepository.findAll(params);
  }

  async findById(id: string) {
    const expense = await this.expensesRepository.findById(id);
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findById(id);
    return this.expensesRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.expensesRepository.softDelete(id);
  }
}
