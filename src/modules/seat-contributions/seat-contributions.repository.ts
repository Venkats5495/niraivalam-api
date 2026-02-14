import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SeatContributionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: {
      seatId: string;
      memberId: string;
      amount: number;
      contributionDate: Date;
      notes?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.seatContribution.create({
      data: {
        seatId: data.seatId,
        memberId: data.memberId,
        amount: new Prisma.Decimal(data.amount.toString()),
        contributionDate: data.contributionDate,
        notes: data.notes,
      },
      include: {
        seat: { select: { id: true, seatNumber: true } },
        member: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    seatId?: string;
    memberId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, seatId, memberId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (seatId) where.seatId = seatId;
    if (memberId) where.memberId = memberId;
    if (startDate || endDate) {
      where.contributionDate = {};
      if (startDate) (where.contributionDate as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.contributionDate as Record<string, unknown>).lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.seatContribution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { contributionDate: 'desc' },
        include: {
          seat: { select: { id: true, seatNumber: true } },
          member: { select: { id: true, name: true } },
        },
      }),
      this.prisma.seatContribution.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
