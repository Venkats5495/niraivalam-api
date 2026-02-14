import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, SeatStatus } from '@prisma/client';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Injectable()
export class SeatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSeatDto) {
    return this.prisma.seat.create({
      data: {
        seatNumber: dto.seatNumber,
        memberId: dto.memberId,
        totalAmount: new Prisma.Decimal(dto.totalAmount.toString()),
        status: dto.status || SeatStatus.OPEN,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        member: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(params: { status?: SeatStatus; memberId?: string }) {
    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.memberId) where.memberId = params.memberId;

    return this.prisma.seat.findMany({
      where,
      orderBy: { seatNumber: 'asc' },
      include: {
        member: { select: { id: true, name: true } },
        contributions: {
          orderBy: { contributionDate: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.seat.findFirst({
      where: { id },
      include: {
        member: { select: { id: true, name: true } },
        contributions: {
          orderBy: { contributionDate: 'desc' },
          include: {
            member: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateSeatDto) {
    const data: Record<string, unknown> = {};
    if (dto.memberId !== undefined) data.memberId = dto.memberId;
    if (dto.totalAmount !== undefined)
      data.totalAmount = new Prisma.Decimal(dto.totalAmount.toString());
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);

    return this.prisma.seat.update({
      where: { id },
      data,
      include: {
        member: { select: { id: true, name: true } },
      },
    });
  }

  async updatePaidAmount(id: string, amount: Prisma.Decimal, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    const seat = await client.seat.findUnique({ where: { id } });
    if (!seat) return null;

    const newPaidAmount = seat.paidAmount.add(amount);
    const isCompleted = newPaidAmount.gte(seat.totalAmount);

    return client.seat.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: isCompleted ? SeatStatus.COMPLETED : SeatStatus.ACTIVE,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.seat.delete({ where: { id } });
  }
}
