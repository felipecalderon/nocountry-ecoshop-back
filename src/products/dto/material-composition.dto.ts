import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';

export class MaterialCompositionDto {
  @ApiProperty({
    description: 'Nombre del material (Debe ser único)',
    example: 'Algodón Orgánico',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Indica si el material es considerado ecológico',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isEcoFriendly?: boolean;

  @ApiProperty({
    description: 'Huella de carbono por Kg de material (kg CO2e)',
    example: 3.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsNotEmpty()
  carbonFootprintPerKg: number;

  @ApiProperty({
    description: 'Uso de agua por Kg de material (litros)',
    example: 2500.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  waterUsagePerKg: number;
}
