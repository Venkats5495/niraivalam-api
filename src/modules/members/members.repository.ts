import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberStatus } from '@prisma/client';

@Injectable()
export class MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMemberDto) {
    return this.prisma.member.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        status: dto.status || MemberStatus.ACTIVE,
        notes: dto.notes,
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: MemberStatus;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.member.count({ where }),
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
    return this.prisma.member.findFirst({
      where: { id },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 10,
        },
        seats: true,
      },
    });
  }

  async update(id: string, dto: UpdateMemberDto) {
    return this.prisma.member.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    return this.prisma.member.delete({
      where: { id },
    });
  }

  async countByStatus() {
    const results = await this.prisma.member.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    return results.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
