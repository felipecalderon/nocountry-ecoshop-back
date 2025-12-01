import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MaterialComposition } from './entities/material-composition.entity';
import { Repository } from 'typeorm';
import { CreateMaterialCompositionDto } from './dto/material-composition.dto';
import { UpdateMaterialCompositionDto } from './dto/update-material-composition.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(MaterialComposition)
    private readonly materialRepository: Repository<MaterialComposition>,
  ) {}

  async create(createMaterialDto: CreateMaterialCompositionDto) {
    const existing = await this.materialRepository.findOne({
      where: { name: createMaterialDto.name },
    });

    if (existing) {
      throw new BadRequestException('Ya existe un material con este nombre.');
    }

    const material = this.materialRepository.create(createMaterialDto);
    return await this.materialRepository.save(material);
  }

  async findAll() {
    return await this.materialRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material)
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    return material;
  }

  async update(id: string, updateMaterialDto: UpdateMaterialCompositionDto) {
    const material = await this.findOne(id);

    this.materialRepository.merge(material, updateMaterialDto);

    return await this.materialRepository.save(material);
  }

  async remove(id: string) {
    const material = await this.findOne(id);
    return await this.materialRepository.remove(material);
  }
}
