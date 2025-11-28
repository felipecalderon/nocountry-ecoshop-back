import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Certification } from './entities/certification.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CertificationsService {
  constructor(
    @InjectRepository(Certification)
    private readonly certRepository: Repository<Certification>,
  ) {}

  async create(createCertificationDto: CreateCertificationDto) {
    // Validar nombre único
    const exists = await this.certRepository.findOne({
      where: { name: createCertificationDto.name },
    });

    if (exists) {
      throw new BadRequestException(
        'Ya existe una certificación con este nombre.',
      );
    }

    const cert = this.certRepository.create(createCertificationDto);
    return await this.certRepository.save(cert);
  }

  async findAll() {
    return await this.certRepository.find();
  }
}
