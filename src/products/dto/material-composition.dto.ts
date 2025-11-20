import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  // IsBoolean,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialCompositionDto {
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
  material: string;

  @ApiProperty({
    description: 'Porcentaje del material en el producto',
    example: 65.75,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentage: number;

  // @ApiProperty({
  //   description: 'Indica si el material es ecologico',
  //   example: true,
  //   default: false,
  // })
  // @IsBoolean()
  // @Type(() => Boolean)
  // isEcoFriendly: boolean;

  // @ApiProperty({
  //   description: 'Huella de carbono del material', // (kg CO2)
  //   example: 12.35,
  //   minimum: 0,
  // })
  // @IsNumber({ maxDecimalPlaces: 2 })
  // @Min(0)
  // @Type(() => Number)
  // carbonFootprint: number;

  // @ApiProperty({
  //   description: 'Uso de agua del material (litros)',
  //   example: 2500.5,
  //   minimum: 0,
  // })
  // @IsNumber({ maxDecimalPlaces: 2 })
  // @Min(0)
  // @Type(() => Number)
  // waterUsage: number;
}

export class UpdateMaterialCompositionDto {
  @ApiPropertyOptional({
    description: 'Nombre del material',
    example: 'Algodon organico',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  material?: string;

  @ApiPropertyOptional({
    description: 'Porcentaje del material en el producto',
    example: 65.75,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentage?: number;

  // @ApiPropertyOptional({
  //   description: 'Indica si el material es ecologico',
  //   example: true,
  // })
  // @IsOptional()
  // @IsBoolean()
  // @Type(() => Boolean)
  // isEcoFriendly?: boolean;

  // @ApiPropertyOptional({
  //   description: 'Huella de carbono del material', // (kg CO2)
  //   example: 12.35,
  //   minimum: 0,
  // })
  // @IsOptional()
  // @IsNumber({ maxDecimalPlaces: 2 })
  // @Min(0)
  // @Type(() => Number)
  // carbonFootprint?: number;

  // @ApiPropertyOptional({
  //   description: 'Uso de agua del material (litros)',
  //   example: 2500.5,
  //   minimum: 0,
  // })
  // @IsOptional()
  // @IsNumber({ maxDecimalPlaces: 2 })
  // @Min(0)
  // @Type(() => Number)
  // waterUsage?: number;
}
