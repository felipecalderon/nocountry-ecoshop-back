import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(createAddressDto: CreateAddressDto, user: User) {
    const address = this.addressRepository.create({
      ...createAddressDto,
      user,
    });
    return this.addressRepository.save(address);
  }

  async findAll(user: User) {
    return this.addressRepository.find({
      where: { user: { id: user.id } },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: string, user: User) {
    const address = await this.addressRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!address) throw new NotFoundException('Dirección no encontrada');
    return address;
  }

  async remove(id: string, user: User) {
    const address = await this.findOne(id, user);

    this.addressRepository.softRemove(address);
    return { message: 'Dirección eliminada correctamente' };
  }
}
