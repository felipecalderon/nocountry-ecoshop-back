import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
  Matches,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

import { RecyclabilityStatus } from '../entities/product.entity';
import { CreateEnvironmentalImpactDto } from './environmental-impact.dto';
import { CreateMaterialCompositionDto } from '../../material-composition/dto/material-composition.dto';

export class CreateProductDto {
  // @ApiProperty({
  //   description: 'Slug unico del producto',
  //   example: 'camisa-algodon-organico-blanca o alpha-beta-gamma',
  //   pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', // IMPORTANTE: esto es una expresion regular para letras minusculas, numeros y guiones
  // })
  // @IsString()
  // @IsNotEmpty()
  // @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
  //   message: 'El slug debe contener SOLO letras minusculas, numeros y guiones',
  // })
  // slug: string;

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

  // @ApiProperty({
  //   description: 'SKU unico del producto',
  //   example: 'CAM-ORG-BLA-M-001',
  //   minLength: 3,
  //   maxLength: 50,
  // })
  // @IsString()
  // @IsNotEmpty()
  // @MinLength(3)
  // @MaxLength(50)
  // sku: string;

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
    type: CreateEnvironmentalImpactDto, // import de DTO
  })
  @ValidateNested()
  @Type(() => CreateEnvironmentalImpactDto)
  environmentalImpact: CreateEnvironmentalImpactDto;

  @ApiProperty({
    description: 'Composicion de materiales del producto',
    type: [CreateMaterialCompositionDto], // import DTO
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un material' })
  @ValidateNested()
  @Type(() => CreateMaterialCompositionDto)
  materialComposition: CreateMaterialCompositionDto[]; // deberia ser un array de objetos, ya que un producto puede tener varios materiales en diferentes porcentajes

  // @ApiPropertyOptional({
  //   description: 'IDs de las certificaciones del producto',
  //   type: [String],
  //   example: [
  //     '123e4567-e89b-12d3-a456-426614174000',
  //     '223a456b-78c9-0d1e-2f34-56789ghijk02',
  //   ],
  // })
  // @IsOptional()
  // @IsArray()
  // @IsUUID('4', {
  //   each: true,
  //   message: 'Cada certificacion debe ser un UUID valido',
  // })
  // certificationIds?: string[];
}
