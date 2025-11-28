import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { CertificationsService } from './certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/files/files.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard'; // Asegúrate de tener este guard
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity'; // Tu enum de roles
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiBody,
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
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva certificación (Solo Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createCertificationDto: CreateCertificationDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|svg)$/ }), // Admitimos SVG para iconos
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const image = await this.filesService.uploadImage(file);
    createCertificationDto.badgeUrl = image.secure_url;

    return this.certificationsService.create(createCertificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las certificaciones disponibles' })
  findAll() {
    return this.certificationsService.findAll();
  }
}
