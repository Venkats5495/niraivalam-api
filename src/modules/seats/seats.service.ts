import { Injectable, NotFoundException } from '@nestjs/common';
import { SeatStatus } from '@prisma/client';
import { SeatsRepository } from './seats.repository';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Injectable()
export class SeatsService {
  constructor(private readonly seatsRepository: SeatsRepository) {}

  async create(dto: CreateSeatDto) {
    return this.seatsRepository.create(dto);
  }

  async findAll(params: { status?: SeatStatus; memberId?: string }) {
    return this.seatsRepository.findAll(params);
  }

  async findById(id: string) {
    const seat = await this.seatsRepository.findById(id);
    if (!seat) {
      throw new NotFoundException(`Seat with ID ${id} not found`);
    }
    return seat;
  }

  async update(id: string, dto: UpdateSeatDto) {
    await this.findById(id);
    return this.seatsRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.seatsRepository.softDelete(id);
  }
}
