import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    // Run all queries in parallel
    const [
      memberCounts,
      totalContributions,
      totalExpenses,
      seatCounts,
      recentTransactions,
      activeMembers,
    ] = await Promise.all([
      // Member counts by status
      this.prisma.member.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { deletedAt: null },
      }),

      // Total contributions (CASH_IN + SEAT_PAYMENT)
      this.prisma.$queryRaw<[{ total: Prisma.Decimal | null }]>`
        SELECT SUM(t.amount) as total
        FROM transactions t
        JOIN transaction_types tt ON t.type_id = tt.id
        WHERE tt.name IN ('CASH_IN', 'SEAT_PAYMENT')
          AND t.deleted_at IS NULL
      `,

      // Total expenses
      this.prisma.expense.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
      }),

      // Seat counts by status
      this.prisma.seat.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { deletedAt: null },
      }),

      // Recent 10 transactions
      this.prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          member: { select: { id: true, name: true } },
          type: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),

      // Active member count
      this.prisma.member.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),
    ]);

    // Format member counts
    const memberStats = memberCounts.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase()] = item._count.id;
        acc.total += item._count.id;
        return acc;
      },
      { total: 0, active: 0, inactive: 0, suspended: 0 } as Record<string, number>,
    );

    // Format seat counts
    const seatStats = seatCounts.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase()] = item._count.id;
        acc.total += item._count.id;
        return acc;
      },
      { total: 0, open: 0, active: 0, completed: 0, cancelled: 0 } as Record<string, number>,
    );

    const totalContributionAmount = totalContributions[0]?.total || new Prisma.Decimal(0);
    const totalExpenseAmount = totalExpenses._sum.amount || new Prisma.Decimal(0);

    return {
      members: memberStats,
      finances: {
        totalContributions: totalContributionAmount,
        totalExpenses: totalExpenseAmount,
        netBalance: new Prisma.Decimal(totalContributionAmount.toString()).sub(
          new Prisma.Decimal(totalExpenseAmount.toString()),
        ),
      },
      seats: seatStats,
      recentTransactions,
      activeMembers,
    };
  }
}
