import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  MaxLength,
  MinLength,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialCompositionDto {
  @ApiProperty({
    description: 'Nombre del material',
    example: 'Algodon organico',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Indica si el material es ecologico',
    example: true,
    default: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  isEcoFriendly: boolean;

  @ApiProperty({
    description: 'Huella de carbono del material', // (kg CO2)
    example: 12.35,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  carbonFootprintPerKg: number;

  @ApiProperty({
    description: 'Uso de agua del material (litros)',
    example: 2500.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  waterUsagePerKg: number;
}
