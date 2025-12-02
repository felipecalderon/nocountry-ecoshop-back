import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  Min,
  IsUrl,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RewardType } from '../entities/reward.entity';

export class CreateRewardDto {
  @ApiProperty({
    description: 'Nombre de la recompensa',
    example: 'Plantar un Árbol Nativo',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada',
    example: 'Ayuda a reforestar la selva misionera con esta donación.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Costo en puntos',
    minimum: 1,
    example: 500,
  })
  @IsInt()
  @Min(1)
  costInPoints: number;

  @ApiPropertyOptional({
    description: 'URL de la imagen ilustrativa',
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Stock inicial (dejar vacío para ilimitado)',
    example: 100,
  })
  @IsInt()
  @IsOptional()
  stock?: number;

  @ApiProperty({
    description: 'Tipo de recompensa',
    enum: RewardType,
    default: RewardType.DONATION,
  })
  @IsEnum(RewardType)
  type: RewardType;

  @ApiPropertyOptional({
    description: 'Si la recompensa está activa inmediatamente',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
