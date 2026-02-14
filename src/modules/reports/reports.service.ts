import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Member Statement: All transactions for a member within a date range.
   */
  async getMemberStatement(
    memberId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    const where: Record<string, unknown> = {
      memberId,
      deletedAt: null,
    };
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) (where.transactionDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.transactionDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'asc' },
      include: {
        type: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    // Compute totals
    const totals = transactions.reduce(
      (acc, tx) => {
        const amount = new Prisma.Decimal(tx.amount.toString());
        const typeName = tx.type.name;
        if (typeName === 'CASH_IN' || typeName === 'SEAT_PAYMENT') {
          acc.totalIn = acc.totalIn.add(amount);
        } else {
          acc.totalOut = acc.totalOut.add(amount);
        }
        return acc;
      },
      { totalIn: new Prisma.Decimal(0), totalOut: new Prisma.Decimal(0) },
    );

    return {
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        status: member.status,
      },
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present',
      },
      transactions,
      summary: {
        totalTransactions: transactions.length,
        totalIn: totals.totalIn,
        totalOut: totals.totalOut,
        netBalance: totals.totalIn.sub(totals.totalOut),
        currentRunningBalance:
          transactions.length > 0
            ? transactions[transactions.length - 1].runningBalance
            : 0,
      },
    };
  }

  /**
   * Monthly Collection Report: Aggregated contributions by month.
   */
  async getMonthlyCollection(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(`${targetYear}-01-01`);
    const endDate = new Date(`${targetYear}-12-31T23:59:59`);

    const results = await this.prisma.$queryRaw<
      Array<{
        month: number;
        total_amount: Prisma.Decimal;
        transaction_count: bigint;
      }>
    >`
      SELECT
        EXTRACT(MONTH FROM t.transaction_date)::int AS month,
        SUM(t.amount) AS total_amount,
        COUNT(t.id) AS transaction_count
      FROM transactions t
      JOIN transaction_types tt ON t.type_id = tt.id
      WHERE tt.name IN ('CASH_IN', 'SEAT_PAYMENT')
        AND t.transaction_date >= ${startDate}
        AND t.transaction_date <= ${endDate}
        AND t.deleted_at IS NULL
      GROUP BY EXTRACT(MONTH FROM t.transaction_date)
      ORDER BY month
    `;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const monthlyData = monthNames.map((name, index) => {
      const found = results.find((r) => r.month === index + 1);
      return {
        month: index + 1,
        monthName: name,
        totalAmount: found?.total_amount || 0,
        transactionCount: found ? Number(found.transaction_count) : 0,
      };
    });

    const grandTotal = results.reduce(
      (sum, r) => sum.add(new Prisma.Decimal(r.total_amount?.toString() || '0')),
      new Prisma.Decimal(0),
    );

    return {
      year: targetYear,
      months: monthlyData,
      grandTotal,
    };
  }

  /**
   * Expense Summary: Expenses grouped by category within a date range.
   */
  async getExpenseSummary(startDate?: string, endDate?: string) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) (where.expenseDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.expenseDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    // Group by category
    const byCategory = expenses.reduce(
      (acc, exp) => {
        const catName = exp.category?.name || 'Uncategorized';
        if (!acc[catName]) {
          acc[catName] = { count: 0, total: new Prisma.Decimal(0), items: [] };
        }
        acc[catName].count++;
        acc[catName].total = acc[catName].total.add(
          new Prisma.Decimal(exp.amount.toString()),
        );
        acc[catName].items.push(exp);
        return acc;
      },
      {} as Record<string, { count: number; total: Prisma.Decimal; items: typeof expenses }>,
    );

    const grandTotal = expenses.reduce(
      (sum, exp) => sum.add(new Prisma.Decimal(exp.amount.toString())),
      new Prisma.Decimal(0),
    );

    return {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present',
      },
      categories: Object.entries(byCategory).map(([name, data]) => ({
        categoryName: name,
        count: data.count,
        total: data.total,
      })),
      totalExpenses: expenses.length,
      grandTotal,
    };
  }

  /**
   * Cash Flow Report: Summary of all cash in vs cash out.
   */
  async getCashFlow(startDate?: string, endDate?: string) {
    const dateFilter: Record<string, unknown> = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    }

    const transactionWhere: Record<string, unknown> = { deletedAt: null };
    if (Object.keys(dateFilter).length > 0) {
      transactionWhere.transactionDate = dateFilter;
    }

    // Get all transactions with types
    const transactions = await this.prisma.transaction.findMany({
      where: transactionWhere,
      include: { type: { select: { name: true } } },
    });

    const cashIn = transactions
      .filter((t) => t.type.name === 'CASH_IN' || t.type.name === 'SEAT_PAYMENT')
      .reduce((sum, t) => sum.add(new Prisma.Decimal(t.amount.toString())), new Prisma.Decimal(0));

    const cashOut = transactions
      .filter((t) => t.type.name === 'CASH_OUT' || t.type.name === 'EXPENSE')
      .reduce((sum, t) => sum.add(new Prisma.Decimal(t.amount.toString())), new Prisma.Decimal(0));

    // Get expense totals
    const expenseWhere: Record<string, unknown> = { deletedAt: null };
    if (Object.keys(dateFilter).length > 0) {
      expenseWhere.expenseDate = dateFilter;
    }

    const expenseTotal = await this.prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
    });

    const totalExpenses = expenseTotal._sum.amount
      ? new Prisma.Decimal(expenseTotal._sum.amount.toString())
      : new Prisma.Decimal(0);

    return {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present',
      },
      cashIn,
      cashOut,
      directExpenses: totalExpenses,
      netCashFlow: cashIn.sub(cashOut),
      totalOutflow: cashOut.add(totalExpenses),
      netPosition: cashIn.sub(cashOut).sub(totalExpenses),
    };
  }
}
