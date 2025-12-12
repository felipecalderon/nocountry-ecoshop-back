import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CertificationsService } from './certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { FilesService } from 'src/files/files.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Certificaciones')
@Controller('certifications')
export class CertificationsController {
  constructor(
    private readonly certificationsService: CertificationsService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva certificación' })
  @ApiResponse({ status: 201, description: 'Certificación creada.' })
  async create(@Body() createCertificationDto: CreateCertificationDto) {
    return this.certificationsService.create(createCertificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las certificaciones disponibles' })
  findAll() {
    return this.certificationsService.findAll();
  }
}
