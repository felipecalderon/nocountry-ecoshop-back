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
  IsUUID,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

import { RecyclabilityStatus } from '../entities/product.entity';
import { EnvironmentalImpactDto } from './environmental-impact.dto';

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
    description:
      'URL de la imagen principal del producto (Se llena automáticamente tras subir archivo)',
    example: 'https://res.cloudinary.com/...',
  })
  @IsOptional()
  @IsString()
  image: string;

  @ApiPropertyOptional({
    description: 'Descripcion detallada del producto',
    example: 'Camisa fabricada con algodón...',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    description: 'Precio del producto en dolares',
    example: 29.99,
    minimum: 0.01,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price: number;

  @ApiProperty({
    description: 'Cantidad disponible en stock',
    example: 150,
    minimum: 0,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
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
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0)
  weightKg: number;

  @ApiProperty({
    description: 'Estado de reciclabildad del producto',
    enum: RecyclabilityStatus,
    example: RecyclabilityStatus.FULLY_RECYCLABLE,
  })
  @IsEnum(RecyclabilityStatus)
  recyclabilityStatus: RecyclabilityStatus;

  @ApiPropertyOptional({
    description: 'Texto alternativo para la imagen',
    example: 'Camisa blanca...',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageAltText?: string;

  @ApiProperty({
    description: 'Composicion de materiales del producto',
    type: EnvironmentalImpactDto,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    }
    return value;
  })
  @IsObject({ message: 'environmentalImpact debe ser un objeto JSON válido' })
  @ValidateNested()
  @Type(() => EnvironmentalImpactDto)
  environmentalImpact: EnvironmentalImpactDto;

  @ApiPropertyOptional({
    description: 'IDs de las certificados del producto',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return value.includes('[') ? JSON.parse(value) : value.split(',');
      } catch (e) {
        return [value];
      }
    }
    return value;
  })
  @IsUUID('4', { each: true })
  certificationIds?: string[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
