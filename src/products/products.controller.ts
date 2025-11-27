import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';
import { Product } from './entities/product.entity';

@ApiTags('products')
@Controller('products')
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(Number(id));
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
    return this.productsService.update(Number(id), updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto por ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  delete(@Param('id') id: string) {
    return this.productsService.delete(Number(id));
  }
}
