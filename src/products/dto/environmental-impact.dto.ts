import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

import { EcoBadgeLevel } from '../entities/environmental-impact.entity';

export class CreateEnvironmentalImpactDto {
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

  @ApiProperty({
    description: 'Nivel de la insignia ecologica',
    enum: EcoBadgeLevel,
    example: EcoBadgeLevel.HIGH,
  })
  @IsEnum(EcoBadgeLevel)
  ecoBadgeLevel: EcoBadgeLevel;
}

export class UpdateEnvironmentalImpactDto {
  @ApiPropertyOptional({
    description: 'Porcentaje de contenido recicldo',
    example: 75.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  recycledContent?: number;

  @ApiPropertyOptional({
    description: 'Nivel de la insignia ecologica',
    enum: EcoBadgeLevel,
    example: EcoBadgeLevel.HIGH,
  })
  @IsOptional()
  @IsEnum(EcoBadgeLevel)
  ecoBadgeLevel?: EcoBadgeLevel;
}
