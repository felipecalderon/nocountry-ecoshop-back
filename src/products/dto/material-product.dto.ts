import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsUUID, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { MaterialCompositionDto } from './material-composition.dto';

export class MaterialProductDto {
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

  @ApiProperty({
    description:
      'ID del MaterialComposition (debe existir previamente en la DB)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID('4', {
    message: 'El ID de la composición de material no es un UUID válido',
  })
  @IsNotEmpty()
  materialCompositionId: string; // lo obtenemos del endpoit de material composition
}
