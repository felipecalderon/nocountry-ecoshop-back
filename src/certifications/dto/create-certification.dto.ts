import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCertificationDto {
  @ApiProperty({ description: 'Nombre del sello', example: 'Cruelty Free' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'Explicación del impacto',
    example: 'Producto no testeado en animales.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'URL del ícono o badge del sello',
  })
  badgeUrl?: string;
}
