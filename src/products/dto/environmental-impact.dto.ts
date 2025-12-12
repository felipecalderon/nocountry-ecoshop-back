import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

import { EcoBadgeLevel } from '../entities/environmental-impact.entity';
import { MaterialProductDto } from './material-product.dto';

export class EnvironmentalImpactDto {
  @ApiProperty({
    description: 'Porcentaje de contenido recicldo',
    example: 75.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  recycledContent: number;

  // @ApiProperty({
  //   description: 'Nivel de la insignia ecologica',
  //   enum: EcoBadgeLevel,
  //   example: EcoBadgeLevel.HIGH,
  // })
  // @IsEnum(EcoBadgeLevel)
  // ecoBadgeLevel: EcoBadgeLevel;

  @ApiProperty({
    description: 'Composicion de materiales del producto (IDs existentes)',
    type: [MaterialProductDto],
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un material' })
  @ValidateNested({ each: true })
  @Type(() => MaterialProductDto)
  materials: MaterialProductDto[];
}
