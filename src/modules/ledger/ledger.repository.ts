import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntryType, Prisma } from '@prisma/client';

@Injectable()
export class LedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    const client = tx || this.prisma;

    // Get the current running balance for this account
    const lastEntry = await client.ledgerEntry.findFirst({
      where: { account: data.account },
      orderBy: { createdAt: 'desc' },
    });

    const previousBalance = lastEntry
      ? new Prisma.Decimal(lastEntry.runningBalance.toString())
      : new Prisma.Decimal(0);

    const amount = new Prisma.Decimal(data.amount.toString());
    const runningBalance =
      data.entryType === EntryType.DEBIT
        ? previousBalance.add(amount)
        : previousBalance.sub(amount);

    return client.ledgerEntry.create({
      data: {
        transactionId: data.transactionId,
        expenseId: data.expenseId,
        entryType: data.entryType,
        account: data.account,
        amount,
        runningBalance,
        description: data.description,
        entryDate: data.entryDate,
      },
    });
  }

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
    const debitEntry = await this.createEntry(
      {
        transactionId: data.transactionId,
        expenseId: data.expenseId,
        entryType: EntryType.DEBIT,
        account: data.debitAccount,
        amount: data.amount,
        description: data.description,
        entryDate: data.entryDate,
      },
      tx,
    );

    const creditEntry = await this.createEntry(
      {
        transactionId: data.transactionId,
        expenseId: data.expenseId,
        entryType: EntryType.CREDIT,
        account: data.creditAccount,
        amount: data.amount,
        description: data.description,
        entryDate: data.entryDate,
      },
      tx,
    );

    return { debitEntry, creditEntry };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    entryType?: EntryType;
    account?: string;
  }) {
    const { page = 1, limit = 50, startDate, endDate, entryType, account } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entryType) where.entryType = entryType;
    if (account) where.account = account;
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) (where.entryDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.entryDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transaction: {
            include: {
              member: { select: { id: true, name: true } },
              type: { select: { name: true } },
            },
          },
          expense: { select: { id: true, description: true } },
        },
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAccountBalances() {
    const accounts = await this.prisma.ledgerEntry.groupBy({
      by: ['account'],
      _sum: {
        amount: true,
      },
    });

    // For each account, get the latest running balance
    const balances = await Promise.all(
      accounts.map(async (acc) => {
        const latest = await this.prisma.ledgerEntry.findFirst({
          where: { account: acc.account },
          orderBy: { createdAt: 'desc' },
        });
        return {
          account: acc.account,
          balance: latest?.runningBalance || 0,
        };
      }),
    );

    return balances;
  }
}
