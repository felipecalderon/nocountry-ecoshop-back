import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Certification } from './entities/certification.entity';
import { In, Repository } from 'typeorm';

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

  // Busca y valida que todos los IDs de certificados que existan
  async findAllAndValidate(
    certificationIds: string[],
  ): Promise<Certification[]> {
    if (!certificationIds || certificationIds.length === 0) return []; // Puede estar vacio

    const foundCertifications = await this.certRepository.findBy({
      id: In(certificationIds),
    });

    // Validacion
    if (foundCertifications.length !== certificationIds.length) {
      const foundIds = foundCertifications.map((c) => c.id);
      const notFoundIds = certificationIds.filter(
        (id) => !foundIds.includes(id),
      );

      throw new NotFoundException(
        `Los siguientes IDs de Certificación no existen: ${notFoundIds.join(
          ', ',
        )}`,
      );
    }

    return foundCertifications;
  }
}
