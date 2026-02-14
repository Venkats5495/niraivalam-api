import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TransactionTypeEnum } from '@prisma/client';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactionTypeByName(name: TransactionTypeEnum) {
    return this.prisma.transactionType.findUnique({ where: { name } });
  }

  async create(
    data: {
      memberId: string;
      typeId: string;
      categoryId?: string;
      amount: number;
      description?: string;
      transactionDate: Date;
      referenceNumber?: string;
      runningBalance: Prisma.Decimal;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.transaction.create({
      data: {
        memberId: data.memberId,
        typeId: data.typeId,
        categoryId: data.categoryId,
        amount: new Prisma.Decimal(data.amount.toString()),
        description: data.description,
        transactionDate: data.transactionDate,
        referenceNumber: data.referenceNumber,
        runningBalance: data.runningBalance,
      },
      include: {
        member: { select: { id: true, name: true } },
        type: { select: { name: true } },
        category: { select: { id: true, name: true } },
      },
    });
  }

  async getMemberRunningBalance(memberId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    const lastTransaction = await client.transaction.findFirst({
      where: { memberId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return lastTransaction
      ? new Prisma.Decimal(lastTransaction.runningBalance.toString())
      : new Prisma.Decimal(0);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    memberId?: string;
    transactionType?: TransactionTypeEnum;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, memberId, transactionType, categoryId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (memberId) where.memberId = memberId;
    if (categoryId) where.categoryId = categoryId;
    if (transactionType) {
      where.type = { name: transactionType };
    }
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) (where.transactionDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.transactionDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: {
          member: { select: { id: true, name: true } },
          type: { select: { name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
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

  async findById(id: string) {
    return this.prisma.transaction.findFirst({
      where: { id },
      include: {
        member: { select: { id: true, name: true } },
        type: { select: { name: true } },
        category: { select: { id: true, name: true } },
        ledgerEntries: true,
      },
    });
  }
}
