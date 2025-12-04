import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/files/files.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly filesService: FilesService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Obtiene una lista de todos los productos, incluyendo sus relaciones ambientales y de marca.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos recuperada exitosamente.',
    type: Product,
    isArray: true, // un array
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor.',
  })
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get('brand')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Obtiene una lista de los productos de la marca del usuario registrado.',
  })
  async findMyBrand(@GetUser('id') userId: string) {
    return await this.productsService.findByBrand(userId);
  }

  @Get(':term')
  @ApiOperation({
    summary: 'Obtiene los detalles de un producto por su ID (UUID), slug o SKU',
    description:
      'El parámetro `:term` puede ser cualquiera de los tres identificadores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles del producto recuperados exitosamente.',
    type: Product,
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado.',
  })
  findOne(@Param('term') term: string) {
    return this.productsService.findOne(term);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crea un nuevo producto con su impacto ambiental y materiales',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nombre del producto',
          example: 'Camisa de Algodón Orgánico Blanca',
        },
        image: {
          description: 'Imagen principal del producto',
          type: 'string',
          format: 'binary',
        },
        description: {
          type: 'string',
          description: 'Descripcion detallada del producto',
          example:
            'Camisa fabricada con algodón 100% orgánico certificado GOTS, etc...',
        },
        price: {
          type: 'number',
          description: 'Precio del producto en dolares',
          example: 29.99,
        },
        stock: {
          type: 'number',
          description: 'Cantidad disponible en stock',
          example: 150,
        },
        originCountry: {
          type: 'string',
          description: 'País origen del producto.',
          example: 'Argentina',
        },
        weightKg: {
          type: 'number',
          description: 'Peso del producto en kilogramos.',
          example: 3.2,
        },
        recyclabilityStatus: {
          type: 'string',
          description: 'Estado de reciclabildad del producto',
          example: 'FULLY_RECYCLABLE',
        },
        imageAltText: {
          type: 'string',
          description: 'Texto alternativo para la imagen (accesibilidad)',
          example: 'Camisa blanca de algodoón orgánico sobre fondo negro',
        },
        environmentalImpact: {
          type: 'object',
          description:
            'Composicion de materiales del producto y su reciclabilidad.',
          example: {
            recycledContent: 75.5,
            materials: ['Algodón Orgánico, Poliéster Reciclado'],
          },
        },
        certificationIds: {
          type: 'string[]',
          description: 'IDs de las certificados del producto',
          example: ['', ''],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente.',
    type: Product,
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró la Marca o Composición de Material.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Fallo de validación de datos o ID de certificación no válido, o la suma de porcentajes de materiales no es 100.',
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() createProductDto: CreateProductDto,
    @GetUser('id') ownerId: string,
  ) {
    const image = await this.filesService.uploadImage(file);
    createProductDto.image = image.secure_url;
    return await this.productsService.create(createProductDto, ownerId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un producto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de producto inválido o duplicado de slug/sku',
  })
  @ApiResponse({
    status: 403,
    description:
      'No tienes permisos para actualizar este producto (no es de tu marca)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser('id') ownerId: string,
  ) {
    return this.productsService.update(id, updateProductDto, ownerId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Realiza un borrado lógico de un producto por su ID (UUID).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Borrado lógico exitoso. El producto ya no será visible en las búsquedas estándar.',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado.',
  })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.delete(id);
  }
}
