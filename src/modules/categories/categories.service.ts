import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async create(dto: CreateCategoryDto) {
    return this.categoriesRepository.create(dto);
  }

  async findAll(activeOnly = false) {
    return this.categoriesRepository.findAll(activeOnly);
  }

  async findById(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);
    return this.categoriesRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.categoriesRepository.softDelete(id);
  }
}
