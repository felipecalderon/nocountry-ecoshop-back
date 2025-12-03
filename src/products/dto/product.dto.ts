import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

import { RecyclabilityStatus } from '../entities/product.entity';
import { EnvironmentalImpactDto } from './environmental-impact.dto';
import { MaterialProductDto } from './material-product.dto';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Camisa de Algodón Orgánico Blanca',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'URL de la imagen principal del producto',
    example: 'https://example.com/images/camisa-blanca.jpg',
  })
  @IsUrl({}, { message: 'Debe ser una URL valida' })
  @IsNotEmpty()
  image: string;

  @ApiPropertyOptional({
    description: 'Descripcion detallada del producto',
    example:
      'Camisa fabricada con algodón 100% orgánico certificado GOTS, etc...',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    description: 'Precio del producto en dolares', // o pesos o la moneda que sea
    example: 29.99,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Cantidad disponible en stock',
    example: 150,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiPropertyOptional({
    description: 'Pais de origen del producto',
    example: 'Argentina',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originCountry?: string;

  @ApiProperty({
    description: 'Peso del producto en kilogramos',
    example: 3.2,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0, { message: 'El peso no puede ser negativo' })
  @Type(() => Number)
  weightKg: number;

  @ApiProperty({
    description: 'Estado de reciclabildad del producto',
    enum: RecyclabilityStatus,
    example: RecyclabilityStatus.FULLY_RECYCLABLE, // valor del enum de la entity
  })
  @IsEnum(RecyclabilityStatus, {
    message: 'Estado de reciclabilidad invalido',
  })
  recyclabilityStatus: RecyclabilityStatus;

  @ApiPropertyOptional({
    description: 'Texto alternativo para la imagen (accesibilidad)',
    example: 'Camisa blanca de algodoón orgánico sobre fondo negro',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageAltText?: string; // opcional

  @ApiProperty({
    description: 'Impacto ambiental del producto',
    type: EnvironmentalImpactDto,
  })
  @ValidateNested()
  @Type(() => EnvironmentalImpactDto)
  environmentalImpact: EnvironmentalImpactDto;

  @ApiProperty({
    description: 'Composicion de materiales del producto',
    type: [MaterialProductDto], // array de MaterialProductDto
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un material' })
  @ValidateNested({ each: true })
  @Type(() => MaterialProductDto)
  materials: MaterialProductDto[];

  @ApiPropertyOptional({
    description: 'IDs de las certificados del producto',
    type: [String],
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '223a456b-78c9-0d1e-2f34-56789ghijk02',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: 'Cada certificacion debe ser un UUID valido',
  })
  certificationIds?: string[]; // manyToMany
}

//  DTO para la actualización de productos. todos los campos de CreateProductDto pero opcionales.
export class UpdateProductDto extends PartialType(CreateProductDto) {}
