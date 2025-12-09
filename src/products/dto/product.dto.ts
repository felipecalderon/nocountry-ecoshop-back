import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
import { Type } from 'class-transformer';
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
      'URL de la imagen (obtenida previamente del endpoint /files/upload)',
    example: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
  })
  @IsUrl({}, { message: 'Debe ser una URL válida' })
  @IsNotEmpty()
  image: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del producto',
    example: 'Camisa fabricada con algodón...',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    description: 'Precio del producto',
    example: 29.99,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
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
    description: 'País de origen',
    example: 'Argentina',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originCountry?: string;

  @ApiProperty({
    description: 'Peso en kilogramos',
    example: 3.2,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.0)
  @Type(() => Number)
  weightKg: number;

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
    description: 'Composición de materiales e impacto',
    example: {
      recycledContent: 0,
      materials: [
        {
          materialCompositionId: '0ac2bb70-caf6-11f0-af05-a2aab49033e9',
          percentage: 100,
        },
      ],
    },
    type: EnvironmentalImpactDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => EnvironmentalImpactDto)
  environmentalImpact: EnvironmentalImpactDto;

  @ApiPropertyOptional({
    description: 'IDs de las certificaciones',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  certificationIds?: string[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
