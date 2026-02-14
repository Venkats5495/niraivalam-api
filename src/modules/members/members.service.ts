import { Injectable, NotFoundException } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { MembersRepository } from './members.repository';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly membersRepository: MembersRepository) {}

  async create(dto: CreateMemberDto) {
    return this.membersRepository.create(dto);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: MemberStatus;
    search?: string;
  }) {
    return this.membersRepository.findAll(params);
  }

  async findById(id: string) {
    const member = await this.membersRepository.findById(id);
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }
    return member;
  }

  async update(id: string, dto: UpdateMemberDto) {
    await this.findById(id);
    return this.membersRepository.update(id, dto);
  }

  async deactivate(id: string) {
    await this.findById(id);
    return this.membersRepository.update(id, { status: MemberStatus.INACTIVE });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.membersRepository.softDelete(id);
  }

  async getStatusCounts() {
    return this.membersRepository.countByStatus();
  }
}
