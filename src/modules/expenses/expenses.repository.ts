import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: {
      description: string;
      amount: number;
      categoryId?: string;
      expenseDate: Date;
      approvedById?: string;
      receiptUrl?: string;
      notes?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.expense.create({
      data: {
        description: data.description,
        amount: new Prisma.Decimal(data.amount.toString()),
        categoryId: data.categoryId,
        expenseDate: data.expenseDate,
        approvedById: data.approvedById,
        receiptUrl: data.receiptUrl,
        notes: data.notes,
      },
      include: {
        category: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, categoryId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) (where.expenseDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.expenseDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    return this.prisma.expense.findFirst({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        ledgerEntries: true,
      },
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    const data: Record<string, unknown> = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount.toString());
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.expenseDate !== undefined) data.expenseDate = new Date(dto.expenseDate);
    if (dto.receiptUrl !== undefined) data.receiptUrl = dto.receiptUrl;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.expense.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }

  async getTotalByDateRange(startDate: Date, endDate: Date) {
    const result = await this.prisma.expense.aggregate({
      where: {
        expenseDate: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      _sum: { amount: true },
      _count: { id: true },
    });
    return {
      total: result._sum.amount || 0,
      count: result._count.id,
    };
  }
}
