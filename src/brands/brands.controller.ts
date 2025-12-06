import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesService } from 'src/files/files.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBrandDto } from './dto/create-brand.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { BrandStatsDto } from './dto/brand-stats.dto';

@ApiTags('Marcas (Gestión)')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una nueva marca (con logo opcional)' })
  async create(@Body() createBrandDto: CreateBrandDto, @GetUser() user: User) {
    return this.brandsService.create(createBrandDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.BRAND_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver datos de la marca del usuario' })
  async findMyBrand(@GetUser() user: User) {
    return this.brandsService.findOne(user.id);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver órdenes que contienen mis productos' })
  async getMyOrders(@GetUser() user: User) {
    return this.brandsService.findBrandOrders(user);
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado de envío (ej: SHIPPED)' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @GetUser() user: User,
  ) {
    return this.brandsService.updateOrderStatus(
      id,
      updateStatusDto.status,
      user,
    );
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener métricas de negocio de la marca',
    description:
      'Devuelve el total de ingresos, unidades vendidas y órdenes recibidas. Calcula solo sobre órdenes PAGADAS.',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas calculadas exitosamente.',
    type: BrandStatsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'El usuario no tiene una marca asociada.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado (Requiere rol BRAND_ADMIN o ADMIN).',
  })
  async getBrandStats(@GetUser() user: User) {
    return this.brandsService.getBrandStats(user);
  }
}
