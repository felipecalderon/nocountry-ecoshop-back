import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
  @ApiOperation({
    summary: 'Crea un nuevo producto con su impacto ambiental y materiales',
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
      'Fallo de validación de datos o ID de certificación no válido.',
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un producto por ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  update(@Param('id') id: string, @Body() updateProductDto: CreateProductDto) {
    return this.productsService.update(id, updateProductDto);
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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.delete(id);
  }
}
