import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create-brand.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto, user: User) {
    const existingBrand = await this.brandRepository.findOne({
      where: { owner: { id: user.id } },
    });

    if (existingBrand) {
      throw new ConflictException(
        'Este usuario ya posee una marca registrada.',
      );
    }

    const slug = createBrandDto.name.toLowerCase().trim().replace(/\s+/g, '-');

    const newBrand = this.brandRepository.create({
      ...createBrandDto,
      slug,
      owner: user,
    });

    return await this.brandRepository.save(newBrand);
  }

  async findAll() {
    return this.brandRepository.find({
      relations: ['owner', 'products'],
    });
  }
}
